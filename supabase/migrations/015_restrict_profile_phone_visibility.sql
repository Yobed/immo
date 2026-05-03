-- Migration 015: Restreindre la visibilité des données sensibles des profils
-- Problème : la policy "Profil public visible par tous" expose phone, email,
-- kyc_cni_url, kyc_selfie_url à n'importe quel client Supabase (anon key inclus).
-- Fix : remplacer par des policies granulaires + une vue publique sans données sensibles.

-- ───────────────────────────────────────────
-- 1. Supprimer la policy trop permissive
-- ───────────────────────────────────────────
drop policy if exists "Profil public visible par tous" on public.profiles;

-- ───────────────────────────────────────────
-- 2. Fonction helper : rôle de l'utilisateur courant
--    SECURITY DEFINER + search_path fixé pour éviter la récursion RLS
-- ───────────────────────────────────────────
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ───────────────────────────────────────────
-- 3. Nouvelles policies sur profiles
-- ───────────────────────────────────────────

-- Tout utilisateur (y compris anonyme) peut lire les champs publics
-- via la vue profiles_public ci-dessous. L'accès direct à la table
-- est réservé à l'utilisateur lui-même et aux admins.

-- L'utilisateur lit son propre profil complet
create policy "Utilisateur lit son propre profil"
  on public.profiles for select
  using (id = auth.uid());

-- L'admin lit tous les profils (pour le dashboard / validation)
create policy "Admin lit tous les profils"
  on public.profiles for select
  using (public.current_user_role() = 'admin');

-- ───────────────────────────────────────────
-- 4. Vue publique : champs non-sensibles uniquement
--    Accessible à anon + authenticated sans exposer phone/email/kyc
-- ───────────────────────────────────────────
create or replace view public.profiles_public as
  select
    id,
    full_name,
    avatar_url,
    role,
    kyc_statut,   -- statut seulement (pas les URLs des documents)
    created_at
  from public.profiles;

-- Autoriser la lecture de la vue aux rôles publics
grant select on public.profiles_public to anon;
grant select on public.profiles_public to authenticated;

-- ───────────────────────────────────────────
-- 5. Commentaires pour documentation
-- ───────────────────────────────────────────
comment on view public.profiles_public is
  'Vue publique des profils — ne contient pas phone, email, kyc_cni_url, kyc_selfie_url. '
  'Les admins utilisent la table profiles directement via la service role key.';
