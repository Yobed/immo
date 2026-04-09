# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** Next.js 14 App Router with route-group-based multi-persona architecture

**Key Characteristics:**
- Four route groups partition the app by audience: `(public)`, `(pro)`, `(client)`, `(auth)`
- All page data fetching happens in React Server Components calling Supabase directly via `@supabase/ssr`
- Client Components are restricted to interactive UI leaves (forms, toggles, realtime widgets)
- API routes (`/api/*`) handle mutations from Client Components and external webhooks
- Middleware enforces authentication at the edge before any route handler executes

## Route Group Architecture

**`(public)` — Unauthenticated browsing:**
- Layout: `app/(public)/layout.tsx` — sticky header with `SearchBar`, conditional auth links, footer
- Routes: `/` (landing), `/biens` (listing), `/biens/[id]` (fiche détail), `/recherche` (filtered search), `/chat`
- Auth state: user checked in layout RSC for conditional nav; pages do NOT redirect on missing auth

**`(pro)` — Property owner dashboard:**
- Layout: `app/(pro)/layout.tsx` — sticky header with PRO badge, nav links, `NotificationBell`, `UserMenu`
- Routes: `/dashboard`, `/mes-biens`, `/mes-biens/nouveau`, `/mes-biens/[id]/modifier`, `/visites`, `/quittances`, `/avis-recus`, `/profil`
- Auth: middleware pre-blocks unauthenticated access; pages additionally call `supabase.auth.getUser()` and `redirect('/login')` as defense-in-depth

**`(client)` — Tenant/buyer portal:**
- Layout: `app/(client)/layout.tsx` — same sticky header pattern, CLIENT persona nav, `NotificationBell`, `UserMenu`
- Routes: `/favoris`, `/mes-visites`, `/reservations`, `/reservations/nouvelle`, `/reservations/[id]`, `/messages`, `/mes-avis`, `/notifications`, `/paiement/retour`
- Auth: same middleware + page-level guard pattern as `(pro)`

**`(auth)` — Authentication flows:**
- No shared layout; each page is standalone centered card
- Routes: `/login`, `/register`, `/verify-otp`, `/callback` (OAuth exchange)
- `/callback/route.ts` exchanges OAuth code for session via `supabase.auth.exchangeCodeForSession(code)`

**`api/` — Server-side mutation and webhook endpoints:**
- `api/auth/logout` — sign-out handler
- `api/biens/[id]` — PATCH/DELETE for property mutations (Client Components cannot call Supabase directly for writes)
- `api/biens/[id]/description` — AI-generated description via Claude
- `api/biens/[id]/medias` — media management (Cloudinary upload)
- `api/biens/[id]/score` — listing completeness score
- `api/chat` — streaming SSE proxy to Anthropic Claude
- `api/contrats/generer`, `api/contrats/[id]` — PDF contract generation via `@react-pdf/renderer`
- `api/kyc` — KYC document upload handling
- `api/notifications`, `api/notifications/[id]` — notification CRUD
- `api/paiements/initier`, `api/paiements/webhook` — CinetPay payment initiation and webhook
- `api/quittances/generer`, `api/quittances/webhook` — rent receipt PDF and payment webhook
- `api/reservations` — reservation creation
- `api/upload/sign` — Cloudinary signed upload URL generation
- `api/avis`, `api/avis/[id]/reponse` — review creation and owner response
- `api/visites` — visit request management

## Auth Flow

**Middleware (`apps/web/middleware.ts`):**
1. Every non-static request passes through middleware
2. `createServerClient` from `@supabase/ssr` reads cookies from `NextRequest`
3. `supabase.auth.getUser()` validates JWT server-side (never reads JWT from cookie directly)
4. Protected path prefixes: `/pro`, `/client`, `/dashboard`, `/mes-biens`, `/mes-avis`, `/mes-visites`, `/visites`, `/quittances`, `/profil`, `/avis-recus`
5. Unauthenticated access → `redirect('/login?redirect=<original-path>)`

**OAuth (Google):**
- Login page calls `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: origin + '/auth/callback' })`
- `app/(auth)/callback/route.ts` (Route Handler) exchanges `code` param for session cookies

**OTP (Phone):**
- `/verify-otp` page handles phone-based OTP login via Supabase Auth

**Email/Password:**
- Client Component `LoginPage` calls `supabase.auth.signInWithPassword()` directly from browser

**Session Propagation:**
- Middleware writes refreshed session cookies back on each response
- `lib/supabase/server.ts` — `createClient()` for RSC/Route Handlers (cookie-based)
- `lib/supabase/client.ts` — `createClient()` for Client Components (browser-based)

## Server vs Client Component Split

**Server Components (RSC) — majority of pages and layouts:**
- All `layout.tsx` files: fetch user and unread notification count at render time
- All `page.tsx` files in `(pro)` and `(client)`: fetch page-specific data directly from Supabase
- Pages pass data as props to interactive Client Component leaves
- Pattern: `const supabase = await createClient()` then direct `.from('table').select(...)` in async page function

**Client Components (`'use client'`) — interactive leaves only:**
- `components/bien/FavorisButton.tsx` — optimistic toggle, calls Supabase client directly for reads/writes
- `components/notifications/NotificationBell.tsx` — realtime Supabase channel subscription, lazy loads via `authFetch`
- `components/bien/BienForm/index.tsx` — multi-step form with `react-hook-form` + `zod`
- `components/search/SearchBar.tsx` — autocomplete input
- `components/search/SearchFilters.tsx` — filter sidebar
- `components/auth/UserMenu.tsx`, `components/auth/LogoutButton.tsx` — dropdown menus
- `components/layout/MobileMenu.tsx` — mobile nav drawer
- `components/chat/ChatBot.tsx` — streaming chat UI
- `components/reservation/ReservationFlow.tsx` — multi-step reservation wizard
- `components/map/PropertiesMap.tsx`, `components/bien/BienMap.tsx` — Mapbox GL maps (browser-only)
- Dashboard charts: `RevenueBarChart`, `PaymentDonut`, `ConversionFunnel` — all `dynamic(..., { ssr: false })` to avoid Recharts hydration mismatch

**Client Components calling API routes (not Supabase directly):**
- Use `lib/auth-fetch.ts` `authFetch()` helper, which attaches `Authorization: Bearer <access_token>`
- API route handlers use `lib/server-auth.ts` `getServerUser()`, which reads cookie first, then falls back to `Authorization` header

## Data Fetching Strategy

**Read path (RSC pages):**
```
Browser request
  → middleware (auth check, session refresh)
  → RSC page.tsx
  → createClient() (server, cookie-based)
  → supabase.from('table').select(...)
  → render HTML with data
```

**Parallel fetching used in heavy pages:**
- `(pro)/dashboard/page.tsx` fetches biens first, then `Promise.all([...])` for 7 concurrent queries
- `(public)/recherche/page.tsx` fetches listing query then separate cover photo query

**Write path from Client Components:**
```
Client Component
  → authFetch('/api/route', { method: 'POST', body })
  → API route handler
  → getServerUser() (validates cookie or Bearer token)
  → supabase.from('table').insert/update/delete
  → JSON response
```

**Write path via Server Actions:**
- `app/(pro)/mes-biens/nouveau/actions.ts` — `'use server'` functions `createBien()` and `updateBien()`
- Called directly from `BienForm` Client Component (`await createBien(data)`)
- Server Actions use `createClient()` (server) and call `supabase.auth.getUser()` internally

**Realtime (Supabase channels):**
- `NotificationBell` subscribes to `postgres_changes` INSERT on `notifications` table filtered by `user_id`
- Channel created client-side in `useEffect`, cleaned up on unmount

## Layout Hierarchy

```
app/layout.tsx (RootLayout)
  ↳ fonts (Playfair Display, DM Sans, JetBrains Mono), global CSS, metadata
  ↳ (public)/layout.tsx
      ↳ header: logo, SearchBar, auth-conditional nav, UserMenu
      ↳ {children}
      ↳ footer
  ↳ (pro)/layout.tsx
      ↳ header: logo, PRO badge, nav links, NotificationBell, UserMenu
      ↳ <main>{children}</main>
  ↳ (client)/layout.tsx
      ↳ header: logo, nav links, NotificationBell, UserMenu
      ↳ <main>{children}</main>
  ↳ (auth)/ — no shared layout
      ↳ standalone centered pages
```

## Key Design Decisions

1. **No role column in middleware** — middleware only checks authentication, not role. Pro vs client separation is enforced by URL structure (`/pro/*` vs `/client/*`) and layout persona. Any authenticated user can currently access either area by URL.

2. **`(public)` routes are Server-rendered** — the listing and search pages fetch and render server-side with URL-based pagination (`?page=N`), enabling full-page navigation without client-side state.

3. **Supabase `'use server'` escape hatch** — the `as any` cast on `supabase.from('table')` appears throughout the codebase because the local `Database` type is not fully wired up to the Supabase client generic. This bypasses TypeScript table type safety.

4. **Dynamic imports with `ssr: false`** — chart components (Recharts-based) are all loaded with `next/dynamic` and `ssr: false` in `dashboard/page.tsx` to prevent hydration mismatches.

5. **`serverExternalPackages: ['@react-pdf/renderer']`** in `next.config.ts` — required to prevent crash in route handlers that generate PDFs.

6. **`authFetch` pattern for Client→API auth** — a custom wrapper at `lib/auth-fetch.ts` injects the Supabase JWT Bearer token on every API call from Client Components. API routes use `getServerUser()` in `lib/server-auth.ts` which checks cookies first, then `Authorization` header as fallback.

## Error Handling

**Strategy:** Fail-fast with HTTP status codes from API routes; `notFound()` / `redirect()` from RSC pages.

**Patterns:**
- RSC pages: `if (!data) notFound()` or `if (!user) redirect('/login')`
- API routes: `return NextResponse.json({ error: msg }, { status: 4xx })`
- Client Components: local `useState` for error messages displayed inline
- Server Actions: return `{ error: string }` object on failure (not thrown)

## Cross-Cutting Concerns

**Logging:** `console.*` only, no structured logging framework
**Validation:** `zod` in Client Components (`BienForm`, `LoginPage`); no input validation in API routes beyond auth check
**Authentication:** Supabase Auth with cookie sessions; middleware is primary guard; page-level `redirect` is defense-in-depth

---

*Architecture analysis: 2026-04-09*
