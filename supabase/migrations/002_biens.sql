-- Migration 002: Table biens
-- Dépendances: 001_profiles (profiles.id)

create table if not exists public.biens (
  id              uuid primary key default gen_random_uuid(),
  proprietaire_id uuid not null references public.profiles(id) on delete cascade,

  -- Informations de base
  titre           text not null,
  description     text not null default '',
  type_bien       text not null
                    check (type_bien in ('studio','appartement','villa','maison',
                                        'bureau','commerce','terrain','residence_meublee')),

  -- Localisation
  commune         text not null,
  quartier        text,
  adresse_complete text,
  latitude        double precision,
  longitude       double precision,

  -- Caractéristiques
  surface_m2      integer,
  nb_pieces       integer,
  nb_chambres     integer,
  nb_salles_bain  integer,
  etage           integer,
  nb_etages_total integer,

  -- Prix (toujours en FCFA)
  prix_mois_fcfa  integer,           -- Location longue durée
  prix_nuit_fcfa  integer,           -- Location courte durée
  prix_vente_fcfa bigint,            -- Vente
  charges_mois_fcfa integer default 0,
  depot_garantie_fcfa integer,       -- nb de mois x loyer

  -- Équipements (array de texte)
  equipements     text[] default '{}',
  -- Ex: ['climatisation','wifi','parking','gardien','groupe_electrogene','piscine']

  -- Statut
  statut          text not null default 'brouillon'
                    check (statut in ('brouillon','publie','suspendu','archive')),

  -- Méta
  vues_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index
create index if not exists biens_proprietaire_idx on public.biens(proprietaire_id);
create index if not exists biens_statut_commune_idx on public.biens(statut, commune);
create index if not exists biens_type_idx on public.biens(type_bien);

-- Full-text search (français)
alter table public.biens
  add column if not exists fts tsvector
    generated always as (
      to_tsvector('french', coalesce(titre, '') || ' ' || coalesce(description, '') || ' ' || coalesce(commune, '') || ' ' || coalesce(quartier, ''))
    ) stored;
create index if not exists biens_fts_idx on public.biens using gin(fts);

-- RLS
alter table public.biens enable row level security;

create policy "Biens publiés visibles par tous"
  on public.biens for select
  using (statut = 'publie');

create policy "Propriétaire voit tous ses biens"
  on public.biens for select
  using (proprietaire_id = auth.uid());

create policy "Propriétaire crée ses biens"
  on public.biens for insert
  with check (proprietaire_id = auth.uid());

create policy "Propriétaire modifie ses biens"
  on public.biens for update
  using (proprietaire_id = auth.uid());

create policy "Propriétaire supprime ses biens"
  on public.biens for delete
  using (proprietaire_id = auth.uid());

-- updated_at automatique
create trigger biens_updated_at
  before update on public.biens
  for each row execute procedure public.set_updated_at();
