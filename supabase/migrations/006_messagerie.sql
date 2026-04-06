-- Migration 006: Tables conversations et messages
-- Dépendances: 001_profiles
-- Note: activer Supabase Realtime sur la table messages via Dashboard
-- Dashboard > Database > Replication > cocher "messages"

create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  bien_id         uuid references public.biens(id) on delete set null,
  -- Les deux participants
  participant_1   uuid not null references public.profiles(id) on delete cascade,
  participant_2   uuid not null references public.profiles(id) on delete cascade,
  -- Dernier message (dénormalisé pour perf)
  dernier_message text,
  dernier_message_at timestamptz,
  -- Compteurs non lus
  non_lus_p1      integer not null default 0,
  non_lus_p2      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Unicité: une seule conversation par paire + bien
  unique(participant_1, participant_2, bien_id)
);

create index if not exists conversations_p1_idx on public.conversations(participant_1);
create index if not exists conversations_p2_idx on public.conversations(participant_2);

alter table public.conversations enable row level security;

create policy "Participant voit ses conversations"
  on public.conversations for select
  using (participant_1 = auth.uid() or participant_2 = auth.uid());

create policy "Participant crée une conversation"
  on public.conversations for insert
  with check (participant_1 = auth.uid() or participant_2 = auth.uid());

create policy "Participant met à jour sa conversation"
  on public.conversations for update
  using (participant_1 = auth.uid() or participant_2 = auth.uid());

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.set_updated_at();

-- Table messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  expediteur_id   uuid not null references public.profiles(id) on delete cascade,
  contenu         text not null,
  lu              boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at desc);
create index if not exists messages_expediteur_idx on public.messages(expediteur_id);

alter table public.messages enable row level security;

create policy "Participant lit les messages de ses conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

create policy "Participant envoie un message"
  on public.messages for insert
  with check (
    expediteur_id = auth.uid() and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

-- Table favoris
create table if not exists public.favoris (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  bien_id     uuid not null references public.biens(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(user_id, bien_id)
);

create index if not exists favoris_user_idx on public.favoris(user_id);

alter table public.favoris enable row level security;

create policy "Utilisateur gère ses favoris"
  on public.favoris for all using (user_id = auth.uid());
