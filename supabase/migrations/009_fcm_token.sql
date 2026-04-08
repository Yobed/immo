-- Migration 009: Ajout colonne fcm_token pour notifications push Firebase FCM
-- Dépend de: 008 (table profiles existe)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Permettre à l'utilisateur de mettre à jour son propre fcm_token
-- La policy UPDATE sur profiles existe déjà — elle couvre toutes les colonnes.
-- Vérifier qu'elle inclut fcm_token (pas de restriction de colonnes dans les policies existantes).

COMMENT ON COLUMN profiles.fcm_token IS 'Token Firebase FCM pour notifications push. Enregistré par expo-notifications au démarrage de l''app.';
