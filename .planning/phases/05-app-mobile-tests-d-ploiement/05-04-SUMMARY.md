---
phase: 05-app-mobile-tests-d-ploiement
plan: "04"
subsystem: deployment
tags: [vercel, eas, github-actions, expo, mobile, ci-cd]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [deploy-web, deploy-mobile, store-metadata]
  affects: [apps/web, apps/mobile]
tech_stack:
  added: [vercel-cli, eas-cli, github-actions]
  patterns: [turborepo-vercel-monorepo, eas-managed-workflow, semver-tag-trigger]
key_files:
  created:
    - vercel.json
    - apps/mobile/eas.json
    - apps/mobile/store/ios-metadata.md
    - apps/mobile/store/android-metadata.md
    - .github/workflows/deploy-web.yml
    - .github/workflows/eas-build.yml
  modified:
    - apps/mobile/app.json
decisions:
  - "vercel.json sans rootDirectory — Vercel reste à la racine pour que Turborepo résolve les workspaces npm"
  - "newArchEnabled:false — désactive New Architecture SDK 52 pour compatibilité NativeWind v4 et libs tierces"
  - "eas-build utilise --no-wait — builds EAS soumis en asynchrone, pas de timeout CI 60min bloquant"
  - "EAS build séparé par plateforme (android puis ios) — meilleure lisibilité logs et isolation des erreurs"
metrics:
  duration: "8min"
  completed_date: "2026-04-08"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 05 Plan 04: Pipeline Déploiement Vercel + EAS + GitHub Actions Summary

Pipeline déploiement complet configuré : vercel.json Turborepo monorepo, eas.json 3 profils managed workflow, app.json mis à jour, 2 workflows GitHub Actions (CD web sur push main, CD mobile sur tag semver), métadonnées store FR pour App Store et Google Play.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | vercel.json + eas.json + app.json + métadonnées store | af201b9 | vercel.json, apps/mobile/eas.json, apps/mobile/app.json, apps/mobile/store/ios-metadata.md, apps/mobile/store/android-metadata.md |
| 2 | GitHub Actions workflows (deploy-web + eas-build) | cba4d82 | .github/workflows/deploy-web.yml, .github/workflows/eas-build.yml |

## Validation Results

### JSON Validation

- `vercel.json` : JSON valide, `buildCommand: "turbo run build --filter=@immo-ci/web"`, `outputDirectory: "apps/web/.next"`
- `eas.json` : JSON valide, 3 profils (development/preview/production), managed workflow (pas bare/ejected)
- `apps/mobile/app.json` : JSON valide, `bundleIdentifier: "ci.immo.app"`, `package: "ci.immo.app"`, `version: "1.0.0"`, `newArchEnabled: false`

### Workflow Triggers

- `deploy-web.yml` : déclenché sur `push.branches: [main]` et `pull_request.branches: [main]`
- `eas-build.yml` : déclenché sur `push.tags: ['v[0-9]+.[0-9]+.[0-9]+']` (semver)
- `eas build --non-interactive --no-wait` : ne bloque pas le CI

## Placeholder Values (à remplacer)

Trois valeurs placeholder dans `apps/mobile/app.json` à remplacer après `eas init` :

| Champ | Valeur actuelle | Comment obtenir |
|-------|----------------|-----------------|
| `extra.eas.projectId` | `PLACEHOLDER_EAS_PROJECT_ID` | `cd apps/mobile && eas init` → copier l'UUID généré |
| `updates.url` | `https://u.expo.dev/PLACEHOLDER_EAS_PROJECT_ID` | Remplacer PLACEHOLDER par le vrai projectId |
| `submit.ios.ascAppId` dans eas.json | `PLACEHOLDER_ASC_APP_ID` | App Store Connect → app créée → ASC App ID |
| `submit.ios.appleTeamId` dans eas.json | `PLACEHOLDER_APPLE_TEAM_ID` | developer.apple.com → Membership → Team ID |

## GitHub Secrets — Checklist de Configuration

Configurer dans GitHub → Settings → Secrets and variables → Actions :

### Pour `deploy-web.yml`

| Secret | Comment obtenir |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com/account/tokens → Create Token |
| `VERCEL_ORG_ID` | Exécuter `vercel link` localement → lire `.vercel/project.json` champ `orgId` |
| `VERCEL_PROJECT_ID` | Exécuter `vercel link` localement → lire `.vercel/project.json` champ `projectId` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | mapbox.com → Account → Tokens |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | cloudinary.com → Dashboard → Cloud name |

### Pour `eas-build.yml`

| Secret | Comment obtenir |
|--------|----------------|
| `EXPO_TOKEN` | expo.dev/settings/access-tokens → Create Token |

### Variables d'environnement Vercel (dashboard Vercel)

À configurer dans le Vercel Dashboard du projet (Settings → Environment Variables) :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ANTHROPIC_API_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
CINETPAY_API_KEY
CINETPAY_SITE_ID
```

## Séquence de Premier Déploiement

### Étape 1 — Vercel (Web)

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Lier le projet (depuis la racine du monorepo)
vercel link

# 3. Récupérer les IDs (pour GitHub Secrets)
cat .vercel/project.json
# → copier orgId → VERCEL_ORG_ID
# → copier projectId → VERCEL_PROJECT_ID

# 4. Configurer les variables d'env dans Vercel Dashboard
# (voir liste ci-dessus)

# 5. Premier déploiement manuel
vercel --prod
```

### Étape 2 — EAS (Mobile)

```bash
# 1. Installer EAS CLI
npm install -g eas-cli

# 2. Connexion Expo
cd apps/mobile
eas login

# 3. Initialiser le projet EAS (génère le projectId)
eas init

# 4. Mettre à jour app.json avec le vrai projectId
# → Remplacer PLACEHOLDER_EAS_PROJECT_ID dans app.json (2 occurrences)
# → Remplacer dans eas.json: ascAppId + appleTeamId

# 5. Configurer les credentials
eas credentials

# 6. Premier build production
eas build --platform all --profile production
```

### Étape 3 — CI/CD automatique via GitHub Actions

```bash
# Deploy web : push sur main déclenche automatiquement deploy-web.yml
git push origin main

# Deploy mobile : créer un tag semver déclenche eas-build.yml
git tag v1.0.0
git push origin v1.0.0
```

## Fichiers Firebase requis (non gérés par EAS)

Télécharger depuis Firebase Console et placer dans `apps/mobile/` :
- `GoogleService-Info.plist` (iOS) — Firebase Console → Project Settings → iOS app
- `google-services.json` (Android) — Firebase Console → Project Settings → Android app

Ces fichiers sont dans `.gitignore` (contiennent des clés privées) — à stocker dans un secret manager ou à fournir manuellement lors du build EAS via `eas secret`.

## Prochaines étapes

- Workflow Playwright CI (`.github/workflows/playwright.yml`) — nécessite un environnement de staging Next.js avec les variables d'env; à créer en Phase 5 post-déploiement
- Configurer les notifications de build EAS (Slack/email) via EAS Webhooks
- Mettre en place les règles de protection de branche GitHub sur `main` (require PR + status checks)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

- `extra.eas.projectId: "PLACEHOLDER_EAS_PROJECT_ID"` dans `apps/mobile/app.json` — remplacer après `eas init`
- `updates.url` dans `apps/mobile/app.json` — contient le même placeholder
- `ascAppId: "PLACEHOLDER_ASC_APP_ID"` dans `apps/mobile/eas.json` — remplacer depuis App Store Connect
- `appleTeamId: "PLACEHOLDER_APPLE_TEAM_ID"` dans `apps/mobile/eas.json` — remplacer depuis Apple Developer Portal

Ces stubs sont intentionnels et documentés — ils ne peuvent pas être résolus sans un compte Apple Developer et un projet EAS créé. Le plan 05-04 documente la séquence pour les remplacer.

## Self-Check: PASSED

All files created and commits verified:
- FOUND: vercel.json (af201b9)
- FOUND: apps/mobile/eas.json (af201b9)
- FOUND: apps/mobile/app.json (af201b9)
- FOUND: apps/mobile/store/ios-metadata.md (af201b9)
- FOUND: apps/mobile/store/android-metadata.md (af201b9)
- FOUND: .github/workflows/deploy-web.yml (cba4d82)
- FOUND: .github/workflows/eas-build.yml (cba4d82)
