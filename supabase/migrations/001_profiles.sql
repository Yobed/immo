-- Migration 001: Table profiles + trigger création automatique
-- Dépendances: aucune (table racine)

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null default '',
  phone         text,
  avatar_url    text,
  role          text not null default 'locataire'
                  check (role in ('locataire', 'proprietaire', 'agence', 'admin')),
  -- KYC
  kyc_statut    text not null default 'non_verifie'
                  check (kyc_statut in ('non_verifie', 'en_cours', 'verifie')),
  kyc_cni_url   text,
  kyc_selfie_url text,
  -- Meta
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index email pour lookup rapide
create index if not exists profiles_email_idx on public.profiles(email);

-- RLS
alter table public.profiles enable row level security;

create policy "Profil public visible par tous"
  on public.profiles for select
  using (true);

create policy "Utilisateur modifie son propre profil"
  on public.profiles for update
  using (id = auth.uid());

create policy "Utilisateur insère son propre profil"
  on public.profiles for insert
  with check (id = auth.uid());

-- Trigger: créer automatiquement un profil à chaque inscription
-- CRITIQUE: security definer obligatoire, sinon le trigger s'exécute
-- avec les droits de l'utilisateur inséré (qui n'a pas accès à profiles)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    role,
    full_name
  ) values (
    new.id,
    new.email,
    coalesce(
      (new.raw_user_meta_data->>'role')::text,
      'locataire'
    ),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fonction updated_at automatique (partagée par toutes les migrations suivantes)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
