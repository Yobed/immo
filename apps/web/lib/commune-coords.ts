/**
 * Coordonnées approximatives (centre) des communes et grandes villes
 * de Côte d'Ivoire. Utilisé pour afficher une map de localisation quand
 * le bien n'a pas de coordonnées GPS précises (cas typique des offres
 * flash scrapées sans adresse).
 *
 * IMPORTANT : ce sont des CENTRES DE COMMUNE, jamais l'adresse exacte.
 * L'incertitude est explicitement communiquée à l'utilisateur via le
 * label "Position approximative · {commune}".
 *
 * Sources : OpenStreetMap, vérifiées juin 2026.
 */

export interface LatLng {
  lat: number
  lng: number
}

const COMMUNE_COORDS: Record<string, LatLng> = {
  // Abidjan — 12 communes officielles
  cocody:      { lat: 5.347,  lng: -3.997 },
  plateau:     { lat: 5.323,  lng: -4.022 },
  marcory:     { lat: 5.301,  lng: -3.989 },
  treichville: { lat: 5.292,  lng: -4.010 },
  adjame:      { lat: 5.349,  lng: -4.024 },
  yopougon:    { lat: 5.341,  lng: -4.094 },
  abobo:       { lat: 5.418,  lng: -4.038 },
  koumassi:    { lat: 5.292,  lng: -3.961 },
  'port-bouet': { lat: 5.260, lng: -3.927 },
  bingerville: { lat: 5.351,  lng: -3.892 },
  attecoube:   { lat: 5.331,  lng: -4.063 },
  songon:      { lat: 5.355,  lng: -4.205 },

  // Quartiers premium Cocody (souvent référencés sans commune mère)
  riviera:        { lat: 5.358, lng: -3.965 },
  'riviera faya': { lat: 5.366, lng: -3.954 },
  'riviera golf': { lat: 5.378, lng: -3.962 },
  palmeraie:      { lat: 5.376, lng: -3.972 },
  angre:          { lat: 5.388, lng: -3.989 },
  'deux plateaux': { lat: 5.361, lng: -4.005 },
  'cocody ii plateaux': { lat: 5.361, lng: -4.005 },

  // Grandes villes CI
  yamoussoukro: { lat: 6.821, lng: -5.276 },
  bouake:       { lat: 7.690, lng: -5.030 },
  'san-pedro':  { lat: 4.749, lng: -6.640 },
  daloa:        { lat: 6.876, lng: -6.450 },
  korhogo:      { lat: 9.458, lng: -5.629 },
  man:          { lat: 7.412, lng: -7.553 },
  abengourou:   { lat: 6.730, lng: -3.495 },
  gagnoa:       { lat: 6.131, lng: -5.951 },
  divo:         { lat: 5.838, lng: -5.357 },
  dabou:        { lat: 5.319, lng: -4.378 },
  'bassam':     { lat: 5.196, lng: -3.736 }, // Grand-Bassam
  'grand-bassam': { lat: 5.196, lng: -3.736 },
  anyama:       { lat: 5.494, lng: -4.052 },
  aboisso:      { lat: 5.467, lng: -3.205 },
  agboville:    { lat: 5.928, lng: -4.213 },
  adzope:       { lat: 6.108, lng: -3.860 },
}

/** Centre d'Abidjan (fallback si commune inconnue). */
export const ABIDJAN_CENTER: LatLng = { lat: 5.352, lng: -4.008 }

/** Normalise une chaîne pour le lookup (lowercase, sans accents, trim). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacritics
    .trim()
}

/**
 * Récupère les coords d'une commune ou d'un quartier connu.
 * Le fallback est le centre d'Abidjan si rien ne matche.
 *
 * Cherche d'abord le quartier (plus précis), puis la commune.
 */
export function getCommuneCoords(
  commune?: string | null,
  quartier?: string | null,
): LatLng {
  if (quartier) {
    const q = normalize(quartier)
    if (COMMUNE_COORDS[q]) return COMMUNE_COORDS[q]
    // Essaye aussi quartier sans le préfixe "Riviera"
    for (const key of Object.keys(COMMUNE_COORDS)) {
      if (q.includes(key) || key.includes(q)) return COMMUNE_COORDS[key]
    }
  }
  if (commune) {
    const c = normalize(commune)
    if (COMMUNE_COORDS[c]) return COMMUNE_COORDS[c]
    for (const key of Object.keys(COMMUNE_COORDS)) {
      if (c.includes(key) || key.includes(c)) return COMMUNE_COORDS[key]
    }
  }
  return ABIDJAN_CENTER
}

/**
 * Indique si on a une vraie correspondance pour le label
 * "Position approximative · Commune" vs "Centre d'Abidjan".
 */
export function hasKnownCoords(
  commune?: string | null,
  quartier?: string | null,
): boolean {
  if (quartier && COMMUNE_COORDS[normalize(quartier)]) return true
  if (commune && COMMUNE_COORDS[normalize(commune)]) return true
  return false
}
