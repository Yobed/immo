/**
 * Coordonnées de référence (centroids) des communes/zones couvertes
 * en Côte d'Ivoire. Sert à positionner les biens sur la carte quand
 * la latitude/longitude exacte n'est pas connue (cas des offres flash
 * scrapées qui n'ont que la commune en texte).
 *
 * Sources : approximation depuis OpenStreetMap. Précision suffisante
 * pour un affichage de cluster par zone.
 */

export interface Centroid {
  longitude: number
  latitude: number
}

export const COMMUNE_CENTROIDS: Record<string, Centroid> = {
  // ─── Abidjan ─────────────────────────────────────────────────────────
  cocody:        { longitude: -3.9921, latitude: 5.3675 },
  plateau:       { longitude: -4.0234, latitude: 5.3220 },
  yopougon:      { longitude: -4.1118, latitude: 5.3370 },
  marcory:       { longitude: -3.9920, latitude: 5.2990 },
  treichville:   { longitude: -4.0089, latitude: 5.3010 },
  'adjamé':      { longitude: -4.0250, latitude: 5.3470 },
  'adjame':      { longitude: -4.0250, latitude: 5.3470 },
  abobo:         { longitude: -4.0220, latitude: 5.4220 },
  koumassi:      { longitude: -3.9610, latitude: 5.2940 },
  'port-bouët':  { longitude: -3.9750, latitude: 5.2570 },
  'port-bouet':  { longitude: -3.9750, latitude: 5.2570 },
  'port bouet':  { longitude: -3.9750, latitude: 5.2570 },
  attécoubé:     { longitude: -4.0610, latitude: 5.3360 },
  attecoube:     { longitude: -4.0610, latitude: 5.3360 },
  // ─── Périphérie Abidjan ──────────────────────────────────────────────
  bingerville:   { longitude: -3.8870, latitude: 5.3550 },
  songon:        { longitude: -4.2940, latitude: 5.3260 },
  anyama:        { longitude: -4.0510, latitude: 5.4940 },
  // ─── Autres villes CI (futur) ────────────────────────────────────────
  'grand-bassam':{ longitude: -3.7370, latitude: 5.2030 },
  'grand bassam':{ longitude: -3.7370, latitude: 5.2030 },
  bouaké:        { longitude: -5.0303, latitude: 7.6900 },
  bouake:        { longitude: -5.0303, latitude: 7.6900 },
  'yamoussoukro':{ longitude: -5.2767, latitude: 6.8276 },
  'san-pédro':   { longitude: -6.6363, latitude: 4.7484 },
  'san pedro':   { longitude: -6.6363, latitude: 4.7484 },
  korhogo:       { longitude: -5.6285, latitude: 9.4580 },
  daloa:         { longitude: -6.4505, latitude: 6.8770 },
}

/**
 * Cherche le centroid d'une commune avec normalisation case/accents.
 * Retourne null si la commune n'est pas répertoriée — le caller décide
 * de skipper ou d'utiliser un fallback (centre Abidjan).
 */
export function lookupCommune(name: string | null | undefined): Centroid | null {
  if (!name) return null
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
  // Test sans accent puis avec
  return COMMUNE_CENTROIDS[normalized] ?? COMMUNE_CENTROIDS[name.toLowerCase().trim()] ?? null
}

/**
 * Ajoute un léger jitter (variation aléatoire mais reproductible) autour du
 * centroid d'une commune pour éviter l'empilement parfait des marqueurs.
 * Le jitter est déterministe par seed pour que les positions restent stables
 * entre les renders (pas de "marqueurs qui sautent").
 */
export function jitterAround(centroid: Centroid, seed: string | number, radiusKm = 1.2): Centroid {
  const s = typeof seed === 'string'
    ? seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : seed
  // Pseudo-random déterministe via sin
  const r1 = Math.sin(s * 12.9898) * 43758.5453
  const r2 = Math.sin(s * 78.233) * 43758.5453
  const f1 = r1 - Math.floor(r1)
  const f2 = r2 - Math.floor(r2)
  // Convertit km en degrés (~0.009° par km à cette latitude)
  const dLat = (f1 - 0.5) * 2 * radiusKm * 0.009
  const dLng = (f2 - 0.5) * 2 * radiusKm * 0.009
  return {
    latitude: centroid.latitude + dLat,
    longitude: centroid.longitude + dLng,
  }
}
