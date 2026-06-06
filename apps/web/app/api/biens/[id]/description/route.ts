import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireOwnership, safeErrorResponse } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { genererDescription } from '@/lib/ai'

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
      .select('titre, commune, type_bien, prix_mois_fcfa, surface_m2, nb_pieces, nb_chambres, equipements, proprietaire_id')
      .eq('id', id)
      .single()

    if (!bien) {
      return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
    }

    requireOwnership(bien.proprietaire_id, user.id)

    const description = await genererDescription(bien)
    return NextResponse.json({ description })
  } catch (error) {
    return safeErrorResponse(error)
  }
}
