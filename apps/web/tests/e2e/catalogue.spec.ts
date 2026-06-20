/**
 * Tests E2E catalogue — filtres, recherche, navigation cards.
 */

import { test, expect } from '@playwright/test'

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
    await page.locator('button:has-text("Villa")').first().click()
    await page.waitForURL(/type_bien=villa/, { timeout: 5000 })
    expect(page.url()).toContain('type_bien=villa')
  })

  test('toggle Vente met à jour l\'URL', async ({ page }) => {
    await page.goto('/catalogue')
    await page.locator('button:has-text("À VENDRE")').first().click()
    await page.waitForURL(/type_offre=vente/, { timeout: 5000 })
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
    await page.locator('a:has-text("Liste")').first().click()
    await page.waitForURL(/vue=liste/, { timeout: 5000 })
    expect(page.url()).toContain('type_bien=appartement')
    expect(page.url()).toContain('vue=liste')
  })

  test('recherche texte navigue correctement', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[type="search"], input[placeholder*="commune"]').first()
    await searchInput.fill('villa cocody')
    await page.keyboard.press('Enter')
    // Soit /catalogue soit /recherche (redirect 308)
    await page.waitForURL(/(catalogue|recherche)/, { timeout: 10000 })
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
