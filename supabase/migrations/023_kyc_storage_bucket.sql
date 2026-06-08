-- Migration 023 : Bucket Storage KYC (CNI + selfie)
--
-- Contexte : KYCUploader uploade les pièces d'identité dans `storage.buckets.kyc`
-- mais ce bucket n'a jamais été créé → upload échoue avec "Load failed".
--
-- Sécurité :
--   - Bucket PRIVÉ (pas d'accès public)
--   - L'utilisateur ne peut uploader QUE dans son propre dossier (path = {user_id}/...)
--   - L'utilisateur ne peut LIRE QUE ses propres fichiers
--   - Service_role + admin peuvent tout lire (pour validation manuelle des KYC)
--   - 10 MB max par fichier

-- ─── 1) Création du bucket KYC ───────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc',
  'kyc',
  false, -- privé
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 2) Drop anciennes policies si existantes ────────────────────────────────
DROP POLICY IF EXISTS "kyc_upload_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "kyc_read_own_files" ON storage.objects;
DROP POLICY IF EXISTS "kyc_admin_read_all" ON storage.objects;
DROP POLICY IF EXISTS "kyc_update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "kyc_delete_own_files" ON storage.objects;

-- ─── 3) Policy INSERT : user upload uniquement dans son dossier ──────────────
-- Le path doit commencer par {auth.uid()}/
CREATE POLICY "kyc_upload_own_folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── 4) Policy SELECT : user lit ses propres fichiers ────────────────────────
CREATE POLICY "kyc_read_own_files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── 5) Policy SELECT pour admin : lecture de TOUS les fichiers KYC ──────────
CREATE POLICY "kyc_admin_read_all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 6) Policy UPDATE : user remplace ses propres fichiers ───────────────────
CREATE POLICY "kyc_update_own_files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── 7) Policy DELETE : user supprime ses propres fichiers (re-upload) ───────
CREATE POLICY "kyc_delete_own_files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kyc'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
