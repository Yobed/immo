---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to plan
last_updated: "2026-04-07T11:49:17.643Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 11
  completed_plans: 11
---

# State: Immo CI Platform

## Project Reference

Voir : `.planning/PROJECT.md` (mis à jour 2026-04-05)

**Core Value :** Un propriétaire ivoirien peut publier, encaisser et gérer ses locataires sans quitter la plateforme.
**Focus actuel :** Phase 2 — Annonces, Médias & Messagerie

## Current Position

Phase: 3
Plan: Not started

## Session Continuity

- Plan 01-01 complété : Turborepo monorepo, Next.js 14.2.35, Expo SDK 52, packages/shared
- Mode : YOLO · Granularité : Standard · Agents : Chercheur + Vérificateur plan + Vérificateur phase
- Git initialisé, commit_docs = true
- Plan 01-02 complété : 8 migrations Supabase (14 tables), RLS sur toutes les tables, handle_new_user trigger, database.ts placeholder
- Plan 01-03 complété : Auth Supabase SSR, middleware route protection, login/register/OTP pages
- Plan 01-04 complété : Tailwind design system (CI palette, typography, Button/Card/Badge/Input)
- Plan 01-05 complété : Landing page 10 sections, SEO metadata, sitemap, robots
- Plan 02-01 complété : BienForm 4 étapes (Zod), API CRUD biens, BienCard, pages publiques liste+fiche, pages pro listing+create+edit
- Plan 02-02 complété : Pipeline upload médias — Cloudinary (signature serveur), Supabase Storage, biens_medias CRUD, MediaUploader, MediaSortable dnd-kit, Step5Medias
- Plan 02-05 complété : Messagerie Realtime (postgres_changes), FavorisButton, VisiteRequestForm, API visites POST+PATCH, pages /messages, /favoris, /visites
- Plan 02-06 complété : Gap closure — FavorisButton + VisiteRequestForm wired into fiche bien, BienForm TOTAL_STEPS=5, modifier page handles ?step=medias with Step5Medias
- Dernière session arrêtée à : Completed 02-annonces-medias-messagerie-06-PLAN.md

## Key Decisions

- **supabase.from() cast to any in API routes** — database.ts Insert type is a minimal placeholder; regenerate after `npx supabase gen types`
- **TYPES_BIEN moved communes.ts → biens.ts** — avoids duplicate export conflict in packages/shared/constants/index.ts
- **ToggleStatutButton extracted as client component** — Server Components cannot use onClick+fetch in Next.js App Router
- **DB field names: surface_m2, adresse_complete, charges_mois_fcfa** — actual schema differs from plan spec; always check database.ts Row type
- **next@14.2.35 locked exactly** — prevents upgrade to Next.js 15/16 breaking App Router APIs
- **Tailwind CSS v3 not v4** — design system uses tailwind.config.ts syntax (v4 removed it)
- **Expo SDK 52 not 51** — SDK 52+ auto-detects monorepo, no Metro config needed
- **packages/shared uses Intl.DateTimeFormat** — no date-fns dep, zero external runtime deps
- **handle_new_user uses SECURITY DEFINER** — required to bypass RLS during auth.users insert trigger
- **paiements table in migration 008** — prepares Phase 3 CinetPay without a 9th migration file
- **database.ts is a placeholder** — regenerate via Supabase CLI after project creation and migration application
- **cn() via clsx + twMerge** — all UI components use this for composable class merging; import from @/lib/utils
- **CSS variables + Tailwind tokens co-exist** — Tailwind tokens (bg-primary) for standard usage, CSS vars (border-[var(--border)]) for values outside the palette
- **vue360 badge uses purple-100/purple-700** — visually distinct from photo (green), video (orange), plan (blue)
- **npm install --legacy-peer-deps at monorepo root** — pannellum-react@1.2.4 declares peer react@16.x; resolved with --legacy-peer-deps from workspace root
- **biens_medias couverture reset pattern** — always reset est_couverture=false on bien before setting new couverture; respects partial unique index biens_medias_couverture_unique_idx
- **expediteur_id pas emetteur_id dans messages DB** — toujours vérifier database.ts Row type avant de coder les composants
- **locataire_id+notes+heure_debut/fin dans visites DB** — non demandeur_id+notes_demandeur+creneau; creneau splitté en heure_debut+heure_fin dans API route
- **VisiteActions extrait en Client Component** — Server Action avec fetch URL absolue invalide dans Next.js App Router (cf. ToggleStatutButton pattern)
- **Cloudinary signed upload pattern** — signUploadParams() in lib/cloudinary.ts + auth-gated POST /api/upload/sign + CldUploadWidget with signatureEndpoint prop
- **pannellum-react and embla-carousel-react have no @types** — added custom .d.ts declarations in apps/web/types/; matches pre-existing pattern for other packages
- **BienCarousel replaces cover img in fiche bien** — full medias array used with type-based filtering; duree_sec added to Supabase select for video duration display
- **Step5Medias rendered outside BienForm in modifier page** — BienForm is creation-only (no bienId); Step5Medias requires bienId, so it lives at ?step=medias on the modifier page post-creation
- **auth.getUser() in Server Component, userId passed as prop to Client Components** — avoids client re-auth; pattern established in fiche bien page for FavorisButton

## Performance Metrics

| Phase | Plan | Duration | Tasks | Files |
|---|---|---|---|---|
| 01-fondations-infrastructure | 01 | 5min | 2 | 23 |
| 01-fondations-infrastructure | 02 | 25min | 2 | 9 |
| Phase 01-fondations-infrastructure P03 | 18 | 3 tasks | 8 files |
| Phase 01-fondations-infrastructure P04 | 15 | 5 tasks | 8 files |
| Phase 01-fondations-infrastructure P05 | 20 | 4 tasks | 15 files |
| Phase 02-annonces-medias-messagerie P01 | 134 | 3 tasks | 20 files |
| Phase 02-annonces-medias-messagerie P02 | 35 | 2 tasks | 7 files |
| Phase 02-annonces-medias-messagerie P05 | 25 | 2 tasks | 11 files |
| Phase 02-annonces-medias-messagerie P03 | 3min | 2 tasks | 5 files |
| Phase 02-annonces-medias-messagerie P06 | 2min | 2 tasks | 3 files |

## Progress Summary

| Phase | Plans | Statut |
|---|---|---|
| 1 — Fondations & Infrastructure | 5 plans | Complété |
| 2 — Annonces, Médias & Messagerie | 6 plans | Complété (6/6) |
| 3 — Paiements, Réservations, IA & Dashboard | 5 plans | En attente |
| 4 — Gestion Locative, Avis & KYC | 4 plans | En attente |
| 5 — App Mobile, Tests & Déploiement | 4 plans | En attente |

## Key Context

- Instance n8n : https://yobed-n8n-supabase-claude.hf.space (déjà opérationnelle)
- Stack décidée : Next.js 14 + Expo + Supabase + Turborepo + CinetPay + Claude API
- Design system : bleu #1A5276 + orange #E67E22, mobile-first, Playfair Display + DM Sans
- Droit : contrats OHADA, montants toujours en FCFA
- Référence skills : `skills.md` à la racine du projet

---
*Créé : 2026-04-05 après initialisation*
