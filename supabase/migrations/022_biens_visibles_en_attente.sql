-- Migration 022 : Biens en attente de validation visibles publiquement
--
-- Règle métier : la recherche de la plateforme ET l'agent IA Sapphire doivent
-- retourner TOUS les biens enregistrés (validés OU en attente de validation),
-- en plus des offres flash. La validation admin devient un signal de confiance
-- (badge « Vérifié » + tri), et non plus un filtre de visibilité.
--
-- Statuts publics : 'publie' (validé) + 'en_attente' (enregistré, non validé).
-- Restent masqués : 'brouillon' (incomplet), 'refuse', 'suspendu', 'archive', 'loue'.
--
-- ⚠️ Doit rester cohérent avec apps/web/lib/catalogue/statuts.ts (STATUTS_PUBLICS).
-- Dépendances : 002_biens, 003_biens_medias, 020_catalogue_perf_indexes, 021_biens_validation
-- Idempotent (DROP IF EXISTS / CREATE IF NOT EXISTS) — applicable en direct.

-- ─── 1) Policy SELECT publique sur biens : publie + en_attente ────────────────
DROP POLICY IF EXISTS "Biens publiés visibles par tous" ON public.biens;
DROP POLICY IF EXISTS "Biens visibles par tous (publie + en attente)" ON public.biens;
CREATE POLICY "Biens visibles par tous (publie + en attente)"
  ON public.biens FOR SELECT
  USING (statut IN ('publie', 'en_attente'));

-- ─── 2) Médias : visibles pour les biens publie + en_attente ─────────────────
DROP POLICY IF EXISTS "Médias des biens publiés visibles par tous" ON public.biens_medias;
DROP POLICY IF EXISTS "Médias des biens visibles par tous" ON public.biens_medias;
CREATE POLICY "Médias des biens visibles par tous"
  ON public.biens_medias FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.biens
      WHERE id = bien_id AND statut IN ('publie', 'en_attente')
    )
  );

-- ─── 3) Index partiels du catalogue : élargir à en_attente ───────────────────
-- Les index de 020 ne couvraient que statut='publie' ; on les recrée pour
-- couvrir les deux statuts afin de garder la recherche rapide.
DROP INDEX IF EXISTS public.biens_listing_idx;
CREATE INDEX IF NOT EXISTS biens_listing_idx
  ON public.biens (is_verifie DESC, score_ia DESC NULLS LAST, created_at DESC)
  WHERE statut IN ('publie', 'en_attente');

DROP INDEX IF EXISTS public.biens_commune_publie_idx;
CREATE INDEX IF NOT EXISTS biens_commune_publie_idx
  ON public.biens (commune)
  WHERE statut IN ('publie', 'en_attente');

DROP INDEX IF EXISTS public.biens_type_publie_idx;
CREATE INDEX IF NOT EXISTS biens_type_publie_idx
  ON public.biens (type_bien)
  WHERE statut IN ('publie', 'en_attente');

DROP INDEX IF EXISTS public.biens_prix_mois_idx;
CREATE INDEX IF NOT EXISTS biens_prix_mois_idx
  ON public.biens (prix_mois_fcfa)
  WHERE statut IN ('publie', 'en_attente') AND prix_mois_fcfa IS NOT NULL;

DROP INDEX IF EXISTS public.biens_prix_nuit_idx;
CREATE INDEX IF NOT EXISTS biens_prix_nuit_idx
  ON public.biens (prix_nuit_fcfa)
  WHERE statut IN ('publie', 'en_attente') AND prix_nuit_fcfa IS NOT NULL;

DROP INDEX IF EXISTS public.biens_prix_vente_idx;
CREATE INDEX IF NOT EXISTS biens_prix_vente_idx
  ON public.biens (prix_vente_fcfa)
  WHERE statut IN ('publie', 'en_attente') AND prix_vente_fcfa IS NOT NULL;

-- Analyze immédiat pour que le planner adopte les nouveaux index.
ANALYZE public.biens;
ANALYZE public.biens_medias;
