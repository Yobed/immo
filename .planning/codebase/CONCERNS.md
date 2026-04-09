# Codebase Concerns

**Analysis Date:** 2026-04-09

---

## Tech Debt

### Pervasive `as any` Casts on Supabase Queries

- Issue: The Supabase-generated type file (`lib/database.types.ts`) is a placeholder and does not match the actual schema. Every table query that requires non-trivial fields is cast with `(supabase.from('table') as any)` or `(supabase as any).from(...)` to bypass TypeScript. This suppresses all column-name, return-type, and insert-payload safety across the entire data layer.
- Files: `apps/web/app/api/biens/route.ts`, `apps/web/app/api/biens/[id]/route.ts`, `apps/web/app/api/reservations/route.ts`, `apps/web/app/api/paiements/initier/route.ts`, `apps/web/app/api/paiements/webhook/route.ts`, `apps/web/app/api/contrats/generer/route.ts`, `apps/web/app/api/quittances/generer/route.ts`, `apps/web/app/api/kyc/route.ts`, `apps/web/app/api/avis/route.ts`, `apps/web/app/api/notifications/route.ts`, `apps/web/app/(pro)/dashboard/page.tsx`, `apps/web/app/(public)/recherche/page.tsx`, `apps/web/app/(public)/biens/[id]/page.tsx` — 31 occurrences across 14 API route files alone, 82 `eslint-disable` suppressions across 39 files total.
- Impact: Any schema change (column rename, type change) causes silent runtime errors instead of compile-time failures. Typos in column names are undetectable.
- Fix approach: Run `supabase gen types typescript --project-id <id>` to regenerate `lib/database.types.ts` and `shared-pkg/types/database.ts` from the live schema, then remove `as any` casts one table at a time.

### `zodResolver` Removed from BienForm

- Issue: `apps/web/components/bien/BienForm/index.tsx` explicitly documents "Pas de zodResolver" — the form uses `react-hook-form` without a schema resolver. Validation is done manually in `validateStep()` per step and `validateAll()` on final submit. The Zod schema `BienSchema` is defined but never connected to the form's `useForm` call.
- Files: `apps/web/components/bien/BienForm/index.tsx` (line 97-102)
- Impact: The manual per-step validation duplicates constraints already in `BienSchema`, creating two sources of truth. Inconsistencies between the schema and manual checks will be missed. The `numOpt` preprocessor that handles `NaN` from `valueAsNumber` is correct but duplicated work.
- Fix approach: Reconnect `zodResolver(BienSchema)` and rely on `form.trigger(['titre', ...])` for per-step validation instead of the manual `validateStep()` function.

### Dual `@immo-ci/shared` Package

- Issue: Two directories contain identical files: `apps/web/shared-pkg/` (referenced as `"@immo-ci/shared": "file:./shared-pkg"` in `apps/web/package.json`) and `packages/shared/` (a workspace-level package with the same name and identical content). The web app resolves to the local copy; the workspace package appears unused but is maintained in parallel.
- Files: `apps/web/shared-pkg/`, `packages/shared/`
- Impact: Silently diverging constants if one copy is edited and the other is not. Any new `packages/shared/` consumer would get different values. Current diff confirms they are identical, but this is not enforced.
- Fix approach: Delete `apps/web/shared-pkg/` and update `apps/web/package.json` to point to `packages/shared/` via workspace protocol (`workspace:*`). Add a CI check that fails on divergence in the interim.

### Untyped `body` Pass-Through in PATCH `/api/biens/[id]`

- Issue: `apps/web/app/api/biens/[id]/route.ts` reads the full request body as `Record<string, any>` and passes it directly to `.update(body)`. There is no allowlist of updatable fields.
- Files: `apps/web/app/api/biens/[id]/route.ts` (lines 10-16)
- Impact: Authenticated owners can overwrite any column in the `biens` table, including `proprietaire_id`, `statut`, and internal fields. This is a mass-assignment vulnerability.
- Fix approach: Define an explicit `allowedFields` set (e.g., `titre`, `description`, `commune`, etc.) and filter `body` before passing to `.update()`. Add server-side Zod validation.

### Untyped Media Insert Pass-Through

- Issue: `apps/web/app/api/biens/[id]/medias/route.ts` POST handler spreads `body` directly: `.insert({ ...body, bien_id: id })`. No field allowlist, no validation schema.
- Files: `apps/web/app/api/biens/[id]/medias/route.ts` (line 16)
- Impact: Authenticated owners can inject arbitrary columns into `biens_medias`.
- Fix approach: Add an explicit field pick: `{ url, type, titre, ordre, est_couverture, hotspots, embed_url, duree_sec }` before insert.

### `FicheBienPage` MobileActions Component Uses `bien: any`

- Issue: The locally-defined `MobileActions` function in `apps/web/app/(public)/biens/[id]/page.tsx` types its `bien` prop as `any` (line 361). This is the page's main data object and bypasses all field safety.
- Files: `apps/web/app/(public)/biens/[id]/page.tsx` (lines 358-399)
- Impact: Any field access typo on the mobile panel is silently undefined.
- Fix approach: Extract a typed `BienDetail` interface (or reuse the typed Supabase row once schema types are regenerated) and apply it to `MobileActions`.

### `next/image` Bypassed for Avatar

- Issue: The owner avatar in `apps/web/app/(public)/biens/[id]/page.tsx` uses a plain `<img>` tag with an eslint-disable comment instead of Next.js `<Image>`. Cloudinary and Supabase storage domains are already configured in `next.config.ts`.
- Files: `apps/web/app/(public)/biens/[id]/page.tsx` (lines 226-228)
- Impact: No automatic lazy loading, no responsive sizing, no format optimization (WebP/AVIF) for avatars.
- Fix approach: Replace with `<Image>` component, add `width={48}` and `height={48}`.

---

## Security Considerations

### KYC Admin Webhook Has No Authentication

- Issue: `PATCH /api/kyc` uses the service role key and accepts `{ userId, statut }` from any caller to mark any user as `verifie` or `non_verifie`. There is no shared-secret validation, IP allowlist, or HMAC verification. A comment notes it is "webhook admin uniquement" but enforces nothing.
- Files: `apps/web/app/api/kyc/route.ts` (lines 35-76)
- Impact: Any unauthenticated caller can promote arbitrary users to KYC-verified status, bypassing identity verification.
- Fix approach: Add `x-admin-secret` header check against `process.env.ADMIN_WEBHOOK_SECRET` at the start of the handler. Rotate the secret via env var.

### Quittances Webhook Has No Authentication

- Issue: `POST /api/quittances/webhook` (n8n relay) and `POST /api/quittances/generer` accept unauthenticated payloads and act on the database with the service role key. Neither validates a shared secret.
- Files: `apps/web/app/api/quittances/webhook/route.ts`, `apps/web/app/api/quittances/generer/route.ts` (line 17 comment: "Auth: x-service-key optionnel")
- Impact: Any caller can trigger rent reminder notifications or generate quittance PDFs for any contract.
- Fix approach: Validate `x-service-key` header against `SUPABASE_SERVICE_ROLE_KEY` or a dedicated `WEBHOOK_SECRET`. The comment in `generer/route.ts` already identifies this as a required production step.

### Contract Generation Endpoint Has No Authentication

- Issue: `POST /api/contrats/generer` uses the service role key and generates a legally-binding PDF contract for any `reservationId` passed in the body. There is no authentication check — any caller with network access can generate contracts.
- Files: `apps/web/app/api/contrats/generer/route.ts` (lines 10-18)
- Impact: Unauthenticated contract generation for arbitrary reservation IDs.
- Fix approach: Add the same shared-secret header check as the KYC and quittances webhooks.

### Inconsistent Base URL Env Vars

- Issue: Two different env vars are used for the production base URL: `NEXT_PUBLIC_URL` (used in `paiements/initier`, `app/layout.tsx`, `lib/env.ts`) and `NEXT_PUBLIC_SITE_URL` (used in `api/auth/logout`). If only one is set in production, the payment webhook callback or the logout redirect will fall back to `http://localhost:3000`.
- Files: `apps/web/app/api/paiements/initier/route.ts` (line 19), `apps/web/app/api/auth/logout/route.ts` (line 7)
- Impact: CinetPay payment webhooks pointing to localhost will never fire in production, leaving payments stuck in `en_cours`.
- Fix approach: Standardize on `NEXT_PUBLIC_URL`. Remove `NEXT_PUBLIC_SITE_URL` and update `api/auth/logout/route.ts`.

### Chat API Has No Authentication or Rate Limiting

- Issue: `POST /api/chat` streams Claude AI responses without checking for an authenticated user. Any visitor (or bot) can call it indefinitely. There is no rate limiting anywhere in the codebase.
- Files: `apps/web/app/api/chat/route.ts`
- Impact: Anthropic API costs can be exhausted by unauthenticated traffic. No circuit breaker exists.
- Fix approach: Add `getServerUser()` check and return 401 for unauthenticated requests. Add per-user request throttling (e.g., via Supabase Edge Function or Upstash Redis).

### Middleware Does Not Protect API Routes

- Issue: `apps/web/middleware.ts` protects named page routes (`/dashboard`, `/mes-biens`, etc.) but `apps/web/app/api/` routes are not in the `protectedRoutes` list. Each API handler independently calls `getServerUser()`, but the middleware provides no defence-in-depth for API paths.
- Files: `apps/web/middleware.ts` (lines 33-43)
- Impact: No centralized protection for API routes. If a handler forgets the auth check (as happened with `/api/contrats/generer` and the webhook routes), there is no fallback.
- Fix approach: Add `/api/` path matching to middleware with a passthrough for explicitly public routes (`/api/paiements/webhook`, `/api/quittances/webhook`, `/api/chat`).

---

## Performance Concerns

### Cover Image N+1 Query Pattern

- Issue: The listing pages (`/biens`, `/recherche`) first fetch a page of `biens` rows, then make a second query to `biens_medias` to find cover images. This is a workaround for the missing `est_couverture` join on the main query.
- Files: `apps/web/app/(public)/biens/page.tsx`, `apps/web/app/(public)/recherche/page.tsx` (lines 74-80)
- Impact: Two sequential round-trips to Supabase on every page load. Latency is additive, not parallel.
- Fix approach: Extend the main `.select()` to include `biens_medias!inner(url)` filtered by `est_couverture = true`, or create a Supabase view/function that joins the cover image.

### Dashboard Fetches Biens Serially Before Parallel Fetch

- Issue: `apps/web/app/(pro)/dashboard/page.tsx` fetches `biens` first (to get `bienIds`), then fans out with `Promise.all`. Reservations and visites are skipped entirely when `bienIds` is empty (returning `Promise.resolve({ data: [] })`), but the serial first fetch is unavoidable.
- Files: `apps/web/app/(pro)/dashboard/page.tsx` (lines 49-113)
- Impact: Dashboard cold load always has two sequential DB round-trips minimum.
- Fix approach: Move bienIds join into a single SQL query using a subquery or Supabase RPC function that returns all dashboard data in one call.

### No Pagination on Notifications

- Issue: `GET /api/notifications` hard-caps at 50 results but the client always fetches the full list. There is no cursor-based pagination or incremental loading.
- Files: `apps/web/app/api/notifications/route.ts`
- Impact: For users with many notifications, the full 50-row payload is always transferred.

### SearchBar Suggestions Are Pure Client-Side Static Data

- Issue: `apps/web/components/search/SearchBar.tsx` builds `ALL_SUGGESTIONS` by combining `COMMUNES_CI`, `QUARTIERS_PREMIUM`, and `TYPES_BIEN_LABELS` into a single flat array at module load time, then `.filter()`s it on every keystroke. The full-text search on Supabase (`textSearch('fts', ...)`) is only used server-side on the results page, not in the autocomplete.
- Files: `apps/web/components/search/SearchBar.tsx` (lines 8-12)
- Impact: Autocomplete cannot surface actual listing data (e.g., "3 appartements à Cocody"). As the constants list grows, client-side filtering degrades.

### PDF Generation Blocks the HTTP Response

- Issue: Both `/api/contrats/generer` and `/api/quittances/generer` call `renderToBuffer()` (react-pdf) synchronously inside the route handler, blocking the Node.js thread for the duration of PDF rendering. There is no queue, background job, or timeout.
- Files: `apps/web/app/api/contrats/generer/route.ts` (line 81), `apps/web/app/api/quittances/generer/route.ts` (line 129)
- Impact: Heavy PDF generation can time out on serverless platforms (Vercel default: 10s). Concurrent PDF requests compete for the same thread.
- Fix approach: Move PDF generation to a Supabase Edge Function or a background queue (n8n workflow or Vercel background function), returning a job ID immediately and polling for completion.

---

## Missing Features / Incomplete Implementations

### No Loading States in Server-Rendered Pages

- Issue: No `loading.tsx` files exist anywhere under `apps/web/app/`. All route segments are bare async server components without Suspense boundaries. Slow database queries (e.g., dashboard with 7 parallel fetches) block the entire page render.
- Files: All route directories under `apps/web/app/`
- Impact: Users see a blank page or browser spinner during data fetches instead of skeleton UIs.
- Fix approach: Add `loading.tsx` per route segment for the dashboard, listing pages, and fiche bien. Wrap slow sub-sections in `<Suspense>` with skeleton components.

### No Error Boundaries

- Issue: No `error.tsx` files exist anywhere under `apps/web/app/`. Uncaught errors in server components or failed Supabase queries surface as Next.js default error pages with no user-friendly messaging.
- Files: All route directories under `apps/web/app/`
- Fix approach: Add `error.tsx` at segment level (especially `(pro)`, `(client)`, and `(public)/biens/[id]`).

### Payment Return Page Missing

- Issue: `apps/web/app/api/paiements/initier/route.ts` sets `returnUrl` to `${baseUrl}/paiement/retour` (line 39) but no corresponding page exists at `apps/web/app/paiement/retour/`. CinetPay redirects users to a 404 after payment.
- Files: `apps/web/app/api/paiements/initier/route.ts` (line 39)
- Impact: Users completing payment see a 404 error. No confirmation UI, no reservation status update trigger.
- Fix approach: Create `apps/web/app/paiement/retour/page.tsx` that reads the CinetPay query params, shows confirmation, and links to the reservation detail.

### KYC Review UI Missing

- Issue: `POST /api/kyc` allows users to submit CNI and selfie URLs. `PATCH /api/kyc` is the admin approval endpoint. There is no admin UI for reviewing KYC submissions or triggering the PATCH.
- Files: `apps/web/app/api/kyc/route.ts`
- Impact: KYC flow is functionally incomplete. Documents are stored but cannot be reviewed or approved without direct API calls.

### Reservation Conflict Check is Application-Level Only

- Issue: Date overlap detection in `POST /api/reservations` is done in application code (lines 22-31) using a Supabase query. There is no database-level exclusion constraint (`EXCLUDE USING gist`). Between the overlap check and the insert, a concurrent request can create a double booking.
- Files: `apps/web/app/api/reservations/route.ts` (lines 22-31)
- Impact: Race condition under concurrent bookings for the same property.
- Fix approach: Add a PostgreSQL exclusion constraint on `(bien_id, daterange(date_debut, date_fin, '[]'))` where `statut NOT IN ('annulee', 'terminee')`.

### Analytics Events Table Queried but Write Path Unclear

- Issue: `apps/web/app/(pro)/dashboard/page.tsx` reads from `analytics_events` (line 108) filtering on `user_id` and types `vue_bien` / `contact`. No code in the codebase writes to `analytics_events`, and there is no client-side event tracker or server action for it.
- Files: `apps/web/app/(pro)/dashboard/page.tsx` (lines 108-112, 158-166)
- Impact: Conversion funnel data (`vues`, `contacts`) is always zero. The chart renders empty.

### `UserMenu` `role='public'` Links to `/dashboard`

- Issue: `apps/web/components/auth/UserMenu.tsx` shows a "Mon espace" link to `/dashboard` when `role === 'public'`. This is the pro dashboard, which requires a pro account. A client-role user whose role was not passed correctly would be sent to the wrong destination.
- Files: `apps/web/components/auth/UserMenu.tsx` (lines 80-85)
- Impact: Incorrect navigation for users whose role prop is missing or wrong.
- Fix approach: Change the `public` role fallback to link to `/biens` or investigate why a logged-in user would have role `public`.

---

## Known Bugs / Fragile Areas

### `FicheBienPage` Does Not Handle Missing `profiles` Join

- Issue: `apps/web/app/(public)/biens/[id]/page.tsx` reads `bien['profiles!biens_proprietaire_id_fkey']` (line 45) using a non-standard string-key accessor for a named foreign-key join. If the join alias changes or the foreign key name is updated in the schema, this silently returns `undefined` and the owner panel disappears without error.
- Files: `apps/web/app/(public)/biens/[id]/page.tsx` (line 45)
- Impact: Fragile named-join syntax; owner display breaks on schema rename.

### `BienForm` Step 5 Renders Confirmation but Still Calls `handleFinalSubmit` on Step 4 Next

- Issue: `TOTAL_STEPS = 5` but `validateAll()` only validates steps 1-4 (line 107: `for (let s = 1; s <= 4; s++)`). Step 5 is a pure confirmation UI with no inputs. The form submits on clicking "Continuer vers les médias" only when `step === TOTAL_STEPS` (5), meaning the user must click Next from step 4 to reach step 5, then click the submit button. This double-click flow is not obvious to the user.
- Files: `apps/web/components/bien/BienForm/index.tsx` (lines 106, 163, 187-200)

### Signed PDF URLs Expire After 1 Year

- Issue: Both `contrats/generer` and `quittances/generer` create signed Supabase Storage URLs with a 1-year TTL (`3600 * 24 * 365` seconds). After expiry, `pdf_url` in the database points to an expired URL with no refresh mechanism.
- Files: `apps/web/app/api/contrats/generer/route.ts` (lines 99-100), `apps/web/app/api/quittances/generer/route.ts` (lines 147-151)
- Impact: Contract and quittance PDFs become inaccessible approximately 1 year after generation.
- Fix approach: Store the storage file path (not the signed URL), and generate a fresh signed URL on each `/api/contrats/[id]` GET request.

### Bucket Creation Called on Every Request

- Issue: Both PDF generation routes call `supabase.storage.createBucket(...)` on every invocation, catching the "already exists" error to ignore it.
- Files: `apps/web/app/api/contrats/generer/route.ts` (line 84), `apps/web/app/api/quittances/generer/route.ts` (line 132)
- Impact: Unnecessary API call on every PDF generation. In high-concurrency scenarios, the ignored error is a fire-and-forget with no logging.
- Fix approach: Ensure buckets are created once during infrastructure setup (e.g., Supabase migration or Terraform), then remove the runtime `createBucket` calls.

### `validateStep` for Step 2 Returns `true` When Validation Passes Without `clearErrors`

- Issue: In `apps/web/components/bien/BienForm/index.tsx`, the `validateStep` function for step 2 returns `true` implicitly when no price error is triggered, but it never calls `clearErrors` on success for the price fields (unlike step 1 which explicitly calls `clearErrors`). Stale errors from a previous attempt may persist.
- Files: `apps/web/components/bien/BienForm/index.tsx` (lines 66-83)

---

## Scalability Concerns

### Supabase Free-Tier Assumed for Storage Buckets

- Issue: Buckets `contrats` and `quittances` store PDF files generated per contract and per monthly billing cycle respectively. With a large property portfolio, storage costs and file count grow unboundedly. Files are never deleted or archived.
- Files: `apps/web/app/api/contrats/generer/route.ts`, `apps/web/app/api/quittances/generer/route.ts`

### Full-Text Search Limited to PostgreSQL `tsvector`

- Issue: Search uses Supabase's built-in `textSearch('fts', ...)` which relies on a PostgreSQL `tsvector` column (`config: 'french'`). This covers commune/type matching but not fuzzy matching, partial words, or phonetic similarity for Ivorian place names.
- Files: `apps/web/app/(public)/recherche/page.tsx` (line 55)
- Impact: Searching "Cocdy" instead of "Cocody" returns zero results.

### No Caching Layer

- Issue: All listing and detail pages fetch from Supabase on every request. There is no `revalidate` tag on fetch calls, no ISR (Incremental Static Regeneration), and no Redis/in-memory cache for expensive queries like the dashboard aggregations.
- Files: All server components under `apps/web/app/`
- Impact: Every page view hits Supabase; database load scales linearly with traffic.

### Price Filters Apply Only to `prix_mois_fcfa`

- Issue: `apps/web/app/(public)/recherche/page.tsx` applies `prix_min`/`prix_max` filters exclusively to `prix_mois_fcfa`. Nightly-rate (`prix_nuit_fcfa`) and sale-price (`prix_vente_fcfa`) properties are not covered by these filters.
- Files: `apps/web/app/(public)/recherche/page.tsx` (lines 58-59)
- Impact: Price range search is incorrect for `residence_meublee` (nightly) and sale listings.

---

## Test Coverage Gaps

### No Unit or Integration Tests

- Issue: Only three Playwright E2E specs exist (`auth.spec.ts`, `dashboard.spec.ts`, `reservation.spec.ts`). No unit tests (Vitest/Jest) for business logic: `validateStep`, `calculerSplit`, `arrondir5`, `BienSchema`, `canalVersMethode`, or any API route handler.
- Files: `apps/web/tests/e2e/`
- Risk: Regressions in pricing calculations, form validation logic, and payment splitting go undetected.
- Priority: High — payment commission and conflict-detection logic are especially critical.

### E2E Tests Use Hardcoded Staging Credentials

- Issue: `apps/web/tests/e2e/auth.spec.ts` falls back to hardcoded values `'test@immo-ci.com'` and `'TestPassword123!'` when env vars are absent (lines 4-5). If run against production without env vars set, tests authenticate with real credentials.
- Files: `apps/web/tests/e2e/auth.spec.ts`
- Fix approach: Remove fallback literals; fail loudly if `TEST_EMAIL`/`TEST_PASSWORD` env vars are not set.

### Auth E2E Test Navigates to `/auth/login` but Login Page Is at `/login`

- Issue: `auth.spec.ts` calls `page.goto('/auth/login')` but the actual login route based on the middleware and app directory structure is likely `/login`. If the path is wrong, all auth tests pass trivially due to no matching selectors.
- Files: `apps/web/tests/e2e/auth.spec.ts` (lines 9, 23, 43)
- Risk: Auth test suite may be silently non-functional.

---

*Concerns audit: 2026-04-09*
