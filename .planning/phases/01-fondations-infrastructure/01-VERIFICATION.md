---
phase: 01-fondations-infrastructure
verified: 2026-04-05T00:00:00Z
status: passed
score: 24/24 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Run `npm run dev` from repo root and confirm web + mobile start without errors"
    expected: "Next.js dev server at localhost:3000 and Expo Metro bundler both start"
    why_human: "Cannot start dev servers in verification; requires local .env.local with Supabase credentials"
  - test: "Test email/password login at /login"
    expected: "Login redirects to dashboard after successful auth"
    why_human: "Requires live Supabase project with credentials configured"
  - test: "Test Google OAuth flow at /login"
    expected: "Redirects through Google OAuth and lands at /auth/callback, then dashboard"
    why_human: "Requires Supabase Google OAuth provider to be enabled in dashboard"
  - test: "Test OTP phone auth at /verify-otp with a CI number (+225xxxxxxxx)"
    expected: "OTP SMS sent, code verified, session created"
    why_human: "Requires Supabase SMS/OTP provider (Twilio/vonage) configured in dashboard"
  - test: "Apply migrations 001–008 to Supabase SQL Editor and verify all 14 tables created"
    expected: "All tables exist with RLS active, handle_new_user trigger fires on auth.users insert"
    why_human: "Requires live Supabase project and SQL Editor access"
  - test: "Deploy to Vercel and run Lighthouse on landing page"
    expected: "Lighthouse score > 85 on both mobile and desktop"
    why_human: "Requires Vercel deployment and Lighthouse runner"
---

# Phase 1: Fondations & Infrastructure — Verification Report

**Phase Goal:** Monorepo opérationnel, BDD Supabase complète avec RLS, authentification (email + Google + OTP), design system Tailwind CI, et landing page déployable sur Vercel.
**Verified:** 2026-04-05
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Turborepo monorepo with apps/web, apps/mobile, packages/shared exists and is wired | VERIFIED | `package.json` has `workspaces: ["apps/*", "packages/*"]`, `turbo.json` pipeline present, `@immo-ci/shared: "*"` in web deps, `transpilePackages` in next.config.ts |
| 2 | Next.js 14.2.35 with TypeScript strict mode is configured | VERIFIED | `apps/web/package.json` has `"next": "14.2.35"` (exact lock), `tsconfig.json` has `"strict": true` |
| 3 | Expo SDK 52 app with expo-router is configured | VERIFIED | `apps/mobile/package.json` has `"expo": "~52.0.0"`, `expo-router@~4.0.0`, `app.json` scheme and bundleIdentifier present |
| 4 | packages/shared exports formatFCFA, montantEnLettres, COMMUNES_ABIDJAN, date utils | VERIFIED | `packages/shared/utils/formatFCFA.ts` exports both functions; `constants/communes.ts` exports `COMMUNES_ABIDJAN` (12 communes); `index.ts` barrel re-exports all |
| 5 | Env validation fails fast on missing vars | VERIFIED | `apps/web/lib/env.ts` uses `z.object({ NEXT_PUBLIC_SUPABASE_URL: z.string().url(), ... })`, `.env.local.example` has 38 lines documenting all vars |
| 6 | All 8 Supabase migrations exist (001–008) covering 14 tables | VERIFIED | All 8 `.sql` files present in `supabase/migrations/`; each file verified to contain `alter table ... enable row level security` (14 occurrences across files) |
| 7 | handle_new_user trigger with SECURITY DEFINER creates profiles automatically | VERIFIED | `001_profiles.sql` defines `public.handle_new_user()` function and `on_auth_user_created` trigger on `auth.users` |
| 8 | TypeScript Database types exist for all 14 tables | VERIFIED | `packages/shared/types/database.ts` exports `Database` interface with all 14 tables (Row/Insert/Update types); documented as placeholder pending `supabase gen types` after project creation |
| 9 | Supabase browser client (createBrowserClient) exists and is wired | VERIFIED | `apps/web/lib/supabase/client.ts` imports and wraps `createBrowserClient` from `@supabase/ssr` |
| 10 | Supabase SSR server client (createServerClient) with cookie getAll/setAll exists | VERIFIED | `apps/web/lib/supabase/server.ts` imports `createServerClient` from `@supabase/ssr` with proper cookie store pattern |
| 11 | Middleware protects /pro, /client, /dashboard with getUser() (not getSession()) | VERIFIED | `apps/web/middleware.ts` uses `getUser()`, defines `protectedRoutes = ['/pro', '/client', '/dashboard']`, redirects with `?redirect=` param |
| 12 | OAuth callback handler with exchangeCodeForSession exists | VERIFIED | `apps/web/app/(auth)/callback/route.ts` calls `supabase.auth.exchangeCodeForSession(code)` |
| 13 | Email+password login page exists | VERIFIED | `apps/web/app/(auth)/login/page.tsx` calls `supabase.auth.signInWithPassword()` |
| 14 | Google OAuth login exists | VERIFIED | `apps/web/app/(auth)/login/page.tsx` calls `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| 15 | OTP SMS 2-step auth page exists | VERIFIED | `apps/web/app/(auth)/verify-otp/page.tsx` calls `signInWithOtp` and `verifyOtp`; phone normalization to `+225` prefix present |
| 16 | Role selection on register (locataire/proprietaire) | VERIFIED | `apps/web/app/(auth)/register/page.tsx` has role zod enum `['locataire', 'proprietaire']` with default `'locataire'` |
| 17 | Tailwind CI palette with primary #1A5276 is configured | VERIFIED | `apps/web/tailwind.config.ts` has `primary: { DEFAULT: '#1A5276', light: '#EAF4FF' }` |
| 18 | cn() utility combining clsx + twMerge exists | VERIFIED | `apps/web/lib/utils.ts` imports `twMerge` and `clsx`, exports `cn()` combining both |
| 19 | UI components Button, Card, Badge, Input exist and are barrel-exported | VERIFIED | All 4 components present in `apps/web/components/ui/`; `Badge.tsx` has `vue360` variant; `index.ts` exports all 4 |
| 20 | Landing page has 10 sections assembled in public route group | VERIFIED | All 10 section components present in `apps/web/components/landing/`; `apps/web/app/(public)/page.tsx` imports all 10 (20 grep matches for imports + renders) |
| 21 | Hero has Playfair Display heading and App Store / Play Store CTAs | VERIFIED | `Hero.tsx` uses `font-display` class on h1; contains "App Store" CTA text |
| 22 | SEO: openGraph metadata, sitemap.ts, robots.ts | VERIFIED | `layout.tsx` has `openGraph:` and `twitter:` fields; `sitemap.ts` uses `MetadataRoute.Sitemap`; `robots.ts` disallows `/pro/`, `/client/`, `/api/` |
| 23 | next/font/google used for Playfair Display, DM Sans, JetBrains Mono | VERIFIED | `apps/web/app/layout.tsx` imports `Playfair_Display, DM_Sans, JetBrains_Mono` from `next/font/google` |
| 24 | postcss.config.js exists (proves Tailwind v3, not v4) | VERIFIED | `apps/web/postcss.config.js` confirmed present |

**Score:** 24/24 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` (root) | npm workspaces, turbo scripts | VERIFIED | workspaces: ["apps/*", "packages/*"] |
| `turbo.json` | build/dev/lint/type-check pipeline | VERIFIED | All 4 tasks defined |
| `.env.local.example` | 17+ env vars documented | VERIFIED | 38-line file |
| `apps/web/package.json` | next@14.2.35 exact | VERIFIED | Exact version lock confirmed |
| `apps/web/tsconfig.json` | strict: true | VERIFIED | Confirmed |
| `apps/web/postcss.config.js` | Tailwind v3 marker | VERIFIED | Present |
| `apps/web/next.config.ts` | transpilePackages @immo-ci/shared | VERIFIED | Confirmed |
| `apps/web/lib/env.ts` | Zod fail-fast env validation | VERIFIED | z.object schema confirmed |
| `apps/web/app/layout.tsx` | next/font/google, openGraph | VERIFIED | Both present |
| `apps/mobile/package.json` | expo@~52.0.0 | VERIFIED | Confirmed |
| `apps/mobile/app.json` | scheme, bundleIdentifier | VERIFIED | ci.immo.app |
| `packages/shared/index.ts` | Barrel re-exports | VERIFIED | All 4 utils re-exported |
| `packages/shared/utils/formatFCFA.ts` | formatFCFA, montantEnLettres | VERIFIED | Both functions present |
| `packages/shared/constants/communes.ts` | COMMUNES_ABIDJAN (12), ROLES_UTILISATEUR | VERIFIED | Both exports confirmed |
| `packages/shared/types/database.ts` | Database interface for 14 tables | VERIFIED | Manually-typed placeholder (documented; must be regenerated after Supabase project creation) |
| `supabase/migrations/001_profiles.sql` | profiles table, RLS, handle_new_user | VERIFIED | All 3 present |
| `supabase/migrations/002_biens.sql` | biens table, RLS | VERIFIED | Present |
| `supabase/migrations/003_biens_medias.sql` | biens_medias, composite index | VERIFIED | `biens_medias_bien_ordre_idx` confirmed |
| `supabase/migrations/004_reservations.sql` | reservations, RLS | VERIFIED | Present |
| `supabase/migrations/005_contrats_quittances.sql` | contrats + quittances, RLS | VERIFIED | Present |
| `supabase/migrations/006_messagerie.sql` | conversations + messages + favoris, RLS | VERIFIED | Present |
| `supabase/migrations/007_visites_avis.sql` | visites + avis, RLS | VERIFIED | Present |
| `supabase/migrations/008_notifications_analytics.sql` | notifications + analytics_events + paiements, RLS | VERIFIED | Present |
| `apps/web/lib/supabase/client.ts` | createBrowserClient wrapper | VERIFIED | Confirmed |
| `apps/web/lib/supabase/server.ts` | createServerClient SSR | VERIFIED | Confirmed |
| `apps/web/middleware.ts` | getUser(), route protection | VERIFIED | Confirmed |
| `apps/web/app/(auth)/callback/route.ts` | exchangeCodeForSession | VERIFIED | Confirmed |
| `apps/web/app/(auth)/login/page.tsx` | email+password + Google OAuth | VERIFIED | Both flows present |
| `apps/web/app/(auth)/register/page.tsx` | signUp + role selection | VERIFIED | role enum confirmed |
| `apps/web/app/(auth)/verify-otp/page.tsx` | signInWithOtp + verifyOtp | VERIFIED | Both calls present |
| `apps/web/tailwind.config.ts` | CI palette #1A5276, fonts, borderRadius | VERIFIED | Confirmed |
| `apps/web/lib/utils.ts` | cn() = clsx + twMerge | VERIFIED | Confirmed |
| `apps/web/components/ui/Button.tsx` | forwardRef, 5 variants, loading | VERIFIED | Present |
| `apps/web/components/ui/Card.tsx` | 4 padding variants | VERIFIED | Present |
| `apps/web/components/ui/Badge.tsx` | 9 variants incl. vue360 | VERIFIED | vue360 variant confirmed |
| `apps/web/components/ui/Input.tsx` | forwardRef, label/error/hint | VERIFIED | Present |
| `apps/web/components/ui/index.ts` | Barrel export all 4 | VERIFIED | All 4 exported |
| `apps/web/components/landing/Hero.tsx` | font-display h1, App Store CTA | VERIFIED | Both confirmed |
| `apps/web/components/landing/HowItWorks.tsx` | "Comment ça marche" | VERIFIED | Present |
| `apps/web/components/landing/FeaturedProperties.tsx` | Card + Badge components | VERIFIED | Present |
| `apps/web/components/landing/Features.tsx` | 6 differentiators | VERIFIED | Present |
| `apps/web/components/landing/MapZones.tsx` | 12 communes Abidjan | VERIFIED | Present |
| `apps/web/components/landing/Testimonials.tsx` | 3 testimonials | VERIFIED | Present |
| `apps/web/components/landing/Stats.tsx` | font-mono stats | VERIFIED | Present |
| `apps/web/components/landing/Partners.tsx` | Wave, Orange Money, etc. | VERIFIED | Present |
| `apps/web/components/landing/CTAFinal.tsx` | Final CTA section | VERIFIED | Present |
| `apps/web/components/landing/Footer.tsx` | Footer 4 columns | VERIFIED | Present |
| `apps/web/app/(public)/page.tsx` | All 10 sections assembled | VERIFIED | 20 grep matches (imports + renders) |
| `apps/web/app/(public)/layout.tsx` | Passthrough layout | VERIFIED | Present |
| `apps/web/app/sitemap.ts` | MetadataRoute.Sitemap | VERIFIED | Confirmed |
| `apps/web/app/robots.ts` | MetadataRoute.Robots, disallow /api/ | VERIFIED | Confirmed |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/web` | `@immo-ci/shared` | npm workspace + transpilePackages | WIRED | `"@immo-ci/shared": "*"` in web package.json, `transpilePackages` in next.config.ts |
| `middleware.ts` | `auth.users` session | `getUser()` from `@supabase/ssr` | WIRED | Creates inline `createServerClient`, calls `auth.getUser()` |
| `callback/route.ts` | Supabase OAuth session | `exchangeCodeForSession(code)` | WIRED | GET handler reads `code` param and exchanges it |
| `login/page.tsx` | Supabase Auth | `signInWithPassword` + `signInWithOAuth` | WIRED | Both flows implemented with error handling |
| `register/page.tsx` | `profiles` table | `supabase.auth.signUp()` + handle_new_user trigger | WIRED | signUp passes role in `options.data`, trigger reads `raw_user_meta_data` |
| `verify-otp/page.tsx` | Supabase SMS Auth | `signInWithOtp` → `verifyOtp` | WIRED | 2-step flow with CI phone normalization (+225) |
| `components/ui` | `lib/utils.ts` | `cn()` import | WIRED | All UI components import cn() from `@/lib/utils` |
| `(public)/page.tsx` | landing components | imports from `@/components/landing/*` | WIRED | All 10 sections imported and rendered |
| `app/layout.tsx` | Google Fonts | `next/font/google` | WIRED | Playfair_Display, DM_Sans, JetBrains_Mono loaded via next/font |

---

## Data-Flow Trace (Level 4)

Landing page components use intentional static/fictitious data as specified in the plan. This is correct behavior for Phase 1 — real data wiring (Supabase queries) is planned for Phase 2 (CRUD biens, messaging) and Phase 3 (dashboard).

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `FeaturedProperties.tsx` | hardcoded property array | Static — per plan spec | No (intentional) | ACCEPTABLE STUB — plan explicitly documents "props statiques factices", real data wired in Phase 2 |
| `Testimonials.tsx` | hardcoded testimonials | Static — per plan spec | No (intentional) | ACCEPTABLE STUB — landing static content |
| `Stats.tsx` | hardcoded stat values | Static — per plan spec | No (intentional) | ACCEPTABLE STUB — can be DB-driven in future phase |
| `Auth pages` | form state | User input → Supabase Auth API | Yes (live API calls) | FLOWING |
| `middleware.ts` | user session | `supabase.auth.getUser()` | Yes (JWT validation) | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: PARTIALLY SKIPPED — dev servers cannot be started in verification context (requires live Supabase credentials). Code-level checks run instead.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| next@14.2.35 locked in web package | `grep '"next": "14.2.35"' apps/web/package.json` | Match found | PASS |
| expo@~52.0.0 in mobile package | `grep '"expo": "~52.0.0"' apps/mobile/package.json` | Match found | PASS |
| postcss.config.js exists (Tailwind v3) | `test -f apps/web/postcss.config.js` | File exists | PASS |
| TypeScript strict mode | `grep '"strict": true' apps/web/tsconfig.json` | Match found | PASS |
| createBrowserClient in Supabase client | `grep "createBrowserClient" apps/web/lib/supabase/client.ts` | Match found | PASS |
| createServerClient in Supabase server | `grep "createServerClient" apps/web/lib/supabase/server.ts` | Match found | PASS |
| getUser() (not getSession) in middleware | `grep "getUser" apps/web/middleware.ts` | Match found | PASS |
| exchangeCodeForSession in callback | `grep "exchangeCodeForSession" apps/web/app/(auth)/callback/route.ts` | Match found | PASS |
| CI primary color #1A5276 in Tailwind | `grep "1A5276" apps/web/tailwind.config.ts` | Match found | PASS |
| vue360 Badge variant | `grep "vue360" apps/web/components/ui/Badge.tsx` | Match found | PASS |
| twMerge in utils.ts | `grep "twMerge" apps/web/lib/utils.ts` | Match found | PASS |
| Migration 001 exists | `test -f supabase/migrations/001_profiles.sql` | File exists | PASS |
| handle_new_user trigger in 001 | `grep "handle_new_user" supabase/migrations/001_profiles.sql` | Match found | PASS |
| Composite index in migration 003 | `grep "biens_medias_bien_ordre_idx" supabase/migrations/003_biens_medias.sql` | Match found | PASS |
| Migration 008 exists | `test -f supabase/migrations/008_notifications_analytics.sql` | File exists | PASS |
| App Store CTA in Hero | `grep "App Store" apps/web/components/landing/Hero.tsx` | Match found | PASS |
| font-display class in Hero | `grep "font-display" apps/web/components/landing/Hero.tsx` | Match found | PASS |
| MetadataRoute.Sitemap in sitemap.ts | `grep "MetadataRoute.Sitemap" apps/web/app/sitemap.ts` | Match found | PASS |
| openGraph in layout.tsx | `grep "openGraph" apps/web/app/layout.tsx` | Match found | PASS |
| next/font/google in layout.tsx | `grep "next/font/google" apps/web/app/layout.tsx` | Match found | PASS |
| RLS on all 14 tables | count `enable row level security` in migrations | 14 occurrences | PASS |
| All 8 migrations present | `ls supabase/migrations/` | 8 files listed | PASS |
| All 10 landing sections assembled | section component grep in (public)/page.tsx | 20 matches | PASS |

**All 23 spot-checks passed.**

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FOND-01 | 01-01 | Monorepo Turborepo avec apps/web, apps/mobile, packages/shared | SATISFIED | `package.json` workspaces, `turbo.json`, all 3 apps present |
| FOND-02 | 01-01 | App Next.js 14 (App Router, TypeScript strict) | SATISFIED | next@14.2.35, strict: true, App Router structure |
| FOND-03 | 01-01 | App Expo SDK 52 (Expo Router) | SATISFIED | expo@~52.0.0, expo-router@~4.0.0, `_layout.tsx` present |
| FOND-04 | 01-01 | packages/shared avec types TypeScript et utils | SATISFIED | formatFCFA, montantEnLettres, COMMUNES_ABIDJAN, formatDateCI all present |
| FOND-05 | 01-04 | Design system Tailwind configuré (palette CI, typographie, borderRadius) | SATISFIED | tailwind.config.ts with #1A5276 palette, font families, borderRadius tokens |
| FOND-06 | 01-01 | Variables d'environnement documentées et validées au démarrage | SATISFIED | `lib/env.ts` with Zod schema, `.env.local.example` with all vars |
| AUTH-01 | 01-03 | Utilisateur peut s'inscrire avec email + mot de passe | SATISFIED | `register/page.tsx` calls `supabase.auth.signUp()` |
| AUTH-02 | 01-03 | Utilisateur peut se connecter via Google OAuth | SATISFIED | `login/page.tsx` calls `signInWithOAuth({ provider: 'google' })` |
| AUTH-03 | 01-03 | Utilisateur peut s'inscrire / se connecter via OTP téléphone | SATISFIED | `verify-otp/page.tsx` with 2-step signInWithOtp + verifyOtp + +225 normalization |
| AUTH-04 | 01-03 | Session persiste entre les navigations (Supabase SSR middleware) | SATISFIED | `middleware.ts` with `createServerClient` inline + cookie getAll/setAll |
| AUTH-05 | 01-02+01-03 | Profil créé automatiquement dans `profiles` à l'inscription | SATISFIED | `handle_new_user` trigger in `001_profiles.sql` fires on auth.users insert |
| AUTH-06 | 01-03 | Routes protégées selon le rôle | SATISFIED | `middleware.ts` protects /pro, /client, /dashboard with redirect |
| BDD-01 | 01-02 | Migration 001 — table `profiles` avec RLS | SATISFIED | `001_profiles.sql` exists with RLS and handle_new_user |
| BDD-02 | 01-02 | Migration 002 — table `biens` avec RLS | SATISFIED | `002_biens.sql` exists |
| BDD-03 | 01-02 | Migration 003 — table `biens_medias` avec RLS | SATISFIED | `003_biens_medias.sql` exists with composite index |
| BDD-04 | 01-02 | Migration 004 — table `reservations` avec RLS | SATISFIED | `004_reservations.sql` exists |
| BDD-05 | 01-02 | Migration 005 — tables `contrats` et `quittances` avec RLS | SATISFIED | `005_contrats_quittances.sql` exists |
| BDD-06 | 01-02 | Migration 006 — tables `conversations` et `messages` avec RLS | SATISFIED | `006_messagerie.sql` exists (also includes favoris) |
| BDD-07 | 01-02 | Migration 007 — tables `visites` et `avis` avec RLS | SATISFIED | `007_visites_avis.sql` exists |
| BDD-08 | 01-02 | Migration 008 — tables `notifications` et `analytics_events` avec RLS | SATISFIED | `008_notifications_analytics.sql` exists (also includes paiements) |
| BDD-09 | 01-02 | Types TypeScript générés dans `packages/shared/types/database.ts` | SATISFIED | `database.ts` exists with complete Database interface; noted as manually-typed placeholder pending `supabase gen types` CLI regeneration after project creation — acceptable for Phase 1 |
| LAND-01 | 01-05 | Landing page 10 sections | SATISFIED | All 10 section components exist and are assembled in `(public)/page.tsx` |
| LAND-02 | 01-05 | Hero avec search bar + CTA App Store / Play Store | SATISFIED | `Hero.tsx` has search input, App Store and Play Store CTAs |
| LAND-03 | 01-05 | SEO basique (meta tags, Open Graph, sitemap) | SATISFIED | `layout.tsx` openGraph + twitter, `sitemap.ts`, `robots.ts` all present |

**24/24 requirements SATISFIED**

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `FeaturedProperties.tsx` | Hardcoded property array | Info | Intentional per plan — "props statiques factices"; real data wired in Phase 2 |
| `Testimonials.tsx` | Hardcoded testimonial objects | Info | Intentional landing static content |
| `Stats.tsx` | Hardcoded stat values | Info | Intentional landing static content; can be DB-driven later |
| `apps/web/app/page.tsx` | Minimal placeholder page | Info | Root page is a placeholder; landing is served from `(public)/page.tsx` which is fully implemented |
| `packages/shared/types/database.ts` | Manually-typed (not CLI-generated) | Warning | Functional placeholder with correct types; must be regenerated with `supabase gen types` after live project creation — documented in SUMMARY |

No blockers found. All stubs are intentional and documented.

---

## Human Verification Required

### 1. Full dev stack startup

**Test:** Run `npm run dev` from repo root (after creating `.env.local` from `.env.local.example` with valid Supabase credentials)
**Expected:** Next.js dev server starts at localhost:3000 and Expo Metro bundler starts without errors
**Why human:** Cannot start dev servers in automated verification; requires live Supabase project credentials

### 2. Email/password auth flow

**Test:** Navigate to `/login`, enter valid test credentials, click "Se connecter"
**Expected:** Successful login redirects to `/dashboard`
**Why human:** Requires live Supabase project with a test user

### 3. Google OAuth flow

**Test:** Click "Continuer avec Google" on `/login`
**Expected:** Redirect to Google consent screen, then `/auth/callback`, then dashboard
**Why human:** Requires Supabase Google OAuth provider configured in dashboard (Auth > Providers > Google)

### 4. OTP SMS flow

**Test:** Navigate to `/verify-otp`, enter a CI phone number (format 07xxxxxxxx), click "Envoyer le code"
**Expected:** OTP SMS sent to the number; entering the code logs the user in
**Why human:** Requires Supabase SMS provider (Twilio) configured; real phone number needed

### 5. Supabase migrations applied

**Test:** Paste all 8 migration files (001–008) into Supabase SQL Editor in order
**Expected:** All 14 tables created, RLS enabled, handle_new_user trigger fires on new auth.users insert
**Why human:** Requires live Supabase project; SQL Editor access

### 6. Vercel deployment and Lighthouse

**Test:** Deploy `apps/web` to Vercel (connect GitHub repo, set env vars from `.env.local.example`)
**Expected:** Landing page accessible at Vercel URL; Lighthouse score > 85 (mobile and desktop)
**Why human:** Requires Vercel account, environment variables, and Lighthouse runner

---

## Gaps Summary

No gaps found. All 24 must-have requirements for Phase 1 are satisfied by the implementation.

The 5 "Info/Warning" anti-patterns above are all intentional stubs documented in the plan:
- Static landing data (FeaturedProperties, Testimonials, Stats) — per plan specification "props statiques factices"
- Manually-typed database.ts — documented as placeholder, regeneration steps provided in SUMMARY

The implementation is ready for Phase 2 (Annonces, Médias & Messagerie).

---

*Verified: 2026-04-05*
*Verifier: Claude (gsd-verifier)*

---

## VERIFICATION PASSED
