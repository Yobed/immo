---
phase: 05-app-mobile-tests-d-ploiement
plan: 01
subsystem: ui
tags: [expo, react-native, supabase, expo-router, mobile, navigation, auth, firebase-fcm]

# Dependency graph
requires:
  - phase: 01-fondations-infrastructure
    provides: Supabase schema (14 tables), packages/shared types (Database, formatFCFA, formatDate)
  - phase: 04-gestion-locative-avis-kyc
    provides: profiles table avec kyc_statut, reservations, favoris tables
provides:
  - App Expo scaffoldée avec navigation Expo Router (onglets + auth + bien détail)
  - Migration SQL 009 ajoutant fcm_token à profiles
  - Client Supabase React Native configuré (detectSessionInUrl:false, expo-sqlite localStorage)
  - Hook useAuth avec SessionProvider + AuthGuard + useSession
  - 4 onglets navigables: Accueil (FlatList biens), Favoris, Réservations, Profil
  - Composants BienCard et StatutBadge avec palette CI
affects: [05-02-tests, 05-03-push-notifications, 05-04-deploiement]

# Tech tracking
tech-stack:
  added:
    - expo-sqlite (localStorage polyfill pour Supabase auth persistance)
    - expo-image (Image optimisée avec blurhash placeholder)
    - react-native-url-polyfill (URL API pour runtime Hermes)
    - react-native-safe-area-context (safe areas iOS/Android)
    - react-native-screens (navigation native performance)
  patterns:
    - StyleSheet natif uniquement (pas NativeWind/className)
    - Palette CI via constants/theme.ts (colors, spacing, borderRadius, typography)
    - AuthGuard via useSegments() — pattern SDK 52 compatible (pas Stack.Protected)
    - Import ordre critique supabase.ts: url-polyfill > expo-sqlite/localStorage > createClient
    - BienListItem type local (pas Bien depuis shared — schéma réel diffère du plan)

key-files:
  created:
    - supabase/migrations/009_fcm_token.sql
    - apps/mobile/lib/supabase.ts
    - apps/mobile/hooks/useAuth.tsx
    - apps/mobile/constants/theme.ts
    - apps/mobile/.env.example
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/(auth)/_layout.tsx
    - apps/mobile/app/(auth)/login.tsx
    - apps/mobile/app/(auth)/register.tsx
    - apps/mobile/app/(tabs)/_layout.tsx
    - apps/mobile/app/(tabs)/index.tsx
    - apps/mobile/app/(tabs)/favoris.tsx
    - apps/mobile/app/(tabs)/reservations.tsx
    - apps/mobile/app/(tabs)/profil.tsx
    - apps/mobile/app/bien/[id].tsx
    - apps/mobile/components/BienCard.tsx
    - apps/mobile/components/StatutBadge.tsx
  modified:
    - apps/mobile/app/_layout.tsx (remplacé layout vide)
    - apps/mobile/package.json (ajout dépendances expo-sqlite, expo-image, etc.)

key-decisions:
  - "useAuth.tsx (pas .ts) — JSX dans hooks nécessite extension .tsx"
  - "BienListItem type local au lieu de Bien depuis shared — schéma réel biens: prix_mois_fcfa/prix_vente_fcfa, pas prix; pas de photo_principale_url sur biens"
  - "profiles.full_name (pas nom+prenom) — schéma réel; initiales extraites via split(' ')"
  - "detectSessionInUrl:false obligatoire — crash Hermes sinon (pas de browser URL en RN)"
  - "expo-sqlite localStorage pattern — alternative moderne à AsyncStorage pour Supabase auth"

patterns-established:
  - "StyleSheet natif uniquement dans apps/mobile/ — aucun className, aucun NativeWind"
  - "Type Database['public']['Tables']['biens']['Row'] pour typer les données Supabase en mobile"
  - "AuthGuard via useSegments()[0] === '(auth)' — pattern Expo Router SDK 52"
  - "BienCard accepte BienListItem (type local flexible) pas le Row type Supabase directement"

requirements-completed: [MOB-01, MOB-02]

# Metrics
duration: 9min
completed: 2026-04-08
---

# Phase 05 Plan 01: App Mobile Scaffold Summary

**App Expo navigable scaffoldée avec Expo Router SDK 52, client Supabase RN (detectSessionInUrl:false + expo-sqlite localStorage), AuthGuard via useSegments, 4 onglets CI-styled avec StyleSheet natif, et migration 009 ajoutant fcm_token à profiles**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-08T14:49:37Z
- **Completed:** 2026-04-08T14:58:22Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments

- Migration SQL 009 crée `fcm_token TEXT` sur `profiles` (préparation notifications push FCM Phase 05-03)
- Client Supabase React Native avec ordre d'imports critique (url-polyfill > expo-sqlite/localStorage > createClient) et detectSessionInUrl:false
- Hook useAuth.tsx avec SessionProvider (expo-sqlite persistance), AuthGuard (useSegments pattern SDK 52), useSession
- Navigation Expo Router complète: Stack root + Auth group (login/register) + Tabs group (4 onglets) + fiche bien /bien/[id]
- 4 onglets opérationnels: Accueil (FlatList biens publiés + SearchBar), Favoris (jointure biens), Réservations (avec StatutBadge), Profil (full_name + KYC badge + logout)
- Composants BienCard (expo-image, prix_mois/vente_fcfa) et StatutBadge (8 statuts, palette CI)
- TypeScript clean: 0 erreurs (1 warning deprecation tsconfig Expo — non bloquant)

## Task Commits

1. **Task 1: Migration 009 + Client Supabase RN + Hook useAuth** - `85ff6c9` (feat)
2. **Task 2: Root layout + Layouts auth/tabs + Composants BienCard + StatutBadge** - `d2fdffb` (feat)
3. **Task 3: Écrans onglets + Fiche bien** - `63a0fd3` (feat)

## Files Created/Modified

- `supabase/migrations/009_fcm_token.sql` - ALTER TABLE profiles ADD COLUMN fcm_token TEXT
- `apps/mobile/lib/supabase.ts` - Client Supabase RN avec detectSessionInUrl:false + url-polyfill
- `apps/mobile/hooks/useAuth.tsx` - SessionProvider + AuthGuard (useSegments) + useSession
- `apps/mobile/constants/theme.ts` - Palette CI (primary #1A5276, secondary #E67E22, spacing, typography)
- `apps/mobile/.env.example` - Template EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
- `apps/mobile/app/_layout.tsx` - Root Stack avec SessionProvider > AuthGuard wrapper
- `apps/mobile/app/(auth)/_layout.tsx` - Layout auth sans header
- `apps/mobile/app/(auth)/login.tsx` - Connexion email+password avec Alert et loader
- `apps/mobile/app/(auth)/register.tsx` - Inscription avec full_name + message vérification email
- `apps/mobile/app/(tabs)/_layout.tsx` - 4 onglets avec icônes Ionicons palette CI
- `apps/mobile/app/(tabs)/index.tsx` - FlatList biens publiés + SearchBar ilike + RefreshControl
- `apps/mobile/app/(tabs)/favoris.tsx` - Favoris utilisateur avec jointure biens + empty state
- `apps/mobile/app/(tabs)/reservations.tsx` - Réservations locataire + StatutBadge + formatDate
- `apps/mobile/app/(tabs)/profil.tsx` - Profil full_name, rôle, KYC StatutBadge, déconnexion
- `apps/mobile/app/bien/[id].tsx` - Fiche bien ScrollView avec tous champs réels + CTA réserver
- `apps/mobile/components/BienCard.tsx` - Carte bien expo-image + prix mensuel/vente + navigation
- `apps/mobile/components/StatutBadge.tsx` - Badge statut coloré (8 statuts: en_attente→non_soumis)

## Decisions Made

- `useAuth.tsx` (pas `.ts`) — JSX dans hooks React Native nécessite l'extension `.tsx`
- `BienListItem` type local défini dans BienCard.tsx — le schéma réel de `biens` n'a pas `prix` ni `photo_principale_url` (colonnes: `prix_mois_fcfa`, `prix_vente_fcfa`; photos dans `biens_medias`)
- `profiles.full_name` (pas `nom`+`prenom`) — schéma réel généré par Supabase CLI; initiales extraites par split(' ')
- `detectSessionInUrl:false` obligatoire — crash Hermes/React Native si activé (pas de browser URL)
- `expo-sqlite/localStorage/install` comme storage Supabase auth — pattern moderne alternative AsyncStorage

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] hooks/useAuth.ts renommé en hooks/useAuth.tsx**
- **Found during:** Task 3 (vérification TypeScript `npx tsc --noEmit`)
- **Issue:** Le hook useAuth contient du JSX (SessionContext.Provider) mais était nommé `.ts` — TypeScript retournait 9 erreurs de parsing (TS1005, TS1128, TS1109...)
- **Fix:** Renommé `useAuth.ts` → `useAuth.tsx` via git mv. Les imports extensionless (`from '../hooks/useAuth'`) continuent de fonctionner.
- **Files modified:** `apps/mobile/hooks/useAuth.tsx` (renommé)
- **Verification:** `npx tsc --noEmit` retourne 0 erreurs après le renommage
- **Committed in:** `63a0fd3` (Task 3 commit)

**2. [Rule 1 - Bug] Schéma biens adapté: prix_mois_fcfa/prix_vente_fcfa au lieu de prix**
- **Found during:** Task 2 (création BienCard.tsx)
- **Issue:** Le plan référençait `bien.prix` et `bien.photo_principale_url` qui n'existent pas dans le schéma réel (`packages/shared/types/database.ts` ligne 117-146)
- **Fix:** BienCard utilise `prix_mois_fcfa`/`prix_vente_fcfa` avec label contextuel ($/mois ou vente); photo placeholder (photos dans `biens_medias` séparé)
- **Files modified:** `apps/mobile/components/BienCard.tsx`, tous les écrans qui utilisent BienListItem
- **Verification:** TypeScript compile sans erreurs
- **Committed in:** `d2fdffb` (Task 2 commit)

**3. [Rule 1 - Bug] profiles.full_name au lieu de nom+prenom**
- **Found during:** Task 2 (création ProfilScreen)
- **Issue:** Le plan référençait `profile.nom` et `profile.prenom` qui n'existent pas — schéma réel: `full_name TEXT` (ligne 618 database.ts)
- **Fix:** Profil utilise `full_name`, initiales extraites via `split(' ')` pour l'avatar
- **Files modified:** `apps/mobile/app/(tabs)/profil.tsx`
- **Verification:** TypeScript compile sans erreurs
- **Committed in:** `63a0fd3` (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 1 bugs — schéma réel vs plan spec)
**Impact on plan:** Tous les fixes nécessaires pour correspondre au vrai schéma Supabase. Aucun scope creep.

## Issues Encountered

- Deprecation warning TypeScript: `Option 'moduleResolution=node10' is deprecated` — provient de `expo/tsconfig.base`, non bloquant. Fix: ajouter `"ignoreDeprecations": "6.0"` dans le tsconfig mobile si nécessaire en Phase 05-04.

## Known Stubs

- `cover_url: null` dans tous les appels Supabase — les images de couverture (biens_medias) ne sont pas encore jointurées dans les listes. La BienCard affiche un placeholder. Plan 05-02 ou 05-04 pourra ajouter la jointure `biens_medias?select=url&est_couverture=true&limit=1`.
- Bouton "Réserver ce bien" dans fiche bien ouvre une Alert informative — le flow réservation complet est sur l'app web (CinetPay). Prévu pour rester comme tel en v1.

## User Setup Required

Pour tester l'app mobile:
1. Copier `apps/mobile/.env.example` vers `apps/mobile/.env`
2. Renseigner `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. `cd apps/mobile && npx expo start`

## Next Phase Readiness

- Foundation mobile complète — Plans 05-02 (tests E2E), 05-03 (push notifications FCM), 05-04 (déploiement) peuvent commencer
- Migration 009 fcm_token en attente d'application sur le projet Supabase production
- TypeScript 0 erreurs confirmé

---
*Phase: 05-app-mobile-tests-d-ploiement*
*Completed: 2026-04-08*
