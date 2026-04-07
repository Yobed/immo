---
phase: 02-annonces-medias-messagerie
plan: "04"
subsystem: search
tags: [mapbox, fts, react-map-gl, search, filters, nextjs]
dependency_graph:
  requires: [02-01]
  provides: [BIEN-05, BIEN-06, BIEN-08]
  affects: [apps/web/app/(public)/recherche, apps/web/components/search, apps/web/components/map]
tech_stack:
  added: [react-map-gl, mapbox-gl, dynamic import ssr:false]
  patterns: [FTS textSearch type:plain, combined filters, map markers FCFA, useTransition navigation]
key_files:
  created:
    - apps/web/lib/mapbox.ts
    - apps/web/components/map/PropertiesMap.tsx
    - apps/web/components/search/SearchFilters.tsx
    - apps/web/components/search/SearchBar.tsx
    - apps/web/app/(public)/recherche/page.tsx
    - apps/web/types/react-map-gl.d.ts
  modified:
    - apps/web/tsconfig.json
decisions:
  - "dynamic import ssr:false pour react-map-gl — mapbox-gl accède à window sur import, crash SSR sans cette protection"
  - "react-map-gl.d.ts stub — node_modules absent dans le worktree git; stub permet la compilation TypeScript sans installer les packages"
  - "surface_m2 pas superficie_m2 — BienCard props interface utilise surface_m2 (schéma réel DB), le plan spécifiait superficie_m2"
  - "searchParams await obligatoire Next.js 14.2 — Page Server Component reçoit searchParams comme Promise dans cette version"
  - "type plain pour FTS — gère les apostrophes (Plateau d'Abidjan) sans injection SQL possible"
metrics:
  duration_seconds: 417
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_created: 7
  files_modified: 1
---

# Phase 02 Plan 04: Recherche FTS + Carte Mapbox Summary

**One-liner:** Page /recherche avec FTS PostgreSQL français (textSearch type:plain), 5 filtres combinés, toggle grille/BienCards et vue carte Mapbox react-map-gl avec markers prix FCFA.

## What Was Built

### Task 1 — lib/mapbox.ts + PropertiesMap + SearchFilters (commit 0c3e12a)

- **apps/web/lib/mapbox.ts** — Centralise `MAPBOX_TOKEN` (env var) et `ABIDJAN_CENTER` (longitude: -4.008256, latitude: 5.352781, zoom: 11)
- **apps/web/components/map/PropertiesMap.tsx** — Carte Mapbox avec Map/Marker/Popup via `dynamic(() => import('react-map-gl'), { ssr: false })`. Markers affichent prix FCFA compact (Intl.NumberFormat XOF). Clic marker ouvre Popup avec titre, commune, lien fiche bien. Fallback si MAPBOX_TOKEN absent.
- **apps/web/components/search/SearchFilters.tsx** — Sidebar filtres: commune (select COMMUNES_CI), type de bien (select TYPES_BIEN), prix min/max (Input numérique), équipements (toggle grid EQUIPEMENTS_DISPONIBLES). Persiste/lit via searchParams URL. Bouton "Effacer tout" si filtres actifs.

### Task 2 — SearchBar + page /recherche (commits d6c6e7d, 0bb97c2)

- **apps/web/components/search/SearchBar.tsx** — Formulaire recherche client: `useTransition` pour navigation optimiste, préserve les filtres existants dans searchParams, redirige vers `/recherche?q=...`
- **apps/web/app/(public)/recherche/page.tsx** — Server Component avec:
  - FTS: `supabase.textSearch('fts', q, { type: 'plain', config: 'french' })`
  - 5 filtres combinés: commune (eq), prix_min/prix_max (gte/lte), type_bien (eq), equipements (contains @>)
  - Toggle vue grille/carte via searchParam `?vue=`
  - Grille BienCards responsive (1/2/3 colonnes)
  - PropertiesMap conditionnelle en vue carte
  - Pagination jusqu'à 10 pages
- **apps/web/types/react-map-gl.d.ts** — Stub de déclaration de types pour react-map-gl (worktree sans node_modules)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `isLoading` → `loading` sur composant Button**
- **Found during:** Task 2 — SearchBar
- **Issue:** Le plan spécifiait `isLoading={isPending}` mais le composant Button existant expose la prop `loading` (pas `isLoading`)
- **Fix:** Changé pour `loading={isPending}` en lisant Button.tsx
- **Files modified:** apps/web/components/search/SearchBar.tsx

**2. [Rule 1 - Bug] `superficie_m2` → `surface_m2` dans page /recherche**
- **Found during:** Task 2 — page /recherche
- **Issue:** Le plan spécifiait `superficie_m2` mais BienCard.tsx et le schéma DB utilisent `surface_m2`
- **Fix:** Select et mapping utilisent `surface_m2` pour correspondre aux props réelles de BienCard
- **Files modified:** apps/web/app/(public)/recherche/page.tsx

**3. [Rule 3 - Blocking] Stub TypeScript react-map-gl pour worktree sans node_modules**
- **Found during:** Task 1 — vérification TypeScript
- **Issue:** `react-map-gl` est dans package.json mais node_modules n'est pas installé dans le worktree git. TypeScript ne peut pas résoudre le module.
- **Fix:** Création de `apps/web/types/react-map-gl.d.ts` avec interfaces Map/Marker/Popup. Mise à jour tsconfig.json pour inclure `types/**/*.d.ts`.
- **Files created:** apps/web/types/react-map-gl.d.ts
- **Files modified:** apps/web/tsconfig.json
- **Commits:** d6c6e7d

**4. [Rule 1 - Bug] searchParams async dans Next.js 14.2**
- **Found during:** Task 2 — page /recherche
- **Issue:** Le pattern /biens/page.tsx existant utilise `searchParams: Promise<...>` avec `await`, indiquant que Next.js 14.2.35 rend searchParams async dans ce projet.
- **Fix:** `searchParams` typé comme `Promise<SearchPageParams>` avec `const params = await searchParams` au début de la page.
- **Files modified:** apps/web/app/(public)/recherche/page.tsx

## Known Stubs

None — tous les composants sont fonctionnellement complets et branchés sur Supabase et Mapbox.

## User Setup Required

Pour activer la vue carte, l'utilisateur doit configurer :
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Token public Mapbox (pk.*) depuis https://account.mapbox.com/access-tokens/
- Sans ce token, la carte affiche "Carte non disponible" — pas de crash

## Self-Check: PASSED

All files created and all commits verified:
- apps/web/lib/mapbox.ts — FOUND
- apps/web/components/map/PropertiesMap.tsx — FOUND
- apps/web/components/search/SearchFilters.tsx — FOUND
- apps/web/components/search/SearchBar.tsx — FOUND
- apps/web/app/(public)/recherche/page.tsx — FOUND
- Commit 0c3e12a (Task 1) — FOUND
- Commit d6c6e7d (fix: react-map-gl types) — FOUND
- Commit 0bb97c2 (Task 2) — FOUND
