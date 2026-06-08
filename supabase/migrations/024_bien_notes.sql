-- Migration 024 : Notes & commentaires sur les biens
--
-- Deux types de notes :
--   1. notes CLIENT (publiques ou privées sur leurs favoris) — leur ressenti
--   2. notes ADMIN/AGENCE (internes, jamais visibles publiquement) — infos
--      commerciales (proprio négociable, zone hot, contrat à renouveler...)
--
-- Une seule table avec un champ `audience` pour distinguer.

CREATE TABLE IF NOT EXISTS public.bien_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id         uuid NOT NULL REFERENCES public.biens(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  /**
   * Audience :
   *   - 'client_private' : note perso du client (visible seulement par lui)
   *   - 'admin_internal' : note interne commerciale (visible par tout admin)
   */
  audience        text NOT NULL CHECK (audience IN ('client_private', 'admin_internal')),
  content         text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index pour lecture rapide par bien
CREATE INDEX IF NOT EXISTS bien_notes_bien_idx ON public.bien_notes(bien_id, created_at DESC);
-- Index pour lecture rapide par auteur (mes notes)
CREATE INDEX IF NOT EXISTS bien_notes_author_idx ON public.bien_notes(author_id, created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.bien_notes_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bien_notes_updated_at ON public.bien_notes;
CREATE TRIGGER bien_notes_updated_at
  BEFORE UPDATE ON public.bien_notes
  FOR EACH ROW EXECUTE FUNCTION public.bien_notes_set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE public.bien_notes ENABLE ROW LEVEL SECURITY;

-- Lecture :
--   - Note 'client_private' : visible UNIQUEMENT par son auteur
--   - Note 'admin_internal' : visible UNIQUEMENT par les admins
DROP POLICY IF EXISTS "bien_notes_read_own_or_admin" ON public.bien_notes;
CREATE POLICY "bien_notes_read_own_or_admin"
  ON public.bien_notes FOR SELECT
  USING (
    (audience = 'client_private' AND author_id = auth.uid())
    OR (audience = 'admin_internal' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ))
  );

-- Insert :
--   - Client connecté : peut créer ses propres notes 'client_private'
--   - Admin connecté : peut créer ses notes 'admin_internal'
DROP POLICY IF EXISTS "bien_notes_insert_own" ON public.bien_notes;
CREATE POLICY "bien_notes_insert_own"
  ON public.bien_notes FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      audience = 'client_private'
      OR (audience = 'admin_internal' AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- Update : auteur seulement (jamais possible de modifier la note d'un autre)
DROP POLICY IF EXISTS "bien_notes_update_own" ON public.bien_notes;
CREATE POLICY "bien_notes_update_own"
  ON public.bien_notes FOR UPDATE
  USING (author_id = auth.uid());

-- Delete : auteur seulement
DROP POLICY IF EXISTS "bien_notes_delete_own" ON public.bien_notes;
CREATE POLICY "bien_notes_delete_own"
  ON public.bien_notes FOR DELETE
  USING (author_id = auth.uid());
