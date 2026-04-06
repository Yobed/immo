---
phase: 01-fondations-infrastructure
plan: 01
subsystem: infra
tags: [turborepo, next.js, expo, typescript, tailwindcss, zod, supabase, monorepo]

requires: []

provides:
  - Turborepo monorepo with npm workspaces (apps/*, packages/*)
  - Next.js 14.2.35 app (apps/web) with TypeScript strict, Tailwind v3, postcss
  - Expo SDK 52 app (apps/mobile) with expo-router
  - packages/shared with formatFCFA, montantEnLettres, formatDateCI, COMMUNES_ABIDJAN
  - Zod env validation (fail-fast on missing vars) in apps/web/lib/env.ts
  - CSS design system variables (--primary, --secondary, --accent, --surface, etc.)
  - next/font/google integration (Playfair Display, DM Sans, JetBrains Mono)

affects:
  - 01-02-supabase (imports @immo-ci/shared types)
  - 01-03-auth (uses apps/web Next.js App Router, @supabase/ssr)
  - 01-04-design-system (extends apps/web Tailwind config and globals.css)
  - 01-05-landing-page (uses layout.tsx, fonts, design system)
  - all future phases (depend on monorepo workspace resolution)

tech-stack:
  added:
    - turbo@2.9.3
    - next@14.2.35 (exact lock, no caret)
    - react@18.3.1, react-dom@18.3.1
    - expo@~52.0.0, expo-router@~4.0.0
    - "@supabase/supabase-js@2.101.1, @supabase/ssr@0.10.0"
    - zod@4.3.6
    - react-hook-form@7.72.1
    - date-fns@4.1.0 (apps/web only)
    - tailwindcss@^3.4.17 (v3, not v4)
    - postcss@^8.4.0, autoprefixer@^10.4.0
    - clsx@^2.1.0, tailwind-merge@^2.3.0 (apps/web)
    - typescript@6.0.2 (all packages)
  patterns:
    - npm workspaces for monorepo dependency resolution
    - Workspace reference pattern via "@immo-ci/shared": "*"
    - Fail-fast env validation via zod.parse(process.env) at module load
    - next/font/google for performance (never @import CSS for fonts)
    - Intl.DateTimeFormat / Intl.RelativeTimeFormat in packages/shared (no external dep)

key-files:
  created:
    - package.json (root — npm workspaces, turbo scripts)
    - turbo.json (build/dev/lint/type-check pipeline)
    - .gitignore
    - .env.local.example (all 17 env vars from skills.md section 11)
    - apps/web/package.json (next@14.2.35 exact lock)
    - apps/web/tsconfig.json (strict: true, moduleResolution: bundler)
    - apps/web/next.config.ts (transpilePackages, remotePatterns)
    - apps/web/postcss.config.js (proves Tailwind v3)
    - apps/web/lib/env.ts (zod env schema, exports env)
    - apps/web/app/layout.tsx (Playfair Display + DM Sans + JetBrains Mono via next/font/google)
    - apps/web/app/globals.css (CSS variables design system)
    - apps/web/app/page.tsx (minimal placeholder)
    - apps/mobile/package.json (expo@~52.0.0)
    - apps/mobile/tsconfig.json (extends expo/tsconfig.base, strict)
    - apps/mobile/app.json (scheme, bundleIdentifier: ci.immo.app)
    - apps/mobile/app/_layout.tsx (Expo Router Stack)
    - packages/shared/package.json (name: @immo-ci/shared)
    - packages/shared/tsconfig.json (strict: true)
    - packages/shared/index.ts (re-exports all utilities)
    - packages/shared/types/index.ts (PaginatedResponse, ApiError, type re-exports)
    - packages/shared/constants/communes.ts (12 COMMUNES_ABIDJAN, TYPES_BIEN, ROLES_UTILISATEUR)
    - packages/shared/utils/formatFCFA.ts (formatFCFA, montantEnLettres)
    - packages/shared/utils/formatDate.ts (formatDateCI, formatDateRelative via Intl)
  modified: []

key-decisions:
  - "next@14.2.35 locked exactly (no ^) — prevents accidental upgrade to Next.js 15/16 breaking App Router APIs"
  - "Tailwind CSS v3 (^3.4.17) not v4 — v4 removed tailwind.config.ts, design system in skills.md uses v3 syntax"
  - "Expo SDK 52 (not 51 as in skills.md) — SDK 52+ has auto monorepo detection, eliminates Metro config"
  - "packages/shared uses Intl.DateTimeFormat not date-fns — shared package has no date-fns dependency"
  - "clsx and tailwind-merge added to apps/web — required by plan 01-04 design system components"

patterns-established:
  - "Env validation: z.parse(process.env) at module load in lib/env.ts — fails startup if vars missing"
  - "Font loading: next/font/google with CSS variables (--font-display, --font-sans, --font-mono)"
  - "Shared package: packages/shared exports via index.ts barrel file, no external runtime deps"
  - "Workspace reference: @immo-ci/shared: * in apps, transpilePackages in next.config.ts"

requirements-completed:
  - FOND-01
  - FOND-02
  - FOND-03
  - FOND-04
  - FOND-06

duration: 5min
completed: 2026-04-06
---

# Phase 1 Plan 01: Monorepo Initialization Summary

**Turborepo monorepo with Next.js 14.2.35 (locked), Expo SDK 52, packages/shared (formatFCFA, COMMUNES_ABIDJAN, Intl date utils), zod env validation, and Tailwind v3 postcss setup**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-06T01:38:14Z
- **Completed:** 2026-04-06T01:43:51Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments

- Monorepo root with npm workspaces (apps/*, packages/*) and Turborepo 2.9.3 pipeline
- Next.js 14.2.35 (exact lock) with TypeScript strict, Tailwind v3, postcss.config.js, zod env validation
- Expo SDK 52 app with expo-router, auto monorepo detection (no Metro config needed)
- packages/shared (@immo-ci/shared) with formatFCFA, montantEnLettres, 12 communes d'Abidjan, Intl date formatters

## Task Commits

Each task was committed atomically:

1. **Task 1: Turborepo root and apps/web Next.js 14** - `5b4785a` (feat)
2. **Task 2: Expo SDK 52 and packages/shared** - `68c17df` (feat)
3. **npm install lockfile** - `156670c` (chore)

## Files Created/Modified

- `package.json` - Root workspace with npm workspaces and turbo scripts
- `turbo.json` - Turborepo pipeline (build/dev/lint/type-check)
- `.gitignore` - node_modules, .next, .env.local, .turbo, dist
- `.env.local.example` - All 17 env vars from skills.md (Supabase, Cloudinary, CinetPay, Claude, n8n, Firebase, WhatsApp)
- `apps/web/package.json` - next@14.2.35 (exact), all runtime deps including clsx, tailwind-merge
- `apps/web/tsconfig.json` - TypeScript strict mode, moduleResolution: bundler
- `apps/web/next.config.ts` - transpilePackages: [@immo-ci/shared], remotePatterns
- `apps/web/postcss.config.js` - Tailwind v3 postcss plugin (proves v3, not v4)
- `apps/web/lib/env.ts` - Zod env schema with fail-fast validation
- `apps/web/app/layout.tsx` - Playfair Display + DM Sans + JetBrains Mono via next/font/google
- `apps/web/app/globals.css` - Tailwind directives + CSS design system variables
- `apps/web/app/page.tsx` - Minimal placeholder page
- `apps/mobile/package.json` - expo@~52.0.0, expo-router@~4.0.0
- `apps/mobile/tsconfig.json` - Extends expo/tsconfig.base, strict: true
- `apps/mobile/app.json` - CI bundle identifiers, expo-router plugin
- `apps/mobile/app/_layout.tsx` - Expo Router Stack root layout
- `packages/shared/package.json` - @immo-ci/shared, no runtime deps
- `packages/shared/tsconfig.json` - strict: true, ES2017 target
- `packages/shared/index.ts` - Barrel re-export of all utilities
- `packages/shared/types/index.ts` - PaginatedResponse<T>, ApiError, type re-exports
- `packages/shared/constants/communes.ts` - 12 COMMUNES_ABIDJAN, QUARTIERS_PREMIUM, TYPES_BIEN, ROLES_UTILISATEUR
- `packages/shared/utils/formatFCFA.ts` - formatFCFA (Intl.NumberFormat), montantEnLettres (fr contract use)
- `packages/shared/utils/formatDate.ts` - formatDateCI, formatDateRelative (Intl.DateTimeFormat, no date-fns)

## Decisions Made

- **next@14.2.35 exact lock** — prevents accidental upgrade to Next.js 15/16 which has breaking App Router API changes (async params, Turbopack by default). Removed caret as specified.
- **Tailwind CSS v3 not v4** — v4 is CSS-first and removes tailwind.config.ts. The design system in skills.md uses v3 config syntax. postcss.config.js proves v3 is active.
- **Expo SDK 52 instead of 51** — skills.md mentions SDK 51 but RESEARCH.md explicitly recommends SDK 52+ for auto monorepo detection, eliminating Metro configuration.
- **packages/shared uses Intl.DateTimeFormat not date-fns** — date-fns is only in apps/web (as specified in important_notes). packages/shared has no external runtime deps, using native Intl APIs instead.
- **clsx and tailwind-merge in apps/web** — added per important_notes constraint, required by plan 01-04 design system components.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] formatDate.ts uses Intl APIs instead of date-fns**
- **Found during:** Task 2 (packages/shared creation)
- **Issue:** Plan's formatDate.ts code imported date-fns, but packages/shared has no date-fns dependency. The plan itself noted: "Si packages/shared ne liste pas date-fns, utiliser Intl.DateTimeFormat"
- **Fix:** Implemented formatDateCI with Intl.DateTimeFormat('fr-CI') and formatDateRelative with Intl.RelativeTimeFormat('fr'), covering all use cases without external deps
- **Files modified:** packages/shared/utils/formatDate.ts
- **Verification:** No import errors, zero external runtime deps in packages/shared
- **Committed in:** 68c17df (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added clsx and tailwind-merge to apps/web**
- **Found during:** Task 1 (apps/web package.json)
- **Issue:** important_notes constraint specifies clsx@^2.1.0 and tailwind-merge@^2.3.0 must be in apps/web dependencies (needed by plan 01-04)
- **Fix:** Added both to apps/web/package.json dependencies
- **Files modified:** apps/web/package.json
- **Verification:** Listed in package.json dependencies, installed by npm install
- **Committed in:** 5b4785a (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 2 - missing critical)
**Impact on plan:** Both auto-fixes necessary per plan constraints. No scope creep.

## Issues Encountered

None — npm install succeeded, all workspace references resolved correctly.

## User Setup Required

None at this stage. When ready to run the dev server, create `.env.local` from `.env.local.example` and fill in Supabase credentials. The app will fail to start without valid `NEXT_PUBLIC_SUPABASE_URL` and other required vars (by design — fail-fast validation).

## Next Phase Readiness

- Monorepo workspace resolution ready for plan 01-02 (Supabase schema + types)
- @immo-ci/shared package available for import in apps/web and apps/mobile
- TypeScript strict mode enforced across all packages
- Design system CSS variables ready for plan 01-04 Tailwind config extension
- Env validation in place — plan 01-02 can add SUPABASE vars and they will be validated

---
*Phase: 01-fondations-infrastructure*
*Completed: 2026-04-06*
