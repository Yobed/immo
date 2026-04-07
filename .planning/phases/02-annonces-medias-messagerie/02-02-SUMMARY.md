---
phase: 02-annonces-medias-messagerie
plan: "02"
subsystem: media
tags: [cloudinary, supabase-storage, dnd-kit, next-cloudinary, react-dropzone, upload, medias]

requires:
  - phase: 02-01
    provides: BienForm multi-étapes, API CRUD biens, table biens_medias en base

provides:
  - "signUploadParams() — signature côté serveur Cloudinary (lib/cloudinary.ts)"
  - "POST /api/upload/sign — endpoint de signature Cloudinary auth-gated"
  - "POST|PATCH|DELETE /api/biens/[id]/medias — CRUD médias avec ownership check et gestion couverture"
  - "MediaUploader — CldUploadWidget pour photos, react-dropzone + Supabase Storage pour video/360/plan"
  - "MediaSortable — @dnd-kit sortable avec persistance ordre et gestion photo couverture"
  - "MediaTypeIcon — badge par type avec couleurs distinctes"
  - "Step5Medias — étape 5 du formulaire propriétaire avec onglets, upload et liste triable"

affects: [02-03, carousel, medias]

tech-stack:
  added:
    - cloudinary v2 (server-side signing)
    - next-cloudinary v6 (CldUploadWidget)
    - @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities (drag & drop)
    - react-dropzone v15 (Storage uploads)
  patterns:
    - "Cloudinary signed upload: API route /api/upload/sign génère une signature, CldUploadWidget l'utilise"
    - "Supabase Storage: upload direct depuis client, URL publique persistée dans biens_medias"
    - "biens_medias couverture: reset est_couverture=false sur le bien avant de setter le nouveau (respect partial unique index)"
    - "dnd-kit sortable: arrayMove + PATCH batch ordre au onDragEnd"

key-files:
  created:
    - apps/web/lib/cloudinary.ts
    - apps/web/app/api/upload/sign/route.ts
    - apps/web/app/api/biens/[id]/medias/route.ts
    - apps/web/components/media/MediaTypeIcon.tsx
    - apps/web/components/media/MediaUploader.tsx
    - apps/web/components/media/MediaSortable.tsx
    - apps/web/components/bien/BienForm/Step5Medias.tsx
  modified: []

key-decisions:
  - "npm install --legacy-peer-deps à la racine (monorepo workspaces) — pannellum-react@1.2.4 requiert react@16.x, conflit peer dep résolu avec legacy-peer-deps"
  - "as never cast pour biens_medias Update — placeholder database.ts; pattern cohérent avec biens API (as any)"
  - "MediaSortable accepte initialMedias pour hydratation SSR, recharge via Step5Medias après upload"

patterns-established:
  - "Cloudinary signing: lib/cloudinary.ts exporte signUploadParams(), API route POST /api/upload/sign le wraps avec auth check"
  - "Supabase Storage bucket per type: videos, panoramas, plans — getPublicUrl après upload"
  - "biens_medias couverture reset: toujours reset est_couverture=false avant de setter true (avoid partial unique index violation)"

requirements-completed: [MDIA-01, MDIA-02, MDIA-03, MDIA-04, MDIA-07, MDIA-08]

duration: 35min
completed: "2026-04-06"
---

# Phase 02 Plan 02: Upload Pipeline Médias Summary

**Pipeline complet d'upload médias — photos via Cloudinary (signature serveur + CldUploadWidget), vidéos/360°/plans via Supabase Storage, persistence biens_medias, drag & drop @dnd-kit avec reset couverture unique**

## Performance

- **Duration:** 35 min
- **Started:** 2026-04-06T08:30:00Z
- **Completed:** 2026-04-06T09:05:00Z
- **Tasks:** 2 (+ 1 checkpoint auto-approuvé)
- **Files modified:** 7

## Accomplishments

- Lib Cloudinary + endpoint /api/upload/sign permettant upload sécurisé photos vers Cloudinary CDN avec signature serveur
- API CRUD complète POST|PATCH|DELETE /api/biens/[id]/medias avec ownership check, gestion ordre batch et reset couverture partielle unique
- Composants client MediaUploader (CldUploadWidget photos + dropzone Storage), MediaSortable (dnd-kit), Step5Medias intégrée dans BienForm

## Task Commits

Chaque tâche commitée atomiquement :

1. **Task 1: lib/cloudinary.ts + API route signature + API route biens_medias** — `abafeb9` (feat)
2. **Task 2: MediaUploader + MediaSortable + MediaTypeIcon + Step5Medias** — `c9bbef5` (feat)

## Files Created/Modified

- `apps/web/lib/cloudinary.ts` — configuration Cloudinary v2 + signUploadParams()
- `apps/web/app/api/upload/sign/route.ts` — POST auth-gated, retourne signature Cloudinary
- `apps/web/app/api/biens/[id]/medias/route.ts` — POST (insert), PATCH (ordre batch + couverture reset), DELETE
- `apps/web/components/media/MediaTypeIcon.tsx` — MediaTypeBadge par type avec couleurs distinctes (photo/video/vue_360/plan)
- `apps/web/components/media/MediaUploader.tsx` — CldUploadWidget pour photos, react-dropzone + Supabase Storage pour autres types
- `apps/web/components/media/MediaSortable.tsx` — @dnd-kit sortable grid, persistance ordre via PATCH, gestion couverture
- `apps/web/components/bien/BienForm/Step5Medias.tsx` — onglets par type, uploader + liste triable, refresh post-upload

## Decisions Made

- **npm install --legacy-peer-deps** — pannellum-react@1.2.4 déclare peer react@16.x, conflit résolu; les deps étaient dans package.json mais le worktree n'avait pas de node_modules
- **as never cast sur biens_medias Update** — database.ts placeholder; cohérent avec le pattern as any du biens API
- **Checkpoint auto-approuvé** — auto_advance=true dans config.json; les ressources Cloudinary/Supabase Storage seront configurées par l'utilisateur avant test réel

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm install depuis la racine du worktree**
- **Found during:** Task 2 (vérification TypeScript MediaSortable/MediaUploader)
- **Issue:** Le worktree n'avait pas de node_modules — @dnd-kit/core, next-cloudinary, cloudinary, react-dropzone introuvables
- **Fix:** `npm install --legacy-peer-deps` à la racine du monorepo (workspaces npm) — les packages sont dans package.json, juste non installés dans ce worktree
- **Files modified:** node_modules/ (non commité — gitignored)
- **Verification:** `npx tsc --noEmit` ne produit plus d'erreur sur les nouveaux fichiers
- **Committed in:** Aucun commit nécessaire (node_modules gitignored)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix nécessaire pour vérification TypeScript. Aucun changement de scope.

## Issues Encountered

- Le TypeScript check initial montrait des erreurs "Cannot find module" pour cloudinary, @dnd-kit, react-dropzone, next-cloudinary — résolu via installation des deps depuis la racine du monorepo avec `--legacy-peer-deps`
- Les erreurs restantes (`app/(auth)/register/page.tsx`, `app/layout.tsx`) sont des erreurs pré-existantes hors scope de ce plan

## User Setup Required

Les ressources externes doivent être créées manuellement avant que l'upload fonctionne :

**Cloudinary:**
- Compte Cloudinary avec variables `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` dans `apps/web/.env.local`
- Upload Preset signé `immo-ci-photos` (Signing mode: Signed, Folder: biens, max 10MB, formats: jpg/jpeg/png/webp, transform: w_1200,c_limit,f_webp,q_auto)

**Supabase Storage:**
- Bucket `videos` — public, max 500MB, MIME: video/*
- Bucket `panoramas` — public, max 50MB, MIME: image/*
- Bucket `plans` — public, max 20MB, MIME: application/pdf,image/*

## Known Stubs

Aucun stub — Step5Medias lit depuis Supabase (biens_medias) et appelle les APIs réelles. Le composant est fonctionnel sous réserve que les ressources externes (Cloudinary preset, buckets Supabase) soient configurées.

## Next Phase Readiness

- Plan 02-03 (Carousel médias) peut consommer les URLs stockées dans biens_medias
- Les buckets Supabase Storage et le preset Cloudinary doivent être configurés pour tester réellement
- Le formulaire BienForm redirige vers `/biens/${id}/modifier?step=medias` après création — la page `/biens/[id]/modifier` doit intégrer Step5Medias (à vérifier/compléter en 02-03 ou dans BienForm si nécessaire)

---
*Phase: 02-annonces-medias-messagerie*
*Completed: 2026-04-06*
