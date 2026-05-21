-- Performance indexes for the consolidated catalogue queries.
--
-- Context: /catalogue, homepage, Sapphire AI and SimilarBiens all hit `biens`
-- with `statut = 'publie'` + ordering by `is_verifie DESC, score_ia DESC, created_at DESC`,
-- and pull a small set of `biens_medias` rows per bien (cover + a few extras).
--
-- Without these indexes Postgres falls back to sequential scans + bitmap heap
-- joins which add ~50–80ms on a 2k-row table. With them, the planner can use
-- index-only scans for the listing and a covered nested-loop for the medias.

-- ── biens listing index ─────────────────────────────────────────────────────
-- Matches: WHERE statut='publie' ORDER BY is_verifie DESC, score_ia DESC NULLS LAST, created_at DESC
-- Partial index keeps it tight (only published biens are ever queried this way).
CREATE INDEX IF NOT EXISTS biens_listing_idx
  ON public.biens (is_verifie DESC, score_ia DESC NULLS LAST, created_at DESC)
  WHERE statut = 'publie';

-- ── biens commune filter (used by SimilarBiensSection + /recherche) ─────────
CREATE INDEX IF NOT EXISTS biens_commune_publie_idx
  ON public.biens (commune)
  WHERE statut = 'publie';

-- ── biens type_bien filter (catalogue + similar) ────────────────────────────
CREATE INDEX IF NOT EXISTS biens_type_publie_idx
  ON public.biens (type_bien)
  WHERE statut = 'publie';

-- ── biens prix range OR-query (catalogue prix filter on 3 columns) ──────────
-- Postgres can't use a single index for the 3-column OR; we add one per column
-- with the publie filter so each branch is fast.
CREATE INDEX IF NOT EXISTS biens_prix_mois_idx
  ON public.biens (prix_mois_fcfa)
  WHERE statut = 'publie' AND prix_mois_fcfa IS NOT NULL;

CREATE INDEX IF NOT EXISTS biens_prix_nuit_idx
  ON public.biens (prix_nuit_fcfa)
  WHERE statut = 'publie' AND prix_nuit_fcfa IS NOT NULL;

CREATE INDEX IF NOT EXISTS biens_prix_vente_idx
  ON public.biens (prix_vente_fcfa)
  WHERE statut = 'publie' AND prix_vente_fcfa IS NOT NULL;

-- ── biens_medias cover-first lookup (the .limit(6, {foreignTable}) JOIN) ────
-- Matches: WHERE bien_id IN (...) ORDER BY est_couverture DESC, ordre ASC
CREATE INDEX IF NOT EXISTS biens_medias_cover_idx
  ON public.biens_medias (bien_id, est_couverture DESC, ordre ASC);

-- Analyze immediately so the planner picks the new indexes on the next query.
ANALYZE public.biens;
ANALYZE public.biens_medias;
