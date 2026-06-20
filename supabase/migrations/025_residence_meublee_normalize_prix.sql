-- Migration 025 : Normalise les prix des résidences meublées
--
-- Contexte :
-- Des propriétaires ont enregistré des résidences meublées avec `prix_mois_fcfa`
-- alors que la règle métier est : meublé = prix par NUIT. Cela crée des affichages
-- absurdes type "15 000 FCFA/mois pour un studio meublé avec piscine" qui
-- détruisent la confiance.
--
-- Code applicatif (lib/catalogue/consolidated.ts) :
--   Si type_bien = 'residence_meublee' ET prix_nuit_fcfa IS NULL
--   → affiche "Prix sur demande" (au lieu du prix_mois absurde)
--
-- Cette migration NORMALISE la base : pour tous les meublés sans prix_nuit_fcfa,
-- on NULL aussi le prix_mois_fcfa (qui était sémantiquement faux). Le proprio
-- devra revenir saisir le bon prix_nuit_fcfa via le formulaire d'édition.
--
-- Trigger DB : un trigger empêche désormais d'inserter/updater un meublé avec
-- prix_mois renseigné sans prix_nuit (évite la repetition du bug).
-- Idempotent. Ne touche pas aux autres types de biens.

-- ─── 1) Nettoyer les données existantes ─────────────────────────────────────
-- Nullify prix_mois sur les meublés qui n'ont pas de prix_nuit
UPDATE public.biens
SET prix_mois_fcfa = NULL
WHERE type_bien = 'residence_meublee'
  AND prix_mois_fcfa IS NOT NULL
  AND prix_nuit_fcfa IS NULL;

-- Marquage informatif dans description pour aider le proprio
-- (commenté pour l'instant : ajout possible si on veut signaler explicitement)
-- UPDATE public.biens
-- SET description = COALESCE(description, '') || E'\n\n[À METTRE À JOUR : prix à la nuitée]'
-- WHERE type_bien = 'residence_meublee'
--   AND prix_nuit_fcfa IS NULL
--   AND description NOT LIKE '%À METTRE À JOUR%';

-- ─── 2) Trigger pour empêcher la re-saisie incohérente ──────────────────────
-- Si un proprio essaye de saisir un meublé avec uniquement prix_mois (et pas
-- prix_nuit), le trigger force prix_mois à NULL pour ne pas afficher de
-- prix incohérent. Idem en UPDATE.
CREATE OR REPLACE FUNCTION public.enforce_meuble_prix_nuit()
RETURNS trigger AS $$
BEGIN
  -- Seulement pour les résidences meublées
  IF NEW.type_bien = 'residence_meublee' THEN
    -- Si prix_mois est saisi mais pas prix_nuit → on NULL prix_mois
    -- (évite l'affichage "Prix sur demande" qui apparait quand meublé sans prix_nuit)
    IF NEW.prix_mois_fcfa IS NOT NULL AND NEW.prix_nuit_fcfa IS NULL THEN
      NEW.prix_mois_fcfa := NULL;
      -- Ajoute une note dans rejet_motif pour info admin/proprio
      NEW.rejet_motif := COALESCE(NEW.rejet_motif, '') ||
        E'\n[Auto] Prix /mois ignoré : résidence meublée exige prix /nuit.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS biens_enforce_meuble_prix_nuit ON public.biens;
CREATE TRIGGER biens_enforce_meuble_prix_nuit
  BEFORE INSERT OR UPDATE OF type_bien, prix_mois_fcfa, prix_nuit_fcfa ON public.biens
  FOR EACH ROW EXECUTE FUNCTION public.enforce_meuble_prix_nuit();

-- ─── 3) Stats post-migration (visible dans SQL Editor output) ───────────────
DO $$
DECLARE
  total_meubles INT;
  sans_prix_nuit INT;
BEGIN
  SELECT COUNT(*) INTO total_meubles FROM public.biens WHERE type_bien = 'residence_meublee';
  SELECT COUNT(*) INTO sans_prix_nuit FROM public.biens
    WHERE type_bien = 'residence_meublee' AND prix_nuit_fcfa IS NULL;
  RAISE NOTICE 'Migration 025 appliquée. Total meublés : %, Sans prix_nuit : %', total_meubles, sans_prix_nuit;
END $$;
