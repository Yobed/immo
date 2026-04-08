import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@immo-ci.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'TestPassword123!'

// Helper: se connecter avant chaque test
async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder(/email/i).fill(TEST_EMAIL)
  await page.getByPlaceholder(/mot de passe/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /se connecter/i }).click()
  await page.waitForURL(/\/(dashboard|biens|profil)/, { timeout: 10_000 })
}

test.describe('Flow Réservation', () => {
  test('liste des biens affiche des annonces publiées', async ({ page }) => {
    await page.goto('/biens')

    // La liste doit contenir au moins 1 bien
    const bienCards = page.locator('[data-testid="bien-card"], .bien-card, article').first()
    await expect(bienCards).toBeVisible({ timeout: 8_000 })

    // Vérifier qu'un prix FCFA est visible
    await expect(page.getByText(/FCFA/)).toBeVisible()
  })

  test('filtrer les biens par commune', async ({ page }) => {
    await page.goto('/biens')

    // Chercher par commune
    const searchInput = page.getByPlaceholder(/commune|rechercher|search/i).first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('Cocody')
      // Attendre que les résultats se mettent à jour
      await page.waitForTimeout(1000)
      // Les résultats filtrés doivent être visibles ou message "aucun résultat"
      const hasResults = await page.getByText(/FCFA/).isVisible().catch(() => false)
      const hasEmpty = await page.getByText(/aucun résultat|no results/i).isVisible().catch(() => false)
      expect(hasResults || hasEmpty).toBeTruthy()
    }
  })

  test('fiche bien affiche le titre et le bouton réserver', async ({ page }) => {
    // Naviguer vers la liste
    await page.goto('/biens')
    await page.waitForLoadState('networkidle')

    // Cliquer sur le premier bien
    const firstCard = page.locator('a[href*="/biens/"]').first()
    await expect(firstCard).toBeVisible({ timeout: 8_000 })
    await firstCard.click()

    // Vérifier que la fiche bien est affichée
    await expect(page).toHaveURL(/\/biens\/[a-zA-Z0-9-]+/)
    await expect(page.getByText(/FCFA/)).toBeVisible()

    // Bouton réserver visible (même sans être connecté — il redirige vers login)
    await expect(page.getByRole('button', { name: /réserver|contacter/i })).toBeVisible()
  })

  test('tentative de réservation sans connexion redirige vers login', async ({ page }) => {
    // S'assurer d'être déconnecté
    await page.goto('/biens')
    const firstBienLink = page.locator('a[href*="/biens/"]').first()
    await expect(firstBienLink).toBeVisible({ timeout: 8_000 })
    await firstBienLink.click()

    // Cliquer sur réserver
    const reserverBtn = page.getByRole('button', { name: /réserver/i }).first()
    if (await reserverBtn.isVisible()) {
      await reserverBtn.click()
      // Doit rediriger vers login ou afficher modal connexion
      const isOnLogin = await page.waitForURL(/auth\/login/, { timeout: 5_000 }).then(() => true).catch(() => false)
      const hasLoginModal = await page.getByText(/connectez-vous|connexion requise/i).isVisible().catch(() => false)
      expect(isOnLogin || hasLoginModal).toBeTruthy()
    }
  })
})
