CREATE FUNCTION public.test_assert(value boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF value IS DISTINCT FROM true THEN RAISE EXCEPTION 'Assertion failed: %', label; END IF; END $$;
SELECT test_assert(NOT has_function_privilege('anon','public.crm_validate_request(text,uuid,text,text)','EXECUTE'), 'anon cannot validate');
SELECT test_assert(NOT has_table_privilege('authenticated','public.crm_events','INSERT'), 'clients cannot forge audit events');
SELECT test_assert(crm_normalize_phone('0700000000')=crm_normalize_phone('+225 07 00 00 00 00'), 'local and international CI identity');
SELECT test_assert(crm_normalize_phone('002250700000000')=crm_normalize_phone('0700000000'), '00 prefix identity');
SELECT test_assert(crm_normalize_phone('12345678') IS NULL, 'ambiguous legacy phone not guessed');
SELECT test_assert(crm_normalize_phone('') IS NULL, 'empty phone has no identity');
SELECT test_assert(crm_normalize_phone('+33612345678')='33612345678', 'foreign country preserved');
SET request.jwt.claim.sub='aaaaaaaa-0000-4000-8000-000000000003';
DO $$ BEGIN
  PERFORM crm_validate_request('contact','cccccccc-0000-4000-8000-000000000001','approve',null);
  RAISE EXCEPTION 'non-admin validation succeeded';
EXCEPTION WHEN insufficient_privilege THEN NULL; END $$;
SET request.jwt.claim.sub='aaaaaaaa-0000-4000-8000-000000000001';
DO $$ BEGIN
  PERFORM crm_validate_request('contact','cccccccc-0000-4000-8000-000000000001','reject','   ');
  RAISE EXCEPTION 'refusal without reason succeeded';
EXCEPTION WHEN invalid_parameter_value THEN NULL; END $$;

CREATE FUNCTION public.reject_test_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'injected journal failure'; END $$;
CREATE TRIGGER test_event_failure BEFORE INSERT ON crm_events FOR EACH ROW EXECUTE FUNCTION reject_test_event();
DO $$ BEGIN
  PERFORM crm_validate_request('contact','cccccccc-0000-4000-8000-000000000001','approve',null);
  RAISE EXCEPTION 'expected injected failure';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'injected journal failure' THEN RAISE; END IF;
END $$;
SELECT test_assert((SELECT admin_validation_status='pending' AND version=0 FROM contact_requests LIMIT 1), 'journal failure rolls validation back');
DROP TRIGGER test_event_failure ON crm_events;

UPDATE visites SET prospect_id='bbbbbbbb-0000-4000-8000-000000000002';
UPDATE contact_requests SET prospect_id='bbbbbbbb-0000-4000-8000-000000000002';
UPDATE reservations SET prospect_id='bbbbbbbb-0000-4000-8000-000000000002';
INSERT INTO prospect_activities(prospect_id,type,note) VALUES('bbbbbbbb-0000-4000-8000-000000000002','note','Historical note');
SELECT crm_update_prospect('bbbbbbbb-0000-4000-8000-000000000001','note','{"note":"Appeler demain"}',0);
SELECT test_assert((SELECT actor_id='aaaaaaaa-0000-4000-8000-000000000001' FROM crm_events WHERE event_type='note_added' LIMIT 1), 'note actor recorded');
DO $$ BEGIN
  PERFORM crm_update_prospect('bbbbbbbb-0000-4000-8000-000000000001','note','{"note":"Overwrite"}',0);
  RAISE EXCEPTION 'stale edit succeeded';
EXCEPTION WHEN serialization_failure THEN NULL; END $$;
DO $$ BEGIN
  PERFORM crm_update_prospect('bbbbbbbb-0000-4000-8000-000000000001','assign','{"assigned_to":"aaaaaaaa-0000-4000-8000-000000000003"}',1);
  RAISE EXCEPTION 'non-admin assignee accepted';
EXCEPTION WHEN invalid_parameter_value THEN NULL; END $$;
DO $$ BEGIN
  PERFORM crm_update_prospect('bbbbbbbb-0000-4000-8000-000000000001','status','{"statut":"perdu"}',1);
  RAISE EXCEPTION 'loss without reason accepted';
EXCEPTION WHEN invalid_parameter_value THEN NULL; END $$;
DO $$ BEGIN
  PERFORM crm_update_prospect('bbbbbbbb-0000-4000-8000-000000000001','status','{"statut":"visite_realisee"}',1);
  RAISE EXCEPTION 'illegal jump to completed visit accepted';
EXCEPTION WHEN invalid_parameter_value THEN NULL; END $$;
SELECT crm_set_visit_outcome('cccccccc-0000-4000-8000-000000000002','non_conclue','prix','Visite faite, budget insuffisant',0);
SELECT test_assert((SELECT prospect_id='bbbbbbbb-0000-4000-8000-000000000002' AND event_type='visit_outcome_recorded'
 FROM crm_events WHERE entity_type='visite' LIMIT 1), 'visit outcome linked to prospect and is not a commercial loss');

CREATE TRIGGER test_event_failure BEFORE INSERT ON crm_events FOR EACH ROW EXECUTE FUNCTION reject_test_event();
DO $$ BEGIN
  PERFORM crm_merge_prospects('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002','dddddddd-0000-4000-8000-000000000001');
  RAISE EXCEPTION 'expected injected failure';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'injected journal failure' THEN RAISE; END IF;
END $$;
SELECT test_assert((SELECT prospect_id='bbbbbbbb-0000-4000-8000-000000000002' FROM contact_requests LIMIT 1), 'failed merge restores child links');
SELECT test_assert((SELECT merged_into IS NULL FROM prospects WHERE id='bbbbbbbb-0000-4000-8000-000000000002'), 'failed merge restores secondary');
SELECT test_assert((SELECT count(*)=0 FROM crm_merge_requests), 'failed merge leaves no idempotency success');
DROP TRIGGER test_event_failure ON crm_events;
SELECT crm_merge_prospects('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002','dddddddd-0000-4000-8000-000000000001');
SELECT crm_merge_prospects('bbbbbbbb-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002','dddddddd-0000-4000-8000-000000000001');
SELECT test_assert((SELECT count(*)=1 FROM crm_events WHERE event_type='merged'), 'repeated merge journals once');
SELECT test_assert((SELECT statut='nouveau' AND merged_into='bbbbbbbb-0000-4000-8000-000000000001' FROM prospects WHERE id='bbbbbbbb-0000-4000-8000-000000000002'), 'merge does not invent a lost prospect');
SELECT test_assert((SELECT count(*)=0 FROM v_prospect_duplicates), 'merged alias excluded from duplicates');
SELECT test_assert(crm_prospect_timeline('bbbbbbbb-0000-4000-8000-000000000001')::text LIKE '%Historical note%', 'old activities still in primary timeline');
SELECT test_assert(crm_prospect_timeline('bbbbbbbb-0000-4000-8000-000000000001')::text LIKE '%Visite faite%', 'old CRM events still in primary timeline');
DO $$ BEGIN
  PERFORM crm_merge_prospects('bbbbbbbb-0000-4000-8000-000000000003','bbbbbbbb-0000-4000-8000-000000000002','dddddddd-0000-4000-8000-000000000001');
  RAISE EXCEPTION 'idempotency payload mismatch accepted';
EXCEPTION WHEN invalid_parameter_value THEN NULL; END $$;
SELECT crm_validate_request('contact','cccccccc-0000-4000-8000-000000000001','reject','Bien indisponible');
SELECT test_assert((SELECT from_status='pending' AND to_status='rejected' AND prospect_id='bbbbbbbb-0000-4000-8000-000000000001'
 FROM crm_events WHERE event_type='validation_changed' LIMIT 1), 'validation trace has before, after, actor and linked prospect');
