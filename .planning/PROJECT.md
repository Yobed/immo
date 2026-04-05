# Immo CI Platform

## What This Is

Plateforme immobilière full-stack premium pour la Côte d'Ivoire — web (Next.js 14) + mobile (Expo) + automatisations (n8n) + IA (Claude API). Cible les propriétaires, agences et locataires/acheteurs d'Abidjan et de toute la CI. Objectif : dépasser Immo+ (AfriqSolus) sur toutes les dimensions : qualité des annonces, médias avancés, paiements mobiles CI, gestion locative automatisée, et expérience utilisateur.

## Core Value

Un propriétaire ivoirien peut publier un bien, recevoir des paiements CinetPay (Wave / Orange Money / MTN / Moov), signer un contrat OHADA en ligne et recevoir ses quittances automatiquement — sans quitter la plateforme.

## Requirements

### Validated

(Aucune — à valider en production)

### Active

- [ ] Monorepo Turborepo avec apps/web (Next.js 14), apps/mobile (Expo), packages/shared
- [ ] Authentification Supabase : email+password, Google OAuth, OTP téléphone
- [ ] Schéma BDD Supabase complet (14 tables) avec RLS
- [ ] CRUD biens avec formulaire multi-étapes et validation Zod
- [ ] Carousel médias avancé : photos (Cloudinary), vidéos, vue 360° (Pannellum), plans
- [ ] Recherche full-text + filtres (commune, prix, type, équipements) + vue carte
- [ ] Messagerie temps réel (Supabase Realtime)
- [ ] Intégration CinetPay complète (Wave, Orange Money, MTN, Moov, CB) + split commission
- [ ] Flow réservation complet : dates → paiement → confirmation → contrat
- [ ] Génération contrats de bail PDF (@react-pdf/renderer, droit OHADA ivoirien)
- [ ] Quittances de loyer mensuelles automatiques (n8n + Edge Function)
- [ ] Workflows n8n : relances loyer J-3/J-1/J+1/J+7, onboarding, notifications
- [ ] Chatbot IA immobilier CI (Claude API, géographie Abidjan, prix FCFA)
- [ ] Scoring annonces par IA (qualité description, cohérence prix/zone, nb photos)
- [ ] Dashboard analytics propriétaire (KPIs, Recharts, Tremor, alertes)
- [ ] Système d'avis bidirectionnel locataire ↔ propriétaire
- [ ] KYC propriétaire (upload CNI + selfie)
- [ ] App Expo mobile (React Native, ~85% code partagé)
- [ ] Notifications push Firebase FCM + WhatsApp Business API
- [ ] Déploiement Vercel (web) + App Store / Google Play (mobile)

### Out of Scope

- Support multi-pays (autres pays africains) — v2, après validation CI
- Gestion syndic / copropriété — complexité OHADA différente, déféré
- Marketplace de services (déménagement, travaux) — hors scope v1
- Paiement par virement bancaire traditionnel — CinetPay couvre 98% du marché CI

## Context

- Stack déjà maîtrisée : Supabase, n8n, Claude API
- Instance n8n existante : https://yobed-n8n-supabase-claude.hf.space (YOBED)
- Marché CI : CinetPay = leader, Wave ~40%, Orange Money ~30%, MTN ~20%
- Droit applicable : OHADA pour les contrats de bail
- Concurrence directe : Immo+ (AfriqSolus) — à dépasser sur médias, paiements et automatisation
- Design system : bleu profond #1A5276 + orange CI #E67E22, mobile-first
- Typographie : Playfair Display (titres) + DM Sans (body) + JetBrains Mono (prix FCFA)

## Constraints

- **Stack** : Next.js 14 App Router + Expo SDK 51 + Supabase + Turborepo — décidé, pas de changement
- **Paiements** : CinetPay uniquement pour v1 — couvre tous les opérateurs CI
- **Médias images** : Cloudinary (gratuit jusqu'à 25 GB, CDN mondial, transformations auto)
- **Vue 360°** : Pannellum.js (open source, mobile-friendly, zéro backend)
- **Hébergement** : Vercel (web) + Hugging Face Spaces (n8n)
- **Langue** : Français uniquement (audience CI)
- **Monnaie** : FCFA uniquement, jamais euros ou dollars dans l'UI

## Key Decisions

| Décision | Justification | Résultat |
|---|---|---|
| Turborepo monorepo | Partage ~85% du code Next.js ↔ Expo | — En attente |
| Supabase comme backend | Auth + BDD + Storage + Realtime dans un seul service | — En attente |
| CinetPay pour paiements | Leader CI, couvre Wave / OM / MTN / Moov | — En attente |
| Pannellum pour 360° | Open source, mobile-friendly, zéro coût backend | — En attente |
| Cloudinary pour images | CDN mondial, transformations auto (webp, resize), free tier généreux | — En attente |
| n8n sur HF Spaces | Instance déjà opérationnelle (YOBED) | — En attente |
| @react-pdf/renderer | Génération PDF côté serveur, compatible OHADA | — En attente |

## Evolution

Ce document évolue aux transitions de phases et jalons.

**Après chaque transition de phase** (via `/gsd:transition`) :
1. Exigences invalidées ? → Déplacer vers Out of Scope avec raison
2. Exigences validées ? → Déplacer vers Validated avec référence de phase
3. Nouvelles exigences ? → Ajouter à Active
4. Décisions à consigner ? → Ajouter à Key Decisions
5. "What This Is" toujours exact ? → Mettre à jour si dérivé

**Après chaque milestone** (via `/gsd:complete-milestone`) :
1. Révision complète de toutes les sections
2. Vérification Core Value — toujours la bonne priorité ?
3. Audit Out of Scope — raisons toujours valides ?
4. Mettre à jour Context avec l'état actuel

---
*Dernière mise à jour : 2026-04-05 après initialisation*
