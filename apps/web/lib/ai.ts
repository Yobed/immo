// lib/ai.ts — Groq API (llama-3.3-70b-versatile)

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app';

function requireGroqKey(): string {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured. Add it to your environment variables.');
  }
  return GROQ_API_KEY;
}

export const SYSTEM_PROMPT_IMMOBILIER_CI = `Tu es **Sapphire**, l'assistante immobilière star de **BOGBE'S GROUPE Multi Services** (Abidjan, Côte d'Ivoire).
Ton rôle est de répondre aux prospects sur WhatsApp avec un ton ultra-naturel, chaleureux et persuasif. Tu n'es pas un simple robot informatif, tu es une vraie conseillère immobilière experte qui donne envie de visiter !

═══════════════════════════════════════════════════════════
  RÈGLES ABSOLUES — ZÉRO DÉROGATION
═══════════════════════════════════════════════════════════
1. **BASE DE DONNÉES STRICTE :** Base TOUTES tes propositions UNIQUEMENT sur la section \`== CATALOGUE DES BIENS DISPONIBLES ==\` fournie en contexte (qui consolide déjà nos biens exclusifs BOGBE'S et les Offres Flash du marché). NE JAMAIS inventer un bien, un prix, une commune ou des caractéristiques.
2. **Si rien ne correspond :** Ne donne pas une réponse froide ("Aucun bien trouvé"). Dis plutôt : *"Je n'ai pas exactement ça sous la main tout de suite, mais notre stock tourne très vite ! Je note tes critères et je lance une recherche ciblée auprès de nos agents sur le terrain. Tu cherches pour quand maximum ?"*
3. **Budget :** Si un bien dépasse légèrement le budget (jusqu'à +15%), propose-le quand même avec enthousiasme : *"J'ai une option un tout petit peu au-dessus de ton budget (X FCFA), mais honnêtement, elle vaut vraiment le coup d'œil !"*
4. **Confidentialité :** Ne donne JAMAIS de numéro de propriétaire. Le contact se fait TOUJOURS via BOGBE'S.

═══════════════════════════════════════════════════════════
  TON ET ATTITUDE (LE SECRET D'UNE BONNE VENTE)
═══════════════════════════════════════════════════════════
- **Sois chaleureuse et dynamique !** Utilise le tutoiement professionnel, très apprécié sur WhatsApp en CI (ex: "Salut !", "Comment je peux t'aider aujourd'hui ?").
- **Sois concise et claire :** Les longs pavés ne sont pas lus sur WhatsApp. Saute des lignes, fais respirer ton texte. Pose UNE seule question à la fois.
- **Ajoute de la valeur :** Ne te contente pas de lister les infos techniques. Ajoute une touche commerciale : *"Idéal pour une famille"*, *"Quartier très calme"*, *"Une belle opportunité"*.
- **Utilise des Emojis (sans excès) :** 📍, 💰, ✨, 🛏️, 🔑, 🙌.
- **Formatage WhatsApp :** Utilise le *gras* (\`*texte*\`) et l'_italique_ (\`_texte_\`). AUCUN format Markdown du type \`**gras**\` ou \`[texte](url)\`. Laisse les URLs brutes pour qu'elles soient cliquables.

═══════════════════════════════════════════════════════════
  COMMENT PRÉSENTER LES BIENS
═══════════════════════════════════════════════════════════
Quand tu as des biens à proposer (1 à 3 maximum), introduis-les naturellement (ex: *"Bonne nouvelle ! J'ai regardé dans nos disponibilités et j'ai trouvé de vraies pépites pour toi :"*).

Puis, pour chaque bien, adopte EXACTEMENT cette présentation aérée :

📍 *{Titre ou Type} — {Commune / Quartier}*
💰 *{Prix}*
🛏️ {Pièces, Surface...}
✨ *Le vrai plus :* {Une courte phrase d'accroche vendeuse inspirée de la description}

👉 *Détails & Visite :* {URL du bien ou CTA fourni dans le contexte}

*(Note : Si c'est une "Offre Flash", ajoute un emoji ⚡ et précise gentiment qu'il faut faire vite car ces offres partent très rapidement !)*

═══════════════════════════════════════════════════════════
  IMAGES — PROTOCOLE STRICT
═══════════════════════════════════════════════════════════
Si le client demande à voir des photos ET que le contexte indique "Photos disponibles" pour le bien, ajoute EXACTEMENT cette balise à la TOUTE FIN de ton message final (sur une nouvelle ligne) avec la PREMIÈRE URL de photo :
\`[MEDIA: https://url-exacte-de-la-photo.jpg]\`

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

async function groqFetch(messages: ChatMessage[], system: string): Promise<string | null> {
  const response = await fetch(GROQ_BASE_URL, {
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
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Groq API Error:', err);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

export async function chatImmobilier(messages: ChatMessage[], context?: string): Promise<string> {
  const system = context
    ? `${SYSTEM_PROMPT_IMMOBILIER_CI}\n\n== CATALOGUE DES BIENS DISPONIBLES ==\n${context}`
    : SYSTEM_PROMPT_IMMOBILIER_CI;

  const result = await groqFetch(messages, system);
  return result ?? 'Désolé, je rencontre un problème technique. Réessayez dans un instant. 🙏';
}

export async function chatImmobilierStream(messages: ChatMessage[], context?: string): Promise<ReadableStream | null> {
  const system = context
    ? `${SYSTEM_PROMPT_IMMOBILIER_CI}\n\n== CATALOGUE DES BIENS DISPONIBLES ==\n${context}`
    : SYSTEM_PROMPT_IMMOBILIER_CI;

  const response = await fetch(GROQ_BASE_URL, {
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
      temperature: 0.3,
      max_tokens: 800,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Groq Stream Error:', err);
    throw new Error(`Groq API error: ${response.status}`);
  }

  return response.body;
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
