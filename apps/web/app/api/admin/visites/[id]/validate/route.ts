import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import {
  notifyOwnerVisitApproved,
  notifyVisitorVisitApproved,
  notifyVisitorVisitRejected,
  type VisitContext,
} from '@/lib/notifications/whatsapp-notifier'

/**
 * POST /api/admin/visites/[id]/validate
 * Body: { action: 'approve' | 'reject', note?: string }
 *
 * Réservé aux profils role='admin' (toi + associé).
 * - approve : notifie le propriétaire ET le visiteur
 * - reject  : notifie uniquement le visiteur (le proprio n'a jamais été averti)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, supabase } = await getServerUser(request)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérifier rôle admin
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

  // Charger la visite + bien + visiteur + propriétaire en une fois
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visite, error: fetchErr } = await (supabase as any)
    .from('visites')
    .select(`
      id, date_souhaitee, heure_debut, heure_fin, notes, admin_validation_status,
      locataire_id, proprietaire_id, client_name, client_phone,
      biens ( titre, commune )
    `)
    .eq('id', id)
    .single()

  if (fetchErr || !visite) {
    return NextResponse.json({ error: 'Visite introuvable' }, { status: 404 })
  }
  if (visite.admin_validation_status !== 'pending') {
    return NextResponse.json(
      { error: `Déjà ${visite.admin_validation_status}` },
      { status: 409 }
    )
  }

  // Profils visiteur + proprio
  const ids = [visite.locataire_id, visite.proprietaire_id].filter(Boolean) as string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
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
    bienTitre: visite.biens?.titre || 'Bien sans titre',
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

  // Mise à jour DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (supabase as any)
    .from('visites')
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

  // Notifications WhatsApp
  const results: Record<string, { success: boolean; error?: string }> = {}

  if (action === 'approve') {
    if (ctx.ownerPhone) {
      results.owner = await notifyOwnerVisitApproved(supabase, ctx)
    }
    if (ctx.visitorPhone) {
      results.visitor = await notifyVisitorVisitApproved(supabase, ctx)
    }
  } else {
    if (ctx.visitorPhone) {
      results.visitor = await notifyVisitorVisitRejected(supabase, ctx, note ?? undefined)
    }
  }

  return NextResponse.json({
    id,
    admin_validation_status: newStatus,
    notifications: results,
  })
}
