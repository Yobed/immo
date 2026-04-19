-- Migration 011: Correction du schéma biens et ajout de la fonction de recherche géographique
-- Dépendances: 002_biens

-- 1. Ajout des colonnes manquantes utilisées par le design Premium
ALTER TABLE public.biens 
  ADD COLUMN IF NOT EXISTS est_disponible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_verifie BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS score_ia INTEGER DEFAULT 0;

-- 2. Création de la fonction de recherche de proximité (Haversine formula)
-- Cette fonction permet de trouver les biens dans un rayon donné autour d'un point GPS.
CREATE OR REPLACE FUNCTION public.get_biens_proches(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 10000
)
RETURNS TABLE (
  id UUID,
  titre TEXT,
  commune TEXT,
  quartier TEXT,
  type_bien TEXT,
  prix_mois_fcfa INTEGER,
  prix_nuit_fcfa INTEGER,
  prix_vente_fcfa BIGINT,
  surface_m2 INTEGER,
  nb_pieces INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  est_disponible BOOLEAN,
  is_verifie BOOLEAN,
  score_ia INTEGER,
  dist_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.titre,
    b.commune,
    b.quartier,
    b.type_bien,
    b.prix_mois_fcfa,
    b.prix_nuit_fcfa,
    b.prix_vente_fcfa,
    b.surface_m2,
    b.nb_pieces,
    b.latitude,
    b.longitude,
    b.est_disponible,
    b.is_verifie,
    b.score_ia,
    (6371 * acos(
      clamp_acos(
        cos(radians(user_lat)) * cos(radians(b.latitude)) *
        cos(radians(b.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(b.latitude))
      )
    ) * 1000) AS dist_meters
  FROM public.biens b
  WHERE b.statut = 'publie'
    AND b.latitude IS NOT NULL
    AND b.longitude IS NOT NULL
    AND (6371 * acos(
      clamp_acos(
        cos(radians(user_lat)) * cos(radians(b.latitude)) *
        cos(radians(b.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(b.latitude))
      )
    ) * 1000) <= radius_meters
  ORDER BY dist_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction utilitaire pour éviter les erreurs de flottants hors domaine [-1, 1] pour acos
CREATE OR REPLACE FUNCTION public.clamp_acos(val DOUBLE PRECISION)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN CASE 
    WHEN val > 1.0 THEN 1.0 
    WHEN val < -1.0 THEN -1.0 
    ELSE val 
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_biens_proches IS 'Recherche les biens à proximité de l''utilisateur en mètres via la formule Haversine.';
