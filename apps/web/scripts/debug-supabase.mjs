// scripts/debug-supabase.mjs
// Lance avec : node scripts/debug-supabase.mjs
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Lire .env.local manuellement
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, '../.env.local'), 'utf8')
    raw.split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z_0-9]*)="?([^"]*)"?$/)
      if (m) process.env[m[1]] = m[2].trim()
    })
  } catch {}
}
loadEnvLocal()

// ---- BASE PRINCIPALE immo app ----
const MAIN_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const MAIN_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ---- BASE LOCAUX (offres flash) ----
const LOCAUX_URL = 'https://mignebexvzrpfxgbhjuf.supabase.co'
const LOCAUX_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25lYmV4dnpycGZ4Z2JoanVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NjA5NzksImV4cCI6MjEwMDEzNjk3OX0.jiERuKejm7D96ILlnBfWQKcRnCLjVkKaxR-2Rz_hBek'

console.log('\n🔍 === DIAGNOSTIC BASES SUPABASE SAPPHIRE ===\n')
console.log('Main DB URL:', MAIN_URL)

async function checkMainDB() {
  console.log('\n--- 1. BASE PRINCIPALE (biens publiés) ---')
  const sb = createClient(MAIN_URL, MAIN_ANON)

  // Total biens
  const { count: total } = await sb.from('biens').select('*', { count: 'exact', head: true })
  console.log('Total biens (toutes statuts):', total)

  // Biens publiés
  const { count: publie } = await sb.from('biens').select('*', { count: 'exact', head: true }).eq('statut', 'publie')
  console.log('Biens statut=publie:', publie)

  // Tous les statuts distincts
  const { data: statuts } = await sb.from('biens').select('statut')
  const uniq = [...new Set((statuts || []).map(b => b.statut))]
  console.log('Statuts présents:', uniq)

  // Echantillon biens
  const { data: sample, error } = await sb
    .from('biens')
    .select('id, titre, commune, type_bien, statut, prix_mois_fcfa, prix_vente_fcfa')
    .limit(5)
  if (error) console.error('Erreur biens:', error.message)
  else {
    console.log('\nEchantillon biens:')
    sample?.forEach(b => console.log(` - [${b.statut}] ${b.type_bien} | ${b.commune} | ${b.titre?.slice(0,40)} | ${b.prix_mois_fcfa ?? b.prix_vente_fcfa} FCFA`))
  }

  // Cocody spécifiquement
  const { data: cocody } = await sb
    .from('biens')
    .select('id, titre, commune, type_bien, statut, prix_mois_fcfa')
    .ilike('commune', '%Cocody%')
    .limit(5)
  console.log('\nBiens Cocody:', cocody?.length ?? 0)
  cocody?.forEach(b => console.log(` - [${b.statut}] ${b.type_bien} | ${b.prix_mois_fcfa} FCFA | ${b.titre?.slice(0,40)}`))
}

async function checkLocauxDB() {
  console.log('\n--- 2. BASE LOCAUX (offres flash WhatsApp) ---')
  const sb = createClient(LOCAUX_URL, LOCAUX_ANON)

  const { count: total } = await sb.from('locaux').select('*', { count: 'exact', head: true })
  console.log('Total locaux:', total)

  const { count: actifs } = await sb.from('locaux').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_duplicate', false)
  console.log('Locaux actifs (non-dupliqu):', actifs)

  // Echantillon
  const { data: sample, error } = await sb
    .from('locaux')
    .select('id, ref_bien, type_de_bien, commune, prix, prix_normalise, status')
    .eq('status', 'active')
    .limit(5)
  if (error) console.error('Erreur locaux:', error.message)
  else {
    console.log('\nEchantillon locaux actifs:')
    sample?.forEach(b => console.log(` - ${b.ref_bien} | ${b.type_de_bien} | ${b.commune} | ${b.prix} | norm: ${b.prix_normalise}`))
  }

  // Cocody
  const { data: cocody } = await sb
    .from('locaux')
    .select('id, ref_bien, type_de_bien, commune, prix_normalise, status')
    .eq('status', 'active')
    .ilike('commune', '%Cocody%')
    .limit(5)
  console.log('\nLocaux Cocody actifs:', cocody?.length ?? 0)
  cocody?.forEach(b => console.log(` - ${b.ref_bien} | ${b.type_de_bien} | ${b.prix_normalise} FCFA`))
}

try {
  await checkMainDB()
  await checkLocauxDB()
  console.log('\n✅ Diagnostic terminé\n')
} catch (e) {
  console.error('Erreur globale:', e.message)
}
