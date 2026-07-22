import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Deux projets Supabase pour les offres flash depuis juil. 2026 :
//  - NOUVEAU (mignebexvzrpfxgbhjuf) : reçoit les nouvelles offres du scraping.
//  - ANCIEN (udyfhzyvalansmhkynnc) : quota free saturé → gelé en écriture, mais
//    les offres historiques doivent RESTER visibles (décision Wilfried) sans
//    être copiées dans le nouveau projet. Le site lit donc les deux.
const URL = 'https://mignebexvzrpfxgbhjuf.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25lYmV4dnpycGZ4Z2JoanVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjA5NzksImV4cCI6MjEwMDEzNjk3OX0.jiERuKejm7D96ILlnBfWQKcRnCLjVkKaxR-2Rz_hBek'
const LEGACY_URL = 'https://udyfhzyvalansmhkynnc.supabase.co'
const LEGACY_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWZoenl2YWxhbnNtaGt5bm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTYzNTcsImV4cCI6MjA4Njc3MjM1N30.blMJPyp5n_j22AJn6cwKwrTeuxFbMutsnCfDd2AR_pI'

// La séquence id du nouveau projet démarre à 100000 (max historique : 34506)
// → un id suffit à savoir dans quel projet vit la ligne, sans requête.
export const LOCAUX_LEGACY_MAX_ID = 99999

let _client: SupabaseClient | null = null
let _legacy: SupabaseClient | null = null
let _admin: SupabaseClient | null = null
let _legacyAdmin: SupabaseClient | null = null

const OPTS = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'X-Source': 'immo-ci-offre-flash' } },
} as const

/** Client lecture seule vers le NOUVEAU projet locaux. */
export function createLocauxClient(): SupabaseClient {
  if (_client) return _client
  _client = createClient(URL, ANON, OPTS)
  return _client
}

/** Client lecture seule vers l'ANCIEN projet locaux (offres historiques). */
export function createLocauxLegacyClient(): SupabaseClient {
  if (_legacy) return _legacy
  _legacy = createClient(LEGACY_URL, LEGACY_ANON, OPTS)
  return _legacy
}

/** Les deux sources de lecture, nouveau d'abord (pour les listes fusionnées). */
export function locauxReadClients(): SupabaseClient[] {
  return [createLocauxClient(), createLocauxLegacyClient()]
}

/** Route une lecture par id vers le bon projet. */
export function locauxClientForId(id: number): SupabaseClient {
  return id > LOCAUX_LEGACY_MAX_ID ? createLocauxClient() : createLocauxLegacyClient()
}

/**
 * Client admin (service-role) du NOUVEAU projet (dédup, écritures).
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

/**
 * Client admin de l'ANCIEN projet (retrait/restauration d'offres historiques).
 * Nécessite OLD_LOCAUX_SERVICE_ROLE_KEY en env.
 */
export function createLocauxLegacyAdminClient(): SupabaseClient {
  if (_legacyAdmin) return _legacyAdmin
  const key = process.env.OLD_LOCAUX_SERVICE_ROLE_KEY?.trim().replace(/^﻿/, '')
  if (!key) throw new Error('OLD_LOCAUX_SERVICE_ROLE_KEY missing')
  _legacyAdmin = createClient(LEGACY_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _legacyAdmin
}

/** Route une écriture admin par id vers le bon projet. */
export function locauxAdminForId(id: number): SupabaseClient {
  return id > LOCAUX_LEGACY_MAX_ID ? createLocauxAdminClient() : createLocauxLegacyAdminClient()
}

/** Tri fusionné des deux sources : date_publication décroissante (ISO texte). */
export function byDatePubDesc(
  a: { date_publication?: string | null },
  b: { date_publication?: string | null },
): number {
  return (b.date_publication ?? '').localeCompare(a.date_publication ?? '')
}
