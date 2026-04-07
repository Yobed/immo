---
phase: 02-annonces-medias-messagerie
plan: 01
subsystem: ui, api
tags: [next.js, zod, react-hook-form, supabase, tailwind, next-cloudinary, embla-carousel, mapbox, dnd-kit]

# Dependency graph
requires:
  - phase: 01-fondations-infrastructure
    provides: Supabase client, auth middleware, Tailwind design system, packages/shared types

provides:
  - BienForm 4-step wizard with Zod validation (titre, type_bien, commune, prix, equipements)
  - POST /api/biens — create with statut=brouillon
  - PATCH /api/biens/[id] — toggle statut publie/brouillon/suspendu
  - DELETE /api/biens/[id] — owner-only delete
  - BienCard component with formatFCFA, photo cover, type badge
  - /biens (public) — paginated listing server component
  - /biens/[id] (public) — full property fiche with medias, equipements
  - /biens (pro) — owner listing with statut toggle
  - /biens/nouveau (pro) — new property wizard
  - /biens/[id]/modifier (pro) — edit existing property
  - packages/shared/constants/biens.ts (TYPES_BIEN, EQUIPEMENTS_DISPONIBLES, labels)
  - packages/shared/constants/communes.ts updated (added COMMUNES_CI)

affects:
  - 02-02 (medias carousel — needs bien_id from this plan)
  - 02-03 (search/filtres — queries biens table built here)
  - 03-01 (reservations — needs bien_id and statut=publie)

# Tech tracking
tech-stack:
  added:
    - next-cloudinary@6.17.5
    - cloudinary@2.9.0
    - pannellum-react@1.2.4
    - embla-carousel-react@8.6.0
    - embla-carousel-autoplay@8.6.0
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - react-map-gl@8.1.0
    - mapbox-gl@3.21.0
    - react-dropzone@15.0.0
    - "@types/mapbox-gl (dev)"
  patterns:
    - Multi-step form with react-hook-form + zodResolver
    - Server Components for data fetching (no useEffect)
    - Client Components only for interactive elements (ToggleStatutButton)
    - supabase.from() cast to any in API routes (placeholder DB types)
    - FCFA formatting via Intl.NumberFormat('fr-CI', decimal)

key-files:
  created:
    - apps/web/components/bien/BienForm/index.tsx
    - apps/web/components/bien/BienForm/Step1Infos.tsx
    - apps/web/components/bien/BienForm/Step2Prix.tsx
    - apps/web/components/bien/BienForm/Step3Localisation.tsx
    - apps/web/components/bien/BienForm/Step4Equipements.tsx
    - apps/web/components/bien/BienCard.tsx
    - apps/web/components/bien/ToggleStatutButton.tsx
    - apps/web/app/api/biens/route.ts
    - apps/web/app/api/biens/[id]/route.ts
    - apps/web/app/(public)/biens/page.tsx
    - apps/web/app/(public)/biens/[id]/page.tsx
    - apps/web/app/(pro)/biens/page.tsx
    - apps/web/app/(pro)/biens/nouveau/page.tsx
    - apps/web/app/(pro)/biens/[id]/modifier/page.tsx
    - packages/shared/constants/biens.ts
    - packages/shared/constants/index.ts
  modified:
    - apps/web/package.json (10 new deps)
    - packages/shared/constants/communes.ts (added COMMUNES_CI, removed TYPES_BIEN)
    - packages/shared/index.ts (added constants/biens export)
    - package-lock.json

key-decisions:
  - "supabase.from() cast to any in API routes — database.ts is a placeholder; will resolve after npx supabase gen types"
  - "TYPES_BIEN moved from communes.ts to biens.ts — logical grouping, communes.ts now exports COMMUNES_CI"
  - "ToggleStatutButton extracted to client component — Server Component page can't use onClick with fetch"
  - "DB schema field names used (surface_m2, adresse_complete, charges_mois_fcfa) instead of plan names"
  - "pannellum-react installed with --legacy-peer-deps — declares peerDep react:16.x but works on React 18"

patterns-established:
  - "BienForm pattern: multi-step wizard with per-step field validation via form.trigger(fields)"
  - "Server Component data fetching pattern: async page component + supabase.auth.getUser() + redirect"
  - "API route pattern: auth check → typed body → supabase mutation → error handling"

requirements-completed: [BIEN-01, BIEN-02, BIEN-03, BIEN-04, BIEN-07]

# Metrics
duration: 134min
completed: 2026-04-07
---

# Phase 02 Plan 01: CRUD Biens — Formulaire, API et Pages Publiques Summary

**BienForm 4-step wizard (Zod + react-hook-form) + REST API CRUD biens + pages listing/fiche publique + pages pro avec toggle publication**

## Performance

- **Duration:** ~134 min (includes npm install time)
- **Started:** 2026-04-07T05:55:36Z
- **Completed:** 2026-04-07T08:09:56Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments
- Phase 2 dependencies installed in one command (10 packages: next-cloudinary, pannellum-react, embla-carousel, @dnd-kit, react-map-gl, mapbox-gl, react-dropzone, cloudinary)
- BienForm 4-step wizard: titre/type/description → prix FCFA → localisation + GPS → équipements toggle grid
- Full CRUD API: POST /api/biens (brouillon), PATCH /api/biens/[id] (statut toggle), DELETE /api/biens/[id]
- Public pages: paginated listing grid + full property fiche with media cover, prix FCFA, equipements
- Pro pages: owner dashboard listing with ToggleStatutButton, create wizard, edit with prefill

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Phase 2 deps + shared constants** - `54ee9b0` (chore)
2. **Task 2: BienForm 4 steps + API CRUD routes** - `5a91164` (feat)
3. **Task 3: BienCard + public/pro pages** - `9b5b369` (feat)

## Files Created/Modified
- `apps/web/components/bien/BienForm/index.tsx` — Orchestrator multi-step + BienSchema Zod
- `apps/web/components/bien/BienForm/Step1Infos.tsx` — Titre, type_bien radio, description, dimensions
- `apps/web/components/bien/BienForm/Step2Prix.tsx` — Prix location/vente FCFA, charges, dépôt
- `apps/web/components/bien/BienForm/Step3Localisation.tsx` — Commune select, quartier, GPS coords
- `apps/web/components/bien/BienForm/Step4Equipements.tsx` — Toggle grid 11 équipements
- `apps/web/components/bien/BienCard.tsx` — Card avec formatFCFA, photo, type badge
- `apps/web/components/bien/ToggleStatutButton.tsx` — Client component publie/brouillon toggle
- `apps/web/app/api/biens/route.ts` — POST: insert statut=brouillon
- `apps/web/app/api/biens/[id]/route.ts` — PATCH statut + DELETE avec proprietaire_id check
- `apps/web/app/(public)/biens/page.tsx` — Liste paginée serveur
- `apps/web/app/(public)/biens/[id]/page.tsx` — Fiche complète avec biens_medias
- `apps/web/app/(pro)/biens/page.tsx` — Mes annonces avec actions
- `apps/web/app/(pro)/biens/nouveau/page.tsx` — Page création
- `apps/web/app/(pro)/biens/[id]/modifier/page.tsx` — Page modification avec prefill
- `packages/shared/constants/biens.ts` — TYPES_BIEN, EQUIPEMENTS_DISPONIBLES, labels
- `packages/shared/constants/index.ts` — Re-exports communes + biens
- `packages/shared/constants/communes.ts` — Added COMMUNES_CI (29 communes CI)

## Decisions Made
- **supabase.from() cast to `any`** — database.ts Insert type is a minimal placeholder; all fields except (proprietaire_id, titre, type_bien, commune) are missing from it. Cast required until `npx supabase gen types` regenerates from real project.
- **TYPES_BIEN moved communes.ts → biens.ts** — Avoids duplicate export conflict. communes.ts retains COMMUNES_ABIDJAN/COMMUNES_CI/QUARTIERS_PREMIUM/ROLES_UTILISATEUR.
- **ToggleStatutButton as client component** — Server Component pages can't use onClick+fetch; extracted minimal client wrapper using useRouter().refresh() instead of window.location.reload().
- **DB field names over plan names** — Used actual schema fields: `surface_m2` (not `superficie_m2`), `adresse_complete` (not `adresse`), `charges_mois_fcfa` (not `charges_fcfa`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `isLoading` → `loading` prop on Button**
- **Found during:** Task 2 (BienForm implementation)
- **Issue:** Plan code used `isLoading={isSubmitting}` but Button component accepts `loading` prop
- **Fix:** Changed to `loading={isSubmitting}` matching actual Button interface
- **Files modified:** apps/web/components/bien/BienForm/index.tsx
- **Committed in:** 5a91164

**2. [Rule 1 - Bug] Fixed DB field name mismatches (surface_m2, adresse_complete, charges_mois_fcfa)**
- **Found during:** Tasks 2-3 (form fields and API routes)
- **Issue:** Plan used superficie_m2/adresse/charges_fcfa but actual biens schema uses surface_m2/adresse_complete/charges_mois_fcfa
- **Fix:** Updated all form field names, Zod schema, and API insert payload to match actual DB
- **Files modified:** All BienForm step files, API routes, BienCard
- **Committed in:** 5a91164, 9b5b369

**3. [Rule 1 - Bug] Fixed readonly array casting for z.enum()**
- **Found during:** Task 2 TypeScript check
- **Issue:** `z.enum(TYPES_BIEN as [string, ...string[]])` fails because TYPES_BIEN is readonly
- **Fix:** Changed to `z.enum([...TYPES_BIEN] as [string, ...string[]])` to spread into mutable tuple
- **Files modified:** apps/web/components/bien/BienForm/index.tsx
- **Committed in:** 5a91164

**4. [Rule 2 - Missing] Extracted ToggleStatutButton as client component**
- **Found during:** Task 3 (pro listing page)
- **Issue:** Plan's onClick handler with fetch() in a Server Component is not valid in Next.js App Router
- **Fix:** Created ToggleStatutButton as 'use client' component with useRouter().refresh()
- **Files modified:** apps/web/components/bien/ToggleStatutButton.tsx, app/(pro)/biens/page.tsx
- **Committed in:** 9b5b369

**5. [Rule 1 - Bug] Removed TYPES_BIEN from communes.ts to avoid duplicate export**
- **Found during:** Task 1 (creating constants/index.ts)
- **Issue:** communes.ts already had TYPES_BIEN and TypeBien; biens.ts redefines them, causing duplicate export in index.ts
- **Fix:** Removed TYPES_BIEN/TypeBien from communes.ts, they now live exclusively in biens.ts
- **Files modified:** packages/shared/constants/communes.ts
- **Committed in:** 54ee9b0

---

**Total deviations:** 5 auto-fixed (3 Rule 1 bugs, 1 Rule 2 missing critical, 1 Rule 1 schema mismatch)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in `app/(auth)/register/page.tsx` (Zod v4 API change: `required_error` removed) and `app/layout.tsx` (globals.css side-effect import). Out of scope — logged to deferred items.

## Known Stubs
None - all pages fetch real data from Supabase. BienCard photo falls back to "Aucune photo" text when no media exists (intentional — medias added in plan 02-02).

## User Setup Required
None — no external service configuration required beyond existing Supabase project setup from Phase 1.

## Next Phase Readiness
- BienForm creates biens with bien_id → plan 02-02 (carousel médias) can attach biens_medias records
- POST /api/biens tested and ready for media upload flow
- /biens/[id]/modifier accepts `?step=medias` query param (prepared navigation target for plan 02-02)
- All Phase 2 npm packages installed (next-cloudinary, pannellum-react, embla-carousel, @dnd-kit, react-map-gl, react-dropzone) ready for use in plans 02-02 and 02-03

---
*Phase: 02-annonces-medias-messagerie*
*Completed: 2026-04-07*

## Self-Check: PASSED
- apps/web/components/bien/BienForm/index.tsx: FOUND
- apps/web/app/api/biens/route.ts: FOUND
- apps/web/app/api/biens/[id]/route.ts: FOUND
- apps/web/app/(public)/biens/page.tsx: FOUND
- apps/web/app/(public)/biens/[id]/page.tsx: FOUND
- apps/web/app/(pro)/biens/page.tsx: FOUND
- packages/shared/constants/biens.ts: FOUND
- Commits 54ee9b0, 5a91164, 9b5b369: FOUND (git log verified)
