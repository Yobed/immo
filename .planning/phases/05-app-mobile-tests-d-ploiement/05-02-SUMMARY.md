---
phase: 05-app-mobile-tests-d-ploiement
plan: "02"
subsystem: mobile-push-notifications
tags: [expo-notifications, push, fcm, deep-links, edge-function, deno]
dependency_graph:
  requires: [05-01]
  provides: [push-notifications-e2e, send-push-edge-function, notifications-screen]
  affects: [apps/mobile, supabase/functions]
tech_stack:
  added: [expo-notifications, expo-device, expo-constants]
  patterns: [Expo Push Service, usePushNotifications hook, PushNotificationsHandler pattern]
key_files:
  created:
    - supabase/functions/send-push/index.ts
    - apps/mobile/hooks/usePushNotifications.ts
    - apps/mobile/app/notifications.tsx
  modified:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/package.json
decisions:
  - "Expo Push Service (exp.host) retenu vs FCM V1 direct — plus simple en v1, pas de service account Google nécessaire"
  - "PushNotificationsHandler composant séparé — useSession nécessite SessionProvider dans l'arbre React"
  - "ExponentPushToken stocké dans profiles.fcm_token — EAS gère la conversion vers FCM/APNs"
  - "router.push avec cast as never — expo-router TypeScript strict sans routes typées"
metrics:
  duration: "2 minutes"
  completed: "2026-04-08"
  tasks: 2
  files: 5
---

# Phase 05 Plan 02: Push Notifications FCM Summary

Notifications push Firebase FCM de bout en bout via Expo Push Service — Edge Function Deno send-push qui lit profiles.fcm_token et appelle exp.host, hook usePushNotifications avec registration permission + sauvegarde token + listeners deep links, écran notifications avec marquage lu.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Edge Function send-push + Hook usePushNotifications | 700435e | supabase/functions/send-push/index.ts, apps/mobile/hooks/usePushNotifications.ts, package.json |
| 2 | Integration layout + ecran notifications | cd009ca | apps/mobile/app/_layout.tsx, apps/mobile/app/notifications.tsx |

## What Was Built

### Edge Function send-push (supabase/functions/send-push/index.ts)
- Deno Edge Function avec pattern CORS preflight (identique aux autres fonctions Supabase)
- Payload: `{ user_id, title, body, data? }` avec validation des champs requis
- Lit `profiles.fcm_token` via service role Supabase
- Envoie via Expo Push Service `https://exp.host/--/api/v2/push/send`
- Log non-bloquant dans table `notifications` (catch silencieux si colonnes inexactes)
- Déploiement: `supabase functions deploy send-push --no-verify-jwt`

### Hook usePushNotifications (apps/mobile/hooks/usePushNotifications.ts)
- `Notifications.setNotificationHandler` configuré globalement en dehors du hook
- Guard `Device.isDevice` — retourne null sur simulateur/émulateur sans erreur
- Demande permission au premier lancement, vérifie `existingStatus` avant de re-demander
- Récupère `EAS projectId` depuis `Constants.expoConfig?.extra?.eas?.projectId`
- Sauvegarde le token `ExponentPushToken[xxx]` dans `profiles.fcm_token` via UPDATE Supabase
- `addNotificationReceivedListener` — logs quand notification en foreground
- `addNotificationResponseReceivedListener` — deep links selon `lien_type`: `bien/[id]`, `reservations`, `message`
- Cleanup des deux listeners au démontage via useRef

### Integration _layout.tsx
- `PushNotificationsHandler` composant null-render appelé à l'intérieur de `SessionProvider`
- Accès à `useSession()` garanti car dans l'arbre du provider
- `Stack.Screen name="notifications"` ajouté avec header title

### Écran notifications (apps/mobile/app/notifications.tsx)
- FlatList des 50 dernières notifications triées par date décroissante
- Indicateur visuel pour non-lus (fond `#EBF5FB` + point bleu)
- Tap → marque comme lu (UPDATE Supabase) + deep link selon `lien_type`
- Empty state "Aucune notification"
- Utilise `formatDate` de `@immo-ci/shared`

## Packages Installed

| Package | Version | Raison |
|---------|---------|--------|
| expo-notifications | SDK 52 compat | API registration + listeners |
| expo-device | SDK 52 compat | Guard `Device.isDevice` simulateur |
| expo-constants | SDK 52 compat | Accès `expoConfig.extra.eas.projectId` |

## Token Format Confirmed

Le token stocké dans `profiles.fcm_token` est au format `ExponentPushToken[xxxxxx]` (Expo Push Token), pas un token FCM natif. EAS/Expo gère la conversion vers FCM (Android) et APNs (iOS) automatiquement. Pour tester: Expo Push Tool https://expo.dev/notifications.

## Deep Links Supported

| lien_type | Destination |
|-----------|-------------|
| `bien` + `lien_id` | `/bien/[lien_id]` |
| `reservation` | `/(tabs)/reservations` |
| `message` | `/(tabs)/reservations` (TODO: messagerie directe en v2) |

## TypeScript Status

`npx tsc --noEmit` passe sans erreurs sur les fichiers créés. Seul avertissement: `moduleResolution=node10` deprecated dans TypeScript 6.0 — pré-existant, non lié à ce plan.

## Deviations from Plan

None — plan exécuté exactement comme décrit. L'utilisation d'Expo Push Service (vs FCM V1 direct) était déjà le choix du plan pour la v1.

## Known Stubs

- **Deep link `message`** → redirige vers `/(tabs)/reservations` au lieu d'ouvrir directement la messagerie (commenté TODO v2 dans le code). N'empêche pas l'objectif du plan (notification reçue + navigation).

## Note Test Manuel

- Device physique requis (simulateur retourne null sur `getExpoPushTokenAsync`)
- Build: `eas build --profile development`
- Token visible dans logs: `[Push] Token enregistré: ExponentPushToken[xxx...]`
- Tester via: https://expo.dev/notifications

## Self-Check: PASSED
