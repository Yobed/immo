-- Migration 007: Tables visites et avis
-- Dépendances: 001_profiles, 002_biens

create table if not exists public.visites (
  id              uuid primary key default gen_random_uuid(),
  bien_id         uuid not null references public.biens(id) on delete cascade,
  locataire_id    uuid not null references public.profiles(id) on delete cascade,
  proprietaire_id uuid not null references public.profiles(id) on delete cascade,
  date_souhaitee  date not null,
  heure_debut     time,
  heure_fin       time,
  statut          text not null default 'en_attente'
                    check (statut in ('en_attente','confirmee','annulee','effectuee')),
  notes           text,
  feedback        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists visites_bien_idx on public.visites(bien_id);
create index if not exists visites_locataire_idx on public.visites(locataire_id);

alter table public.visites enable row level security;

create policy "Locataire voit ses visites"
  on public.visites for select using (locataire_id = auth.uid());

create policy "Propriétaire voit les visites de ses biens"
  on public.visites for select using (proprietaire_id = auth.uid());

create policy "Locataire demande une visite"
  on public.visites for insert with check (locataire_id = auth.uid());

create policy "Propriétaire confirme ou refuse"
  on public.visites for update using (proprietaire_id = auth.uid() or locataire_id = auth.uid());

create trigger visites_updated_at
  before update on public.visites
  for each row execute procedure public.set_updated_at();

-- Table avis
create table if not exists public.avis (
  id                uuid primary key default gen_random_uuid(),
  auteur_id         uuid not null references public.profiles(id) on delete cascade,
  cible_id          uuid not null references public.profiles(id) on delete cascade,
  reservation_id    uuid references public.reservations(id) on delete set null,
  note              integer not null check (note between 1 and 5),
  commentaire       text,
  reponse_cible     text,  -- réponse du propriétaire à l'avis
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Un seul avis par auteur/cible/réservation
  unique(auteur_id, cible_id, reservation_id)
);

create index if not exists avis_cible_idx on public.avis(cible_id);
create index if not exists avis_auteur_idx on public.avis(auteur_id);

alter table public.avis enable row level security;

create policy "Avis visibles par tous"
  on public.avis for select using (true);

create policy "Auteur crée un avis"
  on public.avis for insert with check (auteur_id = auth.uid());

create policy "Cible répond à un avis"
  on public.avis for update using (cible_id = auth.uid() or auteur_id = auth.uid());

create trigger avis_updated_at
  before update on public.avis
  for each row execute procedure public.set_updated_at();
