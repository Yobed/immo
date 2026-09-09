import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { ensureProspectForIntake, samePhone } from '@/lib/crm/intake'
import {
  notifyAdminContactRequest,
  type ContactRequestContext,
} from '@/lib/notifications/whatsapp-notifier'

/**
 * POST /api/contact-requests
 * Crée une demande de contact propriétaire et notifie l'équipe admin.
 * Le numéro du proprio n'est jamais retourné dans la réponse.
 *
 * Body :
 *  - bienId      (uuid, requis)
 *  - visitorName (string, requis si non connecté)
 *  - visitorPhone (string, requis si non connecté)
 *  - visitorEmail (string, optionnel)
 *  - reason       (string, optionnel)
 */
export async function POST(req: NextRequest) {
  // Rate limit : max 8 demandes de contact par IP / 10 minutes
  const rl = checkRateLimit(req, { scope: 'contact-create', max: 8, windowMs: 10 * 60_000 })
  if (!rl.ok) return rateLimitResponse(rl)

  const { user, supabase } = await getServerUser(req)

  const body = await req.json() as {
    bienId?: string
    visitorName?: string
    visitorPhone?: string
    visitorEmail?: string
    reason?: string
  }

  const bienId = body.bienId?.trim()
  if (!bienId) {
    return NextResponse.json({ error: 'bienId requis' }, { status: 400 })
  }

  // Le bien doit exister et être publié
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien, error: bienErr } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, statut, proprietaire_id')
    .eq('id', bienId)
    .single()

  if (bienErr || !bien) {
    return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 })
  }
  if (bien.statut !== 'publie') {
    return NextResponse.json({ error: "Ce bien n'est pas disponible" }, { status: 400 })
  }
  if (user && bien.proprietaire_id === user.id) {
    return NextResponse.json(
      { error: "Vous êtes le propriétaire de ce bien" },
      { status: 400 }
    )
  }

  // Visiteur : connecté → on prend ses infos profil ; sinon → infos du body
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
      { error: 'Nom et téléphone visiteur requis' },
      { status: 400 }
    )
  }

  // Use the service client for dedupe: anonymous visitors have no SELECT policy.
  // Compare canonical forms so 05…, +22505… and 00225 05… are one person.
  const admin = createAdminClient()
  // Anti-spam basique : 1 demande / 24h pour le même visiteur sur le même bien
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('contact_requests')
    .select('id, admin_validation_status, created_at, visitor_id, visitor_phone')
    .eq('bien_id', bienId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50)

  const duplicate = (existing ?? []).find((row: { id: string; admin_validation_status: string; visitor_id?: string | null; visitor_phone?: string | null }) =>
    row.admin_validation_status !== 'rejected' &&
    ((user && row.visitor_id === user.id) || samePhone(row.visitor_phone, visitorPhone))
  )

  if (duplicate) {
    return NextResponse.json(
      {
        error: 'Vous avez déjà fait une demande pour ce bien dans les dernières 24h',
        existingId: duplicate.id,
        status: duplicate.admin_validation_status,
      },
      { status: 409 }
    )
  }

  // Création (en service_role pour bypasser RLS si visitor_id null + utilisateur non auth)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (admin as any)
    .from('contact_requests')
    .insert({
      bien_id: bienId,
      proprietaire_id: bien.proprietaire_id,
      visitor_id: user?.id ?? null,
      visitor_name: visitorName,
      visitor_phone: visitorPhone,
      visitor_email: visitorEmail,
      reason: body.reason?.trim() || null,
      source: 'web',
    })
    .select('id')
    .single()

  if (error) {
    // The SQL fingerprint closes the concurrent check-then-insert race.
    if (error.code === '23505') {
      const { data: raced } = await (admin as any)
        .from('contact_requests')
        .select('id, admin_validation_status')
        .eq('bien_id', bienId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (raced) return NextResponse.json({
        error: 'Vous avez déjà fait une demande pour ce bien dans les dernières 24h',
        existingId: raced.id,
        status: raced.admin_validation_status,
      }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const prospectId = await ensureProspectForIntake({
    phone: visitorPhone,
    name: visitorName,
    message: body.reason,
    source: 'web',
    entity: 'contact',
    entityId: created.id,
    supabase: admin,
  })

  // Charge le contact du propriétaire pour l'inclure dans la notif admin :
  // l'admin doit pouvoir joindre le proprio tout de suite.
  let ownerName: string | null = null
  let ownerPhone: string | null = null
  if (bien.proprietaire_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: owner } = await (admin as any)
      .from('profiles')
      .select('full_name, phone')
      .eq('id', bien.proprietaire_id)
      .single()
    ownerName = owner?.full_name ?? null
    ownerPhone = owner?.phone ?? null
  }

  const ctx: ContactRequestContext = {
    id: created.id,
    bienTitre: bien.titre || 'Bien',
    bienCommune: bien.commune ?? null,
    visitorName,
    visitorPhone,
    visitorEmail,
    reason: body.reason ?? null,
    ownerName,
    ownerPhone,
    bienUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bogbesgroup.com'}/biens/${bienId}`,
  }

  // Notif équipe admin (await obligatoire sur Vercel serverless)
  let notif: { sent: number; failed: number; total: number } = { sent: 0, failed: 0, total: 0 }
  try {
    notif = await notifyAdminContactRequest(admin, ctx)
  } catch (err) {
    // Notification failure is non-critical — request still succeeds, but the
    // response keeps an explicit failed count for the admin UI/monitoring.
    notif = { sent: 0, failed: 1, total: 1 }
    console.error('[contact-request] admin notification failure', err)
  }

  return NextResponse.json(
    { id: created.id, prospect_id: prospectId, admin_validation_status: 'pending', notified: notif },
    { status: 201 }
  )
}
