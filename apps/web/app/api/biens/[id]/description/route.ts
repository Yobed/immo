import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { genererDescription } from '@/lib/ai'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await getServerUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase.from('biens') as any)
    .select('titre, commune, type_bien, prix_mois_fcfa, surface_m2, nb_pieces, nb_chambres, equipements, proprietaire_id')
    .eq('id', id).single()

  if (!bien) return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
  if (bien.proprietaire_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  try {
    const description = await genererDescription(bien)
    return NextResponse.json({ description })
  } catch (error: any) {
    console.error("Generation Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
