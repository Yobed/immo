import { createClient } from '@supabase/supabase-js'
import type { Database } from '@immo-ci/shared/types/database'

let _admin: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase admin credentials missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  }
  _admin = createClient<Database>(url.trim(), key.trim(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _admin
}
