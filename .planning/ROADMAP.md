# Roadmap: Immo CI Platform

**Milestone:** v1.0 — Plateforme complète Côte d'Ivoire
**Core Value:** Un propriétaire publie, encaisse et gère ses locataires sans quitter la plateforme.

---

## Phase 1: Fondations & Infrastructure

**Goal:** Monorepo opérationnel, BDD Supabase complète avec RLS, authentification (email + Google + OTP), design system Tailwind CI, et landing page déployable sur Vercel.

**Exigences couvertes:** FOND-01 à FOND-06, AUTH-01 à AUTH-06, BDD-01 à BDD-09, LAND-01 à LAND-03

### Plans

| Plan | Titre | Description |
|---|---|---|
| 01-01 | Monorepo & Config | Turborepo init, apps/web (Next.js 14), apps/mobile (Expo), packages/shared, tsconfig, eslint |
| 01-02 | Supabase Migrations | 8 migrations SQL ordonnées, RLS complet, types TypeScript générés |
| 01-03 | Auth & Profils | Supabase Auth : email+password, Google OAuth, OTP téléphone, middleware routes, trigger profils |
| 01-04 | Design System | Tailwind config CI (palette, typo, borderRadius), composants de base (Button, Card, Badge, Input) |
| 01-05 | Landing Page | 10 sections, hero avec searchbar + CTA, Playfair Display + DM Sans, meta SEO |

**Success Criteria:**
1. `npm run dev` lance web + mobile sans erreur
2. Auth email, Google et OTP fonctionnels localement
3. Toutes les migrations appliquées, RLS actif sur les 14 tables
4. Landing page déployable sur Vercel avec score Lighthouse > 85
5. Design system documenté avec composants Button, Card, Badge, Input exportés

---

## Phase 2: Annonces, Médias & Messagerie

**Goal:** CRUD biens complet, médias avancés (carousel 4 types, vue 360° Pannellum), recherche full-text + carte, messagerie temps réel et favoris.

**Exigences couvertes:** BIEN-01 à BIEN-08, MDIA-01 à MDIA-08, MSG-01 à MSG-05

**Plans:** 4/5 plans executed

### Plans

| Plan | Titre | Description |
|---|---|---|
| 02-01 | CRUD Biens | Formulaire multi-étapes propriétaire, validation Zod, publication/dépublication, liste + fiche |
| 02-02 | Upload & Médias | Upload photos → Cloudinary, vidéos + 360° + plans → Supabase Storage, table biens_medias |
| 02-03 | Carousel & Vue 360° | Composant BienCarousel (4 types, filtres, miniatures, swipe), Composant Bien360 (Pannellum + hotspots) |
| 02-04 | Recherche & Carte | Full-text search, filtres (commune, prix, type, équipements), vue carte Mapbox |
| 02-05 | Messagerie & Social | Messagerie temps réel (Supabase Realtime), favoris, demandes de visite |

Plans:
- [x] 02-01-PLAN.md — CRUD biens complet (formulaire 4 étapes, API CRUD, liste + fiche publiques)
- [x] 02-02-PLAN.md — Upload médias (Cloudinary photos, Supabase Storage vidéo/360°/plans, drag & drop ordre)
- [x] 02-03-PLAN.md — Carousel & Vue 360° (Embla 4 types filtres miniatures, Pannellum dynamic ssr:false)
- [x] 02-04-PLAN.md — Recherche & Carte (FTS français, filtres combinés, Mapbox markers FCFA)
- [x] 02-05-PLAN.md — Messagerie & Social (Realtime messages, favoris upsert, demandes de visite)

**Success Criteria:**
1. Propriétaire publie un bien avec photos, vidéo et vue 360° en moins de 10 min
2. Carousel swipeable sur mobile avec filtres par type de média fonctionnels
3. Vue 360° interactive avec hotspots fonctionnelle sur mobile et desktop
4. Recherche retourne des résultats pertinents en < 500ms
5. Messages apparaissent en temps réel sans rechargement de page

---

## Phase 3: Paiements, Réservations, IA & Dashboard

**Goal:** Paiements CinetPay de bout en bout, flow réservation avec contrats OHADA, chatbot IA immobilier CI, scoring annonces, et dashboard analytics propriétaire.

**Exigences couvertes:** PAY-01 à PAY-06, RESA-01 à RESA-06, IA-01 à IA-04, DASH-01 à DASH-06

**Plans:** 5/5 plans executed

### Plans

| Plan | Titre | Description |
|---|---|---|
| 03-01 | CinetPay Integration | Routes API initier/webhook, split commission 10%, tous statuts paiement, page retour |
| 03-02 | Flow Réservation | Sélection dates → paiement → confirmation → état réservation, gestion conflits dates |
| 03-03 | Contrats PDF OHADA | @react-pdf/renderer, toutes clauses OHADA, montants FCFA lettres + chiffres, stockage Supabase |
| 03-04 | Chatbot & IA | Claude API chatbot CI (géographie Abidjan, prix FCFA, multi-turn), scoring annonces, génération desc |
| 03-05 | Dashboard Analytics | KPI cards Tremor, Recharts (bar/gauge/donut/funnel), alertes prioritaires, fetch Supabase parallèle |

Plans:
- [x] 03-01-PLAN.md — CinetPay (lib/cinetpay.ts + /api/paiements/initier + webhook /v2/payment/check + page retour)
- [x] 03-02-PLAN.md — Flow réservation (API conflits dates + ReservationFlow + pages nouvelle et statut)
- [x] 03-03-PLAN.md — Contrats OHADA (next.config.ts serverExternalPackages + lib/contrat-pdf.tsx + /api/contrats/generer)
- [x] 03-04-PLAN.md — Chatbot & IA (lib/claude.ts + /api/chat SSE streaming + scoring + ChatBot composant)
- [x] 03-05-PLAN.md — Dashboard Analytics (tailwind Tremor path + 6 composants + page Server Component)

**Success Criteria:**
1. Paiement Wave complété de bout en bout (initier → webhook → confirmation BDD)
2. Contrat PDF généré conforme OHADA, montants en FCFA lettres ET chiffres
3. Chatbot répond en français avec géographie et prix CI corrects
4. Score annonce calculé et affiché sur le dashboard propriétaire
5. Dashboard charge en < 2s avec données réelles Supabase

---

## Phase 4: Gestion Locative, Avis & KYC

**Goal:** Automatisations n8n (quittances mensuelles, relances J-3/J-1/J+1/J+7), système d'avis bidirectionnel et KYC propriétaire.

**Exigences couvertes:** LOC-01 à LOC-05, AVIS-01 à AVIS-03, KYC-01 à KYC-02

### Plans

| Plan | Titre | Description |
|---|---|---|
| 04-01 | Workflow Quittances | n8n : cron 1er du mois, génération quittance, Edge Function PDF, envoi WhatsApp + Email |
| 04-02 | Workflow Relances | n8n : cron quotidien 08h, relances J-3/J-1/J+1/J+7, statut en_retard, notif propriétaire |
| 04-03 | Système Avis | Avis bidirectionnel post-séjour, note moyenne, réponse propriétaire, affichage profil |
| 04-04 | KYC & Notifications | Upload CNI + selfie, statuts KYC, centre de notifications unifié, badge alertes |

**Success Criteria:**
1. Quittance générée et envoyée automatiquement le 1er du mois (test en environnement staging)
2. Relances WhatsApp envoyées aux bons jalons J-3, J-1, J+1, J+7
3. Statut quittance passe à `en_retard` automatiquement à J+1
4. Locataire peut laisser un avis visible sur le profil propriétaire
5. Propriétaire vérifié KYC affiche un badge sur son profil public

---

## Phase 5: App Mobile, Tests & Déploiement

**Goal:** App Expo complète avec navigation Expo Router 4, écrans React Native adaptés, notifications push Firebase FCM, tests E2E Playwright + Maestro, déploiement Vercel + EAS Build (App Store + Google Play).

**Exigences couvertes:** MOB-01 à MOB-04

**Plans:** 1/4 plans executed

### Plans

| Plan | Titre | Description |
|---|---|---|
| 05-01 | App Expo — Navigation + Écrans | Migration FCM, client Supabase RN, hook useAuth, navigation Expo Router, 4 onglets + auth + fiche bien |
| 05-02 | Notifications Push FCM | Expo Push Service + Edge Function send-push, hook usePushNotifications, deep links |
| 05-03 | Tests E2E — Playwright + Maestro | 3 specs Playwright web (auth/réservation/dashboard), 3 flows Maestro mobile (auth/search/profil) |
| 05-04 | Déploiement Vercel + EAS Build | vercel.json, eas.json 3 profils, app.json iOS+Android, GitHub Actions CD web + mobile |

Plans:
- [x] 05-01-PLAN.md — App Expo (migration 009 fcm_token, Supabase RN client, useAuth, navigation tabs + auth + fiche bien, StyleSheet CI)
- [ ] 05-02-PLAN.md — Push FCM (Edge Function send-push Expo Push Service, usePushNotifications, deep links notifications)
- [x] 05-03-PLAN.md — Tests E2E (Playwright 3 specs web, Maestro 3 flows mobile YAML)
- [ ] 05-04-PLAN.md — Déploiement (vercel.json, eas.json, app.json, GitHub Actions deploy-web + eas-build)

**Success Criteria:**
1. App mobile installable sur iOS et Android (via TestFlight et Play Console)
2. Notifications push reçues sur appareil réel (Expo Push Token enregistré dans profiles.fcm_token)
3. Tests Playwright couvrent auth, réservation et dashboard sans échec en CI
4. Flows Maestro exécutables sur device Android physique via `maestro test`
5. `vercel.json` valide + GitHub Actions deploy-web déclenché sur push main

---

## Vue d'ensemble

| Phase | Titre | Exigences | Statut |
|---|---|---|---|
| Phase 1: Fondations & Infrastructure | FOND + AUTH + BDD + LAND | 24 req. | Complétée |
| Phase 2: Annonces, Médias & Messagerie | BIEN + MDIA + MSG | 21 req. | Complétée |
| Phase 3: Paiements, Réservations, IA & Dashboard | PAY + RESA + IA + DASH | 22 req. | Planifiée |
| Phase 4: Gestion Locative, Avis & KYC | LOC + AVIS + KYC | 12 req. | En attente |
| Phase 5: App Mobile, Tests & Déploiement | MOB | 4 req. + infra | Planifiée |

**Total:** 5 phases · 27 plans · 66 exigences v1

---

## Backlog

### Phase 999.1: Fraîcheur des annonces (BACKLOG)

**Goal:** Empêcher les annonces "fantômes" — un bien non confirmé par le propriétaire tous les 15 jours est automatiquement désactivé (statut → inactif) et le propriétaire reçoit une notification WhatsApp/in-app.

**Contexte:** Risque marché CI — la méfiance utilisateur naît des annonces obsolètes (bien loué depuis 1 mois, annonce toujours visible). Badge de fraîcheur + gamification (score propriétaire actif).

**Approche envisagée:** n8n cron quotidien → query `biens` WHERE `updated_at < NOW() - INTERVAL '15 days'` AND `statut = 'publie'` → HTTP POST `/api/biens/webhook-inactivation` → `statut = 'inactif'` + notification in-app + WhatsApp.

**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promouvoir avec /gsd:review-backlog quand prêt)

---

### Phase 999.2: Escrow CinetPay — Libération conditionnelle (BACKLOG)

**Goal:** L'argent de la réservation est bloqué sur un compte de transit (séquestre) jusqu'à la remise des clés, validée par un code OTP reçu par le propriétaire. Éliminer le risque de paiement sans livraison.

**Contexte:** Risque confiance CI majeur — méfiance culturelle envers le paiement en ligne sans remise physique des clés. Actuellement l'argent va directement au propriétaire après webhook CinetPay. Un escrow nécessite un compte de transit et une logique de libération conditionnelle — refactoring de `lib/cinetpay.ts` + `api/paiements/webhook`.

**Approche envisagée:** CinetPay compte transit → réservation créée avec `statut = 'sequestre'` → propriétaire génère OTP à la remise → locataire valide OTP → libération automatique du paiement. Ou : délai de 48h avec option de litige.

**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promouvoir avec /gsd:review-backlog quand prêt)

---
*Roadmap créée : 2026-04-05*
*Mise à jour : 2026-04-07 — Phase 5 planifiée (4 plans, 2 vagues) — Maestro remplace Detox, StyleSheet natif RN (NativeWind v4 incompatible SDK 52 New Architecture)*
