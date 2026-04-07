import { NextRequest, NextResponse } from 'next/server'
import { createClient }  from '@/lib/supabase/server'
import { scorerAnnonce } from '@/lib/claude'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase.from('biens') as any)
    .select('titre, description, commune, type_bien, prix_mois_fcfa, surface_m2, nb_pieces, equipements, proprietaire_id')
    .eq('id', params.id)
    .single()

  if (!bien) return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
  if (bien.proprietaire_id !== user.id) return NextResponse.json({ error: 'Non autorise' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: nbPhotos } = await (supabase.from('biens_medias') as any)
    .select('id', { count: 'exact', head: true })
    .eq('bien_id', params.id)
    .eq('type', 'photo')

  const bienData = { ...bien, nb_photos: nbPhotos ?? 0 }
  const scoreResult = await scorerAnnonce(bienData)

  return NextResponse.json(scoreResult)
}
