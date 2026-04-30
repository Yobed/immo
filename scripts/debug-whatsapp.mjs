#!/usr/bin/env node
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

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const WASSENDER_KEY = (process.env.WASSENDER_API_KEY || '').trim()
const ADMIN_NUMBERS = (process.env.ADMIN_WHATSAPP_NUMBERS || '+2250789263373,+2250778311541')
  .split(',').map(s => s.trim()).filter(Boolean)

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('═══════════════════════════════════════════')
console.log('🔍 DIAGNOSTIC WHATSAPP IMMO CI')
console.log('═══════════════════════════════════════════')

// 1. Statut connexion Wasender
console.log('\n[1] Statut session Wasender')
try {
  const r = await fetch('https://www.wasenderapi.com/api/status', {
    headers: { Authorization: `Bearer ${WASSENDER_KEY}`, Accept: 'application/json' }
  })
  const data = await r.json()
  console.log(`    HTTP ${r.status}:`, JSON.stringify(data, null, 2))
} catch (e) {
  console.log('    ❌ Erreur:', e.message)
}

// 2. Test envoi direct au admin
console.log('\n[2] Test envoi direct WhatsApp → ' + ADMIN_NUMBERS[0])
try {
  const r = await fetch('https://www.wasenderapi.com/api/send-message', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WASSENDER_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      to: ADMIN_NUMBERS[0],
      text: '🔧 Test diagnostic Immo CI — si tu reçois ce message, Wasender fonctionne ✅'
    })
  })
  const data = await r.json()
  console.log(`    HTTP ${r.status}:`, JSON.stringify(data, null, 2))
} catch (e) {
  console.log('    ❌ Erreur:', e.message)
}

// 3. Dernières notifications WhatsApp en base
console.log('\n[3] Dernières notifications WhatsApp en base')
const { data: notifs } = await supabase
  .from('whatsapp_notifications')
  .select('id, to_phone, recipient_role, template, status, error_message, sent_at, created_at, related_type, related_id')
  .order('created_at', { ascending: false })
  .limit(10)

if (!notifs || notifs.length === 0) {
  console.log('    ⚠️  Aucune notif enregistrée en base')
} else {
  for (const n of notifs) {
    const dt = new Date(n.created_at).toLocaleString('fr-FR')
    console.log(`    [${dt}] ${n.recipient_role} ${n.to_phone} ${n.template} → ${n.status}`)
    if (n.error_message) console.log(`         ❌ ${n.error_message}`)
  }
}

// 4. Dernières visites créées
console.log('\n[4] Dernières visites créées')
const { data: visites } = await supabase
  .from('visites')
  .select('id, source, statut, admin_validation_status, admin_notified_at, created_at, client_phone, locataire_id')
  .order('created_at', { ascending: false })
  .limit(5)

if (!visites || visites.length === 0) {
  console.log('    ⚠️  Aucune visite en base')
} else {
  for (const v of visites) {
    const dt = new Date(v.created_at).toLocaleString('fr-FR')
    console.log(`    [${dt}] ${v.id.slice(0,8)} src=${v.source} statut=${v.statut} admin=${v.admin_validation_status} notified=${v.admin_notified_at ? '✅' : '❌'}`)
  }
}

console.log('\n═══════════════════════════════════════════')
