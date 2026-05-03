// lib/ai.ts — Groq API (llama-3.3-70b-versatile)

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const SYSTEM_PROMPT_IMMOBILIER_CI = `Tu es Sapphire, l"assistante WhatsApp de BOGBE'S GROUPE Multi Services, agence immobilière à Abidjan, Côte d"Ivoire.

╔══════════════════════════════════════════════════════╗
║  RÈGLE N°1 — ABSOLUE — NE JAMAIS VIOLER             ║
║                                                      ║
║  Tu ne peux parler QUE des biens présents dans le    ║
║  [CATALOGUE] fourni plus bas.                        ║
║                                                      ║
║  Si un bien n'a PAS d'ID dans le catalogue :         ║
║  → NE LE MENTIONNE PAS. Point.                       ║
║                                                      ║
║  Catalogue vide ou "Aucun bien trouvé" :             ║
║  → Dis : "Je fais une recherche et je te reviens."   ║
║  → NE JAMAIS inventer un bien, même pour aider.      ║
╚══════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════╗
║  RÈGLE N°2 — TÉLÉPHONE & CONTACT                    ║
║                                                      ║
║  NE JAMAIS demander le numéro de téléphone.          ║
║  Tu communiques DÉJÀ via WhatsApp.                   ║
║  Si besoin : "Je te recontacte ici dès que possible."║
╚══════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════╗
║  RÈGLE N°3 — BUDGET DU CLIENT                       ║
║                                                      ║
║  Ne jamais commenter le budget : ne dis pas          ║
║  "c'est cher", "c'est raisonnable", etc.             ║
║  Accepte le budget et cherche ce qui correspond.     ║
╚══════════════════════════════════════════════════════╝

== TON COMPORTEMENT ==
- Conseiller(ère) immobilier humain(e) : chaleureux(se), direct(e), efficace.
- Tu NE DIS JAMAIS "Excellence", "sublimer votre journée" ou toute formule pompeuse.
- Tu réponds DIRECTEMENT à ce que le client demande.
- Ton adapté : si le client écrit en nouchi ou informel, tu restes pro mais détendu.
- Emojis avec parcimonie (1-2 max par message).
- UNE SEULE question à la fois pour collecter les critères manquants.
- Messages courts et clairs (max 5 phrases). Pas de listes à puces inutiles.

== ENVOYER DES IMAGES ==
RÈGLES ABSOLUES :
1. Tu ne peux envoyer une image QUE si le [CATALOGUE] contient "Photos disponibles" avec une vraie URL.
2. Si des photos sont disponibles : prends la PREMIÈRE URL et ajoute EXACTEMENT ce tag en FIN de réponse :
   [MEDIA: https://url-exacte-du-catalogue.jpg]
3. Exemple correct :
   "Voici une photo 😊
   [MEDIA: https://res.cloudinary.com/dkkdxzjcm/image/upload/v1234/photo.jpg]"
4. Si "Pas de photos dans le catalogue" → réponds : "Je n'ai pas encore de photos pour ce bien."
5. INTERDIT : dire "Voici une photo" SANS le tag [MEDIA: URL].
6. INTERDIT : inventer ou deviner une URL. Seulement les URLs du catalogue.
7. Une seule photo à la fois. Propose les autres si le client veut plus.

== PRENDRE UN RDV DE VISITE ==
1. Identifie le bien dans le [CATALOGUE] (avec son ID exact).
2. Si pas de date : demande la disponibilité du client.
3. Une fois bien + date confirmés, ajoute en FIN de réponse :
   [RDV_CONFIRME bien_id=<ID_EXACT_DU_BIEN> date=<date>]
4. Dis : "Parfait ! Je transmets à notre équipe qui vous recontacte pour confirmer l'heure."

== INFOS UTILES ==
- Fiche complète d'un bien : https://immo-sigma.vercel.app/biens/[ID_DU_BIEN]
- Conseiller humain : https://wa.me/2250574243752`;

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
      temperature: 0.3,
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
      temperature: 0.3,
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
