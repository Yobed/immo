---
phase: 01-fondations-infrastructure
plan: 03
subsystem: auth
tags: [supabase, ssr, oauth, google, otp, sms, nextjs, middleware, cookie, jwt]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 14 App Router monorepo with @immo-ci/shared package
  - phase: 01-02
    provides: Supabase migrations with profiles table and handle_new_user trigger

provides:
  - Supabase browser client (createBrowserClient) at apps/web/lib/supabase/client.ts
  - Supabase SSR server client (createServerClient + cookie handling) at apps/web/lib/supabase/server.ts
  - Next.js middleware with getUser() auth and role-based route protection
  - OAuth + email magic link callback handler at /auth/callback
  - Login page with email/password + Google OAuth (French UI)
  - Register page with signUp and role selection (locataire/proprietaire)
  - OTP SMS 2-step verification page (signInWithOtp + verifyOtp)

affects: [dashboard, pro-routes, client-routes, profile, any server component needing auth]

# Tech tracking
tech-stack:
  added:
    - "@supabase/ssr 0.10.0 — SSR-safe Supabase client (replaces deprecated auth-helpers-nextjs)"
    - "@hookform/resolvers ^3.9.0 — zodResolver for react-hook-form + zod integration"
  patterns:
    - "Always getUser() server-side, never getSession() (security: validates JWT)"
    - "createServerClient inline in middleware (official @supabase/ssr pattern)"
    - "Cookie getAll/setAll pattern for SSR session persistence"
    - "Auth route group (auth) in Next.js App Router"
    - "OAuth redirectTo: ${origin}/auth/callback pattern"
    - "OTP: signInWithOtp(phone) → verifyOtp(phone, token, type: 'sms') 2-step flow"

key-files:
  created:
    - apps/web/lib/supabase/client.ts
    - apps/web/lib/supabase/server.ts
    - apps/web/middleware.ts
    - apps/web/app/(auth)/callback/route.ts
    - apps/web/app/(auth)/login/page.tsx
    - apps/web/app/(auth)/register/page.tsx
    - apps/web/app/(auth)/verify-otp/page.tsx
  modified:
    - apps/web/package.json (added @hookform/resolvers)

key-decisions:
  - "Use @supabase/ssr (not deprecated @supabase/auth-helpers-nextjs) — only stable SSR option for Next.js 14 App Router"
  - "Always getUser() server-side — getSession() reads from cookie without JWT validation (security risk)"
  - "createServerClient inline in middleware, not importing from lib/supabase/server — official @supabase/ssr pattern required for cookie mutation"
  - "Protect /pro, /client, /dashboard routes in middleware with redirect to /login?redirect=<original_path>"
  - "Google OAuth redirectTo: ${origin}/auth/callback using window.location.origin (client-side)"
  - "OTP phone normalization: 07xxxxxxxx → +22507xxxxxxxx for Cote d'Ivoire numbers"

patterns-established:
  - "SSR Client pattern: createClient() in server.ts async function returning cookieStore-bound client"
  - "Browser Client pattern: createClient() in client.ts as thin wrapper over createBrowserClient"
  - "Middleware pattern: createServerClient inline with request.cookies.getAll() and supabaseResponse.cookies.set()"
  - "Auth pages: 'use client' components calling createClient() from @/lib/supabase/client"
  - "Form validation: react-hook-form + zod + zodResolver pattern for all auth forms"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06]

# Metrics
duration: 18min
completed: 2026-04-06
---

# Phase 01 Plan 03: Auth & Profils Summary

**Supabase SSR auth with email/password, Google OAuth, and OTP SMS via @supabase/ssr — middleware route protection, callback handler, and 3 French-language auth pages**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-06T01:54:24Z
- **Completed:** 2026-04-06T02:12:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- SSR-safe Supabase clients (browser + server) using @supabase/ssr with proper cookie getAll/setAll pattern
- Next.js middleware with secure getUser() validation and protection of /pro, /client, /dashboard routes
- Complete auth page set in French: login (email+Google), register (role selection), OTP SMS (2-step), callback (OAuth/magic link)

## Task Commits

Each task was committed atomically:

1. **Task 1: Clients Supabase SSR** - `7469388` (feat)
2. **Task 2: Middleware SSR** - `f199fee` (feat)
3. **Task 3: Pages auth (login, register, callback, OTP)** - `5761e9c` (feat)

**Plan metadata:** _(see final docs commit)_

## Self-Check: PASSED

- All 7 source files confirmed on disk
- SUMMARY.md confirmed on disk
- All 3 task commits verified in git history (7469388, f199fee, 5761e9c)

## Files Created/Modified

- `apps/web/lib/supabase/client.ts` - createBrowserClient wrapper for client components
- `apps/web/lib/supabase/server.ts` - Async createServerClient with cookie store for RSC/API routes
- `apps/web/middleware.ts` - SSR middleware: createServerClient inline, getUser() auth, route protection
- `apps/web/app/(auth)/callback/route.ts` - GET handler: exchangeCodeForSession for OAuth + magic link
- `apps/web/app/(auth)/login/page.tsx` - Email+password login + Google OAuth button (French)
- `apps/web/app/(auth)/register/page.tsx` - signUp with full_name, email, password, role (French)
- `apps/web/app/(auth)/verify-otp/page.tsx` - 2-step OTP: phone input → signInWithOtp → code input → verifyOtp (French)
- `apps/web/package.json` - Added @hookform/resolvers (required by zodResolver)

## Decisions Made

- Used `createServerClient` inline in middleware (not imported from lib/supabase/server) — this is the official @supabase/ssr pattern required for cookie mutation during middleware execution
- `getUser()` everywhere server-side, never `getSession()` — getSession reads from cookie without JWT validation, creating a security bypass risk
- OTP phone normalization logic: converts `07xxxxxxxx` to `+22507xxxxxxxx` for Cote d'Ivoire numbers
- handle_new_user trigger NOT recreated — already present in supabase/migrations/001_profiles.sql

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @hookform/resolvers to package.json**
- **Found during:** Task 3 (login and register pages)
- **Issue:** Both auth forms use `zodResolver` from `@hookform/resolvers/zod` — the package was not in package.json, which would cause import failure at build time
- **Fix:** Added `"@hookform/resolvers": "^3.9.0"` to dependencies in apps/web/package.json
- **Files modified:** apps/web/package.json
- **Verification:** Package listed alongside react-hook-form and zod (which are already installed)
- **Committed in:** 5761e9c (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking dependency)
**Impact on plan:** Essential for zodResolver to work. No scope creep.

## Issues Encountered

- The plan references `@packages/shared/types/database` as an import path, but the tsconfig only has `@/*` mapped to `./` (no `@packages` alias). Used `@immo-ci/shared/types/database` instead — the correct workspace package name with moduleResolution: bundler allowing sub-path imports.

## User Setup Required

None - no external service configuration required for these files. Supabase project credentials (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) must be set in `.env.local` before running the app (covered by plan 01-01 setup).

Google OAuth provider and SMS/OTP provider must be configured in the Supabase dashboard (Auth > Providers) before the corresponding auth flows will work.

## Next Phase Readiness

- Auth clients ready for use in any Server Component, Route Handler, or Client Component
- Middleware active — protected routes will redirect unauthenticated users to /login
- handle_new_user trigger in 001_profiles.sql will auto-create profile on any signUp or OAuth sign-in
- Ready for: dashboard pages, property listing flows, and any feature requiring auth context

---
*Phase: 01-fondations-infrastructure*
*Completed: 2026-04-06*
