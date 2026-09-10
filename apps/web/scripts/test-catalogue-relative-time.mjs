import assert from 'node:assert/strict'

const { formatRelativeTime, isRecentTimestamp } = await import('../lib/catalogue/relative-time.ts')

const now = Date.parse('2026-09-10T20:00:00.000Z')
assert.equal(formatRelativeTime('2026-09-10T19:59:30.000Z', now), "à l'instant")
assert.equal(formatRelativeTime('2026-09-10T18:45:00.000Z', now), '1 h')
assert.equal(formatRelativeTime('2026-09-10T08:00:00.000Z', now), '12 h')
assert.equal(formatRelativeTime('2026-09-09T20:00:00.000Z', now), '1 j')
assert.equal(isRecentTimestamp('2026-09-10T08:00:00.000Z', now), true)
assert.equal(isRecentTimestamp('2026-09-09T18:00:00.000Z', now), false)
assert.equal(isRecentTimestamp(null, now), false)

console.log('Catalogue relative time tests passed')
