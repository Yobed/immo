import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (await request.json()) as Record<string, any>

  // Note: database.ts Insert type is a placeholder (regenerated after Supabase project setup).
  // We cast to any to allow all biens fields from the actual schema.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('biens') as any)
    .insert({
      titre: body.titre,
      type_bien: body.type_bien,
      commune: body.commune,
      description: body.description ?? '',
      proprietaire_id: user.id,
      statut: 'brouillon',
      quartier: body.quartier,
      adresse_complete: body.adresse_complete,
      surface_m2: body.surface_m2,
      nb_pieces: body.nb_pieces,
      nb_chambres: body.nb_chambres,
      nb_salles_bain: body.nb_salles_bain,
      latitude: body.latitude,
      longitude: body.longitude,
      prix_mois_fcfa: body.prix_mois_fcfa,
      prix_vente_fcfa: body.prix_vente_fcfa,
      charges_mois_fcfa: body.charges_mois_fcfa,
      depot_garantie_fcfa: body.depot_garantie_fcfa,
      equipements: body.equipements ?? [],
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
