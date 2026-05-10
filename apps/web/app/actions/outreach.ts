'use server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
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
