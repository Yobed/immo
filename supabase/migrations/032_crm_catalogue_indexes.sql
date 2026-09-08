-- Indexes additive pour le pilotage et les files d'action.
-- Aucun enregistrement n'est modifié ou supprimé.
BEGIN;

CREATE INDEX IF NOT EXISTS prospects_status_last_seen_idx
  ON public.prospects(statut, last_seen DESC)
  WHERE merged_into IS NULL;
CREATE INDEX IF NOT EXISTS prospects_assignee_next_action_idx
  ON public.prospects(assigned_to, prochaine_action_at)
  WHERE merged_into IS NULL AND prochaine_action_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS prospects_phone_normalized_idx
  ON public.prospects(public.crm_normalize_phone(phone))
  WHERE merged_into IS NULL AND public.crm_normalize_phone(phone) IS NOT NULL;

CREATE INDEX IF NOT EXISTS contact_requests_created_status_idx
  ON public.contact_requests(created_at DESC, admin_validation_status);
CREATE INDEX IF NOT EXISTS contact_requests_source_created_idx
  ON public.contact_requests(source, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_requests_prospect_created_idx
  ON public.contact_requests(prospect_id, created_at)
  WHERE prospect_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS visites_created_status_idx
  ON public.visites(created_at DESC, admin_validation_status);
CREATE INDEX IF NOT EXISTS visites_date_outcome_idx
  ON public.visites(date_souhaitee, outcome)
  WHERE outcome IS NULL;
CREATE INDEX IF NOT EXISTS visites_prospect_created_idx
  ON public.visites(prospect_id, created_at)
  WHERE prospect_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reservations_created_status_idx
  ON public.reservations(created_at DESC, admin_validation_status);
CREATE INDEX IF NOT EXISTS reservations_prospect_created_idx
  ON public.reservations(prospect_id, created_at)
  WHERE prospect_id IS NOT NULL;

COMMIT;
