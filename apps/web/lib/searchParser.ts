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

  // Extraction du nombre de pièces demandé ("2pieces", "2 pièces", "3pierce", "3pices", "2 pcs", "3p", "F3", "2 chambres salon")
  const chambresSalonMatch = lower.match(/\b(?:(1|une)|(2|deux)|(3|trois)|(4|quatre))\s*chambres?\s+salon\b/i)
  if (chambresSalonMatch) {
    if (chambresSalonMatch[1]) result.nb_pieces = 2
    else if (chambresSalonMatch[2]) result.nb_pieces = 3
    else if (chambresSalonMatch[3]) result.nb_pieces = 4
    else if (chambresSalonMatch[4]) result.nb_pieces = 5
    result.type_bien = 'appartement'
    lower = lower.replace(chambresSalonMatch[0], ' ')
  } else {
    const piecesNumMatch = lower.match(/\b([1-8])\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?)\b|\bf([1-8])\b|\b([2-6])p\b/i)
    if (piecesNumMatch) {
      result.nb_pieces = parseInt(piecesNumMatch[1] || piecesNumMatch[2] || piecesNumMatch[3], 10)
    } else if (/\bdeux\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?)\b|\bchambres?\s+salon\b/i.test(lower)) {
      result.nb_pieces = 2
    } else if (/\btrois\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?)\b/i.test(lower)) {
      result.nb_pieces = 3
    } else if (/\bquatre\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?)\b/i.test(lower)) {
      result.nb_pieces = 4
    } else if (/\bcinq\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?)\b/i.test(lower)) {
      result.nb_pieces = 5
    }
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
    'chambres salon': 'appartement',
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

  // Protection des noms de quartiers contenant un mot-clé de type de bien
  // ex: "Yopougon Nouveau bureau" est un quartier de Yopougon, pas une recherche de bureau !
  const hasNouveauBureau = /\bnouveau\s+bureau\b/i.test(lower)
  if (hasNouveauBureau) {
    result.commune = 'Yopougon'
    lower = lower.replace(/\bnouveau\s+bureau\b/gi, ' ')
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

  // Shorthands ivoiriens par nombre de pièces ("2pieces", "2 pièces", "3pierce", "3pices", "2 pcs", "3p", "4 pièces", "F3"...)
  // Appliqué uniquement si aucun type explicite (villa, maison, studio, terrain...) n'a été détecté.
  if (!result.type_bien) {
    const onePieceRe = /\b(?:1|une)\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?)\b|\bf1\b/i
    const multiPiecesRe = /\b(?:[2-8]|deux|trois|quatre|cinq|six)\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?)\b|\bf[2-8]\b|\b[2-6]p\b/i
    if (onePieceRe.test(lower)) {
      result.type_bien = 'studio'
      lower = lower.replace(onePieceRe, '')
    } else if (multiPiecesRe.test(lower)) {
      result.type_bien = 'appartement'
      lower = lower.replace(multiPiecesRe, '')
    } else if (/\b(?:louer|cherche|recherche|besoin\s+d['’]?\s*|veux|voudrais)\s+(?:une\s+)?chambre\b|\bune\s+chambre\s+(?:avec|[àa]|en|simple|propre|individuelle)\b/i.test(lower)) {
      result.type_bien = 'studio'
    } else if (/\b(logement|domicile)\b/i.test(lower)) {
      result.type_bien = 'appartement'
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

  // Quartiers d'Abidjan dont le nom contient le préfixe ou le nom d'une autre commune :
  // - "Aboboté" est à Cocody/Angré, pas à Abobo
  // - "2 plateaux" / "deux plateaux" / "2 plateau" est à Cocody, JAMAIS au Plateau !
  if (/abobot[ée]/i.test(lower)) {
    result.commune = 'Cocody'
    lower = lower.replace(/abobot[ée]/gi, '')
  }
  const hasDeuxPlateaux = /\b(?:deux|2|ii)\s*[-\s]*plateaux?\b/i.test(lower)
  if (hasDeuxPlateaux) {
    lower = lower.replace(/\b(?:deux|2|ii)\s*[-\s]*plateaux?\b/gi, '')
  }

  // Abréviations et fautes de frappe courantes sur les communes d'Abidjan
  const COMMUNE_TYPOS: Array<[RegExp, string]> = [
    [/\b(?:yop|yopougo)\b/i, 'Yopougon'],
    [/\bmacory\b/i, 'Marcory'],
    [/\b(?:at+e|att[ée])coub[ée]?\b/i, 'Attécoubé'],
    [/\btreicheville\b/i, 'Treichville'],
    [/\bport[\s-]+bou[eë]t\b/i, 'Port-Bouet'],
  ]
  for (const [typoRe, canonicalCommune] of COMMUNE_TYPOS) {
    if (!result.commune && typoRe.test(lower)) {
      result.commune = canonicalCommune
      lower = lower.replace(typoRe, '')
      break
    }
  }

  // We match communes (with accent/hyphen normalization so "adjame" matches "Adjamé", "port bouet" matches "Port-Bouet", etc.)
  const communes = [...COMMUNES_CI]
  communes.sort((a, b) => b.length - a.length)
  const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  for (const c of communes) {
    if (result.commune) break
    if (c === 'Man') {
      // "Man" est un mot court fréquent dans les pseudos ou tournures ("man", "management"...) :
      // on exige une préposition de lieu explicite ("à Man", "de Man", "sur Man", "ville de Man").
      const manRe = /\b(?:[àa]|de|sur|vers|ville\s+de|commune\s+de)\s+man\b/i
      if (manRe.test(lower)) {
        result.commune = 'Man'
        lower = lower.replace(manRe, '')
        break
      }
      continue
    }
    let cleanCommune: string = c
    if (c === 'Bassam (Grand-Bassam)') cleanCommune = 'bassam'
    const escapedExact = cleanCommune.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const escapedNoAccent = stripAccents(cleanCommune.toLowerCase())
      .replace(/[-]/g, '[\\s-]')
      .replace(/[.*+?^${}()|[\]\\]/g, (ch) => (ch === '[' || ch === ']' || ch === '\\' || ch === '-' ? ch : `\\${ch}`))
    const communeRe = new RegExp(`(?<![a-zA-ZÀ-ÿ])(?:${escapedExact}|${escapedNoAccent})(?![a-zA-ZÀ-ÿ])`, 'i')

    if (communeRe.test(lower)) {
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

  // 4. prix_max — handles CI shorthand: "25 mil"=25 000, "90 mill"=90 000, "300 milles"=300 000, "2 millions"=2 000 000, "1 milliard"=1 000 000 000, "500k", "25 000"
  const priceVals: number[] = []

  // Nettoyage préalable des séquences numériques qui ne sont JAMAIS un budget :
  // - URLs et UUIDs (ex: https://www.bogbesgroup.com/biens/17b41636-... où "41636" était lu comme budget)
  // - Numéros de téléphone ivoiriens (10 chiffres 01/05/07 ou précédés de +225 / "contactez-nous au")
  // - Surfaces et contenances ("1000m²", "500 m2", "2 hectares", "3 lots")
  // - Lignes de bus / SOTRA ("terminus 42", "terminus 81", "bus 19")
  // - Dates ("15/08/2026")
  // - Multiplications de caution ("70.000 x 4 = 300.000" → on conserve uniquement le loyer mensuel "70.000")
  lower = lower
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, ' ')
    .replace(/\b(?:contact(?:ez)?(?:\s*[-nous]+)?(?:\s+au)?|t[ée]l(?:[ée]phone)?|whatsapp|appeler|num[ée]ro|infoline)\s*[:.]?\s*\+?\d[\d\s.-]{7,14}\b/gi, ' ')
    .replace(/(?:\+?225[\s.-]?)?\b0[157](?:[\s.-]?\d{2}){4}\b/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:m2|m²|ha\b|hectares?|lots?)\b/gi, ' ')
    .replace(/\b(?:terminus|bus|ligne)\s*\d{1,3}\b/gi, ' ')
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})\b/g, ' ')
    .replace(/(\d[\d\s.,]*)\s*(?:f|fcfa|frs?)?\s*[x×*]\s*[2-9]\s*(?:mois)?(?:\s*=\s*\d[\d\s.,]*(?:\s*(?:f|fcfa|frs?))?)?/gi, '$1 ')

  // Si le client mentionne à la fois une caution ("J'ai une cotion de 200milles je voudrais un studio de 45 ou 50milles")
  // ou un budget global de caution + un loyer explicite ("Budget 150 mille besoin de maison de 30 ou 35 milles"),
  // on retire la mention de caution pour ne retenir que le loyer mensuel recherché.
  const withoutCaution = lower
    .replace(/\b(?:caution|cotion|garantie|avance)\s+(?:de\s+|est\s+de\s+)?\d+(?:[.,]\d+)?\s*(?:mil(?:l+e*s?|s)?|k|f|fcfa|francs?|frs?)?\b/gi, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:mil(?:l+e*s?|s)?|k|f|fcfa|francs?|frs?)?\s+(?:comme|de|pour\s+la)\s+(?:caution|cotion|garantie|avance)\b/gi, ' ')
  if (/\d/.test(withoutCaution)) {
    lower = withoutCaution
  }
  const explicitRentAfterCaution = lower.match(
    /\bbud[gj]et\s+\d+(?:[.,]\d+)?\s*(?:mil(?:l+e*s?|s)?|k|f|fcfa)?\b.*?\b(?:besoin\s+de\s+|cherche\s+|voudrais\s+|veux\s+)?(?:maison|studio|appart(?:ement)?|chambre|logement|loyer)\s+(?:de|[àa])\s+(\d.*)$/i,
  )
  if (explicitRentAfterCaution && /\d/.test(explicitRentAfterCaution[1])) {
    lower = explicitRentAfterCaution[1]
  }

  // "1 milliard" / "2 milliards" → ×1_000_000_000
  const milliardMatches = [...lower.matchAll(/(\d+(?:[.,]\d+)?)\s*milliards?\b/gi)]
  for (const m of milliardMatches) {
    priceVals.push(Math.round(parseFloat(m[1].replace(',', '.')) * 1_000_000_000))
    lower = lower.replace(m[0], '')
  }

  // "2 millions" / "1.5million" → ×1_000_000 (must be before "mil" to avoid conflict)
  const millionMatches = [...lower.matchAll(/(\d+(?:[.,]\d+)?)\s*millions?/gi)]
  for (const m of millionMatches) {
    priceVals.push(Math.round(parseFloat(m[1].replace(',', '.')) * 1_000_000))
    lower = lower.replace(m[0], '')
  }

  // "25 mil" / "90 mill" / "500mil" / "250 mille" / "300 milles" → ×1_000
  const milMatches = [...lower.matchAll(/(\d+(?:[.,]\d+)?)\s*mil(?:l+e*s?|s)?\b/gi)]
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

  // Séparateur de milliers par POINT ou ESPACE ("50.000" → 50000, "35 000 000" → 35000000, "400 000" → 400000).
  // Normalisé AVANT `smallBudget` pour éviter que "budget 35 000 000" ne soit tronqué en "budget 35" (= 35 000),
  // et sans jamais fusionner des listes de petits nombres comme "50 60 65 70" !
  lower = lower.replace(/\b\d{1,4}(?:\.\d{3})+(?=\D|$)/g, (m) => m.replace(/\./g, ''))
  lower = lower.replace(/\b\d{1,4}(?:\s+(?:000|500|250|750))+(?=\D|$)/g, (m) => m.replace(/\s+/g, ''))

  // 4a. Montant isolé (ex: "250", "250 max", "180 maxi", "250k", "250 mille")
  // En Côte d'Ivoire dans une recherche immo, un nombre isolé entre 20 et 999
  // représente toujours des milliers de FCFA (250 = 250 000).
  const standaloneMatch = lower.trim().match(/^(\d{2,3})(?:\s*(?:k|mil(?:le)?s?|f|fcfa|frs?|francs?|max(?:i|imum)?))?$/i)
  if (standaloneMatch) {
    const n = parseInt(standaloneMatch[1], 10)
    if (n >= 15 && n < 1000) {
      priceVals.push(n * 1000)
      lower = ''
    }
  }

  // 4b. Énumérations croissantes en milliers implicites (ex: "studios de 50 60 65 70", "De 80 90 100 120")
  const listBudgetMatches = [
    ...lower.matchAll(/\b(\d{2,3}(?:\s+\d{2,3}){2,5})\b/g),
  ]
  for (const m of listBudgetMatches) {
    const nums = m[1].trim().split(/\s+/).map((x) => parseInt(x, 10))
    const isAscending = nums.every((n, idx) => n >= 15 && n < 1000 && (idx === 0 || (n > nums[idx - 1] && n <= nums[idx - 1] * 2)))
    if (isAscending) {
      priceVals.push(nums[nums.length - 1] * 1000)
      lower = lower.replace(m[0], '')
    }
  }

  // 4c. Fourchettes de budget en milliers implicites (usage ivoirien) :
  // ex: "Loyer 4 pièces 200 à 250 Faya", "recherche 2 pieces de 85 a 90", "entre 150 et 200", "60 - 100", "65/70 budget"
  const rangeBudgetMatches = [
    ...lower.matchAll(/\b(\d{2,3})\s*(?:k|mil(?:l+e*s?|s)?|f|fcfa)?\s*(?:[àa]|au?|-|\/|et|ou)\s*(\d{2,3})\b(?!\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?|chambres?|m2|m²|lots?|hectares?|mois|ans?|tranches?))/gi),
  ]
  for (const m of rangeBudgetMatches) {
    const n1 = parseInt(m[1], 10)
    const n2 = parseInt(m[2], 10)
    if (n1 >= 15 && n2 > n1 && n2 < 1000 && n2 <= n1 * 3) {
      priceVals.push(n2 * 1000)
      lower = lower.replace(m[0], '')
    }
  }

  // Petits montants en « milliers » implicites (usage ivoirien) : un nombre
  // collé à un mot-budget ("budget max 250", "budjet 300", "loyer 50", "dans les 250", "250 max", "180 maxi") ou suivi de f/fcfa
  // ("250 f") = milliers → "250" = 250 000. Le garde n>=10 évite les faux
  // positifs "3 pièces", "9e tranche", "4 chambres".
  const smallBudget = [
    ...lower.matchAll(/\b(?:bud[gj]et|loyer|prix|co[uû]t|taux(?:\s+de\s+bail)?|max(?:i|imum)?|autour de|environ|vers|dans les|c['’]est)\s*:?\s*(\d{2,3})\b(?!\s*(?:b?pi[eè]?ces?|pierces?|pcs|pces?|chambres?|m2|m²|lots?|hectares?|mois|tranches?))/gi),
    ...lower.matchAll(/\b(\d{2,3})\s*(?:f|fcfa|francs?|frs?)\b/gi),
    ...lower.matchAll(/\b(\d{2,3})\s*(?:max|maxi|maximum)\b/gi),
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

  // Standard large numbers: "500000", "35000000" (les groupes de milliers séparés par espace/point ont déjà été normalisés ci-dessus)
  const priceMatches = lower.match(/\b\d{5,10}\b/g)
  if (priceMatches) {
    priceMatches.forEach(pm => {
      const v = parseInt(pm, 10)
      if (v >= 10000 && v <= 50_000_000_000 && !(v >= 10_000_000 && v % 500 !== 0)) {
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
