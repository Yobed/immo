-- Migration 013 : Workflow d'intermédiation admin
-- L'admin (équipe) valide visites et réservations AVANT que le propriétaire soit notifié
-- Dépendances: 007_visites_avis, 004_reservations

-- =========================================
-- VISITES : colonnes de validation admin
-- =========================================
ALTER TABLE public.visites
  ADD COLUMN IF NOT EXISTS admin_validation_status text NOT NULL DEFAULT 'pending'
    CHECK (admin_validation_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS admin_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_validated_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS visitor_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS visites_admin_status_idx
  ON public.visites(admin_validation_status)
  WHERE admin_validation_status = 'pending';

-- Admin (rôle = 'admin') peut voir et modifier toutes les visites
DROP POLICY IF EXISTS "Admin voit toutes les visites" ON public.visites;
CREATE POLICY "Admin voit toutes les visites"
  ON public.visites FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin valide les visites" ON public.visites;
CREATE POLICY "Admin valide les visites"
  ON public.visites FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- =========================================
-- RESERVATIONS : colonnes de validation admin
-- =========================================
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS admin_validation_status text NOT NULL DEFAULT 'pending'
    CHECK (admin_validation_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS admin_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_validated_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS visitor_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS reservations_admin_status_idx
  ON public.reservations(admin_validation_status)
  WHERE admin_validation_status = 'pending';

DROP POLICY IF EXISTS "Admin voit toutes les reservations" ON public.reservations;
CREATE POLICY "Admin voit toutes les reservations"
  ON public.reservations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin valide les reservations" ON public.reservations;
CREATE POLICY "Admin valide les reservations"
  ON public.reservations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- =========================================
-- Journal des notifications WhatsApp (audit + suivi)
-- =========================================
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone        text NOT NULL,
  recipient_role  text NOT NULL CHECK (recipient_role IN ('admin','owner','visitor')),
  template        text NOT NULL,
  related_type    text CHECK (related_type IN ('visite','reservation','contact_request')),
  related_id      uuid,
  payload         jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','sent','delivered','read','failed')),
  external_id     text,
  error_message   text,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wa_notif_related_idx
  ON public.whatsapp_notifications(related_type, related_id);
CREATE INDEX IF NOT EXISTS wa_notif_status_idx
  ON public.whatsapp_notifications(status);

ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin voit toutes les notifs WA"
  ON public.whatsapp_notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
