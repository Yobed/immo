export const COMMUNES_ABIDJAN = [
  'Cocody','Plateau','Marcory','Treichville','Adjamé','Yopougon',
  'Abobo','Koumassi','Port-Bouet','Bingerville','Attécoubé','Songon',
] as const

export type CommuneAbidjan = typeof COMMUNES_ABIDJAN[number]

export const COMMUNES_CI = [
  ...COMMUNES_ABIDJAN,
  'Aboisso','Agboville','Adzopé','Akoupé','Alepe','Anyama',
  'Bassam (Grand-Bassam)','Bondoukou','Bouaké','Dabou','Daloa',
  'Divo','Gagnoa','Man','Odienné','San-Pédro','Yamoussoukro',
] as const

export const QUARTIERS_PREMIUM = [
  'Riviera Faya', 'Riviera Golf', 'Palmeraie', 'Cocody II Plateaux',
  'Angré', 'Deux Plateaux Vallon', 'Riviera 3', 'Riviera Bonoumin',
] as const

export const ROLES_UTILISATEUR = ['locataire', 'proprietaire', 'agence', 'admin'] as const
export type RoleUtilisateur = typeof ROLES_UTILISATEUR[number]
