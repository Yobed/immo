import { chatImmobilier } from '../lib/ai.ts'
import { getAIBienContext } from '../lib/ai/tools.ts'
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

async function test() {
  console.log('Query:', messages[0].content)
  const context = await getAIBienContext(messages[0].content)
  console.log('\n--- CONTEXTE GENERÉ ---')
  console.log(context)
  console.log('-----------------------\n')

  const reply = await chatImmobilier(messages, context)
  console.log('--- REPONSE DU BOT ---')
  console.log(reply)
}

test().catch(console.error)
