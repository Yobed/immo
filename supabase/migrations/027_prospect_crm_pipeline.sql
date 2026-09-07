-- CRM prospects : pipeline commercial et journal de traçabilité.
-- À appliquer après les migrations existantes.
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS perte_motif text,
  ADD COLUMN IF NOT EXISTS prochaine_action text,
  ADD COLUMN IF NOT EXISTS prochaine_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS statut_changed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS statut_changed_by uuid REFERENCES public.profiles(id);

CREATE TABLE IF NOT EXISTS public.prospect_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('status_change','note','assignment','reminder','contact','visit','reservation')),
  from_status text,
  to_status text,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prospect_activities_prospect_idx ON public.prospect_activities(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS prospects_next_action_idx ON public.prospects(prochaine_action_at) WHERE prochaine_action_at IS NOT NULL;

ALTER TABLE public.prospect_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read prospect activities" ON public.prospect_activities;
CREATE POLICY "Admins read prospect activities" ON public.prospect_activities FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins create prospect activities" ON public.prospect_activities;
CREATE POLICY "Admins create prospect activities" ON public.prospect_activities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
