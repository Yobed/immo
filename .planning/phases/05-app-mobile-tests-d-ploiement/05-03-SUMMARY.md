---
phase: 05-app-mobile-tests-d-ploiement
plan: 03
subsystem: tests-qualite
tags: [playwright, e2e, maestro, mobile, tests, qualite]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [suite-tests-e2e-web, flows-maestro-mobile]
  affects: [deploiement-ci-cd]
tech_stack:
  added: ["@playwright/test@1.59.1", "playwright-chromium@1.59.1"]
  patterns: ["playwright-webserver-pattern", "maestro-runflow-conditionnel", "role-selectors-accessibilite"]
key_files:
  created:
    - apps/web/playwright.config.ts
    - apps/web/tests/e2e/auth.spec.ts
    - apps/web/tests/e2e/reservation.spec.ts
    - apps/web/tests/e2e/dashboard.spec.ts
    - apps/mobile/.maestro/flows/auth.yaml
    - apps/mobile/.maestro/flows/search-biens.yaml
    - apps/mobile/.maestro/flows/profil.yaml
  modified:
    - apps/web/package.json
decisions:
  - "playwright workers:1 + fullyParallel:false — évite conflits auth state entre tests"
  - "reuseExistingServer: !process.env.CI — local: serveur existant réutilisé, CI: démarrage forcé"
  - "role selectors prioritaires (getByRole, getByPlaceholder) — résistants aux changements CSS Tailwind"
  - "tests dashboard tolérants (console.warn si KPI invisible) — évite faux positifs sur compte vide"
  - "Maestro runFlow conditionnel sur visible Se connecter — search-biens et profil peuvent démarrer sans auth"
metrics:
  duration: 15min
  completed: "2026-04-08"
  tasks: 2
  files: 8
---

# Phase 05 Plan 03: Suite de Tests Qualité (Playwright E2E + Maestro Mobile) Summary

**One-liner:** Suite Playwright 10 tests E2E web (auth/réservation/dashboard) + 3 flows Maestro YAML mobile avec appId ci.immo.app.

## What Was Built

### Playwright — Tests E2E Web

- **playwright.config.ts** — Configuration avec webServer `npm run start` (localhost:3000), 1 worker, retries CI, traces et screenshots on failure.
- **auth.spec.ts** — 3 tests: connexion valide (redirect post-login), erreur mauvais mot de passe, déconnexion depuis /profil.
- **reservation.spec.ts** — 4 tests: liste biens avec FCFA visible, filtre commune Cocody, fiche bien avec bouton réserver, CTA réservation sans auth redirige vers login.
- **dashboard.spec.ts** — 3 tests: KPI cards (revenus/réservations/biens), graphique SVG Recharts, section alertes (pas d'erreur 500).

Total: **10 tests** dans 3 fichiers. `npx playwright test --list` confirme 10 tests.

### Maestro — Flows Mobile

- **auth.yaml** — clearState, login complet, navigation onglets (Accueil/Favoris/Réservations/Profil), logout + retour login.
- **search-biens.yaml** — runFlow conditionnel si non connecté, recherche "Cocody", navigation fiche bien, vérification "Réserver ce bien".
- **profil.yaml** — vérification rôle (Locataire/Propriétaire/Agence), badge KYC (Non soumis/En cours/Approuvé/Rejeté), bouton Déconnexion.

### Package.json — Scripts ajoutés

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui",
"e2e:report": "playwright show-report"
```

## Playwright — Informations Techniques

- **Version installée:** @playwright/test@1.59.1 (Chromium headless 147.0.7727.15)
- **Browser:** Chromium uniquement (Desktop Chrome profile)
- **Résultat `npx playwright test --list`:** 10 tests dans 3 fichiers
- **Pattern sélecteurs:** `getByRole`, `getByPlaceholder`, `getByText` — résistants aux changements Tailwind

## Comptes Test à Créer en Staging

Ces comptes doivent être créés manuellement dans Supabase staging (Auth > Users) avant d'exécuter les tests:

| Email | Rôle | Password | Tests |
|---|---|---|---|
| `test@immo-ci.com` | Locataire | `TestPassword123!` | auth.spec.ts, reservation.spec.ts |
| `proprio@immo-ci.com` | Propriétaire | `TestPassword123!` | dashboard.spec.ts |

Variables d'environnement (optionnel, remplacent les valeurs par défaut):
```bash
TEST_EMAIL=test@immo-ci.com
TEST_PASSWORD=TestPassword123!
PROPRIO_EMAIL=proprio@immo-ci.com
PROPRIO_PASSWORD=TestPassword123!
```

## Exécution Playwright

```bash
# Prérequis: build Next.js (next start requis, pas next dev)
cd apps/web
npm run build

# Lancer tous les tests E2E
npm run e2e

# Mode interactif (UI)
npm run e2e:ui

# Rapport HTML après exécution
npm run e2e:report
```

Note: En local, `reuseExistingServer: true` — si un serveur tourne déjà sur :3000, il est réutilisé. En CI (`CI=true`), un nouveau serveur est toujours démarré.

## Exécution Maestro

**Plateforme:** macOS/Linux uniquement. Sur Windows: utiliser WSL2.

```bash
# Installation Maestro CLI (macOS/Linux uniquement)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Exécuter les flows (device Android connecté en USB ou WiFi ADB)
maestro test apps/mobile/.maestro/flows/auth.yaml
maestro test apps/mobile/.maestro/flows/search-biens.yaml
maestro test apps/mobile/.maestro/flows/profil.yaml

# Exécuter tous les flows en séquence
maestro test apps/mobile/.maestro/flows/

# Debug: voir le flow en temps réel
maestro test apps/mobile/.maestro/flows/auth.yaml --debug-output ./debug-output
```

**Prérequis device:**
- App Expo installée avec `eas build --profile preview` puis APK/IPA installé sur device
- appId: `ci.immo.app` (bundle identifier iOS = package name Android)
- Android SDK 34+ recommandé

**Intégration EAS Workflows (CI):**
```yaml
# .eas/workflows/e2e.yml
- uses: eas/maestro-test
  with:
    flow: apps/mobile/.maestro/flows/auth.yaml
```

**Note Windows:** Maestro CLI n'est pas disponible nativement sur Windows. Utiliser WSL2 (Ubuntu) pour exécuter les flows en développement local.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Les specs E2E sont des fichiers de test — ils ne rendent pas de données en UI. Les flows Maestro font des assertions sur du texte réel de l'app.

## Self-Check: PASSED

Files verified:
- apps/web/playwright.config.ts: FOUND
- apps/web/tests/e2e/auth.spec.ts: FOUND
- apps/web/tests/e2e/reservation.spec.ts: FOUND
- apps/web/tests/e2e/dashboard.spec.ts: FOUND
- apps/mobile/.maestro/flows/auth.yaml: FOUND
- apps/mobile/.maestro/flows/search-biens.yaml: FOUND
- apps/mobile/.maestro/flows/profil.yaml: FOUND

Commits verified:
- 51d9aae: feat(05-03): Playwright config + 3 specs E2E web
- 03525f3: feat(05-03): Flows Maestro YAML — auth, recherche biens, profil KYC mobile

Playwright test --list: 10 tests in 3 files (confirmed)
appId ci.immo.app: present in all 3 Maestro flows (confirmed)
