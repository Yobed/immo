import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { ExtractedBien } from '@/lib/extractors/whatsapp-bien-extractor'

/**
 * Service d'identification et persistance des prospects (agents immobiliers
 * détectés dans les groupes WhatsApp publics).
 *
 * Sécurité : utilise le service role — n'expose JAMAIS ces fonctions côté client.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getServiceClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role not configured for outreach service')
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}

export type ProspectStatus =
  | 'new'
  | 'queued'
  | 'invited'
  | 'responded'
  | 'converted'
  | 'opted_out'
  | 'blocked'

export interface AgentProspect {
  id: string
  phone: string
  jid: string | null
  display_name: string | null
  source_group_jid: string | null
  source_group_name: string | null
  first_seen_at: string
  last_seen_at: string
  last_invited_at: string | null
  invite_count: number
  status: ProspectStatus
  opt_out: boolean
  ad_count: number
  notes: string | null
  last_extraction: ExtractedBien | null
}

interface UpsertArgs {
  phone: string
  jid?: string | null
  displayName?: string | null
  sourceGroupJid?: string | null
  sourceGroupName?: string | null
  extraction?: ExtractedBien | null
}

/**
 * Insère ou met à jour un prospect.
 * - Première détection → status='new', ad_count=1
 * - Détections suivantes → incrémente ad_count, met à jour last_seen + extraction
 * - N'écrase pas un status final (opted_out / blocked / converted)
 */
export async function upsertProspect(args: UpsertArgs): Promise<AgentProspect> {
  const supabase = getServiceClient()

  const { data: existing } = await supabase
    .from('agent_prospects')
    .select('*')
    .eq('phone', args.phone)
    .maybeSingle()

  if (!existing) {
    const { data, error } = await supabase
      .from('agent_prospects')
      .insert({
        phone: args.phone,
        jid: args.jid ?? null,
        display_name: args.displayName ?? null,
        source_group_jid: args.sourceGroupJid ?? null,
        source_group_name: args.sourceGroupName ?? null,
        last_extraction: args.extraction ?? null,
        ad_count: args.extraction ? 1 : 0,
      })
      .select('*')
      .single()
    if (error) throw new Error(`upsertProspect insert failed: ${error.message}`)
    return data as AgentProspect
  }

  // Ne touche pas un status final
  const isFinal = ['opted_out', 'blocked', 'converted'].includes(existing.status)
  const newStatus = isFinal ? existing.status : existing.status

  const { data, error } = await supabase
    .from('agent_prospects')
    .update({
      jid: args.jid ?? existing.jid,
      display_name: args.displayName ?? existing.display_name,
      last_seen_at: new Date().toISOString(),
      last_extraction: args.extraction ?? existing.last_extraction,
      ad_count: existing.ad_count + (args.extraction ? 1 : 0),
      status: newStatus,
    })
    .eq('id', existing.id)
    .select('*')
    .single()
  if (error) throw new Error(`upsertProspect update failed: ${error.message}`)
  return data as AgentProspect
}

/**
 * Marque un prospect en opt-out (réception d'un STOP, BLOCK, etc.).
 */
export async function recordOptOut(phone: string): Promise<void> {
  const supabase = getServiceClient()
  await supabase
    .from('agent_prospects')
    .update({ status: 'opted_out', opt_out: true })
    .eq('phone', phone)
}

/**
 * Décide si un prospect doit être invité maintenant.
 * Critères :
 *  - pas opt_out
 *  - status éligible (new ou queued ou responded)
 *  - cooldown respecté depuis last_invited_at (defaut 14j)
 *  - quota max d'invites par prospect respecté (defaut 2)
 */
const COOLDOWN_DAYS = 14
const MAX_INVITES_PER_PROSPECT = 2

export function shouldInvite(prospect: AgentProspect): { ok: true } | { ok: false; reason: string } {
  if (prospect.opt_out) return { ok: false, reason: 'opt_out' }
  if (['opted_out', 'blocked', 'converted'].includes(prospect.status)) {
    return { ok: false, reason: `status:${prospect.status}` }
  }
  if (prospect.invite_count >= MAX_INVITES_PER_PROSPECT) {
    return { ok: false, reason: 'max_invites_reached' }
  }
  if (prospect.last_invited_at) {
    const last = new Date(prospect.last_invited_at).getTime()
    const cutoff = Date.now() - COOLDOWN_DAYS * 24 * 3600 * 1000
    if (last > cutoff) return { ok: false, reason: 'cooldown' }
  }
  return { ok: true }
}

/**
 * Logge un envoi d'invite et met à jour le prospect.
 * Appelé après l'envoi WhatsApp (succès ou échec).
 */
export async function logInviteSent(args: {
  prospectId: string
  templateKey: string
  messageBody: string
  inviteToken: string
  status: 'sent' | 'failed'
  error?: string
}): Promise<void> {
  const supabase = getServiceClient()

  await supabase.from('agent_outreach_log').insert({
    prospect_id: args.prospectId,
    template_key: args.templateKey,
    message_body: args.messageBody,
    invite_token: args.inviteToken,
    delivery_status: args.status,
    delivery_error: args.error ?? null,
  })

  if (args.status === 'sent') {
    const { data: prospect } = await supabase
      .from('agent_prospects')
      .select('invite_count')
      .eq('id', args.prospectId)
      .single()

    await supabase
      .from('agent_prospects')
      .update({
        last_invited_at: new Date().toISOString(),
        invite_count: ((prospect as { invite_count: number } | null)?.invite_count ?? 0) + 1,
        status: 'invited',
      })
      .eq('id', args.prospectId)
  }
}

/**
 * Marque un click depuis le lien d'invitation (route /invite/[token]).
 */
export async function markInviteClicked(token: string): Promise<{ prospectId: string } | null> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('agent_outreach_log')
    .update({
      delivery_status: 'clicked',
      clicked_at: new Date().toISOString(),
    })
    .eq('invite_token', token)
    .select('prospect_id')
    .single()
  if (error || !data) return null
  return { prospectId: (data as { prospect_id: string }).prospect_id }
}

/**
 * Marque la conversion (l'utilisateur s'inscrit après avoir cliqué).
 */
export async function markInviteConverted(args: {
  token: string
  userId: string
}): Promise<void> {
  const supabase = getServiceClient()

  const { data: log } = await supabase
    .from('agent_outreach_log')
    .update({
      delivery_status: 'converted',
      converted_at: new Date().toISOString(),
      converted_user_id: args.userId,
    })
    .eq('invite_token', args.token)
    .select('prospect_id')
    .single()

  if (log) {
    await supabase
      .from('agent_prospects')
      .update({ status: 'converted' })
      .eq('id', (log as { prospect_id: string }).prospect_id)
  }
}
