import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { shouldProcessWasenderMessageEvent } from '../lib/wasender-event-policy.ts'

const routeSource = await readFile(
  resolve(process.cwd(), 'app/api/whatsapp/webhook/route.ts'),
  'utf8',
)

assert.equal(shouldProcessWasenderMessageEvent('messages.received', false), true)
assert.equal(shouldProcessWasenderMessageEvent('messages-group.received', false), true)
assert.equal(shouldProcessWasenderMessageEvent('messages.upsert', true), true)

// Wasender delivers an incoming DM twice when both events are subscribed.
// Only messages.received owns inbound replies; upsert is reserved for human
// outbound messages so their manual responses remain traceable.
assert.equal(shouldProcessWasenderMessageEvent('messages.upsert', false), false)
assert.equal(shouldProcessWasenderMessageEvent('messages.received', true), false)
assert.equal(shouldProcessWasenderMessageEvent('messages-group.received', true), false)
assert.equal(shouldProcessWasenderMessageEvent('unknown_event', false), false)

assert.match(
  routeSource,
  /shouldProcessWasenderMessageEvent\(normalizedEvent, msg\.key\?\.fromMe\)/,
  'The webhook route must enforce the event ownership policy',
)

console.log('Wasender event ownership policy: OK')
