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
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

const OPENROUTER_API_KEY = sanitizeKey(process.env.OPENROUTER_API_KEY);
// Modèle gratuit, robuste en FR, ~20 req/min sur le tier free.
// openai/gpt-oss-120b:free = large modèle 120B stable, bonne qualité FR.
// Alternatives testées valides : moonshotai/kimi-k2.6:free, google/gemma-4-31b-it:free.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';
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

⑦ **MAX 5 BIENS.** Si le catalogue contient moins de biens, propose-les TOUS (1, 2, 3 ou 4). N'invente JAMAIS d'autres biens pour atteindre 5.

⑧ **UNE QUESTION À LA FOIS** quand il manque des critères. Pas trois.

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
WhatsApp affiche un APERÇU RICHE automatique de chaque URL (image + titre + description). On laisse l'aperçu faire le travail visuel. Ton message reste sobre.

WhatsApp supporte *gras* (\`*texte*\`) et _italique_ (\`_texte_\`). Les URLs brutes sont auto-cliquables.
**JAMAIS** de Markdown \`**\` ou \`[texte](url)\` — ça s'affiche en brut.

⚠️ **PRINCIPE** : zéro emoji décoratif. Le bien est défini par 1 ligne de titre, 1 lien. Point. L'aperçu WhatsApp affiche le reste.

**Template OBLIGATOIRE pour chaque bien proposé** :

*{Titre court : "{Type} {N} chambres — {Commune}"}*
{URL exacte du champ "Lien fiche"}

{UNE seule ligne badge en italique :
  - Si Source: bogbes ET Vérifié dans Badges : "_✓ Vérifié BOGBE'S_"
  - Si Source: offre_flash : "_⚡ Offre flash — à valider avec notre conseiller_"}

Saut de ligne entre chaque bien. Max 3 biens (sauf si plus disponibles dans contexte).

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

*Terrain 400 m² — Grand Alepè*
https://bogbes-groupe.vercel.app/biens/b71c3d62-89ef-4053-88dc-21c7dc03ccf9
_✓ Vérifié BOGBE'S_

Souhaitez-vous organiser une visite ?
\`\`\`

✅ BONNE RÉPONSE (plusieurs biens flash) :
\`\`\`
Je vous propose ces biens :

*Appartement 4 chambres — Cocody / Angré*
https://bogbes-groupe.vercel.app/offre-flash/24755
_⚡ Offre flash — à valider avec notre conseiller_

*Appartement 3 chambres — Cocody / Faya*
https://bogbes-groupe.vercel.app/offre-flash/24622
_⚡ Offre flash — à valider avec notre conseiller_

Lequel souhaitez-vous visiter ?
\`\`\`

Différences clés :
- ZÉRO emoji décoratif (📍 💰 🛏️ 🔗 → INTERDITS)
- ZÉRO ligne de données factuelles (prix, surface, pièces) — l'APERÇU WHATSAPP les affiche
- Titre + lien sur 2 lignes, badge sur la 3e. C'est tout.
- Pas de "*Description :" — paraphrase en 1 phrase courte SI utile, jamais collée
- AUCUNE URL Cloudinary dans le corps — photos uniquement via tag \`[MEDIA: URL]\` si demande client
- Pas de séparateurs (\`────\`) — laisser respirer avec une ligne vide entre biens

═══════════════════════════════════════════════════════════
  QUAND LE CATALOGUE EST VIDE
═══════════════════════════════════════════════════════════
Si le contexte dit "Aucun bien ne correspond exactement", réponds EXACTEMENT :

*"Aucun bien ne matche {zone} + {type} + {budget} dans notre stock actuel.*
*Je note tes critères et reviens vers toi dès qu'un bien rentre. Tu cherches pour quand au plus tard ?"*

Pas d'invention, pas de fausse promesse. Une seule question pour qualifier l'urgence.

═══════════════════════════════════════════════════════════
  QUAND ON A BESOIN DE PLUS D'INFOS
═══════════════════════════════════════════════════════════
Si tu n'as ni zone, ni type, ni budget, pose UNE SEULE question, dans l'ordre :
- Zone d'abord : *"Sur quelle ville, commune ou quartier vous cherchez (Abidjan, Bouaké, Yamoussoukro, Bassam, San-Pédro… ou ailleurs en Côte d'Ivoire) ?"*
- Puis type : *"Tu cherches plutôt un appartement, une villa, un studio ?"*
- Puis budget : *"Quel est ton budget mensuel maximum ?"*

Dès que tu as **zone + (type OU budget)** → lance la recherche dans le catalogue. Pas besoin d'attendre tous les critères.

═══════════════════════════════════════════════════════════
  PRISE DE RDV (BIENS BOGBE'S UNIQUEMENT)
═══════════════════════════════════════════════════════════
Si le client confirme vouloir visiter UN bien précis du catalogue BOGBE'S :
1. Identifie l'UUID exact dans le contexte (champ "ID:")
2. Si pas de date donnée, demande UNE date
3. À la fin de ta réponse, ajoute EXACTEMENT (sur une ligne dédiée) :
\`[RDV_CONFIRME bien_id=<UUID_EXACT> date=<YYYY-MM-DD ou texte court>]\`
4. Réponse type : *"C'est noté pour {date}. Notre équipe te confirme l'horaire dans la journée."*

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
        model: GROQ_MODEL,
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
    console.error(`[Groq] HTTP ${response.status} - body: ${err.slice(0, 300)} - msgs=${messages.length} sysLen=${system.length}`)
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
    console.warn(`[Groq] skipping retry — first attempt took ${elapsed}ms, going straight to fallback`)
    return null
  }

  // Transient failure with budget left → wait briefly then retry once.
  await new Promise((r) => setTimeout(r, 700))
  console.warn('[Groq] retrying after transient failure')
  const second = await groqFetchOnce(messages, system)
  if (second === 'retry' || second === null) return null
  return second
}

/**
 * Fallback completion via OpenRouter (Gemini 2.0 Flash :free).
 * Used when Groq is rate-limited or down.
 * Same OpenAI-compatible request shape — only base URL + model change.
 */
async function openRouterFetch(
  messages: ChatMessage[],
  system: string,
): Promise<string | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] OPENROUTER_API_KEY not configured — skipping fallback');
    return null;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Recommandé par OpenRouter pour identifier l'app dans leur dashboard
        'HTTP-Referer': SITE_URL,
        'X-Title': "BOGBE'S Sapphire",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
        temperature: 0.15,
        max_tokens: 800,
      }),
    });
  } catch (e) {
    const err = e as Error
    const isAbort = err.name === 'AbortError'
    console.error(`[OpenRouter] fetch failed (${isAbort ? 'timeout' : 'network'}):`, err.message);
    return null;
  }

  if (!response.ok) {
    const err = await response.text().catch(() => '<no body>');
    console.error(`[OpenRouter] HTTP ${response.status} - body: ${err.slice(0, 300)}`);
    return null;
  }

  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    console.error('[OpenRouter] empty completion. data=', JSON.stringify(data).slice(0, 300));
    return null;
  }
  return content;
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

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'Bonjour' : 'Bonsoir'

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
  route: 'greeting' | 'groq' | 'openrouter' | 'fallback'
  latency_ms: number
  history_msgs: number
  system_bytes: number
  output_chars: number
  redactions?: number
}
function logSapphireCall(entry: SapphireLog): void {
  console.log(`[Sapphire] ${JSON.stringify(entry)}`)
}

const FALLBACK_REPLY =
  `Un instant, je reçois beaucoup de demandes 🙏\n\nEn attendant, dites-moi simplement :\n• Quelle commune ? (Cocody, Plateau, Riviera…)\n• Quel budget ?\n\nJe reviens vers vous dans quelques secondes.`

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

  // Stage 2 — OpenRouter (Gemini Flash :free) backup
  console.warn(`[Sapphire] Groq KO → OpenRouter fallback. sysLen=${system.length} histMsgs=${trimmed.length}`)
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

  // Stage 3 — Hand-written fallback (both providers down)
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
