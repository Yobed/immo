import { test, expect } from '@playwright/test'

// Comptes test — à créer manuellement en staging avant exécution
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@immo-ci.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'TestPassword123!'

test.describe('Authentification', () => {
  test('connexion avec email et mot de passe valides', async ({ page }) => {
    await page.goto('/auth/login')

    // Vérifier que la page login est chargée
    await expect(page).toHaveTitle(/Immo CI|Connexion/i)
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()

    // Remplir le formulaire
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL)
    await page.getByPlaceholder(/mot de passe/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Après connexion réussie: redirection vers dashboard ou accueil
    await expect(page).toHaveURL(/\/(dashboard|biens|profil)/, { timeout: 10_000 })
  })

  test('connexion avec mauvais mot de passe affiche une erreur', async ({ page }) => {
    await page.goto('/auth/login')

    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL)
    await page.getByPlaceholder(/mot de passe/i).fill('mauvais-mot-de-passe')
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Doit afficher un message d'erreur
    await expect(page.getByText(/identifiants invalides|mot de passe incorrect|Invalid login/i)).toBeVisible({
      timeout: 5_000,
    })
    // Doit rester sur la page login
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('déconnexion depuis le profil', async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/auth/login')
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL)
    await page.getByPlaceholder(/mot de passe/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL(/\/(dashboard|biens|profil)/, { timeout: 10_000 })

    // Naviguer vers le profil
    await page.goto('/profil')
    await expect(page).toHaveURL(/profil/)

    // Cliquer sur déconnexion
    await page.getByRole('button', { name: /déconnexion|se déconnecter/i }).click()

    // Doit rediriger vers login ou landing
    await expect(page).toHaveURL(/(auth\/login|\/)/, { timeout: 5_000 })
  })
})
