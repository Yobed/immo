-- Migration 004: Table reservations
-- Dépendances: 001_profiles, 002_biens

create table if not exists public.reservations (
  id              uuid primary key default gen_random_uuid(),
  bien_id         uuid not null references public.biens(id) on delete restrict,
  locataire_id    uuid not null references public.profiles(id) on delete restrict,
  proprietaire_id uuid not null references public.profiles(id) on delete restrict,

  -- Période
  date_debut      date not null,
  date_fin        date,               -- null pour location longue durée
  duree_mois      integer,            -- pour longue durée

  -- Montants (FCFA)
  montant_total_fcfa   integer not null,
  montant_loyer_fcfa   integer not null,
  charges_fcfa         integer not null default 0,
  depot_garantie_fcfa  integer not null default 0,
  commission_fcfa      integer not null default 0,  -- 10% plateforme

  -- Statut
  statut          text not null default 'en_attente'
                    check (statut in ('en_attente','confirmee','annulee','terminee')),

  -- Méta
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index
create index if not exists reservations_bien_idx on public.reservations(bien_id);
create index if not exists reservations_locataire_idx on public.reservations(locataire_id);
create index if not exists reservations_proprietaire_idx on public.reservations(proprietaire_id);
create index if not exists reservations_dates_idx on public.reservations(date_debut, date_fin);

-- Contrainte: pas de chevauchement de réservations sur un même bien
-- (géré au niveau application + vérification avant insert)

-- RLS
alter table public.reservations enable row level security;

create policy "Locataire voit ses réservations"
  on public.reservations for select
  using (locataire_id = auth.uid());

create policy "Propriétaire voit les réservations de ses biens"
  on public.reservations for select
  using (proprietaire_id = auth.uid());

create policy "Locataire crée une réservation"
  on public.reservations for insert
  with check (locataire_id = auth.uid());

create policy "Propriétaire ou locataire modifie la réservation"
  on public.reservations for update
  using (locataire_id = auth.uid() or proprietaire_id = auth.uid());

-- updated_at automatique
create trigger reservations_updated_at
  before update on public.reservations
  for each row execute procedure public.set_updated_at();
