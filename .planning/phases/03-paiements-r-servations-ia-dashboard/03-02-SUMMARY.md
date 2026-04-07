---
phase: 03-paiements-r-servations-ia-dashboard
plan: 02
subsystem: api, ui
tags: [nextjs, supabase, reservations, cinetpay, date-conflict]

# Dependency graph
requires:
  - phase: 03-paiements-r-servations-ia-dashboard/03-01
    provides: PaiementButton + /api/paiements/initier (CinetPay)
  - phase: 01-fondations-infrastructure/01-02
    provides: migrations reservations + contrats tables
provides:
  - POST /api/reservations avec detection overlap de dates (409 si conflit)
  - GET /api/reservations liste reservations du locataire
  - ReservationFlow composant multi-etapes (dates -> recap -> paiement)
  - DatePicker composant avec validation min/max dates
  - Page /reservations/nouvelle?bienId= pour initier une reservation
  - Page /reservations/[id] statut colore + lien PDF contrat conditionnel
affects:
  - 03-03-contrats (consomme reservation.id pour generer PDF)
  - 03-04-dashboard (lit reservations.statut pour KPIs proprietaire)
  - 04-gestion-locative (status confirmee declenche quittances)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Overlap SQL via .lte('date_debut', dateFin).gte('date_fin', dateDebut)"
    - "proprietaire_id requis sur insert reservations — fetch depuis biens avant insert"
    - "PaiementButton reutilise sur page statut pour reservations en_attente non payees"

key-files:
  created:
    - apps/web/app/api/reservations/route.ts
    - apps/web/components/reservation/DatePicker.tsx
    - apps/web/components/reservation/ReservationFlow.tsx
    - apps/web/app/(client)/reservations/nouvelle/page.tsx
    - apps/web/app/(client)/reservations/[id]/page.tsx
  modified: []

key-decisions:
  - "Schema reservations utilise montant_loyer_fcfa + montant_total_fcfa (pas montant_fcfa comme dans spec plan)"
  - "Statut terminee remplace expiree — schema migration 004 ne definit pas expiree"
  - "proprietaire_id NOT NULL sur reservations — fetch bien.proprietaire_id avant insert"
  - "contrats lie via reservation_id FK (pas contrat_id sur reservations) — join via relation inverse Supabase"
  - "PaiementButton affiche aussi sur page statut si reservation encore en_attente"

patterns-established:
  - "Overlap date check: .not('statut','in','(\"annulee\",\"terminee\")').lte('date_debut',fin).gte('date_fin',debut)"
  - "ReservationFlow 3 steps: state machine dates|recap|paiement avec useState"

requirements-completed: [RESA-01, RESA-02, RESA-03, RESA-04, RESA-05, RESA-06]

# Metrics
duration: 15min
completed: 2026-04-06
---

# Phase 3 Plan 02: Reservations Summary

**Flow reservation complet : conflict-check SQL + creation en_attente + ReservationFlow multi-etapes (DatePicker -> recap -> PaiementButton CinetPay) + page statut avec lien contrat PDF**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-06T00:00:00Z
- **Completed:** 2026-04-06T00:15:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- API POST /api/reservations avec overlap check (lte/gte SQL) retournant 409 si conflit
- ReservationFlow 3 etapes (dates -> recap -> confirmation -> PaiementButton)
- DatePicker avec validation client (dates non vides, fin > debut)
- Page statut /reservations/[id] avec statut colore et lien PDF conditionnel sur contrats.pdf_url
- PaiementButton integre sur page statut si reservation encore en_attente

## Task Commits

1. **Task 1: Route API POST /api/reservations avec detection conflits** - `f929297` (feat)
2. **Task 2: ReservationFlow composant + pages nouvelle et statut** - `99fdd99` (feat)

## Files Created/Modified

- `apps/web/app/api/reservations/route.ts` — POST cree reservation en_attente (conflict check + calcul commission), GET liste locataire
- `apps/web/components/reservation/DatePicker.tsx` — Selecteur dates double avec validation min/max
- `apps/web/components/reservation/ReservationFlow.tsx` — Flow 3 etapes avec PaiementButton etape finale
- `apps/web/app/(client)/reservations/nouvelle/page.tsx` — Page creation reservation, lit ?bienId, protege par auth
- `apps/web/app/(client)/reservations/[id]/page.tsx` — Page statut avec statut colore + PDF contrat + PaiementButton si en_attente

## Decisions Made

- Schema reel de migration 004 differe du plan spec: utilise `montant_loyer_fcfa`/`montant_total_fcfa` (pas `montant_fcfa`). Code adapte en consequence.
- Statut `expiree` absent du schema — remplace par `terminee` (valeur reelle de la contrainte CHECK).
- `proprietaire_id` est NOT NULL dans reservations — fetch `bien.proprietaire_id` avant insert.
- `contrats` lie a reservations via `reservation_id` FK (sens inverse) — Supabase supporte le join via la relation inverse.
- PaiementButton expose aussi sur la page statut pour les reservations `en_attente` non encore payees (cas ou l'utilisateur revient apres abandon).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Schema montant_fcfa inexistant — remplace par colonnes reelles**
- **Found during:** Task 1 (lecture migration 004)
- **Issue:** Le plan spec utilise `montant_fcfa` mais la migration definit `montant_loyer_fcfa`, `montant_total_fcfa`, `charges_fcfa`, `depot_garantie_fcfa`, `commission_fcfa`. L'insert aurait echoue avec "column not found".
- **Fix:** Adapte l'insert pour renseigner toutes les colonnes requises ; calcul commission 10% (arrondi XOF multiple de 5) inline.
- **Files modified:** apps/web/app/api/reservations/route.ts
- **Verification:** Aucune erreur TypeScript sur le fichier, colonnes correspondent a la migration.
- **Committed in:** f929297

**2. [Rule 1 - Bug] Statut expiree absent du CHECK constraint — remplace par terminee**
- **Found during:** Task 1 et Task 2
- **Issue:** Plan spec et STATUT_LABELS references `expiree` comme 4e statut. La migration 004 definit `check (statut in ('en_attente','confirmee','annulee','terminee'))`.
- **Fix:** STATUT_LABELS utilise `terminee` a la place d'`expiree`. Conflict check exclut `annulee` et `terminee`.
- **Files modified:** apps/web/app/api/reservations/route.ts, apps/web/app/(client)/reservations/[id]/page.tsx
- **Committed in:** f929297, 99fdd99

**3. [Rule 2 - Missing Critical] proprietaire_id NOT NULL — fetch avant insert**
- **Found during:** Task 1
- **Issue:** Le plan spec ne mentionne pas `proprietaire_id` dans l'insert mais la colonne est NOT NULL. L'insert aurait echoue avec null violation.
- **Fix:** Fetch `bien.proprietaire_id` avec `prix_mois_fcfa` avant l'insert.
- **Files modified:** apps/web/app/api/reservations/route.ts
- **Committed in:** f929297

---

**Total deviations:** 3 auto-fixed (2 bugs schema, 1 missing critical field)
**Impact on plan:** Toutes les corrections indispensables pour que l'insert DB ne fail pas. Aucune derive de scope.

## Issues Encountered

Pre-existing TypeScript errors dans auth pages et BienForm (@hookform/resolvers/zod, zod v4 API). Non lies a ce plan, laisses hors scope.

## Known Stubs

Aucun stub bloquant. La page /reservations/[id] affiche le lien PDF uniquement si `contrats.pdf_url` est non-null — ce champ sera renseigne par le plan 03-03 (generation PDF contrat).

## Next Phase Readiness

- Plan 03-03 (Contrats PDF) peut consommer `reservation.id` pour generer le contrat et mettre a jour `contrats.pdf_url`.
- Plan 03-04 (Dashboard) peut lire `reservations.statut` pour les KPIs proprietaire.
- Le flow locataire est complet : fiche bien -> /reservations/nouvelle?bienId= -> ReservationFlow -> PaiementButton -> CinetPay.

---
*Phase: 03-paiements-r-servations-ia-dashboard*
*Completed: 2026-04-06*
