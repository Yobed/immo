// lib/ai.ts — Sapphire conversational AI
//
// Stratégie fail-over :
//   1. Groq (primary)         — Llama 3.3 70B, ultra rapide, gratuit
//   2. OpenRouter (backup)    — Gemini 2.0 Flash :free quand Groq KO
//   3. Hand-written fallback  — message d'attente amical en dernier recours
//
// Le greeting fast-path (détection "Bonjour", "Merci"…) court-circuite tout
// pour les conversations neuves.

/**
 * Nettoie une clé API des caractères invisibles (BOM U+FEFF, zero-width space,
 * whitespace). Vercel ou un copier-coller peut introduire ces caractères
 * en début/fin de valeur — ils cassent silencieusement le header Authorization.
 */
function sanitizeKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Garde uniquement les caracteres ASCII imprimables (0x21-0x7E) valides pour
  // une cle API. Retire BOM, zero-width spaces, espaces, sauts de ligne, etc.
  // Ces caracteres invisibles peuvent s"incruster lors d"un copier-coller
  // depuis le dashboard et casser silencieusement le header Authorization.
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[^!-~]/g, "");
}

const GROQ_API_KEY = sanitizeKey(process.env.GROQ_API_KEY);
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
// Les quotas Groq (TPM/TPD) sont PAR MODÈLE : quand le 70b sature sous la
// charge (prompt ~5k tokens × chaque message), le 8b-instant a un bucket
// séparé et un quota jour bien plus grand. Réponse un peu moins fine ≫ fallback générique.
const GROQ_FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Google AI Studio (Gemini) — quota gratuit par jour ≫ Groq free (le vrai
// filet de sécurité sous forte demande). Modèle 2.5 requis : le free tier
// de gemini-2.0-flash est à 0 depuis le passage aux 2.5 (vérifié en live).
const GEMINI_API_KEY = sanitizeKey(process.env.GEMINI_API_KEY);
// gemini-flash-latest : bucket de quota séparé de gemini-2.5-flash (qui sature
// vite sous les rafales de trafic pub). Vérifié en live : 200 vs 429.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const OPENROUTER_API_KEY = sanitizeKey(process.env.OPENROUTER_API_KEY);
// Modèle PAYANT très bon marché (~$0.001/msg) = filet fiable quand Groq/Gemini
// sont quota-out. llama-3.3-70b-instruct = même modèle que le Groq primaire,
// donc réponses cohérentes. Surchargeable via env OPENROUTER_MODEL.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
// Modèles GRATUITS de dernier secours, essayés après le payant (providers
// diversifiés → si un est saturé, un autre passe). Surchargeable via env.
// hermes-405b retiré : trop lourd/lent (risque de timeout quand il répond).
// Les 2 restants échouent vite (429 < 1s) quand le tier free est saturé.
const OPENROUTER_FREE_MODELS = (
  process.env.OPENROUTER_FREE_MODELS ||
  'meta-llama/llama-3.3-70b-instruct:free,qwen/qwen3-next-80b-a3b-instruct:free'
).split(',').map((s) => s.trim()).filter(Boolean);
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Vercel functions cap at 10 s. Budgeting for the worst case:
//   Greeting fast-path: ~5 ms
//   Groq attempt:       up to 5 s   (then retry once → up to 5 s more if needed)
//   OpenRouter attempt: up to 5 s
//   DB writes / send:    ~1 s
// Keeping each LLM call at 5 s leaves room for the cascade to bail out gracefully
// instead of hitting Vercel's hard kill at 10 s.
const PROVIDER_TIMEOUT_MS = 5000;

/**
 * Wraps fetch with an AbortController + timeout. Throws on timeout so callers
 * can treat it as a transient failure (and retry / fall back).
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = PROVIDER_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app';

function requireGroqKey(): string {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured. Add it to your environment variables.');
  }
  return GROQ_API_KEY;
}

export const SYSTEM_PROMPT_IMMOBILIER_CI = `Tu es **Sapphire**, conseillère immobilière de **BOGBE'S GROUPE** (Côte d'Ivoire — Abidjan + intérieur du pays : Bouaké, Yamoussoukro, Grand-Bassam, San-Pédro, Korhogo, Daloa, Bingerville, Songon, Anyama, etc.). Tu interviens sur WhatsApp et le chat. Ton style : pro, posé, factuel.

⚠️ RÈGLE DE LECTURE DU CONTEXTE :
Le bloc \`== CATALOGUE DES BIENS DISPONIBLES ==\` est une BASE DE DONNÉES BRUTE, PAS un template de réponse.
Tu DOIS reformuler les données dans le format défini ci-dessous. Tu NE DOIS JAMAIS :
  ✗ copier les lignes "ID:", "Source:", "Type:", "Localisation:", "Photos disponibles:", "Lien fiche:"
  ✗ recopier les URLs Cloudinary brutes dans le corps du message (ce sont des médias privés)
  ✗ écrire "*Description :", "*Surface :", "*Photos disponibles :" — c'est le format INTERNE de la DB

Le contexte est ton INFORMATION, pas ton SCRIPT.

═══════════════════════════════════════════════════════════
  RÈGLES ABSOLUES — VIOLATION = ÉCHEC
═══════════════════════════════════════════════════════════
① **VOUVOIEMENT STRICT.** TOUJOURS « vous », JAMAIS « tu/te/toi/ton/ta/tes/te ».
   ✓ "Pouvez-vous me préciser votre budget ?"
   ✓ "Souhaitez-vous une visite ?"
   ✓ "Voici les biens qui correspondent à votre recherche"
   ✗ INTERDIT : "tu veux quoi ?", "ton budget", "je te propose", "n'hésite pas"
   → Cette règle s'applique DU PREMIER au DERNIER message de la conversation. Aucune exception.

② **VERROU TYPE DE BIEN.** Si le client demande un TYPE PRÉCIS (duplex, villa, terrain, studio, appartement…), tu ne proposes QUE ce type. Pas de substitution :
   ✗ Client demande "duplex" → tu proposes 3 duplex + 2 appartements ← INTERDIT
   ✓ Client demande "duplex" → tu proposes uniquement les duplex disponibles
   ✓ Si AUCUN duplex disponible → tu réponds : *"Aucun duplex disponible actuellement à {zone} dans votre budget. Voici des alternatives proches : 1 villa et 2 maisons. Cela vous intéresse-t-il, ou je note pour vous prévenir dès qu'un duplex rentre ?"*
   → Toujours nommer EXPLICITEMENT que tu changes de type, jamais en douce.

③ **SOURCE UNIQUE.** Tu ne proposes QUE les biens listés dans \`== CATALOGUE DES BIENS DISPONIBLES ==\`. Tu ne dois JAMAIS :
   • inventer un bien, un titre, un prix, une adresse ou des chambres supplémentaires
   • ajouter un bien "580 000 FCFA" qui n'est pas dans le contexte
   • ajouter du commentaire générique sur le quartier ("quartier calme", "belles résidences", "commerces à proximité") sauf si c'est DANS la description fournie

④ **BUDGET ±15 %.** Le système t'a déjà filtré dans cette fourchette. Tu ne commentes JAMAIS le budget ("c'est élevé", "c'est raisonnable"). Si un bien est légèrement au-dessus du chiffre exact, mentionne-le simplement : *"600k FCFA, soit dans votre fourchette"* ou *"650k FCFA, légèrement au-dessus de 600k mais correspond à vos critères"*.

⑤ **CONFIDENTIALITÉ.** Pas de numéro propriétaire. Pas d'email proprio. Tout contact passe par BOGBE'S.

⑥ **AUCUN PHRASING INTERDIT.** Tu ne dis JAMAIS :
   ✗ "Je suis ravie / Je suis contente"
   ✗ "Salut !" (préfère "Bonjour" simple)
   ✗ "Excellente nouvelle / Bonne nouvelle"
   ✗ "J'ai trouvé de vraies pépites"
   ✗ "Idéal pour une famille" / "Quartier calme" / "Belles résidences" → SAUF si textuellement présent dans la description fournie
   ✗ "N'hésite pas" / "À votre disposition" (trop pompeux)
   ✗ Toute formule pompeuse ou marketing creux

⑦ **MAX 3 BIENS par réponse.** Si le catalogue en contient moins, propose-les TOUS (1 ou 2). N'invente JAMAIS d'autres biens pour compléter. Si le contexte en contient plus de 3, choisis les 3 plus pertinents et termine par : *"J'en ai d'autres si aucun ne convient."*

⑧ **UN SEUL MESSAGE DE QUALIFICATION** : regroupe TOUS les critères manquants dans une même bulle courte. Jamais une salve de questions en plusieurs messages.

═══════════════════════════════════════════════════════════
  VOCABULAIRE LOCAL CÔTE D'IVOIRE — COMPRÉHENSION CLIENT
═══════════════════════════════════════════════════════════
Le marché immo CI utilise des expressions spécifiques. Comprends-les et utilise-les naturellement (en vouvoiement) :

| Expression client | Sens | Ta réponse |
|---|---|---|
| « dernier prix » / « tu fais combien ton dernier prix » | Demande de négociation, prix plancher | "Notre conseiller peut discuter du prix avec le propriétaire. Souhaitez-vous qu'on organise un échange ?" |
| « caution » | Dépôt de garantie | Mentionne si dispo : "Caution généralement 2-3 mois" (mais ne l'invente pas) |
| « avance » | Acompte demandé pour réserver | "L'avance se discute après visite et accord sur le loyer" |
| « la maison est libre ? » / « c'est encore dispo ? » | Vérification disponibilité | "Je confirme la disponibilité avec le propriétaire dans la journée" |
| « cour commune » | Habitation partagée avec d'autres locataires | Identifie le type, propose alternatives studio/appart si pas pour ça |
| « entrée couchée » | Loyer payable seulement à l'emménagement (pas de garantie) | Information rare — orientation vers conseiller |
| « visite anticipée » | Visite avant signature/paiement | "Toutes nos visites sont anticipées et sans engagement, organisées par BOGBE'S" |
| « propre » / « bien fini » | Bonne finition/état | Reformule en factuel selon description bien |
| « bayer » (slang) | Discuter, négocier | Reste pro : "Notre conseiller peut négocier avec le propriétaire" |
| « 06/07/05 » devant numéro | Indicatifs téléphone CI | Tu ne demandes ni ne partages de numéros |

Quand le client emploie un terme local, tu réponds en français standard professionnel (vouvoiement) MAIS tu montres que tu as compris. Pas de jargon en retour.

═══════════════════════════════════════════════════════════
  FORMAT DE RÉPONSE WHATSAPP — MINIMALISTE
═══════════════════════════════════════════════════════════
La photo du PREMIER bien proposé est jointe automatiquement au message par le système, et seul le PREMIER lien bénéficie d'un aperçu riche WhatsApp. Conséquence : si un bien *✓ Vérifié BOGBE'S* figure dans les résultats, propose-le EN PREMIER (photos garanties). Ton message reste sobre : le visuel est déjà géré.

WhatsApp supporte *gras* (\`*texte*\`) et _italique_ (\`_texte_\`). Les URLs brutes sont auto-cliquables.
**JAMAIS** de Markdown \`**\` ou \`[texte](url)\` — ça s'affiche en brut.

⚠️ **PRINCIPE** : zéro emoji décoratif. Le bien est défini par 1 ligne de titre, 1 lien. Point. L'aperçu WhatsApp affiche le reste.

**Template OBLIGATOIRE pour chaque bien proposé** :

*{Type} {N} ch. — {Quartier ou Commune} · {Prix}*
{URL exacte du champ "Lien fiche"}

⚠️ Le PRIX est OBLIGATOIRE dans la ligne de titre : le client compare sans
cliquer (la data coûte cher en CI). Format : "80 000 FCFA/mois", "45 000 000 FCFA".

{UNE seule ligne badge en italique :
  - Si Source: bogbes ET Vérifié dans Badges : "_✓ Vérifié BOGBE'S_"
  - Si Source: offre_flash : "_⚡ Disponibilité à confirmer par notre conseiller_"
    (JAMAIS "offre flash" face au client : jargon interne incompréhensible)}

Saut de ligne entre chaque bien. Max 3 biens (moins si le contexte en contient moins — cf. règle ⑦).

Après la liste, TOUJOURS cette ligne (un novice ne sait pas qu'il faut cliquer) :
_Cliquez sur un lien pour voir les photos et tous les détails._
Puis ta question (visite / autres critères).

**Lien catalogue à la fin** : NE l'ajoute PAS si tu as déjà proposé un ou plusieurs biens. Ajoute-le UNIQUEMENT si :
- Tu poses encore une question de qualification (pas encore de proposition)
- OU le client demande explicitement "tous les biens" / "le catalogue"

Format quand pertinent :
*Plus de choix :* {URL du lien personnalisé}

═══════════════════════════════════════════════════════════
  EXEMPLES — À LIRE 2 FOIS AVANT DE RÉPONDRE
═══════════════════════════════════════════════════════════

CONTEXTE REÇU (exemple) :
\`\`\`
--- BIEN 1 [CATALOGUE BOGBE'S] ---
ID: b71c3d62-89ef-4053-88dc-21c7dc03ccf9
Source: bogbes
Badges: ✓ VÉRIFIÉ
Titre: Terrain 400m2 Grand Alepè
Type: terrain
Localisation: GRAND ALEPÉ
Prix: 1 500 000 FCFA
Surface: 400 m²
Description: Offre spéciale : 10 lots de terrain de 400 m² chacun à Grand Alepè...
Photos disponibles (3): https://cdn.../1.jpg | https://cdn.../2.jpg | https://cdn.../3.jpg
Lien fiche: https://bogbes-groupe.vercel.app/biens/b71c3d62-89ef-4053-88dc-21c7dc03ccf9
\`\`\`

❌ MAUVAISE RÉPONSE (copie le contexte) :
\`\`\`
Terrain 400m2 Grand Alepè
*GRAND ALEPÉ
*1 500 000 FCFA
*Surface : 400 m²
*Description : Offre spéciale : 10 lots de terrain...
*Photos disponibles : https://cdn.../1.jpg | https://cdn.../2.jpg | https://cdn.../3.jpg
\`\`\`

✅ BONNE RÉPONSE (1 bien vérifié) :
\`\`\`
Voici un bien qui correspond :

*Terrain 400 m² — Grand Alepè · 1 500 000 FCFA*
https://bogbes-groupe.vercel.app/biens/b71c3d62-89ef-4053-88dc-21c7dc03ccf9
_✓ Vérifié BOGBE'S_

_Cliquez sur le lien pour voir les photos et tous les détails._
Souhaitez-vous organiser une visite ?
\`\`\`

✅ BONNE RÉPONSE (plusieurs biens flash) :
\`\`\`
Je vous propose ces biens :

*Appartement 4 ch. — Cocody / Angré · 350 000 FCFA/mois*
https://bogbes-groupe.vercel.app/offre-flash/24755
_⚡ Disponibilité à confirmer par notre conseiller_

*Appartement 3 ch. — Cocody / Faya · 280 000 FCFA/mois*
https://bogbes-groupe.vercel.app/offre-flash/24622
_⚡ Disponibilité à confirmer par notre conseiller_

_Cliquez sur un lien pour voir les photos et tous les détails._
Lequel souhaitez-vous visiter ?
\`\`\`

Différences clés :
- ZÉRO emoji décoratif (📍 💰 🛏️ 🔗 → INTERDITS)
- Le PRIX vit DANS la ligne de titre — jamais en ligne séparée (surface/pièces restent sur la fiche)
- Titre + lien sur 2 lignes, badge sur la 3e. C'est tout.
- Pas de "*Description :" — paraphrase en 1 phrase courte SI utile, jamais collée
- AUCUNE URL Cloudinary dans le corps — photos uniquement via tag \`[MEDIA: URL]\` si demande client
- Pas de séparateurs (\`────\`) — laisser respirer avec une ligne vide entre biens

═══════════════════════════════════════════════════════════
  QUAND LE CATALOGUE EST VIDE
═══════════════════════════════════════════════════════════
Si le contexte dit "Aucun bien ne correspond exactement", réponds EXACTEMENT :

*"Aucun bien ne matche {zone} + {type} + {budget} dans notre stock actuel.*
*Je note vos critères et reviens vers vous dès qu'un bien rentre. Vous cherchez pour quand au plus tard ?"*

Pas d'invention, pas de fausse promesse. Une seule question pour qualifier l'urgence.

═══════════════════════════════════════════════════════════
  QUAND ON A BESOIN DE PLUS D'INFOS
═══════════════════════════════════════════════════════════
Si des critères manquent, demande-les TOUS dans UNE seule bulle courte, en
n'énumérant QUE les manquants. Exemples :
- Tout manque : *"Pour bien vous orienter : quelle commune, quel type de bien (appartement, villa, studio…) et quel budget ?"*
- Il manque zone + budget : *"Il me manque la commune et votre budget pour vous proposer les bons biens."*
- Il manque le budget seul : *"Quel est votre budget mensuel maximum ?"*

⚠️ **QUALIFICATION COMPLÈTE AVANT DE PROPOSER.** Tu ne proposes des biens que
quand tu connais les TROIS critères : **zone + type + budget** (donnés dans le
message actuel OU dans l'historique de la conversation). Tant qu'il en manque,
tu envoies UNE SEULE bulle courte qui regroupe TOUS les critères manquants.
Ex : *"Pour vous proposer les bons biens, il me manque : la commune et votre budget."*
Jamais plusieurs messages de questions successifs.
Ne te précipite JAMAIS pour envoyer des biens sur un besoin vague.

**Cas délicats — silence (WhatsApp uniquement).** Si le contexte contient
« CANAL: WhatsApp », tu réponds EXACTEMENT \`[SILENCE]\` (rien d'autre) quand :
- le client s'impatiente ou exige de voir des biens sans donner ses critères (« montrez-moi ce que vous avez »)
- le client refuse un critère (« peu importe le budget », « pas de budget »)
- le message est une OFFRE qu'on te CONFIE, pas une demande : annonce d'agent,
  propriétaire ou démarcheur (indices : commission/« Com : X% », « mandataire »,
  « je suis directe », prix au m²/au lot, « morcelable », description détaillée
  d'un bien À PLACER). Ne propose JAMAIS de biens à ces contacts.
→ Un conseiller humain prend le relais sur ces cas.
(Hors WhatsApp : repose calmement ta question de qualification.)

═══════════════════════════════════════════════════════════
  PRISE DE RDV (BIENS BOGBE'S UNIQUEMENT)
═══════════════════════════════════════════════════════════
Si le client confirme vouloir visiter UN bien précis du catalogue BOGBE'S :
1. Identifie l'UUID exact dans le contexte (champ "ID:")
2. Si pas de date donnée, demande UNE date
3. À la fin de ta réponse, ajoute EXACTEMENT (sur une ligne dédiée) :
\`[RDV_CONFIRME bien_id=<UUID_EXACT> date=<YYYY-MM-DD ou texte court>]\`
4. Réponse type : *"C'est noté pour {date}. Notre équipe vous confirme l'horaire dans la journée."*

**Pour les offres flash**, pas de tag RDV.

═══════════════════════════════════════════════════════════
  URLS & LIENS — INTERDICTION D'INVENTION
═══════════════════════════════════════════════════════════
⚠️ **RÈGLE CRITIQUE** : Tu n'écris JAMAIS de lien \`https://wa.me/...\` toi-même.

Causes des hallucinations :
✗ Si tu écris \`https://wa.me/[contact via conseiller BOGBE'S]?text=...\` → c'est un LIEN CASSÉ, le placeholder n'est pas remplacé.
✗ Tu inventes le numéro du conseiller (tu ne le connais pas) → liens morts.

Comportement correct :

1. **Pour CONTACTER le conseiller** : NE PAS écrire de lien wa.me. À la place, dirige le client vers la fiche du bien (lien déjà donné) qui contient un bouton "Demander une visite" :
   ✓ *"Pour réserver une visite ou avoir plus d'infos, cliquez sur le lien ci-dessus → bouton 'Demander une visite' sur la fiche."*
   ✓ OU plus simple : *"Souhaitez-vous que notre conseiller vous recontacte ? Indiquez vos préférences (date, heure)."*

2. **Le SEUL lien autorisé dans ta réponse** = le champ "Lien fiche" du contexte (ex: https://bogbes-groupe.vercel.app/biens/<uuid> ou /offre-flash/<id>).

3. **Lien catalogue à la fin** (si le contexte fournit \`Lien tout voir\`) — utilise-le exact, ne le réécris pas.

4. **JAMAIS** : aucune URL inventée, aucun template avec crochets non remplis (\`[xxx]\`, \`{yyy}\`), aucun lien wa.me, aucun numéro de téléphone.

═══════════════════════════════════════════════════════════
  IMAGES — POLICY ABSOLUE (transparence totale)
═══════════════════════════════════════════════════════════
Les URLs des champs "Photos disponibles" et "Vidéos disponibles" du contexte sont **PRIVÉES**. Tu ne dois JAMAIS les afficher dans le texte du message — JAMAIS écrire \`https://res.cloudinary.com/...\` ou autre URL média dans le corps.

Comportements autorisés :

1. **Le client ne demande PAS de photo** → ne mentionne RIEN sur les photos.

2. **Le client demande une photo d'un bien BOGBE'S vérifié** (Source: bogbes) ET le contexte indique "Photos disponibles" :
   → Ajoute UNIQUEMENT cette ligne en FIN de message :
     \`[MEDIA: <première URL exacte du contexte>]\`
   → Le webhook envoie la photo en pièce jointe WhatsApp.

3. **Le client demande une photo d'une OFFRE FLASH** (Source: offre_flash) :
   → **NE JAMAIS envoyer une image stock** ni un placeholder. Réponds honnêtement :
     *"Cette offre flash vient d'un groupe WhatsApp sans média joint. Pas de photo de notre côté pour l'instant._
     _Notre conseiller peut les solliciter directement auprès du propriétaire. Voulez-vous que je transmette votre demande ?"*
   → Ce parti pris (pas de fausse image) est ce qui fait notre crédibilité. La déception d'une image trompeuse détruit la confiance, alors qu'une absence assumée la renforce.

4. **Le client demande une photo mais "Pas de photos dans le catalogue"** (cas BOGBE'S avec champ vide) :
   → "Je n'ai pas encore de photo pour ce bien dans notre système. Je signale au propriétaire."

JAMAIS inventer d'URL. JAMAIS écrire "voici la photo" sans la balise. **JAMAIS proposer une image stock générique**.

═══════════════════════════════════════════════════════════
  RÉFLEXION AVANT RÉPONSE
═══════════════════════════════════════════════════════════
Avant d'écrire, vérifie mentalement :
✓ Les biens que je vais citer sont-ils tous dans le contexte ? (sinon → supprime)
✓ Ai-je inventé du commentaire (quartier, ambiance) non présent dans la description ? (sinon → supprime)
✓ Mon intro fait-elle plus d'1 phrase ? (sinon → coupe)
✓ Ai-je utilisé un mot interdit (ravie, pépite, salut, idéal) ? (sinon → remplace)
✓ Le lien catalogue est-il en fin de message ?

(SITE = ${SITE_URL})`;

export const SYSTEM_PROMPT_SCORING = `Tu es un expert en marketing immobilier CI.
Analyse cette annonce et retourne UNIQUEMENT un objet JSON valide, sans texte autour.
Format exact :
{
  "score": <entier 0-100>,
  "niveau": "<excellent|bon|moyen|faible>",
  "points_forts": ["<point1>", "<point2>"],
  "recommandations": ["<action1>", "<action2>"],
  "resume": "<phrase courte d'evaluation>"
}
Criteres de scoring :
- Description (30pts): longueur, details, attractivite
- Prix (25pts): coherence avec commune et superficie
- Photos (20pts): nombre (0 photo = 0pt, 5+ photos = 20pts max)
- Completude (25pts): surface, nb_pieces, equipements renseignes`;

export const SYSTEM_PROMPT_DESCRIPTION = `Tu es un redacteur immobilier expert pour la Cote d'Ivoire.
Redige une description attractive et professionnelle pour cette annonce.
- 3 a 5 phrases, ton premium mais accessible
- Mentionne commune, surface, caracteristiques cles
- Utilise des formulations valorisantes adaptees au marche CI
- Termine par un appel a l'action soft
- UNIQUEMENT la description, sans titre ni entete`;

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

/**
 * Single Groq call attempt. Returns:
 *   - string on success
 *   - 'retry' if the failure is transient (network, 429, 5xx) → caller should retry
 *   - null if the failure is permanent (401, 400, empty completion)
 */
async function groqFetchOnce(
  messages: ChatMessage[],
  system: string,
  model: string = GROQ_MODEL,
): Promise<string | 'retry' | null> {
  let response: Response
  try {
    response = await fetchWithTimeout(GROQ_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${requireGroqKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
        temperature: 0.15,
        max_tokens: 800,
      }),
    })
  } catch (e) {
    // Network failure or timeout — both transient, worth retrying once
    const err = e as Error
    const isAbort = err.name === 'AbortError'
    console.error(`[Groq] fetch failed (${isAbort ? 'timeout' : 'network'}):`, err.message)
    return 'retry'
  }

  if (!response.ok) {
    const err = await response.text().catch(() => '<no body>')
    console.error(`[Groq] HTTP ${response.status} model=${model} - body: ${err.slice(0, 300)} - msgs=${messages.length} sysLen=${system.length}`)
    // 429 (rate limit) and 5xx (Groq downtime) are transient → retry
    if (response.status === 429 || response.status >= 500) return 'retry'
    return null
  }

  const data = await response.json().catch(() => null)
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    console.error('[Groq] empty completion. data=', JSON.stringify(data).slice(0, 300))
    return null
  }
  return content
}

async function groqFetch(messages: ChatMessage[], system: string): Promise<string | null> {
  const startedAt = Date.now()
  const first = await groqFetchOnce(messages, system)
  // CRITICAL: check the 'retry' sentinel BEFORE the typeof string check,
  // otherwise the sentinel itself would be returned as a valid completion.
  if (first !== 'retry') {
    return first // string completion or null (permanent failure)
  }

  // If the first attempt already ate >2.5 s (likely a timeout), don't retry —
  // we need to leave room for the OpenRouter fallback. Treat as null and let
  // the cascade move on.
  const elapsed = Date.now() - startedAt
  if (elapsed > 2500) {
    console.warn(`[Groq] skipping model cascade — first attempt took ${elapsed}ms, going straight to fallback`)
    return null
  }

  // Échec transitoire (429 = quota TPM/TPD du modèle primaire épuisé, ou 5xx).
  // Re-tenter le MÊME modèle 700 ms plus tard est inutile contre un quota :
  // on bascule sur le modèle de secours (bucket de quota séparé chez Groq).
  console.warn(`[Groq] ${GROQ_MODEL} KO → cascade vers ${GROQ_FALLBACK_MODEL}`)
  const second = await groqFetchOnce(messages, system, GROQ_FALLBACK_MODEL)
  if (second === 'retry' || second === null) return null
  return second
}

/**
 * Étage Gemini (Google AI Studio) — REST natif, format différent d'OpenAI :
 * system → systemInstruction, assistant → model, contents[].parts[].text.
 * thinkingBudget: 0 = désactive le raisonnement interne (latence + tokens),
 * inutile pour des réponses WhatsApp courtes et ancrées sur le catalogue.
 */
async function geminiFetch(
  messages: ChatMessage[],
  system: string,
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null

  const contents = messages
    .filter((m) => m.role !== 'system' && m.content)
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  if (contents.length === 0) return null

  let response: Response
  try {
    response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 800,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    )
  } catch (e) {
    const err = e as Error
    console.error(`[Gemini] fetch failed (${err.name === 'AbortError' ? 'timeout' : 'network'}):`, err.message)
    return null
  }

  if (!response.ok) {
    const err = await response.text().catch(() => '<no body>')
    console.error(`[Gemini] HTTP ${response.status} model=${GEMINI_MODEL} - body: ${err.slice(0, 300)}`)
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json().catch(() => null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = (data?.candidates?.[0]?.content?.parts ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .trim()
  if (!content) {
    console.error('[Gemini] empty completion. data=', JSON.stringify(data).slice(0, 300))
    return null
  }
  return content
}

/**
 * Fallback completion via OpenRouter (Gemini 2.0 Flash :free).
 * Used when Groq is rate-limited or down.
 * Same OpenAI-compatible request shape — only base URL + model change.
 */
/** Un seul appel OpenRouter pour un modèle donné. null = échec (à cascader). */
async function openRouterFetchModel(
  messages: ChatMessage[],
  system: string,
  model: string,
  timeoutMs: number,
): Promise<string | null> {
  let response: Response;
  try {
    response = await fetchWithTimeout(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SITE_URL,
        'X-Title': "BOGBE'S Sapphire",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: 0.15,
        max_tokens: 800,
      }),
    }, timeoutMs);
  } catch (e) {
    const err = e as Error
    console.error(`[OpenRouter] ${model} fetch failed (${err.name === 'AbortError' ? 'timeout' : 'network'}):`, err.message);
    return null;
  }
  if (!response.ok) {
    const err = await response.text().catch(() => '<no body>');
    console.error(`[OpenRouter] ${model} HTTP ${response.status} - ${err.slice(0, 200)}`);
    return null;
  }
  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`[OpenRouter] ${model} empty completion.`);
    return null;
  }
  return content;
}

/**
 * Cascade OpenRouter : modèle payant bon marché d'abord (fiable), puis modèles
 * gratuits de secours. On s'arrête au premier qui répond. But : ne quasiment
 * JAMAIS atteindre le message d'indisponibilité qui énerve les prospects.
 * Payant = 18s (peut être un peu lent), gratuits = 12s chacun (sinon on épuise
 * le budget des 60s webhook).
 */
async function openRouterFetch(
  messages: ChatMessage[],
  system: string,
): Promise<string | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] OPENROUTER_API_KEY not configured — skipping fallback');
    return null;
  }
  const chain = [
    { model: OPENROUTER_MODEL, timeout: 18000 },
    ...OPENROUTER_FREE_MODELS.map((model) => ({ model, timeout: 12000 })),
  ];
  for (const { model, timeout } of chain) {
    const out = await openRouterFetchModel(messages, system, model, timeout);
    if (out) return out;
    console.warn(`[OpenRouter] ${model} KO → modèle suivant`);
  }
  return null;
}

/**
 * Detect short greetings / pleasantries that don't need LLM reasoning.
 * Returning a hand-written reply avoids the LLM round-trip (and the
 * fallback message when Groq has a hiccup).
 *
 * Includes "intent signal" markers like commune/budget keywords so we
 * don't accidentally short-circuit a real request that happens to start
 * with "Bonjour, je cherche…".
 */
function detectGreeting(userMessage: string): string | null {
  const m = userMessage
    .trim()
    .toLowerCase()
    .replace(/[!?.,;:'"`]/g, '')
    .replace(/\s+/g, ' ')

  // If the message contains a real-estate intent signal, send it to the LLM
  // even if it starts with "Bonjour" — the user wants substantive help.
  const intentSignals = /\b(cherche|cherchez|cherchent|veux|veut|voudrais|aimerais|besoin|louer|location|acheter|achat|vente|villa|appartement|appart|studio|maison|terrain|bureau|meubl|cocody|plateau|riviera|marcory|yopougon|treichville|bingerville|grand-bassam|assinie|abidjan|fcfa|million|millions|budget|prix|chambres?|pièces?)\b/i
  if (intentSignals.test(m)) return null

  // Ouverture générique : pub Facebook Click-to-WhatsApp (« Puis-je en savoir
  // plus à ce sujet ? »), ou demande vague sans aucun critère. L'intentSignals
  // ci-dessus a déjà écarté les vrais besoins → ici il n'y a RIEN à traiter :
  // une IA ne ferait qu'accueillir + qualifier. Réponse pré-écrite = increvable
  // même quand les moteurs IA sont saturés par les rafales de trafic pub.
  const genericInquiry = /\b(en savoir plus|savoir plus|plus d ?infos?|plus d ?informations?|(?:des|d) (?:informations?|renseignements?|detail|details)|obtenir des informations?|interesse|intéress|ce sujet|votre (?:annonce|offre|pub|publicite|bien))\b/
  if (genericInquiry.test(m)) return welcomeReply()

  // Word count > 5 → probably has intent worth sending to the LLM
  if (m.split(' ').length > 5) return null

  const greetingPatterns = [
    /^(bonjour|bonsoir|salut|coucou|hello|hi|hey|yo)( .*)?$/,
    /^(bonjour|bonsoir|salut|hello) (monsieur|madame|mademoiselle|mr|mme|messieurs|mesdames|sapphire)$/,
    /^(merci|thanks|thank you|thx)( beaucoup| infiniment)?$/,
    /^(ok|d accord|daccord|parfait|super|cool|bien recu|bien reçu|noté|note|tres bien|c est noté|cest note)$/,
    /^(ça va|ca va|comment allez vous|comment ça va|comment ca va|comment vas tu|tu vas bien|ca roule|ça roule)( ?.*)?$/,
    /^(au revoir|bye|à bientôt|a bientot|à plus|a plus|bonne (journée|soiree|soirée|nuit))( .*)?$/,
  ]

  if (!greetingPatterns.some((p) => p.test(m))) return null

  if (/^(merci|thanks|thank you|thx)/.test(m)) {
    return `Avec plaisir 🙏\n\nDites-moi ce que vous cherchez : commune, type de bien, budget. Je vous oriente immédiatement.`
  }
  if (/^(ok|d accord|daccord|parfait|super|cool|bien|noté|note|tres bien|c est noté|cest note)/.test(m)) {
    return `Très bien 👍\n\nDécrivez-moi ce que vous cherchez (commune, type, budget) et je vous présente les biens disponibles.`
  }
  if (/^(au revoir|bye|à bientôt|a bientot|à plus|a plus|bonne)/.test(m)) {
    return `À très bientôt 👋\n\nN'hésitez pas à me recontacter dès que vous voulez relancer votre recherche.`
  }
  if (/^(ça va|ca va|comment|tu vas|ca roule|ça roule)/.test(m)) {
    return `Ça va très bien, merci 😊\n\nEt vous ? Dites-moi ce que vous cherchez : commune, type de bien, budget. Je m'occupe du reste.`
  }

  return welcomeReply()
}

/** Message d'accueil + qualification (pré-écrit, aucun appel IA). */
function welcomeReply(): string {
  const timeOfDay = new Date().getHours() < 12 ? 'Bonjour' : 'Bonsoir'
  return `${timeOfDay} 👋\n\nJe suis Sapphire, conseillère BOGBE'S. Je vous aide à trouver votre bien à Abidjan et partout en Côte d'Ivoire (Bouaké, Yamoussoukro, Grand-Bassam, San-Pédro, Korhogo, Daloa, Bingerville…).\n\nDécrivez-moi votre besoin :\n• La ville, commune ou quartier\n• Le type de bien (appartement, villa, studio, terrain…)\n• Votre budget\n\nJe vous présente les meilleures options.`
}

/**
 * Safety filter applied to every LLM completion before sending to the user.
 *
 * Catches the rare cases where the model leaks:
 *   - Internal terms ("WhatsApp scraping", "réseau d'agents WhatsApp", "scrapé")
 *     → OPSEC, see commits f405cd5 + earlier
 *   - Raw owner phone numbers (Ivorian formats: +225XX XX XX XX XX or 10 digits)
 *   - Cloudinary asset URLs that should stay private
 *   - Multiple blank lines (cosmetic)
 *
 * Returns the sanitized string. Logs when a redaction happened so we can
 * tune the system prompt if a pattern keeps recurring.
 */
function sanitizeOutput(text: string): string {
  let out = text
  let redactionCount = 0

  // Ivorian phone numbers: +225 XX XX XX XX XX, 0X XX XX XX XX, 10 raw digits, etc.
  // We replace them with a neutral marker rather than removing — preserves sentence flow.
  const phonePatterns: RegExp[] = [
    /\+?225[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g,
    /\b0\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,
    /\b\d{10}\b/g, // 10 raw digits — last resort
  ]
  for (const p of phonePatterns) {
    if (p.test(out)) {
      redactionCount += (out.match(p) ?? []).length
      out = out.replace(p, '[contact via conseiller BOGBE\'S]')
    }
  }

  // Internal scraping / OPSEC leaks — replace with neutral wording
  const opsecPatterns: Array<{ from: RegExp; to: string }> = [
    { from: /\bscrap(?:é|ée|és|ées|er|ing|e)\b/gi, to: 'capté' },
    { from: /\bréseau (?:d['e]?)?agents? whatsapp\b/gi, to: 'marché ivoirien' },
    { from: /\bgroupes? whatsapp(?: publics?)?\b/gi, to: 'sources tierces' },
    { from: /\bcapt(?:e|é|ée|er|ent) en continu (?:dans|sur) (?:les?|des?) (?:groupes?|réseaux?) whatsapp\b/gi, to: 'capté sur le marché' },
  ]
  for (const { from, to } of opsecPatterns) {
    if (from.test(out)) {
      redactionCount += (out.match(from) ?? []).length
      out = out.replace(from, to)
    }
  }

  // Cloudinary URLs in body (système prompt already forbids them, but belt+braces)
  const cloudinaryPattern = /https?:\/\/res\.cloudinary\.com\/[^\s)]+/g
  if (cloudinaryPattern.test(out)) {
    redactionCount += (out.match(cloudinaryPattern) ?? []).length
    out = out.replace(cloudinaryPattern, '[photo dispo sur la fiche bien]')
  }

  // Normalize 3+ consecutive newlines down to 2 (one empty line max)
  out = out.replace(/\n{3,}/g, '\n\n').trim()

  if (redactionCount > 0) {
    console.warn(`[Sapphire][safety] redacted ${redactionCount} items from completion`)
  }
  return out
}

/**
 * Structured single-line log for each Sapphire call.
 * Easy to grep / parse from Vercel logs.
 */
interface SapphireLog {
  route: 'greeting' | 'groq' | 'gemini' | 'openrouter' | 'fallback'
  latency_ms: number
  history_msgs: number
  system_bytes: number
  output_chars: number
  redactions?: number
}
function logSapphireCall(entry: SapphireLog): void {
  console.log(`[Sapphire] ${JSON.stringify(entry)}`)
}

// Dernier recours (toutes les IA KO). Formulé comme un PASSAGE DE RELAIS
// premium, jamais comme une panne : le prospect lit « un humain s'occupe de
// moi », pas « le robot est cassé ». Le préfixe distinctif sert de marqueur
// à isSapphireFallback (anti-boucle).
const FALLBACK_REPLY =
  `Un conseiller BOGBE'S prend le relais et revient vers vous directement dans un instant 🙏\n\nVotre demande est bien enregistrée, merci de patienter quelques minutes.`

/** Message d'escalade envoyé au 2e échec IA consécutif (un humain prend le relais). */
export const SAPPHIRE_ESCALATION =
  `Je transmets votre demande à un conseiller humain qui vous répond directement 👍\n\nMerci de votre patience.`

/**
 * Détecte si un texte est une réponse de secours Sapphire (échec des providers IA).
 * Matche l'ancien ET le nouveau libellé — l'historique DB contient encore l'ancien.
 */
export function isSapphireFallback(text: string | null | undefined): boolean {
  if (!text) return false
  return (
    text.startsWith('Un instant, je reçois beaucoup de demandes') ||
    text.startsWith('Désolé, je rencontre un petit souci technique') ||
    text.startsWith("Un conseiller BOGBE'S prend le relais")
  )
}

export async function chatImmobilier(messages: ChatMessage[], context?: string): Promise<string> {
  const startedAt = Date.now()
  const history_msgs = messages.length

  // Greeting fast-path — works at ANY point in the conversation, not just the
  // first 2 messages. The detector itself rejects messages with real-estate
  // intent signals so we don't accidentally short-circuit a substantive query.
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content
  if (lastUserMsg) {
    const greeting = detectGreeting(lastUserMsg)
    if (greeting) {
      logSapphireCall({
        route: 'greeting',
        latency_ms: Date.now() - startedAt,
        history_msgs,
        system_bytes: 0,
        output_chars: greeting.length,
      })
      return greeting
    }
  }

  const system = context
    ? `${SYSTEM_PROMPT_IMMOBILIER_CI}\n\n== CATALOGUE DES BIENS DISPONIBLES ==\n${context}`
    : SYSTEM_PROMPT_IMMOBILIER_CI

  // Garde-fou : limiter l'historique aux 6 derniers messages pour rester sous le budget tokens
  const trimmed = messages.length > 6 ? messages.slice(-6) : messages

  // Stage 1 — Groq (primary, ultra rapide)
  const groqResult = await groqFetch(trimmed, system)
  if (groqResult) {
    const cleaned = sanitizeOutput(groqResult)
    logSapphireCall({
      route: 'groq',
      latency_ms: Date.now() - startedAt,
      history_msgs,
      system_bytes: system.length,
      output_chars: cleaned.length,
      redactions: groqResult.length !== cleaned.length ? 1 : 0,
    })
    return cleaned
  }

  // Stage 2 — Gemini (Google AI Studio) : gros quota gratuit journalier,
  // le vrai filet quand les quotas Groq sont épuisés par la demande.
  console.warn(`[Sapphire] Groq KO → Gemini. sysLen=${system.length} histMsgs=${trimmed.length}`)
  const geminiResult = await geminiFetch(trimmed, system)
  if (geminiResult) {
    const cleaned = sanitizeOutput(geminiResult)
    logSapphireCall({
      route: 'gemini',
      latency_ms: Date.now() - startedAt,
      history_msgs,
      system_bytes: system.length,
      output_chars: cleaned.length,
      redactions: geminiResult.length !== cleaned.length ? 1 : 0,
    })
    return cleaned
  }

  // Stage 3 — OpenRouter backup (actif seulement si OPENROUTER_API_KEY est définie)
  console.warn(`[Sapphire] Gemini KO → OpenRouter fallback`)
  const openRouterResult = await openRouterFetch(trimmed, system)
  if (openRouterResult) {
    const cleaned = sanitizeOutput(openRouterResult)
    logSapphireCall({
      route: 'openrouter',
      latency_ms: Date.now() - startedAt,
      history_msgs,
      system_bytes: system.length,
      output_chars: cleaned.length,
      redactions: openRouterResult.length !== cleaned.length ? 1 : 0,
    })
    return cleaned
  }

  // Stage 4 — Hand-written fallback (tous les providers KO)
  logSapphireCall({
    route: 'fallback',
    latency_ms: Date.now() - startedAt,
    history_msgs,
    system_bytes: system.length,
    output_chars: FALLBACK_REPLY.length,
  })
  return FALLBACK_REPLY
}

export async function chatImmobilierStream(messages: ChatMessage[], context?: string): Promise<ReadableStream | null> {
  const system = context
    ? `${SYSTEM_PROMPT_IMMOBILIER_CI}\n\n== CATALOGUE DES BIENS DISPONIBLES ==\n${context}`
    : SYSTEM_PROMPT_IMMOBILIER_CI;

  // Stage 1 — Try Groq stream
  if (GROQ_API_KEY) {
    try {
      const groqResp = await fetch(GROQ_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: 0.3,
          max_tokens: 800,
          stream: true,
        }),
      });
      if (groqResp.ok && groqResp.body) return groqResp.body;
      // 401 / 402 / 429 etc. → log + fall through to OpenRouter
      const errBody = await groqResp.text().catch(() => '<no body>');
      console.warn(`[Sapphire stream] Groq KO ${groqResp.status} ${errBody.slice(0, 200)} → OpenRouter fallback`);
    } catch (e) {
      console.warn('[Sapphire stream] Groq fetch failed:', (e as Error).message);
    }
  }

  // Stage 2 — OpenRouter stream fallback (Gemini Flash :free)
  if (OPENROUTER_API_KEY) {
    try {
      const orResp = await fetch(OPENROUTER_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': SITE_URL,
          'X-Title': "BOGBE'S GROUPE Sapphire",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: 0.3,
          max_tokens: 800,
          stream: true,
        }),
      });
      if (orResp.ok && orResp.body) return orResp.body;
      const errBody = await orResp.text().catch(() => '<no body>');
      console.error(`[Sapphire stream] OpenRouter KO ${orResp.status} ${errBody.slice(0, 200)}`);
    } catch (e) {
      console.error('[Sapphire stream] OpenRouter fetch failed:', (e as Error).message);
    }
  }

  // Stage 3 — Both providers down : retourner null (le caller affichera un fallback texte)
  return null;
}

export async function scorerAnnonce(bienData: Record<string, unknown>) {
  const result = await groqFetch(
    [{ role: 'user', content: JSON.stringify(bienData) }],
    SYSTEM_PROMPT_SCORING
  );
  try {
    return JSON.parse(result || '{}');
  } catch {
    return { score: 0, niveau: 'inconnu', points_forts: [], recommandations: ['Erreur analyse'], resume: '' };
  }
}

export async function genererDescription(caracteristiques: Record<string, unknown>): Promise<string> {
  const result = await groqFetch(
    [{ role: 'user', content: JSON.stringify(caracteristiques) }],
    SYSTEM_PROMPT_DESCRIPTION
  );
  return result || '';
}
