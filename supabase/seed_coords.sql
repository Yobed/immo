-- Script pour injecter des coordonnées par défaut basées sur la commune pour les biens existants
-- Permet de tester la carte immédiatement.

UPDATE public.biens SET latitude = 5.345, longitude = -3.985 WHERE commune = 'Cocody' AND latitude IS NULL;
UPDATE public.biens SET latitude = 5.326, longitude = -4.017 WHERE commune = 'Plateau' AND latitude IS NULL;
UPDATE public.biens SET latitude = 5.304, longitude = -3.974 WHERE commune = 'Marcory' AND latitude IS NULL;
UPDATE public.biens SET latitude = 5.334, longitude = -4.053 WHERE commune = 'Yopougon' AND latitude IS NULL;
UPDATE public.biens SET latitude = 5.356, longitude = -4.02 WHERE commune = 'Adjamé' AND latitude IS NULL;
UPDATE public.biens SET latitude = 5.421, longitude = -4.017 WHERE commune = 'Abobo' AND latitude IS NULL;
UPDATE public.biens SET latitude = 5.295, longitude = -3.945 WHERE commune = 'Koumassi' AND latitude IS NULL;
UPDATE public.biens SET latitude = 5.253, longitude = -3.944 WHERE commune = 'Port-Bouet' AND latitude IS NULL;
UPDATE public.biens SET latitude = 5.353, longitude = -3.886 WHERE commune = 'Bingerville' AND latitude IS NULL;

-- S'assurer que les biens sont publiés pour le test
UPDATE public.biens SET statut = 'publie' WHERE statut = 'brouillon' LIMIT 10;
