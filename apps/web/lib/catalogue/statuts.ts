/**
 * Statuts d'un bien visibles publiquement (recherche plateforme, catalogue, agent IA Sapphire).
 *
 * Règle métier : la recherche et Sapphire doivent retourner TOUS les biens
 * enregistrés — validés OU non — en plus des offres flash. La validation admin
 * agit comme un signal de confiance (badge + tri), pas comme un filtre de visibilité.
 *
 * - 'publie'     : validé par l'admin (peut porter le badge ✓ Vérifié).
 * - 'en_attente' : enregistré et soumis par le propriétaire, en cours de validation.
 *
 * Restent masqués du public : 'brouillon' (incomplet), 'refuse', 'suspendu',
 * 'archive', 'loue'.
 *
 * ⚠️ Doit rester cohérent avec la policy RLS SELECT publique sur `public.biens`
 * (voir supabase/migrations/022_biens_visibles_en_attente.sql).
 */
export const STATUTS_PUBLICS = ['publie'] as const

export type StatutPublic = (typeof STATUTS_PUBLICS)[number]

/** True si le statut est visible publiquement (uniquement `publie`, après
 *  validation admin — un `en_attente` n'est PAS public). */
export function estStatutPublic(statut: string | null | undefined): boolean {
  return statut === 'publie'
}
