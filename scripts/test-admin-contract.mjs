import assert from 'node:assert/strict'

const base = (process.env.TEST_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const noSecret = (text) => {
  assert.doesNotMatch(text, /service_role|SUPABASE_SERVICE|OPENROUTER_API_KEY|JWT_SIGNING_SECRET/i)
}

const exportResponse = await fetch(`${base}/api/admin/prospects/export`)
assert.ok([401, 403].includes(exportResponse.status), `export auth status: ${exportResponse.status}`)
noSecret(await exportResponse.text())

const id = '00000000-0000-0000-0000-000000000000'
for (const path of [`/api/admin/visites/${id}/validate`, `/api/admin/reservations/${id}/validate`, `/api/admin/contact-requests/${id}/validate`]) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'approve' }),
  })
  assert.ok([401, 403].includes(response.status), `${path} auth status: ${response.status}`)
  noSecret(await response.text())
}

const adminPage = await fetch(`${base}/admin/errors`, { redirect: 'manual' })
assert.ok([301, 302, 307, 308].includes(adminPage.status), `admin page status: ${adminPage.status}`)
assert.match(adminPage.headers.get('location') || '', /login/i)

console.log('Admin contract: anonymous export, validation mutations and admin pages are protected.')
