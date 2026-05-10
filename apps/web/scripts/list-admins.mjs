import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)
const { data, error } = await supabase
  .from('profiles')
  .select('id, full_name, phone, role, created_at')
  .eq('role', 'admin')
  .order('created_at', { ascending: true })

if (error) {
  console.error('Query error:', error.message)
  process.exit(1)
}

const ids = (data ?? []).map((p) => p.id)
const { data: usersResp } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
const emailById = new Map((usersResp?.users ?? []).map((u) => [u.id, u.email]))

console.log(`\nAdmins (${data?.length ?? 0}) :\n`)
for (const p of data ?? []) {
  console.log(`- ${p.full_name ?? '(sans nom)'}`)
  console.log(`  email   : ${emailById.get(p.id) ?? '(introuvable)'}`)
  console.log(`  phone   : ${p.phone ?? '—'}`)
  console.log(`  id      : ${p.id}`)
  console.log(`  créé le : ${new Date(p.created_at).toLocaleString('fr-CI')}`)
  console.log('')
}
