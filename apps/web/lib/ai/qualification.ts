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
  if (/(aux?\s+)?alentours?\s+(d['’]|de\s+)?abidjan|autour\s+d['’]abidjan|p[ée]riph[ée]rie(\s+d['’]abidjan)?/i.test(t)) {
    return "Périphérie d'Abidjan"
  }
  for (const q of QUARTIERS_ZONE) {
    if (t.includes(q)) return q.charAt(0).toUpperCase() + q.slice(1)
  }
  return null
}

// Phrases d'une recherche FRAÎCHE et distincte (§16-17 / Règle 7)
export const FRESH_SEARCH_RE =
  /\b(un(e)?\s+autre\s+(bien|villa|appartement|maison|studio|terrain|recherche)|autre\s+chose|nouvelle\s+recherche|je\s+recommence|reprendre\s+[àa]\s+z[ée]ro|je\s+cherche\s+autre|change[rz]?\s+de\s+recherche)\b/i

export function detectTransaction(
  text: string,
  budget?: number | null,
  propertyType?: string | null,
): 'location' | 'achat' | null {
  const t = text.toLowerCase()
  if (/\b(louer|location|en\s+location|loyer|bail|lou[ée])\b|[àa]\s+lou[ée]r?/.test(t)) return 'location'
  if (/\b(acheter|achat|vente|acqu[ée]rir|acquisition)\b|[àa]\s+vendre/.test(t)) return 'achat'
  // En Côte d'Ivoire, un budget <= 5 000 000 FCFA pour une maison/villa/appartement sans mention d'achat
  // correspond à un loyer mensuel et non à une acquisition immobilière (qui démarre à 15-20M+).
  if (budget != null && budget > 0 && budget <= 5_000_000 && propertyType !== 'terrain') {
    return 'location'
  }
  return null
}

/**
 * Règle 6 : Détection de l'intention de recherche client (vs proposition de bien).
 * Un client qui recherche un bien ne doit JAMAIS recevoir le message partenaire.
 */
export function isClientSearchIntent(text: string): boolean {
  const t = text.toLowerCase()

  // Si c'est un propriétaire/bailleur cherchant des clients ou locataires
  if (/\b(cherche|trouver)\s+(un|des)?\s*(locataire|locataires|client|clients|acheteur|acheteurs|preneur|preneurs)\b/i.test(t)) {
    return false
  }

  const searchPhrases = [
    /\b(je\s+cherche|cherche|je\s+recherche|recherche|on\s+cherche|nous\s+cherchons)\b/i,
    /\b(je\s+suis\s+[àa]\s+la\s+recherche|en\s+qu[êe]te\s+d['’])\b/i,
    /\b(je\s+veux|je\s+voudrais|j['’]aimerais|je\s+souhaite|souhaiterais)\s+(louer|acheter|visiter|trouver|avoir|prendre|emm[ée]nager|un|une|des|ce|le|la|habiter)\b/i,
    /\b(besoin\s+d['’](un|une|des)?\s*(bien|appartement|villa|maison|studio|duplex|terrain|logement|bureau|local|chambre|toit))\b/i,
    /\b(trouver\s+(un|une|des)\s+(bien|appartement|villa|maison|studio|duplex|terrain|logement))\b/i,
    /\b(avez[-\s]vous|est[-\s]ce\s+que\s+vous\s+avez|auriez[-\s]vous)\b/i,
    /\b(mon\s+budget|notre\s+budget|budget\s*[:=]?\s*\d+)\b/i,
    /\b(pour\s+(y\s+)?habiter|pour\s+emm[ée]nager|pour\s+mon\s+s[ée]jour)\b/i,
  ]

  return searchPhrases.some((p) => p.test(t))
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
  const transaction = detectTransaction(isFresh ? message : combined, budget, propertyType)

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
export function buildQualifReminder(
  missing: ('type' | 'zone' | 'budget')[],
  known?: { propertyType?: string | null; zone?: string | null; budget?: number | null },
): string {
  const acknowledgments: string[] = []
  if (known?.propertyType) acknowledgments.push(`votre recherche de **${known.propertyType}**`)
  if (known?.zone) acknowledgments.push(`dans le secteur de **${known.zone}**`)
  if (known?.budget) acknowledgments.push(`avec un budget d'environ **${known.budget.toLocaleString('fr-FR')} FCFA**`)

  let intro = ''
  if (acknowledgments.length > 0) {
    intro = `C'est bien noté pour ${acknowledgments.join(', ')} ! 🙏\n\n`
  }

  const items: string[] = []
  if (missing.includes('type')) items.push('🔹 Quel type de bien souhaitez-vous ? (appartement, villa, studio, terrain...)')
  if (missing.includes('zone')) items.push('🔹 Dans quelle zone recherchez-vous ? (commune ou quartier)')
  if (missing.includes('budget')) items.push('🔹 Quel est votre budget maximum ?')
  return `${intro}Pour que je puisse vous proposer les biens les plus adaptés, merci de m'indiquer également :\n\n${items.join('\n')}`
}

/** Message de relance par défaut (si les 3 critères manquent) */
export const QUALIF_REMINDER_MESSAGE = buildQualifReminder(['type', 'zone', 'budget'])

/** Règle 4 : Message strict envoyé lorsqu'aucun bien ne correspond aux critères */
export const NO_RESULTS_MESSAGE = `Merci pour ces informations 🙏

Nous avons bien enregistré votre recherche. Un conseiller client va vous contacter d’ici peu pour vous faire des propositions adaptées.

À très bientôt ! 🤝`
