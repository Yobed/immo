// scripts/firecrawl-scraper.mjs
// Pipeline de scraping immobilier intelligent propulsé par Firecrawl (https://github.com/firecrawl/firecrawl)
// Extrait des annonces immobilières structurées et les injecte directement dans `scrapping_immobilier` (Supabase).
//
// Usage:
//   node scripts/firecrawl-scraper.mjs --url="https://ci.coinafrique.com/annonce/..."
//   node scripts/firecrawl-scraper.mjs --crawl="https://ci.coinafrique.com/categorie/appartements" --limit=10

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

// 1. Chargement de l'environnement
function loadEnv(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\r\n]*)"?$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch {}
}
loadEnv(resolve(process.cwd(), 'apps/web/.env.local'))

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const FIRECRAWL_BASE_URL = (process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev/v1').replace(/\/+$/, '')

const SUPABASE_URL = process.env.SCRAPING_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SCRAPING_SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SCRAPING_SUPABASE_URL ou SCRAPING_SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const hasCloudinary = Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME)
if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// Fonctions utilitaires photos
const isRealPhoto = (u) => typeof u === 'string' && !/coinafrique-app-assets|categorie_illustrations|static\.coinafrique|Icon_|logo/i.test(u)
const toHdPhoto = (u) => u.replace(/\/thumb_/g, '/').replace(/thumb_/g, '')

// 2. Schéma d'extraction JSON structuré pour Firecrawl
const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    titre: { type: 'string', description: "Titre clair de l'annonce immobilière" },
    type_bien: {
      type: 'string',
      enum: ['studio', 'appartement', 'villa', 'maison', 'bureau', 'commerce', 'terrain', 'residence_meublee'],
      description: 'Catégorie normalisée du bien immobilier',
    },
    transaction: {
      type: 'string',
      enum: ['vente', 'location'],
      description: "Type de transaction : 'vente' ou 'location'",
    },
    commune: {
      type: 'string',
      description: "Commune en Côte d'Ivoire (ex: Cocody, Bingerville, Marcory, Yopougon, Assinie...)",
    },
    quartier: { type: 'string', description: 'Quartier ou précision locale (ex: Angré, Riviera Golf, Biétry...)' },
    prix_fcfa: { type: 'number', description: 'Montant numérique du prix en Francs CFA (XOF) sans lettres ni espaces' },
    periodicite: {
      type: 'string',
      enum: ['mois', 'jour', 'nuitée'],
      description: 'Périodicité pour la location (ex: mois ou nuitée)',
    },
    surface_m2: { type: 'number', description: 'Superficie en m² si mentionnée' },
    nb_pieces: { type: 'number', description: 'Nombre total de pièces' },
    nb_chambres: { type: 'number', description: 'Nombre de chambres' },
    contact: { type: 'string', description: 'Numéro de téléphone du démarcheur/propriétaire' },
    description: { type: 'string', description: "Description complète du bien et conditions d'accès" },
    photos: {
      type: 'array',
      items: { type: 'string' },
      description: "Liste des URLs directes absolues des photos du bien (pas les miniatures ni icônes)",
    },
  },
  required: ['titre', 'type_bien', 'commune', 'prix_fcfa', 'photos'],
}

// 3. Appel de l'API Firecrawl pour extraire les liens d'une page catégorie/catalogue
async function extractLinksWithFirecrawl(categoryUrl) {
  if (!FIRECRAWL_API_KEY && FIRECRAWL_BASE_URL.includes('api.firecrawl.dev')) {
    throw new Error("Clé API Firecrawl manquante ! Définissez FIRECRAWL_API_KEY dans votre fichier .env.local")
  }

  const endpoint = `${FIRECRAWL_BASE_URL}/scrape`
  const headers = { 'Content-Type': 'application/json' }
  if (FIRECRAWL_API_KEY) headers['Authorization'] = `Bearer ${FIRECRAWL_API_KEY}`

  let attempts = 0
  while (attempts < 3) {
    attempts++
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: categoryUrl,
        formats: ['links'],
      }),
    })

    if (res.status === 429) {
      console.warn(`   ⏳ Rate limit Firecrawl (429) sur ${categoryUrl}, attente de 16s...`)
      await new Promise(r => setTimeout(r, 16000))
      continue
    }

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Firecrawl HTTP ${res.status}: ${errText}`)
    }

    const json = await res.json()
    const rawLinks = json.data?.links || []

    // Filtre heuristique pour cibler les fiches individuelles de biens immobiliers
    const isAnnonceUrl = (u) => {
      if (typeof u !== 'string') return false
      return /\/annonce\/|\/biens\/|\/propriete\/|\/detail\//i.test(u)
    }

    const uniqueLinks = Array.from(new Set(rawLinks.filter(isAnnonceUrl)))
    return uniqueLinks
  }
  return []
}

// 4. Appel de l'API Firecrawl pour extraire les données d'une annonce
async function scrapeWithFirecrawl(targetUrl) {
  if (!FIRECRAWL_API_KEY && FIRECRAWL_BASE_URL.includes('api.firecrawl.dev')) {
    throw new Error("Clé API Firecrawl manquante ! Définissez FIRECRAWL_API_KEY dans votre fichier .env.local")
  }

  const endpoint = `${FIRECRAWL_BASE_URL}/scrape`
  const headers = {
    'Content-Type': 'application/json',
  }
  if (FIRECRAWL_API_KEY) {
    headers['Authorization'] = `Bearer ${FIRECRAWL_API_KEY}`
  }

  const body = {
    url: targetUrl,
    formats: ['json', 'html'],
    jsonOptions: {
      prompt: "Extrais fidèlement toutes les caractéristiques de l'annonce immobilière, le prix en FCFA, et récupère la liste complète des photos HD du bien.",
      schema: EXTRACTION_SCHEMA,
    },
  }

  let attempts = 0
  while (attempts < 3) {
    attempts++
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (res.status === 429) {
      console.warn('   ⏳ Rate limit Firecrawl temporaire (429), attente de 16s...')
      await new Promise(r => setTimeout(r, 16000))
      continue
    }

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Firecrawl HTTP ${res.status}: ${errText}`)
    }

    const json = await res.json()
    const extracted = json.data?.json || json.data || {}
    const rawHtml = json.data?.html || ''

    // Extraction de secours des photos HD depuis le HTML
    const validPhotos = (Array.isArray(extracted.photos) ? extracted.photos : []).filter(isRealPhoto)
    if (validPhotos.length === 0 && rawHtml) {
      const adId = targetUrl.match(/[-_](\d+)(?:\.html|\/)?$/)?.[1]
      const imgMatches = Array.from(rawHtml.matchAll(/https?:\/\/(?:images\.coinafrique\.com|coinafrique-ads-photos\.s3\.amazonaws\.com)\/(?:thumb_)?([^\s"'<>&]+)/gi))
      const adPhotos = []
      for (const m of imgMatches) {
        let fullUrl = m[0].replace(/&quot;.*$/, '').replace(/[\)"';]+$/, '').trim()
        if (!adId || fullUrl.includes(adId)) {
          const hdUrl = fullUrl.replace(/\/thumb_/g, '/').replace(/thumb_/g, '')
          if (!adPhotos.includes(hdUrl) && isRealPhoto(hdUrl)) {
            adPhotos.push(hdUrl)
          }
        }
      }
      if (adPhotos.length > 0) {
        extracted.photos = adPhotos
      }
    }

    return extracted
  }

  throw new Error('Firecrawl: échec après 3 réessais.')
}


// Vérifier si l'annonce existe déjà en base pour économiser les crédits Firecrawl
async function annonceExists(url) {
  const { data } = await sb.from('annonces').select('id').eq('url', url).maybeSingle()
  return Boolean(data?.id)
}

// 5. Insertion dans la base `scrapping_immobilier`
async function injectAnnonceIntoDatabase(data, sourceUrl) {
  if (!data || !data.titre) {
    console.warn('⚠️ Données extraites incomplètes :', data)
    return null
  }

  // Détermination de la source et listing_id
  const urlObj = new URL(sourceUrl)
  const sourceName = urlObj.hostname.replace('www.', '').split('.')[0]
  const idMatch = sourceUrl.match(/[-_](\d+)(?:\.html|\/)?$/)
  const listingId = idMatch ? idMatch[1] : Buffer.from(sourceUrl).toString('base64').slice(-16)

  console.log(`\n📦 Ingestion de l'annonce : "${data.titre}"`)
  console.log(`   📍 Commune : ${data.commune} | Type : ${data.type_bien} | Prix : ${data.prix_fcfa?.toLocaleString()} FCFA`)

  // Normalisation de la périodicité pour respecter la contrainte PostgreSQL (annonces_periodicite_check)
  let normalizedPeriodicite = null
  if (data.periodicite) {
    const p = String(data.periodicite).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if (p.includes('mois')) normalizedPeriodicite = 'mois'
    else if (p.includes('jour') || p.includes('nuit')) normalizedPeriodicite = 'jour'
    else if (p.includes('semaine')) normalizedPeriodicite = 'semaine'
    else if (p.includes('an')) normalizedPeriodicite = 'an'
  }

  // 1. Insertion ou mise à jour de l'annonce
  const { data: annonce, error: annError } = await sb
    .from('annonces')
    .upsert({
      source: sourceName,
      listing_id: listingId,
      url: sourceUrl,
      titre: data.titre,
      type_bien: data.type_bien,
      transaction: data.transaction || (normalizedPeriodicite ? 'location' : 'vente'),
      commune: data.commune,
      quartier: data.quartier || null,
      prix_fcfa: data.prix_fcfa,
      periodicite: normalizedPeriodicite,
      surface_m2: data.surface_m2 || null,
      nb_pieces: data.nb_pieces || null,
      nb_chambres: data.nb_chambres || null,
      contact: data.contact || null,
      description: data.description || null,
      nb_photos: data.photos?.length || 0,
      vu_le: new Date().toISOString(),
      maj_le: new Date().toISOString(),
      revu_le: new Date().toISOString(),
      actif: true,
    }, { onConflict: 'url' })
    .select('id')
    .single()

  if (annError) {
    console.error('❌ Erreur insertion annonce :', annError.message)
    return null
  }

  const annonceId = annonce.id
  console.log(`   ✅ Annonce insérée avec succès (ID: ${annonceId})`)

  // 2. Traitement des photos (ignorer les icônes et illustrations par défaut)
  const photos = (Array.isArray(data.photos) ? data.photos : []).filter(isRealPhoto).map(toHdPhoto)
  let pos = 0
  for (const photoUrl of photos.slice(0, 10)) {
    let publicUrl = photoUrl
    let storagePath = null

    // Pour la photo de couverture (position 0), on la pousse sur Cloudinary (coût 0€, ultra-rapide)
    if (pos === 0 && hasCloudinary) {
      try {
        const cRes = await cloudinary.uploader.upload(photoUrl, {
          folder: `annonces/${annonceId}`,
          public_id: `cover_${pos}`,
          format: 'webp',
          transformation: [{ width: 1400, height: 1050, crop: 'limit', quality: 'auto:good' }],
        })
        publicUrl = cRes.secure_url
        storagePath = cRes.public_id
      } catch (cErr) {
        console.warn(`   ⚠️ Cloudinary upload cover échoué : ${cErr.message}`)
      }
    }

    await sb.from('annonce_photos').upsert({
      annonce_id: annonceId,
      position: pos,
      url_source: photoUrl,
      url_publique: publicUrl,
      chemin_storage: storagePath,
      rapatriee_le: new Date().toISOString(),
    }, { onConflict: 'annonce_id,position' })

    pos++
  }

  console.log(`   📸 ${pos} photos associées à l'annonce.`)
  return annonceId
}

// 3b. Appel de l'API Firecrawl Map pour découvrir les liens d'un site complet (ex: IvoireDomi)
async function extractLinksWithMap(siteUrl, search = 'annonce') {
  if (!FIRECRAWL_API_KEY && FIRECRAWL_BASE_URL.includes('api.firecrawl.dev')) {
    throw new Error("Clé API Firecrawl manquante ! Définissez FIRECRAWL_API_KEY dans votre fichier .env.local")
  }

  const endpoint = `${FIRECRAWL_BASE_URL}/map`
  const headers = { 'Content-Type': 'application/json' }
  if (FIRECRAWL_API_KEY) headers['Authorization'] = `Bearer ${FIRECRAWL_API_KEY}`

  let attempts = 0
  while (attempts < 3) {
    attempts++
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: siteUrl, search }),
    })

    if (res.status === 429) {
      console.warn(`   ⏳ Rate limit Firecrawl (429) sur map ${siteUrl}, attente de 16s...`)
      await new Promise(r => setTimeout(r, 16000))
      continue
    }

    if (!res.ok) {
      console.warn(`⚠️ Firecrawl Map failed with HTTP ${res.status}`)
      return []
    }

    const json = await res.json()
    const rawLinks = json.links || []
    const isAnnonceUrl = (u) => typeof u === 'string' && /\/annonce\/[a-z0-9_-]+/i.test(u)
    return Array.from(new Set(rawLinks.filter(isAnnonceUrl)))
  }
  return []
}

// Portails et catégories immobilières multi-sources Côte d'Ivoire
const DEFAULT_SOURCES = [
  // 1. IvoireDomi (Portail d'agences agréées en Côte d'Ivoire - plus de 1300 annonces)
  { name: 'IvoireDomi (Annonces vérifiées)', url: 'https://ivoiredomi.ci', type: 'map', search: 'annonce' },
  // 2. CoinAfrique Côte d'Ivoire (Pages 1 à 5 - nouveautés récentes)
  { name: 'CoinAfrique - Appartements (P1)', url: 'https://ci.coinafrique.com/categorie/appartements' },
  { name: 'CoinAfrique - Appartements (P2)', url: 'https://ci.coinafrique.com/categorie/appartements?page=2' },
  { name: 'CoinAfrique - Appartements (P3)', url: 'https://ci.coinafrique.com/categorie/appartements?page=3' },
  { name: 'CoinAfrique - Appartements (P4)', url: 'https://ci.coinafrique.com/categorie/appartements?page=4' },
  { name: 'CoinAfrique - Appartements (P5)', url: 'https://ci.coinafrique.com/categorie/appartements?page=5' },
  { name: 'CoinAfrique - Villas & Maisons (P1)', url: 'https://ci.coinafrique.com/categorie/villas' },
  { name: 'CoinAfrique - Villas & Maisons (P2)', url: 'https://ci.coinafrique.com/categorie/villas?page=2' },
  { name: 'CoinAfrique - Villas & Maisons (P3)', url: 'https://ci.coinafrique.com/categorie/villas?page=3' },
  { name: 'CoinAfrique - Villas & Maisons (P4)', url: 'https://ci.coinafrique.com/categorie/villas?page=4' },
  { name: 'CoinAfrique - Villas & Maisons (P5)', url: 'https://ci.coinafrique.com/categorie/villas?page=5' },
  { name: 'CoinAfrique - Terrains (P1)', url: 'https://ci.coinafrique.com/categorie/terrains' },
  { name: 'CoinAfrique - Terrains (P2)', url: 'https://ci.coinafrique.com/categorie/terrains?page=2' },
  { name: 'CoinAfrique - Terrains (P3)', url: 'https://ci.coinafrique.com/categorie/terrains?page=3' },
  { name: 'CoinAfrique - Terrains (P4)', url: 'https://ci.coinafrique.com/categorie/terrains?page=4' },
  { name: 'CoinAfrique - Terrains (P5)', url: 'https://ci.coinafrique.com/categorie/terrains?page=5' },
  { name: 'CoinAfrique - Meublés (P1)', url: 'https://ci.coinafrique.com/categorie/appartements-meubles' },
  { name: 'CoinAfrique - Meublés (P2)', url: 'https://ci.coinafrique.com/categorie/appartements-meubles?page=2' },
  { name: 'CoinAfrique - Meublés (P3)', url: 'https://ci.coinafrique.com/categorie/appartements-meubles?page=3' },
  { name: 'CoinAfrique - Meublés (P4)', url: 'https://ci.coinafrique.com/categorie/appartements-meubles?page=4' },
  { name: 'CoinAfrique - Meublés (P5)', url: 'https://ci.coinafrique.com/categorie/appartements-meubles?page=5' },
]

// 6. Exécution CLI
async function main() {
  const urlArg = process.argv.find(a => a.startsWith('--url='))?.split('=')[1]
  const crawlArg = (process.argv.find(a => a.startsWith('--crawl=')) || process.argv.find(a => a.startsWith('--category=')))?.split('=')[1]
  const allArg = process.argv.includes('--all') || process.argv.includes('--daily')
  const targetArg = parseInt(process.argv.find(a => a.startsWith('--target='))?.split('=')[1] || process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '100', 10)
  const perCatArg = parseInt(process.argv.find(a => a.startsWith('--per-cat='))?.split('=')[1] || '0', 10)

  if (!urlArg && !crawlArg && !allArg) {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('🕷️  FIRECRAWL SCRAPER IMMOBILIER BOGBE\'S')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('Usage:')
    console.log('  1. Annonce unique :')
    console.log('     node.exe scripts/firecrawl-scraper.mjs --url="https://ci.coinafrique.com/annonce/..."')
    console.log('\n  2. Crawl d\'une catégorie spécifique :')
    console.log('     node.exe scripts/firecrawl-scraper.mjs --crawl="https://ci.coinafrique.com/categorie/appartements" --limit=20')
    console.log('\n  3. Tournée multi-portails & catégories (CoinAfrique, IvoireDomi...) :')
    console.log('     node.exe scripts/firecrawl-scraper.mjs --all --target=50')
    console.log('\nConfiguration requise dans apps/web/.env.local :')
    console.log('  FIRECRAWL_API_KEY=fc-... (ou FIRECRAWL_BASE_URL=http://localhost:3002/v1)')
    return
  }

  // Cas 1 : Annonce unique
  if (urlArg) {
    console.log(`🔍 Scraping ciblé d'une annonce : ${urlArg}`)
    try {
      const extractedData = await scrapeWithFirecrawl(urlArg)
      console.log('Données extraites par Firecrawl :', JSON.stringify(extractedData, null, 2))
      await injectAnnonceIntoDatabase(extractedData, urlArg)
      console.log('\n🎉 Pipeline terminé avec succès !')
    } catch (err) {
      console.error('❌ Erreur scraping Firecrawl :', err.message)
    }
    return
  }

  // Cas 2 : Catégorie unique
  if (crawlArg) {
    console.log(`🚀 Démarrage du crawl de catégorie : ${crawlArg}`)
    console.log(`🎯 Objectif max : ${targetArg} annonces`)

    try {
      const links = await extractLinksWithFirecrawl(crawlArg)
      console.log(`🔗 ${links.length} liens d'annonces trouvés sur la page.`)

      let processed = 0
      let skipped = 0

      for (const link of links) {
        if (processed >= targetArg) break

        const alreadyExists = await annonceExists(link)
        if (alreadyExists) {
          console.log(`⏩ Ignoré (déjà en base) : ${link}`)
          skipped++
          continue
        }

        console.log(`\n------------------------------------------------------------`)
        console.log(`📥 Traitement [${processed + 1}/${targetArg}] : ${link}`)
        try {
          const extractedData = await scrapeWithFirecrawl(link)
          await injectAnnonceIntoDatabase(extractedData, link)
          processed++
          await new Promise(r => setTimeout(r, 600)) // Pause anti rate-limit
        } catch (subErr) {
          console.error(`⚠️ Erreur sur ${link} : ${subErr.message}`)
        }
      }

      console.log('\n═══════════════════════════════════════════════════════════════')
      console.log(`🏁 Crawl terminé : ${processed} nouvelles annonces insérées, ${skipped} déjà présentes.`)
      console.log('═══════════════════════════════════════════════════════════════')
    } catch (err) {
      console.error('❌ Erreur lors du crawl :', err.message)
    }
    return
  }

  // Cas 3 : Tournée globale multi-sources (--all / --daily)
  if (allArg) {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`🌍 TOURNÉE MULTI-PORTAILS BOGBE'S (Objectif : ${targetArg} NOUVEAUX BIENS RÉCENTS)`)
    console.log('═══════════════════════════════════════════════════════════════')

    const quotaPerSource = perCatArg > 0 ? perCatArg : Math.max(10, Math.ceil(targetArg / DEFAULT_SOURCES.length))
    console.log(`📊 Répartition : jusqu'à ~${quotaPerSource} nouvelles annonces par source\n`)

    let totalNew = 0
    let totalSkipped = 0

    for (const src of DEFAULT_SOURCES) {
      if (totalNew >= targetArg) {
        console.log(`🎯 Objectif global de ${targetArg} nouveaux biens atteint !`)
        break
      }

      console.log(`\n📂 Source : ${src.name} (${src.url})`)
      try {
        let links = []
        if (src.type === 'map') {
          links = await extractLinksWithMap(src.url, src.search || 'annonce')
        } else {
          links = await extractLinksWithFirecrawl(src.url)
        }
        console.log(`   🔗 ${links.length} liens trouvés sur la source`)

        let srcNew = 0
        for (const link of links) {
          if (totalNew >= targetArg) break
          if (srcNew >= quotaPerSource) {
            console.log(`   ✅ Quota de la source ${src.name} atteint (${srcNew} biens).`)
            break
          }

          const alreadyExists = await annonceExists(link)
          if (alreadyExists) {
            totalSkipped++
            continue
          }

          console.log(`\n   📥 [${totalNew + 1}/${targetArg}] Scraping (${src.name}) : ${link}`)
          try {
            const extractedData = await scrapeWithFirecrawl(link)
            const id = await injectAnnonceIntoDatabase(extractedData, link)
            if (id) {
              srcNew++
              totalNew++
            }
            await new Promise(r => setTimeout(r, 1200))
          } catch (itemErr) {
            console.error(`   ⚠️ Erreur sur ${link} : ${itemErr.message}`)
          }
        }
      } catch (srcErr) {
        console.error(`   ❌ Erreur sur la source ${src.name} : ${srcErr.message}`)
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════')
    console.log(`🏁 BILAN DE LA TOURNÉE :`)
    console.log(`   ✨ Nouvelles annonces insérées : ${totalNew}`)
    console.log(`   ⏩ Annonces déjà en base ignorées (crédits préservés) : ${totalSkipped}`)
    console.log('═══════════════════════════════════════════════════════════════')
  }
}

main()
