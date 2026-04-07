import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — insère un nouveau média dans biens_medias
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérifier que le bien appartient à l'utilisateur
  const { data: bien } = await supabase
    .from('biens').select('id').eq('id', params.id).eq('proprietaire_id', user.id).single()
  if (!bien) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('biens_medias') as any)
    .insert({ ...body, bien_id: params.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH — met à jour ordre ou couverture (batch ou single)
// Body: { updates: Array<{ id: string; ordre?: number; est_couverture?: boolean }> }
// Ou pour définir couverture: { couverture_id: string } (reset les autres d'abord)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()

  if (body.couverture_id) {
    // Reset toutes les couvertures du bien d'abord (évite la violation de l'index partiel unique)
    await supabase
      .from('biens_medias')
      .update({ est_couverture: false } as never)
      .eq('bien_id', params.id)
      .eq('est_couverture', true)

    // Définir la nouvelle couverture
    const { error } = await supabase
      .from('biens_medias')
      .update({ est_couverture: true } as never)
      .eq('id', body.couverture_id)
      .eq('bien_id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  // Batch update ordre
  if (body.updates && Array.isArray(body.updates)) {
    const promises = body.updates.map(({ id, ordre }: { id: string; ordre: number }) =>
      supabase.from('biens_medias').update({ ordre } as never).eq('id', id).eq('bien_id', params.id)
    )
    await Promise.all(promises)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
}

// DELETE — supprime un média
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { mediaId } = await request.json()
  const { error } = await supabase
    .from('biens_medias')
    .delete()
    .eq('id', mediaId)
    .eq('bien_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
