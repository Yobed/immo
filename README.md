# 🏛️ AGENCE IMMO — Plateforme Immobilière Complète (Côte d'Ivoire)

> **Site Vitrine Haut Standing + CRM Immobilier Métier + Agent IA WhatsApp Autonome (24/7)**  
> Dédié au marché immobilier d'Abidjan et de l'intérieur (Cocody, Marcory Zone 4, Plateau, Bingerville, Assinie).  
> Devises en **FCFA** • Sécurisation juridique certifiée (**ACD**, Titre Foncier).

---

## 🏗️ Architecture du Projet

```
Agence-immo/
├── app/                              # Next.js 15 (App Router)
│   ├── page.tsx                      # Page d'accueil vitrine avec recherche multicritères
│   ├── biens/                        # Catalogue des propriétés filtrable en temps réel
│   │   ├── page.tsx                  # Liste des biens (Vente/Location, Budget FCFA, Quartiers)
│   │   └── [id]/page.tsx             # Fiche détaillée du bien (Galerie HD, Rassurance ACD, Bouton WhatsApp)
│   ├── estimer/page.tsx              # Formulaire d'estimation & captation de mandats propriétaires
│   └── crm/                          # Backoffice CRM Immobilier complet
│       ├── page.tsx                  # Dashboard KPIs (Portefeuille FCFA, Leads chauds, Visites)
│       ├── biens/page.tsx            # Gestion des mandats et inventaire des biens
│       ├── contacts/page.tsx         # Gestion des contacts & MOTEUR DE MATCHING IA
│       ├── visites/page.tsx          # Planning des visites et comptes-rendus
│       └── pipeline/page.tsx         # Kanban interactif des transactions (Nouveau lead -> Closing)
├── components/                       # Composants réutilisables (Navbar, Footer, PropertyCard)
├── lib/
│   ├── types.ts                      # Modèle de données TypeScript
│   ├── utils.ts                      # Formatters FCFA, calculs de score de matching
│   ├── mock-data.ts                  # Données réelles de démarrage (Abidjan prestige)
│   └── supabase.ts                   # Client Supabase
├── services/
│   └── whatsapp-bot/                 # Service autonome Baileys + Agent IA WhatsApp
│       ├── bot.js                    # Serveur Baileys WhatsApp avec page QR Code (Port 4000)
│       ├── agent-prompt.js           # Prompt expert de la conseillère "Aya"
│       └── catalog-service.js        # Recherche temps réel dans le catalogue
├── supabase/
│   └── schema.sql                    # Schéma SQL PostgreSQL complet avec RLS
└── package.json
```

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances du Site & CRM

Ouvrez un terminal dans le dossier `Agence-immo` :

```bash
npm install
```

### 2. Installation des dépendances de l'Agent WhatsApp

```bash
cd services/whatsapp-bot
npm install
cd ../..
```

### 3. Lancement du Site Web & CRM

```bash
npm run dev
```

* **Site Web Public** : [http://localhost:3000](http://localhost:3000)
* **Catalogue Biens** : [http://localhost:3000/biens](http://localhost:3000/biens)
* **Backoffice CRM** : [http://localhost:3000/crm](http://localhost:3000/crm)

### 4. Lancement de l'Agent IA WhatsApp

Dans un second terminal :

```bash
npm run bot
```

* Le QR Code s'affiche directement dans la console.
* Vous pouvez également scanner le QR Code depuis votre navigateur sur : **[http://localhost:4000/qr](http://localhost:4000/qr)**
* Une fois scanné, votre agent IA **Aya** répondra automatiquement aux messages entrants 24h/24 et synchronisera les prospects avec le CRM !

---

## 💎 Fonctionnalités Clés

### 1. Moteur de Matching Intelligent (CRM)
Sur l'onglet **CRM > Contacts & Matching** (`/crm/contacts`), l'algorithme compare en un clic les critères de recherche de chaque acquéreur (Budget max en FCFA, Quartiers ciblés, Typologie souhaitée) avec l'ensemble du portefeuille de mandats. Vous pouvez ensuite envoyer l'offre personnalisée directement sur WhatsApp.

### 2. Spécificités Foncières Ivoiriennes (Anti-Fraude)
* Badges de sécurité juridique intégrés : **ACD** (Arrêté de Concession Définitive), **TF** (Titre Foncier), **CMP**.
* Présentation claire des garanties de vérification auprès du Ministère de la Construction.
* Filtres dédiés pour les équipements essentiels à Abidjan : **Groupe électrogène**, **Piscine**, **Sécurité 24/7**.

### 3. Base de Données Supabase Prête à l'Emploi
Le fichier `supabase/schema.sql` contient :
* Tables `properties`, `contacts`, `visits`, `deals`, `whatsapp_conversations`.
* Index de recherche optimisés.
* Politiques de sécurité RLS (Row Level Security).
