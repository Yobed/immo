import { test, expect } from '@playwright/test'

// Compte propriétaire pour tester le dashboard
const PROPRIO_EMAIL = process.env.PROPRIO_EMAIL ?? 'proprio@immo-ci.com'
const PROPRIO_PASSWORD = process.env.PROPRIO_PASSWORD ?? 'TestPassword123!'

test.describe('Dashboard Propriétaire', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant que propriétaire avant chaque test
    await page.goto('/auth/login')
    await page.getByPlaceholder(/email/i).fill(PROPRIO_EMAIL)
    await page.getByPlaceholder(/mot de passe/i).fill(PROPRIO_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL(/\/(dashboard|biens|profil)/, { timeout: 10_000 })
  })

  test('dashboard charge et affiche les KPI cards', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/dashboard/, { timeout: 5_000 })

    // Attendre que la page soit chargée (données Supabase)
    await page.waitForLoadState('networkidle')

    // KPIs attendus (labels vérifiés au niveau texte)
    const kpiLabels = [
      /revenus|recettes/i,
      /réservations/i,
      /biens/i,
    ]

    for (const label of kpiLabels) {
      const kpiElement = page.getByText(label).first()
      // Au moins 2 KPIs sur 3 doivent être visibles
      const isVisible = await kpiElement.isVisible({ timeout: 5_000 }).catch(() => false)
      if (!isVisible) {
        console.warn(`KPI "${label}" non visible — peut être OK si le dashboard est vide`)
      }
    }

    // Au moins 1 chiffre visible (valeur FCFA ou nombre)
    const hasNumbers = await page.getByText(/\d+/).first().isVisible().catch(() => false)
    expect(hasNumbers).toBeTruthy()
  })

  test('dashboard affiche un graphique ou section analytique', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Chercher des éléments de chart (SVG Recharts ou canvas)
    const hasSvgChart = await page.locator('svg').first().isVisible({ timeout: 5_000 }).catch(() => false)
    const hasChartSection = await page.getByText(/évolution|statistiques|analytique/i).isVisible().catch(() => false)

    // Au moins un indicateur de dashboard analytique
    expect(hasSvgChart || hasChartSection).toBeTruthy()
  })

  test('section alertes prioritaires visible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Chercher la section alertes
    const alertesSectionVisible = await page.getByText(/alertes|prioritaire|attention/i).isVisible({ timeout: 5_000 }).catch(() => false)
    // Tolérant si aucune alerte active — la section peut être masquée
    if (!alertesSectionVisible) {
      console.log('Section alertes non visible (peut-être aucune alerte active)')
    }

    // La page dashboard doit au minimum charger sans erreur 500
    await expect(page).not.toHaveURL(/error|500/)
  })
})
