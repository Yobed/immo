import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { locauxAdminForId } from '@/lib/supabase/locaux'
import {
  notifyAdminContactRequest,
  type ContactRequestContext,
} from '@/lib/notifications/whatsapp-notifier'
import { isHoneypotFilledInBody } from '@/lib/honeypot'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const runtime = 'nodejs'

/**
 * POST /api/flash-contact
 * Workflow d'intermédiation pour les offres flash WhatsApp (table `locaux`).
 *
 * Le client (visiteur du site) demande à entrer en contact via BOGBE'S.
 * Le proprio scrapé n'est PAS notifié automatiquement — l'admin/conseiller
 * récupère la demande dans /admin/suivi et contacte le proprio manuellement
 * depuis flash_owner_phone (visible uniquement admin).
 *
 * Body :
 *  - locauxId      (number, requis)
 *  - visitorName   (string, requis si non connecté)
 *  - visitorPhone  (string, requis si non connecté)
 *  - visitorEmail  (string, optionnel)
 *  - reason        (string, optionnel)
 */
export async function POST(req: NextRequest) {
  // Rate limit : 5 demandes par 10min par IP
  const rl = checkRateLimit(req, { scope: 'flash-contact', max: 5, windowMs: 10 * 60_000 })
  if (!rl.ok) return rateLimitResponse(rl)

  const { user, supabase } = await getServerUser(req)

  const body = (await req.json().catch(() => null)) as
    | (Record<string, unknown> & {
        locauxId?: number | string
        visitorName?: string
        visitorPhone?: string
        visitorEmail?: string
        reason?: string
      })
    | null

  if (!body) return NextResponse.json({ error: 'Body invalide' }, { status: 400 })

  // Honeypot : si rempli → bot, silent success (ne pas révéler la détection)
  if (isHoneypotFilledInBody(body)) {
    return NextResponse.json(
      { success: true, message: 'Demande enregistrée.' },
      { status: 201 },
    )
  }

  const locauxId = typeof body.locauxId === 'string' ? parseInt(body.locauxId, 10) : body.locauxId
  if (!locauxId || isNaN(locauxId)) {
    return NextResponse.json({ error: 'locauxId requis' }, { status: 400 })
  }

  // 1) Récupérer le bien scrapé (admin client pour avoir telephone_bien)
  let locauxRow: {
    id: number
    ref_bien: string | null
    type_de_bien: string | null
    commune: string | null
    quartier: string | null
    telephone_bien: string | null
    telephone: string | null
    status: string | null
    is_duplicate: boolean | null
  } | null = null

  try {
    // Routage par id : offres historiques (id ≤ 99999) → ancien projet
    const locauxAdmin = locauxAdminForId(locauxId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (locauxAdmin as any)
      .from('locaux')
      .select('id, ref_bien, type_de_bien, commune, quartier, telephone_bien, telephone, status, is_duplicate')
      .eq('id', locauxId)
      .single()
    locauxRow = data
  } catch {
    return NextResponse.json({ error: 'Service indisponible (locaux)' }, { status: 503 })
  }

  if (!locauxRow) {
    return NextResponse.json({ error: 'Offre flash introuvable' }, { status: 404 })
  }
  if (locauxRow.status !== 'active' || locauxRow.is_duplicate) {
    return NextResponse.json({ error: "Cette offre n'est plus active" }, { status: 410 })
  }

  // 2) Visiteur : connecté → profil ; sinon → body
  let visitorName = (body.visitorName || '').trim()
  let visitorPhone = (body.visitorPhone || '').trim()
  let visitorEmail = (body.visitorEmail || '').trim() || null

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .single()
    if (profile) {
      visitorName = visitorName || profile.full_name || 'Visiteur'
      visitorPhone = visitorPhone || profile.phone || ''
      visitorEmail = visitorEmail || profile.email || null
    }
  }

  if (!visitorName || !visitorPhone) {
    return NextResponse.json(
      { error: 'Nom et téléphone requis pour la mise en relation' },
      { status: 400 },
    )
  }

  // 3) Anti-spam : 1 demande / 24h sur la même offre flash pour ce visiteur
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('contact_requests')
    .select('id, admin_validation_status, created_at')
    .eq('locaux_id', locauxId)
    .or(
      user
        ? `visitor_id.eq.${user.id},visitor_phone.eq.${visitorPhone}`
        : `visitor_phone.eq.${visitorPhone}`,
    )
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      {
        error: 'Demande déjà enregistrée — notre conseiller vous recontacte sous peu',
        existingId: existing[0].id,
        status: existing[0].admin_validation_status,
      },
      { status: 409 },
    )
  }

  // 4) Construction du titre figé (le bien locaux peut expirer)
  const titre = [locauxRow.type_de_bien, locauxRow.commune, locauxRow.quartier]
    .filter(Boolean)
    .join(' · ') || 'Offre flash'

  // 5) Insertion via service_role (bypass RLS pour visiteur anonyme)
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (admin as any)
    .from('contact_requests')
    .insert({
      bien_id: null,
      proprietaire_id: null,
      locaux_id: locauxId,
      flash_owner_phone: locauxRow.telephone_bien || locauxRow.telephone || null,
      flash_titre: titre,
      visitor_id: user?.id ?? null,
      visitor_name: visitorName,
      visitor_phone: visitorPhone,
      visitor_email: visitorEmail,
      reason: body.reason?.trim() || null,
      source: 'flash',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // 6) Notifier les admins par WhatsApp (best-effort, n'échoue pas la requête)
  try {
    const ctx: ContactRequestContext = {
      id: created.id,
      bienTitre: titre,
      bienCommune: locauxRow.commune,
      visitorName,
      visitorPhone,
      visitorEmail,
      reason: body.reason?.trim() || null,
      ownerName: null,
      ownerPhone: locauxRow.telephone_bien || locauxRow.telephone || null,
    }
    await notifyAdminContactRequest(admin, ctx)
  } catch (e) {
    // Notification failure is non-critical
  }

  return NextResponse.json(
    {
      success: true,
      id: created.id,
      message:
        'Demande enregistrée. Notre conseiller te recontacte rapidement pour organiser la visite.',
    },
    { status: 201 },
  )
}
