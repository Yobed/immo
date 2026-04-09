export const TYPES_BIEN = [
  'studio','appartement','villa','maison',
  'bureau','commerce','terrain','residence_meublee',
] as const

export type TypeBien = typeof TYPES_BIEN[number]

export const EQUIPEMENTS_DISPONIBLES = [
  'climatisation','piscine','gardien','parking','groupe_electrogene',
  'eau_chaude','internet_fibre','cuisine_equipee','meuble','terrasse','balcon',
] as const

export const EQUIPEMENTS_LABELS: Record<string, string> = {
  climatisation: 'Climatisation',
  piscine: 'Piscine',
  gardien: 'Gardien',
  parking: 'Parking',
  groupe_electrogene: 'Groupe électrogène',
  eau_chaude: 'Eau chaude',
  internet_fibre: 'Internet fibre',
  cuisine_equipee: 'Cuisine équipée',
  meuble: 'Meublé',
  terrasse: 'Terrasse',
  balcon: 'Balcon',
}

export const TYPES_BIEN_LABELS: Record<string, string> = {
  studio: 'Studio',
  appartement: 'Appartement',
  villa: 'Villa',
  maison: 'Maison',
  bureau: 'Bureau',
  commerce: 'Commerce',
  terrain: 'Terrain',
  residence_meublee: 'Résidence meublée',
}
