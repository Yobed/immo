import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const read = (file) => readFile(path.join(root, file), 'utf8')

const kyc = await read('apps/web/app/api/kyc/route.ts')
assert.match(kyc, /requireAdmin|ensureAdmin/, 'KYC PATCH must require an admin session')
assert.match(kyc, /SUPABASE_SERVICE_ROLE_KEY|CRON_SECRET/, 'KYC PATCH must support an internal secret')

const broadcast = await read('apps/web/app/api/biens/[id]/broadcast/route.ts')
assert.match(broadcast, /requireAdmin|ensureAdmin/, 'broadcast must require an admin session')
assert.match(broadcast, /result\.success/, 'broadcast must count Wasender success explicitly')

const quittanceWebhook = await read('apps/web/app/api/quittances/webhook/route.ts')
assert.match(quittanceWebhook, /CRON_SECRET|verify.*signature/i, 'quittance webhook must authenticate its caller')
assert.match(quittanceWebhook, /from\(['"]quittances['"]\)/, 'quittance webhook must load the canonical quittance')

const whatsapp = await read('apps/web/app/api/whatsapp/webhook/route.ts')
assert.match(whatsapp, /!signature/, 'WhatsApp webhook must reject a missing signature')

const payment = await read('apps/web/app/api/paiements/initier/route.ts')
assert.match(payment, /payeur_id/, 'payment route must use the current paiements schema')
assert.match(payment, /montant_total_fcfa/, 'payment amount must use the current paiements schema')
assert.match(payment, /admin_validation_status/, 'payment must verify the reservation workflow state')
assert.match(payment, /payeur_id.*user\.id|user\.id.*payeur_id/s, 'payment must bind the payer to the authenticated user')
assert.match(payment, /montant.*montant_total_fcfa|montant_total_fcfa.*montant/s, 'payment must validate the requested amount')

const contract = await read('apps/web/app/api/contrats/generer/route.ts')
assert.match(contract, /requireAdmin|x-service-key|CRON_SECRET/, 'contract generation must be protected')
assert.doesNotMatch(contract, /nom_complet|telephone/, 'contract generation must use current profile field names')
assert.match(contract, /proprietaire_id/, 'contract generation must use the current contract owner column')
assert.doesNotMatch(contract, /bailleur_id|preneur_id|brouillon/, 'contract generation must not write legacy schema values')

const contractDownload = await read('apps/web/app/api/contrats/[id]/route.ts')
assert.match(contractDownload, /proprietaire_id|locataire_id/, 'contract download must use current profile columns')
assert.doesNotMatch(contractDownload, /bailleur_id|preneur_id/, 'contract download must not query legacy columns')

console.log('Hardening contract: security boundaries and payment/schema guards are present.')
