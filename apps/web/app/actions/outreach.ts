'use server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { markInviteConverted } from '@/lib/outreach/agent-prospects'

/**
 * À appeler après une authentification réussie pour marquer la conversion
 * d'un prospect outreach. Lit le cookie `outreach_token` (posé par /invite/[token]),
 * marque le log comme converti, et supprime le cookie.
 *
 * Idempotent : si pas de cookie ou pas d'user, ne fait rien.
 */
export async function recordOutreachConversionForCurrentUser(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('outreach_token')?.value
  if (!token) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  try {
    await markInviteConverted({ token, userId: user.id })
  } finally {
    cookieStore.delete('outreach_token')
  }
}

/**
 * Envoie une invitation WhatsApp par DM privé à un démarcheur spécifique.
 * Réservé aux administrateurs.
 */
export async function inviteProspectAction(prospectId: string): Promise<{ ok: boolean; reason?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Accès réservé aux administrateurs')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prospect, error } = await (admin as any)
    .from('agent_prospects')
    .select('*')
    .eq('id', prospectId)
    .single()

  if (error || !prospect) {
    return { ok: false, reason: 'Prospect introuvable' }
  }

  const { tryInviteProspect } = await import('@/lib/outreach/dispatch')
  const res = await tryInviteProspect(prospect)
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/outreach')

  return { ok: res.sent, reason: res.reason }
}

/**
 * Envoie des invitations à une sélection de prospects éligibles en attente.
 * Réservé aux administrateurs.
 */
export async function inviteEligibleProspectsAction(limit = 10): Promise<{ sentCount: number; failedCount: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Accès réservé aux administrateurs')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prospects } = await (admin as any)
    .from('agent_prospects')
    .select('*')
    .in('status', ['new', 'queued'])
    .eq('opt_out', false)
    .limit(limit)

  const { tryInviteProspect } = await import('@/lib/outreach/dispatch')
  let sentCount = 0
  let failedCount = 0

  for (const p of (prospects ?? [])) {
    const res = await tryInviteProspect(p)
    if (res.sent) sentCount++
    else failedCount++
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin/outreach')

  return { sentCount, failedCount }
}
