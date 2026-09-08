# Lot 0 — État initial et sécurité de livraison — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Établir une base vérifiable avant toute modification CRM ou déploiement.
**Architecture:** Conserver les cinq sources Supabase et le projet Vercel actuel ; séparer les contrôles lecture seule de production et les tests mutables isolés.
**Tech Stack:** Next.js 15, Expo 54, Supabase/PostgreSQL, npm workspaces, Playwright existant, PowerShell.
**Contrat:** [Spécification Astra](../specs/2026-09-08-amelioration-globale-astra.md).
**Dépendance:** Aucune. Pas de migration ni envoi externe dans ce lot.

## 0.1 — Figer l’état de départ

Fichiers : créer `docs/verification/2026-09-08-etat-initial.md` ; lire `.vercel/project.json` et `apps/web/.vercel/project.json` si présents, `vercel.json`, `turbo.json`, les manifests npm et `apps/mobile/eas.json`.

- [ ] Capturer `git status --short`, `git log -5 --oneline` et les versions Node/npm ; séparer fichiers applicatifs, docs, assets marketing et scripts environnement préexistants. Ne pas les inclure dans un commit de correction.
- [ ] Créer une branche `codex/amelioration-globale` dans un worktree propre pour l’implémentation ; partir du commit contenant ces plans. Conserver les modifications non commitées du dossier d’origine.
- [ ] Comparer les fichiers applicatifs examinés au commit de départ et inventorier les différences nécessaires aux constats/fonctionnalités de référence. Intégrer uniquement les patches applicatifs pertinents et relus dans le worktree, avec origine consignée ; ne pas embarquer automatiquement marketing, secrets ou autres travaux. Reproduire les constats dans ce worktree avant correction et enregistrer les empreintes des fichiers concernés.
- [ ] Vérifier en lecture seule le projet Vercel `prj_RNUJ6qK1oXrfHAIOQGScvXFx8kBF`, l’équipe `team_IDiMVg82O9d9AUPh0nuKE8Zz`, les domaines et le dernier déploiement. Résultat attendu : identité du projet et URL du déploiement notées ; aucune reliaison automatique à l’ancien projet.
- [ ] Comparer les variables utilisées par le code et la configuration de build, notamment `SCRAPING_SUPABASE_URL`, `SCRAPING_SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, clés main/flash et `EXPO_PUBLIC_API_URL`. Rapporter présence, destination et appel réussi sous forme de booléens. Une valeur chiffrée masquée par l’API n’est ni vide ni vérifiée.
- [ ] Documenter les capacités du token : un refus `/teams` ou `/user` n’invalide pas un token limité au projet. Ne pas copier de token ou de valeur privée dans les documents, arguments persistants ou logs.
- [ ] Contrôler les routes publiques du domaine et trois références existantes, une par famille de source. Sans créer de contact, noter HTTP, compteur, origine et images disponibles. Si inaccessible, écrire « non vérifié » avec cause précise.

Validation : le rapport permet de distinguer commit, contenu réellement déployé, migrations et version native. Aucun champ sensible en clair. Commit ciblé `docs: établir l'état initial de livraison`.

## 0.2 — Vérifier le contrat SQL réel

Créer `scripts/verify-crm-schema.mjs`, `docs/verification/schema-crm.md`, `supabase/tests/crm_schema.test.sql`.
Lire les migrations 001–030, particulièrement 019, 027–030, sans supposer qu’elles ont toutes été exécutées.

- [ ] Inventorier tables, colonnes, FK, CHECK, indexes, triggers, RPC, droits de colonnes et RLS effectifs du principal ; consigner seulement métadonnées, jamais lignes clients.
- [ ] Rechercher la définition effective de `prospects`, `prospect_activities` et `upsert_prospect`, absente des migrations locales inspectées. Capturer leur DDL sans données. Si indisponible, marquer le déploiement CRM bloqué ; continuer les travaux publics indépendants, sans inventer un schéma de production.
- [ ] Reconstituer une baseline locale reproduisant le schéma relevé. Ne pas modifier rétroactivement les migrations déployées ; ajouter une migration additive si nécessaire, avec préconditions documentées.
- [ ] Le script retourne exit 0 si tables/champs/FK/RPC/RLS attendus existent, exit 1 avec les noms manquants sinon. Zéro secret, zéro « succès » fondé uniquement sur des fichiers SQL présents.
- [ ] Tester un schéma incomplet : échec clair. Tester la baseline : succès. Vérifier qu’une restriction de colonne 019 ne disparaît pas avec une policy admin.
- [ ] Inventorier conservation, exports, journaux et caches existants ; documenter les champs conservés et les opérations d’anonymisation possibles. N’activer aucune purge automatique et ne fixer aucune durée présentée comme obligation légale.

Validation : `supabase test db` sur la base locale, jamais une base de production ; rapport du script sur les métadonnées accessibles de production. Commit `test: vérifier les contrats CRM et permissions`.

## 0.3 — Installer des tests utiles et une référence de performance

Modifier `apps/web/playwright.config.ts`, `apps/web/tests/e2e/auth.spec.ts`, `apps/web/tests/e2e/catalogue.spec.ts`, `apps/web/tests/e2e/reservation.spec.ts`.
Créer `apps/web/playwright.unit.config.ts`, `apps/web/tests/fixtures/crm.ts`, `apps/web/tests/fixtures/catalogue.ts`, `scripts/seed-test-data.mjs`, `docs/verification/parcours-et-mesures.md`.

- [ ] Ajouter une configuration Playwright sans serveur web pour les tests TypeScript purs (`testDir: './tests/unit'`). Réutiliser le runner installé ; pas de seconde bibliothèque de tests inutile.
- [ ] Le seed refuse toute URL non locale/non explicitement autorisée par `TEST_SUPABASE_URL`. Créer deux admins, un prospect, un propriétaire synthétiques, des doubles, deux biens par source et des parcours datés reproductibles. Aucun téléphone réel.
- [ ] Injecter des adaptateurs de test pour scraping et flash ; les tests E2E ne dépendent pas du nombre d’annonces en production. Neutraliser les sorties Wasender, email et paiement dans l’environnement de recette.
- [ ] Corriger la route de connexion `/login`, supprimer les réussites artificielles et les `catch`/skip qui masquent l’absence de résultat requis. Les fixtures attendues doivent exister, sinon le test échoue.
- [ ] Ajouter projets Chromium desktop et mobile 390 px ; inclure 320 px et zoom 200 % dans la recette visuelle. Garder les assertions métier distinctes des captures.
- [ ] Mesurer cinq passages production-build sur accueil, catalogue web, catalogue flash et détail ; enregistrer médiane LCP/CLS/TTFB, poids transféré, nombre de requêtes et conditions réseau du contrat. Les résultats initiaux sont des mesures, pas des objectifs atteints.
- [ ] Vérifier tous les scripts : `npm run type-check --workspace=@immo-ci/web`, `npm run build --workspace=@immo-ci/web`, puis `npm run e2e --workspace=@immo-ci/web` dans l’environnement isolé. Consigner les échecs préexistants et leurs causes ; ne pas déclarer « vert » avec des tests ignorés.

Validation : fixtures reproductibles, tests qui échouent si un résultat requis disparaît, état initial enregistré. Commit `test: fiabiliser la recette web et établir les mesures`.

## Sortie du lot

- [ ] Rapport sans secret et liste des contrats réellement vérifiés.
- [ ] Base locale reproductible et distinction explicite entre travail indépendant possible et activation CRM conditionnée au schéma.
- [ ] Les budgets de performance et parcours à protéger sont mesurables.
- [ ] Passer au [lot 1](2026-09-08-01-tracabilite-crm.md), en conservant les preuves et les limites.
