'use server'
import { createClient } from '@/lib/supabase/server'

/**
 * Résout la route post-login en fonction du rôle du user authentifié.
 * Utilise le client SSR (cookies fraîches après signInWithPassword/OAuth).
 *
 * Fallbacks :
 *  - admin → /admin/suivi
 *  - proprietaire → /dashboard
 *  - locataire → /
 *  - profil introuvable / erreur RLS → /dashboard (comportement précédent)
 *
 * `explicitRedirect` (du paramètre `?redirect=`) prend toujours la priorité.
 */
export async function resolvePostLoginPath(
  explicitRedirect?: string | null,
): Promise<string> {
  if (explicitRedirect && explicitRedirect.startsWith('/')) return explicitRedirect

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return '/login'

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[post-login] profile read failed', { userId: user.id, error: error.message })
    return '/dashboard'
  }

  const role = (profile?.role ?? '').toString().trim().toLowerCase()
  if (role === 'admin') return '/admin/suivi'
  if (role === 'proprietaire') return '/dashboard'
  if (role === 'locataire') return '/'
  return '/dashboard'
}
