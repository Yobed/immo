---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Ready to plan
last_updated: "2026-04-08T08:15:08.916Z"
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 24
  completed_plans: 24
---

# State: Immo CI Platform

## Project Reference

Voir : `.planning/PROJECT.md` (mis à jour 2026-04-05)

**Core Value :** Un propriétaire ivoirien peut publier, encaisser et gérer ses locataires sans quitter la plateforme.
**Focus actuel :** Phase 2 — Annonces, Médias & Messagerie

## Current Position

Phase: 999.1
Plans complétés: 05-01, 05-02, 05-03, 05-04
Phase 5 COMPLETE — en attente de vérification

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
- Plan 03-01 complété : CinetPay intégration (initier + webhook + retour), PaiementButton, split commission
- Plan 03-02 complété : Flow réservation — DatePicker + ReservationFlow 3 étapes + /api/reservations (conflict check 409) + pages nouvelle et statut
- Plan 03-05 complété : Dashboard analytics — 6 composants (KPICard Tremor, RevenueBarChart/PaymentDonut/ConversionFunnel Recharts, OccupancyGauge Tremor, AlertesSection), page Server Component + Promise.all Supabase
- Plan 03-03 complété : Contrats PDF OHADA — next.config.ts serverExternalPackages, lib/contrat-pdf.tsx (6 articles OHADA, montantEnLettres fr-FR), POST /api/contrats/generer (renderToBuffer + Storage), GET /api/contrats/[id] (auth guard)
- Plan 04-01 complété : Pipeline quittances mensuelles — quittance-pdf.tsx, Edge Function Deno coordinator, POST /api/quittances/generer (renderToBuffer + Storage), workflow n8n cron 1er du mois + WhatsApp
- Plan 04-02 complété : Workflow relances loyer + page quittances propriétaire
- Plan 04-03 complété : Système avis bidirectionnel — StarRating SVG, AvisCard, AvisForm, ReponseForm, POST /api/avis (guards terminee+23505+cible), PATCH /api/avis/[id]/reponse, pages /client/avis + /pro/avis avec note moyenne
- Plan 05-01 complété : App mobile scaffold Expo — migration 009 fcm_token, client Supabase RN (detectSessionInUrl:false + expo-sqlite), AuthGuard useSegments, 4 onglets CI-styled, BienCard + StatutBadge, 17 fichiers
- Plan 05-03 complété : Suite tests qualité — Playwright @1.59.1 (10 tests E2E web: auth/réservation/dashboard), 3 flows Maestro YAML mobile (auth/search-biens/profil, appId ci.immo.app)
- Plan 05-02 complété : Push FCM — Edge Function send-push (Expo Push Service), hook usePushNotifications (registration + deep links), écran notifications, expo-notifications SDK 52
- Plan 05-04 complété : Pipeline déploiement — vercel.json Turborepo, eas.json 3 profils, app.json mis à jour, GitHub Actions deploy-web.yml (push main → Vercel) + eas-build.yml (tag v* → EAS iOS+Android)
- Dernière session arrêtée à : Wave 2 complète (05-02 + 05-04) — Phase 5 tous plans exécutés

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
- **reservations schema: montant_loyer_fcfa + montant_total_fcfa (pas montant_fcfa)** — migration 004 differe du plan spec; toujours verifier les migrations avant de coder les inserts
- **proprietaire_id NOT NULL sur reservations** — fetch bien.proprietaire_id avant insert reservation
- **statut terminee remplace expiree dans reservations** — CHECK constraint reel: en_attente|confirmee|annulee|terminee
- **contrats lie via reservation_id FK (pas contrat_id sur reservations)** — join via relation inverse Supabase dans la page statut
- **Tremor v3.18.7 sans charts** — Card/Metric/BadgeDelta/ProgressBar uniquement; recharts pour tous les graphiques (BarChart, PieChart, FunnelChart)
- **Dashboard pattern: Server Component + dynamic() ssr:false** — Server Component fetch Supabase, props serialisables aux Client Components; Recharts via dynamic(ssr:false) pour eviter hydration mismatch
- **tailwind.config.ts content path @tremor obligatoire** — sans './node_modules/@tremor/**', Tremor est unstyled en production (CSS purge)
- **bienIds.length guard avant .in() Supabase** — .in('col', []) retourne une erreur; toujours verifier longueur array avant query IN
- **to-words currency:false obligatoire** — currency:true genere "euros" meme avec locale fr-FR; toujours passer currency:false + suffixe "francs CFA" manuel
- **renderToBuffer avec createElement()** — renderToBuffer attend un ReactElement; passer createElement(ContratDocument, props) pas du JSX direct
- **montant_loyer_fcfa dans reservations** — champ reel pour le montant du loyer (pas montant_fcfa); toujours verifier migration 004
- **Edge Function Deno = coordinator uniquement** — react-pdf indisponible dans Deno; pattern: Edge Fn appelle /api/quittances/generer via HTTP; Next.js gere renderToBuffer
- **x-service-key header** — shared secret pour authentifier les appels Edge Function -> Next.js API
- **Idempotence quittances via UNIQUE INDEX** — (contrat_id, mois) empeche les doublons; retour skipped:true si existant avec pdf_url
- **Two-step filter pour réservations sans avis** — Supabase JS ne supporte pas les sous-requêtes SQL inline dans .not(); fetch IDs en étape 1 puis .not('id','in',...) avec guard longueur > 0
- **StarRating SVG pur sans lib externe** — path polygon étoile, fill orange #E67E22 si active, stroke gray sinon; disabled={readonly} sur button
- **Notification avis_recu avec lien_type=reservation** — lien vers réservation pas vers avis directement
- **useAuth.tsx (pas .ts) en React Native** — JSX dans hooks nécessite extension .tsx sinon TS1005/TS1128 errors
- **BienListItem type local mobile** — schéma réel biens: prix_mois_fcfa/prix_vente_fcfa (pas prix); photos dans biens_medias (pas photo_principale_url)
- **profiles.full_name (pas nom+prenom) en mobile** — schéma réel Supabase; initiales via split(' ')
- **detectSessionInUrl:false obligatoire en React Native** — crash Hermes si true (pas de browser URL)
- **expo-sqlite localStorage pour Supabase auth mobile** — alternative moderne à AsyncStorage; import ordre critique: url-polyfill > expo-sqlite/localStorage > createClient
- **playwright workers:1 + fullyParallel:false** — évite conflits auth state entre tests E2E (session partagée même serveur Next.js)
- **Maestro runFlow conditionnel** — search-biens.yaml et profil.yaml lancent auth.yaml si non connecté (when: visible: Se connecter)
- **role selectors Playwright prioritaires** — getByRole/getByPlaceholder/getByText résistants aux changements CSS Tailwind
- **Expo Push Service (exp.host) vs FCM V1 direct** — plus simple en v1, pas de service account Google nécessaire; EAS gère conversion FCM/APNs
- **PushNotificationsHandler composant null-render dans SessionProvider** — useSession requiert provider dans l'arbre React; return null = pure side effect
- **ExponentPushToken stocké dans profiles.fcm_token** — pas le token FCM natif; EAS/Expo gère la conversion automatiquement
- **vercel.json sans rootDirectory** — Vercel reste à la racine pour que Turborepo résolve les workspaces npm
- **newArchEnabled:false dans app.json** — compatibilité NativeWind v4 et libs tierces SDK 52
- **eas build --no-wait** — builds EAS soumis asynchrones, pas de timeout CI bloquant (60min)

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
| Phase 03-paiements-r-servations-ia-dashboard P02 | 15 | 2 tasks | 5 files |
| Phase 03-paiements-r-servations-ia-dashboard P05 | 15 | 2 tasks | 9 files |
| Phase 04-gestion-locative-avis-kyc P01 | 15 | 2 tasks | 5 files |
| Phase 04-gestion-locative-avis-kyc P03 | 15 | 2 tasks | 8 files |
| Phase 05-app-mobile-tests-d-ploiement P01 | 9min | 3 tasks | 17 files |
| Phase 05-app-mobile-tests-d-ploiement P03 | 15min | 2 tasks | 8 files |
| Phase 05-app-mobile-tests-d-ploiement P02 | 2min | 2 tasks | 5 files |
| Phase 05-app-mobile-tests-d-ploiement P04 | 8min | 2 tasks | 7 files |

## Progress Summary

| Phase | Plans | Statut |
|---|---|---|
| 1 — Fondations & Infrastructure | 5 plans | Complété |
| 2 — Annonces, Médias & Messagerie | 6 plans | Complété (6/6) |
| 3 — Paiements, Réservations, IA & Dashboard | 5 plans | En attente |
| 4 — Gestion Locative, Avis & KYC | 4 plans | En cours (3/4) |
| 5 — App Mobile, Tests & Déploiement | 4 plans | En cours (3/4) |

## Key Context

- Instance n8n : https://yobed-n8n-supabase-claude.hf.space (déjà opérationnelle)
- Stack décidée : Next.js 14 + Expo + Supabase + Turborepo + CinetPay + Claude API
- Design system : bleu #1A5276 + orange #E67E22, mobile-first, Playfair Display + DM Sans
- Droit : contrats OHADA, montants toujours en FCFA
- Référence skills : `skills.md` à la racine du projet

---
*Créé : 2026-04-05 après initialisation*
