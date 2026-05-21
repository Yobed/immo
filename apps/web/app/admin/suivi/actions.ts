'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  notifyOwnerVisitApproved,
  notifyVisitorVisitApproved,
  notifyVisitorVisitRejected,
  notifyOwnerReservationApproved,
  notifyVisitorReservationApproved,
  notifyVisitorReservationRejected,
  notifyVisitorContactApproved,
  notifyVisitorContactRejected,
  notifyOwnerContactShared,
  type VisitContext,
  type ReservationContext,
  type ContactRequestContext,
} from '@/lib/notifications/whatsapp-notifier'

async function ensureAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Accès admin requis')
  return { userId: user.id }
}

// ---------------- VISITES ----------------

export async function validateVisiteAction(formData: FormData): Promise<void> {
  const guard = await ensureAdmin()

  const visiteId = String(formData.get('visiteId') || '')
  const action = String(formData.get('action') || '') as 'approve' | 'reject'
  const note = (formData.get('note') as string) || null

  if (!visiteId || !['approve', 'reject'].includes(action)) {
    throw new Error('Payload invalide')
  }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visite, error: fetchErr } = await (admin as any)
    .from('visites')
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, notes, admin_validation_status,
      locataire_id, proprietaire_id, client_name, client_phone,
      biens ( titre, commune )
    `)
    .eq('id', visiteId)
    .single()

  if (fetchErr || !visite) throw new Error('Visite introuvable')
  if (visite.admin_validation_status !== 'pending') {
    throw new Error(`Déjà ${visite.admin_validation_status}`)
  }

  const ids = [visite.locataire_id, visite.proprietaire_id].filter(Boolean) as string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin as any)
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', ids)

  const visitor =
    visite.locataire_id != null
      ? profiles?.find((p: { id: string }) => p.id === visite.locataire_id)
      : null
  const owner = profiles?.find((p: { id: string }) => p.id === visite.proprietaire_id)

  const ctx: VisitContext = {
    id: visite.id,
    bienTitre: visite.biens?.titre || 'Bien',
    bienCommune: visite.biens?.commune ?? null,
    dateSouhaitee: visite.date_souhaitee,
    heureDebut: visite.heure_debut,
    heureFin: visite.heure_fin,
    visitorName: visitor?.full_name || visite.client_name || 'Visiteur',
    visitorPhone: visitor?.phone || visite.client_phone || '',
    ownerName: owner?.full_name ?? null,
    ownerPhone: owner?.phone ?? null,
    notes: visite.notes,
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin as any)
    .from('visites')
    .update({
      admin_validation_status: newStatus,
      admin_validated_at: new Date().toISOString(),
      admin_validated_by: guard.userId,
      admin_note: note,
    })
    .eq('id', visiteId)

  if (updateErr) throw new Error(updateErr.message)

  if (action === 'approve') {
    if (ctx.ownerPhone) await notifyOwnerVisitApproved(admin, ctx)
    if (ctx.visitorPhone) await notifyVisitorVisitApproved(admin, ctx)
  } else {
    if (ctx.visitorPhone) await notifyVisitorVisitRejected(admin, ctx, note ?? undefined)
  }

  revalidatePath('/admin/suivi')
  revalidatePath(`/admin/suivi/visites/${visiteId}`)
}

// ---------------- RESERVATIONS ----------------

export async function validateReservationAction(formData: FormData): Promise<void> {
  const guard = await ensureAdmin()

  const reservationId = String(formData.get('reservationId') || '')
  const action = String(formData.get('action') || '') as 'approve' | 'reject'
  const note = (formData.get('note') as string) || null

  if (!reservationId || !['approve', 'reject'].includes(action)) {
    throw new Error('Payload invalide')
  }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation, error: fetchErr } = await (admin as any)
    .from('reservations')
    .select(`
      id, date_debut, date_fin, montant_total_fcfa, admin_validation_status,
      locataire_id, proprietaire_id,
      biens ( titre, commune )
    `)
    .eq('id', reservationId)
    .single()

  if (fetchErr || !reservation) throw new Error('Réservation introuvable')
  if (reservation.admin_validation_status !== 'pending') {
    throw new Error(`Déjà ${reservation.admin_validation_status}`)
  }

  const ids = [reservation.locataire_id, reservation.proprietaire_id].filter(Boolean) as string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin as any)
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', ids)

  const visitor = profiles?.find((p: { id: string }) => p.id === reservation.locataire_id)
  const owner = profiles?.find((p: { id: string }) => p.id === reservation.proprietaire_id)

  const ctx: ReservationContext = {
    id: reservation.id,
    bienTitre: reservation.biens?.titre || 'Bien',
    bienCommune: reservation.biens?.commune ?? null,
    dateDebut: reservation.date_debut,
    dateFin: reservation.date_fin,
    montantTotal: reservation.montant_total_fcfa ?? 0,
    visitorName: visitor?.full_name || 'Visiteur',
    visitorPhone: visitor?.phone || '',
    ownerName: owner?.full_name ?? null,
    ownerPhone: owner?.phone ?? null,
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin as any)
    .from('reservations')
    .update({
      admin_validation_status: newStatus,
      admin_validated_at: new Date().toISOString(),
      admin_validated_by: guard.userId,
      admin_note: note,
    })
    .eq('id', reservationId)

  if (updateErr) throw new Error(updateErr.message)

  if (action === 'approve') {
    if (ctx.ownerPhone) await notifyOwnerReservationApproved(admin, ctx)
    if (ctx.visitorPhone) await notifyVisitorReservationApproved(admin, ctx)
  } else {
    if (ctx.visitorPhone) {
      await notifyVisitorReservationRejected(admin, ctx, note ?? undefined)
    }
  }

  revalidatePath('/admin/suivi')
  revalidatePath(`/admin/suivi/reservations/${reservationId}`)
}

// ---------------- CONTACT REQUESTS ----------------

export async function validateContactAction(formData: FormData): Promise<void> {
  const guard = await ensureAdmin()

  const contactId = String(formData.get('contactId') || '')
  const action = String(formData.get('action') || '') as 'approve' | 'reject'
  const note = (formData.get('note') as string) || null

  if (!contactId || !['approve', 'reject'].includes(action)) {
    throw new Error('Payload invalide')
  }

  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req, error: fetchErr } = await (admin as any)
    .from('contact_requests')
    .select(`
      id, admin_validation_status, reason, source,
      visitor_id, visitor_name, visitor_phone, visitor_email,
      proprietaire_id,
      locaux_id, flash_owner_phone, flash_titre,
      biens ( titre, commune )
    `)
    .eq('id', contactId)
    .single()

  if (fetchErr || !req) throw new Error('Demande introuvable')
  if (req.admin_validation_status !== 'pending') {
    throw new Error(`Déjà ${req.admin_validation_status}`)
  }

  // Pour les contacts source='web' : owner depuis profiles via proprietaire_id
  // Pour les contacts source='flash' : owner = scrapé, on a juste flash_owner_phone
  let ownerName: string | null = null
  let ownerPhone: string | null = null
  if (req.source === 'flash') {
    ownerPhone = req.flash_owner_phone ?? null
  } else if (req.proprietaire_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: owner } = await (admin as any)
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', req.proprietaire_id)
      .single()
    ownerName = owner?.full_name ?? null
    ownerPhone = owner?.phone ?? null
  }

  const ctx: ContactRequestContext = {
    id: req.id,
    bienTitre: req.biens?.titre || req.flash_titre || 'Bien',
    bienCommune: req.biens?.commune ?? null,
    visitorName: req.visitor_name || 'Visiteur',
    visitorPhone: req.visitor_phone || '',
    visitorEmail: req.visitor_email,
    reason: req.reason,
    ownerName,
    ownerPhone,
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin as any)
    .from('contact_requests')
    .update({
      admin_validation_status: newStatus,
      admin_validated_at: new Date().toISOString(),
      admin_validated_by: guard.userId,
      admin_note: note,
    })
    .eq('id', contactId)

  if (updateErr) throw new Error(updateErr.message)

  if (action === 'approve') {
    if (ctx.visitorPhone) await notifyVisitorContactApproved(admin, ctx)
    if (ctx.ownerPhone) await notifyOwnerContactShared(admin, ctx)
  } else {
    if (ctx.visitorPhone) await notifyVisitorContactRejected(admin, ctx, note ?? undefined)
  }

  revalidatePath('/admin/suivi')
  revalidatePath(`/admin/suivi/contacts/${contactId}`)
}
