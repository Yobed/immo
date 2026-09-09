import assert from 'node:assert/strict'
import fs from 'node:fs'

const root = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/^\//, '').replaceAll('/', '\\')
const read = (file) => fs.readFileSync(`${root}${file}`, 'utf8')
const webhook = read('apps/web/app/api/whatsapp/webhook/route.ts')
const prospectPage = read('apps/web/app/admin/prospects/[id]/page.tsx')
const migrationPath = `${root}supabase\\migrations\\035_whatsapp_human_traceability.sql`
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : ''
const authMigrationPath = `${root}supabase\\migrations\\036_whatsapp_human_traceability_auth.sql`
const authMigration = fs.existsSync(authMigrationPath) ? fs.readFileSync(authMigrationPath, 'utf8') : ''

assert.match(webhook, /direction:\s*'outbound'/, 'human outbound message must be persisted')
assert.match(webhook, /actor_type:\s*'commercial'/, 'human outbound message must identify the commercial actor type')
assert.match(webhook, /crm_record_human_whatsapp_reply/, 'human reply must be linked to the CRM timeline')
assert.match(webhook, /HUMAN_TAKEOVER/, 'human takeover mute must remain active')
assert.match(prospectPage, /metadata/, 'prospect conversation must read message metadata')
assert.match(prospectPage, /Commercial/, 'prospect conversation must label commercial messages')
assert.match(prospectPage, /human_reply/, 'CRM timeline must expose human replies')
assert.match(migration, /crm_record_human_whatsapp_reply/, 'human reply RPC is missing')
assert.match(migration, /human_reply/, 'human reply event type is missing')
assert.match(authMigration, /request\.jwt\.claims/, 'service-role JWT claims must be checked')

console.log('Human WhatsApp traceability contract: OK')
