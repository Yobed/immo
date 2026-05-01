import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // Anti-spam basique : 1 demande / 24h pour le même visiteur sur le même bien
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('contact_requests')
    .select('id, admin_validation_status, created_at')
    .eq('bien_id', bienId)
    .or(
      user
        ? `visitor_id.eq.${user.id},visitor_phone.eq.${visitorPhone}`
        : `visitor_phone.eq.${visitorPhone}`
    )
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      {
        error: 'Vous avez déjà fait une demande pour ce bien dans les dernières 24h',
        existingId: existing[0].id,
        status: existing[0].admin_validation_status,
      },
      { status: 409 }
    )
  }

  // Création (en service_role pour bypasser RLS si visitor_id null + utilisateur non auth)
  const admin = createAdminClient()
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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const ctx: ContactRequestContext = {
    id: created.id,
    bienTitre: bien.titre || 'Bien',
    bienCommune: bien.commune ?? null,
    visitorName,
    visitorPhone,
    visitorEmail,
    reason: body.reason ?? null,
  }

  // Notif équipe admin (await obligatoire sur Vercel serverless)
  let notif: { sent: number; total: number } = { sent: 0, total: 0 }
  try {
    notif = await notifyAdminContactRequest(admin, ctx)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[contact-requests] notifyAdmin failed', err)
  }

  return NextResponse.json(
    { id: created.id, admin_validation_status: 'pending', notified: notif },
    { status: 201 }
  )
}
