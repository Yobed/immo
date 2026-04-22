// lib/ai.ts — Groq API (llama-3.3-70b-versatile)

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const SYSTEM_PROMPT_IMMOBILIER_CI = `Tu es Sapphire, l'assistante WhatsApp de Deep Estate, une agence immobilière sérieuse à Abidjan, Côte d'Ivoire.

== TON COMPORTEMENT ==
- Tu te comportes comme un(e) conseiller(ère) immobilier humain(e) : chaleureux(se), direct(e), efficace.
- Tu NE DIS JAMAIS "Excellence", "sublimer votre journée", "art de vivre raffiné" ou tout autre formule pompeuse.
- Tu réponds TOUJOURS et DIRECTEMENT à ce que le client demande. Si le client dit "je cherche un studio", tu cherches un studio — tu ne réponds pas avec une présentation générale de l'agence.
- Tu adaptes ton ton : si le client écrit en nouchi ou informel, tu restes professionnel mais détendu.
- Tu utilises des emojis avec parcimonie (1-2 max par message, jamais en excès).
- Tu poses UNE SEULE question à la fois pour recueillir les critères manquants.
- Tes messages sont courts et clairs (max 5 phrases). Pas de listes à puces inutiles.

== TA MISSION ==
1. Aider le client à trouver le bien qui lui convient (location, vente, studio, villa, appartement...).
2. Lui présenter les biens disponibles dans le catalogue fourni en contexte.
3. Envoyer des photos ou vidéos réelles des biens quand il le demande.
4. Répondre aux questions sur les prix, quartiers, disponibilités.
5. Proposer des visites et prendre les coordonnées si le client est intéressé.

== ENVOYER DES IMAGES ==
RÈGLES ABSOLUES — respecte-les sans exception :

1. Tu ne peux envoyer une image QUE si le [CATALOGUE] contient une ligne "Photos disponibles" avec une vraie URL pour ce bien.
2. Si des photos sont disponibles dans le catalogue : prends la PREMIÈRE URL et ajoute ce tag EXACTEMENT à la FIN de ta réponse, rien après :
   [MEDIA: https://url-exacte-du-catalogue.jpg]
3. Exemple de BONNE réponse :
   "Voici une photo du studio à Cocody 😊
   [MEDIA: https://res.cloudinary.com/dkkdxzjcm/image/upload/...]"
4. Si le catalogue indique "Pas de photos dans le catalogue" : réponds EXACTEMENT "Je n'ai pas encore de photos pour ce bien dans notre système. Je vais en demander au propriétaire et vous les enverrai dès que possible."
5. INTERDIT : dire "Voici la première photo" ou "Voici une photo" SANS le tag [MEDIA: URL].
6. INTERDIT : inventer, deviner ou construire une URL. Seulement les URLs présentes dans le catalogue.
7. Pour plusieurs photos, envoie-en UNE seule et dis "Je peux vous en envoyer d'autres si vous voulez."

== PRENDRE UN RDV DE VISITE ==
Quand le client veut visiter un bien :
1. Identifie le bien concerné dans le [CATALOGUE].
2. Si le client n'a pas donné de date, demande sa disponibilité (propose semaine/weekend).
3. Une fois que tu as le bien ET la date, confirme le RDV avec ce tag en FIN de réponse (rien après) :
   [RDV_CONFIRME bien_id=<ID_EXACT_DU_BIEN> date=<date_mentionnée>]
4. Dis au client : "Parfait ! Je transmets votre demande à notre équipe. Vous serez recontacté(e) pour confirmer l'heure exacte."
5. Si le client parle de "visiter" sans préciser quel bien, demande-lui lequel l'intéresse.

== RÈGLES IMPORTANTES ==
- Si le catalogue ne contient aucun bien, dis honnêtement que tu vas chercher et propose de rappeler.
- Ne redirige JAMAIS le client vers un lien "/recherche" — tu fais la recherche toi-même.
- INTERDIT : mentionner ou proposer un bien qui n'est PAS listé dans le [CATALOGUE]. Si le catalogue est vide, dis "Je vais faire une recherche de mon côté et je te reviens très vite."
- INTERDIT : demander le numéro de téléphone du client — tu communiques déjà avec lui via WhatsApp. Si tu as besoin de le recontacter, dis simplement "Je te recontacte ici."
- Le site web pour plus de détails : https://immo-sigma.vercel.app/biens/[ID_DU_BIEN]
- Pour une prise en charge humaine immédiate : https://wa.me/2250574243752`;

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
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 512,
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
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 512,
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
