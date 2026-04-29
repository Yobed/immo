import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 300

const STORAGE_BUCKET = 'biens-medias'

interface MediaTypeConfig {
  mimes: string[]
  maxBytes: number
  extMap: Record<string, string>
}

const MEDIA_CONFIG: Record<string, MediaTypeConfig> = {
  photo: {
    mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    maxBytes: 15 * 1024 * 1024,
    extMap: { 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heic' },
  },
  vue_360: {
    mimes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxBytes: 50 * 1024 * 1024,
    extMap: { 'image/png': 'png' },
  },
  video: {
    mimes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'],
    maxBytes: 50 * 1024 * 1024,
    extMap: { 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/x-matroska': 'mkv' },
  },
  plan: {
    mimes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxBytes: 20 * 1024 * 1024,
    extMap: { 'application/pdf': 'pdf', 'image/png': 'png' },
  },
}

function extFromMime(type: string, mime: string): string {
  const cfg = MEDIA_CONFIG[type]
  if (cfg?.extMap[mime]) return cfg.extMap[mime]
  if (mime.startsWith('image/')) return 'jpg'
  if (mime.startsWith('video/')) return 'mp4'
  return 'bin'
}

let bucketEnsured = false
async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return
  const admin = createAdminClient()
  const allMimes = Array.from(new Set(Object.values(MEDIA_CONFIG).flatMap(c => c.mimes)))
  await admin.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: allMimes,
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

  const cfg = MEDIA_CONFIG[type]
  if (!cfg) {
    return NextResponse.json({ error: `Type média invalide: ${type}` }, { status: 400 })
  }
  if (file.size > cfg.maxBytes) {
    const maxMB = Math.round(cfg.maxBytes / (1024 * 1024))
    return NextResponse.json({ error: `Fichier trop volumineux (max ${maxMB} MB)` }, { status: 413 })
  }
  const mime = file.type || 'application/octet-stream'
  if (!cfg.mimes.includes(mime)) {
    return NextResponse.json({
      error: `Format non supporté pour "${type}": ${mime}. Acceptés: ${cfg.mimes.join(', ')}`,
    }, { status: 415 })
  }

  await ensureBucket()
  const admin = createAdminClient()

  const ext = extFromMime(type, mime)
  const path = `${bienId}/${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

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
