import { randomBytes } from 'crypto'
import { wasenderSendMessage } from '@/lib/wasender'
import {
  type AgentProspect,
  shouldInvite,
  logInviteSent,
} from './agent-prospects'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://immo-sigma.vercel.app'
const TEMPLATE_KEY = 'invite_v1'

function generateInviteToken(): string {
  return randomBytes(16).toString('hex')
}

function buildInviteMessage(args: {
  prospect: AgentProspect
  inviteToken: string
}): string {
  const { prospect, inviteToken } = args
  const name = prospect.display_name?.split(' ')[0] || ''
  const greeting = name ? `Salut ${name},` : 'Bonjour,'
  const lastBien = prospect.last_extraction
  const beinSpecificLine = lastBien
    ? `J'ai vu ton annonce (${lastBien.type_bien} à ${lastBien.commune}). `
    : 'J\'ai vu ton annonce immobilière. '

  return [
    `${greeting}`,
    '',
    `${beinSpecificLine}Je suis Sapphire de BOGBE'S GROUPE — la plateforme immobilière premium en CI.`,
    '',
    'On peut t\'aider à toucher plus de clients qualifiés :',
    '✓ Annonces vérifiées mises en avant',
    '✓ Visibilité sur le site + diffusion WhatsApp',
    '✓ Outils pros (visites, contrats, paiements)',
    '',
    `🔗 Inscription gratuite (1 min) : ${SITE_URL}/invite/${inviteToken}`,
    '',
    'Tu peux répondre STOP si tu ne veux plus recevoir de message.',
  ].join('\n')
}

/**
 * Décide si on doit inviter ce prospect, génère le message + token et envoie.
 * Logge le résultat. Retourne le token utilisé (ou null si non invité).
 */
export async function tryInviteProspect(
  prospect: AgentProspect,
): Promise<{ sent: boolean; reason?: string; token?: string }> {
  const decision = shouldInvite(prospect)
  if (!decision.ok) return { sent: false, reason: decision.reason }

  const token = generateInviteToken()
  const message = buildInviteMessage({ prospect, inviteToken: token })

  let success = false
  let errorMsg: string | undefined
  try {
    const result = await wasenderSendMessage(prospect.phone, message, 'text')
    success = result.success
    if (!success) errorMsg = result.message
  } catch (e) {
    errorMsg = (e as Error).message
  }

  await logInviteSent({
    prospectId: prospect.id,
    templateKey: TEMPLATE_KEY,
    messageBody: message,
    inviteToken: token,
    status: success ? 'sent' : 'failed',
    error: errorMsg,
  })

  return success
    ? { sent: true, token }
    : { sent: false, reason: errorMsg ?? 'unknown_error' }
}
