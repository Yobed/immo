import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { initierPaiement, arrondir5, calculerSplit } from '@/lib/cinetpay'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { user, supabase } = await getServerUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  const body = await req.json() as {
    reservationId: string
    montantFcfa:   number
    description:   string
  }

  const montant      = arrondir5(body.montantFcfa)
  const { commission, montantNet } = calculerSplit(montant)
  const transactionId = crypto.randomUUID()
  const baseUrl       = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

  // Inserer la ligne paiement avec statut initie
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase.from('paiements') as any).insert({
    reservation_id:          body.reservationId,
    locataire_id:            user.id,
    montant_fcfa:            montant,
    commission_fcfa:         commission,
    montant_net_fcfa:        montantNet,
    statut:                  'initie',
    cinetpay_transaction_id: transactionId,
  })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  const result = await initierPaiement({
    transactionId,
    montant,
    description:  body.description,
    notifyUrl:    `${baseUrl}/api/paiements/webhook`,
    returnUrl:    `${baseUrl}/paiement/retour`,
    metadata:     JSON.stringify({ reservationId: body.reservationId }),
  })

  if (result.code !== '201' || !result.data?.payment_url) {
    return NextResponse.json({ error: result.message }, { status: 502 })
  }

  // Mettre a jour le token CinetPay
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('paiements') as any)
    .update({ cinetpay_payment_token: result.data.payment_token, statut: 'en_cours' })
    .eq('cinetpay_transaction_id', transactionId)

  return NextResponse.json({ paymentUrl: result.data.payment_url })
}
