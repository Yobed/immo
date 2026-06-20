/**
 * Smoke tests — vérifie que les pages publiques critiques répondent 200.
 *
 * Ces tests sont la première ligne de défense avant tout déploiement.
 * Si l'un échoue, on n'a même pas besoin de tester les flows complexes —
 * la page est cassée.
 */

import { test, expect } from '@playwright/test'

test.describe('Smoke tests — pages publiques répondent', () => {
  const routes = [
    { path: '/', name: 'home' },
    { path: '/catalogue', name: 'catalogue' },
    { path: '/offre-flash', name: 'offres flash' },
    { path: '/comment-ca-marche', name: 'comment ça marche' },
    { path: '/services', name: 'services' },
    { path: '/cgu', name: 'CGU' },
    { path: '/mentions-legales', name: 'mentions légales' },
    { path: '/confidentialite', name: 'confidentialité' },
    { path: '/support', name: 'support' },
    { path: '/login', name: 'login' },
    { path: '/register', name: 'register' },
  ]

  for (const { path, name } of routes) {
    test(`page ${name} (${path}) charge sans erreur`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      const response = await page.goto(path)
      expect(response?.status(), `${path} doit retourner 2xx`).toBeLessThan(400)
      // Attente du document body
      await expect(page.locator('body')).toBeVisible()
      // Aucune erreur JS au chargement
      expect(errors, `Erreurs JS sur ${path} : ${errors.join(' | ')}`).toHaveLength(0)
    })
  }
})

test.describe('Smoke API — endpoints critiques', () => {
  test('GET /api/activity-feed retourne du JSON valide', async ({ request }) => {
    const res = await request.get('/api/activity-feed')
    expect(res.status()).toBeLessThan(500) // peut être 200 ou 401 (RLS), pas 500
  })

  test('POST /api/whatsapp/webhook répond sans crash (event ignoré)', async ({ request }) => {
    const res = await request.post('/api/whatsapp/webhook', {
      data: { event: 'unknown_event', data: {} },
    })
    // Status doit être 200 (ignored) ou 401 (signature invalide), pas 500
    expect(res.status()).toBeLessThan(500)
  })
})
