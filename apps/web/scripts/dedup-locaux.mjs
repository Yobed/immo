import { createClient } from '@supabase/supabase-js'
import { argv, exit } from 'node:process'

const c = createClient(
  'https://udyfhzyvalansmhkynnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWZoenl2YWxhbnNtaGt5bm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE5NjM1NywiZXhwIjoyMDg2NzcyMzU3fQ.XToUDvcD-crlO0bA8HuJ5g1GjhqTl790fHG6H8bujAk',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const dryRun = argv.includes('--dry-run')

console.log(dryRun ? '🟡 DRY RUN (aucune écriture)' : '🔴 EXÉCUTION RÉELLE')

// Load all
let all = []
let from = 0
while (true) {
  const { data } = await c
    .from('locaux')
    .select('id,publication_id,message_initial,telephone_bien,prix,commune,quartier,type_de_bien,type_offre,date_publication,created_at')
    .eq('status', 'active')
    .eq('is_duplicate', false)
    .range(from, from + 999)
    .order('id')
  if (!data || data.length === 0) break
  all = all.concat(data)
  if (data.length < 1000) break
  from += 1000
}
console.log('Total chargé:', all.length)

const dateOf = (r) => new Date(r.date_publication || r.created_at || 0).getTime()

// Map id -> { keptBy?: 'pubId'|'msg'|'combo', duplicateOf?: number }
const toMark = new Map() // id -> { duplicate_of }

function processGroups(groups, label) {
  let count = 0
  for (const arr of Object.values(groups)) {
    if (arr.length < 2) continue
    arr.sort((a, b) => dateOf(b) - dateOf(a))
    const kept = arr[0]
    for (const r of arr.slice(1)) {
      if (!toMark.has(r.id)) {
        toMark.set(r.id, { duplicate_of: kept.id })
        count++
      }
    }
  }
  console.log(`  ${label}: ${count}`)
}

console.log('\n=== Identification ===')

// 1. Par publication_id
const byPub = {}
for (const r of all) {
  if (r.publication_id) (byPub[r.publication_id] = byPub[r.publication_id] || []).push(r)
}
processGroups(byPub, 'publication_id')

// 2. Par message_initial verbatim (uniquement sur ceux qui n'ont pas déjà été marqués)
const byMsg = {}
for (const r of all) {
  if (toMark.has(r.id)) continue
  if (!r.message_initial || r.message_initial.length < 30) continue
  const k = r.message_initial.trim().slice(0, 400)
  ;(byMsg[k] = byMsg[k] || []).push(r)
}
processGroups(byMsg, 'message_initial verbatim')

// 3. Combo phone+commune+type+offre+prix
const byCombo = {}
for (const r of all) {
  if (toMark.has(r.id)) continue
  if (!r.telephone_bien || !r.commune) continue
  const k = `${r.telephone_bien}|${(r.commune || '').toLowerCase()}|${(r.type_de_bien || '').toLowerCase()}|${(r.type_offre || '').toLowerCase()}|${r.prix || ''}`
  ;(byCombo[k] = byCombo[k] || []).push(r)
}
processGroups(byCombo, 'phone+commune+type+offre+prix')

console.log(`\nTotal à marquer: ${toMark.size} sur ${all.length} (${((toMark.size / all.length) * 100).toFixed(1)}%)`)

if (dryRun) {
  console.log('\n🟡 Dry-run terminé. Pour exécuter pour de vrai, retire --dry-run')
  exit(0)
}

console.log('\n=== Marquage ===')
const ids = [...toMark.keys()]
const BATCH = 100
let done = 0

for (let i = 0; i < ids.length; i += BATCH) {
  const batch = ids.slice(i, i + BATCH)
  // Pour pouvoir conserver duplicate_of par ligne, faire en update individuels groupés
  await Promise.all(batch.map(id => {
    const { duplicate_of } = toMark.get(id)
    return c.from('locaux').update({ is_duplicate: true, duplicate_of }).eq('id', id)
  }))
  done += batch.length
  if (done % 500 === 0 || done === ids.length) {
    console.log(`  ${done}/${ids.length}`)
  }
}

console.log('\n✅ Terminé')

// Vérif post-update
const { count: activeNow } = await c.from('locaux').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_duplicate', false)
console.log(`Lignes actives non-dup restantes: ${activeNow}`)
