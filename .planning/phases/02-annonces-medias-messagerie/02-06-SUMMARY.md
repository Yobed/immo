---
phase: 02-annonces-medias-messagerie
plan: "06"
subsystem: ui
tags: [nextjs, supabase, react, favoris, visites, medias, bienform]

# Dependency graph
requires:
  - phase: 02-annonces-medias-messagerie
    provides: "FavorisButton, VisiteRequestForm (plan 02-05), Step5Medias (plan 02-02), BienForm 4-step (plan 02-01)"
provides:
  - "Fiche bien publique with FavorisButton + VisiteRequestForm wired"
  - "BienForm with 5-step progress bar and step-5 summary panel"
  - "Modifier page handles ?step=medias and renders Step5Medias"
affects: [phase-03-paiements, phase-04-gestion-locative]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "supabase.auth.getUser() called once at top of Server Component, passed down as userId prop to Client Components"
    - "searchParams typed as Promise<{step?: string}> and awaited in Next.js 14 App Router async page"
    - "Step5Medias rendered outside BienForm (needs bienId which only exists post-creation) via modifier page conditional"

key-files:
  created: []
  modified:
    - apps/web/app/(public)/biens/[id]/page.tsx
    - apps/web/components/bien/BienForm/index.tsx
    - apps/web/app/(pro)/biens/[id]/modifier/page.tsx

key-decisions:
  - "Step5Medias rendered outside BienForm in modifier page — BienForm is a creation form with no bienId; Step5Medias requires bienId, so medias step lives at ?step=medias on the modifier page"
  - "Visitor actions (FavorisButton + VisiteRequestForm) appended below Equipements — avoids layout restructuring, keeps existing sections untouched"

patterns-established:
  - "Pattern: auth.getUser() in Server Component, pass userId to client components as prop — avoids re-auth on client"
  - "Pattern: searchParams.step conditional in modifier page — single page serves both edit and media-upload modes"

requirements-completed: [MSG-01, MSG-03, MSG-04, BIEN-01]

# Metrics
duration: 2min
completed: "2026-04-07"
---

# Phase 02 Plan 06: Gap Closure — Orphaned Components Wired Summary

**Three orphaned client components (FavorisButton, VisiteRequestForm, Step5Medias) surgically imported into their consumer pages, closing MSG-01/03/04 and BIEN-01 requirements**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-07T11:40:12Z
- **Completed:** 2026-04-07T11:42:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- FavorisButton and VisiteRequestForm wired into `/biens/[id]/page.tsx` — visitors can now toggle favoris and submit visite requests from the property page
- BienForm updated to 5-step flow with step-5 "Prêt à publier?" summary panel and updated submit label
- Modifier page reads `searchParams.step` and renders `<Step5Medias bienId={id} />` when `step === 'medias'`, completing the post-creation media upload flow

## Task Commits

1. **Task 1: Wire FavorisButton + VisiteRequestForm into fiche bien publique** - `048396f` (feat)
2. **Task 2: Add Step5Medias to BienForm flow + modifier page** - `f781018` (feat)

## Files Created/Modified

- `apps/web/app/(public)/biens/[id]/page.tsx` — added imports + auth.getUser() + visitor actions section with FavorisButton + VisiteRequestForm
- `apps/web/components/bien/BienForm/index.tsx` — TOTAL_STEPS=4→5, step-5 summary panel, submit label updated
- `apps/web/app/(pro)/biens/[id]/modifier/page.tsx` — searchParams added, Step5Medias import + conditional render on step=medias

## Decisions Made

- **Step5Medias outside BienForm:** BienForm handles creation (no bienId yet); Step5Medias needs bienId, so it lives in the modifier page triggered by ?step=medias. The form's onSubmit already redirects to `/biens/${id}/modifier?step=medias` — this plan completes that redirect target.
- **Visitor actions appended after Equipements:** Minimal layout change, no restructuring of existing carousel/header/caractéristiques/description sections.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — all three components are fully functional with real data sources. FavorisButton reads/writes to the `favoris` table, VisiteRequestForm POSTs to `/api/visites`, Step5Medias reads from `biens_medias` and triggers Cloudinary upload via `/api/upload/sign`.

## Next Phase Readiness

- All phase 02 requirements (MSG-01, MSG-03, MSG-04, BIEN-01) satisfied
- No orphaned components remain in phase 02
- Phase 03 (Paiements, Réservations, IA & Dashboard) can proceed without blockers from this phase

---
*Phase: 02-annonces-medias-messagerie*
*Completed: 2026-04-07*
