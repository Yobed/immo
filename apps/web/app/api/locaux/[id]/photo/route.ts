import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { locauxAdminForId } from '@/lib/supabase/locaux'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'
export const maxDuration = 120

// Upload manuel d'une photo sur une offre flash (locaux). Les biens scrapés
// arrivent souvent sans photo ; l'admin reçoit les images du démarcheur et les
// ajoute ici. Même pipeline que l'upload des biens BOGBE'S (Cloudinary, repli
// Supabase Storage) — route handler et non server action pour dépasser la
// limite 1 Mo des server actions (photos téléphone = 2-5 Mo).
const MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_BYTES = 15 * 1024 * 1024
const STORAGE_BUCKET = 'biens-medias'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const locauxId = Number(id)
  if (!Number.isFinite(locauxId)) {
    return NextResponse.json({ error: 'id invalide' }, { status: 400 })
  }

  // Auth : admin uniquement
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const form = await request.formData()
  const file = form.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 15 Mo)' }, { status: 413 })
  }
  const mime = file.type || 'application/octet-stream'
  if (!MIMES.includes(mime)) {
    return NextResponse.json({ error: `Format non supporté : ${mime}` }, { status: 415 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const publicId = `manuel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  let url: string | null = null
  let cloudErr: string | null = null

  // 1. Cloudinary (prioritaire)
  const cn = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^﻿/, '')
  const ck = process.env.CLOUDINARY_API_KEY?.trim().replace(/^﻿/, '')
  const cs = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^﻿/, '')
  if (cn && ck && cs) {
    cloudinary.config({ cloud_name: cn, api_key: ck, api_secret: cs })
    try {
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: `locaux/${locauxId}`, public_id: publicId, resource_type: 'image', timeout: 120000 },
            (err, res) => (err || !res ? reject(err || new Error('no_response')) : resolve(res as { secure_url: string })),
          )
          .end(buffer)
      })
      url = result.secure_url
    } catch (e) {
      cloudErr = (e as Error).message?.slice(0, 120) || 'unknown'
    }
  }

  // 2. Repli Supabase Storage
  if (!url) {
    const admin = createAdminClient()
    await admin.storage.createBucket(STORAGE_BUCKET, { public: true, fileSizeLimit: 50 * 1024 * 1024 }).catch(() => {})
    const path = `locaux/${locauxId}/${publicId}.jpg`
    const { error: upErr } = await admin.storage.from(STORAGE_BUCKET).upload(path, buffer, { contentType: mime, upsert: false })
    if (upErr) {
      return NextResponse.json(
        { error: `Upload échoué — Cloudinary: ${cloudErr ?? 'non configuré'} | Supabase: ${upErr.message}` },
        { status: 500 },
      )
    }
    const { data: pub } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    url = pub.publicUrl
  }

  // 3. Écriture sur la ligne locaux (projet routé par id : ancien ≤ 99999 / nouveau ≥ 100000)
  const sb = locauxAdminForId(locauxId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb.from('locaux') as any).update({ lien_image: url }).eq('id', locauxId)
  if (error) return NextResponse.json({ error: `DB: ${error.message}`, url }, { status: 500 })

  return NextResponse.json({ url }, { status: 201 })
}
