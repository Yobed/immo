import { NextResponse } from 'next/server'
import { createAnnoncesClient } from '@/lib/supabase/annonces'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { data, error } = await (createAnnoncesClient() as any)
      .from('v_annonces').select('id,titre,type_bien,transaction,commune,quartier,prix_fcfa,periodicite,surface_m2,nb_pieces,nb_chambres,description,photo_principale,photos')
      .eq('id', Number(id)).eq('actif', true).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    return NextResponse.json({
      id: String(data.id), titre: data.titre ?? `${data.type_bien ?? 'Bien'} à ${data.commune ?? 'Abidjan'}`,
      prix_mois_fcfa: /mois/i.test(data.periodicite ?? '') ? data.prix_fcfa : null,
      prix_vente_fcfa: /vente/i.test(data.transaction ?? '') ? data.prix_fcfa : null,
      commune: data.commune ?? '', type_bien: data.type_bien ?? '', statut: 'publie',
      description: data.description ?? null, surface_m2: data.surface_m2 ?? null,
      nb_pieces: data.nb_pieces ?? null, nb_chambres: data.nb_chambres ?? null,
      biens_medias: (data.photos ?? []).map((url: string, ordre: number) => ({ url, ordre, type: 'photo', est_couverture: ordre === 0 })),
    })
  } catch {
    return NextResponse.json({ error: 'annonce indisponible' }, { status: 503 })
  }
}
