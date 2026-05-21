-- Migration 018 : Étendre contact_requests pour supporter les offres flash WhatsApp.
-- Le proprio scrapé n'a pas de profil sur la plateforme.
-- L'admin (conseiller BOGBE'S) contacte ensuite le proprio depuis flash_owner_phone.

-- bien_id / proprietaire_id deviennent optionnels (uniquement requis pour source='web')
ALTER TABLE public.contact_requests
  ALTER COLUMN bien_id DROP NOT NULL;

ALTER TABLE public.contact_requests
  ALTER COLUMN proprietaire_id DROP NOT NULL;

-- Référence vers le bien scrapé côté locaux (Supabase distinct → pas de FK croisée)
ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS locaux_id bigint;

-- Téléphone du propriétaire scrapé (copié au moment de la demande
-- pour ne pas dépendre d'une lecture cross-projet à chaque consultation).
-- N'est JAMAIS retourné au client — admin-only via RLS.
ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS flash_owner_phone text;

-- Titre figé du bien (le bien locaux peut expirer ou être supprimé du scraping)
ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS flash_titre text;

-- Élargir la contrainte source pour accepter 'flash'
ALTER TABLE public.contact_requests
  DROP CONSTRAINT IF EXISTS contact_requests_source_check;

ALTER TABLE public.contact_requests
  ADD CONSTRAINT contact_requests_source_check
  CHECK (source IN ('web', 'whatsapp', 'flash'));

-- Garde-fou : exactement une des deux sources (bien interne OU offre flash)
ALTER TABLE public.contact_requests
  DROP CONSTRAINT IF EXISTS contact_requests_target_exclusive;

ALTER TABLE public.contact_requests
  ADD CONSTRAINT contact_requests_target_exclusive
  CHECK (
    (bien_id IS NOT NULL AND locaux_id IS NULL)
    OR (bien_id IS NULL AND locaux_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS contact_requests_locaux_idx
  ON public.contact_requests(locaux_id)
  WHERE locaux_id IS NOT NULL;
