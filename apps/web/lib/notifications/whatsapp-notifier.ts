/**
 * Service centralisé pour les notifications WhatsApp métier (Immo CI)
 *
 * Workflow d'intermédiation :
 *  1. Visiteur fait une demande → notifyAdminTeam(...)
 *  2. Admin valide → notifyOwner(...) + notifyVisitor(...)
 *  3. Admin refuse → notifyVisitor avec message de refus
 *
 * Toutes les notifs sont journalisées dans la table whatsapp_notifications.
 */

import { wasenderSendMessage } from '@/lib/wasender'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------- Types ----------------

export type NotificationRelatedType = 'visite' | 'reservation' | 'contact_request'
export type RecipientRole = 'admin' | 'owner' | 'visitor'

export interface VisitContext {
  id: string
  bienTitre: string
  bienCommune: string | null
  dateSouhaitee: string // ISO
  heureDebut?: string | null
  heureFin?: string | null
  visitorName: string
  visitorPhone: string
  ownerName?: string | null
  ownerPhone?: string | null
  notes?: string | null
}

export interface ReservationContext {
  id: string
  bienTitre: string
  bienCommune: string | null
  dateDebut: string
  dateFin: string
  montantTotal: number
  visitorName: string
  visitorPhone: string
  ownerName?: string | null
  ownerPhone?: string | null
}

interface SendResult {
  success: boolean
  externalId?: string
  error?: string
}

// ---------------- Helpers ----------------

/**
 * Numéros WhatsApp de l'équipe admin (toi + associé), séparés par virgule.
 * Ex: ADMIN_WHATSAPP_NUMBERS="+2250707111111,+2250707222222"
 */
function getAdminNumbers(): string[] {
  const raw = process.env.ADMIN_WHATSAPP_NUMBERS || ''
  return raw
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    'http://localhost:3000'
  )
}

function formatDateFR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatMoneyFCFA(n: number): string {
  return `${n.toLocaleString('fr-FR')} FCFA`
}

// ---------------- Logger DB ----------------

async function logNotification(
  supabase: SupabaseClient,
  params: {
    toPhone: string
    role: RecipientRole
    template: string
    relatedType: NotificationRelatedType
    relatedId: string
    payload: Record<string, unknown>
    result: SendResult
  }
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('whatsapp_notifications') as any).insert({
      to_phone: params.toPhone,
      recipient_role: params.role,
      template: params.template,
      related_type: params.relatedType,
      related_id: params.relatedId,
      payload: params.payload,
      status: params.result.success ? 'sent' : 'failed',
      external_id: params.result.externalId ?? null,
      error_message: params.result.error ?? null,
      sent_at: params.result.success ? new Date().toISOString() : null,
    })
  } catch (err) {
    // Le log ne doit jamais bloquer le flow métier
    // eslint-disable-next-line no-console
    console.error('[whatsapp-notifier] failed to log notification', err)
  }
}

async function send(
  to: string,
  message: string
): Promise<SendResult> {
  try {
    const res = await wasenderSendMessage(to, message)
    if (!res.status) {
      return { success: false, error: res.message || 'Wasender error' }
    }
    return {
      success: true,
      externalId: res.data?.messageId ?? res.data?.id ?? undefined,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected send error',
    }
  }
}

// ---------------- Templates VISITES ----------------

function tplAdminVisitRequest(ctx: VisitContext): string {
  const baseUrl = getBaseUrl()
  const dateFr = formatDateFR(ctx.dateSouhaitee)
  const horaire =
    ctx.heureDebut && ctx.heureFin
      ? `${ctx.heureDebut} - ${ctx.heureFin}`
      : 'horaire non précisé'

  return [
    '🏠 *NOUVELLE DEMANDE DE VISITE*',
    '',
    `*Bien :* ${ctx.bienTitre}`,
    ctx.bienCommune ? `*Commune :* ${ctx.bienCommune}` : null,
    `*Réf :* #${ctx.id.slice(0, 8)}`,
    '',
    `*Visiteur :* ${ctx.visitorName}`,
    `*Tél :* ${ctx.visitorPhone}`,
    '',
    `*Date souhaitée :* ${dateFr}`,
    `*Créneau :* ${horaire}`,
    ctx.notes ? `*Note :* ${ctx.notes}` : null,
    '',
    `📋 Voir et valider : ${baseUrl}/admin/suivi/visites/${ctx.id}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function tplOwnerVisitAnnounce(ctx: VisitContext): string {
  const dateFr = formatDateFR(ctx.dateSouhaitee)
  const horaire =
    ctx.heureDebut && ctx.heureFin
      ? `${ctx.heureDebut} - ${ctx.heureFin}`
      : null

  return [
    `Bonjour ${ctx.ownerName || ''} 👋`,
    '',
    `J'ai un client intéressé par votre bien *« ${ctx.bienTitre} »*${
      ctx.bienCommune ? ` à *${ctx.bienCommune}*` : ''
    }.`,
    '',
    `Je l'accompagnerai personnellement pour une visite prévue le *${dateFr}*${
      horaire ? ` (${horaire})` : ''
    }.`,
    '',
    'Merci de me confirmer votre disponibilité pour ce créneau.',
    '',
    '— *Immo CI*',
  ].join('\n')
}

function tplVisitorVisitConfirmed(ctx: VisitContext): string {
  const dateFr = formatDateFR(ctx.dateSouhaitee)
  const horaire =
    ctx.heureDebut && ctx.heureFin
      ? `${ctx.heureDebut} - ${ctx.heureFin}`
      : null

  return [
    `Bonjour ${ctx.visitorName} 👋`,
    '',
    `Votre demande de visite pour *« ${ctx.bienTitre} »*${
      ctx.bienCommune ? ` (${ctx.bienCommune})` : ''
    } a été *confirmée* ✅`,
    '',
    `🗓️ *Date :* ${dateFr}`,
    horaire ? `🕐 *Créneau :* ${horaire}` : null,
    '',
    'Je vous contacterai 1h avant la visite pour vous communiquer l\'adresse exacte et les modalités.',
    '',
    '— *Immo CI*',
  ]
    .filter(Boolean)
    .join('\n')
}

function tplVisitorVisitRejected(ctx: VisitContext, reason?: string): string {
  return [
    `Bonjour ${ctx.visitorName},`,
    '',
    `Nous ne pouvons malheureusement pas donner suite à votre demande de visite pour *« ${ctx.bienTitre} »*.`,
    reason ? '' : null,
    reason ? `Raison : ${reason}` : null,
    '',
    'N\'hésitez pas à consulter d\'autres biens disponibles sur notre plateforme.',
    '',
    '— *Immo CI*',
  ]
    .filter((x) => x !== null)
    .join('\n')
}

// ---------------- Templates RESERVATIONS ----------------

function tplAdminReservationRequest(ctx: ReservationContext): string {
  const baseUrl = getBaseUrl()
  return [
    '📝 *NOUVELLE DEMANDE DE RÉSERVATION*',
    '',
    `*Bien :* ${ctx.bienTitre}`,
    ctx.bienCommune ? `*Commune :* ${ctx.bienCommune}` : null,
    `*Réf :* #${ctx.id.slice(0, 8)}`,
    '',
    `*Visiteur :* ${ctx.visitorName}`,
    `*Tél :* ${ctx.visitorPhone}`,
    '',
    `*Période :* du ${formatDateFR(ctx.dateDebut)} au ${formatDateFR(ctx.dateFin)}`,
    `*Montant total :* ${formatMoneyFCFA(ctx.montantTotal)}`,
    '',
    `📋 Voir et valider : ${baseUrl}/admin/suivi/reservations/${ctx.id}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function tplOwnerReservationAnnounce(ctx: ReservationContext): string {
  return [
    `Bonjour ${ctx.ownerName || ''} 👋`,
    '',
    `J'ai un client qui souhaite réserver votre bien *« ${ctx.bienTitre} »*${
      ctx.bienCommune ? ` à *${ctx.bienCommune}*` : ''
    }.`,
    '',
    `*Période :* du ${formatDateFR(ctx.dateDebut)} au ${formatDateFR(ctx.dateFin)}`,
    `*Montant total :* ${formatMoneyFCFA(ctx.montantTotal)}`,
    '',
    'Je gère le dossier et vous tiens informé(e) de la suite.',
    '',
    '— *Immo CI*',
  ].join('\n')
}

function tplVisitorReservationConfirmed(ctx: ReservationContext): string {
  return [
    `Bonjour ${ctx.visitorName} 👋`,
    '',
    `Votre demande de réservation pour *« ${ctx.bienTitre} »* est *confirmée* ✅`,
    '',
    `🗓️ *Période :* du ${formatDateFR(ctx.dateDebut)} au ${formatDateFR(ctx.dateFin)}`,
    `💰 *Total :* ${formatMoneyFCFA(ctx.montantTotal)}`,
    '',
    'Je vous recontacte rapidement pour finaliser le dossier (paiement, contrat, état des lieux).',
    '',
    '— *Immo CI*',
  ].join('\n')
}

function tplVisitorReservationRejected(
  ctx: ReservationContext,
  reason?: string
): string {
  return [
    `Bonjour ${ctx.visitorName},`,
    '',
    `Nous ne pouvons malheureusement pas donner suite à votre demande de réservation pour *« ${ctx.bienTitre} »*.`,
    reason ? `\nRaison : ${reason}` : null,
    '',
    'D\'autres biens similaires sont disponibles sur notre plateforme.',
    '',
    '— *Immo CI*',
  ]
    .filter((x) => x !== null)
    .join('\n')
}

// ---------------- API publique ----------------

/**
 * Notifie l'équipe admin (toi + associé) d'une nouvelle demande de visite.
 * À appeler dans POST /api/visites juste après création.
 */
export async function notifyAdminVisitRequest(
  supabase: SupabaseClient,
  ctx: VisitContext
): Promise<{ sent: number; total: number }> {
  const admins = getAdminNumbers()
  const message = tplAdminVisitRequest(ctx)
  let sent = 0

  for (const phone of admins) {
    const result = await send(phone, message)
    if (result.success) sent++
    await logNotification(supabase, {
      toPhone: phone,
      role: 'admin',
      template: 'visit_request_admin',
      relatedType: 'visite',
      relatedId: ctx.id,
      payload: { bienTitre: ctx.bienTitre, visitorName: ctx.visitorName },
      result,
    })
  }

  if (sent > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('visites') as any)
      .update({ admin_notified_at: new Date().toISOString() })
      .eq('id', ctx.id)
  }

  return { sent, total: admins.length }
}

/**
 * Notifie le propriétaire qu'un client visitera (après validation admin).
 */
export async function notifyOwnerVisitApproved(
  supabase: SupabaseClient,
  ctx: VisitContext
): Promise<SendResult> {
  if (!ctx.ownerPhone) {
    return { success: false, error: 'owner phone missing' }
  }
  const result = await send(ctx.ownerPhone, tplOwnerVisitAnnounce(ctx))
  await logNotification(supabase, {
    toPhone: ctx.ownerPhone,
    role: 'owner',
    template: 'visit_announce_owner',
    relatedType: 'visite',
    relatedId: ctx.id,
    payload: { bienTitre: ctx.bienTitre },
    result,
  })
  if (result.success) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('visites') as any)
      .update({ owner_notified_at: new Date().toISOString() })
      .eq('id', ctx.id)
  }
  return result
}

/**
 * Notifie le visiteur que sa demande est validée.
 */
export async function notifyVisitorVisitApproved(
  supabase: SupabaseClient,
  ctx: VisitContext
): Promise<SendResult> {
  const result = await send(ctx.visitorPhone, tplVisitorVisitConfirmed(ctx))
  await logNotification(supabase, {
    toPhone: ctx.visitorPhone,
    role: 'visitor',
    template: 'visit_confirmed_visitor',
    relatedType: 'visite',
    relatedId: ctx.id,
    payload: { bienTitre: ctx.bienTitre },
    result,
  })
  if (result.success) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('visites') as any)
      .update({ visitor_notified_at: new Date().toISOString() })
      .eq('id', ctx.id)
  }
  return result
}

/**
 * Notifie le visiteur du refus.
 */
export async function notifyVisitorVisitRejected(
  supabase: SupabaseClient,
  ctx: VisitContext,
  reason?: string
): Promise<SendResult> {
  const result = await send(
    ctx.visitorPhone,
    tplVisitorVisitRejected(ctx, reason)
  )
  await logNotification(supabase, {
    toPhone: ctx.visitorPhone,
    role: 'visitor',
    template: 'visit_rejected_visitor',
    relatedType: 'visite',
    relatedId: ctx.id,
    payload: { reason: reason ?? null },
    result,
  })
  return result
}

// --- Réservations ---

export async function notifyAdminReservationRequest(
  supabase: SupabaseClient,
  ctx: ReservationContext
): Promise<{ sent: number; total: number }> {
  const admins = getAdminNumbers()
  const message = tplAdminReservationRequest(ctx)
  let sent = 0

  for (const phone of admins) {
    const result = await send(phone, message)
    if (result.success) sent++
    await logNotification(supabase, {
      toPhone: phone,
      role: 'admin',
      template: 'reservation_request_admin',
      relatedType: 'reservation',
      relatedId: ctx.id,
      payload: { bienTitre: ctx.bienTitre, visitorName: ctx.visitorName },
      result,
    })
  }

  if (sent > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('reservations') as any)
      .update({ admin_notified_at: new Date().toISOString() })
      .eq('id', ctx.id)
  }

  return { sent, total: admins.length }
}

export async function notifyOwnerReservationApproved(
  supabase: SupabaseClient,
  ctx: ReservationContext
): Promise<SendResult> {
  if (!ctx.ownerPhone) {
    return { success: false, error: 'owner phone missing' }
  }
  const result = await send(ctx.ownerPhone, tplOwnerReservationAnnounce(ctx))
  await logNotification(supabase, {
    toPhone: ctx.ownerPhone,
    role: 'owner',
    template: 'reservation_announce_owner',
    relatedType: 'reservation',
    relatedId: ctx.id,
    payload: { bienTitre: ctx.bienTitre },
    result,
  })
  if (result.success) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('reservations') as any)
      .update({ owner_notified_at: new Date().toISOString() })
      .eq('id', ctx.id)
  }
  return result
}

export async function notifyVisitorReservationApproved(
  supabase: SupabaseClient,
  ctx: ReservationContext
): Promise<SendResult> {
  const result = await send(
    ctx.visitorPhone,
    tplVisitorReservationConfirmed(ctx)
  )
  await logNotification(supabase, {
    toPhone: ctx.visitorPhone,
    role: 'visitor',
    template: 'reservation_confirmed_visitor',
    relatedType: 'reservation',
    relatedId: ctx.id,
    payload: { bienTitre: ctx.bienTitre },
    result,
  })
  if (result.success) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('reservations') as any)
      .update({ visitor_notified_at: new Date().toISOString() })
      .eq('id', ctx.id)
  }
  return result
}

export async function notifyVisitorReservationRejected(
  supabase: SupabaseClient,
  ctx: ReservationContext,
  reason?: string
): Promise<SendResult> {
  const result = await send(
    ctx.visitorPhone,
    tplVisitorReservationRejected(ctx, reason)
  )
  await logNotification(supabase, {
    toPhone: ctx.visitorPhone,
    role: 'visitor',
    template: 'reservation_rejected_visitor',
    relatedType: 'reservation',
    relatedId: ctx.id,
    payload: { reason: reason ?? null },
    result,
  })
  return result
}
