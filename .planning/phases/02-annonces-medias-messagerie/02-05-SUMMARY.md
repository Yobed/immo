---
phase: 02-annonces-medias-messagerie
plan: 05
subsystem: messaging, ui, api
tags: [supabase-realtime, postgres_changes, favoris, visites, next.js]

# Dependency graph
requires:
  - phase: 02-01
    provides: API CRUD biens, BienCard, Supabase patterns
  - phase: 01-02
    provides: Supabase schema (messages, conversations, favoris, visites tables)
  - phase: 01-03
    provides: Auth SSR, createClient server/browser patterns

provides:
  - Messagerie temps réel (ConversationList, MessageThread, MessageInput) via Supabase Realtime postgres_changes
  - Page /messages avec layout split sidebar+thread
  - FavorisButton toggle (upsert/delete favoris)
  - VisiteRequestForm (date + créneau → POST /api/visites)
  - API /api/visites (POST crée demande en_attente, PATCH confirme/annule avec guard proprietaire_id)
  - Page client /favoris listant biens sauvegardés
  - Page pro /visites avec VisiteActions (confirmer/refuser)

affects: [03-paiements-reservations, 04-gestion-locative]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Supabase Realtime postgres_changes INSERT avec filter conversation_id=eq.{id}
    - Cleanup obligatoire supabase.removeChannel() dans useEffect return
    - Favoris upsert avec onConflict user_id,bien_id pour éviter 23505
    - VisiteActions extrait comme Client Component (Server Action + fetch absolu invalide dans App Router)

key-files:
  created:
    - apps/web/components/messaging/MessageInput.tsx
    - apps/web/components/messaging/MessageThread.tsx
    - apps/web/components/messaging/ConversationList.tsx
    - apps/web/app/(client)/layout.tsx
    - apps/web/app/(client)/messages/page.tsx
    - apps/web/app/(client)/favoris/page.tsx
    - apps/web/components/bien/FavorisButton.tsx
    - apps/web/components/bien/VisiteRequestForm.tsx
    - apps/web/app/api/visites/route.ts
    - apps/web/app/(pro)/visites/page.tsx
    - apps/web/app/(pro)/visites/VisiteActions.tsx
  modified: []

key-decisions:
  - "expediteur_id pas emetteur_id — nom réel colonne messages dans DB (schéma Supabase)"
  - "locataire_id pas demandeur_id, notes pas notes_demandeur, heure_debut+heure_fin pas creneau — schéma DB visites réel"
  - "VisiteActions extrait en Client Component — Server Action avec fetch() URL absolue invalide dans Next.js App Router"
  - "creneau string '08:00 - 09:00' splitté en heure_debut+heure_fin au niveau API route"

patterns-established:
  - "Realtime: supabase.channel(messages:{id}).on(postgres_changes INSERT).subscribe() + removeChannel cleanup"
  - "Favoris toggle: upsert avec onConflict + delete selon état local"
  - "Visites actions: client component avec router.refresh() pour revalider SSR après PATCH"

requirements-completed: [MSG-01, MSG-02, MSG-03, MSG-04, MSG-05]

# Metrics
duration: 25min
completed: 2026-04-07
---

# Phase 02 Plan 05: Messagerie & Interactions Summary

**Messagerie temps réel Supabase Realtime (postgres_changes INSERT filter), favoris upsert/delete, demandes de visite POST+PATCH avec guard proprietaire_id**

## Performance

- **Duration:** 25 min
- **Started:** 2026-04-07T10:49:00Z
- **Completed:** 2026-04-07T11:14:26Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- MessageThread avec subscription Supabase Realtime filtrée par conversation_id, dédup, scroll auto, cleanup
- FavorisButton client-side toggle avec upsert onConflict pour éviter l'erreur 23505 duplicate key
- API /api/visites POST + PATCH — POST insère en_attente avec locataire_id, PATCH vérifie proprietaire_id avant update
- Page /messages layout split (sidebar conversations + thread), page /favoris SSR, page pro /visites avec actions

## Task Commits

1. **Task 1: Messagerie temps réel** - `790a52e` (feat)
2. **Task 2: FavorisButton + VisiteRequestForm + API visites + pages** - `9d7116a` (feat)

## Files Created/Modified
- `apps/web/components/messaging/MessageInput.tsx` - Textarea Ctrl+Enter, insert message avec expediteur_id
- `apps/web/components/messaging/MessageThread.tsx` - Realtime postgres_changes INSERT filter, scroll auto, dedup
- `apps/web/components/messaging/ConversationList.tsx` - Sidebar liste conversations avec lien actif
- `apps/web/app/(client)/layout.tsx` - Route group layout (client routes)
- `apps/web/app/(client)/messages/page.tsx` - Layout split sidebar+thread, SSR conversations, auth guard
- `apps/web/app/(client)/favoris/page.tsx` - SSR biens sauvegardés avec BienCard grid
- `apps/web/components/bien/FavorisButton.tsx` - Toggle favori upsert/delete avec onConflict
- `apps/web/components/bien/VisiteRequestForm.tsx` - Formulaire date + créneau horaire
- `apps/web/app/api/visites/route.ts` - POST (statut=en_attente) + PATCH (confirmee/annulee, guard proprietaire_id)
- `apps/web/app/(pro)/visites/page.tsx` - Liste demandes SSR avec StatutBadge
- `apps/web/app/(pro)/visites/VisiteActions.tsx` - Boutons confirmer/refuser client avec router.refresh()

## Decisions Made
- `expediteur_id` (DB) non `emetteur_id` (plan) — toujours vérifier le schéma database.ts avant d'écrire les composants
- `locataire_id`, `notes`, `heure_debut`/`heure_fin` (DB) non `demandeur_id`, `notes_demandeur`, `creneau` (plan)
- `VisiteActions` extrait en Client Component car Server Actions + fetch URL absolue invalide dans Next.js App Router
- Le champ `creneau` du formulaire est splitté en `heure_debut`/`heure_fin` au niveau de l'API route

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Correction des noms de colonnes DB dans les composants messagerie**
- **Found during:** Task 1 (MessageInput + MessageThread)
- **Issue:** Plan utilisait `emetteur_id` mais la colonne réelle dans la table `messages` est `expediteur_id` (vérifié dans packages/shared/types/database.ts)
- **Fix:** Renommé `emetteur_id` → `expediteur_id` dans MessageInput et MessageThread; cast `as unknown as Message[]` pour la conversion de type
- **Files modified:** MessageInput.tsx, MessageThread.tsx
- **Verification:** `npx tsc --noEmit` sans erreur sur ces fichiers
- **Committed in:** 790a52e (Task 1 commit)

**2. [Rule 1 - Bug] Correction des noms de colonnes DB dans API visites**
- **Found during:** Task 2 (api/visites/route.ts, page pro /visites)
- **Issue:** Plan utilisait `demandeur_id`, `notes_demandeur`, `creneau` mais la table `visites` a `locataire_id`, `notes`, `heure_debut`/`heure_fin`
- **Fix:** Adapté le mapping dans route.ts (split creneau → heure_debut+heure_fin), adapté la query SSR
- **Files modified:** app/api/visites/route.ts, app/(pro)/visites/page.tsx
- **Verification:** `npx tsc --noEmit` sans erreur sur ces fichiers
- **Committed in:** 9d7116a (Task 2 commit)

**3. [Rule 1 - Bug] Extraction VisiteActions en Client Component**
- **Found during:** Task 2 (page pro /visites)
- **Issue:** Plan utilisait `'use server'` + `fetch('/api/visites', ...)` — pattern invalide (Server Actions ne peuvent pas appeler fetch URL absolue relative)
- **Fix:** Extrait en VisiteActions.tsx Client Component avec useState + useRouter + fetch + router.refresh()
- **Files modified:** app/(pro)/visites/VisiteActions.tsx (créé), app/(pro)/visites/page.tsx (import VisiteActions)
- **Verification:** TypeScript propre, pattern cohérent avec ToggleStatutButton existant
- **Committed in:** 9d7116a (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 1 — noms colonnes DB divergeant du plan + pattern Server Action invalide)
**Impact on plan:** Toutes les corrections nécessaires pour fonctionnement correct. Aucun scope creep.

## Issues Encountered
- `isLoading` prop dans le plan inexistante sur Button — corrigé en `loading` (prop réelle du composant Button)
- `superficie_m2` dans le plan inexistante dans BienCard — corrigé en `surface_m2` (prop réelle)

## Known Stubs
Aucun stub bloquant. La page /messages affiche "Sélectionnez une conversation" si aucune conversation — comportement attendu pour un utilisateur sans messages.

## Next Phase Readiness
- Messagerie temps réel prête (nécessite Supabase Realtime activé sur `messages` — confirmé par l'utilisateur)
- FavorisButton peut être intégré dans BienCard ou la page fiche bien
- VisiteRequestForm peut être intégré dans la page fiche bien (app/(public)/biens/[id]/page.tsx)
- API /api/visites prête pour Phase 3 (notifications n8n sur nouvelle demande de visite)

---
*Phase: 02-annonces-medias-messagerie*
*Completed: 2026-04-07*
