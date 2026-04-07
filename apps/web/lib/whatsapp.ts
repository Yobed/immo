// apps/web/lib/whatsapp.ts
// Client WhatsApp Business API (WABA) — Immo CI Platform
// Utilise l'API Graph Meta v19.0

export class WhatsAppError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly type?: string
  ) {
    super(message)
    this.name = 'WhatsAppError'
  }
}

export interface WhatsAppResult {
  messageId: string
  to: string
}

/**
 * Envoie un message texte WhatsApp via l'API WABA.
 * @param to Numéro E.164 international ex: "+2250102030405"
 * @param body Texte du message (max 4096 chars)
 * @throws WhatsAppError si l'envoi échoue
 */
export async function sendWhatsApp(to: string, body: string): Promise<WhatsAppResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    throw new WhatsAppError('WHATSAPP_PHONE_NUMBER_ID et WHATSAPP_ACCESS_TOKEN requis')
  }

  // Normaliser le numéro: supprimer espaces et s'assurer du format E.164
  const normalizedTo = to.replace(/\s+/g, '').startsWith('+') ? to.replace(/\s+/g, '') : `+${to.replace(/\s+/g, '')}`

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizedTo,
      type: 'text',
      text: { body: body.slice(0, 4096) },  // truncate to WhatsApp limit
    }),
  })

  const data = await response.json() as {
    messages?: Array<{ id: string }>
    error?: { message: string; code: number; type: string }
  }

  if (!response.ok || data.error) {
    throw new WhatsAppError(
      data.error?.message ?? `WhatsApp API error ${response.status}`,
      data.error?.code,
      data.error?.type
    )
  }

  return {
    messageId: data.messages?.[0]?.id ?? '',
    to: normalizedTo,
  }
}

/** Templates de messages pour les jalons de relance loyer */
export const RELANCE_MESSAGES = {
  'J-3': (montant: number, dateEcheance: string) =>
    `Bonjour, rappel : votre loyer de ${montant.toLocaleString('fr-FR')} FCFA est dû le ${dateEcheance}. Merci de procéder au règlement dans les délais. — Immo CI`,

  'J-1': (montant: number, dateEcheance: string) =>
    `RAPPEL URGENT : votre loyer de ${montant.toLocaleString('fr-FR')} FCFA est dû DEMAIN (${dateEcheance}). Veuillez régulariser votre situation. — Immo CI`,

  'J+1': (montant: number, dateEcheance: string) =>
    `⚠️ Votre loyer de ${montant.toLocaleString('fr-FR')} FCFA était dû le ${dateEcheance}. Votre compte est maintenant en retard. Contactez votre propriétaire pour régulariser. — Immo CI`,

  'J+7': (montant: number, _dateEcheance: string) =>
    `DERNIER RAPPEL : votre loyer de ${montant.toLocaleString('fr-FR')} FCFA est en retard depuis 7 jours. Sans règlement, des pénalités contractuelles s'appliquent. Contactez votre propriétaire immédiatement. — Immo CI`,
} as const

export type RelanceJalon = keyof typeof RELANCE_MESSAGES
