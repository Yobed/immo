-- CRM intake integrity: canonical phones, atomic duplicate guards, and links.
-- This migration never deletes historical requests. Existing duplicates keep a
-- NULL fingerprint and remain visible for manual reconciliation.
BEGIN;

CREATE OR REPLACE FUNCTION public.crm_normalize_phone(raw text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
  WITH digits AS (SELECT regexp_replace(coalesce(raw,''), '[^0-9]', '', 'g') AS n),
  stripped AS (SELECT CASE WHEN n LIKE '00%' THEN substring(n FROM 3) ELSE n END AS n FROM digits)
  SELECT CASE
    WHEN n ~ '^0[0-9]{9}$' THEN '225'||n
    WHEN n ~ '^2250[0-9]{9}$' THEN n
    -- Legacy Côte d'Ivoire numbers without the 05/07/01 prefix.
    WHEN n ~ '^225[0-9]{8,9}$' THEN n
    WHEN n ~ '^[0-9]{8,9}$' THEN '225'||n
    WHEN trim(coalesce(raw,'')) ~ '^\+' AND n ~ '^[1-9][0-9]{7,14}$' AND n NOT LIKE '225%' THEN n
    WHEN trim(coalesce(raw,'')) ~ '^00' AND n ~ '^[1-9][0-9]{7,14}$' AND n NOT LIKE '225%' THEN n
    ELSE NULL
  END FROM stripped
$$;

ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS visitor_phone_normalized text,
  ADD COLUMN IF NOT EXISTS intake_fingerprint text;
ALTER TABLE public.visites
  ADD COLUMN IF NOT EXISTS client_phone_normalized text,
  ADD COLUMN IF NOT EXISTS intake_fingerprint text;
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS intake_fingerprint text;

CREATE OR REPLACE FUNCTION public.crm_set_intake_fingerprint()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE phone text; day_key text;
BEGIN
  IF TG_TABLE_NAME = 'contact_requests' THEN
    phone := public.crm_normalize_phone(NEW.visitor_phone);
    NEW.visitor_phone_normalized := phone;
    day_key := to_char(coalesce(NEW.created_at, now()) AT TIME ZONE 'Africa/Abidjan', 'YYYY-MM-DD');
    IF phone IS NOT NULL THEN
      IF NEW.source = 'flash' AND NEW.locaux_id IS NOT NULL THEN
        NEW.intake_fingerprint := 'flash:' || NEW.locaux_id || ':' || phone || ':' || day_key;
      ELSIF NEW.bien_id IS NOT NULL THEN
        NEW.intake_fingerprint := 'web:' || NEW.bien_id || ':' || phone || ':' || day_key;
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'visites' THEN
    phone := public.crm_normalize_phone(NEW.client_phone);
    NEW.client_phone_normalized := phone;
    IF phone IS NOT NULL THEN
      NEW.intake_fingerprint := 'visit:' || NEW.bien_id || ':' || phone || ':' ||
        NEW.date_souhaitee || ':' || coalesce(NEW.heure_debut::text, '');
    END IF;
  ELSIF TG_TABLE_NAME = 'reservations' THEN
    NEW.intake_fingerprint := 'reservation:' || NEW.bien_id || ':' || NEW.locataire_id || ':' ||
      NEW.date_debut || ':' || coalesce(NEW.date_fin::text, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_contact_intake_fingerprint ON public.contact_requests;
CREATE TRIGGER crm_contact_intake_fingerprint
  BEFORE INSERT OR UPDATE OF visitor_phone, bien_id, locaux_id, source, created_at
  ON public.contact_requests FOR EACH ROW EXECUTE FUNCTION public.crm_set_intake_fingerprint();
DROP TRIGGER IF EXISTS crm_visite_intake_fingerprint ON public.visites;
CREATE TRIGGER crm_visite_intake_fingerprint
  BEFORE INSERT OR UPDATE OF client_phone, bien_id, date_souhaitee, heure_debut
  ON public.visites FOR EACH ROW EXECUTE FUNCTION public.crm_set_intake_fingerprint();
DROP TRIGGER IF EXISTS crm_reservation_intake_fingerprint ON public.reservations;
CREATE TRIGGER crm_reservation_intake_fingerprint
  BEFORE INSERT OR UPDATE OF bien_id, locataire_id, date_debut, date_fin
  ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.crm_set_intake_fingerprint();

-- Only new rows are fingerprinted. This avoids changing or deleting old
-- duplicate records while making concurrent new inserts deterministic.
CREATE UNIQUE INDEX IF NOT EXISTS contact_requests_intake_fingerprint_uidx
  ON public.contact_requests(intake_fingerprint)
  WHERE intake_fingerprint IS NOT NULL AND admin_validation_status <> 'rejected';
CREATE UNIQUE INDEX IF NOT EXISTS visites_intake_fingerprint_uidx
  ON public.visites(intake_fingerprint)
  WHERE intake_fingerprint IS NOT NULL AND admin_validation_status <> 'rejected';
CREATE UNIQUE INDEX IF NOT EXISTS reservations_intake_fingerprint_uidx
  ON public.reservations(intake_fingerprint)
  WHERE intake_fingerprint IS NOT NULL AND admin_validation_status <> 'rejected';

CREATE OR REPLACE FUNCTION public.crm_validate_intake_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE expected uuid;
BEGIN
  IF TG_TABLE_NAME = 'contact_requests' AND NEW.bien_id IS NOT NULL THEN
    SELECT proprietaire_id INTO expected FROM public.biens WHERE id = NEW.bien_id;
  ELSIF TG_TABLE_NAME IN ('visites','reservations') THEN
    SELECT proprietaire_id INTO expected FROM public.biens WHERE id = NEW.bien_id;
  END IF;
  IF expected IS NULL AND TG_TABLE_NAME <> 'contact_requests' THEN
    RAISE EXCEPTION 'Bien introuvable pour cette demande';
  END IF;
  IF expected IS NOT NULL AND NEW.proprietaire_id IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'Le propriétaire ne correspond pas au bien';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_contact_owner_integrity ON public.contact_requests;
CREATE TRIGGER crm_contact_owner_integrity
  BEFORE INSERT OR UPDATE OF bien_id, proprietaire_id ON public.contact_requests
  FOR EACH ROW EXECUTE FUNCTION public.crm_validate_intake_owner();
DROP TRIGGER IF EXISTS crm_visite_owner_integrity ON public.visites;
CREATE TRIGGER crm_visite_owner_integrity
  BEFORE INSERT OR UPDATE OF bien_id, proprietaire_id ON public.visites
  FOR EACH ROW EXECUTE FUNCTION public.crm_validate_intake_owner();
DROP TRIGGER IF EXISTS crm_reservation_owner_integrity ON public.reservations;
CREATE TRIGGER crm_reservation_owner_integrity
  BEFORE INSERT OR UPDATE OF bien_id, proprietaire_id ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.crm_validate_intake_owner();

-- A row-level advisory lock closes the check-then-insert race for overlapping
-- reservations. The application check remains useful for a friendly 409.
CREATE OR REPLACE FUNCTION public.crm_reservation_overlap_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF NEW.statut NOT IN ('annulee','terminee') AND coalesce(NEW.admin_validation_status, 'pending') <> 'rejected' THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('reservation:' || NEW.bien_id::text, 0));
    IF EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.bien_id = NEW.bien_id AND r.id IS DISTINCT FROM NEW.id
        AND r.statut NOT IN ('annulee','terminee')
        AND coalesce(r.admin_validation_status, 'pending') <> 'rejected'
        AND daterange(r.date_debut, coalesce(r.date_fin, 'infinity'::date), '[)') &&
            daterange(NEW.date_debut, coalesce(NEW.date_fin, 'infinity'::date), '[)')
    ) THEN
      RAISE EXCEPTION 'Ces dates sont déjà réservées pour ce bien' USING ERRCODE = '23P01';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_reservation_overlap_guard ON public.reservations;
CREATE TRIGGER crm_reservation_overlap_guard
  BEFORE INSERT OR UPDATE OF bien_id, date_debut, date_fin, statut ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.crm_reservation_overlap_guard();

-- Resolve the one canonical prospect for every intake path. The advisory lock
-- serialises linking while a concurrent WhatsApp/web capture is being upserted.
CREATE OR REPLACE FUNCTION public.crm_link_intake(p_entity text, p_id uuid, p_phone text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE normalized text := public.crm_normalize_phone(p_phone); prospect uuid; linked boolean := false; affected integer;
BEGIN
  IF p_entity NOT IN ('contact','visite','reservation') OR p_id IS NULL OR normalized IS NULL THEN
    RETURN jsonb_build_object('prospect_id', null, 'linked', false);
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('prospect:' || normalized, 0));
  SELECT id INTO prospect FROM public.prospects
  WHERE merged_into IS NULL AND public.crm_normalize_phone(phone) = normalized
  ORDER BY last_seen DESC NULLS LAST, id LIMIT 1;
  IF prospect IS NULL THEN
    RETURN jsonb_build_object('prospect_id', null, 'linked', false);
  END IF;
  CASE p_entity
    WHEN 'contact' THEN UPDATE public.contact_requests SET prospect_id=prospect, version=version+1 WHERE id=p_id;
    WHEN 'visite' THEN UPDATE public.visites SET prospect_id=prospect, version=version+1 WHERE id=p_id;
    WHEN 'reservation' THEN UPDATE public.reservations SET prospect_id=prospect, version=version+1 WHERE id=p_id;
  END CASE;
  GET DIAGNOSTICS affected = ROW_COUNT;
  linked := affected > 0;
  IF linked THEN
    INSERT INTO public.crm_events(prospect_id, entity_type, entity_id, origin, event_type, metadata)
    VALUES (prospect, p_entity, p_id, 'system', 'created', jsonb_build_object('linked_by','crm_link_intake'));
  END IF;
  RETURN jsonb_build_object('prospect_id', prospect, 'linked', linked);
END;
$$;

REVOKE ALL ON FUNCTION public.crm_link_intake(text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_link_intake(text, uuid, text) TO service_role;

COMMIT;
