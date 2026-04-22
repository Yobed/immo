import { COMMUNES_CI } from '@immo-ci/shared/constants/communes'
import { TYPES_BIEN } from '@immo-ci/shared/constants/biens'

export interface ParsedSearchQuery {
  q: string; // the remaining keywords
  commune?: string;
  type_bien?: string;
  equipements?: string[];
  prix_max?: string;
}

export function parseSearchQuery(text: string): ParsedSearchQuery {
  if (!text) return { q: '' }

  let lower = text.toLowerCase()
  const result: ParsedSearchQuery = { q: text }
  const foundEq: string[] = []

  // 1. types
  let isMeuble = false
  if (lower.includes('meubl')) {
    isMeuble = true
  }

  // French aliases not covered by TYPES_BIEN raw strings
  const TYPE_ALIASES: Record<string, string> = {
    'résidence': 'residence_meublee',
    'residence': 'residence_meublee',
    'appart ': 'appartement',
    'appart,': 'appartement',
    'appart.': 'appartement',
  }
  for (const [alias, mapped] of Object.entries(TYPE_ALIASES)) {
    if (lower.includes(alias) && !result.type_bien) {
      result.type_bien = mapped
      lower = lower.replace(alias, '')
      break
    }
  }

  // We sort by length DESC to match 'residence_meublee' before 'residence' etc.
  const types = [...TYPES_BIEN].sort((a, b) => b.length - a.length)
  for (const t of types) {
    const tSpaced = t.replace('_', ' ')
    if (lower.includes(tSpaced) || lower.includes(t)) {
      result.type_bien = t
      lower = lower.replace(tSpaced, '').replace(t, '')
      break
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
  // We match the last found to handle corrections like "marcory... non cocody" in voice, 
  // or just first found if we want. Let's just find all and pick the first or last.
  const communes = [...COMMUNES_CI]
  // sort by length to prevent partial matching substrings
  communes.sort((a,b) => b.length - a.length)
  
  for (const c of communes) {
    let cleanCommune: string = c
    if (c === 'Bassam (Grand-Bassam)') cleanCommune = 'bassam'
    
    if (lower.includes(cleanCommune.toLowerCase())) {
      result.commune = cleanCommune === 'bassam' ? 'Bassam (Grand-Bassam)' : cleanCommune
      lower = lower.replace(cleanCommune.toLowerCase(), '')
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

  // 4. prix_max — handles CI shorthand: "25 mil"=25 000, "2 millions"=2 000 000, "500k", "25 000"
  const priceVals: number[] = []

  // "2 millions" / "1.5million" → ×1_000_000 (must be before "mil" to avoid conflict)
  const millionMatches = [...lower.matchAll(/(\d+(?:[.,]\d+)?)\s*millions?/gi)]
  for (const m of millionMatches) {
    priceVals.push(Math.round(parseFloat(m[1].replace(',', '.')) * 1_000_000))
    lower = lower.replace(m[0], '')
  }

  // "25 mil" / "500mil" → ×1_000 (en ivoirien "mil" = mille = 1000)
  const milMatches = [...lower.matchAll(/(\d+(?:[.,]\d+)?)\s*mil\b/gi)]
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
