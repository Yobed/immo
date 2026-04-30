#!/usr/bin/env node
/**
 * Script de promotion admin — utilise la service_role key pour bypass RLS.
 * À lancer depuis la racine du repo : node scripts/setup-admins.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Charger .env.local manuellement (pas de dépendance dotenv)
function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?$/)
      if (m && !process.env[m[1]]) {
        // Strip surrounding quotes AND literal \r\n suffixes inserted by Vercel CLI
        let val = m[2].trim()
        val = val.replace(/(\\r\\n|\\n|\\r)+$/g, '')
        process.env[m[1]] = val.trim()
      }
    }
  } catch {
    // ignore
  }
}

loadEnv(resolve(process.cwd(), 'apps/web/.env.local'))
loadEnv(resolve(process.cwd(), '.env.local'))

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const ADMIN_NUMBERS = (process.env.ADMIN_WHATSAPP_NUMBERS || '+2250789263373,+2250778311541')
  .split(',').map(s => s.trim()).filter(Boolean)

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log(`🔗 Supabase: ${SUPABASE_URL}`)
console.log(`📱 Admins: ${ADMIN_NUMBERS.join(', ')}`)

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 1. Vérifier les colonnes admin existent (sanity check sur la migration 013)
console.log('\n🔎 Vérification migration 013...')
const { data: visiteCol, error: colErr } = await supabase
  .from('visites')
  .select('admin_validation_status')
  .limit(1)

if (colErr && colErr.message.includes('admin_validation_status')) {
  console.error('❌ Migration 013 NON appliquée — colonne admin_validation_status manquante')
  console.error('   → Exécute supabase/migrations/013_admin_validation.sql dans le SQL Editor')
  process.exit(1)
}
console.log('✅ Migration 013 OK')

// 2. Vérifier table whatsapp_notifications
const { error: notifErr } = await supabase
  .from('whatsapp_notifications')
  .select('id')
  .limit(1)

if (notifErr && /does not exist|relation/.test(notifErr.message)) {
  console.error('❌ Table whatsapp_notifications manquante')
  process.exit(1)
}
console.log('✅ Table whatsapp_notifications OK')

// 3. Lister les profils existants pour les numéros admin
console.log('\n🔎 Recherche des profils admin...')
const variants = []
for (const n of ADMIN_NUMBERS) {
  const digits = n.replace(/\D/g, '')
  const last10 = digits.slice(-10)
  variants.push(n, digits, `+${digits}`, last10)
}

const { data: profiles, error: profErr } = await supabase
  .from('profiles')
  .select('id, full_name, email, phone, role')
  .or(variants.map(v => `phone.ilike.%${v.replace(/[%]/g, '')}%`).join(','))

if (profErr) {
  console.error('❌ Erreur lecture profiles:', profErr.message)
  process.exit(1)
}

// Filtrer côté client pour matcher les vrais derniers chiffres
const targets = (profiles || []).filter(p => {
  if (!p.phone) return false
  const profileDigits = p.phone.replace(/\D/g, '')
  return ADMIN_NUMBERS.some(n => {
    const adminDigits = n.replace(/\D/g, '')
    return profileDigits.endsWith(adminDigits.slice(-9)) ||
           profileDigits.endsWith(adminDigits.slice(-10))
  })
})

console.log(`📋 ${targets.length} profil(s) trouvé(s) pour ces numéros :`)
for (const p of targets) {
  console.log(`   - ${p.full_name || '(sans nom)'} · ${p.phone} · role=${p.role}`)
}

if (targets.length === 0) {
  console.log('\n⚠️  Aucun compte trouvé avec ces numéros.')
  console.log('   → Inscrivez-vous d\'abord sur https://immo-sigma.vercel.app/inscription')
  console.log('   → Puis relancez ce script')
  process.exit(0)
}

// 4. Promouvoir en admin
console.log('\n⬆️  Promotion en admin...')
const ids = targets.map(p => p.id)
const { data: updated, error: updErr } = await supabase
  .from('profiles')
  .update({ role: 'admin' })
  .in('id', ids)
  .select('id, full_name, phone, role')

if (updErr) {
  console.error('❌ Erreur update:', updErr.message)
  process.exit(1)
}

console.log(`✅ ${updated.length} profil(s) promu(s) en admin :`)
for (const p of updated) {
  console.log(`   - ${p.full_name || '(sans nom)'} · ${p.phone} · role=${p.role}`)
}

// 5. Liste finale des admins
const { data: allAdmins } = await supabase
  .from('profiles')
  .select('id, full_name, phone, role')
  .eq('role', 'admin')

console.log(`\n📊 Total admins en base : ${allAdmins?.length ?? 0}`)
for (const p of (allAdmins || [])) {
  console.log(`   - ${p.full_name || '(sans nom)'} · ${p.phone}`)
}

console.log('\n✅ Configuration admin terminée.')
