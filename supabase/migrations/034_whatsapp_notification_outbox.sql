-- Durable retry metadata for WhatsApp notifications.
-- Existing rows remain valid; only new failed sends become retryable.
BEGIN;

ALTER TABLE public.whatsapp_notifications
  ADD COLUMN IF NOT EXISTS message_body text,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

CREATE INDEX IF NOT EXISTS wa_notif_retry_idx
  ON public.whatsapp_notifications(next_retry_at, created_at)
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;

COMMIT;
