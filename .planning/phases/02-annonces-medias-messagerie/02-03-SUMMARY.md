---
phase: 02-annonces-medias-messagerie
plan: "03"
subsystem: media-viewer
tags: [carousel, embla, pannellum, 360, media, fiche-bien]
dependency_graph:
  requires: [02-02]
  provides: [BienCarousel, Bien360]
  affects: [apps/web/app/(public)/biens/[id]/page.tsx]
tech_stack:
  added: [pannellum-react type declarations, embla-carousel-react type declarations]
  patterns: [dynamic import ssr:false, Embla carousel hooks, media type filtering]
key_files:
  created:
    - apps/web/components/bien/Bien360.tsx
    - apps/web/components/bien/BienCarousel.tsx
    - apps/web/types/pannellum-react.d.ts
    - apps/web/types/embla-carousel-react.d.ts
  modified:
    - apps/web/app/(public)/biens/[id]/page.tsx
decisions:
  - "pannellum-react and embla-carousel-react have no @types packages — added custom .d.ts declarations in apps/web/types/"
  - "Cover img replaced by BienCarousel in fiche bien — all medias array used instead of single cover URL"
  - "duree_sec added to Supabase select query to support video duration display"
metrics:
  duration: "3min"
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 02 Plan 03: Carousel Médias & Vue 360° Summary

**One-liner:** Embla carousel swipeable avec 4 types de médias filtrables, badges colorés, miniatures, et vue 360° Pannellum via dynamic import ssr:false.

## What Was Built

### Task 1 — Bien360 (Pannellum dynamique)

`apps/web/components/bien/Bien360.tsx` — Composant Vue 360° avec :
- Import dynamique obligatoire `dynamic(() => import('pannellum-react').then((m) => m.Pannellum), { ssr: false })` — évite le crash SSR (pannellum accède à `window` à l'import)
- `autoRotate={-2}` — rotation automatique au chargement
- `hotSpots` mappés depuis la prop `hotspots: Array<{ pitch, yaw, texte }>`
- Loading spinner centré pendant l'initialisation Pannellum
- Badge overlay violet "Vue 360° — Glisser pour naviguer"
- Props : `panoramaUrl`, `hotspots`, `hauteur` (defaut 320px), `className`

### Task 2 — BienCarousel + intégration fiche bien

`apps/web/components/bien/BienCarousel.tsx` — Carousel Embla complet :
- `useEmblaCarousel({ loop: true, align: 'start' })` — swipe natif mobile
- Filtres par type (Tout / Photos / Vidéos / Vue 360° / Plans) — affichés uniquement si plusieurs types présents
- 4 variantes de slides :
  - `photo` — Next.js Image avec `fill + object-cover`
  - `video` — iframe embed (YouTube/Vimeo via `embed_url`) ou `<video>` natif (Supabase Storage) avec durée formatée
  - `vue_360` — Bien360 rendu en slide
  - `plan` — iframe PDF ou Next.js Image avec `object-contain`
- Badges colorés sur chaque slide : vert (photo), orange (vidéo), violet (vue_360), bleu (plan)
- Flèches navigation (opacity-0 → visible au hover), compteur slides
- Miniatures scrollables 64x48px synchronisées avec `emblaApi.selectedScrollSnap()`
- Dots mobiles pour ≤10 slides, cachés sur `sm:` et au-dessus

`apps/web/app/(public)/biens/[id]/page.tsx` — Intégration :
- Import `BienCarousel` ajouté
- `cover` img remplacée par `<BienCarousel medias={medias.map(...)} />`
- `duree_sec` ajouté dans le select Supabase pour les vidéos

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Types] Added pannellum-react type declarations**
- **Found during:** Task 1 — `npx tsc --noEmit` → `Cannot find module 'pannellum-react'`
- **Issue:** pannellum-react@1.2.4 has no @types package and no bundled declarations
- **Fix:** Created `apps/web/types/pannellum-react.d.ts` with `PannellumProps` and `HotSpot` interfaces
- **Files modified:** apps/web/types/pannellum-react.d.ts (created)
- **Commit:** 7e5abdc

**2. [Rule 2 - Missing Types] Added embla-carousel-react type declarations**
- **Found during:** Task 2 — `npx tsc --noEmit` → `Cannot find module 'embla-carousel-react'`
- **Issue:** Same pattern — package installed in package.json but no node_modules (not installed yet in this worktree)
- **Fix:** Created `apps/web/types/embla-carousel-react.d.ts` with `EmblaCarouselType` interface and `useEmblaCarousel` hook signature
- **Files modified:** apps/web/types/embla-carousel-react.d.ts (created)
- **Commit:** cedf3a0

**3. [Rule 1 - Bug] Removed unused `cover` variable**
- **Found during:** Task 2 integration
- **Issue:** After replacing `<img src={cover} ...>` with `<BienCarousel>`, the `cover` variable became unused (TypeScript warning potential)
- **Fix:** Removed `const cover = medias.find(...)...` line
- **Files modified:** apps/web/app/(public)/biens/[id]/page.tsx
- **Commit:** cedf3a0

**4. [Rule 2 - Missing Data] Added duree_sec to Supabase select**
- **Found during:** Task 2 — BienCarousel uses `media.duree_sec` for video duration display
- **Issue:** Original select query did not include `duree_sec` column
- **Fix:** Added `duree_sec` to the `biens_medias(...)` select in page.tsx
- **Files modified:** apps/web/app/(public)/biens/[id]/page.tsx
- **Commit:** cedf3a0

## Known Stubs

None — all carousel features are fully wired. Pannellum loads real panorama URLs from `biens_medias.url`. Videos play from `embed_url` or `url`. Thumbnails show actual media URLs.

## Self-Check: PASSED

Files exist:
- apps/web/components/bien/Bien360.tsx — FOUND
- apps/web/components/bien/BienCarousel.tsx — FOUND
- apps/web/types/pannellum-react.d.ts — FOUND
- apps/web/types/embla-carousel-react.d.ts — FOUND

Commits:
- 7e5abdc — feat(02-03): add Bien360
- cedf3a0 — feat(02-03): add BienCarousel and integrate in fiche bien

TypeScript errors on our files: 0 (verified with grep on Bien360 and BienCarousel)
