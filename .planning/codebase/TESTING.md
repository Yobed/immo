# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Runner:**
- Playwright `^1.59.1`
- Config: `apps/web/playwright.config.ts`
- Test directory: `apps/web/tests/e2e/`

**Assertion Library:**
- Playwright built-in `expect` — no separate assertion library

**Run Commands:**
```bash
npm run e2e           # Run all E2E tests (headless)
npm run e2e:ui        # Playwright UI mode (interactive)
npm run e2e:report    # Open last HTML report
npm run type-check    # TypeScript check only (tsc --noEmit)
npm run lint          # Next.js ESLint
```

**No unit test runner is configured.** There is no Jest, Vitest, or any unit/integration test setup. The only automated tests are Playwright E2E.

## Test File Organization

**Location:** All test files live in `apps/web/tests/e2e/` — separate from source, not co-located.

**Naming:**
- `[feature].spec.ts` pattern
- Current files:
  - `apps/web/tests/e2e/auth.spec.ts` — login, logout flows
  - `apps/web/tests/e2e/dashboard.spec.ts` — pro dashboard KPIs and charts
  - `apps/web/tests/e2e/reservation.spec.ts` — listing, filtering, detail page, booking redirect

**Structure:**
```
apps/web/
├── tests/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── dashboard.spec.ts
│       └── reservation.spec.ts
├── playwright.config.ts
└── playwright-report/         # Generated, not committed
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect } from '@playwright/test'

// Shared credentials — read from env with fallback defaults
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@immo-ci.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'TestPassword123!'

test.describe('Feature Name', () => {
  // Optional: shared setup
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('action results in expected outcome', async ({ page }) => {
    await page.goto('/path')
    await expect(page.getByRole('heading', { name: /text/i })).toBeVisible()
  })
})
```

**Helper function pattern** (auth reuse across files):
```typescript
async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.getByPlaceholder(/email/i).fill(TEST_EMAIL)
  await page.getByPlaceholder(/mot de passe/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /se connecter/i }).click()
  await page.waitForURL(/\/(dashboard|biens|profil)/, { timeout: 10_000 })
}
```

**Assertions style:**
- `await expect(page).toHaveURL(/pattern/)` — URL verification after navigation
- `await expect(locator).toBeVisible({ timeout: 8_000 })` — explicit timeouts for async data
- `await expect(page.getByRole(...))` — role-based queries (preferred)
- `await expect(page.getByPlaceholder(...))` — for form inputs
- `await expect(page.getByText(/regex/i))` — case-insensitive text matching

**Tolerance pattern** — tests use soft fallbacks where data may be empty:
```typescript
const isVisible = await element.isVisible({ timeout: 5_000 }).catch(() => false)
if (!isVisible) {
  console.warn(`Element not visible — may be OK if data is empty`)
}
```

## Playwright Configuration

From `apps/web/playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,    // sequential — avoids auth state conflicts
  workers: 1,              // single worker — shares Next.js server
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run start',   // runs production build — requires prior `npm run build`
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

**Key constraints:**
- Tests are sequential (1 worker) — do not write tests that assume parallel execution
- Tests run against a **production build** (`npm start`), not dev server
- No auth storage state — each test that needs auth must log in manually (or use `beforeEach`)
- Tests require real Supabase data — no database seeding or mocking is configured

## Locator Strategy

**Preferred (in order of preference):**
1. `page.getByRole('button', { name: /text/i })` — role + accessible name
2. `page.getByPlaceholder(/text/i)` — form inputs
3. `page.getByText(/text/i)` — text content (case-insensitive regex)
4. `page.locator('a[href*="/biens/"]')` — attribute selector (fallback)
5. `page.locator('[data-testid="..."]')` — data-testid (not widely used yet)

**Avoid:** Index-based locators (`nth(0)`) except to get the first of many identical elements.

## Environment Configuration

Tests read credentials from environment variables:

| Variable | Description | Fallback |
|---|---|---|
| `TEST_EMAIL` | Tenant/visitor test account email | `test@immo-ci.com` |
| `TEST_PASSWORD` | Tenant/visitor test account password | `TestPassword123!` |
| `PROPRIO_EMAIL` | Owner/pro test account email | `proprio@immo-ci.com` |
| `PROPRIO_PASSWORD` | Owner/pro test account password | `TestPassword123!` |

These accounts must be **created manually in Supabase** before running tests. There is no automated seeding.

## Coverage Analysis

### What IS Tested (E2E)

- `apps/web/tests/e2e/auth.spec.ts`:
  - Login with valid credentials
  - Login with wrong password (error display)
  - Logout from profile page

- `apps/web/tests/e2e/reservation.spec.ts`:
  - Public listing page renders cards with FCFA prices
  - Filter by commune (soft assertion — tolerates empty results)
  - Bien detail page loads title and reserve button
  - Anonymous user redirected to login on reserve attempt

- `apps/web/tests/e2e/dashboard.spec.ts`:
  - Pro dashboard loads KPI cards
  - Dashboard shows SVG chart or analytics section
  - Priority alerts section present or gracefully absent

### What Is NOT Tested (Major Gaps)

**No unit tests at all** for:
- `lib/utils.ts` — `cn()` function
- `components/bien/BienForm/index.tsx` — `validateStep()` logic, `numOpt()` helper, step navigation
- `components/ui/Button.tsx`, `Input.tsx`, `Badge.tsx`, `Card.tsx` — component rendering
- `lib/supabase/server.ts` — client creation
- All Server Actions (`actions.ts`) — `createBien()`, `updateBien()`
- Zod schema validation — `BienSchema`
- Format utilities — `formatFCFA()`, date formatting

**No integration tests for:**
- API routes (`app/api/**`) — webhooks, CRUD endpoints
- Supabase queries — no DB-level integration tests
- Cloudinary upload flows
- CinetPay payment webhook handling

**E2E gaps:**
- Multi-step form (`BienForm`) creation flow not tested
- Media upload (photos, video, 360°) not tested
- Reservation creation flow not tested end-to-end (only redirect tested)
- Quittance generation not tested
- Client dashboard and client-specific flows not tested
- Mobile viewports not tested (only `Desktop Chrome`)
- Search page (`/recherche`) not tested
- Chat/messaging not tested

## Recommended Testing Approach

Given the codebase has no unit test runner configured, new tests should follow this priority order:

**1. Add unit test runner (Vitest recommended)**
- Compatible with Next.js 14 and Vite-style config
- Add `vitest.config.ts` at `apps/web/` level
- Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

**2. Unit test priority targets:**
- `components/bien/BienForm/index.tsx` — `validateStep()` has complex branching logic, ideal for unit tests
- `lib/utils.ts` — `cn()` trivial but good smoke test
- `BienSchema` Zod schema — test edge cases (`numOpt`, empty strings, min lengths)

**3. Component test pattern to follow** (once Vitest is added):
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('shows spinner when loading', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

**4. E2E expansion priority:**
- BienForm multi-step creation (critical user flow, currently untested)
- Reservation creation (happy path)
- Mobile viewport tests (add `Mobile Chrome` to Playwright projects)

**5. Auth state reuse** — when adding more authenticated E2E tests, implement Playwright's `storageState` to avoid logging in for every test:
```typescript
// tests/e2e/fixtures/auth.ts
import { test as base } from '@playwright/test'
export const test = base.extend({
  page: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: 'tests/.auth/user.json' })
    await use(await ctx.newPage())
  }
})
```

---

*Testing analysis: 2026-04-09*
