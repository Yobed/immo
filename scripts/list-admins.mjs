import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?$/)
      if (m && !process.env[m[1]]) {
        let val = m[2].trim().replace(/(\\r\\n|\\n|\\r)+$/g, '')
        process.env[m[1]] = val.trim()
      }
    }
  } catch {}
}

loadEnv(resolve(process.cwd(), 'apps/web/.env.local'))

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const s = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: admins, error: e1 } = await s
  .from('profiles')
  .select('id, full_name, email, phone, role')
  .eq('role', 'admin')

console.log(`\nAdmins en base : ${admins?.length ?? 0}`)
for (const p of (admins || [])) {
  console.log(`  - email = ${p.email || '(vide)'}`)
  console.log(`    phone = ${p.phone || '(vide)'}`)
  console.log(`    name  = ${p.full_name || '(vide)'}`)
  console.log('')
}
if (e1) console.log('ERROR:', e1.message)

const { data: byPhone } = await s
  .from('profiles')
  .select('id, full_name, email, phone, role')
  .or('phone.like.%0789263373,phone.like.%0778311541')

console.log(`Profils via numéros 0789263373 / 0778311541 : ${byPhone?.length ?? 0}`)
for (const p of (byPhone || [])) {
  console.log(`  - email=${p.email || '(vide)'} phone=${p.phone} role=${p.role}`)
}
