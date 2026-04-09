'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const BIEN_FIELDS = (data: Record<string, unknown>) => ({
  titre: data.titre,
  type_bien: data.type_bien,
  commune: data.commune,
  description: data.description ?? '',
  quartier: data.quartier ?? null,
  adresse_complete: data.adresse_complete ?? null,
  surface_m2: data.surface_m2 ?? null,
  nb_pieces: data.nb_pieces ?? null,
  nb_chambres: data.nb_chambres ?? null,
  nb_salles_bain: data.nb_salles_bain ?? null,
  latitude: data.latitude ?? null,
  longitude: data.longitude ?? null,
  prix_mois_fcfa: data.prix_mois_fcfa ?? null,
  prix_nuit_fcfa: data.prix_nuit_fcfa ?? null,
  prix_vente_fcfa: data.prix_vente_fcfa ?? null,
  charges_mois_fcfa: data.charges_mois_fcfa ?? null,
  depot_garantie_fcfa: data.depot_garantie_fcfa ?? null,
  equipements: data.equipements ?? [],
})

export async function createBien(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/mes-biens/nouveau')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien, error } = await (supabase.from('biens') as any)
    .insert({ ...BIEN_FIELDS(data), proprietaire_id: user.id, statut: 'brouillon' })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: (bien as { id: string }).id }
}

export async function updateBien(id: string, data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('biens') as any)
    .update(BIEN_FIELDS(data))
    .eq('id', id)
    .eq('proprietaire_id', user.id)

  if (error) return { error: error.message }
  return { id }
}
