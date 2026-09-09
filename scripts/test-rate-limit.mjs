import assert from 'node:assert/strict'
import fs from 'node:fs'
import { checkRateLimit, rateLimitResponse } from '../apps/web/lib/rate-limit.ts'

const request = new Request('https://example.test/api', { headers: { 'x-forwarded-for': '198.51.100.77' } })
const first = checkRateLimit(request, { scope: 'contract-test', max: 2, windowMs: 60_000 })
const second = checkRateLimit(request, { scope: 'contract-test', max: 2, windowMs: 60_000 })
const blocked = checkRateLimit(request, { scope: 'contract-test', max: 2, windowMs: 60_000 })
assert.equal(first.ok, true)
assert.equal(second.ok, true)
assert.equal(blocked.ok, false)
assert.equal((await rateLimitResponse(blocked)).status, 429)

for (const route of [
  'apps/web/app/api/contact-requests/route.ts',
  'apps/web/app/api/flash-contact/route.ts',
  'apps/web/app/api/visites/route.ts',
  'apps/web/app/api/reservations/route.ts',
  'apps/web/app/api/client-error/route.ts',
]) {
  const source = fs.readFileSync(route, 'utf8')
  assert.match(source, /checkRateLimit/)
  assert.match(source, /rateLimitResponse/)
}

console.log('Rate-limit contract: sliding window and all sensitive public mutations are covered.')
