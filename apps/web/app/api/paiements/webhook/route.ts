import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifierPaiement, canalVersMethode } from '@/lib/cinetpay'

export async function POST(req: NextRequest) {
  // Webhook body = x-www-form-urlencoded
  const formData    = await req.formData()
  const transactionId = formData.get('cpm_trans_id') as string | null

  if (!transactionId) return NextResponse.json({ status: 'ok' })

  // CRITIQUE PAY-03 : Ne jamais lire le statut depuis le body — appeler /v2/payment/check
  const verification = await verifierPaiement(transactionId)
  const verified     = verification.data

  const statutPaiement = verified?.status === 'ACCEPTED' ? 'succes' : 'echec'
  const methode        = canalVersMethode(verified?.payment_method ?? '')

  // Utiliser SUPABASE_SERVICE_ROLE_KEY — webhook est unauthentifie, RLS bloquerait anon
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: paiement } = await (supabase.from('paiements') as any)
    .update({
      statut:   statutPaiement,
      methode:  methode,
      metadata: verification,
    })
    .eq('cinetpay_transaction_id', transactionId)
    .select('reservation_id')
    .single()

  // Si succes : confirmer la reservation liee
  if (statutPaiement === 'succes' && paiement?.reservation_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('reservations') as any)
      .update({ statut: 'confirmee' })
      .eq('id', paiement.reservation_id)
  }

  // DOIT retourner HTTP 200 — sinon CinetPay retente le webhook indefiniment
  return NextResponse.json({ status: 'ok' })
}
