import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

const STORAGE_BUCKET = 'biens-medias'

interface MediaTypeConfig {
  mimes: string[]
  maxBytes: number
  extMap: Record<string, string>
}

const MEDIA_CONFIG: Record<string, MediaTypeConfig> = {
  photo: {
    mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'],
    maxBytes: 20 * 1024 * 1024,
    extMap: {
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heic',
      'image/avif': 'avif',
    },
  },
  vue_360: {
    mimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxBytes: 50 * 1024 * 1024,
    extMap: { 'image/png': 'png', 'image/webp': 'webp' },
  },
  video: {
    mimes: [
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-matroska',
      'video/3gpp',
      'video/x-msvideo',
      'video/mpeg',
    ],
    maxBytes: 100 * 1024 * 1024,
    extMap: {
      'video/quicktime': 'mov',
      'video/webm': 'webm',
      'video/x-matroska': 'mkv',
      'video/3gpp': '3gp',
      'video/x-msvideo': 'avi',
      'video/mpeg': 'mpeg',
    },
  },
  plan: {
    mimes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxBytes: 20 * 1024 * 1024,
    extMap: { 'application/pdf': 'pdf', 'image/png': 'png', 'image/webp': 'webp' },
  },
}

function inferMimeFromFilename(filename: string | undefined, type: string, rawMime: string): string {
  const clean = (rawMime || '').toLowerCase().trim()
  const cfg = MEDIA_CONFIG[type]
  if (cfg && cfg.mimes.includes(clean)) return clean

  const ext = (filename || '').split('.').pop()?.toLowerCase() || ''
  const extToMime: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    avif: 'image/avif',
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    '3gp': 'video/3gpp',
    avi: 'video/x-msvideo',
    pdf: 'application/pdf',
  }
  if (ext && extToMime[ext]) return extToMime[ext]
  if (clean.startsWith('image/')) return 'image/jpeg'
  if (clean.startsWith('video/')) return 'video/mp4'
  return clean || (type === 'video' ? 'video/mp4' : 'image/jpeg')
}

function extFromMime(type: string, mime: string): string {
  const cfg = MEDIA_CONFIG[type]
  if (cfg?.extMap[mime]) return cfg.extMap[mime]
  if (mime.startsWith('image/')) return 'jpg'
  if (mime.startsWith('video/')) return 'mp4'
  return 'bin'
}

let bucketReady = false
async function ensureBucket(): Promise<void> {
  if (bucketReady) return
  const admin = createAdminClient()
  const allMimes = Array.from(new Set(Object.values(MEDIA_CONFIG).flatMap((c) => c.mimes)))
  const opts = {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: allMimes,
  }
  const { error } = await admin.storage.createBucket(STORAGE_BUCKET, opts)
  if (error) {
    await admin.storage.updateBucket(STORAGE_BUCKET, opts).catch(() => {})
  }
  bucketReady = true
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: bienId } = await params

  const { user } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin) {
    const { data: bien } = await admin
      .from('biens')
      .select('id')
      .eq('id', bienId)
      .eq('proprietaire_id', user.id)
      .maybeSingle()
    if (!bien) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  let body: { type?: string; mime?: string; size?: number; filename?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 })
  }

  const type = body.type || 'photo'
  const cfg = MEDIA_CONFIG[type]
  if (!cfg) {
    return NextResponse.json({ error: `Type média invalide: ${type}` }, { status: 400 })
  }

  const size = Number(body.size || 0)
  if (size > cfg.maxBytes) {
    const maxMB = Math.round(cfg.maxBytes / (1024 * 1024))
    return NextResponse.json({ error: `Fichier trop volumineux (max ${maxMB} MB)` }, { status: 413 })
  }

  const mime = inferMimeFromFilename(body.filename, type, body.mime || '')
  if (!cfg.mimes.includes(mime)) {
    return NextResponse.json(
      { error: `Format non supporté pour "${type}": ${mime}` },
      { status: 415 },
    )
  }

  const ext = extFromMime(type, mime)
  const publicId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const folder = `biens/${bienId}`

  // 1. Paramètres signés Cloudinary (upload direct navigateur -> Cloudinary, sans limite 4.5 MB Vercel)
  let cloudinaryDirect: {
    uploadUrl: string
    apiKey: string
    timestamp: number
    signature: string
    folder: string
    publicId: string
    resourceType: 'image' | 'video' | 'raw'
  } | null = null

  const cn = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^\uFEFF/, '')
  const ck = process.env.CLOUDINARY_API_KEY?.trim().replace(/^\uFEFF/, '')
  const cs = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^\uFEFF/, '')

  if (cn && ck && cs) {
    const timestamp = Math.round(Date.now() / 1000)
    const isVideo = mime.startsWith('video/')
    const isPdf = mime === 'application/pdf'
    const resourceType: 'image' | 'video' | 'raw' = isVideo ? 'video' : isPdf ? 'raw' : 'image'
    const signature = cloudinary.utils.api_sign_request(
      { folder, public_id: publicId, timestamp },
      cs,
    )
    cloudinaryDirect = {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cn}/${resourceType}/upload`,
      apiKey: ck,
      timestamp,
      signature,
      folder,
      publicId,
      resourceType,
    }
  }

  // 2. URL signée Supabase Storage en fallback direct navigateur -> Supabase Storage
  let supabaseDirect: {
    signedUrl: string
    token: string
    path: string
    publicUrl: string
    contentType: string
  } | null = null

  try {
    await ensureBucket()
    const storagePath = `${bienId}/${publicId}.${ext}`
    const { data: signed, error: signErr } = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(storagePath)
    if (!signErr && signed?.signedUrl) {
      const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
      supabaseDirect = {
        signedUrl: signed.signedUrl,
        token: signed.token,
        path: storagePath,
        publicUrl: pub.publicUrl,
        contentType: mime,
      }
    }
  } catch {
    // Fallback silencieux si Supabase Storage indisponible
  }

  return NextResponse.json({
    cloudinary: cloudinaryDirect,
    supabase: supabaseDirect,
  })
}
