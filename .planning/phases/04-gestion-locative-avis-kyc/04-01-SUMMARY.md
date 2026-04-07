---
phase: "04-gestion-locative-avis-kyc"
plan: "01"
subsystem: "quittances-pipeline"
tags: ["quittances", "pdf", "n8n", "deno", "edge-function", "react-pdf"]
dependency_graph:
  requires: ["03-03"]
  provides: ["quittances-pdf", "generer-quittance-edge-fn", "api-quittances-generer", "n8n-workflow-quittances"]
  affects: ["notifications", "storage-quittances"]
tech_stack:
  added: ["supabase-edge-functions-deno", "n8n-workflow-json"]
  patterns: ["service-role-webhook", "renderToBuffer-createElement", "to-words-currency-false", "edge-fn-coordinator-pattern"]
key_files:
  created:
    - apps/web/lib/quittance-pdf.tsx
    - supabase/functions/generer-quittance/index.ts
    - supabase/functions/generer-quittance/deno.json
    - apps/web/app/api/quittances/generer/route.ts
    - n8n/workflows/quittance-mensuelle.json
  modified: []
decisions:
  - "Edge Function Deno = coordinator uniquement — react-pdf indisponible dans Deno, delegation vers API Next.js"
  - "renderToBuffer(createElement(QuittanceDocument, props)) — pattern obligatoire (pas de JSX direct)"
  - "ToWords currency:false — currency:true genere euros meme avec locale fr-FR"
  - "Idempotence via UNIQUE INDEX (contrat_id, mois) — retour skipped:true si quittance existe deja"
  - "x-service-key header pour authentifier les appels Edge Function -> Next.js"
metrics:
  duration: "15min"
  completed_date: "2026-04-07"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
requirements: [LOC-01, LOC-02]
---

# Phase 04 Plan 01: Pipeline Quittances Mensuelles Automatisees — Summary

**One-liner:** Pipeline quittances mensuelles complet — QuittancePDF (react-pdf + to-words), Edge Function Deno coordinator, API Next.js renderToBuffer + Storage upload, workflow n8n cron 1er du mois avec WhatsApp locataire.

## What Was Built

### Task 1: QuittancePDF Component + Edge Function Deno

**`apps/web/lib/quittance-pdf.tsx`** — Composant React PDF pour quittances mensuelles, clone de `contrat-pdf.tsx` adapté:
- `QuittanceDocument`: affiche loyer + charges + total en **chiffres ET en lettres** FCFA
- `montantEnLettres()`: `ToWords` avec `currency: false` (obligatoire — `currency: true` genere "euros")
- `formatMois('2026-02-01')` retourne "fevrier 2026" via `Intl` locale fr-FR
- `statutLabel()`: mappe les 4 statuts DB en labels lisibles
- Styles identiques a `contrat-pdf.tsx` (palette #1A5276)

**`supabase/functions/generer-quittance/index.ts`** — Edge Function Deno (coordinateur):
- CORS headers standard Supabase
- Recoit `{contratId, mois?}` en JSON
- Delègue à `/api/quittances/generer` via HTTP POST avec `x-service-key`
- `@react-pdf/renderer` absent (incompatible Deno) — pattern coordinator correct

### Task 2: API Webhook Next.js + Workflow n8n

**`apps/web/app/api/quittances/generer/route.ts`** — POST webhook complet:
- Service role key (appelable depuis n8n sans auth cookie)
- Calcul automatique du mois courant (1er du mois) si non fourni
- Date d'echeance: 5 du mois
- Fetch contrat + bien + profiles (locataire + proprietaire) en une query Supabase
- Idempotence: verifie UNIQUE INDEX `(contrat_id, mois)` avant insert — retourne `skipped: true` si deja existant
- `renderToBuffer(createElement(QuittanceDocument, props))` — pattern obligatoire
- Upload Storage bucket 'quittances', URL signee 1 an
- Update `pdf_url` dans la table quittances
- Insert notification `loyer_rappel` pour le locataire

**`n8n/workflows/quittance-mensuelle.json`** — Workflow n8n exportable v1:
- 4 noeuds: `scheduleTrigger` (cron) → `postgres` (query) → `httpRequest` (generer PDF) → `httpRequest` (WhatsApp)
- Cron `0 7 1 * *` — 1er du mois a 07:00 timezone Africa/Abidjan (GMT+0, pas de DST)
- Query SQL: contrats statut='signe' avec date_fin IS NULL ou future
- HTTP POST vers `N8N_WEBHOOK_BASE_URL/api/quittances/generer` avec `{contratId}`
- WhatsApp via Meta WABA API — message avec pdfUrl du JSON precedent
- Variables env: `N8N_WEBHOOK_BASE_URL`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`
- Credentials Postgres: `supabase-pg-creds` (a configurer dans l'instance n8n)

## Patterns Etablis

| Pattern | Application |
|---|---|
| `currency: false` | ToWords dans quittance-pdf.tsx |
| `createElement(Component, props)` | renderToBuffer dans route.ts |
| Service role key | createServerClient dans route.ts |
| Edge Function coordinator | generer-quittance/index.ts -> /api/quittances/generer |
| `(supabase.from(...) as any)` | Tables non typees dans database.ts placeholder |

## Deviations from Plan

None — plan executed exactly as written.

Decisions aligned with STATE.md:
- `supabase.from() cast to any` — database.ts est un placeholder minimal
- `renderToBuffer(createElement(...))` — pattern obligatoire de 03-03
- `currency: false` — pattern obligatoire de 03-03
- Service role key pattern — meme pattern que contrats/generer/route.ts

## Known Stubs

None — tous les champs sont reellement utilises depuis la DB. Les valeurs par defaut ('Non renseigne', '—') sont des fallbacks defaut de null DB, pas des stubs.

## Self-Check

### Files Created
- `apps/web/lib/quittance-pdf.tsx` — exporte QuittanceDocument, QuittanceProps, montantEnLettres
- `supabase/functions/generer-quittance/index.ts` — Edge Function Deno coordinator
- `supabase/functions/generer-quittance/deno.json` — config Deno imports vide
- `apps/web/app/api/quittances/generer/route.ts` — POST webhook avec renderToBuffer + Storage
- `n8n/workflows/quittance-mensuelle.json` — JSON valide, 4 noeuds, cron 0 7 1 * *

### Key Criteria
- QuittanceDocument exporte: oui (QuittanceDocument, QuittanceProps, montantEnLettres)
- currency: false: oui (ligne ToWords converterOptions)
- renderToBuffer + createElement: oui (route.ts ligne pdfBuffer)
- Service role key: oui (createServerClient avec SUPABASE_SERVICE_ROLE_KEY)
- Notification loyer_rappel: oui (supabase.from('notifications').insert)
- Idempotence skipped:true: oui (verifie existing avant insert)
- n8n JSON 4 noeuds: oui (cron, postgres, http-generer, whatsapp)
- Cron 0 7 1 * *: oui (scheduleTrigger expression)
- Aucun react-pdf dans Edge Function: oui (pas d'import @react-pdf)

## Self-Check: PASSED
