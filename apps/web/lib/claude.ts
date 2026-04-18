// lib/claude.ts
// Claude API — chatbot immobilier CI, scoring annonces, generation descriptions
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
- Maximum 3 suggestions par réponse.
- Termine souvent par une proposition d'aide supplémentaire ou de visite.`

// IA-03 : Scoring annonce — retourne JSON strict
const SYSTEM_PROMPT_SCORING = `Tu es un expert en marketing immobilier CI.
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
- Completude (25pts): surface, nb_pieces, equipements renseignes`

// IA-04 : Generation description — retourne texte marketing
const SYSTEM_PROMPT_DESCRIPTION = `Tu es un redacteur immobilier expert pour la Cote d'Ivoire.
Redige une description attractive et professionnelle pour cette annonce.
- 3 a 5 phrases, ton premium mais accessible
- Mentionne commune, surface, caracteristiques cles
- Utilise des formulations valorisantes adaptees au marche CI
- Termine par un appel a l'action soft
- UNIQUEMENT la description, sans titre ni entete`

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/**
 * IA-01 + IA-02 : Chatbot streaming — retourne ReadableStream pour SSE
 * L'appelant wrapper le stream dans une Response text/event-stream
 */
export async function chatImmobilierStream(messages: ChatMessage[], context?: string) {
  return client.messages.stream({
    model:      'claude-3-5-sonnet-20240620',
    max_tokens: 1024,
    system:     context 
      ? `${SYSTEM_PROMPT_IMMOBILIER_CI}\n\n[CONTEXTE DU BIEN ACTUEL] :\n${context}\nSert-toi de ces infos pour répondre aux questions sur ce bien.`
      : SYSTEM_PROMPT_IMMOBILIER_CI,
    messages,
  })
}

/** IA-03 : Score d'une annonce — retourne JSON parse */
export async function scorerAnnonce(bienData: Record<string, unknown>): Promise<{
  score: number
  niveau: string
  points_forts: string[]
  recommandations: string[]
  resume: string
}> {
  const res = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 512,
    system:     SYSTEM_PROMPT_SCORING,
    messages:   [{ role: 'user', content: JSON.stringify(bienData) }],
  })
  const text = res.content[0].type === 'text' ? res.content[0].text : '{}'
  try {
    return JSON.parse(text)
  } catch {
    return { score: 0, niveau: 'inconnu', points_forts: [], recommandations: ['Erreur analyse'], resume: '' }
  }
}

/** IA-04 : Generation description depuis caracteristiques bien */
export async function genererDescription(caracteristiques: Record<string, unknown>): Promise<string> {
  const res = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 512,
    system:     SYSTEM_PROMPT_DESCRIPTION,
    messages:   [{ role: 'user', content: JSON.stringify(caracteristiques) }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : ''
}
