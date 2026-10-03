import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

async function resolveClient(request: Request, bienId: string): Promise<{
  client: SupabaseClient
  ok: boolean
  reason?: 'auth' | 'forbidden'
}> {
  const { user } = await getServerUser(request)
  const admin = createAdminClient() as unknown as SupabaseClient
  if (!user) return { client: admin, ok: false, reason: 'auth' }

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if ((profile as { role?: string } | null)?.role === 'admin') {
    return { client: admin, ok: true }
  }

  const { data: bien } = await admin
    .from('biens')
    .select('id')
    .eq('id', bienId)
    .eq('proprietaire_id', user.id)
    .maybeSingle()
  if (!bien) return { client: admin, ok: false, reason: 'forbidden' }

  return { client: admin, ok: true }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await resolveClient(request, id)
  if (!r.ok) {
    const status = r.reason === 'auth' ? 401 : 403
    const error = r.reason === 'auth' ? 'Non authentifié' : 'Non autorisé'
    return NextResponse.json({ error }, { status })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (r.client.from('biens_medias') as any)
    .select('id, url, type, titre, ordre, est_couverture, embed_url, duree_sec')
    .eq('bien_id', id)
    .order('est_couverture', { ascending: false })
    .order('ordre', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
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
  const type = body.type || 'photo'

  // Vérifier les médias existants pour attribuer automatiquement la couverture et l'ordre
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (r.client.from('biens_medias') as any)
    .select('id, type, ordre, est_couverture')
    .eq('bien_id', id)

  const existingList = (existing ?? []) as { id: string; type: string; ordre: number | null; est_couverture: boolean | null }[]
  const hasCoverPhoto = existingList.some((m) => m.type === 'photo' && m.est_couverture)
  const maxOrdre = existingList.reduce((max, m) => Math.max(max, typeof m.ordre === 'number' ? m.ordre : 0), -1)

  const estCouverture =
    typeof body.est_couverture === 'boolean'
      ? body.est_couverture
      : type === 'photo' && !hasCoverPhoto
  const ordre =
    typeof body.ordre === 'number'
      ? body.ordre
      : estCouverture && maxOrdre < 0
        ? 0
        : maxOrdre + 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (r.client.from('biens_medias') as any)
    .insert({
      ...body,
      bien_id: id,
      type,
      ordre,
      est_couverture: estCouverture,
    })
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
