-- Rattache les événements historiques à un prospect quand le téléphone normalisé
-- correspond à un seul prospect. Aucune fusion ni suppression n'est effectuée.

WITH unique_prospects AS (
  SELECT regexp_replace(phone, '[^0-9]', '', 'g') AS phone_normalized, (array_agg(id ORDER BY id))[1] AS prospect_id
  FROM public.prospects
  WHERE phone IS NOT NULL
  GROUP BY regexp_replace(phone, '[^0-9]', '', 'g')
  HAVING count(*) = 1
)
UPDATE public.contact_requests c
SET prospect_id = u.prospect_id
FROM unique_prospects u
WHERE c.prospect_id IS NULL
  AND c.visitor_phone IS NOT NULL
  AND regexp_replace(c.visitor_phone, '[^0-9]', '', 'g') = u.phone_normalized;

WITH unique_prospects AS (
  SELECT regexp_replace(phone, '[^0-9]', '', 'g') AS phone_normalized, (array_agg(id ORDER BY id))[1] AS prospect_id
  FROM public.prospects
  WHERE phone IS NOT NULL
  GROUP BY regexp_replace(phone, '[^0-9]', '', 'g')
  HAVING count(*) = 1
)
UPDATE public.visites v
SET prospect_id = u.prospect_id
FROM unique_prospects u
WHERE v.prospect_id IS NULL
  AND v.client_phone IS NOT NULL
  AND regexp_replace(v.client_phone, '[^0-9]', '', 'g') = u.phone_normalized;

WITH unique_prospects AS (
  SELECT regexp_replace(phone, '[^0-9]', '', 'g') AS phone_normalized, (array_agg(id ORDER BY id))[1] AS prospect_id
  FROM public.prospects
  WHERE phone IS NOT NULL
  GROUP BY regexp_replace(phone, '[^0-9]', '', 'g')
  HAVING count(*) = 1
)
UPDATE public.reservations r
SET prospect_id = u.prospect_id
FROM public.profiles p
JOIN unique_prospects u ON regexp_replace(p.phone, '[^0-9]', '', 'g') = u.phone_normalized
WHERE r.prospect_id IS NULL
  AND r.locataire_id = p.id;

CREATE INDEX IF NOT EXISTS contact_requests_prospect_idx ON public.contact_requests(prospect_id);
CREATE INDEX IF NOT EXISTS visites_prospect_idx ON public.visites(prospect_id);
CREATE INDEX IF NOT EXISTS reservations_prospect_idx ON public.reservations(prospect_id);
