# Requirements: Immo CI Platform

**Défini :** 2026-04-05
**Core Value :** Un propriétaire ivoirien peut publier un bien, recevoir des paiements CinetPay, signer un contrat OHADA en ligne et recevoir ses quittances automatiquement — sans quitter la plateforme.

---

## v1 Requirements

### Fondations & Infrastructure

- [x] **FOND-01** : Monorepo Turborepo initialisé avec apps/web, apps/mobile, packages/shared
- [x] **FOND-02** : App Next.js 14 (App Router, TypeScript strict) fonctionnelle
- [x] **FOND-03** : App Expo SDK 52 (Expo Router) fonctionnelle — SDK 52 choisi (auto-détection monorepo, élimine config Metro manuelle vs SDK 51 spécifié initialement)
- [x] **FOND-04** : Package partagé `packages/shared` avec types TypeScript et utils
- [ ] **FOND-05** : Design system Tailwind configuré (palette CI, typographie, borderRadius)
- [x] **FOND-06** : Variables d'environnement documentées et validées au démarrage

### Authentification

- [x] **AUTH-01** : Utilisateur peut s'inscrire avec email + mot de passe
- [x] **AUTH-02** : Utilisateur peut se connecter via Google OAuth
- [x] **AUTH-03** : Utilisateur peut s'inscrire / se connecter via OTP téléphone (WhatsApp ou SMS)
- [x] **AUTH-04** : Session persiste entre les navigations (Supabase SSR middleware)
- [x] **AUTH-05** : Profil créé automatiquement dans `profiles` à l'inscription (trigger ou webhook)
- [x] **AUTH-06** : Routes protégées selon le rôle (locataire / propriétaire / agence / admin)

### Base de données & Backend

- [x] **BDD-01** : Migration 001 — table `profiles` avec RLS
- [x] **BDD-02** : Migration 002 — table `biens` avec RLS
- [x] **BDD-03** : Migration 003 — table `biens_medias` (photo/vidéo/360°/plan) avec RLS
- [x] **BDD-04** : Migration 004 — table `reservations` avec RLS
- [x] **BDD-05** : Migration 005 — tables `contrats` et `quittances` avec RLS
- [x] **BDD-06** : Migration 006 — tables `conversations` et `messages` avec RLS
- [x] **BDD-07** : Migration 007 — tables `visites` et `avis` avec RLS
- [x] **BDD-08** : Migration 008 — tables `notifications` et `analytics_events` avec RLS
- [x] **BDD-09** : Types TypeScript générés depuis Supabase CLI dans `packages/shared/types/database.ts`

### Annonces immobilières

- [ ] **BIEN-01** : Propriétaire peut créer un bien (formulaire multi-étapes, validation Zod)
- [ ] **BIEN-02** : Propriétaire peut modifier et supprimer ses biens
- [ ] **BIEN-03** : Propriétaire peut publier / dépublier un bien
- [ ] **BIEN-04** : Visiteur peut lister les biens publiés avec pagination
- [ ] **BIEN-05** : Visiteur peut filtrer par commune, prix min/max, type, équipements
- [ ] **BIEN-06** : Visiteur peut faire une recherche full-text sur titre et description
- [ ] **BIEN-07** : Visiteur peut voir la fiche complète d'un bien (photos, description, carte, prix)
- [ ] **BIEN-08** : Visiteur peut voir les biens sur une carte (Mapbox ou Google Maps)

### Médias

- [ ] **MDIA-01** : Propriétaire peut uploader des photos → Cloudinary (webp, CDN, resize auto)
- [ ] **MDIA-02** : Propriétaire peut uploader des vidéos → Supabase Storage
- [ ] **MDIA-03** : Propriétaire peut uploader une photo 360° équirectangulaire → Supabase Storage
- [ ] **MDIA-04** : Propriétaire peut uploader des plans (PDF ou image) → Supabase Storage
- [ ] **MDIA-05** : Composant `BienCarousel` : navigation flèches + swipe, miniatures, filtres par type
- [ ] **MDIA-06** : Composant `Bien360` : vue Pannellum.js avec hotspots configurables
- [ ] **MDIA-07** : Propriétaire peut réordonner les médias par drag & drop (dashboard)
- [ ] **MDIA-08** : Médias ordonnés récupérés efficacement (index bien_id + ordre)

### Messagerie & Social

- [ ] **MSG-01** : Utilisateur peut envoyer un message à un propriétaire depuis une fiche bien
- [ ] **MSG-02** : Messages affichés en temps réel (Supabase Realtime)
- [ ] **MSG-03** : Utilisateur peut sauvegarder / retirer un bien de ses favoris
- [ ] **MSG-04** : Utilisateur peut demander une visite (date, créneau)
- [ ] **MSG-05** : Propriétaire peut confirmer ou refuser une demande de visite

### Paiements CinetPay

- [ ] **PAY-01** : Utilisateur peut initier un paiement (Wave, Orange Money, MTN, Moov, CB)
- [ ] **PAY-02** : Route API `/api/paiements/initier` crée la transaction CinetPay et retourne l'URL
- [ ] **PAY-03** : Webhook `/api/paiements/webhook` reçoit la confirmation et met à jour BDD
- [ ] **PAY-04** : Paiement enregistré dans la table `paiements` avec tous les statuts
- [ ] **PAY-05** : Split commission automatique (10% plateforme, 90% propriétaire)
- [ ] **PAY-06** : Page de retour paiement (succès / échec / annulation)

### Réservations & Contrats

- [ ] **RESA-01** : Locataire peut initier une réservation (sélection dates + paiement)
- [ ] **RESA-02** : Réservation créée avec statut `en_attente` puis confirmée après paiement
- [ ] **RESA-03** : Contrat de bail PDF généré automatiquement après confirmation (@react-pdf/renderer)
- [ ] **RESA-04** : Contrat conforme droit ivoirien OHADA (toutes clauses obligatoires)
- [ ] **RESA-05** : Montants toujours en FCFA en lettres ET en chiffres dans le contrat
- [ ] **RESA-06** : Contrat PDF stocké dans Supabase Storage, accessible aux deux parties

### Gestion locative

- [ ] **LOC-01** : Quittances de loyer générées automatiquement le 1er de chaque mois (n8n)
- [ ] **LOC-02** : Quittance PDF générée (Edge Function Supabase) et envoyée par WhatsApp + Email
- [ ] **LOC-03** : Relances loyer automatiques : J-3, J-1, J+1, J+7 (n8n + WhatsApp)
- [ ] **LOC-04** : Statut quittance mis à jour (`en_retard`) à J+1 automatiquement
- [ ] **LOC-05** : Propriétaire notifié quand un loyer est en retard

### IA & Chatbot

- [ ] **IA-01** : Chatbot immobilier CI (Claude API, system prompt géographie Abidjan + prix FCFA)
- [ ] **IA-02** : Conversation multi-turn avec historique (context window Anthropic)
- [ ] **IA-03** : Scoring automatique des annonces (qualité description, cohérence prix/zone, nb photos)
- [ ] **IA-04** : Génération de description bien à partir des caractéristiques saisies

### Dashboard propriétaire

- [ ] **DASH-01** : 4 KPI cards : revenus du mois, taux d'occupation, réservations en attente, messages non lus
- [ ] **DASH-02** : Bar chart revenus 12 derniers mois (Recharts)
- [ ] **DASH-03** : Gauge taux d'occupation par bien (Tremor)
- [ ] **DASH-04** : Donut répartition paiements par méthode (Wave, OM, MTN, Moov, CB)
- [ ] **DASH-05** : Section alertes triées par priorité (rouge / orange / jaune)
- [ ] **DASH-06** : Funnel de conversion : vues → contacts → visites → réservations → signatures

### Avis & KYC

- [ ] **AVIS-01** : Locataire peut laisser un avis sur un propriétaire après séjour
- [ ] **AVIS-02** : Propriétaire peut laisser un avis sur un locataire après séjour
- [ ] **AVIS-03** : Note moyenne affichée sur les profils publics
- [ ] **KYC-01** : Propriétaire peut uploader CNI + selfie pour vérification
- [ ] **KYC-02** : Statut KYC visible sur le profil (non vérifié / en cours / vérifié)

### App mobile Expo

- [ ] **MOB-01** : App Expo avec navigation par onglets (Expo Router)
- [ ] **MOB-02** : Écrans principaux : liste biens, fiche bien, réservation, profil
- [ ] **MOB-03** : Composants React Native adaptés depuis le web (~85% code partagé)
- [ ] **MOB-04** : Notifications push Firebase FCM fonctionnelles

### Landing page & SEO

- [ ] **LAND-01** : Landing page 10 sections (Hero, Comment ça marche, Biens vedette, Fonctionnalités, Carte CI, Témoignages, Chiffres clés, Partenaires, CTA, Footer)
- [ ] **LAND-02** : Hero avec search bar IA + CTA App Store / Play Store
- [ ] **LAND-03** : SEO basique (meta tags, Open Graph, sitemap)

---

## v2 Requirements

### Fonctionnalités avancées

- **ADV-01** : Recommandations personnalisées basées sur l'historique de recherche (IA)
- **ADV-02** : Détection de fraude automatique (doublon, prix anormal, faux profil)
- **ADV-03** : Signature électronique des contrats (DocuSign ou équivalent)
- **ADV-04** : Inventaire des équipements en annexe du contrat (checklist interactive)
- **ADV-05** : Composants UI partagés cross-platform dans `packages/ui`

### Expansion géographique

- **GEO-01** : Support multi-villes CI (San-Pédro, Bouaké, Yamoussoukro)
- **GEO-02** : Interface en anglais (diaspora ivoirienne)

---

## Hors périmètre

| Fonctionnalité | Raison |
|---|---|
| Support multi-pays (autres pays africains) | Valider CI d'abord, v3+ |
| Gestion syndic / copropriété | Droit OHADA différent, hors scope v1 |
| Marketplace services (déménagement, travaux) | Pas le cœur de valeur |
| Virement bancaire traditionnel | CinetPay couvre 98% du marché CI |
| Paiement en devises (EUR, USD) | Audience CI uniquement, FCFA obligatoire |

---

## Traçabilité

| Exigence | Phase | Statut |
|---|---|---|
| FOND-01 à FOND-06 | Phase 1 | En attente |
| AUTH-01 à AUTH-06 | Phase 1 | En attente |
| BDD-01 à BDD-09 | Phase 1 | En attente |
| LAND-01 à LAND-03 | Phase 1 | En attente |
| BIEN-01 à BIEN-08 | Phase 2 | En attente |
| MDIA-01 à MDIA-08 | Phase 2 | En attente |
| MSG-01 à MSG-05 | Phase 2 | En attente |
| PAY-01 à PAY-06 | Phase 3 | En attente |
| RESA-01 à RESA-06 | Phase 3 | En attente |
| IA-01 à IA-04 | Phase 3 | En attente |
| DASH-01 à DASH-06 | Phase 3 | En attente |
| LOC-01 à LOC-05 | Phase 4 | En attente |
| AVIS-01 à AVIS-03 | Phase 4 | En attente |
| KYC-01 à KYC-02 | Phase 4 | En attente |
| MOB-01 à MOB-04 | Phase 5 | En attente |

**Couverture :**
- Exigences v1 : 66 au total
- Mappées aux phases : 66
- Non mappées : 0 ✓

---
*Requirements définis : 2026-04-05*
*Dernière mise à jour : 2026-04-05 après initialisation*
