# Annonces web description layout Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Présenter les descriptions des annonces web sous forme de résumé et de points clés lisibles, sans exposer hashtags, liens ou coordonnées.

**Architecture:** Extraire la logique de présentation dans un module TypeScript pur réutilisable et testable. La page d’annonce composera ensuite une section éditoriale responsive avec résumé, points clés et encart « À noter », tandis que le nettoyeur public supprimera réellement les données de contact.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 3, scripts Node natifs.

**Spec:** `docs/superpowers/specs/2026-09-10-annonces-web-description-layout-design.md`

---

## Chunk 1: Parsing public et tests déterministes

### Task 1: Extraire le parseur de description

**Files:**
- Create: `apps/web/lib/catalogue/description-presentation.ts`
- Modify: `apps/web/app/(public)/annonce/[id]/page.tsx:20-55`
- Modify: `apps/web/tsconfig.json:compilerOptions`

- [ ] **Step 1: Écrire le module pur avec les types et la fonction `presentDescription`**
  - Déplacer `DescriptionPresentation` et `presentDescription` hors de la page.
  - Importer `publicDescription` via `./public-description.ts` avec l'extension
    explicite requise par Node ESM strip-types.
  - Activer `allowImportingTsExtensions: true` dans `apps/web/tsconfig.json`
    afin que le type-check Next accepte cette extension.
  - Séparer les marqueurs de section (`composition`, `caractéristiques`, `équipements`, `détails`).
  - Découper aussi les séparateurs et retours à la ligne quand aucun marqueur n'est présent.
  - Déplacer les segments contenant `loyer`, `prix` ou `montant` vers `note`.
  - Ne jamais muter la valeur source.

- [ ] **Step 2: Remplacer la fonction locale de la page par l'import du module**
  - Supprimer le type et la fonction du fichier page.
  - Conserver l'appel `presentDescription(bien.description)` et le rendu existant comme point de départ.

### Task 2: Durcir le nettoyage public

**Files:**
- Modify: `apps/web/lib/catalogue/public-description.ts:1-16`

- [ ] **Step 1: Ajouter les règles de suppression**
  - Supprimer les hashtags en fin de texte et les hashtags isolés sans effacer les mots normaux.
  - Remplacer les liens, e-mails et numéros ivoiriens couverts par une chaîne vide.
  - Préserver les séparateurs utiles et les retours à la ligne jusqu'au parsing.
  - Laisser la valeur en base inchangée.

### Task 3: Ajouter le test reproductible

**Files:**
- Create: `apps/web/scripts/test-description-presentation.mjs`
- Modify: `apps/web/package.json:scripts,engines`

- [ ] **Step 1: Écrire le script Node de test**
  - Importer `description-presentation.ts` et `public-description.ts` avec les imports relatifs définis dans la spécification.
  - Tester hashtags, séparateurs sans marqueur, retours à la ligne, prix/loyer dans `note`, formats `+225`/`00225`/`07`/`05`/`01`, absence de placeholders et conservation de l'entrée originale.
  - Utiliser uniquement `node:assert/strict`.

- [ ] **Step 2: Ajouter la commande et la version Node minimale**
  - Ajouter `"test:description": "node --experimental-strip-types scripts/test-description-presentation.mjs"`.
  - Ajouter `"engines": { "node": ">=22.6.0" }` dans `apps/web/package.json`.

- [ ] **Step 3: Exécuter le test avant le rendu**
  - Run: `npm.cmd run test:description --workspace @immo-ci/web`
  - Expected: PASS avec tous les cas de parsing.

## Chunk 2: Nouvelle mise en page responsive

### Task 4: Restructurer la section « À propos de ce bien »

**Files:**
- Modify: `apps/web/app/(public)/annonce/[id]/page.tsx:206-239`

- [ ] **Step 1: Créer la hiérarchie visuelle**
  - Garder le titre `h2` et l'icône décorative avec `aria-hidden`.
  - Présenter le résumé avec `max-w-[65ch]`, 15–16 px et une interligne confortable.
  - Présenter les points clés dans une liste `ul` sémantique.
  - Utiliser une seule colonne jusqu'à `lg`, puis deux colonnes à partir de `lg:grid-cols-2`.
  - Afficher « À noter » seulement quand `note` existe.
  - Ne pas répéter le prix, la surface ou le nombre de pièces déjà visibles au-dessus.

- [ ] **Step 2: Garantir la lisibilité mobile**
  - Éviter toute largeur fixe et tout débordement horizontal.
  - Garder les espacements et tailles de texte prévus à 390 px et 768 px.
  - Vérifier que les longs mots et valeurs utilisent `break-words`.

- [ ] **Step 3: Vérifier les états**
  - Description vide : ne pas rendre la section.
  - Description non découpable : rendre un paragraphe unique limité en largeur.
  - Description avec prix/loyer : afficher l'information une seule fois dans « À noter ».

## Chunk 3: Vérification et livraison

### Task 5: Vérifier le code et le rendu

**Files:**
- Test: `apps/web/scripts/test-description-presentation.mjs`
- Test: `apps/web/app/(public)/annonce/[id]/page.tsx`

- [ ] **Step 1: Vérifier le type-check**
  - Run: `npm.cmd run type-check --workspace @immo-ci/web`
  - Expected: PASS sans erreur TypeScript.

- [ ] **Step 2: Vérifier le lint ciblé**
  - Run: `npm.cmd run lint --workspace @immo-ci/web`
  - Expected: aucune nouvelle erreur sur les fichiers modifiés.

- [ ] **Step 3: Vérifier le build Next et la route**
  - Run: `npm.cmd run build --workspace @immo-ci/web`
  - Expected: build Next terminé sans erreur.
  - Après le build, lancer l'application avec `npm.cmd run start --workspace @immo-ci/web`
    et vérifier qu'une route `/annonce/[id]` réelle répond en HTTP 200.

- [ ] **Step 4: Vérifier les routes et les largeurs**
  - Ouvrir une annonce web réelle à 390 px, 768 px et 1440 px.
  - Contrôler le contraste, la hiérarchie h2/ul, les icônes `aria-hidden`, la navigation clavier et l'absence de scroll horizontal.
  - Vérifier que les coordonnées, URLs, placeholders techniques et hashtags ne sont jamais visibles publiquement.

- [ ] **Step 5: Committer uniquement le périmètre**
  - PowerShell : `git add -- 'apps/web/lib/catalogue/description-presentation.ts' 'apps/web/lib/catalogue/public-description.ts' 'apps/web/app/(public)/annonce/[id]/page.tsx' 'apps/web/scripts/test-description-presentation.mjs' 'apps/web/package.json' 'apps/web/tsconfig.json'`
  - `git commit -m "feat: improve web listing description readability"`
