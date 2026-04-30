import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import {
  notifyOwnerReservationApproved,
  notifyVisitorReservationApproved,
  notifyVisitorReservationRejected,
  type ReservationContext,
} from '@/lib/notifications/whatsapp-notifier'

/**
 * POST /api/admin/reservations/[id]/validate
 * Body: { action: 'approve' | 'reject', note?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
  }

  const body = await request.json()
  const action = body?.action as 'approve' | 'reject'
  const note = (body?.note as string) ?? null

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation, error: fetchErr } = await (supabase as any)
    .from('reservations')
    .select(`
      id, date_debut, date_fin, montant_total_fcfa, admin_validation_status,
      locataire_id, proprietaire_id,
      biens ( titre, commune )
    `)
    .eq('id', id)
    .single()

  if (fetchErr || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }
  if (reservation.admin_validation_status !== 'pending') {
    return NextResponse.json(
      { error: `Déjà ${reservation.admin_validation_status}` },
      { status: 409 }
    )
  }

  const ids = [reservation.locataire_id, reservation.proprietaire_id].filter(Boolean) as string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', ids)

  const visitor = profiles?.find((p: { id: string }) => p.id === reservation.locataire_id)
  const owner = profiles?.find((p: { id: string }) => p.id === reservation.proprietaire_id)

  const ctx: ReservationContext = {
    id: reservation.id,
    bienTitre: reservation.biens?.titre || 'Bien sans titre',
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
  const { error: updateErr } = await (supabase as any)
    .from('reservations')
    .update({
      admin_validation_status: newStatus,
      admin_validated_at: new Date().toISOString(),
      admin_validated_by: user.id,
      admin_note: note,
    })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 })
  }

  const results: Record<string, { success: boolean; error?: string }> = {}

  if (action === 'approve') {
    if (ctx.ownerPhone) {
      results.owner = await notifyOwnerReservationApproved(supabase, ctx)
    }
    if (ctx.visitorPhone) {
      results.visitor = await notifyVisitorReservationApproved(supabase, ctx)
    }
  } else {
    if (ctx.visitorPhone) {
      results.visitor = await notifyVisitorReservationRejected(
        supabase,
        ctx,
        note ?? undefined
      )
    }
  }

  return NextResponse.json({
    id,
    admin_validation_status: newStatus,
    notifications: results,
  })
}
