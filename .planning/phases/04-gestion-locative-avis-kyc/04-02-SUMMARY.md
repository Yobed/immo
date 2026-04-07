---
phase: 04-gestion-locative-avis-kyc
plan: "02"
subsystem: api
tags: [whatsapp, n8n, relances, quittances, notifications, webhooks, cron]

# Dependency graph
requires:
  - phase: 03-paiements-r-servations-ia-dashboard
    provides: service role webhook pattern (paiements webhook), Server Component + Supabase pattern (dashboard)
  - phase: 01-fondations-infrastructure
    provides: Supabase schema (quittances, notifications tables), database.ts, createClient pattern
provides:
  - sendWhatsApp() — client WhatsApp Business API Graph v19.0 réutilisable
  - RELANCE_MESSAGES — 4 templates jalons J-3/J-1/J+1/J+7
  - POST /api/quittances/webhook — mise à jour statut en_retard + notifications
  - n8n workflow JSON — cron quotidien 08:00 Abidjan, SQL jalons, WhatsApp + webhook
  - Page /pro/quittances — liste filtrée par statut pour le propriétaire
affects: [04-gestion-locative-avis-kyc, 05-app-mobile-tests-deploiement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WhatsApp Business API Graph v19.0 via fetch direct (pas de SDK)"
    - "n8n workflow JSON exportable avec SQL CASE WHEN pour jalons"
    - "Service role webhook pattern (n8n → Next.js toujours HTTP 200)"
    - "searchParams Promise<{statut?:string}> pour filtres Server Component Next.js 14"

key-files:
  created:
    - apps/web/lib/whatsapp.ts
    - apps/web/app/api/quittances/webhook/route.ts
    - n8n/workflows/relance-loyer.json
    - apps/web/app/(pro)/quittances/page.tsx
  modified: []

key-decisions:
  - "sendWhatsApp normalise E.164 en supprimant les espaces et en ajoutant '+' si absent"
  - "Webhook retourne toujours HTTP 200 — n8n retente indéfiniment sur non-200"
  - "Guard .eq('statut','en_attente') avant update en_retard — évite écrasement si déjà en retard"
  - "Stats rapides basées sur fetch séparé (toutes quittances) vs liste filtrée — totaux globaux toujours visibles"
  - "variant 'danger' pour en_retard dans Badge — 'error' n'existe pas dans Badge.tsx"
  - "n8n/workflows/ créé à la racine du projet (pas dans apps/) — convention infrastructure"

patterns-established:
  - "WhatsApp pattern: fetch direct graph.facebook.com/v19.0/{ID}/messages + Bearer token"
  - "Webhook n8n pattern: service role createServerClient<any> + always return 200"
  - "Page quittances: Server Component + await searchParams + cast supabase.from() as any"

requirements-completed: [LOC-03, LOC-04, LOC-05]

# Metrics
duration: 15min
completed: 2026-04-07
---

# Phase 4 Plan 02: Relances Automatiques Loyers Impayés — Summary

**Client WhatsApp Business API + workflow n8n cron quotidien 08:00 Abidjan avec jalons J-3/J-1/J+1/J+7, webhook Next.js mise à jour statut en_retard + notifications, page /pro/quittances filtrée par statut.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-07T20:55:26Z
- **Completed:** 2026-04-07T21:10:00Z
- **Tasks:** 2 completed
- **Files modified:** 4 created

## Accomplishments

- Client WhatsApp réutilisable `sendWhatsApp(to, body)` avec normalisation E.164, gestion d'erreurs `WhatsAppError`, et 4 templates `RELANCE_MESSAGES` (J-3/J-1/J+1/J+7)
- Webhook `/api/quittances/webhook` service role — met à jour statut `en_retard` à J+1 (guard statut=en_attente), insère notifications locataire (J-3/J-1/J+1) et propriétaire (J+7), retourne toujours HTTP 200
- Workflow n8n JSON complet — 5 noeuds: cron `0 8 * * *` Africa/Abidjan, SQL `CASE WHEN` jalons, Filter (jalon non null), HTTP WhatsApp, HTTP webhook Next.js
- Page `/pro/quittances` Server Component — 4 filtres par statut (liens Next.js), 4 stats rapides, liste avec Badge coloré (`danger` pour en_retard), lien PDF si `pdf_url` présent

## Task Commits

1. **Task 1: WhatsApp client + webhook relances** — feat(04-02): WhatsApp client + webhook relances quittances
2. **Task 2: Workflow n8n + page quittances** — feat(04-02): workflow n8n relances + page quittances proprietaire

## Files Created/Modified

- `apps/web/lib/whatsapp.ts` — Client WhatsApp Business API: sendWhatsApp(), RELANCE_MESSAGES, WhatsAppError
- `apps/web/app/api/quittances/webhook/route.ts` — POST webhook service role: statut en_retard J+1, notifications locataire/proprio
- `n8n/workflows/relance-loyer.json` — Workflow n8n 5 noeuds: cron 08:00 Abidjan, SQL jalons, WhatsApp, webhook
- `apps/web/app/(pro)/quittances/page.tsx` — Page Server Component: liste quittances filtrée, stats, badges colorés

## Decisions Made

- `sendWhatsApp` normalise le numéro E.164 en supprimant les espaces et en préfixant `+` si absent — robustesse avec les numéros Ivoiriens souvent stockés sans `+`
- Guard `.eq('statut', 'en_attente')` avant update `en_retard` — si le workflow tourne deux fois (idempotence), le statut ne revient pas de `payee` à `en_retard`
- Stats rapides basées sur une query séparée (sans filtre statut) — les compteurs restent visibles même quand un filtre est actif
- Variant `danger` (pas `error`) pour `en_retard` dans `STATUT_BADGE` — conformément au Badge.tsx existant

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Stats rapides globales vs filtrées**
- **Found during:** Task 2 (page quittances)
- **Issue:** Le plan affichait les stats depuis la liste filtrée — si le filtre `?statut=en_retard` était actif, tous les compteurs afficheraient seulement les en_retard
- **Fix:** Ajout d'une query Supabase séparée `.select('statut')` sans filtre pour les stats globales
- **Files modified:** apps/web/app/(pro)/quittances/page.tsx
- **Verification:** Page affiche stats globales indépendamment du filtre actif

---

**Total deviations:** 1 auto-fixed (Rule 2 — correctness)
**Impact on plan:** Fix de correctness UX — aucun scope creep.

## Issues Encountered

- Répertoire `n8n/` inexistant à la racine — créé `n8n/workflows/` (Rule 3 auto-fix, blocage infrastructure)

## User Setup Required

Configurer les variables d'environnement suivantes dans `.env.local`:

```
WHATSAPP_PHONE_NUMBER_ID=<ID du numéro WhatsApp Business>
WHATSAPP_ACCESS_TOKEN=<Token d'accès Meta Graph API>
```

Dans n8n:
1. Créer une credential Postgres `supabase-pg-creds` pointant sur la DB Supabase
2. Définir la variable d'environnement n8n `N8N_WEBHOOK_BASE_URL` = URL de l'application Next.js (ex: `https://immo-ci.vercel.app/webhook`)
3. Définir `WHATSAPP_PHONE_NUMBER_ID` et `WHATSAPP_ACCESS_TOKEN` dans les variables d'environnement n8n
4. Importer `n8n/workflows/relance-loyer.json` via l'interface n8n → activer le workflow

## Known Stubs

Aucun stub — `sendWhatsApp` appelle l'API Graph réelle, le webhook insère en Supabase via service role, la page charge les vraies données propriétaire.

## Next Phase Readiness

- `sendWhatsApp()` disponible pour tout autre module nécessitant des alertes WhatsApp (avis, KYC)
- Pattern webhook n8n → Next.js établi et documenté pour plans suivants
- Page quittances prête — les quittances elles-mêmes seront générées automatiquement par un workflow futur (04-03 ou migration)
- Aucun bloqueur pour 04-03 (Avis locataires)

---
*Phase: 04-gestion-locative-avis-kyc*
*Completed: 2026-04-07*
