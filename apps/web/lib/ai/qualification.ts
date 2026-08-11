import { parseSearchQuery } from '@/lib/searchParser'

/**
 * Moteur de qualification déterministe (Cahier des règles Sapphire).
 * Détermine si les 3 infos obligatoires (TYPE + ZONE + BUDGET) sont réunies —
 * en code, pas via l'IA (règle 24 : une règle métier prime sur l'IA).
 */

// Quartiers reconnus comme « zone » (le parseur ne connaît que les communes).
const QUARTIERS_ZONE = [
  'angré', 'angre', 'riviera', 'bonoumin', 'palmeraie', 'deux plateaux', '2 plateaux',
  'vallon', 'cocovico', 'synacass', 'akouédo', 'danga', 'zone 4', 'biétry', 'bietry',
  'anoumabo', 'niangon', 'selmer', 'toits rouges', 'vridi', 'gonzagueville', 'abatta',
  'bonoua', 'faya', 'bracodi', 'sicogi', 'attoban', 'château', 'chateau',
]

function detectQuartierZone(text: string): string | null {
  const t = text.toLowerCase()
  for (const q of QUARTIERS_ZONE) if (t.includes(q)) return q.charAt(0).toUpperCase() + q.slice(1)
  return null
}

function detectTransaction(text: string): 'location' | 'achat' | null {
  const t = text.toLowerCase()
  if (/\b(louer|location|à louer|en location|loyer|bail)\b/.test(t)) return 'location'
  if (/\b(acheter|achat|à vendre|vente|acqu[ée]rir|acquisition)\b/.test(t)) return 'achat'
  return null
}

export interface Qualification {
  transaction: 'location' | 'achat' | null
  propertyType: string | null
  zone: string | null
  budget: number | null
  hasAll3: boolean
  missing: string[]
}

/**
 * Accumule les critères sur le message courant + l'historique récent du client.
 * (Le message courant est prioritaire pour chaque champ.)
 */
export function qualify(message: string, history?: { role: string; content: string }[]): Qualification {
  const recentUser = (history ?? []).filter((m) => m.role === 'user').slice(-8).map((m) => m.content)
  const combined = [message, ...recentUser].join('  ')

  const pMsg = parseSearchQuery(message)
  const pAll = parseSearchQuery(combined)

  const propertyType = pMsg.type_bien || pAll.type_bien || null
  const zone = pMsg.commune || detectQuartierZone(message) || pAll.commune || detectQuartierZone(combined) || null
  const budgetStr = pMsg.prix_max || pAll.prix_max
  const budget = budgetStr ? parseInt(budgetStr, 10) : null
  const transaction = detectTransaction(combined)

  const missing: string[] = []
  if (!propertyType) missing.push('type')
  if (!zone) missing.push('zone')
  if (budget == null) missing.push('budget')

  return { transaction, propertyType, zone, budget, hasAll3: missing.length === 0, missing }
}

// ─── Messages fixes (Cahier des règles) ──────────────────────────────────────

/** Marqueur unique de la relance qualification (pour détecter « déjà envoyée »). */
export const QUALIF_REMINDER_MARKER = /obligatoirement besoin de ces 3 informations/i

export const WELCOME_MESSAGE = `Bienvenue chez BOGBE'S GROUPE Immobilier ! 🏠

Pour mieux vous accompagner, précisez-moi :
• Location ou achat ?
• Le type de bien (appartement, villa, studio, terrain…)
• La zone (commune ou quartier)
• Votre budget maximum
• La date souhaitée

Vous pouvez aussi consulter nos annonces : https://www.bogbesgroup.com`

export const QUALIF_REMINDER_MESSAGE = `Merci 🙏

Pour vous proposer des biens qui correspondent vraiment, nous avons obligatoirement besoin de ces 3 informations :

🏠 Le type de bien
📍 La zone souhaitée
💰 Votre budget maximum

Merci de me communiquer ce qui manque pour poursuivre votre recherche.`

export const NO_RESULTS_MESSAGE = `Merci pour ces informations 🙏

Votre recherche est bien enregistrée. Un conseiller va vous contacter pour la prendre en charge et poursuivre les recherches avec vous.

Vous pouvez aussi consulter nos annonces : https://www.bogbesgroup.com

_Votre futur bien est peut-être déjà disponible !_`
