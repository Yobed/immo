# Livraison hardening — 8 septembre 2026

## Périmètre

- disponibilité et observabilité (`/api/health` et remontée d'erreurs limitée) ;
- headers de sécurité HTTP ;
- index CRM pour les files de suivi et la déduplication ;
- lecture catalogue/mobile avec contrat de référence et de photos ;
- file d'actions administrateur « À traiter maintenant » ;
- documentation des décisions et des critères d'exploitation.

## Vérifications locales

- `npm.cmd run build --workspace=@immo-ci/web` — OK ;
- `npm.cmd run type-check --workspace=@immo-ci/web` — OK ;
- `npm.cmd run type-check --workspace=@immo-ci/mobile` — OK ;
- `node scripts/test-crm-transactions.mjs` — OK ;
- `node --no-warnings --experimental-strip-types scripts/test-public-description.mjs` — OK ;
- `git diff --check` — OK.

## Base de données liée

- migration `032_crm_catalogue_indexes.sql` appliquée au projet Supabase lié ;
- migrations locales et distantes alignées jusqu'à `032` ;
- 11 index CRM vérifiés dans `pg_indexes`.

## Contrôles après déploiement

Déploiement Vercel production : `dpl_FiXam8CDhY4W86skEvQ26YhdMP4V` (`READY`), alias `https://www.bogbesgroup.com`.

Le build Vercel ne signale plus de variables de catalogue absentes de `turbo.json`.

- `TEST_BASE_URL=https://www.bogbesgroup.com node scripts/test-production-surfaces.mjs` — OK (`health=ok`, catalogue `1319`) ;
- `TEST_BASE_URL=https://www.bogbesgroup.com node scripts/test-catalogue-contract.mjs` — OK (`2` annonces, total `1319`).
- `TEST_BASE_URL=https://www.bogbesgroup.com node scripts/test-admin-contract.mjs` — OK (export, mutations et pages admin refusés sans session) ;
- `node --experimental-strip-types scripts/test-rate-limit.mjs` — OK (fenêtre glissante et cinq routes sensibles couvertes).
