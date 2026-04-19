'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const cleanNum = (v: any) => {
  if (v === undefined || v === null || (typeof v === 'number' && isNaN(v))) return null
  return Number(v)
}

const BIEN_FIELDS = (data: Record<string, unknown>) => ({
  titre: data.titre,
  type_bien: data.type_bien,
  commune: data.commune,
  description: data.description ?? '',
  quartier: data.quartier ?? null,
  adresse_complete: data.adresse_complete ?? null,
  surface_m2: cleanNum(data.surface_m2),
  nb_pieces: cleanNum(data.nb_pieces),
  nb_chambres: cleanNum(data.nb_chambres),
  nb_salles_bain: cleanNum(data.nb_salles_bain),
  latitude: cleanNum(data.latitude),
  longitude: cleanNum(data.longitude),
  prix_mois_fcfa: cleanNum(data.prix_mois_fcfa),
  prix_nuit_fcfa: cleanNum(data.prix_nuit_fcfa),
  prix_vente_fcfa: cleanNum(data.prix_vente_fcfa),
  charges_mois_fcfa: cleanNum(data.charges_mois_fcfa),
  depot_garantie_fcfa: cleanNum(data.depot_garantie_fcfa),
  equipements: data.equipements ?? [],
  score_ia: data.score_ia ?? 0,
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
