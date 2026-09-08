# Lot 1 — Identité et traçabilité CRM — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toute demande retrouve son prospect, son bien et son parcours ; toute mutation administrative possède un journal cohérent.
**Architecture:** RPC transactionnelles dans le Supabase principal, références externes typées, événements immuables pour les rôles applicatifs, historique conservé via alias.
**Tech Stack:** PostgreSQL, Supabase session/server clients, Zod, TypeScript, Playwright et tests SQL.
**Contrat:** [Spécification Astra — CRM, droits et sources](../specs/2026-09-08-amelioration-globale-astra.md).
**Dépendance:** Lot 0, schéma réel connu. Les numéros de migration 031–033 sont réservés par ce plan ; vérifier les collisions avant création.

## 1.1 — Références et identités communes

Créer `packages/shared/catalogue/property-ref.ts`, `packages/shared/crm/identity.ts`, leurs copies générées sous `apps/web/shared-pkg/`, `scripts/sync-shared-contracts.mjs` et `apps/web/tests/unit/identity-reference.spec.ts`.

- [ ] Écrire d’abord les cas : UUID BOGBE’S, même ID numérique web/flash, BIGINT conservé en string, identifiant négatif/décimal/injecté, lien externe arbitraire, téléphone CI local/`+225`/`00225`, huit chiffres historique, étranger, vide, email ambigu.
- [ ] Implémenter les contrats de la spécification, sans joindre au public coordonnées ou URL propriétaire. Exposer génération du lien BOGBE’S et libellé de référence séparément de l’identité source complète.
- [ ] Conserver les plages legacy flash pour les anciennes URL et expliciter la source physique pour tout nouveau stockage. Ne pas créer de FK entre bases Supabase indépendantes.
- [ ] Générer uniquement les nouveaux modules partagés vers `apps/web/shared-pkg` ; le script `--check` compare les octets et échoue en cas de divergence. Ne pas remplacer les autres modules partagés pendant ce lot.
- [ ] Exécuter depuis `apps/web` : `npx playwright test --config=playwright.unit.config.ts tests/unit/identity-reference.spec.ts`. Attendu : tous les cas réussissent, numéro ambigu non automatiquement fusionné.

Commit `feat(crm): définir les identités et références de biens`.

## 1.2 — Schéma additif, sécurité et compatibilité

Créer `supabase/migrations/031_crm_identity_and_refs.sql`, `supabase/tests/crm_permissions.test.sql`, `supabase/tests/crm_constraints.test.sql` et `apps/web/lib/crm/contracts.ts`.

- [ ] Ajouter aux prospects `merged_into`, `merged_at` et les clés d’identité normalisées indexées. Ne pas imposer un index unique aux anciennes identités avant résolution des conflits.
- [ ] Créer `crm_opportunities` et `crm_cycles` avec les champs et contraintes du contrat ; indexer prospect, référence bien, responsable, cycle ouvert et échéance. Une FK cohérente lie chaque `cycle_id` à son `opportunity_id`.
- [ ] Ajouter `opportunity_id`, `cycle_id`, `property_source`, `property_source_id` aux contacts/visites/réservations et les liaisons d’opportunité/cycle aux événements. Conserver `bien_id`, `locaux_id`, acteurs et références héritées.
- [ ] Ajouter `crm_link_status` aux trois tables de demandes et `version` aux prospects et entités CRM mutables qui n’en disposent pas. Anciens liens non vérifiés : `legacy_unreviewed` ; demande ambiguë nouvelle : `needs_review` ; liaison cohérente validée : `linked`.
- [ ] Étendre les CHECK d’entités/événements de 028 sans supprimer leurs valeurs existantes. Ajouter `origin` (`human`, `system`, `backfill`, `legacy_unknown`) et `request_id` aux événements. Les événements humains nouveaux exigent un acteur ; l’origine système est explicite.
- [ ] Migrer les anciennes notes/affectations/relances sans acteur en `legacy_unknown`, sans inventer de nom ni d’action système. Tester ces lignes avant d’imposer les contraintes et interdire `legacy_unknown` aux nouvelles mutations applicatives.
- [ ] Créer `crm_mutation_requests` pour idempotence : UUID request, opération, acteur/origine, empreinte des arguments, résultat JSON, date. Seules les RPC peuvent écrire cette table ; résultat interne exclu des réponses publiques.
- [ ] Configurer RLS/grants selon la matrice. Les admins n’obtiennent pas de nouveaux grants directs sur les coordonnées protégées par 019. Prévoir une RPC de lecture admin avec contrôle `auth.uid()` et événement d’accès.
- [ ] Tester anon, prospect, propriétaire, admin A et B : refus SQL/API du privé pour les trois premiers, accès aux contacts pour les deux admins, service-role non exposé. Tester FK incohérente, cycle simultané et valeur d’événement inconnue.
- [ ] Rejouer la migration sur la baseline et sur un jeu contenant valeurs historiques/NULL. Attendu : aucune perte de ligne, contraintes conformes, données ambiguës conservées pour rapprochement.

Commandes : `supabase db reset` exclusivement local après garde d’environnement ; `supabase test db`. Commit `feat(crm): ajouter opportunités cycles et contrats sécurisés`.

## 1.3 — Mutations et fusion atomiques

Créer `supabase/migrations/032_crm_transactions.sql`, `supabase/tests/crm_transactions.test.sql`, `supabase/tests/crm_merge.test.sql`, `apps/web/lib/crm/mutations.ts`.
Modifier `apps/web/app/admin/prospects/actions.ts`, `apps/web/app/admin/prospects/doublons/actions.ts`, `apps/web/app/admin/suivi/actions.ts`.
Modifier aussi `apps/web/app/api/admin/contact-requests/[id]/validate/route.ts`, `apps/web/app/api/admin/visites/[id]/validate/route.ts`, `apps/web/app/api/admin/reservations/[id]/validate/route.ts` : toutes les entrées de validation utilisent les mêmes RPC.

- [ ] Écrire les tests d’échec avant implémentation : transition illégale, perte sans motif, `autre` sans note, affectation non-admin, version périmée, événement rejeté, double soumission. Toute panne doit laisser état et journal inchangés.
- [ ] Implémenter RPC humaines distinctes pour transition, affectation/relance, note, issue de visite et validation administrative. Verrouiller l’entité, vérifier version/état, écrire mutation+événement, retourner la nouvelle version. `auth.uid()` détermine l’acteur.
- [ ] Implémenter `crm_merge_prospects(primary_id, secondary_id, request_id)` : verrous ordonnés, cible non alias, pas de cycle, idempotence avec empreinte, repointage transactionnel, conflits préservés et événement `merged` valide. Ne pas modifier le statut en `perdu`.
- [ ] Mettre à jour la vue doublons dans une migration additive pour exclure les alias et utiliser le même normaliseur SQL. La timeline agrège `crm_events` et `prospect_activities` du principal et des alias, en conservant origine et ordre stable `(created_at, id)`.
- [ ] Tester panne après chaque repointage via déclencheur de test, fusion A→B concurrente B→A, répétition même request, request réutilisée avec autre payload, faux acteur, principal inexistant. Attendu : aucun état partiel, au plus un événement, aucune perte factice.
- [ ] Remplacer les écritures JS successives et fallbacks silencieux par RPC. La sélection du principal est explicite dans l’interface de doublons avec aperçu des conflits ; le client ne fournit jamais l’acteur.
- [ ] Pour les notifications existantes de validation, conserver leur autorisation métier mais conditionner l’envoi à une transition nouvellement validée ; les relances de requête ne réenvoient pas. Les nouvelles alertes internes ne réutilisent pas ce chemin. Les tests interceptent tous les transports.
- [ ] Tester deux admins validant le même `pending` : un succès, un conflit/no-op explicite, une trace et aucune double tentative d’envoi. Le transport ne doit jamais être appelé avant commit SQL.
- [ ] Répéter ce test avec une validation par action serveur et l’autre par endpoint API. Aucun ancien endpoint ne peut contourner la transaction, l’acteur vérifié ou l’idempotence.

Validation : `supabase test db`, tests unitaires mutations avec erreurs Supabase simulées, type-check web. Commit `fix(crm): rendre les mutations et fusions transactionnelles`.

## 1.4 — Relier toutes les entrées et préserver l’historique

Créer `supabase/migrations/033_crm_intake.sql`, `supabase/tests/crm_intake.test.sql`, `apps/web/lib/crm/intake.ts`, `scripts/backfill-crm-links.mjs`.
Modifier `apps/web/lib/prospects/capture.ts` et les routes `apps/web/app/api/contact-requests/route.ts`, `flash-contact/route.ts`, `visites/route.ts`, `reservations/route.ts`, `whatsapp/webhook/route.ts`.

- [ ] Faire retourner à la capture un résultat typé (`created`, `linked`, `needs_review`, `failed`) et les identifiants internes utiles ; une erreur réelle n’est plus ignorée. Aucune réussite fictive de création de dossier.
- [ ] Ajouter une RPC d’ingestion réservée service : création/liaison prospect-opportunité-cycle-entité-événement en transaction. Valider le demandeur authentifié/vérifié, la référence bien et les champs publics avant l’appel ; séparer les coordonnées propriétaires.
- [ ] Pour webhook, utiliser l’identifiant du message fournisseur comme clé de reprise. Pour formulaire, réutiliser une clé aléatoire de soumission jusqu’à réponse confirmée. Ne jamais se servir du téléphone seul comme clé d’idempotence d’une action.
- [ ] Si identité incertaine ou plusieurs opportunités possibles, créer une demande explicitement à rapprocher avec contexte ; aucune liaison arbitraire à un dossier existant. Retour public : référence de demande uniquement, pas l’identité ou l’historique trouvé.
- [ ] Implémenter `crm_link_intake(entity_type, entity_id, targets, expected_version, request_id)` dans 033 avec JWT admin. `targets` est validé SQL/TypeScript : personne `{mode: existing, id}` ou `{mode: create, nom, phone, email}`, parcours `{mode: existing, opportunity_id, cycle_id}` ou `{mode: create, property_ref, assigned_to}`. Vérifier cohérence des FK, prospect canonique, cycle ouvert, référence originale conservée et version. Créer les cibles nouvelles et leur cycle dans la même transaction lorsque l’admin a choisi « Créer » ; retourner le lien et la nouvelle version, puis journaliser `identity_linked` atomiquement.
- [ ] Ajouter le contrat TypeScript dans `lib/crm/intake.ts` et tests SQL : aucune cible, candidats ambigus, recherche générale, lien incompatible, acteur non-admin, répétition et deux admins concurrents. Attendu : une liaison explicite ou un échec sans modification.
- [ ] Séparer la référence d’annonce source du canal d’acquisition. Pour web/flash, la demande passe par BOGBE’S ; le bouton final WhatsApp contient titre, référence et URL, sans contact propriétaire.
- [ ] Backfill en mode rapport par défaut : traiter uniquement les correspondances uniques justifiées par identité et référence ; supporter `locataire_id` quand aucun téléphone n’est présent. Pas de rapprochement de numéros vides/anciens ambigus. Conserver les identifiants d’origine et compter non reliés/conflits.
- [ ] En base isolée : tester deux biens pour une personne, plusieurs visites, formulaires simultanés, double webhook, faux téléphone invité, propriétaire/prospect distincts, ancienne URL, bien retiré et cas sans bien. Un même payload répété ne crée aucun doublon.
- [ ] Avant activation, exécuter le backfill rapport sur les données autorisées et vérifier les totaux avant/après. L’application du backfill ne doit jamais être nécessaire à la sauvegarde d’une nouvelle demande correctement liée.

Validation : SQL + E2E avec transports neutralisés, pas de données personnelles dans les logs ni DTO publics. Commit `feat(crm): relier les demandes aux parcours commerciaux`.

## Sortie du lot

- [ ] Aucun message de succès si contrat SQL/RPC absent ; affichage d’une indisponibilité et conservation du formulaire en mémoire.
- [ ] Tous les admins ont l’accès original demandé ; les prospects ne peuvent pas obtenir les coordonnées propriétaires via API, HTML, JSON ou cache.
- [ ] Fusion, journal et entrées vérifiés sous concurrence. Les cas historiques ambigus restent visibles, sans faux gains/pertes.
- [ ] Passer au [lot 2](2026-09-08-02-pilotage-commercial.md). Garder les migrations additives : retour arrière applicatif compatible, pas de suppression de nouvelles données pour annuler un déploiement.
