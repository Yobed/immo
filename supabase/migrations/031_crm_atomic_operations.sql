-- Safety patch for the existing CRM. Requires 027–030; no historical rows are deleted.
BEGIN;

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS merged_into uuid REFERENCES public.prospects(id),
  ADD COLUMN IF NOT EXISTS merged_at timestamptz,
  ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loss_note text;
ALTER TABLE public.contact_requests ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS prospects_merged_into_idx ON public.prospects(merged_into);

ALTER TABLE public.crm_events DROP CONSTRAINT IF EXISTS crm_events_event_type_check;
ALTER TABLE public.crm_events ADD CONSTRAINT crm_events_event_type_check CHECK (
  event_type IN ('created','status_changed','assigned','note_added','reminder_set','contacted',
    'visit_scheduled','visit_completed','won','lost','merged','validation_changed','visit_outcome_recorded')
);
ALTER TABLE public.crm_events ADD COLUMN IF NOT EXISTS origin text;
UPDATE public.crm_events SET origin = CASE WHEN actor_id IS NULL THEN 'legacy_unknown' ELSE 'human' END
WHERE origin IS NULL;
ALTER TABLE public.crm_events ALTER COLUMN origin SET NOT NULL;
ALTER TABLE public.crm_events ALTER COLUMN origin SET DEFAULT 'system';
ALTER TABLE public.crm_events ADD CONSTRAINT crm_events_origin_check
  CHECK (origin IN ('human','system','legacy_unknown'));
-- Keep old authors unknown. Do not backfill invented actors or rewrite their historical status.
REVOKE INSERT, UPDATE, DELETE ON public.crm_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.prospect_activities FROM anon, authenticated;

CREATE TABLE public.crm_merge_requests (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  primary_id uuid NOT NULL REFERENCES public.prospects(id),
  duplicate_id uuid NOT NULL REFERENCES public.prospects(id),
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_merge_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_merge_requests FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.crm_require_admin() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := auth.uid();
BEGIN
  IF actor IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=actor AND role='admin') THEN
    RAISE EXCEPTION 'Accès administrateur requis' USING ERRCODE='42501';
  END IF;
  RETURN actor;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_require_admin() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.crm_normalize_phone(raw text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
  WITH digits AS (SELECT regexp_replace(coalesce(raw,''), '[^0-9]', '', 'g') AS n),
  stripped AS (SELECT CASE WHEN n LIKE '00%' THEN substring(n FROM 3) ELSE n END AS n FROM digits)
  SELECT CASE
    WHEN n ~ '^[0-9]{10}$' AND n ~ '^0' THEN '225'||n
    WHEN n ~ '^225[0-9]{10}$' THEN n
    WHEN trim(coalesce(raw,'')) ~ '^(\+|00)' AND n ~ '^[1-9][0-9]{7,14}$' AND n NOT LIKE '225%' THEN n
    ELSE NULL END FROM stripped
$$;

CREATE OR REPLACE VIEW public.v_prospect_duplicates WITH (security_invoker=true) AS
SELECT public.crm_normalize_phone(phone) AS phone_normalized,
  count(*)::int AS duplicate_count, array_agg(id ORDER BY last_seen DESC, id) AS prospect_ids,
  max(last_seen) AS last_seen
FROM public.prospects
WHERE merged_into IS NULL AND public.crm_normalize_phone(phone) IS NOT NULL
GROUP BY public.crm_normalize_phone(phone) HAVING count(*)>1;

CREATE OR REPLACE FUNCTION public.crm_validate_request(p_entity text, p_id uuid, p_action text, p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  actor uuid := public.crm_require_admin();
  table_name text; current_row jsonb; next_status text; event_id uuid;
  clean_note text := nullif(btrim(p_note),'');
BEGIN
  table_name := CASE p_entity WHEN 'contact' THEN 'contact_requests' WHEN 'visite' THEN 'visites'
    WHEN 'reservation' THEN 'reservations' ELSE NULL END;
  IF table_name IS NULL OR p_id IS NULL OR p_action IS NULL OR p_action NOT IN ('approve','reject') THEN
    RAISE EXCEPTION 'Action invalide' USING ERRCODE='22023';
  END IF;
  IF length(clean_note)>2000 OR (p_action='reject' AND clean_note IS NULL) THEN
    RAISE EXCEPTION 'Précisez un motif de refus (2 000 caractères maximum)' USING ERRCODE='22023';
  END IF;
  EXECUTE format('SELECT to_jsonb(t) FROM public.%I t WHERE id=$1 FOR UPDATE', table_name)
    INTO current_row USING p_id;
  IF current_row IS NULL THEN RAISE EXCEPTION 'Demande introuvable' USING ERRCODE='P0002'; END IF;
  IF current_row->>'admin_validation_status' IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Cette demande a déjà été traitée. Actualisez la page.' USING ERRCODE='40001';
  END IF;
  next_status := CASE p_action WHEN 'approve' THEN 'approved' ELSE 'rejected' END;
  EXECUTE format('UPDATE public.%I SET admin_validation_status=$2, admin_validated_at=now(),
    admin_validated_by=$3, admin_note=$4, version=version+1 WHERE id=$1', table_name)
    USING p_id, next_status, actor, clean_note;
  INSERT INTO public.crm_events(prospect_id, entity_type, entity_id, actor_id, origin,
    event_type, from_status, to_status, note)
  VALUES ((current_row->>'prospect_id')::uuid, p_entity, p_id, actor, 'human',
    'validation_changed','pending',next_status,clean_note) RETURNING id INTO event_id;
  RETURN jsonb_build_object('id',p_id,'admin_validation_status',next_status,'event_id',event_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_merge_prospects(p_primary uuid, p_duplicate uuid, p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  actor uuid := public.crm_require_admin(); principal public.prospects; duplicate public.prospects;
  previous public.crm_merge_requests; moved jsonb := '{}'; affected bigint; result jsonb; target text;
BEGIN
  IF p_primary IS NULL OR p_duplicate IS NULL OR p_request IS NULL OR p_primary=p_duplicate THEN
    RAISE EXCEPTION 'Choisissez deux fiches distinctes' USING ERRCODE='22023';
  END IF;
  -- Rare administrative operation: serialise merges to protect alias trees and inverted requests.
  PERFORM pg_advisory_xact_lock(31082026);
  SELECT * INTO previous FROM public.crm_merge_requests WHERE request_id=p_request;
  IF FOUND THEN
    IF previous.actor_id<>actor OR previous.primary_id<>p_primary OR previous.duplicate_id<>p_duplicate THEN
      RAISE EXCEPTION 'Identifiant de fusion déjà utilisé pour une autre opération' USING ERRCODE='22023';
    END IF;
    RETURN previous.result;
  END IF;
  PERFORM id FROM public.prospects WHERE id IN (p_primary,p_duplicate) ORDER BY id FOR UPDATE;
  SELECT * INTO principal FROM public.prospects WHERE id=p_primary;
  SELECT * INTO duplicate FROM public.prospects WHERE id=p_duplicate;
  IF principal.id IS NULL OR duplicate.id IS NULL THEN
    RAISE EXCEPTION 'Fiche introuvable' USING ERRCODE='P0002';
  END IF;
  IF principal.merged_into IS NOT NULL OR duplicate.merged_into IS NOT NULL THEN
    RAISE EXCEPTION 'Une fiche a déjà été fusionnée. Actualisez la liste.' USING ERRCODE='40001';
  END IF;
  IF public.crm_normalize_phone(principal.phone) IS NULL OR
    public.crm_normalize_phone(principal.phone) IS DISTINCT FROM public.crm_normalize_phone(duplicate.phone) THEN
    RAISE EXCEPTION 'Les numéros ne correspondent pas. Vérifiez les identités avant fusion.' USING ERRCODE='22023';
  END IF;
  FOREACH target IN ARRAY ARRAY['contact_requests','visites','reservations'] LOOP
    EXECUTE format('UPDATE public.%I SET prospect_id=$1, version=version+1 WHERE prospect_id=$2',target)
      USING p_primary,p_duplicate;
    GET DIAGNOSTICS affected=ROW_COUNT;
    moved := moved || jsonb_build_object(target,affected);
  END LOOP;
  UPDATE public.prospects SET
    nom=coalesce(nullif(btrim(principal.nom),''), duplicate.nom),
    note=coalesce(nullif(btrim(principal.note),''), duplicate.note),
    assigned_to=coalesce(principal.assigned_to, duplicate.assigned_to), version=version+1
  WHERE id=p_primary;
  -- Keep the secondary's fields and commercial status for historical review, not a fictitious loss.
  UPDATE public.prospects SET merged_into=p_primary, merged_at=now(), version=version+1 WHERE id=p_duplicate;
  UPDATE public.prospects SET merged_into=p_primary, version=version+1 WHERE merged_into=p_duplicate;
  INSERT INTO public.crm_events(prospect_id,entity_type,entity_id,actor_id,origin,event_type,note,metadata)
  VALUES(p_primary,'prospect',p_primary,actor,'human','merged','Fusion de deux fiches de la même personne',
    jsonb_build_object('primary_id',p_primary,'duplicate_id',p_duplicate,'moved',moved,
      'request_id',p_request,'conflicts_preserved_on',p_duplicate));
  result := jsonb_build_object('primary_id',p_primary,'duplicate_id',p_duplicate,'moved',moved);
  INSERT INTO public.crm_merge_requests(request_id,actor_id,primary_id,duplicate_id,result)
    VALUES(p_request,actor,p_primary,p_duplicate,result);
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_update_prospect(p_id uuid, p_operation text, p_values jsonb, p_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := public.crm_require_admin(); current_row public.prospects;
  event_kind text; event_note text; destination text; assigned uuid; reason text; action_text text; action_at timestamptz;
BEGIN
  IF p_id IS NULL OR p_version IS NULL OR jsonb_typeof(p_values) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Formulaire invalide. Actualisez la page.' USING ERRCODE='22023';
  END IF;
  SELECT * INTO current_row FROM public.prospects WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prospect introuvable' USING ERRCODE='P0002'; END IF;
  IF current_row.merged_into IS NOT NULL OR current_row.version<>p_version THEN
    RAISE EXCEPTION 'Ce dossier a changé. Actualisez avant de réessayer.' USING ERRCODE='40001';
  END IF;
  CASE p_operation
    WHEN 'status' THEN
      destination := p_values->>'statut';
      IF destination IS NULL OR destination NOT IN ('nouveau','contacte','visite_planifiee','visite_realisee','relance','gagne','perdu') THEN
        RAISE EXCEPTION 'Statut invalide' USING ERRCODE='22023';
      END IF;
      IF destination=current_row.statut THEN RETURN jsonb_build_object('version',current_row.version,'changed',false); END IF;
      IF destination='perdu' AND (nullif(current_row.perte_motif,'') IS NULL OR
        (current_row.perte_motif='autre' AND nullif(btrim(current_row.loss_note),'') IS NULL)) THEN
        RAISE EXCEPTION 'Enregistrez le motif de perte et sa précision avant de clôturer.' USING ERRCODE='22023';
      END IF;
      IF destination='relance' AND (nullif(btrim(current_row.prochaine_action),'') IS NULL OR current_row.prochaine_action_at IS NULL) THEN
        RAISE EXCEPTION 'Enregistrez une prochaine action et sa date avant la relance.' USING ERRCODE='22023';
      END IF;
      IF NOT (
        (current_row.statut='nouveau' AND destination IN ('contacte','visite_planifiee','relance','perdu')) OR
        (current_row.statut='contacte' AND destination IN ('visite_planifiee','relance','perdu')) OR
        (current_row.statut='visite_planifiee' AND destination IN ('visite_realisee','relance','perdu')) OR
        (current_row.statut='visite_realisee' AND destination IN ('relance','gagne','perdu')) OR
        (current_row.statut='relance' AND destination IN ('contacte','visite_planifiee','visite_realisee','gagne','perdu')) OR
        (current_row.statut IN ('gagne','perdu') AND destination='relance' AND
          nullif(btrim(current_row.prochaine_action),'') IS NOT NULL AND current_row.prochaine_action_at IS NOT NULL) OR
        (current_row.statut='en_cours' AND destination IN ('contacte','relance','perdu')) OR
        (current_row.statut='rdv' AND destination IN ('visite_planifiee','visite_realisee','relance','perdu')) OR
        (current_row.statut='traite' AND destination IN ('relance','perdu')) OR
        (destination='gagne' AND current_row.statut IN ('nouveau','contacte','visite_planifiee') AND
          EXISTS (SELECT 1 FROM public.reservations r WHERE r.prospect_id=p_id AND r.admin_validation_status='approved'))
      ) THEN
        RAISE EXCEPTION 'Transition impossible depuis le statut actuel. Enregistrez le prochain jalon ou une justification.' USING ERRCODE='22023';
      END IF;
      UPDATE public.prospects SET statut=destination,statut_changed_at=now(),statut_changed_by=actor WHERE id=p_id;
      event_kind := 'status_changed';
    WHEN 'note' THEN
      event_note := nullif(btrim(p_values->>'note'),'');
      IF length(event_note)>2000 THEN RAISE EXCEPTION 'Note trop longue' USING ERRCODE='22023'; END IF;
      IF event_note IS NOT DISTINCT FROM current_row.note THEN RETURN jsonb_build_object('version',current_row.version,'changed',false); END IF;
      UPDATE public.prospects SET note=event_note WHERE id=p_id;
      event_kind := 'note_added';
    WHEN 'assign' THEN
      assigned := nullif(p_values->>'assigned_to','')::uuid;
      IF assigned IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=assigned AND role='admin') THEN
        RAISE EXCEPTION 'Le responsable doit être un administrateur actif' USING ERRCODE='22023';
      END IF;
      IF assigned IS NOT DISTINCT FROM current_row.assigned_to THEN RETURN jsonb_build_object('version',current_row.version,'changed',false); END IF;
      UPDATE public.prospects SET assigned_to=assigned WHERE id=p_id;
      event_kind := 'assigned';
    WHEN 'reminder' THEN
      IF nullif(p_values->>'relance_le','') IS NOT NULL AND (p_values->>'relance_le') !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'Date de relance invalide' USING ERRCODE='22023';
      END IF;
      IF nullif(p_values->>'relance_le','')::date IS NOT DISTINCT FROM current_row.relance_le THEN
        RETURN jsonb_build_object('version',current_row.version,'changed',false);
      END IF;
      UPDATE public.prospects SET relance_le=nullif(p_values->>'relance_le','')::date WHERE id=p_id;
      event_kind := 'reminder_set';
    WHEN 'followup' THEN
      reason := nullif(btrim(p_values->>'perte_motif'),'');
      event_note := nullif(btrim(p_values->>'loss_note'),'');
      action_text := nullif(btrim(p_values->>'prochaine_action'),'');
      action_at := nullif(p_values->>'prochaine_action_at','')::timestamptz;
      IF reason IS NOT NULL AND reason NOT IN ('prix','bien_indisponible','proprietaire_injoignable','prospect_absent','documents_incomplets','autre') THEN
        RAISE EXCEPTION 'Motif de perte invalide' USING ERRCODE='22023';
      END IF;
      IF reason='autre' AND event_note IS NULL THEN RAISE EXCEPTION 'Précisez le motif Autre' USING ERRCODE='22023'; END IF;
      IF (action_text IS NULL) <> (action_at IS NULL) OR length(action_text)>200 OR length(event_note)>2000 THEN
        RAISE EXCEPTION 'Renseignez une prochaine action et sa date ensemble (200 caractères maximum).' USING ERRCODE='22023';
      END IF;
      IF current_row.statut='perdu' AND reason IS NULL THEN RAISE EXCEPTION 'Un dossier perdu doit conserver son motif' USING ERRCODE='22023'; END IF;
      UPDATE public.prospects SET perte_motif=reason,loss_note=event_note,
        prochaine_action=action_text,prochaine_action_at=action_at WHERE id=p_id;
      event_kind := 'reminder_set';
    ELSE RAISE EXCEPTION 'Opération invalide' USING ERRCODE='22023';
  END CASE;
  UPDATE public.prospects SET version=version+1 WHERE id=p_id;
  INSERT INTO public.crm_events(prospect_id,entity_type,entity_id,actor_id,origin,event_type,from_status,to_status,note,metadata)
  VALUES(p_id,'prospect',p_id,actor,'human',event_kind,
    CASE WHEN p_operation='status' THEN current_row.statut END,destination,event_note,
    jsonb_build_object('operation',p_operation,'changes',p_values,'previous_version',p_version));
  RETURN jsonb_build_object('version',p_version+1,'changed',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_set_visit_outcome(p_id uuid, p_outcome text, p_reason text, p_note text, p_version bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := public.crm_require_admin(); current_row public.visites;
BEGIN
  IF p_outcome IS NULL OR p_outcome NOT IN ('realisee','annulee','no_show','non_conclue') OR p_version IS NULL THEN
    RAISE EXCEPTION 'Résultat de visite invalide' USING ERRCODE='22023';
  END IF;
  IF nullif(btrim(p_note),'') IS NULL OR length(p_note)>2000 THEN
    RAISE EXCEPTION 'Ajoutez un compte rendu (2 000 caractères maximum)' USING ERRCODE='22023';
  END IF;
  IF p_outcome<>'realisee' AND nullif(btrim(p_reason),'') IS NULL THEN
    RAISE EXCEPTION 'Précisez la raison de cette issue de visite' USING ERRCODE='22023';
  END IF;
  SELECT * INTO current_row FROM public.visites WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Visite introuvable' USING ERRCODE='P0002'; END IF;
  IF current_row.version<>p_version THEN RAISE EXCEPTION 'La visite a changé. Actualisez la page.' USING ERRCODE='40001'; END IF;
  UPDATE public.visites SET outcome=p_outcome,loss_reason=nullif(btrim(p_reason),''),outcome_note=btrim(p_note),
    outcome_at=now(),version=version+1 WHERE id=p_id;
  INSERT INTO public.crm_events(prospect_id,entity_type,entity_id,actor_id,origin,event_type,reason_code,note,metadata)
  VALUES(current_row.prospect_id,'visite',p_id,actor,'human','visit_outcome_recorded',nullif(btrim(p_reason),''),btrim(p_note),
    jsonb_build_object('outcome',p_outcome,'previous_outcome',current_row.outcome));
  RETURN jsonb_build_object('version',p_version+1);
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_prospect_timeline(p_id uuid, p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE result jsonb;
BEGIN
  PERFORM public.crm_require_admin();
  WITH members AS (SELECT id FROM public.prospects WHERE id=p_id OR merged_into=p_id),
  entries AS (
    SELECT e.id,e.prospect_id,e.actor_id,e.event_type,e.from_status,e.to_status,e.note,e.created_at,e.origin
      FROM public.crm_events e WHERE e.prospect_id IN (SELECT id FROM members)
    UNION ALL
    SELECT a.id,a.prospect_id,a.actor_id,'historique_'||a.type,a.from_status,a.to_status,a.note,a.created_at,
      CASE WHEN a.actor_id IS NULL THEN 'legacy_unknown' ELSE 'human' END
      FROM public.prospect_activities a WHERE a.prospect_id IN (SELECT id FROM members)
  )
  SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO result FROM (
    SELECT e.*,p.full_name AS actor_name FROM entries e LEFT JOIN public.profiles p ON p.id=e.actor_id
    ORDER BY e.created_at DESC,e.id DESC LIMIT greatest(1,least(coalesce(p_limit,50),200))
  ) t;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_validate_request(text,uuid,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.crm_merge_prospects(uuid,uuid,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.crm_update_prospect(uuid,text,jsonb,bigint) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.crm_set_visit_outcome(uuid,text,text,text,bigint) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.crm_prospect_timeline(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.crm_validate_request(text,uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_merge_prospects(uuid,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_update_prospect(uuid,text,jsonb,bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_set_visit_outcome(uuid,text,text,text,bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_prospect_timeline(uuid,integer) TO authenticated;
COMMIT;
