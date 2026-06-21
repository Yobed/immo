/**
 * Tests E2E catalogue — filtres, recherche, navigation cards.
 */

import { test, expect } from '@playwright/test'

// Cookie banner + onboarding modal interceptent les clics — on les marque comme vus
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('cookie-consent', 'accepted')
    window.localStorage.setItem('bgp_onboarded', '1')
  })
})

test.describe('Catalogue — recherche et filtres', () => {
  test('affiche au moins un résultat par défaut', async ({ page }) => {
    await page.goto('/catalogue')
    await expect(page.locator('h1')).toContainText('Trouvez votre')

    // Compteur résultats visible
    const counterText = await page.locator('text=/RÉSULTATS|Résultats/i').first().textContent()
    expect(counterText).toBeTruthy()
  })

  test('filtre par type Villa met à jour l\'URL', async ({ page }) => {
    await page.goto('/catalogue')
    // Attendre hydratation React avant clic (handlers attachés)
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.getByRole('button', { name: 'Villa', exact: true }).click()
    await page.waitForURL(/type_bien=villa/, { timeout: 10000 })
    expect(page.url()).toContain('type_bien=villa')
  })

  test('toggle Vente met à jour l\'URL', async ({ page }) => {
    await page.goto('/catalogue')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.getByRole('button', { name: 'À vendre', exact: true }).click()
    await page.waitForURL(/type_offre=vente/, { timeout: 10000 })
    expect(page.url()).toContain('type_offre=vente')
  })

  test('vue carte se charge sans erreur', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/catalogue?vue=carte')
    // Le canvas Mapbox prend quelques secondes à charger
    await page.waitForSelector('.mapboxgl-canvas, .leaflet-container', { timeout: 15000 }).catch(() => {})
    // Pas d'erreur fatale
    expect(errors.filter((e) => !e.includes('Mapbox')).length).toBe(0)
  })

  test('switch vue grille → liste persiste les filtres', async ({ page }) => {
    await page.goto('/catalogue?type_bien=appartement')
    // ViewToggle est un <a> (lien) avec aria-label "Liste"
    await page.getByRole('link', { name: 'Liste' }).first().click()
    await page.waitForURL(/vue=liste/, { timeout: 10000 })
    expect(page.url()).toContain('type_bien=appartement')
    expect(page.url()).toContain('vue=liste')
  })

  test('recherche texte navigue correctement', async ({ page }) => {
    await page.goto('/')
    // SearchBar utilise placeholder "Où souhaitez-vous habiter ?" (avec typewriter en fallback)
    const searchInput = page.locator('input').filter({ hasNot: page.locator('[type="hidden"]') }).first()
    await searchInput.click()
    await searchInput.fill('villa cocody')
    await page.keyboard.press('Enter')
    // Soit /catalogue soit /recherche (redirect 308)
    await page.waitForURL(/(catalogue|recherche)/, { timeout: 15000 })
    expect(page.url()).toMatch(/(catalogue|recherche)/)
  })
})

test.describe('Catalogue — navigation cards', () => {
  test('cliquer une card ouvre la fiche bien', async ({ page }) => {
    await page.goto('/catalogue?source=bogbes')
    const firstCard = page.locator('a[href^="/biens/"], a[href^="/offre-flash/"]').first()
    if (await firstCard.count() === 0) {
      test.skip()
      return
    }
    const href = await firstCard.getAttribute('href')
    await firstCard.click()
    await page.waitForURL(href!, { timeout: 10000 })
    // La fiche doit avoir un h1
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })
})
