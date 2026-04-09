# UI REVIEW — Immo CI

**Date :** 2026-04-09
**Périmètre :** `apps/web/app/` + `apps/web/components/`
**Stack :** Next.js 14 App Router, Tailwind CSS, Tremor (dashboard)
**Baseline :** Standards abstraits 6 piliers (pas de UI-SPEC.md)
**Screenshots :** Capturés (serveur dev sur localhost:3000)
**Captures :** `desktop-home`, `desktop-biens`, `desktop-login`, `mobile-home`, `desktop-recherche`, `mobile-recherche`

---

## Scores

| Pilier | Score | Résumé |
|--------|-------|--------|
| 1. Copywriting | 3/4 | Excellent en français sur les pages core, mais 3 pages ont des textes sans accents critiques |
| 2. Visuels | 2/4 | BienCard soignée, mais absence totale de skeletons et incohérence FeaturedProperties vs BienCard |
| 3. Couleur | 2/4 | Token system solide, mais 8+ fichiers hors système — pages auth, quittances, avis utilisent gray/red/green bruts |
| 4. Typographie | 3/4 | Hiérarchie display/sans/mono bien pensée, violations localisées dans pages secondaires |
| 5. Espacement | 3/4 | Cohérent sur les pages principales, inconsistances mineures dans la fiche bien |
| 6. Expérience Design | 2/4 | Flows principaux complets, mais filtres mobiles absents, aucun skeleton/error, profil non éditable |
| **TOTAL** | **15/24** | |

---

## 1. Copywriting (3/4)

### Forces

**Langue française de qualité sur les pages core.**
Les labels, messages d'erreur et textes d'interface sont en français professionnel avec des formulations contextuelles :
- `app/(pro)/visites/page.tsx:61` — "Demandeur:" suivi du nom, format clair
- `app/(client)/mes-visites/page.tsx:43` — "Vous n'avez pas encore demandé de visite." — phrase complète, ton naturel
- `app/(public)/biens/page.tsx:113` — "Essayez un autre type de bien ou supprimez les filtres." — actionnable
- `app/(client)/reservations/page.tsx:12` — Labels de statut différenciés : "En attente de paiement" (plus précis que "En attente")
- `app/(public)/biens/[id]/page.tsx:344` — "Aucun frais avant confirmation · Annulation gratuite" — réassurance efficace

**CTAs orientés action.**
- Hero : "Rechercher" (direct), boutons de type "Appartements", "Villas" (labels précis, pas "Voir plus")
- `mes-biens/page.tsx:63` — "Créer ma première annonce" (contextualisé, pas générique "Créer")
- `app/(client)/mes-visites/page.tsx:46` — "Rechercher un bien" (lien direct, actionnable)

**Statuts badge cohérents.**
Les configs `STATUT_CONFIG` dans reservations, visites, quittances utilisent des labels français cohérents et sémantiquement différenciés (warning/success/danger/default).

### Problèmes

**P1 — Textes sans accents sur les pages de paiement (3 occurrences).**
`app/(client)/reservations/[id]/page.tsx:39` — "Detail de la reservation" (devrait être "Détail de la réservation")
`app/(client)/reservations/[id]/page.tsx:10` — "Confirmee", "Annulee", "Terminee" dans `STATUT_LABELS` — accents manquants sur les valeurs d'affichage
`app/(client)/paiement/retour/page.tsx:18-41` — "Paiement confirme !", "Votre reservation est confirmee", "La transaction a ete annulee", "Retour a l'accueil" — 4 textes sans accents sur la page de confirmation de paiement (page à fort impact émotionnel)
`app/(client)/paiement/retour/page.tsx:74` — "Telecharger le contrat PDF" dans reservations/[id]/page.tsx:72

**P2 — Empty state sans action sur la page visites pro.**
`app/(pro)/visites/page.tsx:39` — "Aucune demande de visite." — texte seul, pas de lien vers /biens pour promouvoir les annonces ou explication de comment recevoir des demandes. Toutes les autres pages listing offrent une action.

**P3 — "Se connecter avec mon Téléphone (OTP)" — capitalisation incohérente.**
`app/(auth)/login/page.tsx:179` — "Téléphone" capitalisé au milieu d'une phrase. Devrait être "Se connecter par téléphone (OTP)".

**P4 — Titre de section "Connexion par Téléphone" dans verify-otp.**
`app/(auth)/verify-otp/page.tsx:83` — "Connexion par Téléphone" — même problème de majuscule inappropriée.

---

## 2. Visuels (2/4)

### Forces

**BienCard visuellement soignée** (`components/bien/BienCard.tsx`).
- Photo `aspect-[4/3]` avec `Next/Image`, hover `scale-105`, gradient overlay `from-black/40`
- Prix superposé en `font-mono` avec `backdrop-blur-sm` — identifiant fort
- Badge type coloré par catégorie via `TYPE_COLORS`, icône SVG inline de localisation
- Fallback propre : icône maison SVG + "Aucune photo" en cas d'absence de photo (ligne 66-69)
- Screenshot `/biens` : grille 4 colonnes propre, cards bien proportionnées

**Hero landing impactant** (screenshot `desktop-home`).
Section plein écran bleue avec gradient, titre en Playfair Display, `text-secondary` (orange CI) sur le mot-clé. Hiérarchie visuelle forte.

**Fiche bien** : Carousel médias, compteurs photo/vidéo/360, carte Leaflet, panneau sticky desktop — stack visuelle complète.

**Carousel et map chargés dynamiquement** (SSR:false implicite) — pas de flash côté serveur.

### Problèmes

**P1 — Absence totale de skeleton/loader dans toute l'application.**
Aucun `loading.tsx` dans `app/(pro)/`, `app/(client)/`, `app/(public)/`. Aucun composant `Skeleton` n'existe dans `components/`. Sur connexion 3G (majoritaire en CI), les pages Supabase peuvent prendre 2-4 secondes avec une page blanche ou un spinner browser. Le `Button` a un `loading` prop mais les pages elles-mêmes n'ont aucun intermédiaire visuel.

**P2 — Divergence visuelle BienCard vs FeaturedProperties.**
`components/bien/BienCard.tsx` et `components/landing/FeaturedProperties.tsx` affichent la même entité "bien" de façon différente :
- Prix : superposé sur la photo (BienCard) vs. au-dessus du titre dans la zone texte (FeaturedProperties)
- Titre : `font-sans font-semibold` (BienCard) vs. `font-display font-semibold` (FeaturedProperties)
- Badge type : span inline avec `TYPE_COLORS` (BienCard) vs. composant `<Badge variant="default">` (FeaturedProperties)
- Hover : `scale-105` + `shadow-lg` (BienCard) vs. `shadow-lg` seul (FeaturedProperties)
Sur la page d'accueil, les cards de la section "Dernières annonces" ont un aspect différent des cards de `/biens`, créant une incohérence d'identité.

**P3 — Icônes mélangées emoji + SVG.**
Dans `app/(public)/biens/[id]/page.tsx`, la liste d'équipements utilise des emojis (`EQUIPEMENTS_ICONS`, ligne 15-20 : ❄️, 📶, 🅿️, etc.) tandis que `BienCard.tsx` utilise des SVGs inline pour surface/pièces. La fiche bien utilise 📍 emoji pour la localisation (ligne 133) mais `BienCard` utilise un SVG pin. Les emojis varient selon l'OS/navigateur ; les SVGs sont cohérents. Le mélange dans la même interface est à éviter.

**P4 — Avatar propriétaire avec `<img>` non optimisé.**
`app/(public)/biens/[id]/page.tsx:226-228` — `<img src={proprio.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />` avec `eslint-disable @next/next/no-img-element`. Pas de lazy loading, pas de format WebP/AVIF. Les domaines Cloudinary et Supabase sont déjà configurés dans `next.config.ts`.

**P5 — Page login visuellement décontextualisée** (screenshot `desktop-login`).
La page de connexion affiche un fond `bg-gray-50` sans header Immo CI, sans lien de retour à l'accueil visible, sans aucun élément graphique de la marque (pas d'image de bien, pas de visuel). Visible sur screenshot : fond gris plat, formulaire centré seul. L'utilisateur n'a aucun repère visuel de la marque sauf le titre "Immo CI" en texte.

---

## 3. Couleur (2/4)

### Forces

**Token system bien défini dans `globals.css`.**
14 tokens CSS (`--primary`, `--secondary`, `--accent`, `--danger`, `--warning`, `--surface`, etc.) mirrés dans `tailwind.config.ts`. Usage correct sur les pages core : `bg-primary`, `bg-surface`, `text-muted`, `border-[var(--border)]`.

**Sémantique des couleurs respectée sur les pages principales.**
- Badges : `variant="success"` (vert accent), `variant="danger"` (rouge danger), `variant="warning"` (orange warning)
- Hero : `bg-primary` dominant, `text-secondary` (orange) pour le mot-clé — respect du 60/30/10
- BienCard : prix en `text-primary`, titre en `text-[var(--text)]`, localisation en `text-muted`

### Problèmes

**P1 — Pages auth entièrement hors système.**
3 fichiers (`login/page.tsx`, `register/page.tsx`, `verify-otp/page.tsx`) n'utilisent aucun token :

| Classe utilisée | Devrait être |
|-----------------|-------------|
| `bg-gray-50` (fond page) | `bg-surface` |
| `text-gray-700/800/900` (labels, titres) | `text-[var(--text)]` |
| `border-gray-300` (inputs) | `border-[var(--border)]` |
| `bg-[#1A5276]` (bouton submit) | `bg-primary` |
| `bg-[#154360]` (hover bouton) | `hover:bg-primary/90` |
| `bg-[#E67E22]` (bouton register) | `bg-secondary` |
| `bg-red-50 text-red-700` (alerte erreur) | `bg-danger-light text-danger` |
| `has-[:checked]:bg-blue-50` (radio sélectionné) | `has-[:checked]:bg-primary-light` |
| `text-green-600` (succès) | `text-accent` |

`login/page.tsx:66` — `bg-gray-50`
`login/page.tsx:86` — `bg-red-50 border-red-200 text-red-700`
`login/page.tsx:140` — `focus:ring-[#1A5276]` (hardcodé)
`login/page.tsx:168` — `bg-[#1A5276] hover:bg-[#154360]`
`register/page.tsx:174` — `has-[:checked]:bg-blue-50`
`register/page.tsx:207` — `bg-[#E67E22] hover:bg-[#ca6f1e]`

**P2 — Pages quittances et avis-recus hors système.**
`app/(pro)/quittances/page.tsx` :
- Ligne 75 : `text-gray-900` (titre page) — devrait être `text-[var(--text)]` + `font-display`
- Ligne 76 : `text-gray-500` — devrait être `text-muted`
- Ligne 85 : `text-yellow-600` — devrait être `text-warning`
- Ligne 89 : `text-red-600` — devrait être `text-danger`
- Ligne 93 : `text-green-600` — devrait être `text-accent`
- Lignes 84,88,92 : `border-yellow-400`, `border-red-500`, `border-green-500` — tokens manquants

`app/(pro)/avis-recus/page.tsx` :
- Ligne 70 : `text-gray-900 font-bold` — devrait être `text-[var(--text)] font-display`
- Ligne 75 : `text-gray-800`
- Ligne 110 : `text-orange-600 bg-orange-50` — devrait être `text-secondary bg-secondary-light`

`app/(client)/mes-avis/page.tsx` :
- Ligne 67 : `text-gray-900 font-bold` — même pattern

**P3 — Testimonials utilise gray brut.**
`components/landing/Testimonials.tsx:64` — `text-gray-700` (corps du témoignage), `text-gray-800` (nom), `border-gray-100` (séparateur). Composant de la landing visible par tous les visiteurs.

**P4 — TYPE_COLORS dans BienCard utilise des couleurs Tailwind brutes.**
`components/bien/BienCard.tsx:24-33` — `bg-purple-100 text-purple-700` (villa), `bg-cyan-100 text-cyan-700` (studio), `bg-orange-100 text-orange-700` (maison), etc. Ces couleurs ne sont pas dans le token system. Solution : soit les ajouter au token system, soit utiliser des classes Tailwind cohérentes avec la palette (ex. utiliser `primary-light` pour appartement).

**Bilan :** 8 fichiers sur ~30 audités utilisent des classes gray/red/green/amber Tailwind brutes au lieu des tokens.

---

## 4. Typographie (3/4)

### Forces

**Système 3 familles bien articulé.**
- `font-display` (Playfair Display) : titres H1/H2 sur toutes les pages pro et client principales
- `font-sans` (DM Sans) : corps, labels, nav — utilisé rigoureusement
- `font-mono` (JetBrains Mono) : prix FCFA, métriques — bien différencié visuellement

**Hiérarchie correcte sur les pages core.**
`app/(client)/reservations/page.tsx:36` — `font-display text-3xl` (H1 page), `font-sans font-semibold` (titre bien), `text-muted font-sans` (localisation) — hiérarchie 3 niveaux propre.
`app/(pro)/visites/page.tsx:37` — `font-display text-3xl` cohérent.
`app/(public)/biens/[id]/page.tsx:131` — `font-display text-2xl md:text-3xl` responsive correct.

**Prix en mono correctement isolés.**
`components/bien/BienCard.tsx:95` — `font-mono text-sm font-bold text-primary`
`app/(client)/reservations/page.tsx:80` — `font-mono font-semibold text-primary`

### Problèmes

**P1 — Pages hors système : titres sans font-display.**
- `app/(pro)/quittances/page.tsx:75` — `text-2xl font-bold text-gray-900` — devrait être `font-display text-3xl text-[var(--text)]`
- `app/(pro)/avis-recus/page.tsx:70` — `text-2xl font-bold text-gray-900` — idem
- `app/(client)/mes-avis/page.tsx:67` — `text-2xl font-bold text-gray-900` — idem
- `app/(auth)/login/page.tsx:73` — `text-2xl font-semibold text-gray-800` — sous-titre hors système
- `app/(auth)/register/page.tsx:74,98` — même pattern

**P2 — Divergence BienCard vs FeaturedProperties sur le titre H3.**
- `components/bien/BienCard.tsx:106` — `font-sans font-semibold text-[var(--text)] text-sm`
- `components/landing/FeaturedProperties.tsx:112` — `font-display text-base font-semibold text-[var(--text)]`
La même entité (titre de bien) est rendue en deux familles typographiques différentes selon le contexte d'affichage. La cohérence sémantique exige un choix unique.

**P3 — `font-mono` absent pour les montants dans quittances.**
`app/(pro)/quittances/page.tsx:146` — `font-bold text-gray-900` pour le montant total (ex. "250 000 FCFA"). Devrait être `font-mono text-[var(--text)]` selon la convention numérique du projet.

**P4 — Poids de police incohérents dans les stats quittances.**
`app/(pro)/quittances/page.tsx:81,85,89,93` — `text-2xl font-bold` sans `font-mono` pour des valeurs numériques (compteurs). Ces chiffres devraient utiliser `font-mono`.

---

## 5. Espacement (3/4)

### Forces

**Rythme de base cohérent sur les pages listing.**
Pattern commun bien appliqué : `bg-surface min-h-screen py-8` wrapper externe, `max-w-*xl mx-auto px-4` conteneur, `space-y-4` liste, `p-5` par card. Visible dans `visites/page.tsx`, `mes-visites/page.tsx`, `reservations/page.tsx`.

**Grilles cohérentes.**
`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5` — pattern répété de façon identique dans `/biens`, `/mes-biens`, `/favoris`. Gap uniforme à `gap-5`.

**Sections fiche bien espacées.**
`app/(public)/biens/[id]/page.tsx` — sections description, équipements, localisation toutes en `p-5 mb-4` — cohérence interne bonne.

### Problèmes

**P1 — Pages hors-wrapper : absence de `bg-surface min-h-screen`.**
- `app/(pro)/quittances/page.tsx:74` — wrapper `max-w-5xl mx-auto px-4 py-8` sans `bg-surface min-h-screen`. Le fond reste blanc (couleur de la card du layout) plutôt que gris surface — visuellement différent des autres pages pro.
- `app/(pro)/avis-recus/page.tsx:69` — `max-w-3xl mx-auto px-4 py-8` — même problème.
- `app/(client)/mes-avis/page.tsx:66` — idem.

**P2 — Padding inconsistant dans les stats cards de la fiche bien.**
`app/(public)/biens/[id]/page.tsx` :
- Stats rapides (surface, pièces, chambres) : `p-3` (ligne 149)
- Sections description, équipements : `p-5` (lignes 185, 193)
- Card propriétaire : `p-4` (ligne 223)
Trois valeurs de padding (`p-3`, `p-4`, `p-5`) coexistent sur la même page pour des blocs structurellement similaires (cards blanches `rounded-card border`).

**P3 — Dashboard : grille KPI sans breakpoint `md`.**
`app/(pro)/dashboard/page.tsx` — `grid-cols-2 lg:grid-cols-4` pour les 4 KPI cards. Sur tablette portrait (768-1023px), 2 colonnes pour 4 métriques crée des cards très larges. Il manque `md:grid-cols-2` (déjà là) mais sans `md:grid-cols-4` à 768px.

**P4 — Messages page : layout non responsive.**
`app/(client)/messages/page.tsx:28` — `aside className="w-72 flex-shrink-0"` fixe sans aucun breakpoint. Sur mobile, la sidebar `w-72` et le thread s'affichent côte à côte dans un `h-screen flex`, rendant l'interface inutilisable sur petit écran (la sidebar prend 72/375 = 19% de la largeur, le thread est cramped).

---

## 6. Expérience Design (2/4)

### Forces

**Flow principal découverte → contact → réservation complet.**
`/biens` → `BienCard` → `/biens/[id]` → `VisiteRequestForm` ou CTA réservation → `/reservations/nouvelle`. Le flow est end-to-end sans interruption pour les visiteurs desktop.

**Panneau sticky desktop bien conçu** (`app/(public)/biens/[id]/page.tsx:272-350`).
Prix, favoris, contact propriétaire, CTA principal — tout dans un panneau `sticky top-6` de 384px. Suit le pattern standard des portails immobiliers.

**Gestion des états vides avec action.**
La majorité des pages listing proposent un empty state actionnable :
- `/mes-biens` : "Créer ma première annonce"
- `/favoris` : "Parcourir les annonces →"
- `/reservations`, `/mes-visites` : "Rechercher un bien" (bouton primary)

**Formulaire multi-étapes BienForm bien structuré.**
Barre de progression visible, validation step-by-step, Step5 médias avec drag-and-drop.

**Page retour paiement existante.**
`app/(client)/paiement/retour/page.tsx` — gère succès et échec avec messages distincts, lien retour accueil. Corrige l'issue CONCERNS.md sur la 404 post-paiement.

**Actions mutatives avec état loading.**
`Button` avec `loading={true}` câblé dans `ToggleStatutButton`, `FavorisButton` (selon code vu).

### Problèmes

**P1 — Absence totale de `loading.tsx` et `error.tsx` dans tous les route groups.**
Confirmé par `find app -name "loading.tsx" -o -name "error.tsx"` : aucun résultat. Toutes les pages serveur bloquent la navigation jusqu'au retour Supabase. Sur connexion 3G (courant en CI), le dashboard avec 7 fetch parallèles peut bloquer 3-5 secondes. Aucun skeleton, aucune page d'erreur personnalisée en cas d'échec Supabase.

**P2 — Filtres de recherche complètement inaccessibles sur mobile.**
`app/(public)/recherche/page.tsx:104` — `<aside className="hidden lg:block w-64 flex-shrink-0">`. Sur mobile (screenshot `mobile-recherche` confirmé visuellement), la sidebar de filtres (commune, type, prix, équipements) est totalement absente. Il n'y a aucun bouton "Filtres", aucun drawer, aucune modal. Les utilisateurs mobiles ne peuvent pas filtrer les annonces par commune ou prix — perte d'une fonctionnalité centrale.

**P3 — Messagerie non fonctionnelle sur mobile.**
`app/(client)/messages/page.tsx:27` — layout `h-screen flex` avec sidebar `w-72` fixe sans breakpoint mobile. Sur mobile, l'interface affiche deux colonnes côte à côte, chacune trop étroite pour être utilisable. Pas de pattern "liste → thread" pour mobile.

**P4 — Profil non éditable.**
`app/(pro)/profil/page.tsx` — tous les champs (nom complet, email, téléphone) affichés en `<p>` lecture seule. Aucun bouton "Modifier", aucun formulaire d'édition. Les utilisateurs ne peuvent pas corriger une erreur de saisie à l'inscription.

**P5 — Empty state sans action sur la page visites pro.**
`app/(pro)/visites/page.tsx:39` — "Aucune demande de visite." texte seul. Aucune suggestion de comment recevoir des demandes (ex: lien vers /mes-biens pour vérifier que les annonces sont publiées).

**P6 — Actions mobile visiteur (fiche bien) hors viewport.**
`app/(public)/biens/[id]/page.tsx:241-248` — le bloc `MobileActions` est injecté sous le contenu principal (après propriétaire, localisation, équipements, description). Sur une fiche bien avec beaucoup de contenu, les CTAs (Réserver, Contacter) sont très loin en bas de page. Un sticky bar mobile en bas de viewport avec prix + CTA serait le standard du secteur.

**P7 — Aucune boundary d'erreur.**
0 fichier `error.tsx` dans l'application. Un échec Supabase (timeout, quota dépassé) affiche la page d'erreur Next.js générique avec stack trace. Impact utilisateur maximal sur les pages de réservation.

**P8 — Page réservation [id] : params non-awaité.**
`app/(client)/reservations/[id]/page.tsx:13` — `params: { id: string }` sans `Promise<>`. Dans Next.js 15, les params sont des Promises. Cette page risque de planter sur la version Next.js cible.

---

## Top 10 Fixes (par priorité)

1. **[P1] Ajouter les filtres mobiles sur `/recherche`** — Les utilisateurs mobiles (majoritaires en CI) ne peuvent pas filtrer par commune, type, prix — `app/(public)/recherche/page.tsx:104` — Ajouter un bouton "Filtres (N)" en mobile qui ouvre un drawer/bottom sheet contenant `<SearchFilters />`.

2. **[P1] Corriger les textes sans accents sur les pages paiement** — Pages critiques à fort impact émotionnel avec fautes visibles — `app/(client)/paiement/retour/page.tsx:18,20,41` et `app/(client)/reservations/[id]/page.tsx:39,72` — Remplacer "confirme", "reservee", "genere", "Telecharger", "Retour a" par leurs formes accentuées correctes.

3. **[P1] Refactoriser les pages auth dans le design system** — Rupture visuelle totale avec le reste de l'application (fond gris ≠ `bg-surface`, inputs non stylisés, couleurs hardcodées) — `app/(auth)/login/page.tsx`, `register/page.tsx`, `verify-otp/page.tsx` — Remplacer les classes `bg-gray-*`, `text-gray-*`, `bg-[#1A5276]`, `bg-[#E67E22]` par les tokens du système. Ajouter un `(auth)/layout.tsx` avec un header minimal contenant le logo + lien `/`.

4. **[P1] Ajouter `loading.tsx` dans les route groups** — Page blanche pendant 2-4s sur connexion 3G — Créer `app/(pro)/loading.tsx`, `app/(client)/loading.tsx`, `app/(public)/loading.tsx` avec des skeletons adaptés. Exemple minimum : `<div className="animate-pulse bg-surface h-screen" />`.

5. **[P2] Corriger les couleurs hors-système dans quittances et avis** — Incohérence visuelle dans l'espace pro — `app/(pro)/quittances/page.tsx:75,85,89,93` et `app/(pro)/avis-recus/page.tsx:70,110` — Remplacer `text-gray-*` par `text-[var(--text)]`/`text-muted`, `text-yellow-600` par `text-warning`, `text-red-600` par `text-danger`, `text-green-600` par `text-accent`. Ajouter `font-display` sur les titres H1.

6. **[P2] Adapter la messagerie au mobile** — Interface inutilisable sur mobile — `app/(client)/messages/page.tsx:27-28` — Implémenter un pattern mobile-first : `hidden lg:flex` sur la sidebar desktop, afficher la `ConversationList` seule sur mobile avec `searchParams.conv` pour naviguer vers le thread.

7. **[P2] Rendre la page profil éditable** — Utilisateurs bloqués en cas d'erreur de saisie à l'inscription — `app/(pro)/profil/page.tsx` — Transformer les `<p>` en formulaire avec `Input` composant + bouton "Enregistrer" utilisant une Server Action.

8. **[P2] Ajouter `error.tsx` dans les route groups critiques** — Erreurs Supabase affichent une page d'erreur générique — Créer `app/(pro)/error.tsx`, `app/(client)/error.tsx` minimums avec message "Une erreur est survenue" + lien retour.

9. **[P3] Unifier BienCard et FeaturedProperties** — Même entité "bien" rendue différemment — `components/landing/FeaturedProperties.tsx:112` — Remplacer l'implémentation inline par `<BienCard />`. La seule différence (prix au-dessus vs. superposé) peut se gérer avec une prop `pricePosition?: 'overlay' | 'above'`.

10. **[P3] Ajouter sticky CTA mobile sur la fiche bien** — Actions "Réserver" et "Contacter" hors viewport sur mobile — `app/(public)/biens/[id]/page.tsx:241` — Déplacer `MobileActions` dans une barre fixe `fixed bottom-0 left-0 right-0` avec `z-50`, fond blanc, prix + bouton CTA principal. Masquer avec `lg:hidden`.

---

## Fichiers audités

### Pages
- `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`, `app/(auth)/verify-otp/page.tsx`
- `app/(public)/page.tsx`, `app/(public)/biens/page.tsx`, `app/(public)/biens/[id]/page.tsx`
- `app/(public)/recherche/page.tsx`
- `app/(pro)/dashboard/page.tsx`, `app/(pro)/mes-biens/page.tsx`
- `app/(pro)/visites/page.tsx`, `app/(pro)/quittances/page.tsx`
- `app/(pro)/avis-recus/page.tsx`, `app/(pro)/profil/page.tsx`
- `app/(client)/messages/page.tsx`, `app/(client)/reservations/page.tsx`
- `app/(client)/reservations/[id]/page.tsx`, `app/(client)/mes-visites/page.tsx`
- `app/(client)/mes-avis/page.tsx`, `app/(client)/paiement/retour/page.tsx`

### Composants
- `components/ui/Button.tsx`
- `components/bien/BienCard.tsx`
- `components/landing/Hero.tsx`, `components/landing/FeaturedProperties.tsx`
- `components/landing/Testimonials.tsx`
- `components/search/SearchFilters.tsx`

### Configuration
- `app/globals.css`

### Screenshots capturés
- `desktop-home.png` — Page d'accueil, viewport 1440x900
- `desktop-biens.png` — Liste des biens, viewport 1440x900
- `desktop-login.png` — Page de connexion, viewport 1440x900
- `desktop-recherche.png` — Page recherche avec filtres, viewport 1440x900
- `mobile-home.png` — Page d'accueil, viewport 375x812
- `mobile-recherche.png` — Page recherche sans filtres, viewport 375x812

---

## UI REVIEW COMPLETE
