---
phase: 04-gestion-locative-avis-kyc
plan: 03
subsystem: ui, api
tags: [avis, rating, review, supabase, nextjs, server-component, client-component]

# Dependency graph
requires:
  - phase: 04-gestion-locative-avis-kyc-01
    provides: pipeline quittances et contrats (réservations table with statut terminee)
  - phase: 03-paiements-reservations-ia-dashboard-02
    provides: reservations table schema (locataire_id, proprietaire_id, statut)

provides:
  - Système d'avis bidirectionnel post-séjour (locataire <-> propriétaire)
  - StarRating component interactif et readonly
  - API POST /api/avis avec guards (terminee, 23505, self-rating)
  - API PATCH /api/avis/[id]/reponse avec guard cible_id
  - Page /client/avis — réservations à noter + avis reçus
  - Page /pro/avis — avis reçus + locataires à noter + réponse inline

affects:
  - 04-kyc — profils utilisateurs avec notes moyennes
  - 05-mobile — écrans avis mobiles

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-step filter pattern: fetch IDs first, then .not('id','in',...) pour éviter sous-requêtes SQL inline"
    - "StarRating SVG pur sans lib externe — mode interactif (onChange) et readonly"
    - "ReponseForm toggle pattern — bouton + Répondre ouvre formulaire inline"
    - "bienIds.length guard avant .not('id','in',...) — évite erreur sur tableau vide"

key-files:
  created:
    - apps/web/components/avis/StarRating.tsx
    - apps/web/components/avis/AvisCard.tsx
    - apps/web/components/avis/AvisForm.tsx
    - apps/web/components/avis/ReponseForm.tsx
    - apps/web/app/api/avis/route.ts
    - apps/web/app/api/avis/[id]/reponse/route.ts
    - apps/web/app/(client)/avis/page.tsx
    - apps/web/app/(pro)/avis/page.tsx
  modified: []

key-decisions:
  - "Two-step query pattern pour filtrer réservations sans avis — sous-requête SQL inline non supportée par client Supabase JS"
  - "StarRating SVG pur (path polygon étoile) — pas de lib externe pour éviter dépendances supplémentaires"
  - "ReponseForm avec toggle open/close — UX inline sans navigation"
  - "statut terminee (pas expiree) dans guard API — confirmé par STATE.md"
  - "Notification avis_recu avec lien_type=reservation (pas lien_type=avis) — lien vers contexte réservation"

patterns-established:
  - "Two-step filter: fetch dejaNoteIds, puis .not('id','in',...) avec guard longueur > 0"
  - "StarRating: disabled={readonly} sur button, onChange?.(star) pour appel conditionnel"
  - "API guard order: auth → validation → réservation exists → statut → partie → self-rating → insert → notification"

requirements-completed: [AVIS-01, AVIS-02, AVIS-03]

# Metrics
duration: 15min
completed: 2026-04-07
---

# Phase 4 Plan 3: Système Avis Bidirectionnel Summary

**Avis locataire↔propriétaire post-séjour avec StarRating SVG, 2 API routes (guards 23505/terminee/cible), 2 pages Server Component et formulaire réponse inline.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-07T16:15:00Z
- **Completed:** 2026-04-07T16:30:00Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments

- 4 composants avis réutilisables: StarRating (interactif + readonly), AvisCard, AvisForm (409 inline), ReponseForm (toggle inline)
- API POST /api/avis avec 5 guards successifs (auth, validation, réservation terminée, partie de la réservation, auto-note interdite) + notification avis_recu
- API PATCH /api/avis/[id]/reponse avec guards cible_id et réponse existante (409)
- 2 pages Server Component avec fetch parallèle et two-step filter pattern pour réservations sans avis
- Note moyenne calculée côté serveur sur les deux pages (locataire et propriétaire)

## Task Commits

Each task was committed atomically:

1. **Task 1: Composants avis + routes API** - (pending commit) feat(04-03): composants avis StarRating + AvisCard + AvisForm + ReponseForm
2. **Task 1 (API):** feat(04-03): API POST /api/avis + PATCH /api/avis/[id]/reponse
3. **Task 2: Pages avis client + pro** - feat(04-03): pages avis client et proprietaire

**Plan metadata:** docs(04-03): complete systeme avis bidirectionnel

## Files Created/Modified

- `apps/web/components/avis/StarRating.tsx` — 5 étoiles SVG orange #E67E22, mode interactif (onChange) + readonly (disabled)
- `apps/web/components/avis/AvisCard.tsx` — Affiche avis: auteur, date, StarRating readonly, commentaire, réponse propriétaire
- `apps/web/components/avis/AvisForm.tsx` — Formulaire note + commentaire, gestion 409 "déjà noté", router.refresh()
- `apps/web/components/avis/ReponseForm.tsx` — Toggle "+ Répondre" → textarea inline → PATCH /api/avis/[id]/reponse
- `apps/web/app/api/avis/route.ts` — POST: auth guard, statut terminee, cible_id check, 23505 → 409, notification avis_recu
- `apps/web/app/api/avis/[id]/reponse/route.ts` — PATCH: auth guard, cible_id ownership, idempotence (409 si déjà répondu)
- `apps/web/app/(client)/avis/page.tsx` — Server Component: two-step filter réservations, AvisForm + AvisCard, note moyenne
- `apps/web/app/(pro)/avis/page.tsx` — Server Component: avis reçus + ReponseForm inline + locataires à noter, note moyenne

## Decisions Made

1. **Two-step filter pour réservations sans avis** — Le client Supabase JS ne supporte pas les sous-requêtes SQL inline dans les filtres `.not()`. Solution: fetch des IDs déjà notés en étape 1, puis filtrage avec guard `dejaNoteIds.length > 0` avant `.not('id','in',...)` pour éviter l'erreur sur tableau vide (cf. bienIds.length guard pattern dans STATE.md).

2. **Notification lien_type=reservation** — Le lien de notification pointe vers la réservation plutôt que l'avis directement, car les avis sont consultables depuis la page réservation et la table notifications s'attend à un `lien_id` existant.

3. **ReponseForm avec toggle** — UX inline sans redirection: bouton "+ Répondre" ouvre le textarea dans la même Card. `router.refresh()` après succès recharge les Server Components.

## Deviations from Plan

None - plan executed exactly as written. The two-step filter approach (already documented in the plan as preferred over SQL inline subqueries) was used directly.

## Issues Encountered

None - all patterns were established and documented in STATE.md prior to this plan.

## User Setup Required

None - no external service configuration required. Utilise la table `avis` créée en migration 007 et la table `notifications` existante.

## Self-Check

### Files verified present:
- apps/web/components/avis/StarRating.tsx — FOUND
- apps/web/components/avis/AvisCard.tsx — FOUND
- apps/web/components/avis/AvisForm.tsx — FOUND
- apps/web/components/avis/ReponseForm.tsx — FOUND
- apps/web/app/api/avis/route.ts — FOUND
- apps/web/app/api/avis/[id]/reponse/route.ts — FOUND
- apps/web/app/(client)/avis/page.tsx — FOUND
- apps/web/app/(pro)/avis/page.tsx — FOUND

### Critical patterns verified:
- `terminee` in POST /api/avis — PRESENT (2 occurrences)
- `23505` unique constraint guard — PRESENT (2 occurrences)
- `avis_recu` notification type — PRESENT (2 occurrences)
- `noteMoyenne` in pro page — PRESENT (3 occurrences)
- `ReponseForm` in pro page — PRESENT

## Self-Check: PASSED

## Next Phase Readiness

Plan 04-04 (KYC) peut commencer. La note moyenne calculée sur les pages `/client/avis` et `/pro/avis` est disponible. Les composants `StarRating` et `AvisCard` peuvent être réutilisés sur les pages profil publiques pour afficher la réputation.

---
*Phase: 04-gestion-locative-avis-kyc*
*Completed: 2026-04-07*
