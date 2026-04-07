// lib/cinetpay.ts
// Integration CinetPay v2 — PAY-01 a PAY-06

const CINETPAY_BASE = process.env.CINETPAY_BASE_URL ?? 'https://api-checkout.cinetpay.com/v2'

export const COMMISSION_PCT = 10  // 10% plateforme

/** Calcule le split commission/net. Arrondit au multiple de 5 (regle XOF). */
export function calculerSplit(montantTotal: number): { commission: number; montantNet: number } {
  const commission = Math.round((montantTotal * COMMISSION_PCT / 100) / 5) * 5
  const montantNet = montantTotal - commission
  return { commission, montantNet }
}

/** Arrondit au multiple de 5 le plus proche — CinetPay exige un montant XOF valide */
export function arrondir5(montant: number): number {
  return Math.round(montant / 5) * 5
}

export interface InitierParams {
  transactionId: string   // crypto.randomUUID() — doit etre unique par tentative
  montant: number         // deja arrondi via arrondir5()
  description: string
  notifyUrl: string       // NEXT_PUBLIC_URL + '/api/paiements/webhook'
  returnUrl: string       // NEXT_PUBLIC_URL + '/paiement/retour'
  metadata?: string       // JSON.stringify({ reservationId, ... })
}

export interface CinetPayInitResponse {
  code:    string
  message: string
  data?: {
    payment_token: string
    payment_url:   string
  }
}

export async function initierPaiement(params: InitierParams): Promise<CinetPayInitResponse> {
  const res = await fetch(`${CINETPAY_BASE}/payment`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey:         process.env.CINETPAY_API_KEY,
      site_id:        process.env.CINETPAY_SITE_ID,
      transaction_id: params.transactionId,
      amount:         params.montant,
      currency:       'XOF',
      description:    params.description,
      notify_url:     params.notifyUrl,
      return_url:     params.returnUrl,
      channels:       'ALL',   // Wave + Orange Money + MTN + Moov + CB
      lang:           'fr',
      metadata:       params.metadata ?? '',
    }),
  })
  return res.json()
}

export interface VerificationResponse {
  code:    string
  message: string
  data?: {
    status:         string   // 'ACCEPTED' | 'REFUSED' | 'WAITING_FOR_CUSTOMER'
    transaction_id: string
    amount:         number
    currency:       string
    payment_method: string   // 'WAVE-CI' | 'ORANGE-CI' | 'MTN-CI' | 'MOOV-CI' | 'CB'
    payment_date:   string
  }
}

/**
 * CRITIQUE PAY-03 : Appeler apres reception webhook.
 * Ne JAMAIS lire le statut depuis le body du webhook — CinetPay l'omet intentionnellement.
 */
export async function verifierPaiement(transactionId: string): Promise<VerificationResponse> {
  const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey:         process.env.CINETPAY_API_KEY,
      site_id:        process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
    }),
  })
  return res.json()
}

/** Convertit le code canal CinetPay vers la valeur enum de la table paiements */
export function canalVersMethode(canal: string): string {
  const map: Record<string, string> = {
    'WAVE-CI':   'wave',
    'ORANGE-CI': 'orange_money',
    'MTN-CI':    'mtn',
    'MOOV-CI':   'moov',
    'CB':        'carte_bancaire',
  }
  return map[canal] ?? 'autre'
}
