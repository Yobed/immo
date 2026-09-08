-- Isolated contract fixture, not a production schema dump.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
CREATE TABLE public.profiles (id uuid PRIMARY KEY, role text NOT NULL, full_name text);
CREATE TABLE public.prospects (
  id uuid PRIMARY KEY, phone text, nom text, statut text DEFAULT 'nouveau',
  note text, assigned_to uuid REFERENCES profiles(id), relance_le date,
  first_seen timestamptz DEFAULT now(), last_seen timestamptz DEFAULT now()
);
CREATE TABLE public.contact_requests (
  id uuid PRIMARY KEY, admin_validation_status text DEFAULT 'pending',
  admin_validated_at timestamptz, admin_validated_by uuid, admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(), date_souhaitee date,
  outcome text, prospect_id uuid, source text
);
CREATE TABLE public.visites (LIKE public.contact_requests INCLUDING ALL);
CREATE TABLE public.reservations (LIKE public.contact_requests INCLUDING ALL);
INSERT INTO profiles VALUES
 ('aaaaaaaa-0000-4000-8000-000000000001', 'admin', 'Admin A'),
 ('aaaaaaaa-0000-4000-8000-000000000002', 'admin', 'Admin B'),
 ('aaaaaaaa-0000-4000-8000-000000000003', 'locataire', 'Prospect test');
INSERT INTO prospects (id, phone, nom) VALUES
 ('bbbbbbbb-0000-4000-8000-000000000001', '0700000000', 'Principal'),
 ('bbbbbbbb-0000-4000-8000-000000000002', '+225 07 00 00 00 00', 'Doublon'),
 ('bbbbbbbb-0000-4000-8000-000000000003', '0100000000', 'Autre');
INSERT INTO contact_requests (id) VALUES ('cccccccc-0000-4000-8000-000000000001');
INSERT INTO visites (id) VALUES ('cccccccc-0000-4000-8000-000000000002');
INSERT INTO reservations (id) VALUES ('cccccccc-0000-4000-8000-000000000003');
GRANT SELECT ON profiles TO authenticated;
