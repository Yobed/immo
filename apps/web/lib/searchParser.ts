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

  // We sort by length DESC to match 'residence_meublee' before 'residence' etc. (though types_bien doesn't have overlapping like that)
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

  // 4. prix_max e.g. "500000", "500 000"
  let match;
  const priceRegex = /(?:budget|prix|moins de|max|maximum|a)?\s*(\d{1,3}(?:[ .]*\d{3})+)\s*(?:fcfa|f|cfa|francs)?/gi;
  // Let's use a simpler extraction for any large numbers
  const priceMatches = lower.match(/\d+[\s\d]*/g)
  if (priceMatches) {
    const vals = priceMatches.map(p => parseInt(p.replace(/\s/g, ''))).filter(v => v >= 1000)
    if (vals.length > 0) {
      result.prix_max = Math.max(...vals).toString()
      // Remove the numbers from remaining query
      priceMatches.forEach(pm => {
        lower = lower.replace(pm, '')
      })
    }
  }
  
  // Clean up remaining query words like "je", "cherche", "un", "a", "avec", "de", "pour"
  const stopWords = ['je', 'cherche', 'recherche', 'un', 'une', 'des', 'le', 'la', 'les', 'a', 'à', 'au', 'aux', 'avec', 'sans', 'dans', 'pour', 'de', 'du', 'des', 'et', 'en', 'fcfa', 'francs', 'budget', 'prix', 'maximum', 'max', 'moins', 'plus', 'non', 'oui']
  let remainingWords = lower.split(/[\s,.'-]+/).filter(w => w.trim().length > 1)
  remainingWords = remainingWords.filter(w => !stopWords.includes(w))

  result.q = remainingWords.join(' ')

  return result
}
