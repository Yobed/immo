import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase } = await getServerUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: avisId } = await params
  const { reponse } = await req.json() as { reponse: string }

  if (!reponse?.trim()) {
    return NextResponse.json({ error: 'La réponse ne peut pas être vide' }, { status: 400 })
  }

  // Vérifier que l'utilisateur est bien la cible de cet avis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: avis } = await (supabase.from('avis') as any)
    .select('id, cible_id, reponse_cible')
    .eq('id', avisId)
    .single()

  if (!avis) return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 })
  if (avis.cible_id !== user.id) {
    return NextResponse.json({ error: 'Seule la cible peut répondre à un avis' }, { status: 403 })
  }
  if (avis.reponse_cible) {
    return NextResponse.json(
      { error: 'Une réponse a déjà été publiée pour cet avis' },
      { status: 409 }
    )
  }

  // Mettre à jour reponse_cible (RLS: cible_id = auth.uid())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from('avis') as any)
    .update({ reponse_cible: reponse.trim() })
    .eq('id', avisId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
