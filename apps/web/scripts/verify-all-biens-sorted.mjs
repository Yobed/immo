import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, '../.env.local'), 'utf8')
    raw.split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z_0-9]*)="?([^"\r\n]*)"?$/)
      if (m) process.env[m[1]] = m[2].trim()
    })
  } catch (err) {}
}
loadEnvLocal()

const MAIN_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const MAIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const FRESH_URL = 'https://fzccugmyoglemjwidqrl.supabase.co'
const FRESH_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y2N1Z215b2dsZW1qd2lkcXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDI0MjYsImV4cCI6MjEwNTkxODQyNn0.90URR1TCwwdnokdUDrQ1aRHYVfvHa__v0tejFYHADT0'

const ANNONCES_URL = process.env.SCRAPING_SUPABASE_URL || 'https://rvehvcovkrcykobvenbg.supabase.co'
const ANNONCES_KEY = process.env.SCRAPING_SUPABASE_SERVICE_ROLE_KEY

function toTimestamp(dateIso) {
  if (!dateIso) return 0
  const t = new Date(dateIso).getTime()
  return isNaN(t) ? 0 : t
}

async function run() {
  console.log('=== VÉRIFICATION DU CHARGEMENT ET DU TRI CHRONOLOGIQUE DES BIENS ===\n')

  const sbMain = createClient(MAIN_URL, MAIN_KEY)
  const sbFresh = createClient(FRESH_URL, FRESH_ANON)
  const sbWeb = createClient(ANNONCES_URL, ANNONCES_KEY)

  // 1. Fetch BOGBE'S
  const { data: bogbesData, error: errB } = await sbMain
    .from('biens')
    .select('id, titre, created_at, commune, type_bien, is_verifie, statut')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(10)

  if (errB) throw errB
  console.log(`[1] BOGBE'S vérifiés/publiés : ${bogbesData.length} biens récupérés`)
  console.log(`    Plus récent : ${bogbesData[0]?.created_at} (${bogbesData[0]?.titre})`)
  console.log(`    Plus ancien échantillon : ${bogbesData[bogbesData.length - 1]?.created_at}\n`)

  // 2. Fetch Locaux WhatsApp
  const { data: flashData, error: errF } = await sbFresh
    .from('locaux')
    .select('id, ref_bien, date_publication, created_at, commune, type_de_bien, status')
    .not('status', 'eq', 'inactive')
    .not('is_duplicate', 'is', true)
    .order('date_publication', { ascending: false })
    .limit(10)

  if (errF) throw errF
  console.log(`[2] Offres Flash WhatsApp : ${flashData.length} biens récupérés`)
  console.log(`    Plus récent : ${flashData[0]?.date_publication} (${flashData[0]?.ref_bien})`)
  console.log(`    Plus ancien échantillon : ${flashData[flashData.length - 1]?.date_publication}\n`)

  // 3. Fetch Web
  const { data: webData, error: errW } = await sbWeb
    .from('v_annonces')
    .select('id, titre, vu_le, commune, type_bien')
    .order('vu_le', { ascending: false })
    .limit(10)

  if (errW) throw errW
  console.log(`[3] Annonces Web scrapées : ${webData.length} biens récupérés`)
  console.log(`    Plus récent : ${webData[0]?.vu_le} (${webData[0]?.titre})`)
  console.log(`    Plus ancien échantillon : ${webData[webData.length - 1]?.vu_le}\n`)

  // 4. Test du tri consolidé unifié
  const allMerged = [
    ...bogbesData.map(b => ({
      source: 'bogbes',
      id: b.id,
      titre: b.titre,
      date: b.created_at,
      commune: b.commune,
    })),
    ...flashData.map(f => ({
      source: 'flash',
      id: f.id,
      titre: f.ref_bien || f.type_de_bien,
      date: f.date_publication || f.created_at,
      commune: f.commune,
    })),
    ...webData.map(w => ({
      source: 'web',
      id: w.id,
      titre: w.titre,
      date: w.vu_le,
      commune: w.commune,
    })),
  ]

  // Tri chronologique strict
  allMerged.sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))

  console.log('--- 15 PREMIERS BIENS APRÈS FUSION ET TRI CHRONOLOGIQUE STRICT ---')
  allMerged.slice(0, 15).forEach((b, i) => {
    const d = new Date(b.date).toLocaleString('fr-FR', { timeZone: 'UTC' })
    console.log(`  ${(i + 1).toString().padStart(2, ' ')}. [${b.source.toUpperCase().padEnd(6)}] ${d} (${b.date}) | ${b.commune || 'N/A'} | ${b.titre?.slice(0, 40)}`)
  })

  // Vérification de la monotonie décroissante
  let isStrictlySorted = true
  for (let i = 0; i < allMerged.length - 1; i++) {
    const tA = toTimestamp(allMerged[i].date)
    const tB = toTimestamp(allMerged[i + 1].date)
    if (tA < tB) {
      isStrictlySorted = false
      console.error(`ANOMALIE: item ${i} (${allMerged[i].date}) est antérieur à item ${i + 1} (${allMerged[i + 1].date})`)
    }
  }

  console.log(`\n=> RÉSULTAT DU TRI CHRONOLOGIQUE GLOBAL : ${isStrictlySorted ? 'PARFAIT (100% chronologique décroissant) ✅' : 'ÉCHEC ❌'}`)
}

run().catch(console.error)
