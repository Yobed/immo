import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractBienFromWhatsApp } from '@/lib/extractors/whatsapp-bien-extractor'
import { signMagicLinkToken } from '@/lib/auth/magic-link-token'
import { wasenderSendMessage } from '@/lib/wasender'
import { notifyAdminBienSubmitted } from '@/lib/notifications/whatsapp-notifier'
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
  const f =
    pickField(
      fields,
      (x) =>
        x.type === 'PHONE_NUMBER' ||
        x.type === 'INPUT_PHONE_NUMBER' ||
        /phone|telephone|t.l.phone|whatsapp|num.ro/i.test(x.label || ''),
    ) ||
    pickField(
      fields,
      (x) =>
        typeof x.value === 'string' &&
        /^\+?[0-9\s()-]{8,16}$/.test(x.value.trim()),
    )
  if (!f || typeof f.value !== 'string') return null
  const norm = normalizePhone(f.value)
  return norm.replace(/\D/g, '').length >= 8 ? norm : null
}

function readRawText(fields: TallyField[]): string | null {
  const f =
    pickField(
      fields,
      (x) =>
        (x.type === 'TEXTAREA' || x.type === 'INPUT_TEXT') &&
        /annonce|message|texte|brut|description|bien/i.test(x.label || ''),
    ) ||
    pickField(fields, (x) => x.type === 'TEXTAREA') ||
    pickField(
      fields,
      (x) =>
        x.type === 'INPUT_TEXT' &&
        typeof x.value === 'string' &&
        x.value.trim().length >= 10,
    )
  if (!f || typeof f.value !== 'string') return null
  return f.value.trim() || null
}

interface ParsedTallyMedia {
  url: string
  type: 'photo' | 'video'
  mimeType?: string
  name?: string
}

function isVideoFile(item: TallyFile): boolean {
  const mime = (item.mimeType || '').toLowerCase()
  if (mime.startsWith('video/')) return true
  const target = `${item.name || ''} ${item.url || ''}`.toLowerCase()
  return /\.(mp4|mov|webm|mkv|3gp|m4v|avi)(\?|$)/i.test(target)
}

function readMediaFiles(fields: TallyField[]): ParsedTallyMedia[] {
  const items: ParsedTallyMedia[] = []
  for (const f of fields) {
    if (f.type !== 'FILE_UPLOAD' && !Array.isArray(f.value)) continue
    if (!Array.isArray(f.value)) continue
    for (const item of f.value as TallyFile[]) {
      if (item && typeof item.url === 'string' && /^https?:\/\//.test(item.url)) {
        items.push({
          url: item.url,
          type: isVideoFile(item) ? 'video' : 'photo',
          mimeType: item.mimeType,
          name: item.name,
        })
      }
    }
  }
  return items
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
  const opts = {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-matroska',
      'video/3gpp',
    ],
  }
  const { error } = await admin.storage.createBucket(STORAGE_BUCKET, opts)
  if (error) {
    await admin.storage.updateBucket(STORAGE_BUCKET, opts).catch(() => {})
  }
  bucketEnsured = true
}

async function uploadMediaFromUrl(
  bienId: string,
  media: ParsedTallyMedia,
  index: number,
): Promise<{ url: string | null; error?: string; provider?: string }> {
  const isVideo = media.type === 'video'
  // 1. Cloudinary en priorité si creds dispos
  const cn = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^﻿/, '')
  const ck = process.env.CLOUDINARY_API_KEY?.trim().replace(/^﻿/, '')
  const cs = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^﻿/, '')
  if (cn && ck && cs) {
    cloudinary.config({ cloud_name: cn, api_key: ck, api_secret: cs })
    try {
      const result = await cloudinary.uploader.upload(media.url, {
        folder: `biens/${bienId}`,
        public_id: `tally-${Date.now()}-${index}`,
        resource_type: isVideo ? 'video' : 'image',
        timeout: 45000,
      })
      return { url: result.secure_url, provider: 'cloudinary' }
    } catch (e) {
      // Fallback Supabase si Cloudinary échoue
      const cloudinaryErr = (e as Error).message?.slice(0, 80) || 'unknown'
      const fallback = await uploadToSupabase(bienId, media, index)
      return fallback.url
        ? { ...fallback, provider: `supabase(after_cloudinary_fail:${cloudinaryErr})` }
        : { url: null, error: `cloudinary:${cloudinaryErr} | ${fallback.error}` }
    }
  }
  // 2. Pas de creds Cloudinary → Supabase direct
  return uploadToSupabase(bienId, media, index)
}

async function uploadToSupabase(
  bienId: string,
  media: ParsedTallyMedia,
  index: number,
): Promise<{ url: string | null; error?: string; provider?: string }> {
  try {
    await ensureBucket()
    const res = await fetch(media.url)
    if (!res.ok) return { url: null, error: `fetch_${res.status}` }
    const arrayBuffer = await res.arrayBuffer()
    if (arrayBuffer.byteLength > 100 * 1024 * 1024) return { url: null, error: 'too_large' }

    const isVideo = media.type === 'video'
    let contentType = res.headers.get('content-type') || media.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg')
    if (!isVideo && !contentType.startsWith('image/')) contentType = 'image/jpeg'
    if (isVideo && !contentType.startsWith('video/')) contentType = 'video/mp4'

    const ext = isVideo
      ? contentType.includes('quicktime')
        ? 'mov'
        : contentType.includes('webm')
          ? 'webm'
          : 'mp4'
      : contentType.includes('png')
        ? 'png'
        : contentType.includes('webp')
          ? 'webp'
          : contentType.includes('heic')
            ? 'heic'
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
  const baseUrl = rawUrl || 'https://www.bogbesgroup.com'
  const link = `${baseUrl}/confirmer/${token}`
  const text = `🏠 *BOGBE'S GROUPE* — Votre annonce a été reçue !

*${titre}*

Cliquez ci-dessous pour la publier maintenant :
${link}

Ce lien valide votre numéro et publie votre annonce en 1 clic. Valide 7 jours.`

  await wasenderSendMessage(phone, text, 'text')
}

/**
 * Insère immédiatement les médias (avec l'URL Tally initiale pour qu'aucun bien
 * ne se retrouve jamais sans photo/vidéo en cas d'interruption serverless), puis
 * ré-héberge tous les fichiers en parallèle sur Cloudinary / Supabase Storage
 * et met à jour chaque ligne de biens_medias dès que l'upload est terminé.
 */
async function attachAndRehostMedias(
  bienId: string,
  mediaFiles: ParsedTallyMedia[],
): Promise<{ inserted: number; rehosted: number; trace: string[] }> {
  const trace: string[] = []
  if (mediaFiles.length === 0) return { inserted: 0, rehosted: 0, trace }

  const admin = createAdminClient()
  let firstPhotoAssigned = false
  const initialRows = mediaFiles.map((m, i) => {
    const isCover = m.type === 'photo' && !firstPhotoAssigned
    if (isCover) firstPhotoAssigned = true
    return {
      bien_id: bienId,
      type: m.type,
      url: m.url,
      ordre: i,
      est_couverture: isCover,
    }
  })

  const { data: insertedRows, error: insErr } = await admin
    .from('biens_medias')
    .insert(initialRows)
    .select('id, ordre')

  if (insErr || !insertedRows) {
    trace.push(`initial_insert_fail:${insErr?.message?.slice(0, 80)}`)
    return { inserted: 0, rehosted: 0, trace }
  }

  const idByOrdre = new Map<number, string>()
  for (const r of insertedRows as { id: string; ordre: number }[]) {
    idByOrdre.set(r.ordre, r.id)
  }

  let rehosted = 0
  await Promise.allSettled(
    mediaFiles.map(async (m, i) => {
      const r = await uploadMediaFromUrl(bienId, m, i)
      if (r.url) {
        rehosted++
        trace.push(`media${i}:ok:${r.provider || 'cloud'}`)
        const rowId = idByOrdre.get(i)
        if (rowId) {
          await admin.from('biens_medias').update({ url: r.url }).eq('id', rowId)
        }
      } else {
        // On conserve l'URL Tally déjà insérée dans biens_medias !
        trace.push(`media${i}:kept_tally_url(${r.error})`)
      }
    }),
  )

  return { inserted: insertedRows.length, rehosted, trace }
}

import { waitUntil } from '@vercel/functions'

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
  const mediaFiles = readMediaFiles(fields)

  if (!phone) return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
  if (!rawText) return NextResponse.json({ error: 'missing_raw_text' }, { status: 400 })

  // Idempotence: dérive un UUID stable depuis submissionId/responseId/eventId.
  const submissionKey =
    payload.data?.submissionId ||
    payload.data?.responseId ||
    payload.eventId ||
    null
  const stableBienId = submissionKey ? deriveBienId(submissionKey) : null

  const admin = createAdminClient()
  if (stableBienId) {
    const { data: existing } = await admin
      .from('biens')
      .select('id, titre, proprietaire_id')
      .eq('id', stableBienId)
      .maybeSingle()
    if (existing) {
      // Si un premier appel avait créé le bien mais avait été interrompu avant d'insérer les médias,
      // on rattrape les médias manquants en tâche de fond !
      if (mediaFiles.length > 0) {
        const { count } = await admin
          .from('biens_medias')
          .select('id', { count: 'exact', head: true })
          .eq('bien_id', existing.id)
        if ((count ?? 0) === 0) {
          waitUntil(
            (async () => {
              await attachAndRehostMedias(existing.id, mediaFiles)
              await sendConfirmationWhatsApp(phone, existing.id, existing.proprietaire_id, existing.titre).catch(() => null)
            })(),
          )
          return NextResponse.json({
            ok: true,
            bien_id: existing.id,
            dedup: 'tally_retry_recovered_medias',
            submission_key: submissionKey,
          })
        }
      }
      return NextResponse.json({
        ok: true,
        bien_id: existing.id,
        dedup: 'tally_retry_detected',
        submission_key: submissionKey,
      })
    }
  }

  // ACK immédiat (< 1 s)
  waitUntil(
    processTallySubmission({ phone, rawText, mediaFiles, stableBienId }).catch((e: Error) =>
      console.error('[tally-webhook] traitement de fond échoué:', e?.message),
    ),
  )
  return NextResponse.json({ ok: true, accepted: true, submission_key: submissionKey })
}

/** Traitement complet d'une soumission Tally, exécuté après l'ACK HTTP. */
async function processTallySubmission(args: {
  phone: string
  rawText: string
  mediaFiles: ParsedTallyMedia[]
  stableBienId: string | null
}): Promise<void> {
  const { phone, rawText, mediaFiles, stableBienId } = args

  // Exécuter l'extraction IA (avec garde-fou de 10 s max) ET la création/recherche utilisateur EN PARALLÈLE
  const extractionWithTimeout = Promise.race([
    extractBienFromWhatsApp(rawText).catch((e: Error) => ({
      data: null,
      trace: [`fatal:${e.message?.slice(0, 100)}`],
    })),
    new Promise<{ data: null; trace: string[] }>((resolve) =>
      setTimeout(() => resolve({ data: null, trace: ['timeout_10s'] }), 10_000),
    ),
  ])

  const [extResult, userId] = await Promise.all([
    extractionWithTimeout,
    findOrCreateUserByPhone(phone),
  ])
  const extracted = extResult.data
  const admin = createAdminClient()

  const bienInsert = {
    ...(stableBienId && { id: stableBienId }),
    proprietaire_id: userId,
    statut: 'en_attente' as const,
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

  // Race condition: 2e retry arrivé entre le SELECT et le INSERT → conflit PK
  if (bienErr?.code === '23505' && stableBienId) return

  if (bienErr || !bien) {
    console.error('[tally-webhook] insertion bien échouée:', bienErr?.message)
    return
  }

  // En parallèle :
  // 1) Insertion immédiate des médias dans biens_medias + ré-hébergement parallèle vers Cloudinary/Supabase
  // 2) Envoi WhatsApp de confirmation au propriétaire
  // 3) Notification WhatsApp aux administrateurs
  const [mediaRes] = await Promise.all([
    attachAndRehostMedias(bien.id, mediaFiles),
    sendConfirmationWhatsApp(phone, bien.id, userId, bien.titre).catch((err) => {
      console.error('[tally-webhook] sendConfirmationWhatsApp failed:', err)
      return null
    }),
    notifyAdminBienSubmitted(admin, {
      id: bien.id,
      titre: bien.titre,
      typeBien: extracted?.type_bien,
      commune: extracted?.commune,
      quartier: extracted?.quartier,
      prix: extracted?.prix_mois_fcfa || extracted?.prix_nuit_fcfa || extracted?.prix_vente_fcfa,
      proprietairePhone: phone,
    }).catch((err) => {
      console.error('[tally-webhook] Failed to notify admin', err)
    }),
  ])

  console.log(
    `[tally-webhook] bien ${bien.id} créé — confiance ${extracted?.confidence ?? 0}, médias insérés ${mediaRes.inserted}/${mediaFiles.length} (ré-hébergés ${mediaRes.rehosted})`,
    mediaRes.trace.length ? mediaRes.trace.join(',') : '',
  )
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'tally-webhook', ts: new Date().toISOString() })
}
