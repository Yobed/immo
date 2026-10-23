import { createClient } from '@supabase/supabase-js'
import type { Database } from '@immo-ci/shared/types/database'

const FALLBACK_URL = 'https://tjvozbcnkimfgwonslzm.supabase.co'
const FALLBACK_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdm96YmNua2ltZmd3b25zbHptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MTQ1MywiZXhwIjoyMDkxMTI3NDUzfQ.7b5L-hHf0CY1rHtsYZ7QdKfzJwmq_V3aHdxoOOIAXlc'

let _admin: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (_admin) return _admin
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL).trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY).trim()
  _admin = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _admin
}
