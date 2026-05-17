-- Migration 017: Agent outreach pipeline
-- Détecte les agents immobiliers qui publient dans des groupes WhatsApp publics,
-- puis les invite par DM privé sur la plateforme.

-- 1) Prospects (agents identifiés depuis les groupes WhatsApp)
CREATE TABLE IF NOT EXISTS public.agent_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,                     -- E.164 sans +, ex: 2250544872051
  jid text,                                       -- jid complet ex: 2250544872051@s.whatsapp.net
  display_name text,                              -- pushName WhatsApp
  source_group_jid text,                          -- groupe d'où provient le 1er message (xxxx@g.us)
  source_group_name text,                         -- nom du groupe si connu
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  last_invited_at timestamptz,                    -- null si jamais invité
  invite_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new'              -- workflow
    CHECK (status IN ('new','queued','invited','responded','converted','opted_out','blocked')),
  opt_out boolean NOT NULL DEFAULT false,
  last_extraction jsonb,                          -- dernier ExtractedBien (zod)
  ad_count int NOT NULL DEFAULT 0,                -- nb d'annonces postées détectées
  notes text
);

CREATE INDEX IF NOT EXISTS agent_prospects_status_idx ON public.agent_prospects(status);
CREATE INDEX IF NOT EXISTS agent_prospects_last_invited_idx ON public.agent_prospects(last_invited_at);
CREATE INDEX IF NOT EXISTS agent_prospects_source_group_idx ON public.agent_prospects(source_group_jid);

-- 2) Log de chaque tentative d'envoi de DM
CREATE TABLE IF NOT EXISTS public.agent_outreach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.agent_prospects(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  template_key text NOT NULL,                     -- ex: 'invite_v1'
  message_body text NOT NULL,
  invite_token text NOT NULL UNIQUE,              -- token tracking conversion
  delivery_status text NOT NULL DEFAULT 'sent'    -- sent | failed | clicked | converted
    CHECK (delivery_status IN ('sent','failed','delivered','read','clicked','converted')),
  delivery_error text,
  clicked_at timestamptz,
  converted_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  converted_at timestamptz
);

CREATE INDEX IF NOT EXISTS outreach_log_prospect_idx ON public.agent_outreach_log(prospect_id);
CREATE INDEX IF NOT EXISTS outreach_log_token_idx ON public.agent_outreach_log(invite_token);
CREATE INDEX IF NOT EXISTS outreach_log_status_idx ON public.agent_outreach_log(delivery_status);

-- 3) RLS: ces tables ne sont accessibles qu'au service role (jamais aux clients)
ALTER TABLE public.agent_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_outreach_log ENABLE ROW LEVEL SECURITY;

-- Lecture admin-only via la table profiles (role='admin')
CREATE POLICY "Admins can read prospects"
  ON public.agent_prospects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can read outreach log"
  ON public.agent_outreach_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Aucun autre client (insert/update/delete) → service role uniquement
