# Vérification de livraison — 8 septembre 2026

## Périmètre vérifié

- CRM : transitions, motifs de perte, conseiller, prochaine action, version concurrente, journal et fusion idempotente.
- Validation admin : contact, visite et réservation traités une seule fois avant notification.
- Catalogue web/mobile : annonces web issues de `v_annonces`, photos présentes, prix/périodicité, référence et URL canonique.
- Protection : descriptions tierces nettoyées des balises, liens, emails et numéros directs.
- Performance : cohorte de prospects rattachés, conversions par dimension, cohortes hebdomadaires, délais et alertes de qualité.

## Preuves locales

| Contrôle | Résultat |
|---|---|
| `npm.cmd run type-check --workspace=@immo-ci/web` | OK |
| `npm.cmd run type-check --workspace=@immo-ci/mobile` | OK |
| `npm.cmd run build --workspace=@immo-ci/web` | OK — 76 pages générées |
| `node scripts/test-crm-transactions.mjs` | OK — rollback, permissions, historique, idempotence et concurrence |
| `node --no-warnings --experimental-strip-types scripts/test-public-description.mjs` | OK |
| `git diff --check` | OK — avertissements de fin de ligne uniquement |

## État Supabase

Le projet lié est `tjvozbcnkimfgwonslzm`. Les migrations 001 à 030 sont présentes à distance ; la migration 031 est locale et reste à appliquer. La commande de prévisualisation a bien ciblé le projet, mais l’authentification PostgreSQL a refusé la connexion (`cli_login_postgres`, mot de passe absent). Aucun changement de production n’a donc été écrit par cette vérification.

Avant activation en production, fournir le mot de passe DB Supabase au CLI, exécuter `supabase db push --linked`, puis rejouer le contrôle des RPC et des contraintes. Ne pas annoncer le CRM atomique comme actif tant que cette étape n’est pas attestée.

## Livraison web

Le projet Vercel lu localement est `immo`, avec le domaine de production configuré séparément. Le build local est prêt ; le déploiement doit être lancé après application de la migration 031 et contrôle de l’alias `bogbesgroup.com`.
