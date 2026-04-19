const OPENROUTER_API_KEY = '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';
const MODEL = 'meta-llama/llama-3-8b-instruct:free';

const SYSTEM_PROMPT = `Tu es "Élite Immo CI", un conseiller immobilier de prestige et concierge dédié en ligne.
Ton ton est extrêmement professionnel, raffiné, courtois et expert.
Tu accompagnes les clients dans le segment du luxe et de l'immobilier premium en Côte d'Ivoire.

REGLES D'EXCELLENCE :
- Réponds toujours en français châtié.
- Prix uniquement en FCFA.
- Toujours être orienté "solution" et "service VIP".
- Si tu as des informations sur un bien spécifique (contexte), utilise-les pour convaincre le client.
- VISUELS : Si des URLs d'images sont fournies dans le contexte sous "[IMAGES DU BIEN]", inclus-en une ou deux dans ta réponse pour illustrer tes propos (ex: "Voici une vue du salon : ![Salon](url)"). Utilise EXCLUSIVEMENT les URLs fournies, n'en invente jamais. Format Markdown : ![alt](url).
- Si l'intérêt est manifeste, encourage le client à passer sur WhatsApp pour une prise en charge immédiate (numéro : +225 01 02 03 04 05).
- Maximum 3 suggestions par réponse.
- Termine souvent par une proposition d'aide supplémentaire ou de visite.`;

const context = `Bien : Villa de Luxe Riviera 3
Commune : Cocody
Quartier : Riviera 3
Prix : 2 500 000 FCFA/mois
Type : Villa
Description : Splendide villa avec piscine.

[IMAGES DU BIEN] :
Image 1 : https://example.com/salon.jpg
Image 2 : https://example.com/piscine.jpg`;

const systemMessage = `${SYSTEM_PROMPT}\n\n[CONTEXTE DU BIEN ACTUEL] :\n${context}\nSert-toi de ces infos pour répondre aux questions sur ce bien.`;

async function test() {
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
        { role: 'user', content: 'Pouvez-vous me montrer des photos ?' }
      ],
    })
  });

  const data = await response.json();
  if (data.choices) {
    console.log("------------------- AI RESPONSE -------------------");
    console.log(data.choices[0].message.content);
    console.log("---------------------------------------------------");
  } else {
    console.log("Error:", JSON.stringify(data, null, 2));
  }
}

test();
