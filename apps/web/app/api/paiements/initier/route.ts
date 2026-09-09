import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/server-auth'
import { initierPaiement, arrondir5, calculerSplit } from '@/lib/cinetpay'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { user, supabase } = await getServerUser(req)
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

  let body: { reservationId?: string; montantFcfa?: number; description?: string }
  try {
    body = await req.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }
  if (!body.reservationId || typeof body.montantFcfa !== 'number' || !Number.isInteger(body.montantFcfa) || body.montantFcfa <= 0) {
    return NextResponse.json({ error: 'reservationId et montantFcfa valide requis' }, { status: 400 })
  }

  // Le montant et le payeur sont recalculés/confirmés depuis la réservation,
  // jamais depuis une valeur contrôlée uniquement par le navigateur.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reservation, error: reservationError } = await (supabase.from('reservations') as any)
    .select('id, locataire_id, proprietaire_id, montant_total_fcfa, statut, admin_validation_status')
    .eq('id', body.reservationId)
    .eq('locataire_id', user.id)
    .maybeSingle()

  if (reservationError || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable ou non autorisée' }, { status: 404 })
  }
  if (reservation.admin_validation_status !== 'approved' || !['en_attente', 'confirmee'].includes(reservation.statut)) {
    return NextResponse.json({ error: 'La réservation doit être validée par un administrateur' }, { status: 409 })
  }
  if (Number(body.montantFcfa) !== Number(reservation.montant_total_fcfa)) {
    return NextResponse.json({ error: 'Le montant ne correspond pas à la réservation' }, { status: 400 })
  }
  if (arrondir5(Number(reservation.montant_total_fcfa)) !== Number(reservation.montant_total_fcfa)) {
    return NextResponse.json({ error: 'Le montant de la réservation doit être un multiple de 5 FCFA' }, { status: 409 })
  }

  const montant      = Number(reservation.montant_total_fcfa)
  const { commission, montantNet } = calculerSplit(montant)
  const transactionId = crypto.randomUUID()
  const baseUrl       = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://www.bogbesgroup.com'

  // Inserer la ligne paiement avec statut initie
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase.from('paiements') as any).insert({
    reservation_id:          body.reservationId,
    payeur_id:               user.id,
    beneficiaire_id:         reservation.proprietaire_id,
    montant_total_fcfa:      montant,
    commission_fcfa:         commission,
    montant_net_fcfa:        montantNet,
    statut:                  'initie',
    cinetpay_transaction_id: transactionId,
  })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  const result = await initierPaiement({
    transactionId,
    montant,
    description:  body.description?.trim().slice(0, 140) || `Paiement réservation ${body.reservationId}`,
    notifyUrl:    `${baseUrl}/api/paiements/webhook`,
    returnUrl:    `${baseUrl}/paiement/retour`,
    metadata:     JSON.stringify({ reservationId: body.reservationId, source: 'web' }),
  })

  if (result.code !== '201' || !result.data?.payment_url) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('paiements') as any)
      .update({ statut: 'echec', metadata: JSON.stringify({ error: result.message }) })
      .eq('cinetpay_transaction_id', transactionId)
    return NextResponse.json({ error: result.message }, { status: 502 })
  }

  // Mettre a jour le token CinetPay
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('paiements') as any)
    .update({ cinetpay_payment_token: result.data.payment_token, statut: 'en_cours' })
    .eq('cinetpay_transaction_id', transactionId)

  return NextResponse.json({ paymentUrl: result.data.payment_url })
}
