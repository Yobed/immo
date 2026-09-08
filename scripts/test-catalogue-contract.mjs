import assert from 'node:assert/strict'

const base = (process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const list = await fetch(`${base}/api/mobile/annonces?limit=2`)
assert.equal(list.status, 200)
const payload = await list.json()
assert.ok(Number.isInteger(payload.total) && payload.total >= 0)
assert.ok(Array.isArray(payload.items))
for (const item of payload.items) {
  assert.equal(item.source, 'web')
  assert.ok(item.reference && item.url && item.prix_label)
  assert.ok(item.photo_principale)
}

if (payload.items[0]) {
  const detail = await fetch(`${base}/api/mobile/annonces/${encodeURIComponent(payload.items[0].id)}?source=web`)
  assert.equal(detail.status, 200)
  const row = await detail.json()
  assert.equal(row.reference, payload.items[0].reference)
  assert.ok(Array.isArray(row.photos) && row.photos.length > 0)
}
console.log(`Catalogue contract: ${payload.items.length} items, total=${payload.total}`)
