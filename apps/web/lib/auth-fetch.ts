import { createClient } from '@/lib/supabase/client'

/**
 * fetch() wrapper qui ajoute automatiquement le token Bearer de la session Supabase.
 * À utiliser dans tous les Client Components qui appellent /api/*.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }
  
  if (session?.access_token) {
    finalHeaders['Authorization'] = `Bearer ${session.access_token}`
  }

  return fetch(url, {
    ...options,
    headers: finalHeaders,
  })
}
