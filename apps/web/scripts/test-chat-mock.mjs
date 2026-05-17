import { chatImmobilier } from '../lib/ai.ts'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
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

const messages = [
  { role: 'user', content: 'Je cherche une villa à Cocody pour 90 millions' }
]

const context = `2 bien(s) trouvé(s) (max 5)
Sources interrogées : Catalogue BOGBE'S (2) + Offres Flash WhatsApp (0)

CRITÈRES STRICTS APPLIQUÉS :
- Zone : Cocody
- Type : villa
- Budget client : 90 000 000 FCFA (intervalle accepté ±15% : 76 500 000 FCFA – 103 500 000 FCFA)

--- BIEN 1 [CATALOGUE BOGBE'S] ---
ID: e62a123-abc-123
Source: bogbes
Badges: ✓ VÉRIFIÉ | ★ Top qualité
Titre: Villa 4 chambres Cocody Angré
Type: villa
Localisation: Cocody / Angré 8e Tranche
Prix: 95 000 000 FCFA (vente)
Pièces/chambres: 5
Surface: 300 m²
Description: Belle villa neuve 4 chambres autonomes, grand salon, cuisine européenne.
Photos disponibles (1): https://res.cloudinary.com/demo/image/upload/v1/villa.jpg
Lien fiche: https://bogbes-groupe.vercel.app/biens/e62a123-abc-123
CTA visite/contact: https://bogbes-groupe.vercel.app/biens/e62a123-abc-123#reserver
`

async function test() {
  console.log('Query:', messages[0].content)
  const reply = await chatImmobilier(messages, context)
  console.log('--- REPONSE DU BOT ---')
  console.log(reply)
}

test().catch(console.error)
