-- Migration 021 : Validation des annonces par l'admin
-- Cycle de vie : brouillon → en_attente (le proprio publie) → publie (admin approuve)
--                                                          ↘ refuse (admin rejette)
-- Dépendances : 002_biens
-- Idempotent (IF NOT EXISTS / DROP IF EXISTS) — applicable en direct.

-- 1) Élargir les valeurs de statut autorisées (+ en_attente, refuse ; on garde 'loue'
--    déjà utilisé côté code).
ALTER TABLE public.biens DROP CONSTRAINT IF EXISTS biens_statut_check;
ALTER TABLE public.biens
  ADD CONSTRAINT biens_statut_check
  CHECK (statut IN ('brouillon','en_attente','publie','refuse','suspendu','archive','loue'));

-- 2) Métadonnées de validation
ALTER TABLE public.biens
  ADD COLUMN IF NOT EXISTS soumis_le   timestamptz,
  ADD COLUMN IF NOT EXISTS valide_le   timestamptz,
  ADD COLUMN IF NOT EXISTS valide_par  uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS rejet_motif text;

-- 3) Index sur la file d'attente de validation
CREATE INDEX IF NOT EXISTS biens_en_attente_idx
  ON public.biens(created_at DESC)
  WHERE statut = 'en_attente';

-- 4) Garde-fou DB : seul un admin (ou le contexte serveur service_role, auth.uid() NULL)
--    peut passer une annonce à 'publie' ou 'refuse'. Le propriétaire ne peut que
--    faire brouillon <-> en_attente.
CREATE OR REPLACE FUNCTION public.enforce_bien_publication()
RETURNS trigger AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Contexte serveur (actions admin via service_role) : autorisé
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT (role = 'admin') INTO is_admin FROM public.profiles WHERE id = auth.uid();
  IF COALESCE(is_admin, false) THEN
    RETURN NEW;
  END IF;
  IF NEW.statut IN ('publie','refuse') AND NEW.statut IS DISTINCT FROM OLD.statut THEN
    RAISE EXCEPTION 'Seul un administrateur peut publier ou refuser une annonce';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS biens_enforce_publication ON public.biens;
CREATE TRIGGER biens_enforce_publication
  BEFORE UPDATE OF statut ON public.biens
  FOR EACH ROW EXECUTE FUNCTION public.enforce_bien_publication();
