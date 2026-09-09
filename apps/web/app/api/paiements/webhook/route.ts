import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifierPaiement, canalVersMethode } from '@/lib/cinetpay'

export async function POST(req: NextRequest) {
  // Webhook body = x-www-form-urlencoded
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ status: 'ok', ignored: 'invalid_body' })
  }
  const transactionId = formData.get('cpm_trans_id') as string | null

  if (!transactionId) return NextResponse.json({ status: 'ok' })

  // CRITIQUE PAY-03 : Ne jamais lire le statut depuis le body — appeler /v2/payment/check
  let verification
  try {
    verification = await verifierPaiement(transactionId)
  } catch {
    return NextResponse.json({ status: 'ok', retry: true }, { status: 200 })
  }
  const verified     = verification.data

  const statutPaiement = verified?.status === 'ACCEPTED' ? 'succes' : 'echec'
  const methodeRaw     = canalVersMethode(verified?.payment_method ?? '')
  const methode        = ['wave', 'orange_money', 'mtn', 'moov', 'carte_bancaire'].includes(methodeRaw)
    ? methodeRaw
    : null

  // Le webhook fournisseur n'a pas de session utilisateur; le statut est
  // confirmé directement auprès de CinetPay avant toute écriture service-role.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: paiement } = await (supabase.from('paiements') as any)
    .update({
      statut:   statutPaiement,
      methode,
      metadata: verification,
    })
    .eq('cinetpay_transaction_id', transactionId)
    .select('id, reservation_id, montant_total_fcfa, statut')
    .maybeSingle()

  if (!paiement) {
    // Retourner 200 évite une boucle CinetPay pour une transaction inconnue;
    // elle est ignorée et peut être investiguée côté fournisseur.
    return NextResponse.json({ status: 'ok', ignored: 'transaction_unknown' })
  }

  const amountMatches =
    verified?.currency === 'XOF' &&
    Number(verified.amount) === Number(paiement.montant_total_fcfa) &&
    (!verified.transaction_id || verified.transaction_id === transactionId)

  // Si succes : confirmer la reservation liee
  if (statutPaiement === 'succes' && amountMatches && paiement.reservation_id) {
    // Une réservation ne devient confirmée qu'après validation admin et ne peut
    // pas être confirmée par un paiement lancé sur une demande refusée.
    const { data: reservation } = await (supabase.from('reservations') as any)
      .select('id, statut, admin_validation_status')
      .eq('id', paiement.reservation_id)
      .maybeSingle()

    if (reservation?.admin_validation_status === 'approved' && ['en_attente', 'confirmee'].includes(reservation.statut)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('reservations') as any)
        .update({ statut: 'confirmee' })
        .eq('id', paiement.reservation_id)
        .eq('admin_validation_status', 'approved')
        .in('statut', ['en_attente', 'confirmee'])
    }
  } else if (statutPaiement === 'succes' && !amountMatches) {
    // Le paiement est accepté par le fournisseur mais ne correspond pas à la
    // somme réservée : il ne doit jamais confirmer le dossier.
    await (supabase.from('paiements') as any)
      .update({ statut: 'echec', metadata: { ...verification, validation_error: 'amount_or_currency_mismatch' } })
      .eq('id', paiement.id)
  }

  // DOIT retourner HTTP 200 — sinon CinetPay retente le webhook indefiniment
  return NextResponse.json({ status: 'ok' })
}
