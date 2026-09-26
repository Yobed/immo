import crypto from 'crypto'
import { createLocauxAdminClient } from '@/lib/supabase/locaux'
import { extractBienFromWhatsApp, type ExtractedBien } from '@/lib/extractors/whatsapp-bien-extractor'

export interface IngestWhatsAppListingParams {
  rawMessage: string
  messageId?: string | null
  senderPhone?: string | null
  senderName?: string | null
  groupJid?: string | null
  groupName?: string | null
  imageMessage?: Record<string, unknown> | null
  preExtracted?: ExtractedBien | null
  publishedAt?: string | null
}

export interface IngestWhatsAppListingResult {
  action: 'inserted' | 'renewed' | 'skipped' | 'error'
  id?: number | null
  ref_bien?: string
  reason?: string
}

function sanitizeText(val: string | null | undefined, maxLen = 2000): string {
  if (!val) return ''
  return String(val)
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFEFF]/g, '')
    .trim()
    .slice(0, maxLen)
}

function extractPhoneFromText(text: string): string | null {
  const cleaned = text.replace(/[.\-\s/]/g, ' ')
  const match = cleaned.match(/\b(?:225\s*)?((?:01|05|07)\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2})\b/)
  if (match?.[1]) {
    return '225' + match[1].replace(/\s+/g, '')
  }
  return null
}

function buildRefBien(typeBien: string, commune: string, isVente: boolean, hashHex: string): string {
  const tCode = (typeBien || 'LOC').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X')
  const cCode = (commune || 'ABI')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X')
  const oCode = isVente ? 'V' : 'L'
  const suffix = hashHex.slice(0, 8).toUpperCase()
  return `${tCode}-${cCode}-${oCode}-${suffix}`
}

async function decryptAndUploadImage(
  messageId: string | null | undefined,
  imageMessage: Record<string, unknown> | null | undefined,
  refBien: string,
): Promise<string> {
  if (!messageId || !imageMessage) return ''
  const wasenderKey = process.env.WASSENDER_SCRAPER_API_KEY
    || process.env.WASSENDER_API_KEY
    || 'd5c9e3e991ef6c1032622dea850799388f52e917f8e2dae3351459c1f447f5cd'

  try {
    const decRes = await fetch('https://www.wasenderapi.com/api/decrypt-media', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${wasenderKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          messages: {
            key: { id: messageId },
            message: { imageMessage },
          },
        },
      }),
    })
    if (!decRes.ok) return ''
    const decJson = (await decRes.json()) as { publicUrl?: string; data?: { publicUrl?: string } }
    const publicUrl = decJson.publicUrl || decJson.data?.publicUrl || ''
    if (!publicUrl) return ''

    const imgRes = await fetch(publicUrl)
    if (!imgRes.ok) return ''
    const buf = Buffer.from(await imgRes.arrayBuffer())

    const admin = createLocauxAdminClient()
    const fileName = `${refBien.replace(/[^a-zA-Z0-9-_]/g, '_')}_${Date.now()}.jpg`
    const { error: upErr } = await admin.storage
      .from('biens-images')
      .upload(fileName, buf, { contentType: 'image/jpeg', upsert: true })

    if (upErr) return ''
    const { data: pub } = admin.storage.from('biens-images').getPublicUrl(fileName)
    return pub?.publicUrl || ''
  } catch {
    return ''
  }
}

export async function ingestWhatsAppListingToLocaux(
  params: IngestWhatsAppListingParams,
): Promise<IngestWhatsAppListingResult> {
  const raw = sanitizeText(params.rawMessage, 3000)
  if (raw.length < 30) {
    return { action: 'skipped', reason: 'message_too_short' }
  }

  let extracted = params.preExtracted ?? null
  if (!extracted || !('prix_mois_fcfa' in extracted)) {
    const res = await extractBienFromWhatsApp(raw).catch(() => ({ data: null }))
    extracted = res.data
  }

  if (!extracted || extracted.confidence < 0.6) {
    return { action: 'skipped', reason: 'low_confidence_or_not_listing' }
  }

  const normalizedForHash = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
  const contentHash = crypto.createHash('sha256').update(normalizedForHash).digest('hex').slice(0, 24)

  const isVente = extracted.prix_vente_fcfa != null && extracted.prix_mois_fcfa == null && extracted.prix_nuit_fcfa == null
  const prixValue = extracted.prix_mois_fcfa ?? extracted.prix_vente_fcfa ?? extracted.prix_nuit_fcfa ?? null
  const refBien = buildRefBien(extracted.type_bien, extracted.commune, isVente, contentHash)

  const admin = createLocauxAdminClient()
  const nowIso = params.publishedAt || new Date().toISOString()
  const expIso = new Date(new Date(nowIso).getTime() + 30 * 24 * 3600 * 1000).toISOString()

  try {
    // 1. Check duplicate by content_hash or publication_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dupQuery = (admin as any)
      .from('locaux')
      .select('id, ref_bien, relance_count')
      .eq('content_hash', contentHash)
      .limit(1)

    if (params.messageId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dupQuery = (admin as any)
        .from('locaux')
        .select('id, ref_bien, relance_count')
        .or(`content_hash.eq.${contentHash},publication_id.eq.${sanitizeText(params.messageId, 120)}`)
        .limit(1)
    }

    const { data: existingRows } = await dupQuery
    if (Array.isArray(existingRows) && existingRows.length > 0) {
      const ex = existingRows[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from('locaux')
        .update({
          status: 'active',
          disponible: 'Oui',
          date_expiration: expIso,
          relance_count: (ex.relance_count || 0) + 1,
          date_derniere_relance: nowIso,
        })
        .eq('id', ex.id)

      return { action: 'renewed', id: ex.id, ref_bien: ex.ref_bien || refBien }
    }

    // 2. Decrypt & upload image if present
    const lienImage = await decryptAndUploadImage(params.messageId, params.imageMessage, refBien)

    const phoneInText = extractPhoneFromText(raw)
    const senderPhone = sanitizeText(params.senderPhone, 40)
    const meubles =
      extracted.type_bien === 'residence_meublee' || extracted.equipements?.includes('meuble')
        ? 'Oui'
        : 'Non'

    const row = {
      ref_bien: refBien,
      content_hash: contentHash,
      type_de_bien: sanitizeText(extracted.type_bien, 80),
      type_offre: isVente ? 'Vente' : 'Location',
      zone_geographique: sanitizeText(extracted.commune, 120),
      commune: sanitizeText(extracted.commune, 120),
      quartier: sanitizeText(extracted.quartier, 120),
      prix: prixValue != null ? String(prixValue) : '',
      prix_normalise: prixValue,
      surface: extracted.surface_m2 != null ? `${extracted.surface_m2} m²` : '',
      chambre: String(extracted.nb_chambres ?? extracted.nb_pieces ?? ''),
      meubles,
      caracteristiques: sanitizeText(extracted.description || extracted.titre, 1000),
      telephone_bien: phoneInText || senderPhone,
      telephone_expediteur: senderPhone,
      expediteur: sanitizeText(params.senderName, 120),
      publie_par: sanitizeText(params.senderName, 120),
      disponible: 'Oui',
      status: 'active',
      is_duplicate: false,
      groupe_whatsapp_origine: sanitizeText(params.groupName || 'WhatsApp Direct', 160),
      groupe_whatsapp_jid: sanitizeText(params.groupJid, 120),
      message_initial: sanitizeText(raw, 1500),
      publication_id: sanitizeText(params.messageId, 120) || `WA-${contentHash}`,
      date_publication: nowIso,
      date_expiration: expIso,
      relance_count: 0,
      lien_image: lienImage,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insErr } = await (admin as any)
      .from('locaux')
      .insert(row)
      .select('id, ref_bien')
      .single()

    if (insErr) {
      console.error('[locaux-ingest] insert error:', insErr.message)
      return { action: 'error', reason: insErr.message }
    }

    return { action: 'inserted', id: inserted?.id ?? null, ref_bien: inserted?.ref_bien ?? refBien }
  } catch (err) {
    console.error('[locaux-ingest] unexpected error:', err)
    return { action: 'error', reason: (err as Error).message }
  }
}
