// lib/ai.ts — Sapphire conversational AI
//
// Stratégie fail-over :
//   1. Groq (primary)         — Llama 3.3 70B, ultra rapide, gratuit
//   2. OpenRouter (backup)    — Qwen payant à coût maîtrisé quand Groq KO
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
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
// Modèle de secours actif sur Groq avec bucket distinct
const GROQ_FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-20b';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Google AI Studio (Gemini) — quota gratuit par jour ≫ Groq free (le vrai
// filet de sécurité sous forte demande). Modèle 2.5 requis : le free tier
// de gemini-2.0-flash est à 0 depuis le passage aux 2.5 (vérifié en live).
const GEMINI_API_KEY = sanitizeKey(process.env.GEMINI_API_KEY);
// gemini-flash-latest : bucket de quota séparé de gemini-2.5-flash (qui sature
// vite sous les rafales de trafic pub). Vérifié en live : 200 vs 429.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const OPENROUTER_API_KEY = sanitizeKey(process.env.OPENROUTER_API_KEY);
// Modèle chinois PAYANT très bon marché = filet fiable quand Groq/Gemini
// sont quota-out. Surchargeable via env OPENROUTER_MODEL.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3.7-flash';
// Replis payants peu coûteux : aucun flux métier ne dépend du quota ou du
// routage aléatoire du catalogue OpenRouter :free.
const OPENROUTER_PAID_MODELS = (
  process.env.OPENROUTER_PAID_MODELS ||
  'qwen/qwen3.5-9b,deepseek/deepseek-v4-flash-0731'
).split(',').map((s) => s.trim()).filter((model) => model.length > 0 && !model.endsWith(':free'));
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
 * OpenRouter is Sapphire's last provider fallback. Keep this branch bounded:
 * a webhook must still have enough time to persist the conversation and send
 * the answer before Vercel's hard timeout. Two diverse attempts are enough
 * here because Groq and Gemini have already been tried.
 */
export function buildOpenRouterAttemptPlan(models: readonly string[]) {
  return [...new Set(models.map((model) => model.trim()).filter((model) => model.length > 0 && !model.endsWith(':free')))]
    .slice(0, 2)
    .map((model) => ({ model, timeout: 7_000 }))
}

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bogbesgroup.com';

function requireGroqKey(): string {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured. Add it to your environment variables.');
  }
  return GROQ_API_KEY;
}

export const SYSTEM_PROMPT_IMMOBILIER_CI = `Tu es **Sapphire**, conseillère immobilière de **BOGBE'S GROUPE** en Côte d'Ivoire (Abidjan et intérieur : Bouaké, Yamoussoukro, Grand-Bassam, San-Pédro, Korhogo, Daloa, Bingerville, Songon, Anyama, etc.). Style : professionnel, posé, factuel.

⚠️ LECTURE DU CONTEXTE :
Le bloc \`== CATALOGUE DES BIENS DISPONIBLES ==\` est une base de données brute.
Ne recopie JAMAIS les en-têtes ("ID:", "Source:", "Photos disponibles:", etc.), ni les URLs médias Cloudinary (privées). Utilise uniquement le champ "Lien fiche".

═══════════════════════════════════════════════════════════
  RÈGLES ABSOLUES — APPLICATION STRICTE
═══════════════════════════════════════════════════════════
① VOUVOIEMENT STRICT : Toujours « vous », jamais « tu/toi/ton/ta ». Valable du premier au dernier message.
② VERROU TYPE : Ne propose QUE le type demandé (appartement, villa, duplex, studio, terrain...). Aucune substitution.
②bis VERROU ZONE : Ne propose JAMAIS un bien hors de la commune/quartier demandé. Ignore tout bien hors zone dans le contexte. Si aucun bien en stock dans la zone : remercie et dis : *"Un conseiller commercial va prendre le relais et vous recontacter."*
③ SOURCE UNIQUE : Uniquement les biens listés dans \`== CATALOGUE DES BIENS DISPONIBLES ==\`. N'invente AUCUN bien, prix, quartier ou lien.
④ BUDGET : Respecte le budget max indiqué (≤ budget). Ne propose jamais d'augmenter le budget.
⑤ CONFIDENTIALITÉ : Aucun contact direct propriétaire. Tout échange passe par BOGBE'S.
⑥ PHRASING INTERDIT : Jamais "Je suis ravie", "Salut", "Pépites", "Idéal pour une famille", ni négociation de critères ("élargir la recherche ?").
⑦ MAX 3 BIENS par réponse. Si moins en stock, propose ceux disponibles.
⑧ QUALIFICATION : Si les 3 critères (zone + type + budget) ne sont pas encore connus, demande-les en UNE SEULE bulle courte.
⑨ PROPOSITION IMMÉDIATE DU CATALOGUE :
   Dès que le bloc \`== CATALOGUE DES BIENS DISPONIBLES ==\` contient un ou plusieurs biens :
   Tu DOIS IMMÉDIATEMENT LES PROPOSER !
   Ne redemande JAMAIS la date d'emménagement ou un autre critère avant de proposer les biens trouvés. La date n'est PAS obligatoire pour présenter les fiches.
⑩ INTRO & CLÔTURE OBLIGATOIRES :
   - Introduis les biens par EXACTEMENT :
     *"Voici ce qui est disponible dans notre catalogue correspondant à votre recherche :"*
   - Conclus le message par EXACTEMENT :
     *"Merci de patienter, un conseiller commercial va prendre la relève pour la suite."*
⑪ BREF & DIRECT : Pas de blabla, phrases courtes et percutantes.

═══════════════════════════════════════════════════════════
  CAS PARTICULIERS (CANAL WHATSAPP)
═══════════════════════════════════════════════════════════
- Si le contexte contient « CANAL: WhatsApp », réponds EXACTEMENT \`[SILENCE]\` (sans aucun texte) si :
  • Le message est une offre proposée par un démarcheur, agent ou propriétaire (mots clés : "Com", "mandataire", "je suis directe", prix au m², bien à placer).
  • Le client refuse de donner ses critères ou exige de voir des biens à l'aveugle.
- Prise de RDV (bien BOGBE'S vérifié uniquement) : si le client confirme vouloir visiter un bien précis avec date, termine par :
  \`[RDV_CONFIRME bien_id=<UUID> date=<YYYY-MM-DD ou texte>]\`

═══════════════════════════════════════════════════════════
  FORMAT WHATSAPP DES BIENS
═══════════════════════════════════════════════════════════
Pour chaque bien (max 3) :
*{Type} {N} ch. — {Quartier ou Commune} · {Prix}*
{URL exacte du champ "Lien fiche"}
{_✓ Vérifié BOGBE'S_ OU _⚡ Disponibilité à confirmer par notre conseiller_}

Après les fiches :
_Cliquez sur un lien pour voir les photos et tous les détails._

Merci de patienter, un conseiller commercial va prendre la relève pour la suite.

RÈGLES LIENS & PHOTOS :
- Le SEUL lien cliquable autorisé est celui du champ "Lien fiche".
- JAMAIS de lien wa.me inventé ou tronqué.
- JAMAIS d'URL Cloudinary ou image brute dans le texte. Si le client demande une photo d'un bien BOGBE'S vérifié, ajoute en fin de message : \`[MEDIA: <url_du_contexte>]\`.

═══════════════════════════════════════════════════════════
  VOCABULAIRE CI RECONNU
═══════════════════════════════════════════════════════════
Comprends les termes locaux ivoiriens : "dernier prix" (négociation -> gérée par le conseiller), "caution" (garantie), "avance", "cour commune", "entrée couchée", "visite anticipée", "bayer" (négocier). Réponds toujours poliment en français soigné au vouvoiement.

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
    // 429 (rate limit), 404 (modèle déprécié/inaccessible) et 5xx (panne) → bascule sur modèle de secours
    if (response.status === 429 || response.status === 404 || response.status >= 500) return 'retry'
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
 * Fallback completion via a paid Qwen model on OpenRouter.
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
 * Deux tentatives de 7 s au maximum : les étages Groq et Gemini ont déjà été
 * sollicités, il faut préserver le temps de journaliser et d'envoyer la réponse.
 */
async function openRouterFetch(
  messages: ChatMessage[],
  system: string,
): Promise<string | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn('[OpenRouter] OPENROUTER_API_KEY not configured — skipping fallback');
    return null;
  }
  const chain = buildOpenRouterAttemptPlan([
    OPENROUTER_MODEL,
    ...OPENROUTER_PAID_MODELS,
  ])
  for (const { model, timeout } of chain) {
    const out = await openRouterFetchModel(messages, system, model, timeout);
    if (out) return out;
    console.warn(`[OpenRouter] ${model} KO → modèle suivant`);
  }
  return null;
}

// Signaux d'intention immobilière (verbe de recherche, type, commune, budget).
export const PROPERTY_INTENT_REGEX = /\b(cherche|cherchez|cherchent|veux|veut|voudrais|aimerais|besoin|louer|location|acheter|achat|vente|villa|appartement|appart|studio|maison|terrain|bureau|meubl|logement|duplex|triplex|magasin|entrep[ôo]t|cocody|plateau|riviera|angr[ée]|marcory|yopougon|treichville|bingerville|koumassi|abobo|adjam[ée]|port[-\s]?bou[eë]t|grand-bassam|assinie|songon|anyama|bouak[ée]|yamoussoukro|san[-\s]?p[ée]dro|abidjan|fcfa|million|millions|budget|prix|chambres?|pi[èe]ces?)\b/i
// Ouverture générique (pub Facebook « en savoir plus », demande vague).
const GENERIC_INQUIRY_REGEX = /\b(en savoir plus|savoir plus|plus d ?infos?|plus d ?informations?|(?:des|d) (?:informations?|renseignements?|detail|details)|obtenir des informations?|interesse|intéress|ce sujet|votre (?:annonce|offre|pub|publicite|bien))\b/
const GREETING_PATTERNS = [
  /^(bonjour|bonsoir|bjr|bsr|bnjour|bjour|bnsr|slt|salut|coucou|cc|hello|hi|hey|yo)( .*)?$/i,
  /^(bonjour|bonsoir|bjr|bsr|slt|salut|hello) (monsieur|madame|mademoiselle|mr|mme|messieurs|mesdames|sapphire)$/i,
  /^(merci|thanks|thank you|thx)( beaucoup| infiniment)?$/,
  /^(ok|d accord|daccord|parfait|super|cool|bien recu|bien reçu|noté|note|tres bien|c est noté|cest note)$/,
  /^(ça va|ca va|comment allez vous|comment ça va|comment ca va|comment vas tu|tu vas bien|ca roule|ça roule)( ?.*)?$/,
  /^(au revoir|bye|à bientôt|a bientot|à plus|a plus|bonne (journée|soiree|soirée|nuit))( .*)?$/,
]

function normalizeMsg(userMessage: string): string {
  return userMessage.trim().toLowerCase().replace(/[!?.,;:'"`]/g, '').replace(/\s+/g, ' ')
}

/** Le message exprime-t-il une intention immobilière (recherche de bien) ? */
export function hasPropertyIntent(userMessage: string): boolean {
  return PROPERTY_INTENT_REGEX.test(userMessage)
}

/** Salutation, politesse, ou ouverture de pub — à accueillir, pas à ignorer. */
export function isGreetingOrAdOpener(userMessage: string): boolean {
  const m = normalizeMsg(userMessage)
  if (GENERIC_INQUIRY_REGEX.test(m)) return true
  return GREETING_PATTERNS.some((p) => p.test(m))
}

/**
 * Detect short greetings / pleasantries that don't need LLM reasoning.
 * Returning a hand-written reply avoids the LLM round-trip (and the
 * fallback message when Groq has a hiccup).
 */
function detectGreeting(userMessage: string): string | null {
  const m = normalizeMsg(userMessage)

  // Vrai besoin immobilier → LLM (même si ça commence par « Bonjour »).
  if (PROPERTY_INTENT_REGEX.test(m)) return null

  // Ouverture générique (pub Facebook, demande vague) → accueil pré-écrit.
  if (GENERIC_INQUIRY_REGEX.test(m)) return welcomeReply()

  // Word count > 5 → probably has intent worth sending to the LLM
  if (m.split(' ').length > 5) return null

  if (!GREETING_PATTERNS.some((p) => p.test(m))) return null

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
  return `${timeOfDay} 👋\n\nJe suis Sapphire, conseillère de BOGBE'S GROUPE — votre plateforme immobilière en Côte d'Ivoire (Abidjan, Bouaké, Yamoussoukro, Grand-Bassam, San-Pédro…).\n\nPour commencer, puis-je avoir votre nom ?\n\nEt décrivez-moi ce que vous recherchez :\n• La ville, commune ou quartier\n• Le type de bien (appartement, villa, studio, terrain…)\n• Votre budget\n\nJe vous présente ce qui est disponible.`
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

  // Nettoyer les éventuelles balises de réflexion interne (<think>...</think>)
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

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
// Dernier étage de cascade réellement utilisé — exposé pour que le webhook
// WhatsApp journalise QUEL modèle a répondu (metadata.model). Sans ça,
// impossible de diagnostiquer les réponses hors-règles des petits modèles.
let _lastRoute = 'none'
export function getLastSapphireRoute(): string {
  return _lastRoute
}
function logSapphireCall(entry: SapphireLog): void {
  _lastRoute = entry.route
  console.log(`[Sapphire] ${JSON.stringify(entry)}`)
}

// Rappel court APRÈS le catalogue : les règles critiques doivent être la
// DERNIÈRE chose lue par le modèle — les étages de secours de la cascade
// (8b-instant, free tiers) perdent les consignes noyées avant un long contexte.
const FINAL_RULES_REMINDER = `

== RAPPEL FINAL — PRIORITÉ ABSOLUE ==
- Si le catalogue ci-dessus contient des biens (== CATALOGUE DES BIENS DISPONIBLES ==) : PROPOSE-LES IMMÉDIATEMENT ! Tu ne dois JAMAIS demander la date d'emménagement, l'achat/location ou un critère manquant avant de proposer.
- Introduis les biens par EXACTEMENT : « Voici ce qui est disponible dans notre catalogue correspondant à votre recherche : »
- MAX 3 biens par réponse, uniquement ceux du catalogue ci-dessus. N'invente RIEN.
- Sois BREF, droit au but. Après une proposition de biens, conclus par « Merci de patienter, un conseiller commercial va prendre la relève pour la suite. » ; si aucun bien : « Un conseiller commercial va prendre le relais et vous recontacter. »
- ZONE STRICTE : jamais un bien hors de la commune/quartier demandé, même en « autre option ».
- Jamais de lien wa.me ; seul le "Lien fiche" du contexte est autorisé.
- Si le contexte contient « CANAL: WhatsApp » : client impatient sans critères, client qui refuse un critère (budget…), ou annonce qu'on te CONFIE → réponds EXACTEMENT [SILENCE].`

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
 * Formate déterministement les biens du catalogue sans dépendre du LLM.
 * Filet de sécurité absolu utilisé :
 * 1) Si les providers IA sont KO/timeout/503.
 * 2) Si le LLM a posé une question au lieu de présenter les fiches alors que des biens étaient disponibles.
 */
export function formatDeterministicBiensReply(context?: string): string | null {
  if (!context || !context.includes('--- BIEN 1')) return null

  const bienBlocks = context.split(/--- BIEN \d+ [^-\n]+ ---/).slice(1)
  if (bienBlocks.length === 0) return null

  const formattedItems: string[] = []

  for (const block of bienBlocks.slice(0, 3)) {
    const titreMatch = block.match(/Titre:\s*([^\n]+)/)
    const locMatch = block.match(/Localisation:\s*([^\n]+)/)
    const prixMatch = block.match(/Prix:\s*([^\n]+)/)
    const lienMatch = block.match(/Lien fiche:\s*([^\n]+)/)
    const sourceMatch = block.match(/Source:\s*([^\n]+)/)

    const titre = titreMatch ? titreMatch[1].trim() : 'Bien disponible'
    const loc = locMatch ? locMatch[1].trim() : ''
    const prix = prixMatch ? prixMatch[1].trim() : ''
    const lien = lienMatch ? lienMatch[1].trim() : ''
    const source = sourceMatch ? sourceMatch[1].trim() : ''

    if (!lien) continue

    let badge = ''
    if (source === 'bogbes') {
      badge = "\n_✓ Vérifié BOGBE'S_"
    } else if (source === 'flash') {
      badge = '\n_⚡ Disponibilité à confirmer par notre conseiller_'
    }

    const titleLine = `*${titre}${loc ? ` — ${loc}` : ''}${prix ? ` · ${prix}` : ''}*`
    formattedItems.push(`${titleLine}\n${lien}${badge}`)
  }

  if (formattedItems.length === 0) return null

  return `Voici ce qui est disponible dans notre catalogue correspondant à votre recherche :

${formattedItems.join('\n\n')}

_Cliquez sur un lien pour voir les photos et tous les détails._

Merci de patienter, un conseiller commercial va prendre la relève pour la suite.`
}

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

  const system = (context
    ? `${SYSTEM_PROMPT_IMMOBILIER_CI}\n\n== CATALOGUE DES BIENS DISPONIBLES ==\n${context}`
    : SYSTEM_PROMPT_IMMOBILIER_CI) + FINAL_RULES_REMINDER

  // Garde-fou : limiter l'historique aux 6 derniers messages pour rester sous le budget tokens
  const trimmed = messages.length > 6 ? messages.slice(-6) : messages

  // Stage 1 — Groq (primary, ultra rapide)
  const groqResult = await groqFetch(trimmed, system)
  if (groqResult) {
    let cleaned = sanitizeOutput(groqResult)
    // Garde anti-oubli : si des biens étaient présents dans le catalogue mais que le LLM n'a inclus aucun lien
    if (context && context.includes('--- BIEN 1') && !cleaned.includes('http')) {
      console.warn('[Sapphire] LLM response lacked property links despite catalog presence -> applying deterministic presentation')
      const deterministic = formatDeterministicBiensReply(context)
      if (deterministic) cleaned = deterministic
    }
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
    let cleaned = sanitizeOutput(geminiResult)
    if (context && context.includes('--- BIEN 1') && !cleaned.includes('http')) {
      console.warn('[Sapphire] Gemini response lacked property links despite catalog presence -> applying deterministic presentation')
      const deterministic = formatDeterministicBiensReply(context)
      if (deterministic) cleaned = deterministic
    }
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
    let cleaned = sanitizeOutput(openRouterResult)
    if (context && context.includes('--- BIEN 1') && !cleaned.includes('http')) {
      console.warn('[Sapphire] OpenRouter response lacked property links despite catalog presence -> applying deterministic presentation')
      const deterministic = formatDeterministicBiensReply(context)
      if (deterministic) cleaned = deterministic
    }
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
  // Si le contexte contient des biens valides, on formate les fiches déterministement
  // plutôt que d'envoyer un message technique de panne !
  if (context && context.includes('--- BIEN 1')) {
    const deterministicReply = formatDeterministicBiensReply(context)
    if (deterministicReply) {
      logSapphireCall({
        route: 'fallback',
        latency_ms: Date.now() - startedAt,
        history_msgs,
        system_bytes: system.length,
        output_chars: deterministicReply.length,
      })
      return deterministicReply
    }
  }

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
  const system = (context
    ? `${SYSTEM_PROMPT_IMMOBILIER_CI}\n\n== CATALOGUE DES BIENS DISPONIBLES ==\n${context}`
    : SYSTEM_PROMPT_IMMOBILIER_CI) + FINAL_RULES_REMINDER;

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

  // Stage 2 — OpenRouter stream fallback (paid Qwen model)
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
