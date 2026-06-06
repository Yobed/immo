import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireOwnership, safeErrorResponse } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { scorerAnnonce } from '@/lib/ai'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(req)
    const { id } = await params

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bien } = await (supabase.from('biens') as any)
      .select('titre, description, commune, type_bien, prix_mois_fcfa, surface_m2, nb_pieces, equipements, proprietaire_id')
      .eq('id', id)
      .single()

    if (!bien) {
      return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
    }

    requireOwnership(bien.proprietaire_id, user.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: nbPhotos } = await (supabase.from('biens_medias') as any)
      .select('id', { count: 'exact', head: true })
      .eq('bien_id', id)
      .eq('type', 'photo')

    const scoreResult = await scorerAnnonce({ ...bien, nb_photos: nbPhotos ?? 0 })
    return NextResponse.json(scoreResult)
  } catch (error) {
    return safeErrorResponse(error)
  }
}
