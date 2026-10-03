-- 037_agent_memory_hindsight.sql
-- Architecture de mémoire d'agent biomimétique (Hindsight pattern)
-- Conçue pour être 100% résiliente et s'exécuter sur n'importe quel projet Supabase

-- 1. Table des expériences (interactions atomiques multi-canaux)
CREATE TABLE IF NOT EXISTS public.prospect_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid,
  entity_id text NOT NULL, -- téléphone canonique ou ID client web
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'web', 'crm', 'system')),
  type text NOT NULL CHECK (type IN ('message', 'property_view', 'visit_request', 'objection', 'preference_stated', 'feedback')),
  content text NOT NULL,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', 'objection')),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospect_experiences_entity_created 
  ON public.prospect_experiences(entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospect_experiences_prospect_id 
  ON public.prospect_experiences(prospect_id);

-- 2. Table des modèles mentaux (synthèse cognitive persistante)
CREATE TABLE IF NOT EXISTS public.prospect_mental_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id text NOT NULL UNIQUE, -- Clé unique : téléphone canonique ou ID web
  prospect_id uuid,
  summary text NOT NULL DEFAULT '',
  preferences jsonb NOT NULL DEFAULT '{
    "budget_min": null,
    "budget_max": null,
    "transaction_type": null,
    "property_types": [],
    "preferred_communes": [],
    "preferred_quartiers": [],
    "min_bedrooms": null,
    "required_amenities": [],
    "forbidden_criteria": []
  }'::jsonb,
  objections text[] NOT NULL DEFAULT ARRAY[]::text[],
  decision_stage text NOT NULL DEFAULT 'discovery' 
    CHECK (decision_stage IN ('discovery', 'qualifying', 'evaluating', 'ready_to_visit', 'negotiating', 'closed_won', 'closed_lost')),
  confidence_score numeric(3,2) DEFAULT 0.50,
  interaction_count integer NOT NULL DEFAULT 0,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  last_reflected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mental_models_entity_id 
  ON public.prospect_mental_models(entity_id);

CREATE INDEX IF NOT EXISTS idx_mental_models_prospect_id 
  ON public.prospect_mental_models(prospect_id);

CREATE INDEX IF NOT EXISTS idx_mental_models_last_interaction 
  ON public.prospect_mental_models(last_interaction_at DESC);

-- 3. Sécurité RLS
ALTER TABLE public.prospect_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_mental_models ENABLE ROW LEVEL SECURITY;

-- 4. Liaison automatique conditionnelle (si la table prospects ou profiles existe)
DO $$
BEGIN
  -- Lier à la table prospects si elle existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prospects') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_experiences_prospect' AND table_name = 'prospect_experiences'
    ) THEN
      ALTER TABLE public.prospect_experiences 
        ADD CONSTRAINT fk_experiences_prospect FOREIGN KEY (prospect_id) REFERENCES public.prospects(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_mental_models_prospect' AND table_name = 'prospect_mental_models'
    ) THEN
      ALTER TABLE public.prospect_mental_models 
        ADD CONSTRAINT fk_mental_models_prospect FOREIGN KEY (prospect_id) REFERENCES public.prospects(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Lier aux profils admin pour le RLS si la table profiles existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP POLICY IF EXISTS "Admins read prospect experiences" ON public.prospect_experiences;
    CREATE POLICY "Admins read prospect experiences" ON public.prospect_experiences 
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

    DROP POLICY IF EXISTS "Admins manage prospect mental models" ON public.prospect_mental_models;
    CREATE POLICY "Admins manage prospect mental models" ON public.prospect_mental_models 
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
