# Plan — Espaces dédiés Agences Immobilières

> Décisions produit à trancher avant toute migration BD.
> Une fois ces choix faits, l'implémentation technique est ~2-3 jours.

## Pourquoi ce document

Les rôles existants (`proprietaire`, `admin`, `client`) couvrent déjà la publication de biens et la prise de visite. Une agence peut donc déjà s'inscrire comme `proprietaire`.

Ce qui manque, c'est :
- **Identité visuelle** : logo, nom commercial, slug public (ex. `/agences/ivoire-immo`)
- **Multi-utilisateurs** : plusieurs agents d'une même agence
- **KYC dédié** : registre du commerce, attestation pro
- **Vitrine publique** : page listant tous les biens de l'agence

Avant de coder, il faut trancher 5 questions produit.

---

## Question 1 — Modèle structurel

| Option A — Profile étendu | Option B — Table dédiée `agences` |
|---|---|
| 1 utilisateur = 1 agence | Table `agences` séparée + `profiles.agence_id` |
| Pas de multi-utilisateurs | Plusieurs agents peuvent appartenir à une agence |
| Migration légère | Migration moyenne |
| Pas d'évolution vers équipes | Évolution naturelle vers équipes/permissions |
| **Convient si** : 90% des agences sont solo | **Convient si** : tu vises des agences avec 3-15 agents |

**Recommandation** : Option B si tu veux scaler vers des agences "vraies", Option A si tu veux juste différencier visuellement.

---

## Question 2 — KYC et validation

Une agence doit-elle :
- (a) S'auto-inscrire et publier immédiatement (comme un proprio individuel)
- (b) Soumettre un KYC dédié (RCCM, attestation pro, logo) puis être validée manuellement par toi
- (c) Être créée uniquement par un admin BOGBE'S (pas d'inscription publique)

L'option (b) est la plus pro mais ralentit l'onboarding.
L'option (a) est rapide mais permet aux pseudo-agences de se faire passer pour vraies.

---

## Question 3 — Rattachement des biens

Quand un agent d'une agence publie un bien, qui est "propriétaire" légal du bien dans la BD ?

- (a) L'agent (`bien.proprietaire_id = agent.id`) + un champ optionnel `bien.agence_id`
- (b) L'agence (`bien.proprietaire_id = agence.id` si on traite l'agence comme un profile)
- (c) L'agent ET on stocke la commission dans la table

Impact : qui reçoit la notification proprio quand un client veut visiter ? L'agent qui a publié ou l'agence (admin de l'agence) ?

---

## Question 4 — Modèle économique

L'agence paie pour avoir son espace ?

- (a) Gratuit (comme un proprio) — focus volume
- (b) Abonnement mensuel (ex. 25 000 FCFA/mois pour 50 annonces)
- (c) Commission par transaction validée
- (d) Mix : gratuit pour les 5 premiers biens, payant au-delà

Impact sur la BD : table `abonnements`, `factures`, intégration CinetPay…

---

## Question 5 — Branding sur le site

Comment l'agence apparaît côté public ?

- (a) Discret : juste un badge "Publié par agence X" sur la fiche bien + page agence basique
- (b) Mis en avant : carrousel "Agences partenaires" sur la home, logos sur les cards de biens, page agence avec photos/vidéos
- (c) Full marque blanche : sous-domaine `agence-x.bogbes.com` (gros chantier)

---

## Proposition de Sprint 1 (minimaliste — 2 jours dev une fois les Q1-Q5 tranchées)

**Si choix : B + b + a + a + a** (le plus probable pour démarrer)

### Migration SQL
```sql
-- 018_agences.sql
create table public.agences (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,         -- "ivoire-immo" → /agences/ivoire-immo
  nom_commercial  text not null,
  description     text,
  logo_url        text,
  telephone_public text,
  email_public    text,
  rccm            text,                          -- registre commerce
  kyc_statut      text default 'en_attente' check (kyc_statut in ('en_attente','verifie','rejete')),
  kyc_documents   jsonb default '[]',
  created_by      uuid references public.profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Membres de l'agence (1 agent peut appartenir à 1 seule agence)
alter table public.profiles
  add column if not exists agence_id uuid references public.agences(id) on delete set null,
  add column if not exists agence_role text check (agence_role in ('admin','agent') or agence_role is null);

-- Bien rattaché à une agence (optionnel)
alter table public.biens
  add column if not exists agence_id uuid references public.agences(id) on delete set null;

-- Le role 'agence' n'est PAS un role profile — c'est une appartenance.
-- Un profile reste 'proprietaire' (ou 'client'), et agence_id lui ajoute la dimension "agence".

create index if not exists agences_slug_idx on public.agences(slug);
create index if not exists profiles_agence_idx on public.profiles(agence_id);
create index if not exists biens_agence_idx on public.biens(agence_id);

-- RLS : agence visible par tous, modifiable par membres admin
alter table public.agences enable row level security;

create policy "Agence publique en lecture"
  on public.agences for select using (kyc_statut = 'verifie');

create policy "Admin agence édite son agence"
  on public.agences for update
  using (id in (
    select agence_id from public.profiles
    where id = auth.uid() and agence_role = 'admin'
  ));
```

### Pages à créer
- `app/(public)/agences/page.tsx` — annuaire des agences vérifiées
- `app/(public)/agences/[slug]/page.tsx` — vitrine d'une agence
- `app/(pro)/agence/page.tsx` — dashboard membre agence
- `app/(pro)/agence/membres/page.tsx` — admin agence gère ses agents
- `app/(pro)/agence/parametres/page.tsx` — édition profil agence

### Composants à créer
- `components/agences/AgenceBadge.tsx` (sur fiche bien)
- `components/agences/AgenceCard.tsx` (annuaire)
- `components/agences/AgenceHero.tsx` (vitrine)

### Intégrations
- Sapphire (`lib/ai/tools.ts`) : afficher le badge agence dans le catalogue
- Webhook visites : notifier l'admin de l'agence + l'agent qui a publié
- Module KYC : workflow validation agences (`/admin/moderation/agences`)

---

## Estimation effort

| Étape | Effort |
|---|---|
| Tranche Q1-Q5 (toi) | 1h de réflexion |
| Migration BD | 2h |
| Pages publiques (annuaire + vitrine) | 4h |
| Dashboard agence (édition, membres) | 6h |
| Workflow KYC + admin moderation | 4h |
| Intégration Sapphire + notifications | 2h |
| QA + déploiement | 2h |
| **Total** | **~20h** = 2-3 jours dev |

---

## Recommandation

**Étape 1** : Tu réponds aux 5 questions ci-dessus (10 min)
**Étape 2** : Je crée la migration + les pages selon tes choix
**Étape 3** : On itère sur la version live avec les premiers retours agences pilotes

Ne pas faire la migration tant que les questions 1, 3, 4 ne sont pas tranchées — ce sont les plus structurantes.
