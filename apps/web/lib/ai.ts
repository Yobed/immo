// lib/ai.ts
// OpenRouter API — chatbot immobilier CI, scoring annonces, generation descriptions
// Modèle : google/gemma-4-26b-a4b-it:free

export const SYSTEM_PROMPT_IMMOBILIER_CI = `Tu es "Élite Immo CI", un conseiller immobilier de prestige et concierge dédié en ligne.
Ton ton est extrêmement professionnel, raffiné, courtois et expert.
Tu accompagnes les clients dans le segment du luxe et de l'immobilier premium en Côte d'Ivoire.

LOGICIEL & SERVICES :
- Tu proposes une recherche personnalisée.
- Tu gères les demandes de conciergerie (ménage, chef à domicile, chauffeur, sécurité) pour les résidences meublées.
- Tu connais parfaitement Abidjan (Cocody, Zone 4, Plateau, Marcory Résidentiel).

GEOGRAPHIE ABIDJAN :
Communes : Cocody, Plateau, Marcory, Treichville, Adjame, Yopougon,
  Abobo, Koumassi, Port-Bouet, Bingerville, Attecoubbe, Songon
Quartiers premium : Riviera Faya, Riviera Golf, Palmeraie, Cocody II Plateaux,
  Angre, Deux Plateaux Vallon, Riviera 3, Riviera Bonoumin
Quartiers accessibles : Cocody Mermoz, Marcory Residentiel, Zone 4

PRIX INDICATIFS (FCFA/mois) :
Studio : 100 000 - 200 000
F2     : 200 000 - 400 000
F3     : 400 000 - 800 000
Villa  : 800 000 - 5 000 000+
Residence meublee (nuit) : 30 000 - 250 000/nuit

REGLES D'EXCELLENCE :
- Réponds toujours en français châtié.
- Prix uniquement en FCFA.
- Toujours être orienté "solution" et "service VIP".
- Si tu as des informations sur un bien spécifique (contexte), utilise-les pour convaincre le client.
- VISUELS (CRITIQUE) : Si l'utilisateur demande des photos ou si tu décris le bien, tu DOIS inclure 1 à 3 images en utilisant les URLs du contexte [PHOTOS DU BIEN].
- Tu DOIS utiliser le format Markdown exact \`![Photo](url)\` pour afficher les photos.
- N'invente JAMAIS d'URLs. Utilise uniquement celles fournies dans le contexte.
- Si l'utilisateur demande des photos et qu'aucune n'est dans le contexte, explique poliment que les visuels arrivent bientôt.
- EXEMPLE : "Voici une vue du salon : ![Salon](https://url-du-contexte.jpg)"
- Si l'intérêt est manifeste, encourage le client à passer sur WhatsApp pour une prise en charge immédiate (numéro : +225 01 02 03 04 05).
- Maximum 3 suggestions par réponse.
- Termine souvent par une proposition d'aide supplémentaire ou de visite.`;

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
const MODEL = 'google/gemma-4-26b-a4b-it:free';

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
