import { createClient, SupabaseClient } from '@supabase/supabase-js'

// DEUX projets Supabase pour les offres flash (scraping), free tier saturé
// l'un après l'autre → on n'écrit que dans le plus récent, on lit les deux,
// on ne copie JAMAIS l'historique (décision Wilfried).
//  - FRESH (jdjzcxvtvxfqflvwkfgv) : reçoit les NOUVELLES offres (write + read).
//  - OLD   (udyfhzyvalansmhkynnc) : saturé → lecture seule (historique).
// ⚠️ Les noms trompent sur le POIDS. Mesuré le 08/09/2026, hors doublons :
// OLD porte 11 601 offres dont 3 444 de moins de 3 mois ; FRESH n'en porte que
// 141. « Historique » est donc le gros du catalogue, pas un fond d'archive, et
// « récent » n'en est qu'une frange. Ne dimensionne rien d'après les libellés.
// Un TROISIÈME projet, MID (mignebexvzrpfxgbhjuf), a été SUPPRIMÉ : son domaine
// ne résout plus (ENOTFOUND, vérifié sur 3 résolveurs). Il était interrogé à
// chaque chargement du catalogue et l'échec était avalé par un .catch() — une
// requête morte par page pendant des semaines, invisible. Ses ids (100 000 à
// 999 999) sont définitivement orphelins.
const FRESH_URL = 'https://jdjzcxvtvxfqflvwkfgv.supabase.co'
const FRESH_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanpjeHZ0dnhmcWZsdndrZmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MTM3MzUsImV4cCI6MjEwMjE4OTczNX0.KO6DptdkqSxBeF138yF-Rljmb8ScfaUr9p-HhmAtJJ4'
const OLD_URL = 'https://udyfhzyvalansmhkynnc.supabase.co'
const OLD_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWZoenl2YWxhbnNtaGt5bm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTYzNTcsImV4cCI6MjA4Njc3MjM1N30.blMJPyp5n_j22AJn6cwKwrTeuxFbMutsnCfDd2AR_pI'

// Plages d'id DISJOINTES → un id suffit à savoir dans quel projet vit la ligne,
// sans requête. Les séquences démarrent : OLD à 1, MID à 100 000, FRESH à
// 1 000 000 (ALTER SEQUENCE locaux_id_seq RESTART WITH 1000000 côté FRESH).
export const LOCAUX_LEGACY_MAX_ID = 99999 // borne haute OLD (rétro-compat)
export const LOCAUX_FRESH_MIN_ID = 1_000_000 // borne basse FRESH

let _fresh: SupabaseClient | null = null
let _old: SupabaseClient | null = null
let _freshAdmin: SupabaseClient | null = null
let _oldAdmin: SupabaseClient | null = null

const OPTS = {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'X-Source': 'immo-ci-offre-flash' } },
} as const

const ADMIN_OPTS = { auth: { persistSession: false, autoRefreshToken: false } } as const

function svcKey(name: string): string {
  const key = process.env[name]?.trim().replace(/^﻿/, '')
  if (!key) throw new Error(`${name} missing`)
  return key
}

// ─── Clients lecture (anon) ──────────────────────────────────────────────────

/** Client lecture seule vers le projet d'ÉCRITURE actuel (FRESH). */
export function createLocauxClient(): SupabaseClient {
  if (_fresh) return _fresh
  _fresh = createClient(FRESH_URL, FRESH_ANON, OPTS)
  return _fresh
}

/** Client lecture seule vers le plus ancien projet OLD (historique). */
export function createLocauxLegacyClient(): SupabaseClient {
  if (_old) return _old
  _old = createClient(OLD_URL, OLD_ANON, OPTS)
  return _old
}

/** Les deux sources de lecture restantes, plus récent d'abord (listes fusionnées). */
export function locauxReadClients(): SupabaseClient[] {
  return [createLocauxClient(), createLocauxLegacyClient()]
}

/** Route une lecture par id vers le bon projet (plages disjointes). */
export function locauxClientForId(id: number): SupabaseClient {
  if (id >= LOCAUX_FRESH_MIN_ID) return createLocauxClient()
  // ponytail: la plage MID (100 000-999 999) est orpheline depuis la
  // suppression du projet mignebexvzrpfxgbhjuf. Ces ids retombent sur
  // legacy, qui ne les contient pas : lecture vide, jamais de crash.
  return createLocauxLegacyClient()
}

// ─── Clients admin (service_role) ────────────────────────────────────────────

/** Admin du projet d'écriture FRESH (dédup, écritures). → FRESH_LOCAUX_SERVICE_ROLE_KEY */
export function createLocauxAdminClient(): SupabaseClient {
  if (_freshAdmin) return _freshAdmin
  _freshAdmin = createClient(FRESH_URL, svcKey('FRESH_LOCAUX_SERVICE_ROLE_KEY'), ADMIN_OPTS)
  return _freshAdmin
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
  // ponytail: la plage MID (100 000-999 999) est orpheline depuis la
  // suppression du projet mignebexvzrpfxgbhjuf. Ces ids retombent sur
  // legacy, qui ne les contient pas : lecture vide, jamais de crash.
  return createLocauxLegacyAdminClient()
}

/** Tri fusionné des sources : date_publication décroissante (ISO texte). */
export function byDatePubDesc(
  a: { date_publication?: string | null },
  b: { date_publication?: string | null },
): number {
  return (b.date_publication ?? '').localeCompare(a.date_publication ?? '')
}
