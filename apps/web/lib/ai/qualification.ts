import { parseSearchQuery } from '../searchParser.ts'

/**
 * Moteur de qualification déterministe (Cahier des règles Sapphire).
 * Détermine si les 3 infos obligatoires (TYPE + ZONE + BUDGET) sont réunies —
 * en code strict, pas via l'IA (règle métier prime sur l'IA).
 */

// Quartiers reconnus comme « zone » (le parseur ne connaît que les communes).
export const QUARTIERS_ZONE = [
  'angrée', 'angré', 'angre', 'belle ville', 'belleville', 'aboboté', 'abobote',
  'riviera golf', 'riviera 2', 'riviera 3', 'riviera 4', 'riviera palmeraie', 'riviera bonoumin',
  'riviera faya', 'riviera', 'bonoumin', 'palmeraie', 'deux plateaux', '2 plateaux',
  'vallon', 'cocovico', 'synacass', 'akouédo', 'akouedo', 'danga', 'zone 4', 'biétry', 'bietry',
  'anoumabo', 'niangon', 'selmer', 'toits rouges', 'toit rouge', 'maroc', 'anador', 'sopim',
  'ananeraie', 'sideci', 'banco', 'gesco', 'azito', 'wassakara', 'andokoi', 'kouté', 'koute',
  'millionnaire', 'koweit', 'koweït', 'pk18', 'pk 18', 'avocatier', 'ndotre', 'n\'dotré', 'ndotré',
  'jules verne', 'cite ado', 'cité ado', 'remblais', 'sogephia', 'williamsville', 'paillet',
  'vridi', 'gonzagueville', 'abatta', 'bonoua', 'faya', 'bracodi', 'sicogi', 'attoban',
  'château', 'chateau', 'djorobite', 'djorobité', 'dokui', 'gestoci', 'mahou',
  '7e tranche', '8e tranche', '9e tranche', '7ème tranche', '8ème tranche', '9ème tranche',
  'bassam', 'grand-bassam', 'songon', 'anyama', 'bingerville', 'm\'badon', 'mbadon', 'mpouto', 'm\'pouto',
]

export function detectQuartierZone(text: string): string | null {
  const t = text.toLowerCase()
  if (/(aux?\s+)?alentours?\s+(d['’]|de\s+)?abidjan|autour\s+d['’]abidjan|p[ée]riph[ée]rie(\s+d['’]abidjan)?/i.test(t)) {
    return "Périphérie d'Abidjan"
  }
  for (const q of QUARTIERS_ZONE) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(?:^|[^a-z0-9éèêëàâîïôùûç])(${escaped})(?:$|[^a-z0-9éèêëàâîïôùûç])`, 'i')
    if (re.test(t)) {
      if (q === 'angrée' || q === 'angre') return 'Angré'
      if (q === 'belleville') return 'Belle ville'
      if (q === 'abobote') return 'Aboboté'
      if (q === 'toit rouge') return 'Toits rouges'
      if (q === 'koweit') return 'Koweït'
      return q.charAt(0).toUpperCase() + q.slice(1)
    }
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
 * Signaux d'ANNONCE immobilière entrante : un agent/propriétaire/démarcheur
 * qui CONFIE ou PUBLIE un bien, à ne jamais traiter comme un prospect en recherche.
 */
export function listingSignals(text: string): number {
  let score = 0
  if (/\b[àa]\s+(louer|vendre)\b|\b(en\s+vente|mise\s+en\s+vente|en\s+location|disponibles?|dispo)\b/i.test(text)) score++
  if (
    /\d[\d\s.,]*\s*(fcfa|f\s?cfa|francs?|millions?|milles?|f\b)/i.test(text) ||
    /\b\d{1,3}(?:[.,]\d{3}){2,}\b/.test(text) ||
    /\d\s*\/\s*(m²|m2|lot|mois)\b/i.test(text) ||
    /\b\d[\d\s.,]*\s*[x×*]\s*[4567]\b/i.test(text)
  ) score++
  if (/\b(villas?|studios?|appartements?|duplex|triplex|terrains?|magasins?|bureaux?|entrep[ôo]ts?|r\+\d|pi[èe]ces?|chambres?|lots?|hectares?)\b/i.test(text)) score++
  if (/\b(caution|avances?|loyers?|mois de loyer|superficie|m2|m²|titre foncier|tf\b|acd|loti[es]?|morcelable|documents?|pv de famille|attestation villageoise)\b/i.test(text)) score++
  if (/\b(commissions?|com\s*[:.]?\s*\d{1,2}\s*%|mandataires?|d[ée]marcheurs?|demachaires?|je suis directe?|apporteur|direct avec g[ée]rant)\b/i.test(text)) score++
  if (/(\+?225[\s.]?\d{2}|\b0[157][\s.]?\d{2})[\s.]?\d{2}[\s.]?\d{2}/.test(text) || /\b\d{10}\b/.test(text)) score++
  return score
}

/**
 * Formulations caractéristiques d'une OFFRE / PUBLICATION de bien par un démarcheur ou propriétaire.
 * Même si l'annonce contient un slogan marketing (« Vous recherchez un site... nous mettons en vente »),
 * ces marqueurs prouvent qu'il s'agit d'un offreur et NON d'un prospect cherchant un bien.
 */
const EXPLICIT_SUPPLY_RE = new RegExp(
  [
    /\b(nous\s+mettons\s+en\s+(vente|location)|mise\s+en\s+(vente|location)|mettre\s+en\s+(vente|location))\b/.source,
    /\b(nous\s+disposons\s+d['’\s]|je\s+dispose\s+d['’\s]|on\s+dispose\s+d['’\s]|nous\s+avons\s+un(e)?\s+(chambre|studio|villa|appartement|terrain|parcelle))\b/.source,
    /\b(j['’]\s*ai\s+(un|une|des|\d+)\s*(bien|villa|maison|appartement|terrain|studio|duplex|immeuble|magasin|bureau|local|portes?))\b/.source,
    /\b(voici\s+une\s+(autre\s+)?offre\s+que\s+j['’]envoie|offre\s+que\s+j['’]envoie)\b/.source,
    /\b(conditions?\s*[:.]?\s*\d|cdt\s*[:.]?\s*\d+\s*mois|\d[\d\s.,]*\s*(?:f|fcfa|fr|frs|mil(?:le)?s?|k)?\s*[x×*]\s*[4567]\b)/.source,
    /\b(visites?\s*:?\s*\d+\s*(?:f|fcfa|fr|mille)|frais\s+de\s+visites?|part\s+de\s+porte|dont\s+\d[\d\s.,]*\s*(?:f|fcfa)?\s*de\s+commission|obligatoire\s+pour\s+les\s+d[ée]ma(?:r)?ch(?:e|ai)urs?)\b/.source,
    /^\s*\*?(?:[àa]\s+louer|[àa]\s+vendre|location\s*:|vente\s*:|en\s+vente\b|chambre\s+froide\s+en\s+vente|entrep[ôo]t\s+en\s+vente|terrain\s+[àa]\s+vendre|[ée]cole\s+[àa]\s+vendre|studio\s+[àa]\s+louer|villa\s+[àa]\s+louer)/i.source,
  ].join('|'),
  'i',
)

/**
 * Détecte une diffusion circulaire d'un confrère/démarcheur qui cherche un bien pour son client
 * (ex: « Bonsoir la grande famille mon client direct a besoin de 10 hectares... »).
 * Ce contact est un Demandeur B2B (Agent immobilier en recherche), pas un client B2C à qualifier par le message de bienvenue.
 */
export function isBrokerBroadcastSearch(text: string): boolean {
  const t = text.toLowerCase()
  return /\b(bon(jour|soir)\s+(la\s+)?(grande\s+)?famille|bonjour\s+les\s+coll[èe]gues|mon\s+client\s+direct|un\s+client\s+est\s+[àa]\s+la\s+recherche|besoin\s+pour\s+achat|budget\s+du\s+client|pour\s+mon\s+client)\b/i.test(
    t,
  )
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

  // Si le message contient des marqueurs explicites d'offre/publication de bien (ex: "Mise en vente", "Nous disposons", "250.000f x5")
  if (EXPLICIT_SUPPLY_RE.test(t)) {
    return false
  }

  const searchPhrases = [
    /\b(je\s+cherche|je\s+recherche|on\s+cherche|nous\s+cherchons|client\s+(?:direct\s+)?(?:qui\s+)?(?:cherche|recherche|a\s+besoin)|est\s+[àa]\s+la\s+recherche\s+d)\b/i,
    /\b^\s*(?:bonjour|bonsoir|salut|bjr|bsr|svp|urgent[\s!]*)*\s*cherche\s+(un|une|des|\d+)/i,
    /\b(je\s+suis\s+[àa]\s+la\s+recherche|en\s+qu[êe]te\s+d['’])\b/i,
    /\b(je\s+veux|je\s+voudrais|j['’]aimerais|je\s+souhaite|souhaiterais)\s+(louer|acheter|visiter|trouver|avoir|prendre|emm[ée]nager|un|une|des|ce|le|la|habiter)\b/i,
    /\b((?:j['’]ai\s+|a\s+)?besoin\s+(?:pour\s+achat\s+)?d['’e]\s*(un|une|des|\d+)?\s*(bien|appartement|villa|maison|studio|duplex|terrain|parcelle|entrep[ôo]t|logement|bureau|local|chambre|toit|hectares?|ha\b))\b/i,
    /\b(trouver\s+(un|une|des)\s+(bien|appartement|villa|maison|studio|duplex|terrain|logement))\b/i,
    /\b(avez[-\s]vous|est[-\s]ce\s+que\s+vous\s+avez|auriez[-\s]vous)\b/i,
    /\b(mon\s+budget|notre\s+budget|budget\s+du\s+client|budget\s+(?:max(?:imum)?\s*)?(?:compris\s+entre\s+|est\s+de\s+)?[:=]?\s*\d+)\b/i,
    /\b(pour\s+(y\s+)?habiter|pour\s+emm[ée]nager|pour\s+mon\s+s[ée]jour)\b/i,
  ]

  return searchPhrases.some((p) => p.test(t))
}

/**
 * Détection stricte d'intention Offre / Partenaire / Démarcheur / Propriétaire (Règles 5 & 6).
 * Un agent ou propriétaire qui publie/propose un bien ne doit PAS apparaître dans les prospects.
 */
export function isListingOrPartnerOffer(text: string, isReplyingToQualif = false): boolean {
  if (isReplyingToQualif) {
    return /\b(je\s+suis\s+(propri[ée]taire|d[ée]marcheur|agent|mandataire|apporteur)|mettre\s+en\s+(location|vente)|confier\s+mon\s+bien|publier\s+une\s+annonce|partenariat|collaborer)\b/i.test(text)
  }

  // Marqueur explicite d'offre de bien (même si le texte contient un mot comme "recherche")
  if (EXPLICIT_SUPPLY_RE.test(text)) {
    return true
  }

  // Si le message exprime clairement une intention de recherche client (et pas une offre), ce n'est pas une annonce
  if (isClientSearchIntent(text)) {
    return false
  }

  const t = text.toLowerCase()

  const explicitListingPatterns = [
    /\b(mettre|proposer|confier|placer)\s+(un|mon|notre|mes|des)\s+(bien|villa|maison|appartement|terrain|studio)/,
    /\b(mettre|proposer)\s+en\s+(location|vente)\b/,
    /\b(gestion\s+locative|prendre\s+en\s+gestion|faire\s+g[ée]rer)\b/,
    /\b(publier|d[ée]poser|poster|diffuser|inscrire)\s+(une?\s+)?annonce\b/,
    /\b(collaborer|collaboration|partenariat|partenaire)\b/,
    /\bje\s+suis\s+(propri[ée]taire|d[ée]marcheur|agent|mandataire|courtier|apporteur)\b/,
    /\ben\s+tant\s+que\s+propri[ée]taire\b/,
    /\bpropri[ée]taire\s+d['’]un(e)?\b/,
    /\bj['’]aimerais\s+(faire\s+louer|faire\s+vendre|mettre\s+en\s+location|vendre\s+mon|louer\s+mon)\b/,
    /\b(cherche|trouver)\s+(un|des)?\s*(locataire|locataires|client|clients|acheteur|acheteurs|preneur|preneurs)\b/,
    /\bdisponible\s+imm[ée]diatement\s*:\s*(villa|appartement|studio|duplex)/,
  ]

  if (explicitListingPatterns.some((p) => p.test(t))) {
    return true
  }

  const hasConditions = /\b(conditions?(\s*:|\.{2,}|\s+\d)|(?:\d+)\s*mois\s+de\s+(caution|avance)|caution\s*:\s*\d+|avance\s*:\s*\d+|honoraires?|com(?:mission)?\s*[:=]?\s*\d+|frais\s+d['’]agence)\b/i.test(t)
  const hasBrokerInfo = /\b(visites?\s+sur\s+rdvs?|frais\s+de\s+visites?|infoline|direct\s+propri[ée]taire|direct\s+avec\s+g[ée]rant|mandat\s+exclusif|contact\s*:\s*(\+?225|\b0[157])|prix\s+du\s+loyer)\b/i.test(t)

  if (hasConditions || hasBrokerInfo) {
    return true
  }

  if (listingSignals(text) >= 3) {
    return true
  }

  return false
}


export interface Qualification {
  transaction: 'location' | 'achat' | null
  propertyType: string | null
  zone: string | null
  budget: number | null
  nbPieces?: number | null
  hasAll3: boolean
  missing: ('type' | 'zone' | 'budget')[]
}

/**
 * Conserve uniquement les messages appartenant à la session de conversation courante :
 * dès qu'un écart > maxGapMs (défaut 2h) existe entre deux messages consécutifs,
 * on coupe l'historique antérieur pour éviter de mélanger une recherche d'il y a plusieurs jours/semaines.
 */
export function filterCurrentSessionHistory<T extends { role: string; content: string; created_at?: string }>(
  history?: T[],
  maxGapMs = 48 * 3_600_000,
): T[] {
  if (!history || history.length === 0) return []
  const result: T[] = []
  let nextTime: number | null = null
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i]
    const t = item.created_at ? new Date(item.created_at).getTime() : null
    if (nextTime != null && t != null && !Number.isNaN(t) && nextTime - t > maxGapMs) {
      break
    }
    result.unshift(item)
    if (t != null && !Number.isNaN(t)) {
      nextTime = t
    }
  }
  return result
}

/**
 * Accumule les critères sur le message courant + l'historique récent du client.
 * Si isNewSession ou recherche fraîche -> historique ignoré (pas de mélange de critères).
 */
export function qualify(
  message: string,
  history?: { role: string; content: string; created_at?: string }[],
  options?: {
    isNewSession?: boolean
    fallbackProfile?: { propertyType?: string | null; zone?: string | null; budget?: number | null }
  },
): Qualification {
  const isFresh = options?.isNewSession || FRESH_SEARCH_RE.test(message)
  const sessionHistory = isFresh ? [] : filterCurrentSessionHistory(history)
  // Exclure du `recentUser` le dernier message s'il est identique à `message` (déjà inséré en DB à l'étape 1)
  const rawUserMsgs = sessionHistory.filter((m) => m.role === 'user').slice(-20).map((m) => m.content)
  if (rawUserMsgs.length > 0 && rawUserMsgs[rawUserMsgs.length - 1].trim() === message.trim()) {
    rawUserMsgs.pop()
  }
  const recentUser = isFresh ? [] : rawUserMsgs
  // Ordre du plus récent au plus ancien pour que parseSearchQuery(combined) trouve d'abord les critères récents
  const newestFirst = [message, ...[...recentUser].reverse()]
  const combined = newestFirst.join('  ')

  const pMsg = parseSearchQuery(message)
  const pAll = parseSearchQuery(combined)

  // Parcours du message le plus récent au plus ancien pour toujours privilégier
  // la dernière précision du client (ex: budget révisé de 80k à 90k ou nouveau quartier).
  let latestType: string | null = null
  let latestZone: string | null = null
  let latestBudgetStr: string | null = null
  let latestNbPieces: number | null = null
  for (const m of newestFirst) {
    const pm = parseSearchQuery(m)
    if (!latestType && pm.type_bien) latestType = pm.type_bien
    if (!latestZone) latestZone = pm.commune || detectQuartierZone(m) || null
    if (!latestBudgetStr && pm.prix_max) latestBudgetStr = pm.prix_max
    if (!latestNbPieces && pm.nb_pieces) latestNbPieces = pm.nb_pieces
  }

  const fb = isFresh ? undefined : options?.fallbackProfile
  const propertyType = isFresh
    ? (pMsg.type_bien ?? null)
    : (pMsg.type_bien || latestType || pAll.type_bien || fb?.propertyType || null)
  const msgZone = pMsg.commune || detectQuartierZone(message) || null
  const zone = isFresh
    ? msgZone
    : (msgZone || latestZone || pAll.commune || detectQuartierZone(combined) || fb?.zone || null)
  const budgetStr = isFresh ? pMsg.prix_max : (pMsg.prix_max || latestBudgetStr || pAll.prix_max)
  const budget = budgetStr ? parseInt(budgetStr, 10) : (fb?.budget ?? null)
  const nbPieces = isFresh ? (pMsg.nb_pieces ?? null) : (pMsg.nb_pieces || latestNbPieces || pAll.nb_pieces || null)
  const transaction = detectTransaction(isFresh ? message : combined, budget, propertyType)

  const missing: ('type' | 'zone' | 'budget')[] = []
  if (!propertyType) missing.push('type')
  if (!zone) missing.push('zone')
  if (budget == null) missing.push('budget')

  return { transaction, propertyType, zone, budget, nbPieces, hasAll3: missing.length === 0, missing }
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
  if (known?.propertyType) {
    acknowledgments.push(`votre recherche de *${known.propertyType}*`)
    if (known?.zone) acknowledgments.push(`dans le secteur de *${known.zone}*`)
  } else if (known?.zone) {
    acknowledgments.push(`votre recherche dans le secteur de *${known.zone}*`)
  }
  if (known?.budget) {
    const prefix = acknowledgments.length === 0 ? 'votre recherche ' : ''
    acknowledgments.push(`${prefix}avec un budget d'environ *${known.budget.toLocaleString('fr-FR')} FCFA*`)
  }

  let intro = ''
  if (acknowledgments.length > 0) {
    intro = `C'est bien noté pour ${acknowledgments.join(' ')} ! 🙏\n\n`
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
