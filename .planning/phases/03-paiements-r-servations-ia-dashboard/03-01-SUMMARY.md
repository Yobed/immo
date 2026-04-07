---
phase: 03-paiements-r-servations-ia-dashboard
plan: "01"
subsystem: paiements-cinetpay
tags: [cinetpay, paiements, webhook, commission, split]
dependency_graph:
  requires: []
  provides: [cinetpay-integration, paiements-routes, paiement-button]
  affects: [apps/web/lib/cinetpay.ts, apps/web/app/api/paiements, apps/web/components/paiements]
tech_stack:
  added: ["@anthropic-ai/sdk", "@react-pdf/renderer", "recharts", "@tremor/react", "to-words"]
  patterns: [CinetPay redirect flow, webhook /v2/payment/check verification, SUPABASE_SERVICE_ROLE_KEY for webhook RLS bypass]
key_files:
  created:
    - apps/web/lib/cinetpay.ts
    - apps/web/app/api/paiements/initier/route.ts
    - apps/web/app/api/paiements/webhook/route.ts
    - apps/web/app/(client)/paiement/retour/page.tsx
    - apps/web/components/paiements/PaiementButton.tsx
  modified:
    - apps/web/package.json
---

## Plan 03-01 — CinetPay Integration

### What was built

**Task 1 — Deps + lib/cinetpay.ts**
- Installed all Phase 3 deps: `@anthropic-ai/sdk`, `@react-pdf/renderer`, `recharts`, `@tremor/react`, `to-words` via `npm install --legacy-peer-deps`
- `apps/web/lib/cinetpay.ts` — helpers: `calculerSplit()` (10% commission arrondi XOF /5), `arrondir5()`, `initierPaiement()` (POST /v2/payment), `verifierPaiement()` (POST /v2/payment/check — obligatoire webhook)

**Task 2 — Routes API + composant**
- `POST /api/paiements/initier` — auth-gated, crée transaction dans `paiements` (statut=initie), appelle CinetPay, retourne `payment_url`
- `POST /api/paiements/webhook` — unauthenticated, appelle `verifierPaiement()` puis met à jour `paiements` statut + `reservations` statut si ACCEPTED
- `app/(client)/paiement/retour/page.tsx` — page retour CinetPay avec statut visuel
- `components/paiements/PaiementButton.tsx` — bouton client qui POSTe à `/api/paiements/initier` et redirige vers `payment_url`

### Key decisions
- Webhook utilise `SUPABASE_SERVICE_ROLE_KEY` pour bypass RLS (endpoint non authentifié)
- `verifierPaiement()` obligatoire — le body du webhook ne contient pas le statut final
- Montants arrondis au multiple de 5 FCFA (règle XOF CinetPay)
- Commission 10% calculée côté serveur uniquement

### Self-Check: PASSED
