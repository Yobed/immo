-- Preserve the full WhatsApp handoff when a commercial replies from the official device.
-- The device cannot identify the individual user, so the event records actor_type=commercial.
BEGIN;

ALTER TABLE public.crm_events DROP CONSTRAINT IF EXISTS crm_events_event_type_check;
ALTER TABLE public.crm_events ADD CONSTRAINT crm_events_event_type_check CHECK (
  event_type IN ('created','status_changed','assigned','note_added','reminder_set','contacted',
    'visit_scheduled','visit_completed','won','lost','merged','validation_changed',
    'visit_outcome_recorded','human_reply')
);

CREATE OR REPLACE FUNCTION public.crm_record_human_whatsapp_reply(
  p_phone text,
  p_jid text,
  p_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  actor_role text := current_setting('request.jwt.claim.role', true);
  raw_digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  local_digits text;
  prospect_row public.prospects;
  event_id uuid;
  clean_message text := nullif(btrim(p_message), '');
  status_changed boolean := false;
BEGIN
  IF actor_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;

  IF clean_message IS NULL OR length(clean_message) > 4000 THEN
    RAISE EXCEPTION 'WhatsApp message is empty or too long' USING ERRCODE = '22023';
  END IF;

  -- Match both the canonical local number stored by captureProspect and the
  -- E.164 number sent by Wasender, including legacy 8-digit CI numbers.
  local_digits := CASE
    WHEN raw_digits LIKE '225%' AND length(raw_digits) > 10 THEN substring(raw_digits FROM 4)
    ELSE raw_digits
  END;

  SELECT p.* INTO prospect_row
  FROM public.prospects p
  WHERE p.merged_into IS NULL
    AND regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') IN (
      raw_digits,
      local_digits,
      CASE WHEN left(local_digits, 1) = '0' THEN substring(local_digits FROM 2) ELSE '0' || local_digits END,
      CASE WHEN left(local_digits, 1) = '0' THEN '225' || local_digits ELSE '2250' || local_digits END
    )
  ORDER BY p.last_seen DESC NULLS LAST, p.id
  LIMIT 1;

  IF prospect_row.id IS NULL THEN
    RETURN jsonb_build_object('prospect_id', null, 'event_id', null, 'status_changed', false);
  END IF;

  IF prospect_row.statut = 'nouveau' THEN
    UPDATE public.prospects
    SET statut = 'contacte', statut_changed_at = now(), version = version + 1
    WHERE id = prospect_row.id;
    status_changed := true;
  END IF;

  INSERT INTO public.crm_events(
    prospect_id, entity_type, entity_id, actor_id, origin, event_type,
    from_status, to_status, note, metadata
  ) VALUES (
    prospect_row.id,
    'prospect',
    prospect_row.id,
    NULL,
    'human',
    'human_reply',
    CASE WHEN status_changed THEN prospect_row.statut ELSE NULL END,
    CASE WHEN status_changed THEN 'contacte' ELSE prospect_row.statut END,
    clean_message,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'channel', 'whatsapp',
      'actor_type', 'commercial',
      'jid', p_jid
    )
  )
  RETURNING id INTO event_id;

  RETURN jsonb_build_object(
    'prospect_id', prospect_row.id,
    'event_id', event_id,
    'status_changed', status_changed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.crm_record_human_whatsapp_reply(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_record_human_whatsapp_reply(text, text, text, jsonb) TO service_role;

COMMIT;
