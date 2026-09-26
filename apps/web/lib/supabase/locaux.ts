import { createClient, SupabaseClient } from '@supabase/supabase-js'

// QUATRE projets Supabase pour les offres flash (scraping), free tier saturé
// l'un après l'autre → on n'écrit que dans le plus récent, on lit tous les actifs,
// on ne copie JAMAIS l'historique (décision Wilfried).
//  - FRESH      (fzccugmyoglemjwidqrl) : reçoit les NOUVELLES offres (write + read, id >= 2 000 000).
//  - PREV_FRESH (jdjzcxvtvxfqflvwkfgv) : lecture seule (id 1 000 000 .. 1 999 999).
//  - MID        (mignebexvzrpfxgbhjuf) : lecture seule (historique août, id 100 000 .. 999 999).
//  - OLD        (udyfhzyvalansmhkynnc) : lecture seule (historique initial, id <= 99 999).
const FRESH_URL = 'https://fzccugmyoglemjwidqrl.supabase.co'
const FRESH_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y2N1Z215b2dsZW1qd2lkcXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDI0MjYsImV4cCI6MjEwNTkxODQyNn0.90URR1TCwwdnokdUDrQ1aRHYVfvHa__v0tejFYHADT0'
const PREV_FRESH_URL = 'https://jdjzcxvtvxfqflvwkfgv.supabase.co'
const PREV_FRESH_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanpjeHZ0dnhmcWZsdndrZmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MTM3MzUsImV4cCI6MjEwMjE4OTczNX0.KO6DptdkqSxBeF138yF-Rljmb8ScfaUr9p-HhmAtJJ4'
const MID_URL = 'https://mignebexvzrpfxgbhjuf.supabase.co'
const MID_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25lYmV4dnpycGZ4Z2JoanVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjA5NzksImV4cCI6MjEwMDEzNjk3OX0.jiERuKejm7D96ILlnBfWQKcRnCLjVkKaxR-2Rz_hBek'
const OLD_URL = 'https://udyfhzyvalansmhkynnc.supabase.co'
const OLD_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWZoenl2YWxhbnNtaGt5bm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTYzNTcsImV4cCI6MjA4Njc3MjM1N30.blMJPyp5n_j22AJn6cwKwrTeuxFbMutsnCfDd2AR_pI'

// Plages d'id DISJOINTES → un id suffit à savoir dans quel projet vit la ligne,
// sans requête. Les séquences démarrent : OLD à 1, MID à 100 000, PREV_FRESH à
// 1 000 000, FRESH à 2 000 000 (START WITH 2000000 côté FRESH).
export const LOCAUX_LEGACY_MAX_ID = 99999 // borne haute OLD (rétro-compat)
export const LOCAUX_PREV_FRESH_MIN_ID = 1_000_000 // borne basse PREV_FRESH
export const LOCAUX_FRESH_MIN_ID = 2_000_000 // borne basse FRESH actuel

let _fresh: SupabaseClient | null = null
let _prevFresh: SupabaseClient | null = null
let _mid: SupabaseClient | null = null
let _old: SupabaseClient | null = null
let _freshAdmin: SupabaseClient | null = null
let _prevFreshAdmin: SupabaseClient | null = null
let _midAdmin: SupabaseClient | null = null
let _oldAdmin: SupabaseClient | null = null

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(3500)
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal
  return fetch(input, { ...init, signal })
}

const OPTS = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    headers: { 'X-Source': 'immo-ci-offre-flash' },
    fetch: fetchWithTimeout,
  },
} as const

const ADMIN_OPTS = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchWithTimeout },
} as const

function svcKey(name: string): string {
  const raw = process.env[name]
  if (!raw) throw new Error(`${name} missing`)
  const key = raw.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\ufeff]/g, '').trim()
  if (!key) throw new Error(`${name} empty after sanitization`)
  return key
}

// ─── Clients lecture (anon) ──────────────────────────────────────────────────

/** Client lecture seule vers le projet d'ÉCRITURE actuel (FRESH : fzccugmyoglemjwidqrl). */
export function createLocauxClient(): SupabaseClient {
  if (_fresh) return _fresh
  _fresh = createClient(FRESH_URL, FRESH_ANON, OPTS)
  return _fresh
}

/** Client lecture seule vers le précédent projet FRESH (jdjzcxvtvxfqflvwkfgv). */
export function createLocauxPrevFreshClient(): SupabaseClient {
  if (_prevFresh) return _prevFresh
  _prevFresh = createClient(PREV_FRESH_URL, PREV_FRESH_ANON, OPTS)
  return _prevFresh
}

/** Client lecture seule vers le projet intermédiaire MID (mignebexvzrpfxgbhjuf). */
export function createLocauxMidClient(): SupabaseClient {
  if (_mid) return _mid
  _mid = createClient(MID_URL, MID_ANON, OPTS)
  return _mid
}

/** Client lecture seule vers le plus ancien projet OLD (historique). */
export function createLocauxLegacyClient(): SupabaseClient {
  if (_old) return _old
  _old = createClient(OLD_URL, OLD_ANON, OPTS)
  return _old
}

/**
 * Les sources de lecture actives, plus récent d'abord (listes fusionnées).
 * Note: PREV_FRESH (HTTP 402 quota dépassé) et OLD (DNS supprimé) sont exclus
 * pour éviter de bloquer ou ralentir chaque requête catalogue/admin.
 */
export function locauxReadClients(): SupabaseClient[] {
  return [
    createLocauxClient(),
    createLocauxMidClient(),
  ]
}

/** Route une lecture par id vers le bon projet (plages disjointes). */
export function locauxClientForId(id: number): SupabaseClient {
  if (id >= LOCAUX_FRESH_MIN_ID) return createLocauxClient()
  if (id >= LOCAUX_PREV_FRESH_MIN_ID) return createLocauxPrevFreshClient()
  if (id > LOCAUX_LEGACY_MAX_ID) return createLocauxMidClient()
  return createLocauxLegacyClient()
}

// ─── Clients admin (service_role) ────────────────────────────────────────────

/** Admin du projet d'écriture FRESH (dédup, écritures). → FRESH_LOCAUX_SERVICE_ROLE_KEY */
export function createLocauxAdminClient(): SupabaseClient {
  if (_freshAdmin) return _freshAdmin
  _freshAdmin = createClient(FRESH_URL, svcKey('FRESH_LOCAUX_SERVICE_ROLE_KEY'), ADMIN_OPTS)
  return _freshAdmin
}

/** Admin du projet PREV_FRESH (jdjzcxvtvxfqflvwkfgv). */
export function createLocauxPrevFreshAdminClient(): SupabaseClient {
  if (_prevFreshAdmin) return _prevFreshAdmin
  const key = process.env.PREV_FRESH_LOCAUX_SERVICE_ROLE_KEY
    ? svcKey('PREV_FRESH_LOCAUX_SERVICE_ROLE_KEY')
    : PREV_FRESH_ANON
  _prevFreshAdmin = createClient(PREV_FRESH_URL, key, ADMIN_OPTS)
  return _prevFreshAdmin
}

/** Admin du projet MID (retrait/restauration d'offres historiques). → LOCAUX_SUPABASE_SERVICE_ROLE_KEY */
export function createLocauxMidAdminClient(): SupabaseClient {
  if (_midAdmin) return _midAdmin
  _midAdmin = createClient(MID_URL, svcKey('LOCAUX_SUPABASE_SERVICE_ROLE_KEY'), ADMIN_OPTS)
  return _midAdmin
}

/** Admin du projet OLD (retrait/restauration d'offres historiques). → OLD_LOCAUX_SERVICE_ROLE_KEY */
export function createLocauxLegacyAdminClient(): SupabaseClient {
  if (_oldAdmin) return _oldAdmin
  _oldAdmin = createClient(OLD_URL, svcKey('OLD_LOCAUX_SERVICE_ROLE_KEY'), ADMIN_OPTS)
  return _oldAdmin
}

/** Route une écriture admin par id vers le bon projet (plages disjointes). */
export function locauxAdminForId(id: number): SupabaseClient {
  if (id >= LOCAUX_FRESH_MIN_ID) return createLocauxAdminClient()
  if (id >= LOCAUX_PREV_FRESH_MIN_ID) return createLocauxPrevFreshAdminClient()
  if (id > LOCAUX_LEGACY_MAX_ID) return createLocauxMidAdminClient()
  return createLocauxLegacyAdminClient()
}

/** Tri fusionné des sources : date_publication (ou created_at) décroissante (ISO texte). */
export function byDatePubDesc(
  a: { date_publication?: string | null; created_at?: string | null },
  b: { date_publication?: string | null; created_at?: string | null },
): number {
  const da = a.date_publication || a.created_at || ''
  const db = b.date_publication || b.created_at || ''
  return db.localeCompare(da)
}

