-- Migration 019 : Verrouillage colonne sur contact_requests.
--
-- Contexte : la policy RLS "Visiteur voit ses demandes" laisse un visiteur
-- lire les rows où visitor_id = auth.uid(). Si on lui retourne `*`, il verrait
-- aussi flash_owner_phone et admin_note → fuite des contacts propriétaire.
--
-- Solution : column-level grants. On RÉVOQUE le SELECT global sur la table,
-- puis on RE-GRANT uniquement les colonnes "safe" aux rôles authenticated/anon.
-- Le service_role bypasse les grants colonne → les endpoints admin continuent
-- de fonctionner normalement.

-- Étape 1 : retirer le SELECT global pour authenticated et anon
REVOKE SELECT ON public.contact_requests FROM authenticated;
REVOKE SELECT ON public.contact_requests FROM anon;

-- Étape 2 : re-grant uniquement les colonnes sûres
-- Liste explicite — flash_owner_phone, admin_note, admin_validated_by EXCLUS.
GRANT SELECT (
  id,
  source,
  bien_id,
  locaux_id,
  flash_titre,
  visitor_id,
  visitor_name,
  visitor_phone,
  visitor_email,
  reason,
  admin_validation_status,
  admin_validated_at,
  admin_notified_at,
  visitor_notified_at,
  owner_notified_at,
  created_at,
  updated_at
) ON public.contact_requests TO authenticated;

GRANT SELECT (
  id,
  source,
  admin_validation_status,
  created_at
) ON public.contact_requests TO anon;

-- Étape 3 : conserver INSERT pour les visiteurs (anti-spam DB-side reste actif)
GRANT INSERT ON public.contact_requests TO authenticated;
GRANT INSERT ON public.contact_requests TO anon;

-- Note : ni authenticated ni anon n'ont UPDATE/DELETE sur cette table.
-- Toutes les transitions de statut passent par service_role (action serveur admin).
