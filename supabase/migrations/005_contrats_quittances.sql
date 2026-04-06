-- Migration 005: Tables contrats et quittances
-- Dépendances: 004_reservations

create table if not exists public.contrats (
  id                uuid primary key default gen_random_uuid(),
  reservation_id    uuid not null references public.reservations(id) on delete restrict,
  locataire_id      uuid not null references public.profiles(id) on delete restrict,
  proprietaire_id   uuid not null references public.profiles(id) on delete restrict,
  bien_id           uuid not null references public.biens(id) on delete restrict,

  -- Données contrat
  date_debut        date not null,
  date_fin          date,
  duree_mois        integer,
  loyer_mois_fcfa   integer not null,
  charges_mois_fcfa integer not null default 0,
  depot_garantie_fcfa integer not null default 0,

  -- PDF stocké dans Supabase Storage
  pdf_url           text,

  -- Statut
  statut            text not null default 'en_attente'
                      check (statut in ('en_attente','signe','resilie','expire')),

  -- Méta
  clauses_supplementaires text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists contrats_reservation_idx on public.contrats(reservation_id);
create index if not exists contrats_locataire_idx on public.contrats(locataire_id);
create index if not exists contrats_proprietaire_idx on public.contrats(proprietaire_id);

alter table public.contrats enable row level security;

create policy "Locataire voit ses contrats"
  on public.contrats for select using (locataire_id = auth.uid());

create policy "Propriétaire voit ses contrats"
  on public.contrats for select using (proprietaire_id = auth.uid());

create policy "Système crée les contrats"
  on public.contrats for insert with check (
    locataire_id = auth.uid() or proprietaire_id = auth.uid()
  );

create trigger contrats_updated_at
  before update on public.contrats
  for each row execute procedure public.set_updated_at();

-- Table quittances
create table if not exists public.quittances (
  id                uuid primary key default gen_random_uuid(),
  contrat_id        uuid not null references public.contrats(id) on delete restrict,
  locataire_id      uuid not null references public.profiles(id) on delete restrict,
  proprietaire_id   uuid not null references public.profiles(id) on delete restrict,

  -- Période
  mois              date not null,  -- 1er du mois concerné

  -- Montants (FCFA)
  montant_loyer_fcfa    integer not null,
  montant_charges_fcfa  integer not null default 0,
  montant_total_fcfa    integer not null,

  -- Paiement
  date_echeance     date not null,
  date_paiement     date,

  -- Statut
  statut            text not null default 'en_attente'
                      check (statut in ('en_attente','payee','en_retard','annulee')),

  -- PDF
  pdf_url           text,

  -- Méta
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists quittances_contrat_mois_idx on public.quittances(contrat_id, mois);
create index if not exists quittances_locataire_idx on public.quittances(locataire_id);
create index if not exists quittances_statut_idx on public.quittances(statut);

alter table public.quittances enable row level security;

create policy "Locataire voit ses quittances"
  on public.quittances for select using (locataire_id = auth.uid());

create policy "Propriétaire voit les quittances de ses contrats"
  on public.quittances for select using (proprietaire_id = auth.uid());

create policy "Système crée les quittances"
  on public.quittances for insert with check (proprietaire_id = auth.uid());

create policy "Système met à jour les quittances"
  on public.quittances for update using (proprietaire_id = auth.uid());

create trigger quittances_updated_at
  before update on public.quittances
  for each row execute procedure public.set_updated_at();
