import { parseSearchQuery } from '../searchParser.ts'

/**
 * Moteur de qualification déterministe (Cahier des règles Sapphire).
 * Détermine si les 3 infos obligatoires (TYPE + ZONE + BUDGET) sont réunies —
 * en code strict, pas via l'IA (règle métier prime sur l'IA).
 */

// Quartiers reconnus comme « zone » (le parseur ne connaît que les communes).
export const QUARTIERS_ZONE = [
  'angré', 'angre', 'riviera', 'bonoumin', 'palmeraie', 'deux plateaux', '2 plateaux',
  'vallon', 'cocovico', 'synacass', 'akouédo', 'akouedo', 'danga', 'zone 4', 'biétry', 'bietry',
  'anoumabo', 'niangon', 'selmer', 'toits rouges', 'vridi', 'gonzagueville', 'abatta',
  'bonoua', 'faya', 'bracodi', 'sicogi', 'attoban', 'château', 'chateau', 'djorobite', 'djorobité',
  'bassam', 'grand-bassam', 'songon', 'anyama', 'bingerville',
]

export function detectQuartierZone(text: string): string | null {
  const t = text.toLowerCase()
  for (const q of QUARTIERS_ZONE) {
    if (t.includes(q)) return q.charAt(0).toUpperCase() + q.slice(1)
  }
  return null
}

// Phrases d'une recherche FRAÎCHE et distincte (§16-17 / Règle 7)
export const FRESH_SEARCH_RE =
  /\b(un(e)?\s+autre\s+(bien|villa|appartement|maison|studio|terrain|recherche)|autre\s+chose|nouvelle\s+recherche|je\s+recommence|reprendre\s+[àa]\s+z[ée]ro|je\s+cherche\s+autre|change[rz]?\s+de\s+recherche)\b/i

export function detectTransaction(text: string): 'location' | 'achat' | null {
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
  missing: ('type' | 'zone' | 'budget')[]
}

/**
 * Accumule les critères sur le message courant + l'historique récent du client.
 * Si isNewSession ou recherche fraîche -> historique ignoré (pas de mélange de critères).
 */
export function qualify(
  message: string,
  history?: { role: string; content: string }[],
  options?: { isNewSession?: boolean },
): Qualification {
  const isFresh = options?.isNewSession || FRESH_SEARCH_RE.test(message)
  const recentUser = isFresh
    ? []
    : (history ?? []).filter((m) => m.role === 'user').slice(-8).map((m) => m.content)
  const combined = [message, ...recentUser].join('  ')

  const pMsg = parseSearchQuery(message)
  const pAll = parseSearchQuery(combined)

  const propertyType = isFresh ? (pMsg.type_bien ?? null) : (pMsg.type_bien || pAll.type_bien || null)
  const zone = isFresh
    ? (pMsg.commune || detectQuartierZone(message) || null)
    : (pMsg.commune || detectQuartierZone(message) || pAll.commune || detectQuartierZone(combined) || null)
  const budgetStr = isFresh ? pMsg.prix_max : (pMsg.prix_max || pAll.prix_max)
  const budget = budgetStr ? parseInt(budgetStr, 10) : null
  const transaction = detectTransaction(isFresh ? message : combined)

  const missing: ('type' | 'zone' | 'budget')[] = []
  if (!propertyType) missing.push('type')
  if (!zone) missing.push('zone')
  if (budget == null) missing.push('budget')

  return { transaction, propertyType, zone, budget, hasAll3: missing.length === 0, missing }
}

// ─── Messages fixes stricts (Cahier des 7 règles) ──────────────────────────

/** Règle 1 : Message de bienvenue envoyé automatiquement au nouveau prospect */
export const WELCOME_MESSAGE = `🏡 Bienvenue chez Bogbe’s Groupe Immobilier !

Pour mieux vous accompagner, merci de nous préciser :

🔹 Recherchez-vous un bien à louer ou à acheter ?
🔹 Quel type de bien souhaitez-vous ?
🔹 Dans quelle zone recherchez-vous ?
🔹 Quel est votre budget maximum ?
🔹 À quelle date souhaitez-vous disposer du bien ?

🌐 Vous pouvez également consulter directement nos annonces ici :
https://bogbesgroup.com

Votre futur bien est peut-être déjà disponible ! 🔑`

/** Marqueur unique de la relance qualification (pour détecter « déjà envoyée ») */
export const QUALIF_REMINDER_MARKER = /proposer les biens les plus adapt[ée]s/i

/** Règle 2 : Relance unique ciblée sur les éléments manquants */
export function buildQualifReminder(missing: ('type' | 'zone' | 'budget')[]): string {
  const items: string[] = []
  if (missing.includes('type')) items.push('🔹 Quel type de bien souhaitez-vous ? (appartement, villa, studio, terrain...)')
  if (missing.includes('zone')) items.push('🔹 Dans quelle zone recherchez-vous ? (commune ou quartier)')
  if (missing.includes('budget')) items.push('🔹 Quel est votre budget maximum ?')
  return `Pour que je puisse vous proposer les biens les plus adaptés, merci de m'indiquer également :\n\n${items.join('\n')}`
}

/** Message de relance par défaut (si les 3 critères manquent) */
export const QUALIF_REMINDER_MESSAGE = buildQualifReminder(['type', 'zone', 'budget'])

/** Règle 4 : Message strict envoyé lorsqu'aucun bien ne correspond aux critères */
export const NO_RESULTS_MESSAGE = `Merci pour ces informations 🙏

Nous avons bien enregistré votre recherche. Un conseiller client va vous contacter d’ici peu pour vous faire des propositions adaptées.

À très bientôt ! 🤝`
