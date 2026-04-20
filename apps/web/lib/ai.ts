// lib/ai.ts
// OpenRouter API — chatbot immobilier CI, scoring annonces, generation descriptions
// Modèle : google/gemma-4-26b-a4b-it:free

export const SYSTEM_PROMPT_IMMOBILIER_CI = `Tu es "Sapphire Intelligence", l'IA de conciergerie ultra-luxe de Deep Estate Sapphire.
Ton ton est celui d'un majordome de palace : distingué, précis, proactif et d'une courtoisie absolue.
Tu n'es pas un simple moteur de recherche, tu es un conseiller en art de vivre immobilier en Côte d'Ivoire.

MISSIONS :
1. ANALYSE : Si on te fournit un [CONTEXTE DE BIENS], utilise ces données réelles pour répondre.
2. LIENS : Pour chaque bien dont tu parles, tu DOIS inclure un lien vers sa fiche au format Markdown : [Voir ce bien](/biens/ID_DU_BIEN).
3. CONCIERGERIE : Tu peux proposer des services haut de gamme (Chef privé, Chauffeur de luxe, Sécurité rapprochée).
4. RECHERCHE : Si tu ne trouves pas de bien exact dans le catalogue fourni, propose une recherche globale : [Lancer une recherche complète](/recherche).

VOS RÉPONSES :
- Salutations distinguées (Ex: "Excellence", "Monsieur/Madame").
- Toujours mentionner Abidjan avec amour et expertise.
- Structurez vos réponses avec élégance.
- Si un client demande "quelque chose sur Cocody", regarde dans le contexte fourni s'il y a des biens à Cocody.

CONTACT PRIVILÉGIÉ :
Si le client semble prêt à visiter ou a besoin d'une assistance humaine immédiate, propose le WhatsApp Conciergerie : https://wa.me/2250102030405`;

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

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

/**
 * Chatbot streaming avec OpenRouter
 */
export async function chatImmobilierStream(messages: ChatMessage[], context?: string) {
  const systemMessage = context 
    ? `${SYSTEM_PROMPT_IMMOBILIER_CI}\n\n[CONTEXTE DU BIEN ACTUEL] :\n${context}\nSert-toi de ces infos pour répondre aux questions sur ce bien.`
    : SYSTEM_PROMPT_IMMOBILIER_CI;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://immodash.ci",
      "X-Title": "ImmoDash Pro",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      stream: true,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter Error Response:", errorText);
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error?.message || "Erreur OpenRouter API");
    } catch {
      throw new Error(`Erreur OpenRouter (${response.status}): ${errorText}`);
    }
  }

  return response.body; // Retourne le ReadableStream direct d'OpenRouter
}

/** Scoring d'une annonce */
export async function scorerAnnonce(bienData: Record<string, unknown>) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://immodash.ci",
      "X-Title": "ImmoDash Pro",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_SCORING },
        { role: 'user', content: JSON.stringify(bienData) }
      ],
    })
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(text);
  } catch {
    return { score: 0, niveau: 'inconnu', points_forts: [], recommandations: ['Erreur analyse'], resume: '' };
  }
}

/** Génération de description */
export async function genererDescription(caracteristiques: Record<string, unknown>) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://immodash.ci",
      "X-Title": "ImmoDash Pro",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_DESCRIPTION },
        { role: 'user', content: JSON.stringify(caracteristiques) }
      ],
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
