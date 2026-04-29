import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

const STORAGE_BUCKET = 'biens-medias'
const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
])

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('heic') || mime.includes('heif')) return 'heic'
  return 'jpg'
}

let bucketEnsured = false
async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return
  const admin = createAdminClient()
  await admin.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_MIMES),
  }).catch(() => {})
  bucketEnsured = true
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bienId } = await params

  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const { data: bien } = await supabase
      .from('biens').select('id').eq('id', bienId).eq('proprietaire_id', user.id).single()
    if (!bien) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const form = await request.formData()
  const file = form.get('file')
  const type = (form.get('type') as string) || 'photo'

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 15 MB)' }, { status: 413 })
  }
  const mime = file.type || 'image/jpeg'
  if (!mime.startsWith('image/') || !ALLOWED_MIMES.has(mime)) {
    return NextResponse.json({ error: `Format non supporté: ${mime}` }, { status: 415 })
  }

  await ensureBucket()
  const admin = createAdminClient()

  const ext = extFromMime(mime)
  const path = `${bienId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const buffer = await file.arrayBuffer()
  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false })
  if (upErr) {
    return NextResponse.json({ error: `Upload: ${upErr.message}` }, { status: 500 })
  }

  const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  const url = pub.publicUrl

  const { data: media, error: mErr } = await admin
    .from('biens_medias')
    .insert({ bien_id: bienId, type, url, ordre: 99 })
    .select()
    .single()
  if (mErr) {
    return NextResponse.json({ error: `DB: ${mErr.message}`, url }, { status: 500 })
  }

  return NextResponse.json({ url, media }, { status: 201 })
}
