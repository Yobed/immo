import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Récupère l'utilisateur côté serveur en vérifiant d'abord les cookies
 * puis le header Authorization (pour les fetch depuis Client Components).
 * Si l'authentification passe par le Bearer token, recrée un client Supabase
 * porteur du token pour que RLS (auth.uid()) fonctionne sur toutes les requêtes.
 */
export async function getServerUser(request: Request): Promise<{
  user: { id: string } | null
  supabase: SupabaseClient
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase = await createClient() as any
  let { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
    if (token) {
      const { data } = await supabase.auth.getUser(token)
      user = data.user
      if (user) {
        supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        )
      }
    }
  }

  return { user, supabase }
}

