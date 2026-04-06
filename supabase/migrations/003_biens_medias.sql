-- Migration 003: Table biens_medias
-- Dépendances: 002_biens (biens.id)

create table if not exists public.biens_medias (
  id              uuid primary key default gen_random_uuid(),
  bien_id         uuid not null references public.biens(id) on delete cascade,

  -- Type de média
  type            text not null check (type in ('photo','video','vue_360','plan')),

  -- Source selon le type
  -- photos  → URL Cloudinary (optimisée, CDN)
  -- vidéos  → URL Supabase Storage
  -- 360°    → URL Supabase Storage (photo équirectangulaire .jpg)
  -- plans   → URL Supabase Storage (PDF ou image)
  url             text not null,

  -- Pour vidéos : embed YouTube/Vimeo alternatif
  embed_url       text,

  -- Métadonnées affichage
  titre           text,        -- ex: "Salon", "Cuisine", "Chambre principale"
  ordre           integer not null default 0,  -- position dans le carousel
  est_couverture  boolean default false,        -- photo principale de la fiche

  -- Dimensions (pour lazy loading optimal)
  largeur         integer,
  hauteur         integer,

  -- Pour vidéos
  duree_sec       integer,     -- durée en secondes

  -- Pour 360° : hotspots (points d'intérêt cliquables sur la vue)
  hotspots        jsonb default '[]',
  -- Format : [{"pitch": -5, "yaw": 120, "texte": "Cuisine équipée"}]

  created_at      timestamptz default now()
);

-- Index composite pour récupérer les médias d'un bien dans le bon ordre
create index if not exists biens_medias_bien_ordre_idx on public.biens_medias(bien_id, ordre);

-- Un seul média couverture par bien
create unique index if not exists biens_medias_couverture_unique_idx
  on public.biens_medias(bien_id)
  where est_couverture = true;

-- RLS
alter table public.biens_medias enable row level security;

create policy "Médias des biens publiés visibles par tous"
  on public.biens_medias for select
  using (
    exists (select 1 from public.biens where id = bien_id and statut = 'publie')
  );

create policy "Propriétaire voit ses médias (brouillon inclus)"
  on public.biens_medias for select
  using (
    exists (select 1 from public.biens where id = bien_id and proprietaire_id = auth.uid())
  );

create policy "Propriétaire gère ses médias"
  on public.biens_medias for all
  using (
    exists (select 1 from public.biens where id = bien_id and proprietaire_id = auth.uid())
  );
