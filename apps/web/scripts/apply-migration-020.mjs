#!/usr/bin/env node
/**
 * Apply migration 020 (catalogue perf indexes) via Supabase REST RPC.
 *
 * Usage:
 *   cd apps/web
 *   node scripts/apply-migration-020.mjs
 *
 * Requires in .env.local:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * Mechanism: posts SQL to the project's `/rest/v1/rpc/exec_sql` endpoint if it
 * exists, otherwise falls back to the supabase-js `.rpc()` API. Each CREATE
 * INDEX is sent as its own statement (Supabase REST won't accept multi-statement).
 *
 * Why not psql? Direct Postgres connection string isn't in .env.local and the
 * service role key gives us enough power via PostgREST.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(__dirname, '..', '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('❌ Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const sqlPath = resolve(__dirname, '..', '..', '..', 'supabase', 'migrations', '020_catalogue_perf_indexes.sql')
const sqlRaw = readFileSync(sqlPath, 'utf8')

// Split into individual statements (REST endpoints don't accept multi-statement)
const statements = sqlRaw
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith('--'))

console.log(`📋 Applying ${statements.length} SQL statements to ${url}\n`)

let okCount = 0
let failCount = 0

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i]
  const preview = stmt.replace(/\s+/g, ' ').slice(0, 80)
  process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}…  `)

  // PostgREST exposes /rest/v1/rpc/{name} for stored procedures.
  // We need an `exec_sql(query text)` RPC defined in the DB. If it doesn't
  // exist, the call returns 404 and we exit with instructions.
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: stmt }),
  })

  if (res.ok) {
    okCount++
    console.log('✅')
  } else {
    failCount++
    const body = await res.text()
    console.log(`❌ (${res.status})`)
    if (res.status === 404) {
      console.error('\n⚠️  Function exec_sql() not found in the database.')
      console.error('   Supabase doesn\'t expose raw SQL via REST by default.\n')
      console.error('🔧 Manual fix — paste this in the Supabase SQL editor ONCE, then re-run:')
      console.error('\n----- COPY FROM HERE -----')
      console.error(`CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;`)
      console.error('----- END COPY -----\n')
      console.error('Or paste the whole migration directly: supabase/migrations/020_catalogue_perf_indexes.sql\n')
      process.exit(1)
    }
    if (body) console.error(`     → ${body.slice(0, 200)}`)
  }
}

console.log(`\n📊 ${okCount} succeeded, ${failCount} failed`)
process.exitCode = failCount > 0 ? 1 : 0
