# Durcissement production — points 3 à 8 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renforcer l’observabilité, la performance, le CRM, l’espace admin et la sécurité sans toucher aux fichiers marketing.

**Architecture:** Réutiliser les briques existantes et ajouter des changements additifs. Les mutations CRM restent derrière les RPC atomiques ; les contrôles de santé et les métriques ne renvoient jamais de secrets ni de données propriétaires.

**Tech Stack:** Next.js 15, Supabase/PostgreSQL, TypeScript, Expo 54, npm workspaces.

---

## Chunk 1 — Observabilité et sécurité

**Files:**
- Create: `apps/web/app/api/health/route.ts`
- Modify: `apps/web/middleware.ts`, `apps/web/lib/rate-limit.ts`, `apps/web/app/api/client-error/route.ts`
- Test: `scripts/test-production-surfaces.mjs`

- [ ] Ajouter une route health sans PII, avec statut Supabase/catalogue et code HTTP 503 en cas de panne.
- [ ] Appliquer des headers CSP, HSTS, anti-sniffing, frame-ancestors et referrer policy sans casser les ressources existantes.
- [ ] Vérifier le rate limiting sur contact, flash-contact, visites, réservations et erreurs client.
- [ ] Tester 200/503, absence de secrets et refus des routes sensibles.

## Chunk 2 — Catalogue et médias

**Files:**
- Create: `supabase/migrations/032_catalogue_performance.sql`
- Modify: `apps/web/lib/catalogue/consolidated.ts`, `apps/web/app/api/mobile/annonces/route.ts`, `apps/web/app/api/mobile/annonces/[id]/route.ts`
- Test: `scripts/test-catalogue-contract.mjs`

- [ ] Ajouter les indexes `v_annonces`/tables sources nécessaires après vérification du schéma réel.
- [ ] Garantir un tri stable avec identifiant secondaire et limites validées.
- [ ] Renvoyer une erreur explicite quand la source échoue, jamais un total zéro silencieux sur les APIs publiques.
- [ ] Vérifier fallback photo, URL canonique, prix/périodicité et recherche avec caractères spéciaux.

## Chunk 3 — CRM et espace admin

**Files:**
- Modify: `apps/web/app/admin/performance/page.tsx`, `apps/web/app/admin/prospects/page.tsx`, `apps/web/app/admin/suivi/page.tsx`, `apps/web/app/admin/errors/page.tsx`
- Create: `apps/web/components/admin/ActionQueue.tsx`
- Test: `supabase/tests/crm_atomic_operations.sql`, `scripts/test-admin-contract.mjs`

- [ ] Centraliser les alertes de la file d’action immédiate et ajouter des liens filtrés.
- [ ] Ajouter filtres persistants, états vides utiles et actions groupées avec confirmation.
- [ ] Afficher qualité des données et délais sans mélange de cohortes.
- [ ] Vérifier accès administrateur, permissions et absence de contact propriétaire dans les vues prospect.

## Chunk 4 — Livraison et validation

**Files:**
- Modify: `apps/web/components/landing/PremiumShowcase.tsx`, `docs/verification/2026-09-08-livraison-hardening.md`

- [ ] Commiter séparément le lien `/support` déjà présent en production.
- [ ] Exécuter type-check web/mobile, tests SQL, contrats API, build web et `git diff --check`.
- [ ] Appliquer la migration après contrôle de cible Supabase.
- [ ] Déployer Vercel et vérifier routes publiques, admin protégé, health et API mobile.
