import { COMMUNES_CI } from '../shared-pkg/constants/communes.ts'
import { TYPES_BIEN } from '../shared-pkg/constants/biens.ts'

export interface ParsedSearchQuery {
  q: string; // the remaining keywords
  commune?: string;
  type_bien?: string;
  nb_pieces?: number;
  equipements?: string[];
  prix_max?: string;
}

export function parseSearchQuery(text: string): ParsedSearchQuery {
  if (!text) return { q: '' }

  let lower = text.toLowerCase()
  const result: ParsedSearchQuery = { q: text }
  const foundEq: string[] = []

  // Extraction du nombre de pièces demandé ("2pieces", "2 pièces", "3pierce", "4 pièces", "F3", "chambre salon")
  const piecesNumMatch = lower.match(/\b([1-8])\s*(?:pi[eè]ces?|pierces?)\b|\bf([1-8])\b/i)
  if (piecesNumMatch) {
    result.nb_pieces = parseInt(piecesNumMatch[1] || piecesNumMatch[2], 10)
  } else if (/\bdeux\s*(?:pi[eè]ces?|pierces?)\b|\bchambre\s+salon\b/i.test(lower)) {
    result.nb_pieces = 2
  } else if (/\btrois\s*(?:pi[eè]ces?|pierces?)\b/i.test(lower)) {
    result.nb_pieces = 3
  } else if (/\bquatre\s*(?:pi[eè]ces?|pierces?)\b/i.test(lower)) {
    result.nb_pieces = 4
  } else if (/\bcinq\s*(?:pi[eè]ces?|pierces?)\b/i.test(lower)) {
    result.nb_pieces = 5
  }

  // 1. types
  let isMeuble = false
  if (lower.includes('meubl')) {
    isMeuble = true
  }

  // French aliases not covered by TYPES_BIEN raw strings.
  // ⚠️ Duplex est mappé sur 'villa' (catégorie la plus proche en CI : maison à
  // étage). La recherche full-text complémentaire (q) trouvera celles dont le
  // titre/description mentionne explicitement "duplex".
  const TYPE_ALIASES: Record<string, string> = {
    'résidence': 'residence_meublee',
    'residence': 'residence_meublee',
    'grande cour': 'villa',
    'avec cour': 'villa',
    'cour avant': 'villa',
    'cour arrière': 'villa',
    'cour arriere': 'villa',
    'villa basse': 'villa',
    'maison basse': 'villa',
    'duplex': 'villa',
    'triplex': 'villa',
    'appart ': 'appartement',
    'appart,': 'appartement',
    'appart.': 'appartement',
    'appartemeent': 'appartement',
    'appartemnt': 'appartement',
    'appartment': 'appartement',
    'apparemment': 'appartement',
    'penthouse': 'appartement',
    'loft': 'appartement',
    'entrée couchée': 'studio',
    'entree couchee': 'studio',
    'chambre salon': 'appartement',
    'hectare': 'terrain',
    'parcelle': 'terrain',
    'lotissement': 'terrain',
    'entrepôt': 'commerce',
    'entrepot': 'commerce',
    'magasin': 'commerce',
  }
  for (const [alias, mapped] of Object.entries(TYPE_ALIASES)) {
    if (lower.includes(alias) && !result.type_bien) {
      result.type_bien = mapped
      lower = lower.replace(alias, '')
      break
    }
  }

  // We sort by length DESC to match 'residence_meublee' before 'residence' etc.
  // En Côte d'Ivoire, "maison" est souvent employé génériquement ("une maison une chambre salon") :
  // il ne doit pas écraser un type précis déjà détecté via TYPE_ALIASES (ex: "villa basse").
  const types = [...TYPES_BIEN].sort((a, b) => b.length - a.length)
  for (const t of types) {
    if (t === 'maison' && result.type_bien) continue
    const tSpaced = t.replace('_', ' ')
    if (lower.includes(tSpaced) || lower.includes(t)) {
      result.type_bien = t
      lower = lower.replace(tSpaced, '').replace(t, '')
      break
    }
  }

  // Shorthands ivoiriens par nombre de pièces ("2pieces", "2 pièces", "3pierce", "4 pièces", "F3"...)
  // Appliqué uniquement si aucun type explicite (villa, maison, studio, terrain...) n'a été détecté.
  if (!result.type_bien) {
    const onePieceRe = /\b(?:1|une)\s*(?:pi[eè]ces?|pierces?)\b|\bf1\b/i
    const multiPiecesRe = /\b(?:[2-8]|deux|trois|quatre|cinq|six)\s*(?:pi[eè]ces?|pierces?)\b|\bf[2-8]\b/i
    if (onePieceRe.test(lower)) {
      result.type_bien = 'studio'
      lower = lower.replace(onePieceRe, '')
    } else if (multiPiecesRe.test(lower)) {
      result.type_bien = 'appartement'
      lower = lower.replace(multiPiecesRe, '')
    }
  }

  if (isMeuble) {
    if (!result.type_bien) {
      result.type_bien = 'residence_meublee'
    } else if (result.type_bien !== 'residence_meublee') {
      foundEq.push('meuble')
    }
    lower = lower.replace(/meubl[eéés]*/g, '')
  }

  // 2. Communes
  // Détection des zones périphériques d'Abidjan (Bingerville, Bassam, Songon, Anyama)
  const peripherieMatch = lower.match(/\b(aux?\s+alentours?\s+(?:d['’]|de\s+)?abidjan|autour\s+d['’]abidjan|p[ée]riph[ée]rie(?:\s+d['’]abidjan)?|hors\s+abidjan|banlieue(?:\s+d['’]abidjan)?)\b/i)
  if (peripherieMatch) {
    result.commune = "Périphérie d'Abidjan"
    lower = lower.replace(peripherieMatch[0], '')
  }

  // Quartiers d'Abidjan dont le nom contient le préfixe d'une autre commune (ex: "Aboboté" est à Cocody/Angré, pas à Abobo)
  if (/abobot[ée]/i.test(lower)) {
    result.commune = 'Cocody'
    lower = lower.replace(/abobot[ée]/gi, '')
  }

  // Abréviation courante "Yop" → Yopougon
  if (!result.commune && /\byop\b/i.test(lower)) {
    result.commune = 'Yopougon'
    lower = lower.replace(/\byop\b/gi, '')
  }

  // We match the last found to handle corrections like "marcory... non cocody" in voice, 
  // or just first found if we want. Let's just find all and pick the first or last.
  const communes = [...COMMUNES_CI]
  // sort by length to prevent partial matching substrings
  communes.sort((a,b) => b.length - a.length)
  
  for (const c of communes) {
    let cleanCommune: string = c
    if (c === 'Bassam (Grand-Bassam)') cleanCommune = 'bassam'
    const escaped = cleanCommune.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const communeRe = new RegExp(`(?<![a-zA-ZÀ-ÿ])${escaped}(?![a-zA-ZÀ-ÿ])`, 'i')
    
    if (!result.commune && communeRe.test(lower)) {
      result.commune = cleanCommune === 'bassam' ? 'Bassam (Grand-Bassam)' : cleanCommune
      lower = lower.replace(communeRe, '')
      break
    }
  }

  // 3. Equipements
  const equips: Record<string, string> = {
    'parking': 'parking',
    'garage': 'parking',
    'piscine': 'piscine',
    'clim': 'climatisation',
    'climatisation': 'climatisation',
    'climatise': 'climatisation',
    'gardien': 'gardien',
    'vigile': 'gardien',
    'groupe': 'groupe_electrogene',
    'electrogene': 'groupe_electrogene',
    'eau chaude': 'eau_chaude',
    'internet': 'internet_fibre',
    'fibre': 'internet_fibre',
    'wifi': 'internet_fibre',
    'cuisine': 'cuisine_equipee',
    'terrasse': 'terrasse',
    'balcon': 'balcon'
  }

  Object.entries(equips).forEach(([kw, eqVal]) => {
    if (lower.includes(kw)) {
      if (!foundEq.includes(eqVal)) foundEq.push(eqVal)
      lower = lower.replace(new RegExp(kw, 'g'), '')
    }
  })

  if (foundEq.length > 0) {
    result.equipements = foundEq
  }

  // 4. prix_max — handles CI shorthand: "25 mil"=25 000, "90 mill"=90 000, "2 millions"=2 000 000, "500k", "25 000"
  const priceVals: number[] = []

  // "2 millions" / "1.5million" → ×1_000_000 (must be before "mil" to avoid conflict)
  const millionMatches = [...lower.matchAll(/(\d+(?:[.,]\d+)?)\s*millions?/gi)]
  for (const m of millionMatches) {
    priceVals.push(Math.round(parseFloat(m[1].replace(',', '.')) * 1_000_000))
    lower = lower.replace(m[0], '')
  }

  // "25 mil" / "90 mill" / "500mil" / "250 mille" → ×1_000 (en ivoirien "mil" / "mill" = mille = 1000)
  const milMatches = [...lower.matchAll(/(\d+(?:[.,]\d+)?)\s*mil(?:l+e*|s)?\b/gi)]
  for (const m of milMatches) {
    priceVals.push(Math.round(parseFloat(m[1].replace(',', '.')) * 1_000))
    lower = lower.replace(m[0], '')
  }

  // "500k" / "25k" → multiply by 1_000
  const kMatches = [...lower.matchAll(/(\d+(?:[.,]\d+)?)\s*k\b/gi)]
  for (const m of kMatches) {
    priceVals.push(Math.round(parseFloat(m[1].replace(',', '.')) * 1_000))
    lower = lower.replace(m[0], '')
  }

  // Séparateur de milliers par POINT : "50.000" → 50000, "1.250.000" → 1250000, "50.000.000f" → 50000000f, "5000.000f" → 5000000f.
  // (Le séparateur ESPACE est déjà géré par le matcher générique ci-dessous.)
  lower = lower.replace(/\b\d{1,4}(?:\.\d{3})+(?=\D|$)/g, (m) => m.replace(/\./g, ''))

  // 4a. Montant isolé (ex: "250", "250 max", "250k", "250 mille")
  // En Côte d'Ivoire dans une recherche immo, un nombre isolé entre 20 et 999
  // représente toujours des milliers de FCFA (250 = 250 000).
  const standaloneMatch = lower.trim().match(/^(\d{2,3})(?:\s*(?:k|mil(?:le)?s?|f|fcfa|frs?|francs?|max(?:imum)?))?$/i)
  if (standaloneMatch) {
    const n = parseInt(standaloneMatch[1], 10)
    if (n >= 15 && n < 1000) {
      priceVals.push(n * 1000)
      lower = ''
    }
  }

  // 4b. Fourchettes de budget en milliers implicites (usage ivoirien) :
  // ex: "Loyer 4 pièces 200 à 250 Faya", "recherche 2 pieces de 85 a 90", "entre 150 et 200"
  const rangeBudgetMatches = [
    ...lower.matchAll(/\b(\d{2,3})\s*(?:k|mil(?:l+e*|s)?|f|fcfa)?\s*(?:[àa]|au?|-|et)\s*(\d{2,3})\b(?!\s*(?:pi[eè]ces?|pierces?|chambres?|m2|m²|lots?|hectares?|mois|ans?|tranches?))/gi),
  ]
  for (const m of rangeBudgetMatches) {
    const n1 = parseInt(m[1], 10)
    const n2 = parseInt(m[2], 10)
    if (n1 >= 15 && n2 >= n1 && n2 < 1000) {
      priceVals.push(n2 * 1000)
      lower = lower.replace(m[0], '')
    }
  }

  // Petits montants en « milliers » implicites (usage ivoirien) : un nombre
  // collé à un mot-budget ("budget max 250", "loyer 50", "dans les 250", "250 max") ou suivi de f/fcfa
  // ("250 f") = milliers → "250" = 250 000. Le garde n>=10 évite les faux
  // positifs "3 pièces", "9e tranche", "4 chambres".
  const smallBudget = [
    ...lower.matchAll(/\b(?:budget|loyer|prix|max(?:imum)?|autour de|environ|vers|dans les|c['’]est)\s*:?\s*(\d{2,3})\b(?!\s*(?:pi[eè]ces?|pierces?|chambres?|m2|m²|lots?|hectares?|mois|tranches?))/gi),
    ...lower.matchAll(/\b(\d{2,3})\s*(?:f|fcfa|francs?|frs?)\b/gi),
    ...lower.matchAll(/\b(\d{2,3})\s*(?:max|maximum)\b/gi),
  ]
  for (const m of smallBudget) {
    const n = parseInt(m[1], 10)
    if (n >= 10 && n < 1000) {
      priceVals.push(n * 1000)
      lower = lower.replace(m[0], '')
    } else if (n >= 1000) {
      priceVals.push(n)
      lower = lower.replace(m[0], '')
    }
  }

  // Standard large numbers: "500 000", "500000"
  const priceMatches = lower.match(/\d[\d\s]*/g)
  if (priceMatches) {
    priceMatches.forEach(pm => {
      const v = parseInt(pm.replace(/\s/g, ''))
      if (v >= 1000) {
        priceVals.push(v)
        lower = lower.replace(pm, '')
      }
    })
  }

  if (priceVals.length > 0) {
    result.prix_max = Math.max(...priceVals).toString()
  }
  
  // Clean up remaining query words like "je", "cherche", "un", "a", "avec", "de", "pour"
  const stopWords = ['je', 'cherche', 'recherche', 'un', 'une', 'des', 'le', 'la', 'les', 'a', 'à', 'au', 'aux', 'avec', 'sans', 'dans', 'pour', 'de', 'du', 'des', 'et', 'en', 'fcfa', 'francs', 'budget', 'prix', 'maximum', 'max', 'moins', 'plus', 'non', 'oui']
  let remainingWords = lower.split(/[\s,.'-]+/).filter(w => w.trim().length > 1)
  remainingWords = remainingWords.filter(w => !stopWords.includes(w))

  result.q = remainingWords.join(' ')

  return result
}
