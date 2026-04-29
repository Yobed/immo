import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

async function resolveClient(request: Request, bienId: string): Promise<{
  client: SupabaseClient
  ok: boolean
  reason?: 'auth' | 'forbidden'
}> {
  const { user, supabase } = await getServerUser(request)
  if (!user) return { client: supabase, ok: false, reason: 'auth' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role === 'admin') {
    return { client: createAdminClient() as unknown as SupabaseClient, ok: true }
  }

  const { data: bien } = await supabase
    .from('biens').select('id').eq('id', bienId).eq('proprietaire_id', user.id).single()
  if (!bien) return { client: supabase, ok: false, reason: 'forbidden' }

  return { client: supabase, ok: true }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await resolveClient(request, id)
  if (!r.ok) {
    const status = r.reason === 'auth' ? 401 : 403
    const error = r.reason === 'auth' ? 'Non authentifié' : 'Non autorisé'
    return NextResponse.json({ error }, { status })
  }

  const body = await request.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (r.client.from('biens_medias') as any)
    .insert({ ...body, bien_id: id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await resolveClient(request, id)
  if (!r.ok) {
    const status = r.reason === 'auth' ? 401 : 403
    const error = r.reason === 'auth' ? 'Non authentifié' : 'Non autorisé'
    return NextResponse.json({ error }, { status })
  }

  const body = await request.json()

  if (body.couverture_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (r.client.from('biens_medias') as any)
      .update({ est_couverture: false })
      .eq('bien_id', id).eq('est_couverture', true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (r.client.from('biens_medias') as any)
      .update({ est_couverture: true })
      .eq('id', body.couverture_id).eq('bien_id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  if (body.updates && Array.isArray(body.updates)) {
    await Promise.all(body.updates.map(({ id: mediaId, ordre }: { id: string; ordre: number }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r.client.from('biens_medias') as any).update({ ordre }).eq('id', mediaId).eq('bien_id', id)
    ))
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await resolveClient(request, id)
  if (!r.ok) {
    const status = r.reason === 'auth' ? 401 : 403
    const error = r.reason === 'auth' ? 'Non authentifié' : 'Non autorisé'
    return NextResponse.json({ error }, { status })
  }

  const { mediaId } = await request.json()

  const { data: mediaRow } = await r.client
    .from('biens_medias')
    .select('url')
    .eq('id', mediaId)
    .eq('bien_id', id)
    .single()

  const { error } = await r.client
    .from('biens_medias').delete().eq('id', mediaId).eq('bien_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Cleanup Storage si l'URL pointe sur notre bucket
  const url = (mediaRow as { url?: string } | null)?.url
  if (url) {
    const match = url.match(/biens-medias\/(.+)$/)
    if (match) {
      const path = match[1].split('?')[0]
      const admin = createAdminClient()
      await admin.storage.from('biens-medias').remove([path]).catch(() => {})
    }
  }

  return NextResponse.json({ success: true })
}
