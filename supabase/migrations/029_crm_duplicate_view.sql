-- Détection non destructive des doublons potentiels par numéro de téléphone.
CREATE OR REPLACE VIEW public.v_prospect_duplicates AS
SELECT
  regexp_replace(phone, '[^0-9]', '', 'g') AS phone_normalized,
  count(*)::int AS duplicate_count,
  array_agg(id ORDER BY last_seen DESC) AS prospect_ids,
  max(last_seen) AS last_seen
FROM public.prospects
WHERE phone IS NOT NULL AND length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 8
GROUP BY regexp_replace(phone, '[^0-9]', '', 'g')
HAVING count(*) > 1;

ALTER VIEW public.v_prospect_duplicates SET (security_invoker = true);
