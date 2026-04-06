---
phase: 01-fondations-infrastructure
plan: 02
subsystem: database
tags: [supabase, postgresql, rls, migrations, typescript, triggers]
dependency_graph:
  requires: []
  provides:
    - supabase/migrations/001_profiles.sql
    - supabase/migrations/002_biens.sql
    - supabase/migrations/003_biens_medias.sql
    - supabase/migrations/004_reservations.sql
    - supabase/migrations/005_contrats_quittances.sql
    - supabase/migrations/006_messagerie.sql
    - supabase/migrations/007_visites_avis.sql
    - supabase/migrations/008_notifications_analytics.sql
    - packages/shared/types/database.ts
  affects:
    - All plans requiring Supabase tables (auth, biens CRUD, reservations, messaging, payments)
tech_stack:
  added:
    - Supabase PostgreSQL migrations (versioned SQL)
    - Row Level Security (RLS) on all 14 tables
    - tsvector full-text search (French) on biens
  patterns:
    - handle_new_user trigger with SECURITY DEFINER for safe profile creation
    - set_updated_at() shared function for updated_at automation
    - FK dependency chain: profiles → biens → biens_medias → reservations → contrats → notifications
key_files:
  created:
    - supabase/migrations/001_profiles.sql
    - supabase/migrations/002_biens.sql
    - supabase/migrations/003_biens_medias.sql
    - supabase/migrations/004_reservations.sql
    - supabase/migrations/005_contrats_quittances.sql
    - supabase/migrations/006_messagerie.sql
    - supabase/migrations/007_visites_avis.sql
    - supabase/migrations/008_notifications_analytics.sql
    - packages/shared/types/database.ts
  modified: []
decisions:
  - "handle_new_user uses SECURITY DEFINER to bypass RLS during auth.users insert"
  - "set_updated_at() declared once in 001 and reused by all subsequent migrations"
  - "paiements table created in 008 (not a separate migration) to prepare Phase 3 CinetPay integration"
  - "database.ts is a manually-typed placeholder — must be regenerated via Supabase CLI after project creation"
  - "favoris table placed in 006_messagerie to avoid a separate 9th migration file"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 0
---

# Phase 1 Plan 02: Supabase Migrations with RLS and handle_new_user Summary

8 PostgreSQL migrations for the Immo CI platform Supabase schema — 14 tables, RLS on every table, handle_new_user trigger with SECURITY DEFINER, full-text search on biens, and TypeScript Database type placeholder.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrations 001 a 004 (profiles, biens, biens_medias, reservations) | b214a0a | 001_profiles.sql, 002_biens.sql, 003_biens_medias.sql, 004_reservations.sql |
| 2 | Migrations 005 a 008 + TypeScript types | 89b105b | 005_contrats_quittances.sql, 006_messagerie.sql, 007_visites_avis.sql, 008_notifications_analytics.sql, database.ts |

## Migrations Status

| File | Tables | RLS Policies | Status |
|------|--------|-------------|--------|
| 001_profiles.sql | profiles | 3 (select public, update own, insert own) | Placeholder — apply via Supabase SQL Editor |
| 002_biens.sql | biens | 5 (select publie, select own, insert, update, delete) | Placeholder |
| 003_biens_medias.sql | biens_medias | 3 (select publie, select own, manage own) | Placeholder |
| 004_reservations.sql | reservations | 4 (locataire select, proprio select, insert, update) | Placeholder |
| 005_contrats_quittances.sql | contrats, quittances | 3 + 4 = 7 | Placeholder |
| 006_messagerie.sql | conversations, messages, favoris | 3 + 2 + 1 = 6 | Placeholder |
| 007_visites_avis.sql | visites, avis | 4 + 3 = 7 | Placeholder |
| 008_notifications_analytics.sql | notifications, analytics_events, paiements | 3 + 2 + 3 = 8 | Placeholder |

**Total: 14 tables, 8 migrations, 43 RLS policies**

Note: "paiements" is defined in 008 to prepare Phase 3 CinetPay integration without adding a 9th migration.
Note: "favoris" is defined in 006 alongside messaging to keep the migration count at 8.

## Key Tables Created

| Table | Role |
|-------|------|
| profiles | Users: locataire / proprietaire / agence / admin — auto-created by trigger |
| biens | Property listings with full-text search (French tsvector) |
| biens_medias | Media: photos (Cloudinary), videos, 360 views, plans — composite index bien_id/ordre |
| reservations | Full reservation lifecycle: en_attente → confirmee → terminee |
| contrats | Lease contracts with PDF storage in Supabase Storage |
| quittances | Monthly rent receipts — unique constraint (contrat_id, mois) |
| conversations | Messaging threads — unique per (participant_1, participant_2, bien_id) |
| messages | Individual messages with Supabase Realtime (activate in Dashboard) |
| favoris | User-saved properties — unique (user_id, bien_id) |
| visites | Visit requests and confirmations |
| avis | Bidirectional reviews locataire <-> proprietaire |
| notifications | Unified notification center |
| analytics_events | Behavioral tracking: vue_bien, contact, reservation, signature |
| paiements | CinetPay transactions (Phase 3) — wave/orange_money/mtn/moov/carte_bancaire |

## Critical Patterns

### handle_new_user Trigger
- Location: 001_profiles.sql
- Fires: AFTER INSERT ON auth.users
- Uses SECURITY DEFINER to bypass RLS (required — the trigger runs as the inserting user who has no access to profiles table)
- Reads role and full_name from raw_user_meta_data (supports email, Google OAuth, OTP)
- Uses COALESCE to default role to 'locataire'

### FK Dependency Order (must not be violated)
```
profiles (001) — no external FK
  biens (002) — FK → profiles
    biens_medias (003) — FK → biens
    reservations (004) — FK → biens, profiles
      contrats (005) — FK → reservations, profiles, biens
        quittances (005) — FK → contrats, profiles
  conversations (006) — FK → profiles, biens (nullable)
    messages (006) — FK → conversations, profiles
  favoris (006) — FK → profiles, biens
  visites (007) — FK → biens, profiles
  avis (007) — FK → profiles, reservations (nullable)
  notifications (008) — FK → profiles
  analytics_events (008) — FK → profiles (nullable), biens (nullable)
  paiements (008) — FK → reservations (nullable), profiles
```

## TypeScript Types (packages/shared/types/database.ts)

Status: **Placeholder** — manually typed to match all 14 tables.

Must be regenerated after Supabase project creation:
```bash
npx supabase gen types typescript \
  --project-id <REFERENCE_ID> \
  > packages/shared/types/database.ts
```

Steps to regenerate:
1. Create Supabase project at https://app.supabase.com
2. Apply migrations 001 to 008 via SQL Editor in order
3. Get Reference ID: Project Settings > General > Reference ID
4. Run the command above

## How to Apply Migrations

### Option A — Supabase Dashboard SQL Editor (recommended for first setup)
1. Open https://app.supabase.com > your project > SQL Editor
2. Paste and execute each file in order: 001, 002, 003, 004, 005, 006, 007, 008
3. Verify each succeeds before moving to the next

### Option B — Supabase CLI
```bash
# Requires local Supabase config (supabase/config.toml)
npx supabase db push --project-id $SUPABASE_PROJECT_ID
```

### Post-migration — Activate Realtime on messages
Dashboard > Database > Replication > Enable on "messages" table

## Deviations from Plan

None — plan executed exactly as written.

The only note: `favoris` table was specified in the plan inside 006_messagerie.sql, which this migration follows exactly. This keeps the count at 8 migration files covering 14 tables.

## Known Stubs

`packages/shared/types/database.ts` is a manually-typed placeholder with complete Row/Insert/Update types for all 14 tables. It will be replaced by the Supabase CLI-generated version in Plan 01-03 or after the Supabase project is created and migrations are applied.

The stub correctly covers all tables and does not block any TypeScript compilation — it is intentional and documented.

## Self-Check: PASSED

Files verified:
- supabase/migrations/001_profiles.sql — FOUND, contains handle_new_user, on_auth_user_created, ENABLE ROW LEVEL SECURITY
- supabase/migrations/003_biens_medias.sql — FOUND, contains biens_medias_bien_ordre_idx
- supabase/migrations/008_notifications_analytics.sql — FOUND, contains analytics_events, paiements
- packages/shared/types/database.ts — FOUND, contains Database interface

Commits verified:
- b214a0a — feat(01-02): add migrations 001-004 — FOUND
- 89b105b — feat(01-02): add migrations 005-008 and TypeScript database types — FOUND

RLS check: 8/8 migration files contain ENABLE ROW LEVEL SECURITY
