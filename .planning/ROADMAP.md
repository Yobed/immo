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

**Plans:** 1/5 plans executed

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
- [ ] 02-02-PLAN.md — Upload médias (Cloudinary photos, Supabase Storage vidéo/360°/plans, drag & drop ordre)
- [ ] 02-03-PLAN.md — Carousel & Vue 360° (Embla 4 types filtres miniatures, Pannellum dynamic ssr:false)
- [ ] 02-04-PLAN.md — Recherche & Carte (FTS français, filtres combinés, Mapbox markers FCFA)
- [ ] 02-05-PLAN.md — Messagerie & Social (Realtime messages, favoris upsert, demandes de visite)

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

### Plans

| Plan | Titre | Description |
|---|---|---|
| 03-01 | CinetPay Integration | Routes API initier/webhook, split commission 10%, tous statuts paiement, page retour |
| 03-02 | Flow Réservation | Sélection dates → paiement → confirmation → état réservation, gestion conflits dates |
| 03-03 | Contrats PDF OHADA | @react-pdf/renderer, toutes clauses OHADA, montants FCFA lettres + chiffres, stockage Supabase |
| 03-04 | Chatbot & IA | Claude API chatbot CI (géographie Abidjan, prix FCFA, multi-turn), scoring annonces, génération desc |
| 03-05 | Dashboard Analytics | KPI cards Tremor, Recharts (bar/gauge/donut/funnel), alertes prioritaires, calendrier encaissements |

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

**Goal:** App Expo complète avec navigation, écrans adaptés React Native, notifications push Firebase FCM, tests E2E Playwright + Detox, déploiement Vercel + App Store + Google Play.

**Exigences couvertes:** MOB-01 à MOB-04

### Plans

| Plan | Titre | Description |
|---|---|---|
| 05-01 | App Expo | Navigation par onglets, écrans principaux (liste, fiche, réservation, profil), adaptations React Native |
| 05-02 | Notifications Push | Firebase FCM, notifications push mobile, deep links depuis notification |
| 05-03 | Tests & Qualité | Playwright (web E2E), Detox (mobile), optimisation images WebP, Lighthouse > 90 |
| 05-04 | Déploiement | Vercel (web), EAS Build (iOS + Android), soumission App Store + Google Play |

**Success Criteria:**
1. App mobile installable sur iOS et Android (via TestFlight et Play Console)
2. Notifications push reçues sur appareil réel depuis Firebase FCM
3. Lighthouse score > 90 sur la landing page (mobile et desktop)
4. Tests Playwright couvrent auth, réservation et paiement sans échec

---

## Vue d'ensemble

| Phase | Titre | Exigences | Statut |
|---|---|---|---|
| Phase 1: Fondations & Infrastructure | FOND + AUTH + BDD + LAND | 24 req. | Complétée |
| Phase 2: Annonces, Médias & Messagerie | BIEN + MDIA + MSG | 21 req. | En cours |
| Phase 3: Paiements, Réservations, IA & Dashboard | PAY + RESA + IA + DASH | 22 req. | En attente |
| Phase 4: Gestion Locative, Avis & KYC | LOC + AVIS + KYC | 12 req. | En attente |
| Phase 5: App Mobile, Tests & Déploiement | MOB | 4 req. + infra | En attente |

**Total:** 5 phases · 23 plans · 66 exigences v1

---
*Roadmap créée : 2026-04-05*
*Mise à jour : 2026-04-06 — Phase 2 planifiée (5 plans, 2 vagues)*
