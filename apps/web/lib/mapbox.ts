// Centralise l'accès token Mapbox; utilisé par PropertiesMap
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// Centre géographique d'Abidjan
export const ABIDJAN_CENTER = {
  longitude: -4.008256,
  latitude:  5.352781,
  zoom:      11,
} as const
