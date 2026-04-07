---
phase: 04-gestion-locative-avis-kyc
plan: "04"
subsystem: kyc-notifications
tags: [kyc, notifications, realtime, supabase-storage, server-components]
dependency_graph:
  requires: [supabase-storage-bucket-kyc, notifications-table-migration-008, profiles-kyc-columns-migration-001]
  provides: [kyc-upload-flow, kyc-status-badge, profil-page, notification-center, notification-bell-realtime]
  affects: [pro-layout, client-layout]
tech_stack:
  added: []
  patterns:
    - Supabase Storage private bucket upload (kyc bucket, no public URL)
    - Supabase Realtime postgres_changes INSERT filter user_id=eq.{userId}
    - Service role client for admin webhook (PATCH /api/kyc)
    - Lazy-load notifications dropdown (fetch on first open, not on mount)
    - click-outside via document mousedown + useRef + cleanup in useEffect return
key_files:
  created:
    - apps/web/components/kyc/KYCStatusBadge.tsx
    - apps/web/components/kyc/KYCUploader.tsx
    - apps/web/app/api/kyc/route.ts
    - apps/web/app/(pro)/profil/page.tsx
    - apps/web/components/notifications/NotificationItem.tsx
    - apps/web/components/notifications/NotificationCenter.tsx
    - apps/web/components/notifications/NotificationBell.tsx
    - apps/web/app/(client)/notifications/page.tsx
    - apps/web/app/api/notifications/route.ts
    - apps/web/app/api/notifications/[id]/route.ts
    - apps/web/app/(pro)/layout.tsx
  modified:
    - apps/web/app/(client)/layout.tsx
decisions:
  - kyc-bucket-private: Supabase Storage bucket 'kyc' is private; store path (not publicUrl) in profiles.kyc_cni_url / kyc_selfie_url
  - notification-bell-lazy: Dropdown notifications fetched lazily (first open) to avoid unnecessary API calls on every page load
  - pro-layout-created: (pro) layout.tsx did not exist; created with nav + NotificationBell as required by plan
metrics:
  duration: "25min"
  completed_date: "2026-04-07"
  tasks: 2
  files: 12
---

# Phase 4 Plan 04: KYC & Notifications Summary

**One-liner:** KYC upload CNI+selfie vers bucket Supabase Storage privé avec badge statut tricolore, et centre de notifications Realtime avec cloche header badge non-lu.

## What Was Built

### Task 1 — KYC propriétaire

**KYCStatusBadge** (`components/kyc/KYCStatusBadge.tsx`): Composant pure affichant un Badge coloré selon `kyc_statut`:
- `non_verifie` → Badge default gris "Non vérifié"
- `en_cours` → Badge warning jaune "En cours de vérification"
- `verifie` → Badge success vert "✓ Vérifié"

**KYCUploader** (`components/kyc/KYCUploader.tsx`): Client Component avec deux dropzones react-dropzone (CNI + selfie). Upload vers bucket Supabase Storage `kyc` (privé) au path `{userId}/{timestamp}-{type}.jpg`. Après les deux uploads, POST `/api/kyc` avec les paths. Affiche confirmation inline après soumission.

**POST /api/kyc**: Auth guard, met à jour `profiles.kyc_cni_url`, `kyc_selfie_url`, `kyc_statut='en_cours'`.

**PATCH /api/kyc**: Admin webhook — service role (no auth check), met à jour `kyc_statut`, insère notification `kyc_valide` si statut=`verifie`.

**Page `/profil`** (`app/(pro)/profil/page.tsx`): Server Component, fetch profil complet, affiche KYCStatusBadge + section conditionnelle (KYCUploader si non_verifie, message si en_cours, confirmation si verifie).

### Task 2 — Centre de notifications

**NotificationItem** (`components/notifications/NotificationItem.tsx`): Client Component. Fond `bg-blue-50` si non lu, `bg-white` si lu. PATCH `/api/notifications/[id]` au clic. Date relative avec date-fns `formatDistanceToNow`.

**NotificationCenter** (`components/notifications/NotificationCenter.tsx`): Realtime `postgres_changes` INSERT sur `notifications` filtré `user_id=eq.{userId}`. Bouton "Tout marquer lu" via Promise.all. Empty state "Aucune notification". Cleanup `supabase.removeChannel(channel)`.

**NotificationBell** (`components/notifications/NotificationBell.tsx`): Badge rouge avec compteur non-lu. Lazy-load au premier clic (fetch `/api/notifications?limit=5`). Realtime pour incrémenter le badge. Fermeture click-outside via `document.addEventListener('mousedown', ...)` avec cleanup.

**GET /api/notifications**: Auth guard, fetch 50 notifications ordonnées par `created_at DESC`, paramètre `?limit=` supporté.

**PATCH /api/notifications/[id]**: Auth guard, vérifie `notification.user_id === user.id`, met à jour `lu=true`.

**Page `/notifications`**: Server Component avec `NotificationCenter` + fetch initial 50 notifications.

**Layouts mis à jour**: `(pro)/layout.tsx` créé (n'existait pas) et `(client)/layout.tsx` enrichis avec nav + `<NotificationBell userId={user.id} initialUnreadCount={unreadCount} />`. unreadCount fetchée server-side via `count: 'exact'`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] (pro)/layout.tsx inexistant**
- **Found during:** Task 2 (add NotificationBell to pro layout)
- **Issue:** Le fichier `apps/web/app/(pro)/layout.tsx` n'existait pas dans le repo. Les pages pro n'avaient pas de layout partagé.
- **Fix:** Créé le layout avec nav (Mes annonces, Visites, Quittances, Profil) + NotificationBell.
- **Files modified:** `apps/web/app/(pro)/layout.tsx`

**2. [Rule 1 - Bug] KYC bucket privé — path stocké, pas publicUrl**
- **Found during:** Task 1 (KYCUploader design)
- **Issue:** Le plan dit "URL" mais le bucket `kyc` est privé — `getPublicUrl()` retournerait une URL inaccessible.
- **Fix:** Stocker `data.path` (le path Supabase Storage) au lieu d'une URL publique dans `profiles.kyc_cni_url`. L'admin peut générer une signed URL via service role pour review.

**3. [Rule 2 - Missing] Paramètre `?limit` dans GET /api/notifications**
- **Found during:** Task 2 (NotificationBell lazy load)
- **Issue:** NotificationBell charge 5 notifications, NotificationsPage charge 50. Un seul endpoint sans paramètre forcerait 50 résultats pour le dropdown.
- **Fix:** Ajout du paramètre `?limit=N` dans GET /api/notifications (capped à 50).

## Known Stubs

Aucun stub — toutes les features sont câblées à des endpoints réels.

## Self-Check: PASSED

Fichiers créés vérifiés :
- `apps/web/components/kyc/KYCStatusBadge.tsx` — FOUND
- `apps/web/components/kyc/KYCUploader.tsx` — FOUND
- `apps/web/app/api/kyc/route.ts` — FOUND
- `apps/web/app/(pro)/profil/page.tsx` — FOUND
- `apps/web/components/notifications/NotificationItem.tsx` — FOUND
- `apps/web/components/notifications/NotificationCenter.tsx` — FOUND
- `apps/web/components/notifications/NotificationBell.tsx` — FOUND
- `apps/web/app/(client)/notifications/page.tsx` — FOUND
- `apps/web/app/api/notifications/route.ts` — FOUND
- `apps/web/app/api/notifications/[id]/route.ts` — FOUND
- `apps/web/app/(pro)/layout.tsx` — FOUND (created, was missing)
- `apps/web/app/(client)/layout.tsx` — MODIFIED (was passthrough, now has nav + NotificationBell)
