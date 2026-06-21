/**
 * Helper Mapbox Static Images API — beaucoup plus léger qu'un client GL JS.
 *
 * Renvoie une URL d'image PNG qu'on peut consommer directement avec <img>
 * ou <Image>. Pas de hydration, pas de JS Mapbox chargé. Idéal pour des
 * cas où on a juste besoin d'une vignette de localisation (cards, hero
 * d'une fiche sans photo, etc.).
 *
 * Doc : https://docs.mapbox.com/api/maps/static-images/
 */

import { MAPBOX_TOKEN } from './mapbox'

interface StaticMapOptions {
  lat: number
  lng: number
  zoom?: number
  width?: number
  height?: number
  /** Affiche un marker épinglé à (lat,lng). Couleur HEX sans '#'. */
  pin?: { color?: string; size?: 's' | 'l' } | false
  /** Style Mapbox. Default = streets-v12. */
  style?: string
  /** Pour Retina (2x). */
  retina?: boolean
}

/**
 * Construit l'URL de la Static Images API.
 * Retourne null si le token n'est pas configuré (pas de map silencieusement).
 */
export function getStaticMapUrl({
  lat,
  lng,
  zoom = 13,
  width = 600,
  height = 400,
  pin = { color: 'f97316', size: 'l' }, // orange BOGBE'S
  style = 'streets-v12',
  retina = true,
}: StaticMapOptions): string | null {
  if (!MAPBOX_TOKEN) return null

  // Clamp dimensions Mapbox limits : max 1280 par côté
  const w = Math.min(1280, Math.max(50, Math.round(width)))
  const h = Math.min(1280, Math.max(50, Math.round(height)))

  // Overlay marker (optionnel)
  let overlay = ''
  if (pin) {
    const color = pin.color ?? 'f97316'
    const size = pin.size ?? 'l'
    overlay = `pin-${size}+${color}(${lng},${lat})/`
  }

  const retinaSuffix = retina ? '@2x' : ''

  return (
    `https://api.mapbox.com/styles/v1/mapbox/${style}/static/` +
    `${overlay}${lng},${lat},${zoom}/${w}x${h}${retinaSuffix}` +
    `?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`
  )
}
