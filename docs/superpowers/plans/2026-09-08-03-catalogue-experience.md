# Lot 3 — Catalogue et compréhension visuelle — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre de trouver et comprendre les annonces de toutes les sources, avec filtres simples, chiffres fiables et contact BOGBE’S identifiable.
**Architecture:** Adaptateurs par source derrière un DTO public commun ; séparation entre pagination, taxonomie, données privées et composants visuels.
**Tech Stack:** Next.js, TypeScript, Supabase/PostgREST, Tailwind, composants de recherche existants.
**Contrat:** [Spécification Astra — catalogue, classification et budgets](../specs/2026-09-08-amelioration-globale-astra.md).
**Dépendance:** Mesures lot 0, références/droits lot 1. Le lot 2 n’est pas requis pour les modifications publiques indépendantes.

## 3.1 — Taxonomie compréhensible et prix exacts

Créer `packages/shared/catalogue/taxonomy.ts`, `packages/shared/catalogue/public-listing.ts` et copies générées dans `apps/web/shared-pkg/catalogue/`.
Modifier `apps/web/lib/catalogue/consolidated.ts`, `apps/web/components/search/QuickFilters.tsx`, `SearchFilters.tsx`, `apps/web/components/bien/BienForm/Step2Prix.tsx`.
Créer `apps/web/tests/unit/catalogue-taxonomy.spec.ts`.

- [ ] Tests avant modification : studio, appartement meublé, résidence meublée, immeuble explicite, type inconnu, villa mal étiquetée, vente, location mensuelle/journalière, prix absent et périodicité inconnue.
- [ ] Implémenter la table familles/types du contrat et un filtre meublé indépendant. Conserver `rawType` et classification inconnue ; ne pas réécrire en masse les bases historiques.
- [ ] DTO public : `ref`, titre, famille/type, commune/quartier, transaction, prix/périodicité nullable, surfaces/pièces nullable, photos, descriptif expurgé, statut public, lien BOGBE’S. Aucune coordonnée originale ni source URL directe.
- [ ] Le suffixe `/mois` dépend d’une périodicité établie. Vente sans suffixe, prix inconnu « Prix à confirmer », location sans unité connue « Périodicité à confirmer ». Jamais de zéro inventé ou de prix de vente mappé comme loyer.
- [ ] Unifier les libellés FR/EN des filtres, cartes, fiches et formulaires. Les URL historiques type_bien restent prises en charge ; ajouter les familles via paramètres explicites et testés.
- [ ] Exécuter les tests unitaires et `node scripts/sync-shared-contracts.mjs --check` depuis la racine. Attendu : mêmes catégories et prix dans les trois adaptateurs et le contrat mobile.

Commit `feat(catalogue): clarifier les familles et la présentation des prix`.

## 3.2 — Comptages et pagination sans plafonds masqués

Scinder progressivement `apps/web/lib/catalogue/consolidated.ts` en `providers/bogbes.ts`, `providers/web.ts`, `providers/flash.ts`, `filters.ts`, `pagination.ts`, `counts.ts` sous `apps/web/lib/catalogue/` ; conserver ses exports comme façade compatible.
Modifier `apps/web/app/(public)/catalogue/page.tsx` ; créer `apps/web/tests/unit/catalogue-pagination.spec.ts` et `apps/web/tests/e2e/catalogue-sources.spec.ts`.

- [ ] Fixtures : plus de 1 500 annonces/source, dates identiques, prix NULL, duplications signalées, inactifs, dates expirées, trois sources flash, source en panne, paramètres invalides et zéro réel.
- [ ] Valider/borner paramètres avec Zod : page/cursor, prix, q et source. Échapper les opérateurs PostgREST de recherche ; requête malformée => message et filtres corrigibles, jamais `NaN` envoyé en base.
- [ ] Partager les mêmes prédicats SQL pour données et compteurs : disponibilité, publication, expiration, doublon signalé, type/famille, commune, transaction, prix, équipements et photos pour Annonces web. Quand une caractéristique filtrée est inconnue, elle ne satisfait pas ce filtre.
- [ ] Compter toutes les sources avec les filtres courants sauf source sélectionnée. Afficher `null/indisponible` si erreur, `0` seulement sur succès exact ; total incomplet explicitement signalé. Retirer les zéros forcés des onglets.
- [ ] Pagination par curseur versionné avec empreinte des filtres, heure initiale et position consommée par provider. Lire au plus `pageSize + 1` candidats/provider, fusionner par ordre total, puis avancer seulement les curseurs effectivement consommés. Aucun `.range(0, page*24)` ni chargement de 500/5 000 pour la première page.
- [ ] Ordre par défaut : annonces récentes, date NULL en dernier, puis clé source+ID stable. Si un tri prix existe, l’autoriser seulement avec transaction/périodicité comparables ; prix inconnus à la fin. Tout ordre global doit être reproductible dans chaque provider avant fusion.
- [ ] Éliminer les doublons explicitement marqués dans chaque source ; ne pas fusionner deux annonces entre sources sur une ressemblance de titre. Total nommé « annonces ». Les annonces réimportées gardent une identité différente sauf alias confirmé.
- [ ] Afficher Suivant/Précédent avec curseurs dans l’URL et historique navigateur. Accepter les anciennes URL `page=N` par redirection contrôlée/compatibilité explicitement testée ; aucun faux nombre de pages fondé sur un extrait en mémoire.
- [ ] Cache public conforme au contrat et clés incluant tous les filtres, source et langue. Invalidation après modification d’un bien principal ; actualisation périodique pour sources externes. En panne partielle, conserver les sources disponibles avec avertissement discret.
- [ ] Comparer compteurs aux requêtes SQL de référence et parcourir au-delà du 1 000e résultat dans les fixtures ; aucune omission/repetition pour jeu fixe. Refaire l’essai après ajout d’une annonce : refresh volontaire pour incorporer les nouveautés, pas promesse de snapshot transactionnel entre cinq bases.

Validation : tests unitaires pagination/filtres et E2E passage entre quatre onglets, filtres conservés, retour navigateur, source hors ligne. Commit `fix(catalogue): fiabiliser les totaux et la pagination multisource`.

## 3.3 — Navigation, recherche et filtres lisibles

Modifier `apps/web/app/(public)/layout.tsx`, `apps/web/components/layout/MobileMenu.tsx`, `apps/web/app/(public)/catalogue/page.tsx`, `apps/web/components/search/SearchBar.tsx`, `QuickFilters.tsx`, `MobileFiltersDrawer.tsx`.
Créer `apps/web/components/catalogue/CatalogueSourceNav.tsx` et `CatalogueResultSummary.tsx`.

- [ ] Afficher les quatre sources au-dessus des filtres secondaires, avec nom complet, sous-texte utile et compteur français. État actif par fond/bordure et texte, pas couleur seule. Biens BOGBE’S et Vérifiés restent distincts.
- [ ] Regrouper intention, famille, commune et budget ; filtres avancés dans un panneau nommé. Afficher critères actifs et Réinitialiser près des résultats. Sur mobile, panneau clavier accessible, focus restauré, bouton Appliquer et compteur.
- [ ] Réduire l’espace vide initial et la taille du compteur isolé ; rapprocher le compteur de la liste. Garder les premières annonces visibles sans traverser un écran entier de commandes sur téléphone.
- [ ] SearchBar : label accessible, suggestions clavier/flèches/Entrée/Escape, `aria-expanded` et état de chargement réel. Arrêter le texte animé lors de focus/reduced-motion/onglet masqué ; une suggestion ne remplace jamais le texte saisi.
- [ ] Naviguer directement vers catalogue et conserver source/filtres compatibles ; éviter `/recherche` puis redirection supplémentaire. Assurer recherche tapée, vocale et filtres manuels cohérents.
- [ ] Navigation publique desktop/mobile : Annonces visible, accès source web/agences en un clic depuis catalogue, connexion avec retour correct au bien. Conserver les anciennes URL en redirection permanente quand c’est équivalent.
- [ ] Revoir contraste, textes 16/14 px, cibles 44 px, focus, tabs/boutons selon leur rôle et affichage 320–1440 px. Ne pas ajouter une deuxième recherche géante dans le même écran.

Validation : E2E clavier + screenshots desktop/mobile clair/sombre, zoom 200 %, aucune troncature d’action principale. Commit `feat(ui): rendre la recherche et les sources plus lisibles`.

## 3.4 — Détail, contact et protection des originaux

Modifier `apps/web/app/(public)/annonce/[id]/page.tsx`, `apps/web/app/(public)/offre-flash/[id]/page.tsx`, `apps/web/app/(public)/biens/[id]/page.tsx`, `apps/web/lib/ai/tools.ts`.
Créer `apps/web/components/catalogue/AdvisorContact.tsx`, `PublicListingDescription.tsx`, `apps/web/lib/catalogue/public-description.ts`, `apps/web/tests/e2e/listing-contact-privacy.spec.ts`.

- [ ] Résoudre le paramètre `origine` des liens flash selon le contrat. Tester même ID dans deux bases et ancienne URL. Une origine invalide n’est pas utilisée pour construire un client/URL arbitraire.
- [ ] Utiliser DTO expurgé partout côté public, y compris contexte IA, HTML initial, JSON de route, meta/JSON-LD, cache et API mobile. Nettoyer HTML, téléphone, email et liens directs ; une description douteuse peut être remplacée par résumé public sûr, original réservé admin.
- [ ] Montrer aux admins connectés un panneau original distinct, chargé par endpoint/RPC protégé du lot 1 : descriptif intégral, contacts réellement présents, source et référence. Donnée absente => « Non renseigné », pas numéro inventé ni accès au prospect.
- [ ] Appliquer priorité/fallback photos du contrat, dimensions réservées, alt bref et image locale si toutes échouent. Tester Storage puis source ; conserver la configuration `unoptimized` là où le proxy échoue tant qu’une alternative n’est pas mesurée.
- [ ] Mettre prix/périodicité et faits utiles près du titre ; CTA « Échanger avec un conseiller » proche de la décision. Sur mobile réserver l’espace du CTA collant et retirer le doublon WhatsApp flottant sur ces fiches.
- [ ] Le clic passe par un lien BOGBE’S avec référence structurée et poursuit le canal conseiller existant. Enregistrer une demande seulement lorsqu’elle est soumise ; ne pas compter un clic ou ouverture WhatsApp comme contact réussi.
- [ ] Mettre à jour le texte chaleureux du contrat et garder l’explication de disponibilité. Aucune fausse urgence, faux compteur de visiteurs ou notification de contact simulée.
- [ ] Tester trois sources, admin A/B et visiteur : contacts originaux visibles uniquement aux admins ; message conseiller avec titre/référence/lien exact ; bien retiré et images cassées compréhensibles.

Validation : E2E confidentialité et redirection avec navigation externe interceptée, audits des DTO, build web et comparaison des mesures lot 0. Commit `feat(catalogue): améliorer les fiches et le contact conseiller`.

## Sortie du lot

- [ ] Compteurs correspondent aux données et aux filtres ; aucune confusion photos/annonces.
- [ ] Recherche, familles, sources et CTA compris sur téléphone et ordinateur ; descriptions originales restent protégées.
- [ ] Continuer le [lot 4](2026-09-08-04-mobile-livraison.md).
