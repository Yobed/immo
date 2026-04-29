import { createClient, SupabaseClient } from '@supabase/supabase-js'

const URL = 'https://udyfhzyvalansmhkynnc.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWZoenl2YWxhbnNtaGt5bm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTYzNTcsImV4cCI6MjA4Njc3MjM1N30.blMJPyp5n_j22AJn6cwKwrTeuxFbMutsnCfDd2AR_pI'

let _client: SupabaseClient | null = null
let _admin: SupabaseClient | null = null

/**
 * Client lecture seule vers le projet Supabase de scraping WhatsApp.
 */
export function createLocauxClient(): SupabaseClient {
  if (_client) return _client
  _client = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Source': 'immo-ci-offre-flash' } },
  })
  return _client
}

/**
 * Client admin (service-role) pour écrire dans le projet locaux (dédup, etc.).
 * Nécessite LOCAUX_SUPABASE_SERVICE_ROLE_KEY en env.
 */
export function createLocauxAdminClient(): SupabaseClient {
  if (_admin) return _admin
  const key = process.env.LOCAUX_SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^﻿/, '')
  if (!key) throw new Error('LOCAUX_SUPABASE_SERVICE_ROLE_KEY missing')
  _admin = createClient(URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _admin
}
