import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { canonicalPhone } from '@/lib/prospects/capture'

export type IntakeEntity = 'contact' | 'visite' | 'reservation'

/**
 * Creates/enriches the CRM prospect for an incoming request and atomically
 * links the request to the canonical prospect. The two operations are
 * deliberately best-effort: a CRM outage must not make a valid public form
 * fail, while the returned error is logged by the caller.
 */
export async function ensureProspectForIntake(args: {
  phone?: string | null
  name?: string | null
  message?: string | null
  source?: string | null
  entity?: IntakeEntity
  entityId?: string
  supabase?: SupabaseClient
}): Promise<string | null> {
  const phone = args.phone?.trim()
  if (!phone || phone.replace(/\D/g, '').length < 8) return null

  const admin = args.supabase ?? createAdminClient()
  const canonical = canonicalPhone(phone)
  const { error: upsertError } = await (admin as any).rpc('upsert_prospect', {
    p_phone: canonical,
    p_jid: null,
    p_nom: args.name?.trim() || null,
    p_type: null,
    p_commune: null,
    p_quartier: null,
    p_budget: null,
    p_date: null,
    p_message: args.message?.slice(0, 300) || null,
  })

  // A missing/temporarily unavailable capture RPC must be visible to logs but
  // never invalidate the public request that has already been stored.
  if (upsertError) console.error('[crm-intake] prospect upsert failed', upsertError)

  if (args.entity && args.entityId) return linkIntakeToProspect(args.entity, args.entityId, phone, admin)

  const { data } = await (admin as any)
    .from('prospects')
    .select('id')
    .eq('phone', canonical)
    .is('merged_into', null)
    .order('last_seen', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

/** Links an already persisted intake row without creating/enriching a second prospect. */
export async function linkIntakeToProspect(
  entity: IntakeEntity,
  entityId: string,
  phone: string,
  supabase?: SupabaseClient,
): Promise<string | null> {
  const admin = supabase ?? createAdminClient()
  const { data, error } = await (admin as any).rpc('crm_link_intake', {
    p_entity: entity,
    p_id: entityId,
    p_phone: phone,
  })
  if (error) {
    console.error('[crm-intake] prospect link failed', error)
    return null
  }
  return data?.prospect_id ?? null
}

/** Canonical comparison used by request deduplication before the SQL guard. */
export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  return canonicalPhone(a) === canonicalPhone(b)
}
