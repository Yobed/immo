'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { moderateBienContent, detectDuplicateBien, type ModerationInput } from '@/lib/moderation'

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


function buildModerationInput(data: Record<string, unknown>): ModerationInput {
  return {
    titre: data.titre as string | null,
    description: data.description as string | null,
    type_bien: data.type_bien as string | null,
    commune: data.commune as string | null,
    prix_mois_fcfa: cleanNum(data.prix_mois_fcfa),
    prix_nuit_fcfa: cleanNum(data.prix_nuit_fcfa),
    prix_vente_fcfa: cleanNum(data.prix_vente_fcfa),
  }
}

export async function createBien(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/mes-biens/nouveau')

  // ─── Modération automatique (anti-spam + qualité minimum) ────────────────
  const modInput = buildModerationInput(data)
  const contentCheck = moderateBienContent(modInput)
  if (!contentCheck.ok) return { error: contentCheck.reason ?? 'Contenu rejeté' }

  // Détection doublons : on bloque si le proprio a déjà la même annonce
  const dupCheck = await detectDuplicateBien(supabase, user.id, {
    ...modInput,
    nb_pieces: cleanNum(data.nb_pieces),
  })
  if (!dupCheck.ok) return { error: dupCheck.reason ?? 'Annonce en doublon' }

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  // ─── Modération auto sur update (même règles que create) ─────────────────
  // L'admin bypass la modération (il sait ce qu'il fait, edit légitime)
  if (!isAdmin) {
    const modInput = buildModerationInput(data)
    const contentCheck = moderateBienContent(modInput)
    if (!contentCheck.ok) return { error: contentCheck.reason ?? 'Contenu rejeté' }

    // Doublon : on exclut l'annonce en cours d'édition de la recherche
    const dupCheck = await detectDuplicateBien(supabase, user.id, {
      ...modInput,
      nb_pieces: cleanNum(data.nb_pieces),
      excludeId: id,
    })
    if (!dupCheck.ok) return { error: dupCheck.reason ?? 'Annonce en doublon' }
  }

  // Admin: bypass owner check via service-role. Owner: limité par RLS.
  const client = isAdmin ? createAdminClient() : supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (client.from('biens') as any).update(BIEN_FIELDS(data)).eq('id', id)
  if (!isAdmin) q = q.eq('proprietaire_id', user.id)
  const { error } = await q

  if (error) return { error: error.message }
  return { id }
}
