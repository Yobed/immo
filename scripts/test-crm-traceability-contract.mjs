import assert from 'node:assert/strict'
import fs from 'node:fs'

const root = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/^\//, '').replaceAll('/', '\\')
const read = (file) => fs.readFileSync(`${root}${file}`, 'utf8')

const contact = read('apps/web/app/api/contact-requests/route.ts')
const flash = read('apps/web/app/api/flash-contact/route.ts')
const visits = read('apps/web/app/api/visites/route.ts')
const reservations = read('apps/web/app/api/reservations/route.ts')
const capture = read('apps/web/lib/prospects/capture.ts')
const webhook = read('apps/web/app/api/whatsapp/webhook/route.ts')
const notifier = read('apps/web/lib/notifications/whatsapp-notifier.ts')
const migration = read('supabase/migrations/033_crm_intake_integrity.sql')

for (const [name, source] of Object.entries({ contact, flash, visits, reservations })) {
  assert.match(source, /canonicalPhone|ensureProspectForIntake/, `${name}: phone canonicalization is missing`)
  assert.match(source, /crm_link_intake|linkIntakeToProspect|ensureProspectForIntake/, `${name}: prospect linkage is missing`)
}

assert.match(capture, /Promise<string \| null>/, 'WhatsApp capture must return the prospect id')
assert.match(capture, /return linked\?\.id/, 'WhatsApp capture must expose its linked prospect')
assert.match(webhook, /linkIntakeToProspect/, 'WhatsApp visit must be linked to the CRM prospect')
assert.match(notifier, /failed:\s*number/, 'notification failures must be returned to callers')
assert.match(notifier, /bogbesgroup\.com/, 'notification links must never fall back to localhost')
assert.match(migration, /crm_link_intake/, 'atomic CRM intake linkage RPC is missing')
assert.match(migration, /UNIQUE INDEX.*intake_fingerprint|unique.*intake_fingerprint/is, 'intake deduplication constraint is missing')
assert.match(migration, /reservation.*overlap|advisory_xact_lock/is, 'reservation overlap protection is missing')
assert.match(migration, /proprietaire_id.*biens|bien.*proprietaire_id/is, 'property owner integrity trigger is missing')

console.log('CRM traceability contract: OK')
