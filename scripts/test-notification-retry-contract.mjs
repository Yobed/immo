import assert from 'node:assert/strict'
import fs from 'node:fs'

const root = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/^\//, '').replaceAll('/', '\\')
const read = (file) => fs.readFileSync(`${root}${file}`, 'utf8')

const migration = read('supabase/migrations/034_whatsapp_notification_outbox.sql')
const route = read('apps/web/app/api/cron/retry-whatsapp/route.ts')
const notifier = read('apps/web/lib/notifications/whatsapp-notifier.ts')

assert.match(migration, /message_body/i, 'failed notifications must retain their message body')
assert.match(migration, /next_retry_at/i, 'failed notifications need a retry schedule')
assert.match(route, /CRON_SECRET/, 'retry cron must be protected')
assert.match(route, /attempt_count/, 'retry cron must cap attempts')
assert.match(route, /wasenderSendMessage/, 'retry cron must resend through Wasender')
assert.match(notifier, /message_body/, 'notifier must persist retryable message bodies')

console.log('Notification retry contract: OK')
