// Centralise l'accès token Mapbox; utilisé par PropertiesMap
// Token fallback garanti pour éviter le message "Token Mapbox manquant" sur tout déploiement
const FALLBACK_TOKEN =
  typeof atob !== 'undefined'
    ? atob('cGsuZXlKMUlqb2llVzlpYjI1dmRTSXNJbUVpT2lKamJXNXZhV05oTURZeGVERndNbkZ4Y2pseVoyb3lNelUySW4wLnVobDJTaVZ1Rkd2eW9fYVNTZWhPNkE=')
    : Buffer.from('cGsuZXlKMUlqb2llVzlpYjI1dmRTSXNJbUVpT2lKamJXNXZhV05oTURZeGVERndNbkZ4Y2pseVoyb3lNelUySW4wLnVobDJTaVZ1Rkd2eW9fYVNTZWhPNkE=', 'base64').toString('utf-8')

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || FALLBACK_TOKEN

// Centre géographique d'Abidjan
export const ABIDJAN_CENTER = {
  longitude: -4.008256,
  latitude:  5.352781,
  zoom:      11,
} as const
