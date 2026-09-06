// Rapatrie les photos scrapees (annonce_photos.url_source, hotlink coinafrique)
// dans le bucket Storage `annonces-photos`, puis renseigne chemin_storage /
// url_publique / octets / rapatriee_le.
// Idempotent : ne traite que les lignes chemin_storage IS NULL, avance par curseur
// sur l'id (une photo definitivement morte ne bloque donc pas les suivantes).
//   node scripts/rapatrier-photos.mjs [--limit=50] [--selftest]

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'annonces-photos'
const CONCURRENCE = 8
const MAX_OCTETS = 10 * 1024 * 1024 // limite du bucket

/** MIME d'apres la signature : coinafrique sert tout en binary/octet-stream. */
function mimeDe(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ['image/jpeg', 'jpg']
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ['image/png', 'png']
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')
    return ['image/webp', 'webp']
  return null // le bucket n'accepte que jpeg/png/webp : inutile de tenter l'upload
}

if (process.argv.includes('--selftest')) {
  const a = (c, m) => { if (!c) { console.error('FAIL:', m); process.exit(1) } }
  a(mimeDe(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))[1] === 'jpg', 'jpeg')
  a(mimeDe(Buffer.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]))[1] === 'png', 'png')
  a(mimeDe(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]))[1] === 'webp', 'webp')
  a(mimeDe(Buffer.from('<!DOCTYPE html><html>')) === null, 'une page HTML doit etre refusee')
  console.log('selftest ok'); process.exit(0)
}

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch {}
}
loadEnv(resolve(process.cwd(), 'apps/web/.env.local'))

const url = (process.env.SCRAPING_SUPABASE_URL || '').trim()
const key = (process.env.SCRAPING_SUPABASE_SERVICE_ROLE_KEY || '').trim()
if (!url || !key) {
  console.error('SCRAPING_SUPABASE_URL / SCRAPING_SUPABASE_SERVICE_ROLE_KEY manquantes (apps/web/.env.local)')
  process.exit(1)
}
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function rapatrier(p) {
  const r = await fetch(p.url_source, { signal: AbortSignal.timeout(30_000) })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.byteLength > MAX_OCTETS) throw new Error(`trop lourd (${buf.byteLength} o)`)
  const mime = mimeDe(buf)
  if (!mime) throw new Error('contenu non-image')

  const chemin = `${p.annonce_id}/${p.position ?? p.id}.${mime[1]}`
  const { error: eUp } = await sb.storage.from(BUCKET)
    .upload(chemin, buf, { contentType: mime[0], upsert: true })
  if (eUp) throw eUp

  const { publicUrl } = sb.storage.from(BUCKET).getPublicUrl(chemin).data
  const { error: eDb } = await sb.from('annonce_photos').update({
    chemin_storage: chemin,
    url_publique: publicUrl,
    octets: buf.byteLength,
    rapatriee_le: new Date().toISOString(),
  }).eq('id', p.id)
  if (eDb) throw eDb
}

const limite = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1]) || Infinity
let curseur = 0, vues = 0, ok = 0, echecs = 0, octets = 0
const erreurs = new Map()

while (vues < limite) {
  const { data: lot, error } = await sb.from('annonce_photos')
    .select('id, annonce_id, position, url_source')
    .is('chemin_storage', null).gt('id', curseur)
    .order('id').limit(Math.min(200, limite - vues))
  if (error) throw error
  if (!lot?.length) break
  curseur = lot[lot.length - 1].id
  vues += lot.length

  for (let i = 0; i < lot.length; i += CONCURRENCE) {
    const paquet = lot.slice(i, i + CONCURRENCE)
    const res = await Promise.allSettled(paquet.map(async (p) => {
      try { await rapatrier(p) } catch (e) {
        await new Promise((r) => setTimeout(r, 500)) // un seul retry : reseau capricieux
        await rapatrier(p)
      }
      return p
    }))
    for (const [j, r] of res.entries()) {
      if (r.status === 'fulfilled') ok++
      else { echecs++; const m = String(r.reason?.message || r.reason); erreurs.set(m, (erreurs.get(m) || 0) + 1) }
    }
  }
  process.stdout.write(`\r${ok} rapatriees / ${vues} vues — ${echecs} echecs`)
}

console.log(`\n\nTermine : ${ok} photos dans ${BUCKET}, ${echecs} echecs.`)
for (const [m, n] of [...erreurs].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${n}x  ${m}`)
