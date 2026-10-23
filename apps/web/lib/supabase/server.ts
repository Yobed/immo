import { createServerClient } from '@supabase/ssr'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@immo-ci/shared/types/database'

const FALLBACK_SUPABASE_URL = 'https://tjvozbcnkimfgwonslzm.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdm96YmNua2ltZmd3b25zbHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTE0NTMsImV4cCI6MjA5MTEyNzQ1M30.tTEZEhE7uoHDqatHJoTd8WWv1e9KD3tCHMZfU2kKV_E'

export async function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY).trim()
  try {
    const cookieStore = await cookies()
    return createServerClient<Database>(
      url,
      key,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method is called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    )
  } catch {
    // Called outside request scope (background jobs, scripts, CLI)
    return createAnonClient<Database>(
      url,
      key,
      { auth: { persistSession: false } }
    )
  }
}
