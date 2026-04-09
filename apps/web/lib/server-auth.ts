import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Récupère l'utilisateur côté serveur en vérifiant d'abord les cookies
 * puis le header Authorization (pour les fetch depuis Client Components).
 */
export async function getServerUser(request: Request): Promise<{
  user: { id: string } | null
  supabase: SupabaseClient
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any
  let { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    }
  }

  return { user, supabase }
}
