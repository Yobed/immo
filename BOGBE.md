# BOGBE'S GROUPE — Plateforme Immobilière Premium Côte d'Ivoire

> Documentation complète du projet (architecture, features, déploiement, contributions).
> Production : https://bogbes-groupe.vercel.app

---

## 1. Vision du produit

**BOGBE'S GROUPE** est une plateforme immobilière premium pour la Côte d'Ivoire qui combine :

- Un **catalogue consolidé** unifiant 2 sources :
  - Annonces vérifiées par BOGBE'S (propriétaires/agences inscrits)
  - Offres flash WhatsApp (scraping en temps réel de groupes publics)
- **Sapphire**, conseillère IA conversationnelle sur WhatsApp + chat web
- Un **workflow d'intermédiation totale** (le client ne voit jamais le numéro du propriétaire)
- Une expérience **mobile-first** premium (parallax, glassmorphism, micro-animations)

Le positionnement : **transparence radicale + qualité visuelle premium**, dans un marché immobilier ivoirien où la fraude est endémique.

---

## 2. Stack technique

| Couche | Tech |
|---|---|
| **Frontend** | Next.js 14.2 (App Router), React 18, TypeScript 5 |
| **Styling** | Tailwind CSS, Framer Motion, CSS modules tokens |
| **Polices** | Bricolage Grotesque (display) + EB Garamond (serif) + Manrope (sans) + JetBrains Mono |
| **Backend** | Next.js API routes, Server Components, Server Actions |
| **Base de données** | Supabase (PostgreSQL 15 + RLS) |
| **Auth** | Supabase Auth (PKCE flow + email/password + Google OAuth) |
| **Storage** | Supabase Storage (privé pour KYC, public pour médias biens) |
| **AI conversationnelle** | Groq (Llama 3.3 70B) primary + OpenRouter (gpt-oss-120b) fallback |
| **WhatsApp** | Wasender API (webhook entrant + send sortant) |
| **Cartographie** | Mapbox GL JS |
| **Déploiement** | Vercel (yobed-1745s-projects/immo) |
| **Domaine** | bogbes-groupe.vercel.app |
| **CDN médias** | Cloudinary |
| **Monorepo** | npm workspaces (apps/web, apps/mobile, packages/shared) |

---

## 3. Structure du repo

```
immo/
├── apps/
│   ├── web/                    # Next.js App Router (production)
│   │   ├── app/
│   │   │   ├── (public)/       # Pages publiques (home, catalogue, fiche bien)
│   │   │   ├── (auth)/         # Login, register, callback, KYC
│   │   │   ├── (client)/       # Espace client (favoris, mes visites)
│   │   │   ├── (pro)/          # Espace propriétaire (dashboard, mes annonces)
│   │   │   ├── admin/          # Espace admin (validation, suivi)
│   │   │   └── api/            # API routes (chat, webhook, kyc, etc.)
│   │   ├── components/
│   │   │   ├── bien/           # Composants fiche bien
│   │   │   ├── catalogue/      # Cards + map view
│   │   │   ├── chat/           # ChatBot Sapphire (web)
│   │   │   ├── landing/        # Sections home
│   │   │   ├── layout/         # Header, footer, nav mobile
│   │   │   ├── offre-flash/    # FlashContactModal, placeholder
│   │   │   ├── search/         # SearchBar, QuickFilters
│   │   │   └── ui/             # Composants génériques
│   │   ├── lib/
│   │   │   ├── ai.ts                  # Sapphire system prompt + Groq/OpenRouter clients
│   │   │   ├── ai/tools.ts            # getAIBienContext (RAG sur catalogue)
│   │   │   ├── catalogue/consolidated.ts  # Fusion biens BOGBE'S + flash
│   │   │   ├── geo/commune-centroids.ts   # Coordonnées GPS communes CI
│   │   │   ├── i18n/                  # FR/EN
│   │   │   ├── searchParser.ts        # Parser texte → filtres structurés
│   │   │   ├── supabase/              # Clients Supabase (server/client/locaux)
│   │   │   └── wasender.ts            # Client WhatsApp + signature verify
│   │   └── public/                    # Assets statiques
│   └── mobile/                 # Expo (préparation — pas en prod)
├── packages/
│   └── shared/                 # Types et constantes partagés
│       └── constants/
│           ├── biens.ts        # TYPES_BIEN, EQUIPEMENTS_DISPONIBLES
│           └── communes.ts     # COMMUNES_CI
└── supabase/
    └── migrations/             # 24 migrations SQL versionnées
```

---

## 4. Architecture des données

### 4.1 Tables principales

| Table | Rôle |
|---|---|
| `profiles` | Profils utilisateur (lié à `auth.users`) — role: client / pro / admin |
| `biens` | Annonces BOGBE'S (validées par admin) |
| `biens_medias` | Photos, vidéos, vue 360° |
| `locaux` | Offres flash WhatsApp (DB séparée Supabase `tjvozbcnkimfgwonslzm`) |
| `favoris` | Favoris client → bien |
| `contact_requests` | Demandes de contact (visite, info, photo) |
| `visites` | Rendez-vous de visite organisés |
| `reservations` | Réservations (nuitée meublé ou location) |
| `whatsapp_messages` | Historique des conversations Sapphire (RAG) |
| `bien_notes` | Notes & commentaires (client privé + admin interne) |
| `agent_outreach` | Pipeline contact agents (prospects WhatsApp) |

### 4.2 Migrations (sqlite source de vérité)

24 migrations dans `supabase/migrations/` :

| # | Sujet |
|---|---|
| 001-013 | Schéma initial : profiles, biens, médias, visites, réservations, KYC, admin validation |
| 014 | `contact_requests` (système d'intermédiation) |
| 015-016 | Sécurité profil (phone restreint) |
| 017 | Pipeline `agent_outreach` (outreach WhatsApp) |
| 018 | Extension `contact_requests` pour offres flash |
| 019 | **Verrou colonne** `flash_owner_phone` (sécurité critique) |
| 020 | Index performance catalogue |
| 021 | Workflow validation admin (brouillon → en_attente → publié) |
| 022 | Biens en_attente visibles publiquement (recherche + Sapphire) |
| 023 | Bucket Storage KYC (CNI + selfie) |
| 024 | `bien_notes` (notes client + admin) |

### 4.3 Sécurité RLS

Toutes les tables sensibles sont protégées par **Row-Level Security**.

Points critiques :
- **`contact_requests.flash_owner_phone`** : column-level REVOKE — seul service_role peut le lire
- **`profiles.phone`** : restreint à l'utilisateur lui-même
- **`bien_notes`** : client voit ses notes privées, admin voit les notes internes
- **Storage `kyc`** : path = `{user_id}/...`, admin seul peut lire tout

---

## 5. Features principales

### 5.1 Catalogue consolidé

`lib/catalogue/consolidated.ts` fusionne en mémoire :
- Biens BOGBE'S (vérifiés, score IA, photos pro)
- Offres flash WhatsApp (scraping temps réel, non vérifiées)

Filtre unifié : commune, type, prix, équipements, source.
Tri : `verified_first` (vérifiés en premier puis flash).

**Règles métier intégrées** :
- Résidence meublée : exige `prix_nuit_fcfa` — si seul `prix_mois_fcfa` rempli, affiche "Prix sur demande"
- Biens en_attente (non encore validés admin) sont visibles publiquement avec badge "En validation"

### 5.2 Sapphire — Assistant IA

**Architecture fail-over** :
```
Stage 1 — Groq llama-3.3-70b (primary)
Stage 2 — OpenRouter gpt-oss-120b (backup)
Stage 3 — Message d'attente amical
```

**Capacités** :
- Comprend le vocabulaire local CI ("dernier prix", "caution", "la maison est libre ?", "bayer")
- Vouvoiement strict imposé du début à la fin
- Verrou type de bien (duplex → ne propose que des duplex)
- Détection RDV → tag `[RDV_CONFIRME bien_id=... date=...]` côté webhook
- Envoie photos sur demande explicite (tag `[MEDIA: URL]`)
- Pour offres flash : **jamais** d'image stock — placeholder honnête

**Web** : streaming via `/api/chat` (Server-Sent Events)
**WhatsApp** : webhook `/api/whatsapp/webhook` (Wasender)

### 5.3 Intermédiation totale (workflow contact)

Pour les **offres flash** (annonces tierces) :
1. Visiteur clique "Demander une visite" → modal `FlashContactModal`
2. Saisit nom + téléphone + motif
3. API `/api/flash-contact` enregistre dans `contact_requests` (statut `en_attente`)
4. Admin reçoit notification WhatsApp
5. Admin valide, contacte le proprio (depuis `flash_owner_phone` masqué au client)
6. Admin organise la visite + notifie le visiteur

Le visiteur ne voit **jamais** le numéro du propriétaire scrapé.

### 5.4 KYC (vérification d'identité)

- Upload CNI (recto) + selfie via dropzone
- Bucket Supabase Storage `kyc` privé
- Path: `{user_id}/{timestamp}-cni.jpg` (utilisateur ne peut accéder qu'à son dossier)
- Admin peut tout lire pour vérification manuelle

### 5.5 Notes & commentaires

Composant `BienNotesPanel` sur fiche bien :
- **Client connecté** : notes privées (post-it perso)
- **Admin** : notes internes commerciales ("proprio négociable -10%", "zone hot")
- RLS strict : audience `client_private` visible uniquement par auteur, `admin_internal` visible uniquement par admins

### 5.6 Carte interactive

`CatalogueMapView` (vue carte du catalogue) :
- Mapbox GL JS
- Markers personnalisés par type de bien
- Centroids commune + jitter déterministe (pas d'empilement)
- Popup au click avec preview + lien "Voir le bien"
- Légende vérifié/flash, compteur de biens non localisés

`BienMap` (carte fiche détail) :
- Pin propriétaire à la position GPS exacte
- Bouton **"Itinéraire depuis ma position"** → Mapbox Directions API → trace bleue
- Mode plein écran

### 5.7 Image lightbox

`ImageLightbox` premium :
- Plein écran avec backdrop noir gradient + blur
- Swipe gauche/droite (mobile) + flèches clavier (desktop)
- Zoom +/- (desktop), pinch-zoom natif (mobile)
- Thumbnails carousel + compteur
- Body scroll lock + masquage automatique des éléments fixed (cookie banner, FAB)

### 5.8 Header glassmorphism rétractable

- Au top : header normal h-16
- Au scroll : se compacte à h-12 avec glassmorphism doré + bordure or tamisée
- Détection via `HeaderScrollDetector` (data-attribute sur `<html>`)
- 100% CSS, zero re-render React

### 5.9 Activity feed live

- Bulle bottom-left avec dernières demandes de visite anonymisées
- Auto-rotation 8s
- Masquée pendant scroll, réapparaît à l'arrêt
- localStorage pour dismiss permanent

### 5.10 Animations & micro-interactions

- Hero parallax + animation typo cinématique (mots qui se révèlent)
- Compteurs animés (StatsRibbon count-up)
- Cards 3D tilt (TiltCard suivant la souris)
- View Transitions API entre catalogue → fiche bien
- Bobbing animations sur cartes flottantes
- Magnetic cursor sur CTAs primaires

---

## 6. Comportements UX clés

### 6.1 Mobile-first responsive

**Mobile (< 1024px)** :
- Vue catalogue par défaut = **liste** (cards horizontales, prix lisible)
- Toggle "Grille" caché (redondant)
- Sticky CTA "Demander une visite" en bas de fiche flash
- Bottom tab bar (Biens / Flash / Favoris / Compte)
- Hamburger menu avec tous les items (parité avec tab bar)

**Desktop (>= 1024px)** :
- Vue catalogue par défaut = **grille** 4-5 colonnes
- Header sticky + scroll-aware glassmorphism
- 3 toggles (Grille / Liste / Carte)

### 6.2 Transparence radicale

- Offres flash sans photo → placeholder honnête (icône type + "Sans photo")
- **JAMAIS** d'image stock générique sur flash (créerait fausse promesse)
- Prix meublé incohérent → "Sur demande" plutôt qu'un montant absurde
- "Photos disponibles via votre conseiller — il les obtient directement auprès de l'agent"

### 6.3 Vocabulaire local CI intégré à l'IA

Sapphire comprend et répond correctement à :
| Expression client | Sens |
|---|---|
| "dernier prix" | Demande de négociation |
| "caution" | Dépôt de garantie |
| "avance" | Acompte pour réserver |
| "la maison est libre ?" | Vérification dispo |
| "cour commune" | Habitation partagée |
| "entrée couchée" | Loyer payable à l'emménagement |
| "bayer" | Négocier (slang) |

---

## 7. Sessions de développement notables

### Session "Production Ready" (avant cette doc)
- Auth callback PKCE + email confirmation
- Workflow contact flash complet
- Migrations 014-018
- Hardcoded Groq key removed
- Catalogue consolidé

### Session "Polish & Performance"
- Header glassmorphism scroll-aware
- Activity feed live
- Image lightbox premium
- Vue carte avec markers custom
- Animations Hero parallax + typo cinéma
- Compteurs animés StatsRibbon

### Session "Honest Transparency"
- FlashPlaceholder pour offres sans photo
- Logique meublé strict (/nuit ou "Sur demande")
- Format Sapphire ultra minimaliste
- Dédoublonnage webhook WhatsApp (skip `messages.received`)
- Signature flex (HMAC hex / sha256= / shared secret)

### Session "Visual Identity"
- Migration vers Midnight Sapphire (#0b1530) au lieu de noir pur
- Accent doré unifié dark/light (#D4A86A / #A8814A)
- Noise/grain texture global subtil
- Backgrounds sectionnels avec gradients radial gold
- Info color = navy profond (#1e3a8a)

### Session "Bugs & Feedback Client"
- Profil save (telephone → phone)
- KYC bucket migration 023
- Hamburger menu complet
- Sapphire : vouvoiement strict + verrou type bien + vocabulaire CI
- BienNotesPanel + migration 024
- Fix hallucination wa.me link Sapphire

---

## 8. Variables d'environnement

Voir `apps/web/.env.example` pour la liste complète.

**Critiques (jamais commit)** :
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # ⚠️ Pleins pouvoirs DB

# Supabase locaux (DB séparée pour scraping flash)
SUPABASE_LOCAUX_URL=
SUPABASE_LOCAUX_ANON_KEY=

# AI
GROQ_API_KEY=                  # primary
OPENROUTER_API_KEY=            # backup
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_MODEL=openai/gpt-oss-120b:free

# WhatsApp
WASSENDER_API_KEY=
WASSENDER_WEBHOOK_SECRET=

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Site
NEXT_PUBLIC_SITE_URL=https://bogbes-groupe.vercel.app

# Analytics
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_FB_PIXEL_ID=
```

---

## 9. Déploiement

### Production (Vercel)

```bash
# Pre-flight check
cd apps/web
npx tsc --noEmit

# Deploy
cd ../..
vercel --prod

# Re-alias bogbes-groupe.vercel.app vers le nouveau deploy
vercel alias set <nouveau-deploy-url> bogbes-groupe.vercel.app
```

### Base de données

Toute migration manuelle se fait dans **Supabase Dashboard → SQL Editor**.
Coller le contenu du fichier `.sql`, cliquer **Run**.

⚠️ Toujours tester en preview/staging avant prod.

### Webhook Wasender

Dans le dashboard https://www.wasenderapi.com :
- Session "BOGBE'S GROUPE"
- Manage Webhook → URL : `https://bogbes-groupe.vercel.app/api/whatsapp/webhook`
- Events : `messages.upsert` (uniquement, sinon double traitement)
- Secret : matche `WASSENDER_WEBHOOK_SECRET` dans Vercel

---

## 10. Développement local

```bash
# Installation
npm install --legacy-peer-deps

# Lancer la web app
cd apps/web
npm run dev
# → http://localhost:3000

# Variables env
cp .env.example .env.local
# Remplir avec tes clés (Supabase test, Groq personnel, etc.)
```

---

## 11. Commandes utiles

```bash
# Type check
cd apps/web && npx tsc --noEmit --pretty false

# Logs Vercel en streaming
vercel logs https://bogbes-groupe.vercel.app

# Pull env Vercel en local
vercel env pull .env.production --environment production

# Lister env vars
vercel env ls

# Ajouter une env var
echo "valeur" | vercel env add NOM_VAR production
```

---

## 12. Sécurité — Points critiques

1. **Secrets** : jamais en clair dans le code. `.env.local` et `.env.vercel` dans .gitignore strict.
2. **Service role key Supabase** : équivaut à un mot de passe DB root. À rotater si exposé.
3. **RLS** : toujours activé sur tables sensibles. Tester avec `auth.uid()` simulé.
4. **flash_owner_phone** : column-level REVOKE garantit qu'un visiteur ne peut pas le lire même avec SQL direct.
5. **Wasender signature** : webhook vérifie HMAC OU shared secret avant traitement.
6. **KYC bucket** : 10 MB max, types image uniquement, path forcé à `{user_id}/`.

---

## 13. Améliorations futures (roadmap)

### Court terme
- [ ] Scraping n8n amélioré pour récupérer les images WhatsApp réelles
- [ ] Workflow "Demander les photos via conseiller" (notif admin + relai)
- [ ] Filtres équipements UI (chips multi-select sur catalogue)

### Moyen terme
- [ ] App mobile (Expo) avec les mêmes features que web
- [ ] Système de réservation en ligne (paiement Stripe / Mobile Money CI)
- [ ] Contrats de bail OHADA générés en PDF automatiquement
- [ ] Tableau de bord propriétaire avec analytics (vues, demandes, conversion)

### Long terme
- [ ] Marketplace ouverte aux agences (multi-tenant)
- [ ] API publique pour intégrations partenaires
- [ ] IA prédictive sur prix au m² par quartier
- [ ] Expansion régionale (Mali, Sénégal, Burkina)

---

## 14. Crédits

- **Concepteur & Product Owner** : Wilfried (yobed.sarl@gmail.com)
- **Développement assisté** : Claude (Anthropic) via Claude Code
- **Hébergement** : Vercel + Supabase + Cloudinary + Wasender

---

## 15. Licence

Propriétaire — © 2026 BOGBE'S GROUPE. Tous droits réservés.

---

*Dernière mise à jour : 2026-06-08*
