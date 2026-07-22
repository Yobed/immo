import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Projet mignebexvzrpfxgbhjuf depuis juil. 2026 (l'ancien udyfhzyvalansmhkynnc
// a saturé son quota free — seules les NOUVELLES offres arrivent ici).
const URL = 'https://mignebexvzrpfxgbhjuf.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25lYmV4dnpycGZ4Z2JoanVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjA5NzksImV4cCI6MjEwMDEzNjk3OX0.jiERuKejm7D96ILlnBfWQKcRnCLjVkKaxR-2Rz_hBek'

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
