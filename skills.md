---
name: Bogbe's-ci-platform
description: >
  Skill complète pour construire une plateforme immobilière full-stack pour la Côte d'Ivoire,
  supérieure à Immo+ (AfriqSolus). Couvre : architecture Next.js + Expo + Supabase + n8n +
  Claude API, schéma BDD complet, composants React (carousel médias, vue 360° Pannellum,
  dashboard analytics), app Expo mobile, paiements CinetPay (Wave / Orange Money / MTN /
  Moov), gestion locative (contrats PDF OHADA, quittances automatiques, relances n8n),
  chatbot IA immobilier CI, design system bleu/orange CI, structure VS Code monorepo Turborepo.
  Déclencher OBLIGATOIREMENT pour toute demande liée à : application immobilière CI,
  clone Immo+, plateforme location/vente Abidjan, annonces immobilières, dashboard
  propriétaire, carousel médias bien, vue 360°, contrat bail ivoirien, paiement mobile
  money CI, chatbot immobilier, gestion locative, quittance loyer, scoring annonce IA.
---

# Immo CI Platform — Guide de développement complet

Plateforme immobilière full-stack pour la Côte d'Ivoire. Développée dans VS Code avec Claude.
Objectif : dépasser Immo+ (Afriq'Solus) sur toutes les dimensions.

---

## 1. STACK TECHNIQUE

```
Frontend Web     → Next.js 14 (App Router) + TypeScript + Tailwind CSS
App Mobile       → Expo SDK 51 (React Native) — codebase partagée avec le web
Backend / BDD    → Supabase (Auth + PostgreSQL + Storage + Realtime + Edge Functions)
Automatisations  → n8n (relances loyer, notifications, quittances, onboarding)
IA               → Claude API claude-sonnet-4-20250514 (chatbot, scoring, génération)
Paiements        → CinetPay (Wave, Orange Money, MTN, Moov Money, cartes bancaires)
Médias images    → Cloudinary (compression auto, CDN mondial, resize à la volée)
Médias vidéos    → Supabase Storage (upload direct, coût maîtrisé)
Vue 360°         → Pannellum.js (open source, mobile-friendly, zéro backend)
Plans / Docs     → Supabase Storage (accès contrôlé par RLS)
Notifications    → Firebase FCM (push mobile) + WhatsApp Business API
Hébergement web  → Vercel
Hébergement n8n  → Hugging Face Spaces (instance existante YOBED)
Monorepo         → Turborepo
```

**Avantages de cette stack :**
- Supabase + n8n + Claude API déjà maîtrisés
- Expo partage ~85% du code Next.js → une seule codebase web + mobile
- CinetPay = leader paiements CI, couvre tous les opérateurs mobiles ivoiriens
- Cloudinary gratuit jusqu'à 25 GB, transformations automatiques (webp, resize, compress)
- Pannellum = meilleure lib 360° open source, parfaite sur mobile et desktop

---

## 2. STRUCTURE DU PROJET VS CODE

```
immo-ci/
├── apps/
│   ├── web/                          # Next.js 14
│   │   ├── app/
│   │   │   ├── (public)/             # Landing, search, fiche bien
│   │   │   ├── (auth)/               # Login, inscription, OTP
│   │   │   ├── (client)/             # Espace locataire / acheteur
│   │   │   ├── (pro)/                # Espace propriétaire / agence
│   │   │   └── api/                  # Routes API : CinetPay, webhooks, PDF
│   │   ├── components/
│   │   │   ├── ui/                   # Design system : Button, Card, Badge, Input...
│   │   │   ├── bien/                 # BienCard, BienCarousel, BienMap, Bien360
│   │   │   ├── search/               # SearchBar, Filters, ResultGrid
│   │   │   ├── reservation/          # ReservationFlow, DatePicker, PaymentStep
│   │   │   ├── contrat/              # ContratPDF, SignatureZone
│   │   │   ├── dashboard/            # KPICard, RevenueChart, OccupancyGauge
│   │   │   └── chat/                 # ChatBot, MessageThread, ConversationList
│   │   └── lib/
│   │       ├── supabase/             # client.ts, server.ts, types.ts
│   │       ├── cloudinary.ts
│   │       ├── cinetpay.ts
│   │       └── claude.ts
│   │
│   └── mobile/                       # Expo (React Native)
│       ├── app/                      # Expo Router (file-based routing)
│       │   ├── (tabs)/               # Bottom navigation tabs
│       │   ├── bien/[id]/            # Fiche bien
│       │   ├── reservation/          # Flow réservation
│       │   └── pro/                  # Espace pro
│       ├── components/               # Composants mobile
│       └── lib/                      # Partagé avec web via packages/shared
│
├── packages/
│   ├── shared/                       # Types TS, utils, constantes web + mobile
│   │   ├── types/                    # database.ts généré par Supabase CLI
│   │   ├── constants/                # Communes CI, types biens, équipements...
│   │   └── utils/                    # formatFCFA(), formatDate(), calcDistance()
│   └── ui/                           # Composants UI partagés (phase 2)
│
├── supabase/
│   ├── migrations/                   # DDL SQL versionné : 001_init.sql, 002_medias.sql...
│   ├── functions/                    # Edge Functions Deno
│   └── seed.sql                      # Données de test (biens fictifs Abidjan)
│
├── n8n/
│   └── workflows/                    # Exports JSON workflows n8n
│       ├── relance-loyer.json
│       ├── onboarding-pro.json
│       ├── quittance-mensuelle.json
│       ├── notification-visite.json
│       └── post-sejour-avis.json
│
├── .env.local                        # Variables d'environnement (voir section 11)
├── turbo.json
└── package.json
```

### Commandes d'initialisation
```bash
# 1. Créer le monorepo Turborepo
npx create-turbo@latest immo-ci --package-manager npm
cd immo-ci

# 2. Dépendances app web
cd apps/web
npm install @supabase/supabase-js @supabase/ssr
npm install cloudinary next-cloudinary
npm install @react-pdf/renderer        # contrats PDF
npm install recharts @tremor/react     # dashboard
npm install react-hook-form zod        # formulaires validés
npm install date-fns                   # gestion dates
npm install pannellum                  # vue 360° (import dynamique côté client)

# 3. Dépendances app mobile
cd apps/mobile
npx expo install expo-router expo-camera expo-image-picker
npx expo install expo-notifications expo-location
npx expo install react-native-maps

# 4. Générer les types TypeScript depuis Supabase
npx supabase gen types typescript --project-id TON_PROJECT_ID \
  > packages/shared/types/database.ts
```

---

## 3. DESIGN SYSTEM

### Palette de couleurs
```css
/* apps/web/app/globals.css */
:root {
  --primary:         #1A5276;  /* Bleu profond — confiance, institution */
  --primary-light:   #EAF4FF;  /* Bleu clair — backgrounds info, badges */
  --secondary:       #E67E22;  /* Orange CI — chaleur, CTA principaux */
  --secondary-light: #FEF5E7;  /* Orange clair — hover states */
  --accent:          #27AE60;  /* Vert — disponible, validé, succès */
  --accent-light:    #E9F7EF;
  --danger:          #E74C3C;  /* Rouge — alerte, indisponible, erreur */
  --danger-light:    #FDEDEC;
  --warning:         #F39C12;  /* Jaune — en attente, à vérifier */
  --surface:         #F4F6F8;  /* Fond général de la page */
  --surface-card:    #FFFFFF;  /* Fond des cartes */
  --text:            #1C2833;  /* Texte principal */
  --text-muted:      #7F8C8D;  /* Texte secondaire */
  --border:          #E5E8EC;  /* Bordures */
}
```

### Typographie
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

/* Règles d'usage */
/* Playfair Display → titres hero, noms de biens, sections importantes */
/* DM Sans          → tout le reste (body, labels, boutons, nav) */
/* JetBrains Mono   → prix FCFA, stats chiffrées, codes de transaction */
```

### tailwind.config.ts
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#1A5276', light: '#EAF4FF' },
        secondary: { DEFAULT: '#E67E22', light: '#FEF5E7' },
        accent:    { DEFAULT: '#27AE60', light: '#E9F7EF' },
        danger:    { DEFAULT: '#E74C3C', light: '#FDEDEC' },
        warning:   { DEFAULT: '#F39C12' },
        surface:   '#F4F6F8',
        muted:     '#7F8C8D',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        btn:  '12px',
        pill: '999px',
      },
    },
  },
  plugins: [],
}
export default config
```

**Principes UX :** Premium mais accessible. Sérieux sans être froid. Local sans être folklorique.
Toujours **mobile-first**. Formulaires simples, peu d'étapes visibles à la fois.

---

## 4. BASE DE DONNÉES SUPABASE

> DDL SQL complet → `references/supabase-schema.md`

### Tables et leur rôle
| Table | Rôle |
|---|---|
| `profiles` | Utilisateurs : locataire / propriétaire / agence / admin |
| `biens` | Annonces immobilières avec toutes leurs caractéristiques |
| `biens_medias` | Médias d'un bien : photos ordonnables, vidéos, 360°, plans |
| `reservations` | Cycle de vie complet d'une réservation |
| `contrats` | Contrats de bail dématérialisés + signature électronique |
| `quittances` | Quittances de loyer mensuelles générées automatiquement |
| `paiements` | Transactions CinetPay + historique complet |
| `conversations` | Fils de messagerie entre utilisateurs |
| `messages` | Messages individuels (temps réel via Supabase Realtime) |
| `visites` | Demandes, confirmations et feedback de visites |
| `avis` | Évaluations bidirectionnelles locataire ↔ propriétaire |
| `favoris` | Biens sauvegardés par utilisateur |
| `notifications` | Centre de notifications unifié |
| `analytics_events` | Tracking comportemental (vues, contacts, conversions) |

### Table `biens_medias` — Médias avancés
```sql
-- Table dédiée aux médias (remplace le simple array photos[] dans biens)
create table public.biens_medias (
  id          uuid primary key default gen_random_uuid(),
  bien_id     uuid not null references public.biens(id) on delete cascade,

  -- Type de média
  type        text not null check (type in ('photo','video','vue_360','plan')),

  -- Source selon le type
  -- photos  → URL Cloudinary (optimisée, CDN)
  -- vidéos  → URL Supabase Storage
  -- 360°    → URL Supabase Storage (photo équirectangulaire .jpg)
  -- plans   → URL Supabase Storage (PDF ou image)
  url         text not null,

  -- Pour vidéos : embed YouTube/Vimeo alternatif
  embed_url   text,

  -- Métadonnées affichage
  titre       text,        -- ex: "Salon", "Cuisine", "Chambre principale"
  ordre       integer not null default 0,  -- position dans le carousel
  est_couverture boolean default false,    -- photo principale de la fiche

  -- Dimensions (pour lazy loading optimal)
  largeur     integer,
  hauteur     integer,

  -- Pour vidéos
  duree_sec   integer,     -- durée en secondes

  -- Pour 360° : hotspots (points d'intérêt cliquables sur la vue)
  hotspots    jsonb default '[]',
  -- Format : [{"pitch": -5, "yaw": 120, "texte": "Cuisine équipée"}]

  created_at  timestamptz default now()
);

-- Index pour récupérer les médias d'un bien dans le bon ordre
create index biens_medias_bien_ordre_idx on public.biens_medias(bien_id, ordre);

-- RLS
alter table public.biens_medias enable row level security;
create policy "Médias des biens publiés visibles par tous" on public.biens_medias
  for select using (
    exists (select 1 from public.biens where id = bien_id and statut = 'publie')
  );
create policy "Propriétaire gère ses médias" on public.biens_medias
  for all using (
    exists (select 1 from public.biens where id = bien_id and proprietaire_id = auth.uid())
  );
```

---

## 5. COMPOSANT CAROUSEL MÉDIAS

> Voir `references/composants.md` pour le code complet TypeScript/React

### Fonctionnalités du BienCarousel
- Navigation : flèches gauche/droite + swipe tactile (mobile) + dots indicateurs
- Miniatures : barre de thumbnails scrollable avec scroll auto sur la miniature active
- Filtres par type : onglets "Tout / Photos / Vidéos / 360° / Plans"
- Badges colorés par type de média :
  - 🟢 Photo → badge vert
  - 🟠 Vidéo → badge orange + durée + bouton play
  - 🟣 Vue 360° → badge violet + overlay interactif
  - 🔵 Plan → badge bleu + affichage schématique
- Drag & drop pour réordonner (côté dashboard propriétaire)
- Upload multi-fichiers avec barre de progression par fichier

### Architecture des médias
```
Photo    → Upload → Cloudinary → URL transformée (webp, 800px) → biens_medias
Vidéo    → Upload → Supabase Storage (bucket: videos) → signed URL → biens_medias
           OU embed YouTube/Vimeo → embed_url dans biens_medias
Vue 360° → Upload → Supabase Storage (bucket: panoramas) → Pannellum.js
Plan     → Upload → Supabase Storage (bucket: plans) → PDF viewer ou image
```

---

## 6. VUE 360° AVEC PANNELLUM

### Intégration Next.js (import dynamique — pas de SSR)
```tsx
// components/bien/Bien360.tsx
'use client'
import dynamic from 'next/dynamic'
import { useEffect, useRef } from 'react'

// Import dynamique : pannellum ne fonctionne pas côté serveur
const Pannellum = dynamic(() => import('pannellum-react').then(m => m.Pannellum), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-900 flex items-center justify-center rounded-xl">
      <span className="text-white/50 text-sm">Chargement de la vue 360°...</span>
    </div>
  )
})

interface HotSpot {
  pitch: number
  yaw: number
  texte: string
}

interface Bien360Props {
  panoramaUrl: string      // URL Supabase Storage photo équirectangulaire
  hotspots?: HotSpot[]
  hauteur?: number
}

export function Bien360({ panoramaUrl, hotspots = [], hauteur = 300 }: Bien360Props) {
  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ height: hauteur }}>
      <Pannellum
        width="100%"
        height={`${hauteur}px`}
        image={panoramaUrl}
        pitch={10}
        yaw={180}
        hfov={110}
        autoLoad
        autoRotate={-2}          // rotation automatique lente
        compass
        showZoomCtrl
        showFullscreenCtrl
        hotSpots={hotspots.map(h => ({
          pitch: h.pitch,
          yaw: h.yaw,
          type: 'info',
          text: h.texte,
          cssClass: 'custom-hotspot',
        }))}
      />
    </div>
  )
}
```

### Comment obtenir des photos 360° (pour les propriétaires)
```
Option gratuite   → App Google Street View (iOS/Android)
                    → Mode "Photo", suivre le guide de l'app
                    → Exporter la photo équirectangulaire .jpg
                    → Uploader sur Supabase Storage

Option mid-range  → Ricoh Theta SC2 (~150 000 FCFA)
                    → Photos professionnelles 5760 × 2880px

Option pro        → Matterport (embed iframe, ~50$/mois)
                    → Pour biens premium >500k FCFA/mois
```

### Hotspots — points d'intérêt cliquables
```json
[
  { "pitch": -5,  "yaw": 120,  "texte": "Cuisine équipée" },
  { "pitch": -10, "yaw": 250,  "texte": "Accès terrasse" },
  { "pitch": 5,   "yaw": 350,  "texte": "Climatisation" }
]
```
Stocker dans la colonne `hotspots jsonb` de `biens_medias`.

---

## 7. PAIEMENTS CINETPAY

> Code complet → `references/cinetpay-integration.md`

### Moyens de paiement disponibles en Côte d'Ivoire
| Moyen | Code | Délai | Part marché |
|---|---|---|---|
| Wave | `WAVE-CI` | Instantané | ~40% |
| Orange Money | `ORANGE-CI` | Instantané | ~30% |
| MTN Mobile Money | `MTN-CI` | Instantané | ~20% |
| Moov Money | `MOOV-CI` | Instantané | ~8% |
| Carte bancaire | `CB` | 1-3 jours | ~2% |

### Architecture paiement
```
Client → POST /api/paiements/initier
       → CinetPay API → URL de paiement
       → Redirect client → Page CinetPay
       → Paiement mobile money
       → CinetPay → POST /api/paiements/webhook (notify_url)
       → Mise à jour BDD : paiement + réservation
       → Trigger n8n : confirmation + génération contrat
       → Client redirigé vers /paiement/retour
```

### Commission plateforme (split automatique)
```ts
const COMMISSION_PCT = 10  // 10% plateforme

function calculerSplit(montantTotal: number) {
  const commission    = montantTotal * COMMISSION_PCT / 100
  const montantNet    = montantTotal - commission
  return { commission, montantNet }
}
```

---

## 8. CHATBOT IA IMMOBILIER

> Spec complète → `references/chatbot-spec.md`

### lib/claude.ts
```ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Tu es un assistant immobilier expert en Côte d'Ivoire.
Tu aides les utilisateurs à trouver des biens à Abidjan et dans toute la CI.

GÉOGRAPHIE ABIDJAN :
Communes : Cocody, Plateau, Marcory, Treichville, Adjamé, Yopougon,
  Abobo, Koumassi, Port-Bouet, Bingerville, Attécoubé, Songon
Quartiers premium : Riviera Faya, Riviera Golf, Palmeraie, Cocody II Plateaux,
  Angré, Deux Plateaux Vallon, Riviera 3, Riviera Bonoumin
Quartiers accessibles : Cocody Mermoz, Marcory Résidentiel, Zone 4

PRIX INDICATIFS (FCFA/mois) :
Studio : 80 000 – 150 000
F2     : 150 000 – 250 000
F3     : 250 000 – 450 000
Villa  : 450 000 – 2 000 000+
Résidence meublée (nuit) : 15 000 – 80 000/nuit

RÈGLES :
- Toujours répondre en français
- Prix toujours en FCFA (jamais en euros ou dollars)
- Proposer des alternatives si le budget est insuffisant pour la zone demandée
- Distinguer location courte durée (résidence meublée) vs longue durée
- Si l'utilisateur donne un budget vague, demander la fourchette
- Maximum 3 suggestions concrètes par réponse`

export async function chatImmobilier(
  messages: { role: 'user' | 'assistant'; content: string }[]
) {
  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system:     SYSTEM_PROMPT,
    messages,
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}
```

### Fonctionnalités IA au-delà du chatbot
```
Scoring annonce    → Qualité de la description, cohérence prix/zone, nb photos
Génération desc    → L'IA rédige la description depuis les caractéristiques saisies
Détection fraude   → Score de risque : doublon, prix anormal, faux profil
Recommandations    → Biens similaires basés sur l'historique de recherche
```

---

## 9. GESTION LOCATIVE

> Template complet → `references/contrat-template.md`

### Contrat de bail PDF (@react-pdf/renderer)
Inclure selon **droit ivoirien OHADA** :
- Identité complète des parties (bailleur + preneur + CNI)
- Description détaillée du bien (adresse, superficie, équipements)
- Durée du bail (date début, date fin ou durée en mois)
- Loyer mensuel en FCFA (en lettres ET en chiffres)
- Charges mensuelles détaillées
- Dépôt de garantie (nombre de mois + montant total)
- Conditions de révision annuelle du loyer
- Clauses résolutoires
- Conditions de résiliation (préavis, motifs)
- Inventaire des équipements (annexe)
- Signatures des deux parties (date, lieu, paraphes page par page)

### Workflow relances loyer (n8n)
```
Trigger : Cron quotidien 08h00 (heure Abidjan GMT+0)
  │
  ├── Récupérer toutes quittances NOT IN ('payee') dans les 7 prochains jours
  │
  ├── J-3 → WhatsApp locataire : "Votre loyer de X FCFA est dû dans 3 jours"
  ├── J-1 → WhatsApp locataire : "Rappel : loyer dû demain. Merci de régulariser."
  ├── J+1 → WhatsApp locataire : "Votre loyer est en retard. Merci de régulariser."
  │          WhatsApp propriétaire : "Le loyer de [Nom Locataire] est en retard."
  └── J+7 → WhatsApp + Email locataire : "Mise en demeure - loyer en retard de 7 jours"
             Notification admin plateforme

Enregistrer chaque relance dans la table notifications
Mettre à jour quittances.statut → 'en_retard' si J+1
```

### Quittances automatiques (n8n)
```
Trigger : Cron 1er de chaque mois à 07h00
  │
  ├── Récupérer tous les contrats actifs (statut = 'signe')
  ├── Générer une quittance pour chaque contrat (table quittances)
  ├── Générer le PDF (Edge Function Supabase)
  ├── Stocker le PDF dans Supabase Storage
  └── Envoyer par WhatsApp + Email au locataire
```

---

## 10. DASHBOARD ANALYTICS PROPRIÉTAIRE

> Spec complète → `references/dashboard-spec.md`

### KPIs en bandeau supérieur (4 cartes)
```ts
interface DashboardKPIs {
  revenus_mois:          number   // FCFA — comparé au mois précédent
  taux_occupation:       number   // % biens loués / total biens actifs
  reservations_attente:  number   // badge alerte rouge si > 0
  messages_non_lus:      number   // badge alerte si > 0
  note_moyenne:          number   // 0.0 – 5.0
  visites_semaine:       number
}
```

### Graphiques (Recharts + Tremor)
- **Bar chart** : revenus des 12 derniers mois
- **Gauge Tremor** : taux d'occupation par bien
- **Donut** : répartition paiements par méthode (Wave, OM, MTN, Moov, CB)
- **Funnel** : vues → contacts → visites → réservations → signatures
- **Calendrier** : encaissements à venir dans les 30 prochains jours

### Alertes (triées par priorité)
```
🔴 URGENT   Loyers en retard (J+1 ou plus)
🟠 ATTENTION Demandes de visite sans réponse depuis >24h
🟠 ATTENTION Contrats expirant dans les 30 prochains jours
🟡 INFO     Biens sans réservation depuis >60 jours
🟡 INFO     Avis négatifs (note < 3) non répondus
```

---

## 11. VARIABLES D'ENVIRONNEMENT

```env
# .env.local — NE PAS COMMITTER (ajouter au .gitignore)

# ── Supabase ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Cloudinary (images) ───────────────────────────
CLOUDINARY_CLOUD_NAME=immo-ci
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=immo-ci

# ── CinetPay (paiements) ──────────────────────────
CINETPAY_API_KEY=xxxx
CINETPAY_SITE_ID=xxxx
CINETPAY_SECRET_KEY=xxxx
CINETPAY_BASE_URL=https://api-checkout.cinetpay.com/v2

# ── Claude / Anthropic (IA) ───────────────────────
ANTHROPIC_API_KEY=sk-ant-...

# ── n8n (automatisations) ─────────────────────────
N8N_WEBHOOK_BASE_URL=https://yobed-n8n-supabase-claude.hf.space/webhook

# ── Firebase (push mobile) ────────────────────────
FIREBASE_PROJECT_ID=immo-ci
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@immo-ci.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ── WhatsApp Business API ─────────────────────────
WHATSAPP_PHONE_NUMBER_ID=xxxx
WHATSAPP_ACCESS_TOKEN=xxxx

# ── App ───────────────────────────────────────────
NEXT_PUBLIC_URL=https://immo-ci.vercel.app
NEXT_PUBLIC_APP_NAME=Immo CI
NODE_ENV=development
```

---

## 12. ROADMAP DE DÉVELOPPEMENT

### Phase 1 — Fondations (Semaines 1–2)
- [ ] Setup monorepo Turborepo + TypeScript strict
- [ ] Migrations Supabase dans l'ordre (001 à 006)
- [ ] Auth : email + Google OAuth + OTP téléphone
- [ ] Génération types TypeScript depuis Supabase CLI
- [ ] Design system Tailwind (couleurs, typo, composants de base)
- [ ] Landing page Next.js (10 sections)

### Phase 2 — Core Annonces (Semaines 3–5)
- [ ] CRUD biens (formulaire multi-étapes, validation Zod)
- [ ] Upload photos → Cloudinary + sauvegarde `biens_medias`
- [ ] Upload vidéos → Supabase Storage + sauvegarde `biens_medias`
- [ ] Upload 360° → Supabase Storage + intégration Pannellum
- [ ] Upload plans → Supabase Storage
- [ ] Drag & drop ordre des médias (dashboard pro)
- [ ] Composant `BienCarousel` complet (4 types + miniatures + filtres)
- [ ] Recherche full-text + filtres (commune, prix, type, équipements)
- [ ] Vue carte (Mapbox ou Google Maps)
- [ ] Messagerie temps réel (Supabase Realtime)
- [ ] Système de favoris

### Phase 3 — Différenciation (Semaines 6–8)
- [ ] Intégration CinetPay (tous les moyens de paiement CI)
- [ ] Flow réservation complet (dates → paiement → confirmation)
- [ ] Génération contrats PDF (@react-pdf/renderer, droit OHADA)
- [ ] Quittances de loyer automatiques
- [ ] Chatbot IA (Claude API, contexte immobilier CI)
- [ ] Scoring annonces par IA (qualité, prix, photos)
- [ ] Dashboard analytics propriétaire (Recharts + Tremor)
- [ ] Système avis bidirectionnel
- [ ] KYC propriétaire (upload CNI + selfie)

### Phase 4 — Mobile & Automatisation (Semaines 9–10)
- [ ] App Expo (adapter composants web → React Native)
- [ ] Notifications push Firebase FCM
- [ ] Workflows n8n (relances loyer, quittances, onboarding, post-séjour)
- [ ] Tests (Playwright web, Detox mobile)
- [ ] Optimisation performance (images WebP, bundle size, Lighthouse)
- [ ] Déploiement Vercel + soumission App Store / Google Play

---

## 13. INSTRUCTIONS PAR TYPE DE TÂCHE

**"Génère le schéma Supabase / les migrations"**
→ Lire `references/supabase-schema.md`. Créer les fichiers dans `supabase/migrations/`
  dans cet ordre : 001_profiles, 002_biens, 003_biens_medias, 004_reservations,
  005_contrats_quittances, 006_messagerie, 007_visites_avis, 008_notifications_analytics.

**"Crée la landing page"**
→ Design system section 3. Hero avec search bar IA + CTA App Store/Play Store.
  10 sections : Hero → Solution → Comment ça marche → Biens vedette → Fonctionnalités →
  Carte zones CI → Témoignages → Chiffres clés → Partenaires → CTA final → Footer.
  Playfair Display pour les H1/H2, DM Sans pour le body.

**"Crée le carousel médias d'un bien"**
→ Section 5 + `references/composants.md`. 4 types (photo/vidéo/360°/plan).
  Miniatures scrollables, onglets filtrage, navigation flèches + swipe, badges colorés.
  Drag & drop pour réordonner côté propriétaire.

**"Intègre la vue 360°"**
→ Section 6. Pannellum.js, import dynamique (ssr: false), photo équirectangulaire
  depuis Supabase Storage, hotspots configurables via JSON, autoRotate: -2.

**"Intègre CinetPay"**
→ `references/cinetpay-integration.md`. API Routes Next.js + webhook notify_url +
  split commission automatique. Gérer tous les statuts : initié / en_cours / succès / échec.

**"Crée le dashboard propriétaire"**
→ Section 10 + `references/dashboard-spec.md`. 4 KPI cards Tremor + graphiques
  Recharts + section alertes triées par priorité.

**"Crée le chatbot IA"**
→ Section 8 + `references/chatbot-spec.md`. Claude API, system prompt immobilier CI,
  géographie Abidjan complète, prix FCFA, conversation multi-turn avec historique.

**"Génère un contrat de bail"**
→ Section 9 + `references/contrat-template.md`. @react-pdf/renderer. Droit ivoirien
  OHADA. Toujours montants en FCFA en lettres ET en chiffres.

**"Crée un workflow n8n"**
→ `references/n8n-workflows.md`. Utiliser les webhooks Supabase comme triggers.
  Instance : https://yobed-n8n-supabase-claude.hf.space

**"Crée un composant React/TypeScript"**
→ TypeScript strict + Tailwind CSS + mobile-first. Design system section 3.
  Exporter le composant ET ses types. Toujours inclure les états : loading / error / empty.
  Toujours utiliser les CSS variables --primary, --secondary, --accent, --danger.

**"Configure l'authentification"**
→ @supabase/ssr pour Next.js 14 App Router. Middleware.ts pour la protection des routes.
  3 méthodes : email+password, Google OAuth, OTP par téléphone (WhatsApp ou SMS).
  Créer le profil dans profiles au moment de l'inscription (trigger ou webhook).