# Conception — amélioration globale de BOGBE’S

## Objectif

Rendre le site public, la console commerciale et l’application mobile plus fluides, compréhensibles et fiables, sans réécrire le produit ni perdre les parcours existants. Le résultat attendu est un parcours mesurable de la recherche d’un bien jusqu’au contact conseiller, puis un suivi commercial complet jusqu’à la réservation ou la perte.

## Contexte constaté

- Le catalogue public agrège trois sources : biens BOGBE’S, offres flash et annonces web issues de la base de scraping avec photos.
- Le CRM dispose déjà d’un pipeline, d’un historique, d’une page Performance, d’une revue des doublons et d’un contrôle Qualité.
- Le mobile consomme les annonces web via l’API du site et doit rester aligné avec la nouvelle base Supabase.
- Le dépôt est un monorepo Next.js/Expo avec Supabase et Vercel.
- Les déploiements doivent utiliser le projet Vercel rapatrié et les variables des deux bases Supabase.

## Approche retenue

Amélioration progressive par tranches verticales : chaque tranche couvre interface, données, erreurs et validation de son parcours. Les changements restent ciblés et réversibles. Les corrections de fond passent avant les effets visuels ; la typographie, les espacements et les micro-interactions sont harmonisés après stabilisation fonctionnelle.

## Périmètre fonctionnel

### Socle commun

- Centraliser les états de chargement, vide, erreur, succès et accès refusé.
- Vérifier les variables d’environnement au démarrage et éviter tout secret côté client.
- Uniformiser les URLs publiques sur `bogbesgroup.com`.
- Ajouter des limites, une pagination et des réponses cacheables aux lectures volumineuses.
- Conserver un journal horodaté pour toute action CRM sensible.

### Site public

- Recherche et filtres lisibles sur mobile et desktop, avec source clairement identifiée.
- Cartes et listes avec images dimensionnées, texte tronqué proprement et états sans photo honnêtes.
- Fiche bien avec référence, source, commune, prix, description et appel à un conseiller.
- Aucun contact direct propriétaire pour un prospect ; le CTA ouvre une demande conseiller avec le bien et sa référence.
- Parcours de retour explicite et conservation des paramètres de recherche.

### Console commerciale

- Un pipeline commun : Nouveau, Contacté, Visite planifiée, Visite réalisée, Relance, Gagné, Perdu.
- Chaque fiche doit afficher conseiller, prochaine action, échéance, bien, source et historique.
- Compte rendu de visite obligatoire après une visite passée.
- Motif obligatoire pour une perte ou un refus.
- Revue des doublons par téléphone normalisé, fusion manuelle confirmée et conservation de la fiche secondaire pour audit.
- Vue Qualité pour les téléphones, noms, communes, types de bien et assignations manquants.
- Performance par période, conseiller, commune, source et type de bien, avec délais entre étapes.
- File d’action immédiate pour les demandes en attente, relances en retard, visites sans compte rendu, prospects non assignés et refus sans motif.

### Application mobile

- Même source d’annonces web et mêmes références que le site.
- Pagination serveur au lieu de charger une liste illimitée.
- Recherche temporisée et annulation des requêtes obsolètes.
- Cache des images et états explicites pour chargement, erreur, absence de réseau et liste vide.
- Fiche mobile avec redirection conseiller et données publiques seulement.

## Architecture et données

Le site reste la façade publique et le serveur Next.js reste le seul intermédiaire pour les données nécessitant une clé de service. La base principale Supabase conserve les comptes, biens, contacts, visites, réservations et événements CRM. La base de scraping fournit les annonces web et leurs photos via une vue publique contrôlée. Les entités de contact, visite et réservation portent `prospect_id`, la référence du bien et la source lorsque disponible.

Les écritures de fusion sont atomiques autant que possible : rattacher les événements au prospect principal, marquer la fiche secondaire comme doublon archivé, puis journaliser l’opération. Aucun prospect n’est supprimé automatiquement. Les correspondances ambiguës restent à valider manuellement.

## UX et design

- Hiérarchie de lecture : action attendue, statut, échéance, détails.
- Un seul accent principal par contexte ; les couleurs expriment un état et gardent un contraste AA.
- Boutons tactiles d’au moins 44 px sur mobile et focus visible au clavier.
- Grilles fluides, aucun débordement horizontal involontaire, textes avec `text-wrap: balance` ou `pretty` lorsque pertinent.
- Animations limitées à l’opacité et aux transformations, désactivées ou réduites avec `prefers-reduced-motion`.
- Les tableaux et cartes privilégient la décision rapide : moins de décor, plus de contexte utile.

## Gestion des erreurs et cas limites

- API indisponible : message court, action Réessayer, conservation de la saisie locale.
- Donnée absente : libellé explicite (« Non renseigné ») et lien vers Qualité pour les administrateurs.
- Permission insuffisante : réponse 403 côté API et page d’accès refusé côté interface.
- Doublon ambigu : aucune fusion automatique.
- Visite annulée ou absence : résultat et note enregistrés séparément.
- Longs titres, descriptions, noms et montants : troncature visuelle sans perte de la valeur complète au détail.

## Validation

Chaque tranche doit passer :

1. type-check web et mobile ;
2. build de production Vercel ;
3. vérification des routes publiques et admin ;
4. test des états vide, erreur, permission et données longues ;
5. contrôle mobile (largeur étroite, réseau lent, clavier) ;
6. vérification des migrations Supabase et des variables de production.

Les indicateurs de succès sont : aucune régression de navigation, aucune erreur TypeScript, aucune URL Vercel de prévisualisation dans les liens publics, baisse des requêtes inutiles sur la recherche mobile, et traçabilité complète contact → visite → réservation.

## Découpage de livraison

1. **Fondations et erreurs** : composants d’états, vérification des routes, limites et cache.
2. **Parcours prospect** : recherche, fiche bien, CTA conseiller et source/référence.
3. **Parcours commercial** : pipeline, formulaires, historique, alertes et qualité.
4. **Mobile** : pagination, recherche temporisée, cache, états réseau et parité des données.
5. **Passe qualité** : accessibilité, responsive, typographie, performance et nettoyage.

Chaque tranche est livrée dans un commit identifiable et déployée après validation.

## Hors périmètre

- Réécriture du framework ou migration de Supabase.
- Fusion automatique de prospects sans validation humaine.
- Accès public aux coordonnées des propriétaires.
- Refonte marketing ou production de nouveaux médias.
