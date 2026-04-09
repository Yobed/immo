# Audit UI — Immo CI Frontend
**Date :** 2026-04-09  
**Périmètre :** `apps/web/app/` + `apps/web/components/`  
**Stack :** Next.js 14 App Router, Tailwind CSS, Tremor (dashboard)  
**Mode :** Audit statique (pas de serveur de dev détecté)

---

## 1. CARTOGRAPHIE DES PAGES

### Route group (public) — layout : header sticky + footer léger

| Route | Fichier source | Composants principaux | Complexité |
|-------|---------------|----------------------|------------|
| `/` | `(public)/page.tsx` | Hero, HowItWorks, FeaturedProperties, Features, MapZones, Testimonials, Stats, Partners, CTAFinal, Footer | complex |
| `/biens` | `(public)/biens/page.tsx` | BienCard (grille), filtres rapides par type, pagination | medium |
| `/biens/[id]` | `(public)/biens/[id]/page.tsx` | BienCarousel, BienMap, FavorisButton, VisiteRequestForm, ContactProprietaireButton, panneau sticky desktop | complex |
| `/recherche` | `(public)/recherche/page.tsx` | SearchBar, SearchFilters (sidebar), BienCard (grille), PropertiesMap (vue carte), pagination | complex |
| `/chat` | `(public)/chat/page.tsx` | ChatBot | simple |

### Route group (auth) — layout : aucun (standalone centré)

| Route | Fichier source | Composants principaux | Complexité |
|-------|---------------|----------------------|------------|
| `/login` | `(auth)/login/page.tsx` | Formulaire email/MDP, bouton Google OAuth | simple |
| `/register` | `(auth)/register/page.tsx` | Formulaire inscription, sélecteur rôle locataire/propriétaire | simple |
| `/verify-otp` | `(auth)/verify-otp/page.tsx` | Flow 2 étapes : téléphone → code OTP | medium |

### Route group (pro) — layout : header avec nav 6 liens + badge PRO

| Route | Fichier source | Composants principaux | Complexité |
|-------|---------------|----------------------|------------|
| `/dashboard` | `(pro)/dashboard/page.tsx` | KPICard (×4), RevenueBarChart, OccupancyGauge, PaymentDonut, ConversionFunnel, AlertesSection | complex |
| `/mes-biens` | `(pro)/mes-biens/page.tsx` | BienCard (grille), ToggleStatutButton, boutons Modifier/Médias par card | medium |
| `/mes-biens/[id]/modifier` | `(pro)/mes-biens/[id]/modifier/page.tsx` | BienForm (steps 1–4) + Step5Medias | complex |
| `/mes-biens/nouveau` | `(pro)/mes-biens/nouveau/page.tsx` | BienForm (steps 1–5) | complex |
| `/visites` | `(pro)/visites/page.tsx` | Liste visites, StatutBadge, VisiteActions (confirmer/refuser) | medium |
| `/quittances` | `(pro)/quittances/page.tsx` | KPI cards stats, filtres, liste quittances avec Badge | medium |
| `/avis-recus` | `(pro)/avis-recus/page.tsx` | AvisCard, AvisForm, ReponseForm, StarRating | medium |
| `/profil` | `(pro)/profil/page.tsx` | KYCStatusBadge, KYCUploader, infos profil statiques | medium |

### Route group (client) — layout : header avec nav 6 liens

| Route | Fichier source | Composants principaux | Complexité |
|-------|---------------|----------------------|------------|
| `/favoris` | `(client)/favoris/page.tsx` | BienCard (grille), empty state | simple |
| `/reservations` | `(client)/reservations/page.tsx` | Liste réservations avec Badge statut, lien vers détail | medium |
| `/reservations/[id]` | `(client)/reservations/[id]/page.tsx` | Détail réservation, PaiementButton | medium |
| `/reservations/nouvelle` | `(client)/reservations/nouvelle/page.tsx` | ReservationFlow, DatePicker | medium |
| `/mes-visites` | `(client)/mes-visites/page.tsx` | Liste visites locataire, StatutBadge | simple |
| `/messages` | `(client)/messages/page.tsx` | ConversationList (sidebar), MessageThread, MessageInput | complex |
| `/mes-avis` | `(client)/mes-avis/page.tsx` | AvisCard, AvisForm, StarRating | simple |
| `/notifications` | `(client)/notifications/page.tsx` | NotificationItem, NotificationCenter | simple |
| `/paiement/retour` | `(client)/paiement/retour/page.tsx` | Page retour paiement (succès/échec) | simple |

---

## 2. SYSTÈME DE STYLES

### Tokens CSS définis dans `globals.css`

```
--primary:         #1A5276  (bleu profond — confiance, institution)
--primary-light:   #EAF4FF  (bleu clair — backgrounds info)
--secondary:       #E67E22  (orange CI — CTA principaux)
--secondary-light: #FEF5E7  (orange clair — hover)
--accent:          #27AE60  (vert — disponible, succès)
--accent-light:    #E9F7EF
--danger:          #E74C3C  (rouge — erreur, alerte)
--danger-light:    #FDEDEC
--warning:         #F39C12  (jaune — en attente)
--surface:         #F4F6F8  (fond général)
--surface-card:    #FFFFFF  (fond cartes)
--text:            #1C2833  (texte principal)
--text-muted:      #7F8C8D  (texte secondaire)
--border:          #E5E8EC  (bordures)
```

### Classes Tailwind custom (`tailwind.config.ts`)

| Classe | Valeur | Usage |
|--------|--------|-------|
| `rounded-card` | 16px | Cartes, panneaux, modales |
| `rounded-btn` | 12px | Boutons, inputs, badges |
| `rounded-pill` | 999px | Badges de type, filtres actifs |
| `font-display` | Playfair Display, serif | Titres H1/H2/H3, logo |
| `font-sans` | DM Sans, sans-serif | Corps de texte, labels, nav |
| `font-mono` | JetBrains Mono, monospace | Prix en FCFA, métriques numériques |

### Palette effective

- **60 % surface :** blanc (#FFFFFF) + gris clair (#F4F6F8)
- **30 % primaire :** bleu #1A5276 (headers, titres, bordures actives)
- **10 % accent :** orange #E67E22 (CTA principaux, badges PRO, étoiles)

### Breakpoints responsive utilisés

| Breakpoint | Usage principal |
|-----------|----------------|
| `sm` (640px) | Grilles 1→2 colonnes, nav desktop partielle |
| `md` (768px) | Nav desktop complète, sidebar filtres, SearchBar |
| `lg` (1024px) | Grilles 3+ colonnes, panneau sticky fiche bien, sidebar messages |
| `xl` (1280px) | Grille 4 colonnes sur `/biens` et `/favoris` |

### Composants UI de base (`components/ui/`)

| Composant | Variants | État loading | Accessibilité |
|-----------|---------|-------------|--------------|
| `Button` | primary, secondary, outline, ghost, danger | Oui (spinner) | focus-visible ring |
| `Input` | — | Non | label + error intégrés |
| `Badge` | default, success, warning, danger, info, photo, video, vue360, plan | Non | Non (span générique) |
| `Card` | padding: none/sm/md/lg | — | Non |

---

## 3. PATTERNS RÉCURRENTS

### Cards de biens

Deux implémentations coexistent :

1. **`BienCard`** (`components/bien/BienCard.tsx`) — pattern complet
   - Photo `aspect-[4/3]` avec gradient overlay bas
   - Badge type en haut à gauche (couleur par type via `TYPE_COLORS` map)
   - Prix superposé sur photo (fond blanc/95, `font-mono`)
   - Titre `font-sans font-semibold`, localisation avec icône SVG inline
   - Stats surface/pièces séparées par `border-t`
   - Hover : `scale-105` sur image + `shadow-lg` sur card + `text-primary` sur titre

2. **`FeaturedProperties`** (`components/landing/FeaturedProperties.tsx`) — variante inline
   - Structure similaire mais prix au-dessus du titre (pas superposé photo)
   - Titre en `font-display` (vs `font-sans` dans BienCard)
   - Badge utilise `Badge` component (vs span inline dans BienCard)
   - Pas d'animation scale sur hover

**Divergence :** les deux patterns affichent la même entité "bien" avec une hiérarchie visuelle différente.

### Formulaires multi-étapes (BienForm)

- Barre de progression : 5 segments `rounded-pill`, remplis en `bg-primary`
- Step 1–4 délèguent à des sous-composants (`Step1Infos`, etc.)
- Step 5 (médias) : onglets type (photo/vidéo/360/plan), drag-and-drop via `MediaSortable`
- Navigation : boutons Précédent/Suivant, validation step-by-step manuelle
- `Input` composant utilisé pour les champs texte, select et textarea en inline Tailwind
- Erreurs affichées en `text-danger text-xs` sous chaque champ

### Tableaux de listings (mes-biens, reservations, visites)

Pattern commun pour les pages listing :
- `space-y-4` comme conteneur
- Chaque ligne : `bg-white rounded-card border p-5`
- `Badge` variant pour le statut (warning/success/danger/default)
- Texte principal `font-sans font-semibold`, secondaire `text-muted`
- Montants en `font-mono text-primary`
- Empty state centré avec texte `text-muted` + lien CTA

### Navigation

- **Header public :** 64px hauteur fixe, logo + SearchBar centre + nav + UserMenu/CTA
- **Header pro :** Même hauteur, logo + badge "PRO" secondary + nav 6 liens + NotificationBell + UserMenu
- **Header client :** Identique au header pro sans badge PRO
- **MobileMenu :** Drawer right, 272px de large, backdrop blur, animation slide depuis droite
- Les 3 headers partagent le même pattern de markup mais sont dupliqués dans 3 layouts séparés

### Actions propriétaire vs visiteur (fiche bien `/biens/[id]`)

- Détection `isOwner` côté serveur
- **Visiteur desktop :** panneau sticky 384px à droite (prix, favoris, contact, CTA réservation/visite)
- **Visiteur mobile :** composant `MobileActions` dupliqué sous le contenu principal
- **Propriétaire :** panneau "Votre annonce" avec liens Modifier/Médias/Retour
- Duplication notable : le code de `MobileActions` réplique la logique du panneau desktop

### États vides (empty states)

Pattern cohérent dans les pages listing :
- `/mes-biens` : texte + lien "Créer ma première annonce"
- `/favoris` : texte + lien "Parcourir les annonces →"
- `/reservations`, `/mes-visites` : texte + bouton primary "Rechercher un bien"
- `/biens` (aucun résultat) : emoji 🏚 + titre `font-display` + texte + lien CTA
- `/visites` (pro, aucune demande) : texte seul, pas d'action proposée

### Cartes interactives

- `BienMap` : carte Leaflet sur fiche bien (`components/bien/BienMap.tsx`)
- `PropertiesMap` : carte avec markers multiples sur page recherche
- `MapZones` : carte statique illustrative sur la landing
- Tous chargés dynamiquement (SSR:false implicite via `'use client'` + dynamic import)

---

## 4. FORCES

### Système de design cohérent sur les pages core
Le token system (custom properties CSS + Tailwind extend) est bien pensé et appliqué rigoureusement sur les pages principales : `/biens`, `/biens/[id]`, `/recherche`, `/mes-biens`, `/mes-visites`, `/reservations`. Les classes `rounded-card`, `rounded-btn`, `font-display`, `font-mono` sont utilisées de façon cohérente pour signifier leur sémantique (cards, boutons, prix).

### Hiérarchie typographique lisible
La séparation `font-display` (Playfair Display, titres) / `font-sans` (DM Sans, corps) / `font-mono` (JetBrains Mono, chiffres) crée une identité visuelle distincte et adaptée à l'immobilier. Les prix en mono se distinguent bien des textes descriptifs.

### BienCard bien exécutée
Le composant central de l'application est soigné : photo 4/3, gradient overlay, prix superposé avec backdrop-blur, badge type coloré par catégorie, hover animé (scale image + shadow card). Il s'identifie clairement comme une card immobilière.

### Dashboard analytique complet
Le dashboard PRO propose KPIs + graphique barres (revenus 12 mois) + gauge d'occupation + donut paiements + funnel de conversion + section alertes. La structure de données est calculée proprement côté serveur avec fetch parallèle.

### Formulaire multi-étapes BienForm bien structuré
Progress bar visuelle, validation step-by-step avec retour automatique à l'étape problématique, Step5 avec onglets médias type par type. Le flux créateur "infos → prix → localisation → équipements → médias → publication" est bien pensé.

### Responsive navigation mobile
Le MobileMenu est un drawer right avec animation CSS smooth, backdrop blur, et close on backdrop click. Le burger animé (3 barres → croix) est un bon standard.

### Gestion des états vides
La plupart des pages listing proposent un empty state avec action contextuelle (créer, rechercher) plutôt qu'un vide total.

### Copie française de qualité
Les labels, messages d'erreur et textes d'interface sont en français correct avec des formulations contextuelles (ex: "Aucune demande de visite", "Demandeur:", "Séjour terminé le…"). Pas de faux cognats anglais.

---

## 5. FAIBLESSES

### Pages auth complètement hors système de design
`/login`, `/register`, `/verify-otp` n'utilisent pas les composants `Button`, `Input`, `Card` du design system. Elles utilisent :
- `bg-gray-50` au lieu de `bg-surface`
- `text-gray-700/800/900` au lieu de `text-[var(--text)]` / `font-sans`
- `rounded-lg` au lieu de `rounded-btn`
- Hardcoded `bg-[#1A5276]` et `bg-[#E67E22]` au lieu de `bg-primary` / `bg-secondary`
- `style={{ fontFamily: 'Playfair Display, serif' }}` inline au lieu de `font-display`
- Ces pages ne sont dans aucun layout (public/pro/client) : pas de header Immo CI, pas de retour à l'accueil visible, rupture totale de contexte

### Pages pro `/quittances` et `/avis-recus` hors système
Ces deux pages utilisent massivement `text-gray-*` au lieu des tokens :
- `text-gray-900` (devrait être `text-[var(--text)]`)
- `text-gray-500/600` (devrait être `text-muted`)
- `text-red-600` / `text-green-600` / `text-yellow-600` (devraient être `text-danger` / `text-accent` / `text-warning`)
- Titres en `text-2xl font-bold` sans `font-display`
- Pas de `py-8` wrapper cohérent : `/quittances` démarre à `max-w-5xl` sans bg-surface explicite

### Profil non éditable
La page `/profil` affiche les informations personnelles (nom, email, téléphone) en lecture seule avec des `<p>` statiques. Il n'y a pas de bouton "Modifier" ou de formulaire d'édition. L'utilisateur ne peut pas mettre à jour ses données.

### Page messages sans responsive mobile
La page `/messages` utilise `h-screen flex` avec sidebar `w-72` fixe. Sur mobile ou tablette, les deux colonnes (liste + thread) s'empilent ou débordent. Il n'y a pas de gestion de navigation mobile (afficher la liste puis le thread, pas les deux simultanément).

### Fiche bien : duplication MobileActions
Le composant `MobileActions` dans `/biens/[id]/page.tsx` (lignes 357–399) est une copie partielle du panneau desktop visiteur. Si le contenu du panneau évolue, il faut maintenir deux endroits. Le composant devrait être unifié avec `visibility: hidden lg:visible` ou une abstraction partagée.

### Pas de skeleton/loader sur les listes serveur
Les pages serveur chargent tout avant d'afficher (SSR complet). Sur une connexion lente, l'utilisateur voit une page blanche. Il n'y a pas de `loading.tsx` dans les routes groups `(pro)`, `(client)` ou `(public)` pour afficher un skeleton pendant le chargement des données Supabase.

### Recherche mobile sans filtres accessibles
Sur `/recherche`, la `SearchFilters` sidebar est `hidden lg:block`. Sur mobile et tablette, les filtres (commune, type, prix, équipements) sont complètement inaccessibles. Il n'y a pas de bouton "Filtres" ni de drawer mobile pour les filtres.

### Pas de `<label>` explicite sur certains champs
Dans `SearchFilters.tsx`, le select "Type de bien" et les boutons équipements ont des labels `<label>` mais ils ne sont pas reliés par `htmlFor`/`id`. Le `CommuneAutocomplete` n'a pas de label visible.

---

## 6. INCOHÉRENCES

### Espacement (padding/margin inconsistants)

- **Pages pro/client :** La plupart utilisent `py-8 px-4 max-w-*xl mx-auto` comme wrapper standard. Mais `/quittances` utilise `max-w-5xl mx-auto px-4 py-8` sans conteneur `bg-surface min-h-screen`, ce qui produit un fond blanc instead of gris.
- **Dashboard :** `min-h-screen bg-surface` en div wrapper + `py-8` inner — cohérent avec les autres pages pro.
- **Avis reçus :** `max-w-3xl mx-auto px-4 py-8` — pas de `bg-surface min-h-screen` non plus.
- **Fiche bien :** Les sections internes (description, équipements, localisation) utilisent `p-5` tandis que les stats rapides utilisent `p-3`. Inconsistance du padding card : `p-3`, `p-4`, `p-5` coexistent sans logique systématique.

### Typographie (mélange de classes font-*)

- **Dans les pages pro/auth :** `font-bold`, `font-semibold` Tailwind natifs utilisés directement plutôt que via le système `font-display`/`font-sans`. Exemples :
  - `/quittances/page.tsx:75` : `text-2xl font-bold text-gray-900` — le titre de page devrait être `font-display text-3xl text-[var(--text)]`
  - `/avis-recus/page.tsx:70` : `text-2xl font-bold text-gray-900` — même problème
  - `/login/page.tsx:73` : `text-2xl font-semibold text-gray-800` pour le sous-titre
- **Dans BienCard vs FeaturedProperties :** Le titre h3 est `font-sans font-semibold` dans BienCard mais `font-display font-semibold` dans FeaturedProperties pour le même type de contenu (titre de bien).

### Couleurs (usage hors-système)

| Fichier | Classes hors-système | Devrait être |
|---------|---------------------|-------------|
| `login/page.tsx` | `bg-gray-50`, `text-gray-700`, `border-gray-300`, `bg-[#1A5276]`, `bg-[#154360]` | `bg-surface`, `text-[var(--text)]`, `border-[var(--border)]`, `bg-primary`, `bg-primary/90` |
| `register/page.tsx` | `bg-[#E67E22]`, `has-[:checked]:bg-blue-50`, `text-green-600`, `bg-red-50`, `text-red-700` | `bg-secondary`, `bg-primary-light`, `text-accent`, `bg-danger-light`, `text-danger` |
| `quittances/page.tsx` | `text-gray-900`, `text-gray-500`, `text-yellow-600`, `text-red-600`, `text-green-600`, `border-red-500`, `border-yellow-400`, `border-green-500` | tokens du design system |
| `avis-recus/page.tsx` | `text-gray-900`, `text-gray-800`, `text-gray-500`, `bg-orange-50` | tokens du design system |
| `AvisCard.tsx` | `text-gray-900`, `text-gray-400`, `text-gray-700` | `text-[var(--text)]`, `text-muted` |
| `Testimonials.tsx` | `text-gray-200`, `text-gray-700`, `text-gray-800` | tokens |
| `BienCard.tsx:30-31` | `bg-gray-100 text-gray-700` (bureau), `bg-green-100 text-green-700` (commerce) | tokens accent/muted |

**Bilan :** 8+ fichiers utilisent des classes gray/red/green Tailwind brutes au lieu des tokens du design system.

### Responsive (breakpoints manquants ou incohérents)

- **Messages page :** Layout `flex h-screen` non adapté au mobile — pas de breakpoint pour masquer la sidebar sur petit écran.
- **Recherche page :** Les filtres sidebar (`hidden lg:block`) disparaissent sans alternative sur mobile/tablette — gap UX critique.
- **Fiche bien - prix mobile :** Le prix est affiché `lg:hidden` dans la colonne gauche pour mobile, mais le panneau sticky est `hidden lg:block`. Il y a un espace de 2 composants affichant le prix selon le viewport (correct dans le principe, mais le prix mobile apparaît dans le flux de contenu plutôt qu'en position fixe en bas d'écran, moins accessible).
- **Dashboard :** Grille KPI `grid-cols-2 lg:grid-cols-4` — manque le breakpoint `md` (sur tablette portrait, 2 colonnes pour 4 métriques crée des cartes très larges).

### Patterns dupliqués différemment implémentés

- **StatutBadge :** Défini localement dans `(pro)/visites/page.tsx` ET dans `(client)/mes-visites/page.tsx` — logique identique (même config objet) mais deux composants distincts non partagés.
- **formatFCFA :** Fonction locale définie dans `BienCard.tsx`, `FeaturedProperties.tsx`, `(public)/biens/[id]/page.tsx`, et la page de réservations — 4 définitions indépendantes d'une même utilitaire.
- **coverMap pattern (photos de couverture) :** Requête secondaire séparée vers `biens_medias` avec le même algorithme de sélection de photo de couverture dans 4 pages : `/biens`, `/recherche`, `/favoris`, `FeaturedProperties` — copié-collé sans extraction dans un helper partagé.
- **Pagination :** Pattern `Array.from({length: totalPages})` + links `?page=N` dupliqué dans `/biens/page.tsx` et `/recherche/page.tsx`.

---

## 7. OPPORTUNITÉS D'AMÉLIORATION

### P1 — Impact élevé

**P1-A : Refactoriser les pages auth dans le design system**  
`/login`, `/register`, `/verify-otp` doivent utiliser les composants `Button`, `Input`, le layout public (au moins un wrapper avec logo Immo CI et lien retour), et les tokens couleur. Actuellement ces pages donnent l'impression d'une application différente. Recommandation : créer un layout `(auth)/layout.tsx` avec header minimal (logo + lien `/`), fond `bg-surface`, et refactoriser les formulaires pour utiliser le composant `Input` et `Button`.

**P1-B : Corriger `/quittances` et `/avis-recus`**  
Ces pages pro sont en rupture stylistique avec le reste de l'espace pro. Remplacer toutes les classes `text-gray-*` par les tokens, les titres par `font-display`, ajouter le wrapper `bg-surface min-h-screen`. Estimation : 30 min par page.

**P1-C : Ajouter les filtres mobiles sur `/recherche`**  
La sidebar de filtres est invisible sur mobile. Ajouter un bouton "Filtres" en mobile ouvrant un drawer ou une modal avec `SearchFilters`. Sans cela, les utilisateurs mobiles (majoritaires en Côte d'Ivoire) ne peuvent pas filtrer les annonces.

**P1-D : Ajouter `loading.tsx` dans les route groups**  
Créer `app/(pro)/loading.tsx`, `app/(client)/loading.tsx`, `app/(public)/loading.tsx` avec des skeletons adaptés au layout de chaque section. Sur des connexions 3G typiques en CI, les pages serveur peuvent prendre 2–4 secondes sans feedback visuel.

### P2 — Impact moyen

**P2-A : Rendre la page `/profil` éditable**  
La fiche profil est actuellement en lecture seule. Ajouter un formulaire d'édition (nom, téléphone) avec le composant `Input` et un bouton "Enregistrer". Sans édition, les utilisateurs qui ont fait une faute de frappe à l'inscription sont bloqués.

**P2-B : Adapter la messagerie au mobile**  
La page `/messages` avec deux colonnes fixes est inutilisable sur mobile. Implémenter un pattern mobile-first : liste des conversations d'abord, thread sur sélection avec un bouton retour. Utiliser `searchParams.conv` déjà présent pour gérer l'état via URL.

**P2-C : Extraire les utilitaires partagés**  
Créer `lib/format.ts` avec `formatFCFA()`, `lib/coverMap.ts` pour la logique de photo de couverture, et `components/bien/StatutBadge.tsx` partagé entre les pages visites pro et client. Réduit la surface de maintenance.

**P2-D : Unifier BienCard et FeaturedProperties**  
`FeaturedProperties` devrait utiliser directement `BienCard` plutôt que réimplémenter sa propre version. La différence principale (position du prix) peut se gérer via une prop `pricePosition?: 'overlay' | 'above'`.

**P2-E : Corriger la fiche bien mobile — sticky CTA**  
Sur mobile, les actions visiteur (réserver, contacter) apparaissent en bas du contenu, souvent hors écran. Un sticky bar mobile en bas de viewport avec prix + CTA principal serait plus accessible (pattern standard des apps d'annonces immobilières).

### P3 — Cosmétique

**P3-A : Normaliser les border-radius**  
54 usages de `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-md` etc. existent hors du système (principalement dans les pages auth et quelques composants). Les remplacer par `rounded-btn` ou `rounded-card` selon le contexte.

**P3-B : Lier les labels aux inputs (accessibilité)**  
Dans `SearchFilters`, certains labels ne sont pas reliés à leur input par `htmlFor`/`id`. Affecter des IDs explicites à tous les champs de formulaire.

**P3-C : Ajouter une animation d'entrée sur la landing**  
Les sections de la landing apparaissent statiquement. Un `scroll-reveal` avec `@keyframes` ou Intersection Observer + `transition-opacity` sur les sections HowItWorks, Features, Stats donnerait plus de polish.

**P3-D : États de chargement sur les actions serveur**  
Les boutons `ToggleStatutButton`, `FavorisButton` et `VisiteActions` effectuent des mutations mais certains n'ont pas de loading state visible. Le composant `Button` supporte déjà `loading={true}`, il faut juste le câbler.

---

## Score global UI : **6,2 / 10**

| Critère | Score | Justification |
|---------|-------|--------------|
| Système de design | 6/10 | Token system excellent, mais ~8 fichiers/pages hors-système |
| Typographie | 7/10 | Hiérarchie display/sans/mono bien pensée, quelques violations dans les pages secondaires |
| Cohérence couleur | 5/10 | Core pages bonnes, pages auth + quittances + avis = rupture totale |
| Composants UI | 7/10 | Button/Input/Badge/Card bien conçus, sous-utilisés dans auth/pro secondaires |
| Responsive | 5/10 | Filtres mobiles absents, messagerie non responsive, pas de skeleton |
| Expérience utilisateur | 7/10 | Flows principaux bien traités (BienForm, réservation), faiblesses sur profil/messages |
| Patterns & réutilisabilité | 5/10 | Nombreuses duplications (formatFCFA, coverMap, StatutBadge, pagination) |
| Copywriting | 8/10 | Textes français de qualité, labels contextuels, bonne gestion des empty states |

**Priorité absolue :** corriger les pages auth (P1-A) et quittances/avis (P1-B) — elles sont les seules pages à donner une impression de produit inachevé ou incohérent.

---

## Fichiers audités

### Pages
- `app/(public)/page.tsx`, `app/(public)/layout.tsx`
- `app/(public)/biens/page.tsx`, `app/(public)/biens/[id]/page.tsx`
- `app/(public)/recherche/page.tsx`, `app/(public)/chat/page.tsx`
- `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/verify-otp/page.tsx`
- `app/(pro)/layout.tsx`, `app/(pro)/dashboard/page.tsx`
- `app/(pro)/mes-biens/page.tsx`, `app/(pro)/mes-biens/[id]/modifier/page.tsx`
- `app/(pro)/mes-biens/nouveau/page.tsx`, `app/(pro)/visites/page.tsx`
- `app/(pro)/quittances/page.tsx`, `app/(pro)/avis-recus/page.tsx`, `app/(pro)/profil/page.tsx`
- `app/(client)/layout.tsx`, `app/(client)/favoris/page.tsx`
- `app/(client)/reservations/page.tsx`, `app/(client)/reservations/nouvelle/page.tsx`
- `app/(client)/mes-visites/page.tsx`, `app/(client)/messages/page.tsx`

### Composants
- `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Badge.tsx`, `components/ui/Card.tsx`
- `components/bien/BienCard.tsx`, `components/bien/BienForm/index.tsx`
- `components/bien/BienForm/Step1Infos.tsx`, `components/bien/BienForm/Step5Medias.tsx`
- `components/layout/MobileMenu.tsx`, `components/auth/UserMenu.tsx`
- `components/landing/Hero.tsx`, `components/landing/FeaturedProperties.tsx`
- `components/landing/HowItWorks.tsx`, `components/landing/Features.tsx`, `components/landing/Stats.tsx`
- `components/dashboard/KPICard.tsx`
- `components/search/SearchFilters.tsx`

### Configuration
- `app/globals.css`, `tailwind.config.ts`
