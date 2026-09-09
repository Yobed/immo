// apps/web/app/api/quittances/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import crypto from 'node:crypto'

// Payload envoyé par n8n pour chaque quittance
interface RelancePayload {
  quittanceId:    string
  locataireId:    string
  proprietaireId: string
  jalon:          'J-3' | 'J-1' | 'J+1' | 'J+7'
  montantFcfa:    number
  dateEcheance:   string
}

function sameSecret(actual: string | null, expected: string | undefined): boolean {
  if (!actual || !expected) return false
  const a = Buffer.from(actual.trim())
  const b = Buffer.from(expected.trim())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function hasInternalWebhookAuth(req: NextRequest): boolean {
  const serviceKey = req.headers.get('x-service-key')
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null
  return (
    sameSecret(serviceKey, process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    sameSecret(bearer, process.env.CRON_SECRET)
  )
}

async function notifyOnce(
  supabase: ReturnType<typeof createServerClient>,
  notification: Record<string, unknown>,
): Promise<void> {
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', notification.user_id)
    .eq('type', notification.type)
    .eq('lien_type', notification.lien_type)
    .eq('lien_id', notification.lien_id)
    .limit(1)

  if (existing?.[0]) return
  await supabase.from('notifications').insert(notification)
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || (!process.env.CRON_SECRET && !req.headers.get('x-service-key'))) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }
  if (!hasInternalWebhookAuth(req)) {
    return NextResponse.json({ error: 'Signature webhook invalide' }, { status: 401 })
  }

  // Service role: uniquement après vérification de la clé interne/cron.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  let payload: RelancePayload
  try {
    payload = await req.json() as RelancePayload
  } catch {
    return NextResponse.json({ error: 'Body invalide' }, { status: 400 })
  }

  const { quittanceId, jalon } = payload

  if (!quittanceId || !jalon || !['J-3', 'J-1', 'J+1', 'J+7'].includes(jalon)) {
    return NextResponse.json({ error: 'quittanceId ou jalon invalide' }, { status: 400 })
  }

  // Les identifiants et montants du webhook sont des indications de n8n : la
  // quittance canonique en base reste la seule source de vérité.
  const { data: quittance, error: quittanceError } = await supabase
    .from('quittances')
    .select('id, locataire_id, proprietaire_id, montant_total_fcfa, date_echeance, statut')
    .eq('id', quittanceId)
    .single()

  if (quittanceError || !quittance) {
    return NextResponse.json({ error: 'Quittance introuvable' }, { status: 404 })
  }

  const amount = Number(quittance.montant_total_fcfa)
  const dueDate = String(quittance.date_echeance)

  // J+1: passer le statut à 'en_retard'
  if (jalon === 'J+1') {
    await supabase
      .from('quittances')
      .update({ statut: 'en_retard' })
      .eq('id', quittanceId)
      .eq('statut', 'en_attente')  // ne pas écraser si déjà en_retard

    // Notification locataire: loyer_retard
    await notifyOnce(supabase, {
      user_id:   quittance.locataire_id,
      type:      'loyer_retard',
      titre:     'Loyer en retard',
      contenu:   `Votre loyer de ${amount.toLocaleString('fr-FR')} FCFA était dû le ${dueDate} et n'a pas été reçu.`,
      lien_type: 'quittance',
      lien_id:   quittanceId,
    })
  }

  // J+7: notification propriétaire (loyer_retard)
  if (jalon === 'J+7') {
    await notifyOnce(supabase, {
      user_id:   quittance.proprietaire_id,
      type:      'loyer_retard',
      titre:     'Loyer impayé — 7 jours de retard',
      contenu:   `Un locataire a ${amount.toLocaleString('fr-FR')} FCFA en retard depuis 7 jours (échéance: ${dueDate}).`,
      lien_type: 'quittance',
      lien_id:   quittanceId,
    })
  }

  // J-3 et J-1: notification locataire loyer_rappel
  if (jalon === 'J-3' || jalon === 'J-1') {
    await notifyOnce(supabase, {
      user_id:   quittance.locataire_id,
      type:      'loyer_rappel',
      titre:     `Rappel loyer — ${jalon}`,
      contenu:   `Votre loyer de ${amount.toLocaleString('fr-FR')} FCFA est dû le ${dueDate}.`,
      lien_type: 'quittance',
      lien_id:   quittanceId,
    })
  }

  // CRITIQUE: toujours retourner 200 — sinon n8n retente indéfiniment
  return NextResponse.json({ status: 'ok', processed: quittanceId, jalon })
}
