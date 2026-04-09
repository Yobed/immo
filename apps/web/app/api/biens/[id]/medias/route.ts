import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: bien } = await supabase
    .from('biens').select('id').eq('id', id).eq('proprietaire_id', user.id).single()
  if (!bien) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('biens_medias')
    .insert({ ...body, bien_id: id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()

  if (body.couverture_id) {
    await supabase.from('biens_medias')
      .update({ est_couverture: false } as never)
      .eq('bien_id', id).eq('est_couverture', true)

    const { error } = await supabase.from('biens_medias')
      .update({ est_couverture: true } as never)
      .eq('id', body.couverture_id).eq('bien_id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (body.updates && Array.isArray(body.updates)) {
    await Promise.all(body.updates.map(({ id: mediaId, ordre }: { id: string; ordre: number }) =>
      supabase.from('biens_medias').update({ ordre } as never).eq('id', mediaId).eq('bien_id', id)
    ))
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { mediaId } = await request.json()
  const { error } = await supabase
    .from('biens_medias').delete().eq('id', mediaId).eq('bien_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
