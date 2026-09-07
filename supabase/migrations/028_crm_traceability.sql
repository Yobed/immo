-- CRM : référentiel commun, motifs normalisés, relances et journal immuable.
-- Cette migration complète 027 et doit être appliquée sur le projet Supabase.

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS perte_motif text,
  ADD COLUMN IF NOT EXISTS prochaine_action text,
  ADD COLUMN IF NOT EXISTS prochaine_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS statut_changed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS statut_changed_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS loss_reason text;

ALTER TABLE public.visites
  ADD COLUMN IF NOT EXISTS prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS loss_reason text,
  ADD COLUMN IF NOT EXISTS outcome_note text,
  ADD COLUMN IF NOT EXISTS outcome_at timestamptz;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS loss_reason text;

CREATE TABLE IF NOT EXISTS public.crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('prospect','contact','visite','reservation')),
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('created','status_changed','assigned','note_added','reminder_set','contacted','visit_scheduled','visit_completed','won','lost')),
  from_status text,
  to_status text,
  reason_code text,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_events_prospect_idx ON public.crm_events(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_events_entity_idx ON public.crm_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_followups_idx ON public.prospects(prochaine_action_at) WHERE prochaine_action_at IS NOT NULL;

ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read crm events" ON public.crm_events;
CREATE POLICY "Admins read crm events" ON public.crm_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins create crm events" ON public.crm_events;
CREATE POLICY "Admins create crm events" ON public.crm_events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
