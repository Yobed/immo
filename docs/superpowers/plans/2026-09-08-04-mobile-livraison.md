# Lot 4 — Mobile et recette finale — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aligner téléphone et site sur les mêmes annonces, prix et références, puis livrer avec preuves et guide à jour.
**Architecture:** API publique versionnée réutilisant les adaptateurs catalogue ; favoris authentifiés multisource ; cache natif public borné, aucune mutation hors ligne.
**Tech Stack:** Expo/React Native, Expo Image, AsyncStorage, Supabase, API Next.js, Maestro, Playwright.
**Contrat:** [Spécification Astra — mobile, cache et livraison](../specs/2026-09-08-amelioration-globale-astra.md).
**Dépendances:** DTO/références et catalogue des lots 1/3 ; recette CRM dépend du lot 2.

## 4.1 — API mobile et recherche fiables

Créer `apps/web/app/api/mobile/v2/listings/route.ts`, `apps/web/app/api/mobile/v2/listings/[source]/[id]/route.ts`, `apps/mobile/lib/catalogue-api.ts`, `apps/mobile/hooks/useCatalogue.ts`, `apps/web/tests/unit/mobile-catalogue.spec.ts`.
Modifier `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/components/BienCard.tsx`, `apps/mobile/app/bien/[id].tsx` et les anciennes routes API `apps/web/app/api/mobile/annonces/route.ts`, `annonces/[id]/route.ts`.

- [ ] Conserver les anciennes routes et leur forme de réponse pour les versions natives déjà installées ; corriger leurs validations/expurgation via adaptateurs compatibles. La nouvelle application consomme explicitement `/api/mobile/v2`.
- [ ] Version 2 retourne DTO public, `nextCursor`, compteurs par source, `generatedAt` et disponibilité partielle. Identifiant/source invalides => 400 ; absent/retiré => état prévu ; service absent => 503 explicite, pas zéro résultat.
- [ ] Remplacer le cast en `Database['biens']` par `PublicListing`. Mapper prix/périodicité et photo principale comme le web. Routes natives transmettent source ET ID ; les anciens UUID BOGBE’S restent résolus correctement.
- [ ] Recherche debounce 300 ms, AbortController et numéro de requête empêchant toute réponse dépassée d’écraser l’écran. Changement de filtre remet le curseur à zéro ; pagination et pull-to-refresh dédupliquent par clé complète.
- [ ] Gérer état initial, chargement suivant, erreur avec Réessayer et zéro réel séparément. Conserver les cartes déjà chargées pendant une actualisation ; effacer le détail précédent lors d’un changement d’ID.
- [ ] Tests de contrôleur pur : réponse A lente puis B rapide, abort, retry, pagination >100 annonces, double clé numérique entre sources, ID absent, prix vente/location/jour et photographie manquante.
- [ ] Mesurer requêtes : une requête après saisie stabilisée, une par page ; aucun chargement non borné. Type-check natif et web, tests Playwright unitaires.

Commit `fix(mobile): fiabiliser les annonces et la recherche paginée`.

## 4.2 — Favoris multisource et retour au bon bien

Créer `supabase/migrations/035_multisource_favorites.sql`, `supabase/tests/favorites_permissions.test.sql`, `apps/web/app/api/favorites/route.ts`, `apps/mobile/providers/FavoritesProvider.tsx`.
Modifier `apps/mobile/components/FavoriteButton.tsx`, `apps/mobile/app/(tabs)/favoris.tsx` et le layout natif pour le provider.

- [ ] Vérifier le contrat réel de `favoris` du lot 0 et créer `listing_favorites(user_id uuid, property_source text, property_source_id text, created_at timestamptz)` avec unicité des trois clés et RLS propriétaire de la ligne.
- [ ] Backfill des favoris UUID existants vers `bogbes`; ne pas convertir une clé numérique en UUID. Conserver `favoris` pour les anciennes versions et synchroniser insert/delete BOGBE’S dans une transaction sans boucle de triggers ; les favoris externes restent dans la nouvelle table.
- [ ] API favoris vérifie cookie de session web ou bearer natif par Supabase `getUser`, sans confiance dans un `user_id` client. DTO public uniquement en sortie ; page de favoris privée `no-store`.
- [ ] Lecture de présence groupée pour les clés de la page, état partagé entre cartes, détail et écran favoris ; aucun SELECT par bouton. Mutation optimiste avec retour arrière et erreur visible si refus/réseau absent.
- [ ] Changement de compte/déconnexion annule requêtes privées et vide l’état. Réponses d’une ancienne session ignorées. Pas d’écriture de favoris mise en file hors ligne.
- [ ] Favori d’annonce retirée : afficher « Annonce indisponible » avec référence et possibilité de retirer ; ne pas substituer un autre bien. Résolution par clé complète et origine flash validée.
- [ ] Tester RLS utilisateurs A/B, double appui, erreur réseau, synchronisation anciennes/nouvelles versions, plus de 1 000 favoris paginés et aucune requête N+1.

Validation : SQL + tests API et parcours Maestro Favoris. Commit `fix(mobile): gérer les favoris de toutes les sources`.

## 4.3 — Contact, cache et lisibilité native

Créer `apps/mobile/lib/public-catalogue-cache.ts`, `apps/mobile/components/NetworkStatus.tsx`, `apps/mobile/.maestro/flows/catalogue-contact.yaml`, `favoris.yaml`.
Modifier `apps/mobile/app/bien/[id].tsx`, `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/.maestro/flows/search-biens.yaml` et `apps/mobile/eas.json`.

- [ ] Le bouton conseiller contient titre, référence et lien BOGBE’S canonique avec origine flash ; l’action Réserver ouvre le parcours réellement disponible, pas un simple `Alert` sans suite. Pour une annonce externe, expliquer la demande de visite au conseiller.
- [ ] Ne compter aucune ouverture de lien comme contact réussi. Intercepter la navigation WhatsApp dans les tests ; aucun message à un numéro réel.
- [ ] Cache AsyncStorage DTO public versionné, fraîcheur 10 min, conservation 24 h, LRU 5 recherches/120 annonces, borne supplémentaire 2 Mo de JSON. Ne pas copier de photos en base64 ni le contenu privé.
- [ ] Au lancement hors ligne, afficher dernière liste admissible avec âge ; passé 24 h, montrer l’état hors ligne sans annoncer disponibilité. À la reconnexion, actualiser et vérifier le détail avant action ; le catalogue en cache ne valide jamais une réservation.
- [ ] Nettoyer les entrées expirées et versions inconnues. Déconnexion vide le privé, catalogue public peut rester ; aucun brouillon CRM persistant. Ne pas ajouter de service worker aux pages privées web.
- [ ] Réutiliser ratio d’image, typographie, niveaux de texte et cibles du contrat ; CTA au-dessus de la safe-area, sans recouvrir photo, formulaire ou navigation basse. Respecter taille de texte système et reduced-motion.
- [ ] Configurer `EXPO_PUBLIC_API_URL` par environnement vers la bonne URL de test/production ; aucune clé privée dans `EXPO_PUBLIC_*`. Les profils iOS de `eas.json` contenant des identifiants fictifs sont signalés comme non publiables tant que non remplacés par les valeurs de compte vérifiées.
- [ ] Exécuter `maestro test apps/mobile/.maestro/flows/search-biens.yaml`, `catalogue-contact.yaml`, `favoris.yaml` sur émulateur configuré ; tests de cache/expiration via horloge contrôlée. Si Maestro/appareil absent, état « non exécuté » documenté, pas « mobile validé ».

Validation : prix/source identiques web/mobile sur mêmes fixtures, contacts avec bonnes références, mode hors ligne explicite. Commit `feat(mobile): améliorer le contact et la continuité de lecture`.

## 4.4 — Relecture des parcours et performance

Modifier les écrans restants uniquement à partir de défauts reproduits. Créer `docs/verification/recette-globale.md` et `docs/verification/resultats-performance.md`.

- [ ] Parcourir accueil, recherche texte/vocale, catalogue et trois types de détail, favoris, connexion/inscription/réinitialisation, contact, visites/réservations, dashboard propriétaire et publication.
- [ ] Parcourir chaque destination `AdminShell` : suivi, prospects, qualité/doublons, performance, guide, validation/modération/flash, comptes/KYC/démarcheurs, outreach et erreurs. Vérifier rôle, retour, action principale, vide, erreur, chargement, confirmation et navigation clavier.
- [ ] Pour chaque défaut reproduit, noter route, rôle, écran, résultat attendu/observé et preuve. Corriger par domaine avec test de régression si le comportement est métier ; pour espacements/libellés, recette visuelle suffit.
- [ ] Réduire images trop lourdes avec sources réellement compatibles, chargement paresseux sous la ligne de flottaison, supprimer animations bloquant contenu essentiel et timers inutiles. Comparer LCP/CLS/TTFB et requêtes aux mesures lot 0, conditions identiques.
- [ ] Revoir boutons superposés, états actifs, messages d’erreur, textes tronqués, contrastes clair/sombre, tailles 320/390/768/1280/1440 px, zoom 200 %, taille système native et reduced-motion. Aucun nouveau framework esthétique.
- [ ] Exécuter les suites pertinentes une fois après intégration : tests SQL, unitaires, E2E web, type-check web/mobile, build web et Maestro disponible. Corriger les erreurs avant de publier un lot affecté ; décrire précisément les limites restantes.

Validation : tableau de recette complet avec succès/échec/non vérifié distincts et mesures avant/après. Commit `fix(ui): finaliser les parcours et vérifier les performances`.

## 4.5 — Mise en production et preuve de livraison

Modifier `turbo.json` et `vercel.json` seulement si les écarts du lot 0 sont confirmés. Créer `docs/verification/livraison.md`.

- [ ] Ajouter les variables serveur effectivement requises à l’environnement de build/cache Turbo, notamment scraping et URL canonique. Restreindre les en-têtes CORS par route selon clients réels ; vérifier que l’app native et les domaines autorisés fonctionnent.
- [ ] Produire un déploiement de recette sur le bon projet à partir d’un commit propre ; enregistrer commit, empreinte du build, migrations attendues et compatibilité API/native. Pas de dépendance à un fichier non suivi indispensable.
- [ ] Appliquer les migrations additives après tests et contrôle de cible. Sauvegarde/retour arrière documentés : garder données et schéma compatibles, revenir à l’application précédente si nécessaire, pas de DROP/purge pour annuler.
- [ ] Vérifier après migration contraintes/RPC/grants effectifs. Si absents, garder fonctionnalité nouvelle désactivée avec état explicite ; aucune réussite via fallback. Activer seulement le lot prêt.
- [ ] Publier le web selon l’autorisation de déploiement déjà donnée ; utiliser le projet vérifié sans changer de compte/domaine arbitrairement. Contrôler alias `bogbesgroup.com`, certificat et redirections. Un domaine de preview ne remplace pas les liens clients.
- [ ] Sur production, contrôler les parcours lecture seule, la bonne origine des annonces, le compteur, les images et accès admin autorisés ; ne créer aucune visite/réservation ni message réel pour la recette.
- [ ] Traiter la livraison Expo séparément : OTA seulement si compatible avec runtime existant ; sinon nouvelle archive. Rapporter précisément canal/build et disponibilités Android/iOS ; ne pas annoncer un changement natif uniquement parce que Vercel est à jour.
- [ ] Commit/push uniquement les fichiers des lots testés. Mettre à jour le guide commercial avec les fonctions effectivement activées et les preuves de livraison. Signaler tout blocage externe spécifique (identifiants iOS, permissions projet, accès DB) avec les travaux indépendants déjà terminés.

Validation finale : URL de production correcte, commit poussé vérifié, migrations attestées, recette archivée, application native distinguée du site responsive. Aucun « tout est corrigé » sans preuve sur le parcours concerné.
