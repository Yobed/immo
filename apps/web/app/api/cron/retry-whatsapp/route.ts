import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { wasenderSendMessage, wasenderGetStatus } from '@/lib/wasender'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Rejoue au maximum trois fois les notifications WhatsApp échouées si le service est opérationnel. */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET?.trim().replace(/^﻿/, '') || ''
  const auth = req.headers.get('authorization') || ''
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 })
  if (auth !== `Bearer ${expected}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // 1. Contrôle préalable : si la passerelle WhatsApp est hors service ou abonnement expiré, on met le cron en pause
  const wsStatus = await wasenderGetStatus()
  if (!wsStatus.connected) {
    return NextResponse.json({
      ok: true,
      status: 'paused',
      reason: `Passerelle WhatsApp en pause : ${wsStatus.status} (${wsStatus.message})`,
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    })
  }

  const admin = createAdminClient()
  const now = new Date()
  const { data: pending, error } = await (admin as any).from('whatsapp_notifications')
    .select('id, to_phone, message_body, attempt_count')
    .eq('status', 'failed')
    .lt('attempt_count', 3)
    .lte('next_retry_at', now.toISOString())
    .not('message_body', 'is', null)
    .not('error_message', 'ilike', 'SUBSCRIPTION_PAST_DUE%')
    .order('next_retry_at', { ascending: true })
    .limit(20)

  if (error) return NextResponse.json({ error: 'Impossible de charger la file WhatsApp' }, { status: 500 })

  let sent = 0
  let failed = 0
  let skipped = 0
  for (const item of pending ?? []) {
    // Claim atomically so two cron invocations cannot send the same message.
    const { data: claimed } = await (admin as any).from('whatsapp_notifications')
      .update({ status: 'queued', last_attempt_at: now.toISOString() })
      .eq('id', item.id)
      .eq('status', 'failed')
      .select('id, to_phone, message_body, attempt_count')
      .maybeSingle()
    if (!claimed) {
      skipped++
      continue
    }

    const attemptCount = Number(claimed.attempt_count || 0) + 1
    const result: any = await wasenderSendMessage(claimed.to_phone, claimed.message_body, 'text').catch((err) => ({
      success: false,
      message: err instanceof Error ? err.message : 'Erreur Wasender',
    }))

    if (result.success) {
      sent++
      await (admin as any).from('whatsapp_notifications')
        .update({
          status: 'sent',
          attempt_count: attemptCount,
          external_id: result.data?.msgId?.toString() ?? result.data?.messageId ?? result.data?.id ?? (result.fallbackUsed ? 'fallback_transport' : null),
          sent_at: new Date().toISOString(),
          next_retry_at: null,
          error_message: result.fallbackUsed ? 'Envoyé via transport de secours' : null,
        })
        .eq('id', claimed.id)
    } else {
      failed++
      const isPastDue = result.isSubscriptionPastDue || /past due|subscription/i.test(result.message || '')
      const nextRetry = new Date(Date.now() + Math.min(60, 5 * 2 ** Math.max(0, attemptCount - 1)) * 60_000)

      await (admin as any).from('whatsapp_notifications')
        .update({
          status: 'failed',
          attempt_count: attemptCount,
          // Ne plus rejouer si l'abonnement du service tiers a expiré
          next_retry_at: !isPastDue && attemptCount < 3 ? nextRetry.toISOString() : null,
          error_message: isPastDue
            ? `SUBSCRIPTION_PAST_DUE: ${result.message || 'Abonnement Wasender expiré'}`
            : (result.message || 'Erreur Wasender'),
        })
        .eq('id', claimed.id)

      // Si erreur 402 détectée, interrompre la boucle pour ne pas marteler l'API
      if (isPastDue) {
        break
      }
    }
  }

  return NextResponse.json({ ok: true, processed: pending?.length ?? 0, sent, failed, skipped })
}

export const POST = GET
