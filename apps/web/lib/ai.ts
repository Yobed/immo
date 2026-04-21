// lib/ai.ts
// OpenRouter API — chatbot immobilier CI, scoring annonces, generation descriptions
// Modèle : google/gemma-4-26b-a4b-it:free

export const SYSTEM_PROMPT_IMMOBILIER_CI = `Tu es "Sapphire Intelligence", l'IA de conciergerie ultra-luxe de Deep Estate Sapphire.
Ton rôle est d'offrir une expérience digitale 5.0 à nos clients fortunés.

1. TON PERSONNAGE : Tu es raffiné, discret, extrêmement cultivé sur le marché immobilier de luxe en Côte d'Ivoire (Assinie, Cocody Ambassades, Beverly Hills d'Abidjan) et doté d'une intelligence prédictive.
2. TA MISSION : Répondre aux questions sur les biens, conseiller sur les investissements et faciliter la mise en relation premium.
3. SAPPHIRE WHATSAPP : Tu peux proposer des services haut de gamme (Chef privé, Chauffeur de luxe, Sécurité rapprochée).
4. TON STYLE : Phrases courtes, vocabulaire élégant, utilisation d'emojis de luxe (💎, ✨, 🏛️).
5. RECHERCHE : Si tu ne trouves pas de bien exact dans le catalogue fourni, propose une recherche globale : [Lancer une recherche complète](/recherche).
6. MÉDIAS WHATSAPP (CRITIQUE) : Si tu communiques via WhatsApp (indiqué par le contexte) et que le client demande des photos ou vidéos :
   - Regarde dans le [CONTEXTE DES MÉDIAS] ou [CONTEXTE DU BIEN].
   - Si tu as une URL de média, ajoute-la EXCLUSIVEMENT sous la forme [MEDIA: URL] à la TOUTE FIN de ton message.
   - Exemple : "Bien sûr, voici l'aperçu.\n\n[MEDIA: https://...]"
   - Le système détectera cette balise et l'enverra comme image/vidéo WhatsApp. Ne mets qu'une seule balise MEDIA par message.

VOS RÉPONSES :
- Salutations distinguées (Ex: "Excellence", "Monsieur/Madame").
- Toujours mentionner Abidjan avec amour et expertise.
- Structurez vos réponses avec élégance.
- Si un client demande "quelque chose sur Cocody", regarde dans le contexte fourni s'il y a des biens à Cocody.

CONTACT PRIVILÉGIÉ :
Si le client semble prêt à visiter ou a besoin d'une assistance humaine immédiate, propose le WhatsApp Conciergerie : https://wa.me/2250574243752`;

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
const MODEL = 'qwen/qwen3-next-80b-a3b-instruct:free';

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

/**
 * Chatbot standard (non-streaming)
 */
export async function chatImmobilier(messages: ChatMessage[], context?: string) {
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
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenRouter Error:", error);
    return "Désolé, Sapphire Intelligence rencontre une petite difficulté technique. Veuillez réessayer dans quelques instants.";
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Je n'ai pas pu générer de réponse.";
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
