-- Migration 014 : Demandes de contact propriétaire
-- Workflow d'intermédiation pour partager le numéro WhatsApp du proprio
-- Le numéro n'est jamais affiché publiquement ; le visiteur doit demander,
-- l'admin valide, puis le visiteur reçoit le numéro par WhatsApp.

CREATE TABLE IF NOT EXISTS public.contact_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id         uuid NOT NULL REFERENCES public.biens(id) ON DELETE CASCADE,
  proprietaire_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Visiteur : connecté ou pas
  visitor_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_name    text,
  visitor_phone   text,
  visitor_email   text,

  reason          text,

  admin_validation_status text NOT NULL DEFAULT 'pending'
    CHECK (admin_validation_status IN ('pending','approved','rejected')),
  admin_validated_at timestamptz,
  admin_validated_by uuid REFERENCES public.profiles(id),
  admin_note      text,

  admin_notified_at   timestamptz,
  visitor_notified_at timestamptz,
  owner_notified_at   timestamptz,

  source          text NOT NULL DEFAULT 'web' CHECK (source IN ('web','whatsapp')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_requests_bien_idx ON public.contact_requests(bien_id);
CREATE INDEX IF NOT EXISTS contact_requests_status_idx
  ON public.contact_requests(admin_validation_status)
  WHERE admin_validation_status = 'pending';
CREATE INDEX IF NOT EXISTS contact_requests_visitor_idx ON public.contact_requests(visitor_id);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visiteur voit ses demandes"
  ON public.contact_requests FOR SELECT
  USING (visitor_id = auth.uid());

CREATE POLICY "Visiteur crée une demande"
  ON public.contact_requests FOR INSERT
  WITH CHECK (visitor_id = auth.uid() OR visitor_id IS NULL);

CREATE POLICY "Admin voit toutes les demandes"
  ON public.contact_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admin valide les demandes"
  ON public.contact_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE TRIGGER contact_requests_updated_at
  BEFORE UPDATE ON public.contact_requests
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
