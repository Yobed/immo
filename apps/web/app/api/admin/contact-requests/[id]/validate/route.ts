import { validateCrmRequest, CrmMutationError } from '@/lib/crm/rpc'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin, safeErrorResponse } from '@/lib/auth/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  notifyVisitorContactApproved,
  notifyVisitorContactRejected,
  notifyOwnerContactShared,
  type ContactRequestContext,
} from '@/lib/notifications/whatsapp-notifier'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    await requireAdmin(user.id)

    const { id } = await params
    const body = await request.json()
    const action = body?.action as 'approve' | 'reject'
    const note = (body?.note as string) ?? null
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: req, error } = await (admin as any)
      .from('contact_requests')
      .select(`
        id, admin_validation_status, reason,
        visitor_id, visitor_name, visitor_phone, visitor_email,
        proprietaire_id,
        biens ( titre, commune )
      `)
      .eq('id', id)
      .single()

    if (error || !req) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    }
    if (req.admin_validation_status !== 'pending') {
      return NextResponse.json(
        { error: `Déjà ${req.admin_validation_status}` },
        { status: 409 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: owner } = await (admin as any)
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', req.proprietaire_id)
      .single()

    const ctx: ContactRequestContext = {
      id: req.id,
      bienTitre: req.biens?.titre || 'Bien',
      bienCommune: req.biens?.commune ?? null,
      visitorName: req.visitor_name || 'Visiteur',
      visitorPhone: req.visitor_phone || '',
      visitorEmail: req.visitor_email,
      reason: req.reason,
      ownerName: owner?.full_name ?? null,
      ownerPhone: owner?.phone ?? null,
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    await validateCrmRequest({ entity: 'contact', id, action, note })

    const results: Record<string, { success: boolean; error?: string }> = {}

    if (action === 'approve') {
      if (ctx.visitorPhone) results.visitor = await notifyVisitorContactApproved(admin, ctx)
      if (ctx.ownerPhone) results.owner = await notifyOwnerContactShared(admin, ctx)
    } else {
      if (ctx.visitorPhone) {
        results.visitor = await notifyVisitorContactRejected(admin, ctx, note ?? undefined)
      }
    }

    return NextResponse.json({
      id,
      admin_validation_status: newStatus,
      notifications: results,
    })
  } catch (error) {
    if (error instanceof CrmMutationError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Formulaire invalide' }, { status: 400 })
    return safeErrorResponse(error)
  }
}
