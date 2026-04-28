import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractBienFromWhatsApp } from '@/lib/extractors/whatsapp-bien-extractor'
import { signMagicLinkToken } from '@/lib/auth/magic-link-token'
import { wasenderSendMessage } from '@/lib/wasender'
import { cloudinary } from '@/lib/cloudinary'

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

async function uploadImageFromUrl(
  bienId: string,
  sourceUrl: string,
  index: number
): Promise<string | null> {
  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      folder: `biens/${bienId}`,
      public_id: `tally-${Date.now()}-${index}`,
      resource_type: 'image',
      timeout: 30000,
    })
    return result.secure_url
  } catch {
    return null
  }
}

async function sendConfirmationWhatsApp(phone: string, bien_id: string, user_id: string, titre: string) {
  const token = await signMagicLinkToken({ bien_id, user_id, phone })
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/^﻿/, '')
  const baseUrl = rawUrl || 'https://immo-sigma.vercel.app'
  const link = `${baseUrl}/confirmer/${token}`
  const text = `🏠 *Immo CI* — Votre annonce a été reçue !

*${titre}*

Cliquez ci-dessous pour la publier maintenant :
${link}

Ce lien valide votre numéro et publie votre annonce en 1 clic. Valide 7 jours.`

  await wasenderSendMessage(phone, text, 'text')
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('tally-signature')
  if (!verifyTallySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  let payload: { data?: { fields?: TallyField[] } }
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

  const extResult = await extractBienFromWhatsApp(rawText).catch((e: Error) => ({
    data: null,
    trace: [`fatal:${e.message?.slice(0, 100)}`],
  }))
  const extracted = extResult.data
  const lowConfidence = !extracted || extracted.confidence < 0.5

  const userId = await findOrCreateUserByPhone(phone)
  const admin = createAdminClient()

  const bienInsert = {
    proprietaire_id: userId,
    statut: 'brouillon' as const,
    titre: extracted?.titre || 'Annonce en attente de validation',
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

  if (bienErr || !bien) {
    return NextResponse.json({ error: 'bien_insert_failed', detail: bienErr?.message }, { status: 500 })
  }

  if (imageUrls.length > 0) {
    const uploaded: string[] = []
    for (let i = 0; i < imageUrls.length; i++) {
      const url = await uploadImageFromUrl(bien.id, imageUrls[i], i)
      if (url) uploaded.push(url)
    }
    if (uploaded.length > 0) {
      const mediasRows = uploaded.map((url, i) => ({
        bien_id: bien.id,
        type: 'photo' as const,
        url,
        ordre: i,
        est_couverture: i === 0,
      }))
      await admin.from('biens_medias').insert(mediasRows)
    }
  }

  await sendConfirmationWhatsApp(phone, bien.id, userId, bien.titre).catch(() => null)

  return NextResponse.json({
    ok: true,
    bien_id: bien.id,
    user_id: userId,
    extraction_confidence: extracted?.confidence ?? 0,
    low_confidence: lowConfidence,
    images_uploaded: imageUrls.length,
    trace: extResult.trace,
  })
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'tally-webhook', ts: new Date().toISOString() })
}
