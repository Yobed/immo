import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractBienFromWhatsApp } from '@/lib/extractors/whatsapp-bien-extractor'
import { signMagicLinkToken } from '@/lib/auth/magic-link-token'
import { wasenderSendMessage } from '@/lib/wasender'
import { v2 as cloudinary } from 'cloudinary'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

interface TallyField {
  key: string
  label: string
  type: string
  value: unknown
}

interface TallyFile {
  url: string
  name?: string
  mimeType?: string
}

/**
 * Dérive un UUID v4-style stable depuis une string (submissionId Tally).
 * Le même submissionId renverra toujours le même UUID → idempotence DB.
 */
function deriveBienId(submissionKey: string): string {
  const hash = crypto.createHash('sha256').update(`tally:bien:${submissionKey}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

function verifyTallySignature(rawBody: string, signature: string | null): boolean {
  const rawSecret = process.env.TALLY_WEBHOOK_SECRET
  const secret = rawSecret?.trim().replace(/^﻿/, '') || ''
  if (!secret) return process.env.NODE_ENV !== 'production'
  if (!signature) return false
  const cleanSig = signature.trim()
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleanSig))
  } catch {
    return false
  }
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('00')) return '+' + digits.slice(2)
  if (raw.trim().startsWith('+')) return '+' + digits
  if (digits.startsWith('225')) return '+' + digits
  if (digits.length === 10 || digits.length === 8) return '+225' + digits
  return '+' + digits
}

function pickField(fields: TallyField[], predicate: (f: TallyField) => boolean): TallyField | undefined {
  return fields.find(predicate)
}

function readPhone(fields: TallyField[]): string | null {
  const f = pickField(fields, x =>
    x.type === 'PHONE_NUMBER' ||
    /phone|telephone|t.l.phone|whatsapp/i.test(x.label || '')
  )
  if (!f || typeof f.value !== 'string') return null
  return normalizePhone(f.value)
}

function readRawText(fields: TallyField[]): string | null {
  const f = pickField(fields, x =>
    (x.type === 'TEXTAREA' || x.type === 'INPUT_TEXT') &&
    /annonce|message|texte|brut|description/i.test(x.label || '')
  ) || pickField(fields, x => x.type === 'TEXTAREA')
  if (!f || typeof f.value !== 'string') return null
  return f.value.trim() || null
}

function readImages(fields: TallyField[]): string[] {
  const urls: string[] = []
  for (const f of fields) {
    if (f.type !== 'FILE_UPLOAD') continue
    if (!Array.isArray(f.value)) continue
    for (const item of f.value as TallyFile[]) {
      if (item && typeof item.url === 'string' && /^https?:\/\//.test(item.url)) {
        urls.push(item.url)
      }
    }
  }
  return urls
}

async function findOrCreateUserByPhone(phone: string): Promise<string> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()
  if (existing?.id) return existing.id

  const syntheticEmail = `${phone.replace(/\D/g, '')}@phone.tally.ci`
  const { data: created, error } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    phone,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { full_name: '', role: 'proprietaire', source: 'tally', is_provisional: true },
  })

  if (error || !created.user) {
    if (/already.*registered|duplicate/i.test(error?.message || '')) {
      const { data: byEmail } = await admin
        .from('profiles')
        .select('id')
        .eq('email', syntheticEmail)
        .maybeSingle()
      if (byEmail?.id) return byEmail.id
    }
    throw new Error(`createUser failed: ${error?.message || 'unknown'}`)
  }

  await admin
    .from('profiles')
    .update({ phone, role: 'proprietaire' })
    .eq('id', created.user.id)

  return created.user.id
}

const STORAGE_BUCKET = 'biens-medias'

let bucketEnsured = false
async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return
  const admin = createAdminClient()
  await admin.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    fileSizeLimit: 15 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  }).catch(() => {})
  bucketEnsured = true
}

async function uploadImageFromUrl(
  bienId: string,
  sourceUrl: string,
  index: number
): Promise<{ url: string | null; error?: string; provider?: string }> {
  // 1. Cloudinary en priorité si creds dispos
  const cn = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^﻿/, '')
  const ck = process.env.CLOUDINARY_API_KEY?.trim().replace(/^﻿/, '')
  const cs = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^﻿/, '')
  if (cn && ck && cs) {
    cloudinary.config({ cloud_name: cn, api_key: ck, api_secret: cs })
    try {
      const result = await cloudinary.uploader.upload(sourceUrl, {
        folder: `biens/${bienId}`,
        public_id: `tally-${Date.now()}-${index}`,
        resource_type: 'image',
        timeout: 60000,
      })
      return { url: result.secure_url, provider: 'cloudinary' }
    } catch (e) {
      // Fallback Supabase si Cloudinary échoue
      const cloudinaryErr = (e as Error).message?.slice(0, 80) || 'unknown'
      const fallback = await uploadToSupabase(bienId, sourceUrl, index)
      return fallback.url
        ? { ...fallback, provider: `supabase(after_cloudinary_fail:${cloudinaryErr})` }
        : { url: null, error: `cloudinary:${cloudinaryErr} | ${fallback.error}` }
    }
  }
  // 2. Pas de creds Cloudinary → Supabase direct
  return uploadToSupabase(bienId, sourceUrl, index)
}

async function uploadToSupabase(
  bienId: string,
  sourceUrl: string,
  index: number
): Promise<{ url: string | null; error?: string; provider?: string }> {
  try {
    await ensureBucket()
    const res = await fetch(sourceUrl)
    if (!res.ok) return { url: null, error: `fetch_${res.status}` }
    const arrayBuffer = await res.arrayBuffer()
    if (arrayBuffer.byteLength > 50 * 1024 * 1024) return { url: null, error: 'too_large' }

    let contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) contentType = 'image/jpeg'
    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('webp') ? 'webp'
      : contentType.includes('heic') ? 'heic'
      : 'jpg'
    const path = `${bienId}/tally-${Date.now()}-${index}.${ext}`

    const admin = createAdminClient()
    const { error } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(path, arrayBuffer, { contentType, upsert: false })
    if (error) return { url: null, error: `supabase:${error.message?.slice(0, 80)}` }

    const { data } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, provider: 'supabase' }
  } catch (e) {
    return { url: null, error: (e as Error).message?.slice(0, 120) || 'unknown' }
  }
}

async function sendConfirmationWhatsApp(phone: string, bien_id: string, user_id: string, titre: string) {
  const token = await signMagicLinkToken({ bien_id, user_id, phone })
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/^﻿/, '')
  const baseUrl = rawUrl || 'https://bogbes-groupe.vercel.app'
  const link = `${baseUrl}/confirmer/${token}`
  const text = `🏠 *BOGBE'S GROUPE* — Votre annonce a été reçue !

*${titre}*

Cliquez ci-dessous pour la publier maintenant :
${link}

Ce lien valide votre numéro et publie votre annonce en 1 clic. Valide 7 jours.`

  await wasenderSendMessage(phone, text, 'text')
}

export async function POST(req: NextRequest) {
  // Rate limit Tally : max 30 publications par IP / 1h (anti-abus)
  const rl = checkRateLimit(req, { scope: 'tally-webhook', max: 30, windowMs: 60 * 60_000 })
  if (!rl.ok) return rateLimitResponse(rl)

  const rawBody = await req.text()
  const signature = req.headers.get('tally-signature')
  if (!verifyTallySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  let payload: { eventId?: string; data?: { fields?: TallyField[]; submissionId?: string; responseId?: string } }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const fields = payload.data?.fields ?? []
  const phone = readPhone(fields)
  const rawText = readRawText(fields)
  const imageUrls = readImages(fields)

  if (!phone) return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
  if (!rawText) return NextResponse.json({ error: 'missing_raw_text' }, { status: 400 })

  // Idempotence: dérive un UUID stable depuis submissionId/responseId/eventId.
  // Si Tally retry le même webhook → même bien.id → INSERT conflict → no-op.
  const submissionKey =
    payload.data?.submissionId ||
    payload.data?.responseId ||
    payload.eventId ||
    null
  const stableBienId = submissionKey ? deriveBienId(submissionKey) : null

  const extResult = await extractBienFromWhatsApp(rawText).catch((e: Error) => ({
    data: null,
    trace: [`fatal:${e.message?.slice(0, 100)}`],
  }))
  const extracted = extResult.data
  const lowConfidence = !extracted || extracted.confidence < 0.5

  const userId = await findOrCreateUserByPhone(phone)
  const admin = createAdminClient()

  // Idempotence: si on a déjà un bien avec cet ID stable, c'est un retry Tally.
  // On retourne le bien existant sans rien refaire (pas de re-upload, pas de re-WhatsApp).
  if (stableBienId) {
    const { data: existing } = await admin
      .from('biens')
      .select('id, titre')
      .eq('id', stableBienId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({
        ok: true,
        bien_id: existing.id,
        dedup: 'tally_retry_detected',
        submission_key: submissionKey,
      })
    }
  }

  const bienInsert = {
    ...(stableBienId && { id: stableBienId }),
    proprietaire_id: userId,
    statut: 'brouillon' as const,
    // Jamais « Annonce en attente de validation » : ce placeholder s'affichait
    // comme TITRE public et faisait croire aux admins que la validation échouait.
    titre: extracted?.titre || `${extracted?.type_bien ?? 'Appartement'} — ${extracted?.commune ?? 'Abidjan'} (à compléter)`,
    description: extracted?.description || rawText.slice(0, 1800),
    type_bien: extracted?.type_bien || 'appartement',
    commune: extracted?.commune || 'Abidjan',
    quartier: extracted?.quartier ?? null,
    surface_m2: extracted?.surface_m2 ?? null,
    nb_pieces: extracted?.nb_pieces ?? null,
    nb_chambres: extracted?.nb_chambres ?? null,
    nb_salles_bain: extracted?.nb_salles_bain ?? null,
    prix_mois_fcfa: extracted?.prix_mois_fcfa ?? null,
    prix_nuit_fcfa: extracted?.prix_nuit_fcfa ?? null,
    prix_vente_fcfa: extracted?.prix_vente_fcfa ?? null,
    equipements: extracted?.equipements ?? [],
  }

  const { data: bien, error: bienErr } = await admin
    .from('biens')
    .insert(bienInsert)
    .select('id, titre')
    .single()

  // Race condition: 2e webhook arrive entre le SELECT et le INSERT → conflit PK
  if (bienErr?.code === '23505' && stableBienId) {
    const { data: existing } = await admin
      .from('biens')
      .select('id, titre')
      .eq('id', stableBienId)
      .single()
    return NextResponse.json({
      ok: true,
      bien_id: existing?.id ?? stableBienId,
      dedup: 'tally_retry_race_detected',
      submission_key: submissionKey,
    })
  }

  if (bienErr || !bien) {
    return NextResponse.json({ error: 'bien_insert_failed', detail: bienErr?.message }, { status: 500 })
  }

  const uploadTrace: string[] = []
  let uploadedCount = 0
  if (imageUrls.length > 0) {
    const uploaded: string[] = []
    for (let i = 0; i < imageUrls.length; i++) {
      const r = await uploadImageFromUrl(bien.id, imageUrls[i], i)
      if (r.url) {
        uploaded.push(r.url)
        uploadTrace.push(`img${i}:ok`)
      } else {
        uploadTrace.push(`img${i}:fail:${r.error}`)
      }
    }
    uploadedCount = uploaded.length
    if (uploaded.length > 0) {
      const mediasRows = uploaded.map((url, i) => ({
        bien_id: bien.id,
        type: 'photo' as const,
        url,
        ordre: i,
        est_couverture: i === 0,
      }))
      const { error: medErr } = await admin.from('biens_medias').insert(mediasRows)
      if (medErr) uploadTrace.push(`db_insert_fail:${medErr.message?.slice(0, 80)}`)
    }
  }

  await sendConfirmationWhatsApp(phone, bien.id, userId, bien.titre).catch(() => null)

  return NextResponse.json({
    ok: true,
    bien_id: bien.id,
    user_id: userId,
    extraction_confidence: extracted?.confidence ?? 0,
    low_confidence: lowConfidence,
    images_received: imageUrls.length,
    images_uploaded: uploadedCount,
    upload_trace: uploadTrace,
    trace: extResult.trace,
  })
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'tally-webhook', ts: new Date().toISOString() })
}
