-- Migration 012: WhatsApp RDV + Broadcast features

-- Allow WhatsApp-sourced visites (no registered locataire required)
ALTER TABLE public.visites ALTER COLUMN locataire_id DROP NOT NULL;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS client_jid text;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS client_phone text;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web'
  CHECK (source IN ('web', 'whatsapp'));

-- Index for WhatsApp JID lookups
CREATE INDEX IF NOT EXISTS visites_client_jid_idx ON public.visites(client_jid);

-- Track broadcast campaigns sent via WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bien_id uuid NOT NULL REFERENCES public.biens(id) ON DELETE CASCADE,
  message text NOT NULL,
  recipients jsonb NOT NULL DEFAULT '[]',
  sent_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS broadcasts_bien_idx ON public.whatsapp_broadcasts(bien_id);

ALTER TABLE public.whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaire voit ses broadcasts"
  ON public.whatsapp_broadcasts FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Service role insert broadcasts"
  ON public.whatsapp_broadcasts FOR INSERT
  WITH CHECK (true);
