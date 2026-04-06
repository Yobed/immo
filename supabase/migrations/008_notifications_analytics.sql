-- Migration 008: Tables notifications et analytics_events
-- Dépendances: 001_profiles

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  -- Types: 'loyer_rappel', 'loyer_retard', 'reservation_nouvelle',
  --        'visite_confirmee', 'message_recu', 'avis_recu', 'kyc_valide'
  titre       text not null,
  contenu     text not null,
  lu          boolean not null default false,
  -- Lien vers la ressource concernée
  lien_type   text,   -- 'reservation', 'bien', 'contrat', 'quittance'
  lien_id     uuid,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_lu_idx on public.notifications(user_id, lu);
create index if not exists notifications_user_date_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Utilisateur voit ses notifications"
  on public.notifications for select using (user_id = auth.uid());

create policy "Utilisateur marque ses notifications lues"
  on public.notifications for update using (user_id = auth.uid());

create policy "Système insère des notifications"
  on public.notifications for insert with check (true);
-- Note: Les insertions via service_role key contournent RLS.
-- Le with check (true) permet aussi l'insertion par triggers futurs.

-- Table analytics_events
create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  bien_id     uuid references public.biens(id) on delete set null,
  event_type  text not null,
  -- Types: 'vue_bien', 'contact_proprietaire', 'demande_visite',
  --        'reservation_initiee', 'reservation_confirmee', 'signature_contrat'
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists analytics_bien_idx on public.analytics_events(bien_id, event_type);
create index if not exists analytics_user_idx on public.analytics_events(user_id);
create index if not exists analytics_date_idx on public.analytics_events(created_at desc);

alter table public.analytics_events enable row level security;

create policy "Propriétaire voit les analytics de ses biens"
  on public.analytics_events for select
  using (
    bien_id is null or
    exists (select 1 from public.biens where id = bien_id and proprietaire_id = auth.uid())
  );

create policy "Système insère les events"
  on public.analytics_events for insert with check (true);

-- Paiements (table complète pour Phase 3 mais structure créée maintenant)
create table if not exists public.paiements (
  id                  uuid primary key default gen_random_uuid(),
  reservation_id      uuid references public.reservations(id) on delete set null,
  payeur_id           uuid not null references public.profiles(id) on delete restrict,
  beneficiaire_id     uuid references public.profiles(id) on delete set null,
  montant_total_fcfa  integer not null,
  commission_fcfa     integer not null default 0,
  montant_net_fcfa    integer not null,
  methode             text check (methode in ('wave','orange_money','mtn','moov','carte_bancaire')),
  statut              text not null default 'initie'
                        check (statut in ('initie','en_cours','succes','echec','annule','rembourse')),
  cinetpay_transaction_id text,
  cinetpay_payment_token  text,
  metadata            jsonb default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists paiements_reservation_idx on public.paiements(reservation_id);
create index if not exists paiements_payeur_idx on public.paiements(payeur_id);
create index if not exists paiements_statut_idx on public.paiements(statut);

alter table public.paiements enable row level security;

create policy "Payeur voit ses paiements"
  on public.paiements for select using (payeur_id = auth.uid());

create policy "Bénéficiaire voit les paiements reçus"
  on public.paiements for select using (beneficiaire_id = auth.uid());

create policy "Système crée les paiements"
  on public.paiements for insert with check (payeur_id = auth.uid());

create trigger paiements_updated_at
  before update on public.paiements
  for each row execute procedure public.set_updated_at();
