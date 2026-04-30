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

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/promote-admin.mjs <email>')
  process.exit(1)
}

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const s = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: before } = await s
  .from('profiles')
  .select('id, full_name, email, phone, role')
  .ilike('email', email)
  .single()

if (!before) {
  console.error(`❌ Aucun profil avec email ${email}`)
  process.exit(1)
}

console.log('📋 Avant :')
console.log(`   email=${before.email} role=${before.role} phone=${before.phone || '(vide)'}`)

const { data: after, error } = await s
  .from('profiles')
  .update({ role: 'admin' })
  .eq('id', before.id)
  .select('id, email, role')
  .single()

if (error) {
  console.error('❌', error.message)
  process.exit(1)
}

console.log('\n✅ Promu admin :')
console.log(`   email=${after.email} role=${after.role}`)
