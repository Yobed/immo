import assert from 'node:assert/strict'

const base = (process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const get = async (path) => {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' })
  const body = await response.text()
  return { response, body, json: (() => { try { return JSON.parse(body) } catch { return null } })() }
}

const health = await get('/api/health')
assert.ok([200, 503].includes(health.response.status), `health returned ${health.response.status}`)
assert.ok(health.json && ['ok', 'degraded'].includes(health.json.status), 'health contract is invalid')
assert.equal(Object.prototype.hasOwnProperty.call(health.json, 'error'), false, 'health must not expose provider errors')

const catalogue = await get('/api/mobile/annonces?limit=1')
assert.equal(catalogue.response.status, 200)
assert.ok(Array.isArray(catalogue.json?.items), 'catalogue items missing')
assert.ok(catalogue.json?.items[0]?.photo_principale, 'catalogue item has no public photo')

const support = await get('/support')
assert.equal(support.response.status, 200)
for (const header of ['x-content-type-options', 'referrer-policy', 'content-security-policy']) {
  assert.ok(support.response.headers.get(header), `missing security header: ${header}`)
}

console.log(`Production surfaces: ${base} health=${health.json.status}, catalogue=${catalogue.json.total}`)
