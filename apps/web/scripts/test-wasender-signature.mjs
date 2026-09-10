import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

// Simulate the value copied from an env export with surrounding quotes.
process.env.WASSENDER_WEBHOOK_SECRET = '"test-webhook-secret"'

const { verifyWasenderSignature } = await import('../lib/wasender.ts')
const payload = JSON.stringify({ event: 'messages.upsert', data: { id: 'message-1' } })

assert.equal(verifyWasenderSignature(payload, 'test-webhook-secret'), true)
assert.equal(verifyWasenderSignature(payload, '  test-webhook-secret  '), true)

const hmac = createHmac('sha256', 'test-webhook-secret').update(payload).digest('hex')
assert.equal(verifyWasenderSignature(payload, hmac), true)
assert.equal(verifyWasenderSignature(payload, `sha256=${hmac}`), true)
assert.equal(verifyWasenderSignature(payload, 'wrong-secret'), false)

console.log('wasender signature verification: ok')
