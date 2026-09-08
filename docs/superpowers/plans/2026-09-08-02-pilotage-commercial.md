# Lot 2 — Pilotage et expérience commerciale — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montrer au commercial la prochaine action utile et au responsable des résultats expliqués, avec données fiables et historique consultable.
**Architecture:** Pages admin existantes alimentées par services serveur et agrégations SQL ; composants courts par responsabilité, formulaires transactionnels du lot 1.
**Tech Stack:** Next.js, Supabase, React Hook Form/Zod existants, Recharts et react-pdf existants.
**Contrat:** [Spécification Astra — mesures, actions et présentation](../specs/2026-09-08-amelioration-globale-astra.md).
**Dépendance:** Lot 1. Pas de statistiques fiables déclarées sur des événements non reliés.

## 2.1 — Une fiche commerciale actionnable

Modifier `apps/web/app/admin/prospects/page.tsx`, `apps/web/app/admin/prospects/[id]/page.tsx`, `apps/web/app/admin/suivi/page.tsx`.
Créer sous `apps/web/components/admin/crm/` : `OpportunitySummary.tsx`, `OpportunityEditor.tsx`, `VisitOutcomeForm.tsx`, `ActivityTimeline.tsx` ; créer `apps/web/tests/e2e/crm-workflow.spec.ts`.
Créer `apps/web/app/admin/suivi/rapprochement/page.tsx`, `actions.ts` et `apps/web/components/admin/crm/IntakeLinkForm.tsx` pour les demandes non reliées.

- [ ] Vérifier les chemins courants par graphe avant édition. Si la fiche est organisée différemment, consigner le chemin résolu dans le commit sans dupliquer l’écran.
- [ ] Tester d’abord : ouvrir un prospect, choisir un bien/opportunité, assigner admin B, planifier une visite, enregistrer son issue, programmer une relance, puis gagner/perdre. La timeline doit conserver acteur, date, référence et décision.
- [ ] En-tête : nom, contact prospect, responsable, prochain rendez-vous/action. Liste d’opportunités séparée lorsque plusieurs biens sont suivis ; clic sur référence ouvre la bonne fiche et garde le retour au dossier.
- [ ] Afficher au premier niveau seulement état, prochaine action/date, responsable et action principale. Placer origine, coordonnées propriétaires, chronologie complète et champs secondaires en sections nommées. Aucune information utile supprimée.
- [ ] Formulaires branchés sur les RPC : champs invalides signalés au bon endroit, erreur serveur lisible, conservation en mémoire après échec, succès seulement après commit. Perdu exige motif ; `autre` exige précision ; relance exige action+date ; compte rendu enregistre résultat+note et prochaine action si dossier ouvert.
- [ ] Montrer le conflit de version avec bouton Recharger. Ne pas remplacer les données d’un autre admin. Afficher les statuts hérités sans les convertir en gagné.
- [ ] Vue doublons : choix explicite du dossier principal, prévisualisation des champs conservés/conflits, action de fusion unique, historique fusionné consultable. Le dossier secondaire pointe vers le principal.
- [ ] File « À rapprocher » : afficher identité revendiquée, fiabilité, référence et candidats ; permettre sélectionner/créer personne et opportunité, puis confirmer via `crm_link_intake`. Ne jamais présélectionner silencieusement le premier candidat. Tester recherche générale, deux personnes possibles, zéro candidat et concurrence ; la demande quitte la file uniquement après commit réussi.
- [ ] Vérifier admin A/B, clavier et téléphone 390 px. Le prospect ne peut accéder ni à la route ni à l’action directe. Aucun champ « propriétaire » dans les réponses publiques.

Validation : E2E `crm-workflow.spec.ts`, type-check, tests SQL lot 1. Commit `feat(admin): simplifier les fiches et actions commerciales`.

## 2.2 — Actions du jour et navigation

Créer `supabase/migrations/034_crm_analytics_alerts.sql`, `apps/web/lib/crm/alerts.ts`, `apps/web/components/admin/crm/ActionQueue.tsx`, `supabase/tests/crm_alerts.test.sql`.
Modifier `apps/web/components/admin/AdminShell.tsx`, `apps/web/app/admin/suivi/page.tsx`, `apps/web/components/admin/AutoRefreshOnFocus.tsx`.
Créer `apps/web/components/admin/crm/AlertPolicyForm.tsx`, `AlertSnoozeForm.tsx` et `apps/web/app/admin/suivi/alert-actions.ts`.

- [ ] Définir `crm_alert_policy` versionnée et `crm_alert_overrides` (clé type/entité/cycle/échéance, report jusqu’au, motif, acteur). RLS admin ; données minimales, pas de copie de tout le dossier.
- [ ] Donner à chaque politique/report un UUID et ajouter les RPC admin `crm_update_alert_policy` et `crm_snooze_alert`, avec version/idempotence, dates bornées et journal transactionnel `policy_changed`/`alert_snoozed`.
- [ ] Brancher « Régler les délais » sur `AlertPolicyForm` (valeurs par défaut visibles, confirmation du changement) et « Reporter » sur `AlertSnoozeForm` (date+motif). Succès après RPC seulement ; tests non-admin, date invalide/passée, conflit de version et retour de l’alerte après échéance.
- [ ] Implémenter les six déclencheurs du contrat en requête serveur. Les alertes dérivent de l’état courant ; une indisponibilité SQL affiche « Impossible d’actualiser », pas une liste vide.
- [ ] Tester horaires UTC/Abidjan, relance exacte, fin de visite absente avec durée par défaut, compte rendu ajouté, motif administratif et motif commercial distincts, report expiré et réouverture de cycle.
- [ ] Afficher quatre compteurs utiles puis la liste triée par échéance, gravité et ID stable. Chaque ligne explique la cause et conduit à l’action qui la résout. Aucun popup promotionnel ni notification externe.
- [ ] Actualiser à l’ouverture et au retour de fenêtre avec limitation 30 s, jamais pendant saisie active sans préserver le formulaire. Bouton Actualiser avec état et heure de dernière réussite ; pas de timer permanent sur tous les écrans.
- [ ] Navigation admin : groupes « Travail commercial », « Annonces », « Équipe », « Système ». Suivi, Prospects et Performance immédiatement accessibles ; Qualité/Guide restent accessibles sans saturer le premier niveau.
- [ ] Corriger l’état actif sur les routes imbriquées : une seule destination `aria-current=page`, choisir la correspondance la plus spécifique. Sur mobile, menu nommé ou panneau complet, pas treize onglets tronqués horizontalement.

Validation : SQL alertes + E2E navigation aux largeurs 320/390/1280 et zoom 200 %, absence de requêtes Wasender/email. Commit `feat(admin): prioriser les actions et clarifier la navigation`.

## 2.3 — Mesures par cycles et cohortes

Compléter `034_crm_analytics_alerts.sql` avant son premier déploiement ; une fois déployée, toute correction devient une nouvelle migration.
Créer `apps/web/lib/crm/analytics.ts`, `apps/web/components/admin/crm/PerformanceOverview.tsx`, `PerformanceBreakdown.tsx`, `supabase/tests/crm_analytics.test.sql`.
Modifier `apps/web/app/admin/performance/page.tsx`, `apps/web/app/admin/prospects/qualite/page.tsx`.

- [ ] Écrire des fixtures SQL avec deux cycles d’une opportunité, plusieurs contacts/visites, jalons hors ordre, visites non conclues mais réalisées, réservation demandée/validée, gain sans visite, fusion et attribution changée après contact.
- [ ] Créer une RPC admin d’agrégation recevant période `[début, fin)`, instant d’observation, filtres source/canal/type/commune/conseiller. Compter `DISTINCT cycle_id` selon le contrat, avec premiers jalons ordonnés et attribution figée au premier contact.
- [ ] Retourner données de conversion, numérateurs/dénominateurs, délais moyenne/médiane/n, motifs de perte, séries temporelles et cohortes hebdomadaires/mensuelles. Distinguer charge actuelle, réception des demandes et conversion des cycles contactés.
- [ ] Paginer le détail des dossiers côté SQL. Retirer le plafond 5 000 comme méthode de comptage ; un jeu > 5 000 lignes doit produire les mêmes chiffres qu’un calcul SQL de référence indépendant.
- [ ] Ajouter taux de complétude et volumes non reliés/temps incohérents. Inclure « Non renseigné » dans les dimensions et conserver les totaux réconciliables. Une erreur RPC n’est pas transformée en zéro.
- [ ] Présentation : quatre indicateurs maximum au-dessus de la ligne de flottaison, puis entonnoir annoté, évolution, motifs et ventilation. Cliquer une mesure ouvre les dossiers qui forment précisément son numérateur ou dénominateur.
- [ ] Afficher période, fuseau, date d’observation, unité « cycles commerciaux » et taille d’échantillon. Pas de classement flatteur des conseillers fondé sur un volume minuscule ; montrer le nombre de cycles avec le taux.
- [ ] Tester 0/1/plusieurs cycles, deux cycles d’une même opportunité dans la période, contacts avant période, visite après fin mais avant observation, aucun dénominateur et données manquantes. Taux toujours entre 0 et 100 %, délais uniquement sur dates admissibles.

Validation : `supabase test db`, E2E filtres et drill-down, type-check et build. Commit `fix(crm): calculer les conversions sur des parcours cohérents`.

## 2.4 — Exports et guide commercial

Créer `apps/web/app/api/admin/crm/export/route.ts`, `apps/web/lib/crm/export.ts`, `apps/web/tests/e2e/crm-export.spec.ts`.
Modifier `docs/guide-suivi-commerciaux.md` et `apps/web/app/admin/guide/page.tsx`.

- [ ] Export CSV détaillé et PDF de synthèse alimentés par le même filtre/RPC et instant d’observation que l’écran. Trier/paginer le CSV sans truncation silencieuse ; limiter la taille par réponse avec continuation explicite si nécessaire.
- [ ] Contrôler la session admin dans l’endpoint, `Cache-Control: no-store`, journaliser acteur/cible/période/format. Nom de fichier sans donnée personnelle ; neutraliser les cellules pouvant devenir formules CSV.
- [ ] Tester accès refusé prospect, admin A et B, total et filtre identiques à l’écran, accents/FCFA, caractères spéciaux, CSV volumineux, erreurs pendant génération. Un fichier incomplet n’est pas annoncé comme export réussi.
- [ ] Rédiger le guide depuis le geste du prospect : ouvrir une annonce → envoyer demande avec référence → traiter/rapprocher → assigner → contacter → visiter → compte rendu → relancer → conclure/analyser.
- [ ] Inclure cas pratiques « absent », « propriétaire injoignable », « plusieurs biens pour une personne », « fusion » et « réservation sans visite ». Expliquer pourquoi une conversion manque plutôt que conseiller de changer les statuts pour améliorer le taux.
- [ ] Ajouter captures de la version réellement testée, liens internes et définitions d’indicateurs. Le guide décrit les écrans livrés, pas des fonctions encore prévues.

Validation : exports ouverts et comparés aux fixtures ; guide parcouru sur mobile/admin. Commit `feat(crm): exporter les analyses et documenter le suivi`.

## Sortie du lot

- [ ] Un commercial peut accomplir chaque action demandée et retrouver son auteur/date.
- [ ] Un responsable peut expliquer un taux avec les dossiers sous-jacents et voir les données exclues.
- [ ] Alertes internes résolues/reportées de manière prévisible ; aucun canal externe ajouté implicitement.
- [ ] Continuer le [lot 3](2026-09-08-03-catalogue-experience.md).
