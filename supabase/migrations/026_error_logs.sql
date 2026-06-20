-- Migration 026 : Table error_logs pour monitoring temps réel maison
--
-- Alternative à Sentry/Datadog pour l'MVP : on stocke les erreurs runtime
-- directement dans Supabase. Accessible via /admin/errors.
--
-- Avantages :
--   - Zéro dépendance externe
--   - Gratuit à vie
--   - Toutes les données restent chez nous
--   - Query SQL libre pour analyse
--
-- Limites par rapport à Sentry :
--   - Pas d'agrégation auto (à faire en SQL)
--   - Pas d'alerting (à brancher manuellement via webhook)
--   - Pas de source maps (logs traces brutes)
--   → suffisant pour MVP, à upgrader si besoin

CREATE TABLE IF NOT EXISTS public.error_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  /** 'error' (default) | 'warn' | 'info' */
  level           text NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warn', 'info')),
  /** Message principal de l'erreur (court, max 500 chars) */
  message         text NOT NULL,
  /** Stack trace complet (optionnel mais utile) */
  stack           text,
  /** Contexte additionnel JSON : route, user_id, params, etc. */
  context         jsonb DEFAULT '{}'::jsonb,
  /** Source : 'api', 'server-action', 'page', 'webhook', etc. */
  source          text,
  /** Route concernée (ex: '/api/reservations', '/biens/[id]') */
  route           text,
  /** User_id si l'erreur s'est produite dans le contexte d'un user connecté */
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  /** Fingerprint pour grouper les erreurs identiques (hash du message + route) */
  fingerprint     text,
  /** Status : 'open' (à investiguer) | 'investigating' | 'resolved' | 'ignored' */
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
  /** Compteur d'occurrences (pour éviter de spammer la table) */
  occurrence_count int NOT NULL DEFAULT 1,
  /** Dernière occurrence (pour tri "le plus récent") */
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index pour tri/recherche admin
CREATE INDEX IF NOT EXISTS error_logs_status_last_seen_idx
  ON public.error_logs(status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_fingerprint_idx
  ON public.error_logs(fingerprint);
CREATE INDEX IF NOT EXISTS error_logs_user_idx
  ON public.error_logs(user_id) WHERE user_id IS NOT NULL;

-- RLS : seul admin peut lire/modifier ; service_role (server) peut tout
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "error_logs_admin_read" ON public.error_logs;
CREATE POLICY "error_logs_admin_read"
  ON public.error_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "error_logs_admin_update" ON public.error_logs;
CREATE POLICY "error_logs_admin_update"
  ON public.error_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Pas de policy INSERT publique : seul service_role peut insérer (via lib/error-logger.ts)

-- Trigger : si un error_log avec le même fingerprint existe déjà,
-- on incrémente plutôt que d'insérer un nouveau row (évite l'explosion de la table)
CREATE OR REPLACE FUNCTION public.error_logs_dedup()
RETURNS trigger AS $$
DECLARE
  existing_id uuid;
BEGIN
  IF NEW.fingerprint IS NULL THEN RETURN NEW; END IF;

  -- Cherche un log identique récent (< 24h) avec même fingerprint
  SELECT id INTO existing_id FROM public.error_logs
    WHERE fingerprint = NEW.fingerprint
      AND status != 'resolved'
      AND last_seen_at > now() - interval '24 hours'
    ORDER BY last_seen_at DESC
    LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- On UPDATE le row existant au lieu d'insérer
    UPDATE public.error_logs
    SET occurrence_count = occurrence_count + 1,
        last_seen_at = now(),
        -- Si nouvelle stack ou context plus riche, on remplace
        stack = COALESCE(NEW.stack, stack),
        context = COALESCE(NEW.context, context)
    WHERE id = existing_id;
    RETURN NULL; -- abort INSERT
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS error_logs_dedup_trigger ON public.error_logs;
CREATE TRIGGER error_logs_dedup_trigger
  BEFORE INSERT ON public.error_logs
  FOR EACH ROW EXECUTE FUNCTION public.error_logs_dedup();

-- Nettoyage auto : suppression des erreurs résolues > 30 jours
-- (à exécuter manuellement ou via cron Supabase)
COMMENT ON TABLE public.error_logs IS
  'Logs erreurs runtime. Pour purge auto : DELETE FROM error_logs WHERE status=''resolved'' AND last_seen_at < now() - interval ''30 days'';';
