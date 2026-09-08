# Durcissement production — points 3 à 8

## Objectif

Rendre le site plus observable, plus rapide, plus sûr et plus facile à piloter sans modifier les fichiers marketing ni exposer de secrets.

## Architecture retenue

Le lot s’appuie sur les briques existantes : `error-logger`, rate limiting, journal CRM, vue catalogue consolidée et pages admin. Les nouveaux contrôles restent additifs : une route de santé ne renvoie aucune donnée métier, les métriques CRM excluent les événements non rattachés, et les indexes Supabase accélèrent les requêtes sans changer les lignes historiques.

## Décisions

- Observabilité : ajouter `/api/health` avec état applicatif, Supabase et catalogue, puis afficher les signaux dans l’espace erreurs admin.
- Catalogue : ajouter les indexes utiles, stabiliser le tri/pagination, servir les images avec un fallback et signaler les sources indisponibles au lieu d’afficher un faux zéro.
- CRM/admin : ajouter les alertes SLA, les filtres persistants et les actions groupées sans contourner les RPC atomiques.
- Sécurité : appliquer les headers de sécurité, rate limiter les routes publiques sensibles et vérifier le rôle côté serveur sur chaque mutation admin.
- Livraison : versionner le correctif `/support`, conserver les fichiers marketing hors périmètre et documenter le contrôle post-déploiement.

## Critères d’acceptation

1. `/api/health` renvoie un statut non sensible et échoue clairement si Supabase ou le catalogue est indisponible.
2. Le catalogue ne confond plus panne et catalogue vide, conserve un ordre stable et ne charge pas de données inutiles.
3. Les alertes admin couvrent demandes sans réponse, relances en retard, visites sans compte rendu, prospects non assignés, réservations sans visite et refus sans motif.
4. Les routes sensibles refusent les appels anonymes ou trop fréquents et les réponses n’exposent aucune clé ni donnée propriétaire.
5. Web/mobile compilent, les tests CRM/catalogue passent et le build production est vert.
