# Phase 1: Fondations & Infrastructure - Research

**Researched:** 2026-04-05
**Domain:** Turborepo monorepo, Next.js App Router, Expo SDK, Supabase Auth/RLS, Tailwind CSS, Vercel
**Confidence:** HIGH (stack verified against npm registry + official docs)

---

## Summary

Phase 1 pose les fondations techniques de toute la plateforme. La stack choisie (Turborepo + Next.js + Expo + Supabase) est solide et bien documentée, mais trois points méritent attention :

**Point critique #1 — Version Next.js :** Le projet spécifie "Next.js 14" dans skills.md mais la version `latest` sur npm est Next.js **16.2.2** (sortie fin 2025). Next.js 14 est toujours disponible sous le tag `next-14` (14.2.35) et reste maintenu. La décision de rester sur Next.js 14 est défendable pour la stabilité — mais le planner doit en être conscient et verrouiller la version explicitement (`"next": "14.2.35"`).

**Point critique #2 — Expo SDK :** Le projet spécifie "Expo SDK 51" mais la version `latest` est **55.0.11**. Expo SDK 52+ apporte la détection automatique des monorepos (élimine la config Metro manuelle). La migration de SDK 51 vers 52+ est possible mais introduit des breaking changes (new architecture, suppression expo-camera legacy). La recommandation est d'utiliser **Expo SDK 52** minimum pour la détection monorepo automatique.

**Point critique #3 — Tailwind CSS :** La version `latest` est **4.2.2** (CSS-first, suppression de tailwind.config.ts). Le design system documenté dans skills.md utilise une syntaxe tailwind.config.ts (v3). Il faut soit verrouiller sur Tailwind v3 (`"tailwindcss": "^3.4.x"`), soit adapter la config au format CSS-first de v4.

**Recommandation principale :** Verrouiller Next.js@14.2.35, utiliser Expo SDK 52+, rester sur Tailwind CSS v3.4.x pour compatibilité avec le design system documenté.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOND-01 | Monorepo Turborepo initialisé avec apps/web, apps/mobile, packages/shared | Turborepo 2.9.3 + npm workspaces. Structure détaillée dans skills.md section 2. |
| FOND-02 | App Next.js 14 (App Router, TypeScript strict) fonctionnelle | Next.js 14.2.35 disponible via tag `next-14`. tsconfig strict mode documenté. |
| FOND-03 | App Expo SDK 51 (Expo Router) fonctionnelle | SDK 52+ recommandé pour auto-détection monorepo. Expo Router 55.0.10 disponible. |
| FOND-04 | Package partagé packages/shared avec types TypeScript et utils | Pattern workspace standard Turborepo, types générés par Supabase CLI. |
| FOND-05 | Design system Tailwind configuré (palette CI, typographie, borderRadius) | tailwind.config.ts complet fourni dans skills.md section 3. Tailwind v3 recommandé. |
| FOND-06 | Variables d'environnement documentées et validées au démarrage | Liste complète dans skills.md section 11. Valider avec zod/t3-env au démarrage. |
| AUTH-01 | Utilisateur peut s'inscrire avec email + mot de passe | @supabase/supabase-js 2.101.1 + @supabase/ssr 0.10.0. Pattern documenté. |
| AUTH-02 | Utilisateur peut se connecter via Google OAuth | Supabase Dashboard > Authentication > Providers > Google. Callback URL à configurer. |
| AUTH-03 | Utilisateur peut s'inscrire / se connecter via OTP téléphone (WhatsApp ou SMS) | supabase.auth.signInWithOtp({ phone }) — Twilio ou WhatsApp Business à configurer. |
| AUTH-04 | Session persiste entre les navigations (Supabase SSR middleware) | middleware.ts avec @supabase/ssr. Utiliser getUser() (jamais getSession()) côté serveur. |
| AUTH-05 | Profil créé automatiquement dans profiles à l'inscription (trigger ou webhook) | Trigger PostgreSQL handle_new_user() sur auth.users INSERT — pattern standard Supabase. |
| AUTH-06 | Routes protégées selon le rôle (locataire / propriétaire / agence / admin) | Middleware Next.js + champ role dans profiles. Pattern matcher sur routes. |
| BDD-01 | Migration 001 — table profiles avec RLS | DDL + RLS policies documentées. Ordre critique : profiles en premier (FK). |
| BDD-02 | Migration 002 — table biens avec RLS | Dépend de profiles (proprietaire_id FK). |
| BDD-03 | Migration 003 — table biens_medias avec RLS | SQL complet fourni dans skills.md section 4. Index bien_id + ordre. |
| BDD-04 | Migration 004 — table reservations avec RLS | Dépend de biens et profiles. |
| BDD-05 | Migration 005 — tables contrats et quittances avec RLS | Dépend de reservations. |
| BDD-06 | Migration 006 — tables conversations et messages avec RLS | Realtime à activer sur messages. |
| BDD-07 | Migration 007 — tables visites et avis avec RLS | |
| BDD-08 | Migration 008 — tables notifications et analytics_events avec RLS | |
| BDD-09 | Types TypeScript générés depuis Supabase CLI dans packages/shared/types/database.ts | `npx supabase gen types typescript --project-id ID > packages/shared/types/database.ts` |
| LAND-01 | Landing page 10 sections (Hero, Comment ça marche, Biens vedette, etc.) | Next.js 14 App Router SSG/SSR. 10 sections listées dans skills.md section 13. |
| LAND-02 | Hero avec search bar IA + CTA App Store / Play Store | Composant client avec input + appel API chatbot. CTA links vers stores. |
| LAND-03 | SEO basique (meta tags, Open Graph, sitemap) | Metadata API Next.js 14 App Router (generateMetadata + sitemap.ts + robots.ts). |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 14.2.35 | Framework web React (App Router) | Spécifié dans la décision projet. Tag `next-14` maintenu. |
| react | 18.x (peer) | UI library | Peer dep de Next.js 14 |
| typescript | 6.0.2 | Typage statique | Strict mode obligatoire (skills.md) |
| turbo | 2.9.3 | Orchestrateur monorepo | Choisi dans la stack, réécriture Rust, cache puissant |
| @supabase/supabase-js | 2.101.1 | Client Supabase (BDD, Auth, Realtime) | Backend officiel de la plateforme |
| @supabase/ssr | 0.10.0 | Auth SSR pour Next.js App Router | Remplace @supabase/auth-helpers-nextjs, recommandé officiellement |
| tailwindcss | 3.4.x | Utility-first CSS | Config v3 documentée dans skills.md — verrouiller sur v3, pas v4 |
| zod | 4.3.6 | Validation de schémas | Standard formulaires + env vars |
| react-hook-form | 7.72.1 | Gestion formulaires | Performant, intégration zod |
| date-fns | 4.1.0 | Manipulation de dates | Lightweight, tree-shakeable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo | 52.x ou 55.0.11 | Framework mobile React Native | SDK 52+ recommandé pour auto-détection monorepo |
| expo-router | 55.0.10 | File-based routing mobile | Navigation Expo (onglets, deep links) |
| @supabase/auth-helpers-nextjs | DEPRECATED | — | Ne pas utiliser — utiliser @supabase/ssr à la place |
| next-cloudinary | 6.17.5 | Upload/optimisation images Cloudinary | Phase 2 (upload médias) |
| pannellum-react | 1.2.4 | Vue 360° | Phase 2 (composant Bien360) |
| @react-pdf/renderer | latest | Génération PDF contrats | Phase 3 |

### Alternatives Considérées
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm workspaces | pnpm workspaces | pnpm recommandé pour monorepos complexes, mais skills.md utilise npm — rester cohérent |
| Tailwind CSS v3 | Tailwind CSS v4 | v4 = CSS-first (plus de tailwind.config.ts). Design system documenté dans skills.md est v3. Ne pas migrer en Phase 1. |
| Next.js 14 | Next.js 16 | Next.js 16 = default Turbopack, async params obligatoires, proxy.ts au lieu de middleware.ts. Breaking changes non justifiés en Phase 1. |
| Expo SDK 51 | Expo SDK 52+ | SDK 52 = auto-détection monorepo. Pas de config Metro manuelle. Recommandé. |

**Installation commandes de base :**
```bash
# 1. Créer le monorepo
npx create-turbo@latest immo-ci --package-manager npm
cd immo-ci

# 2. App web
cd apps/web && npm install next@14.2.35 react@18 react-dom@18 typescript
npm install @supabase/supabase-js @supabase/ssr
npm install tailwindcss@^3.4 postcss autoprefixer
npm install zod react-hook-form date-fns

# 3. App mobile (Expo SDK 52+)
cd apps/mobile && npx create-expo-app@latest . --template blank-typescript
npx expo install expo-router@latest

# 4. Supabase CLI (déjà disponible : v2.84.10)
npx supabase init  # dans le dossier supabase/
```

**Versions vérifiées le 2026-04-05 :**
- `next@next-14` : 14.2.35 (tag npm maintenu)
- `next@latest` : 16.2.2 (ne pas utiliser en Phase 1)
- `turbo@latest` : 2.9.3
- `@supabase/supabase-js@latest` : 2.101.1
- `@supabase/ssr@latest` : 0.10.0
- `tailwindcss@latest` : 4.2.2 (Tailwind v4 — verrouiller sur ^3.4)
- `expo@latest` : 55.0.11 (SDK 55)
- `typescript@latest` : 6.0.2
- `zod@latest` : 4.3.6
- `react-hook-form@latest` : 7.72.1

---

## Architecture Patterns

### Structure du Projet Monorepo
```
immo-ci/
├── apps/
│   ├── web/                          # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (public)/             # Landing, search, fiche bien
│   │   │   ├── (auth)/               # Login, inscription, OTP
│   │   │   ├── (client)/             # Espace locataire
│   │   │   ├── (pro)/                # Espace propriétaire/agence
│   │   │   └── api/                  # Routes API
│   │   ├── components/
│   │   │   └── ui/                   # Button, Card, Badge, Input
│   │   └── lib/
│   │       └── supabase/             # client.ts, server.ts
│   └── mobile/                       # Expo SDK 52+
│       ├── app/                      # Expo Router (tabs)
│       └── lib/
├── packages/
│   ├── shared/                       # Types TS, utils, constantes
│   │   ├── types/                    # database.ts (généré Supabase CLI)
│   │   ├── constants/                # Communes CI, types biens
│   │   └── utils/                    # formatFCFA(), formatDate()
│   └── ui/                           # (Phase 2+)
├── supabase/
│   ├── migrations/                   # DDL SQL versionné
│   └── functions/                    # Edge Functions Deno
├── turbo.json
├── package.json                      # workspaces root
└── .env.local                        # Variables env (ne pas committer)
```

### Pattern 1: Supabase SSR Client (Next.js 14 App Router)
**Ce qu'il fait :** Crée des clients Supabase typés pour server components, server actions, et client components.
**Quand l'utiliser :** Tout accès à Supabase dans l'app web.

```typescript
// apps/web/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@immo-ci/shared/types/database'

export async function createClient() {
  const cookieStore = await cookies()  // await requis en Next.js 15+, fonctionne aussi en 14
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component — cookies en lecture seule */ }
        },
      },
    }
  )
}

// apps/web/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@immo-ci/shared/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 2: Middleware de Protection des Routes
**Ce qu'il fait :** Rafraîchit la session auth et redirige les routes protégées.
**Quand l'utiliser :** Root du projet web — intercepte toutes les requêtes.

```typescript
// apps/web/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITIQUE : utiliser getUser() jamais getSession() côté serveur
  const { data: { user } } = await supabase.auth.getUser()

  // Protéger les routes /pro/* et /client/*
  if (!user && (
    request.nextUrl.pathname.startsWith('/pro') ||
    request.nextUrl.pathname.startsWith('/client')
  )) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Pattern 3: Trigger PostgreSQL pour la Création de Profils
**Ce qu'il fait :** Crée automatiquement un profil dans `public.profiles` à chaque inscription.
**Quand l'utiliser :** Migration 001 — à définir dans le DDL SQL.

```sql
-- supabase/migrations/001_profiles.sql
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
```

### Pattern 4: Ordre des Migrations Supabase (critique)
**Ce qu'il fait :** Garantit l'ordre des FK — les tables référencées avant les tables référençantes.
**Quand l'utiliser :** Plan 01-02.

```
001_profiles.sql          — Aucune FK externe (base)
002_biens.sql             — FK → profiles (proprietaire_id)
003_biens_medias.sql      — FK → biens (bien_id)
004_reservations.sql      — FK → biens + profiles (locataire_id + proprietaire_id)
005_contrats_quittances.sql — FK → reservations
006_messagerie.sql        — FK → profiles (participants)
007_visites_avis.sql      — FK → biens + profiles
008_notifications_analytics.sql — FK → profiles
```

### Pattern 5: Tailwind CSS v3 — Design System CI
**Ce qu'il fait :** Configure la palette et la typo de la plateforme.
**Attention :** Verrouiller sur `tailwindcss@^3.4` — ne pas utiliser v4 (breaking changes).

```typescript
// apps/web/tailwind.config.ts — config complète dans skills.md section 3
// Palette : --primary #1A5276, --secondary #E67E22
// Fonts : Playfair Display (titres), DM Sans (body), JetBrains Mono (prix FCFA)
```

**Chargement des fonts via next/font/google (pas via @import Google Fonts) :**
```typescript
// apps/web/app/layout.tsx
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})
```

### Anti-Patterns à Éviter
- **Ne jamais appeler `getSession()` côté serveur :** Non sécurisé en SSR, utiliser `getUser()` qui valide avec le serveur Supabase.
- **Ne pas utiliser `@supabase/auth-helpers-nextjs` :** Déprécié, utiliser `@supabase/ssr`.
- **Ne pas verrouiller Tailwind sans version :** `npm install tailwindcss` installerait v4 (CSS-first, rupture avec la config v3 du design system).
- **Ne pas utiliser `@import` Google Fonts dans globals.css :** Utiliser `next/font/google` pour l'auto-hébergement et le score Lighthouse.
- **Ne pas mettre le trigger handle_new_user() après les RLS :** Si le trigger échoue, les inscriptions échouent. Tester en premier.
- **Ne pas oublier `security definer` sur le trigger :** Sans cela, le trigger s'exécute avec les droits de l'utilisateur inséré (pas les droits service).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session auth SSR | Logique cookies manuelle | @supabase/ssr | Gestion refresh token, PKCE flow, CSRF — très complexe |
| Validation env vars | if (!process.env.X) throw | @t3-oss/env-nextjs ou zod | Parse + validation au démarrage, DX supérieure |
| Protection de routes | Logique middleware custom | Pattern Supabase SSR middleware | Token refresh + redirect en une passe |
| Création profil à l'inscription | Logique côté client | Trigger PostgreSQL handle_new_user() | Atomique, fonctionne pour tous les providers auth |
| Types BDD | Types manuels | `supabase gen types typescript` | Types auto-générés depuis le vrai schéma, toujours à jour |
| Turborepo package resolution | Config webpack/metro manuelle | Turborepo 2.9.3 + workspaces standard | Expo SDK 52 auto-détecte, Turborepo gère le cache |

**Key insight :** Le pattern auth Supabase SSR est non-trivial à reproduire manuellement (refresh token, cookies httpOnly, PKCE flow). Utiliser exactement les patterns de la documentation officielle.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 installé à la place de v3
**What goes wrong :** `npm install tailwindcss` installe v4.2.2. La config `tailwind.config.ts` est ignorée silencieusement — tous les tokens custom (palette CI, typo) disparaissent.
**Why it happens :** Tag `latest` = v4. Le fichier de config v3 est valide syntaxiquement mais v4 ne le lit plus.
**How to avoid :** Verrouiller explicitement : `"tailwindcss": "^3.4.17"` dans package.json. Ajouter `postcss.config.js` (v3 le requiert, v4 non).
**Warning signs :** Classes `bg-primary`, `font-display`, `rounded-card` ne s'appliquent pas.

### Pitfall 2: getSession() côté serveur — faille de sécurité
**What goes wrong :** Session non validée côté serveur — un token forgé peut passer.
**Why it happens :** `getSession()` lit depuis les cookies sans re-valider avec le serveur Supabase.
**How to avoid :** Utiliser **exclusivement** `getUser()` dans middleware.ts et Server Components.
**Warning signs :** Tests d'intrusion montrent des sessions non invalidées après logout.

### Pitfall 3: Expo SDK 51 + monorepo — config Metro manuelle requise
**What goes wrong :** Metro ne résout pas les packages dans `packages/shared`.
**Why it happens :** SDK 51 et antérieur ne détecte pas les monorepos automatiquement.
**How to avoid :** Utiliser Expo SDK 52+ (auto-détection monorepo). Si SDK 51 obligatoire, configurer `metro.config.js` avec `watchFolders` et `nodeModulesPaths`.
**Warning signs :** `Module not found: packages/shared/utils` à l'exécution Expo.

### Pitfall 4: Trigger handle_new_user() bloque les inscriptions
**What goes wrong :** Toute erreur dans le trigger empêche l'inscription (trigger AFTER INSERT est atomique).
**Why it happens :** Si la table `profiles` a une contrainte NOT NULL sur un champ non fourni par le trigger.
**How to avoid :** Tous les champs obligatoires de `profiles` doivent avoir des valeurs par défaut ou être extraits de `raw_user_meta_data`. Tester avec les 3 providers (email, Google, OTP).
**Warning signs :** Erreur "insert or update on table 'profiles' violates foreign key constraint" dans les logs Supabase.

### Pitfall 5: Next.js 14 async params — non-breaking en 14, mais à anticiper
**What goes wrong :** En Next.js 15+, `params` et `searchParams` sont des Promises qui nécessitent `await`. En Next.js 14, ils sont synchrones.
**Why it happens :** API changeante entre versions.
**How to avoid :** Écrire `const { id } = await params` dès maintenant pour être compatible Next.js 15+ sans réécriture.
**Warning signs :** Erreurs TypeScript lors d'une migration future vers Next.js 15+.

### Pitfall 6: Ordre des migrations Supabase — FK violations
**What goes wrong :** Appliquer la migration `biens` avant `profiles` provoque une FK violation.
**Why it happens :** `biens.proprietaire_id` référence `profiles.id`.
**How to avoid :** Respecter l'ordre numérique des fichiers SQL. Toujours préfixer avec 3 chiffres : `001_`, `002_`, etc.
**Warning signs :** Erreur PostgreSQL `relation "public.profiles" does not exist` lors de l'application de migration 002.

### Pitfall 7: Variables d'environnement non validées
**What goes wrong :** L'app démarre sans `NEXT_PUBLIC_SUPABASE_URL` et échoue silencieusement à la première requête BDD.
**Why it happens :** Next.js ne valide pas les variables d'environnement par défaut.
**How to avoid :** Valider les env vars avec zod au démarrage (dans `lib/env.ts`), ou utiliser `@t3-oss/env-nextjs`.
**Warning signs :** Erreur "TypeError: Cannot read properties of undefined (reading 'from')" au lieu d'un message explicite.

---

## Code Examples

### Validation des Variables d'Environnement (FOND-06)
```typescript
// packages/shared/lib/env.ts ou apps/web/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = envSchema.parse(process.env)
```

### turbo.json minimal
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Génération des Types Supabase (BDD-09)
```bash
# Après avoir appliqué toutes les migrations
npx supabase gen types typescript \
  --project-id TON_PROJECT_ID \
  > packages/shared/types/database.ts

# Utilisation dans le client
import type { Database } from '@immo-ci/shared/types/database'
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: biens } = await supabase
  .from('biens')
  .select('*')
  .eq('statut', 'publie')
// `biens` est typé automatiquement
```

### Metadata SEO Next.js 14 App Router (LAND-03)
```typescript
// apps/web/app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://immo-ci.vercel.app'),
  title: {
    template: '%s | Immo CI',
    default: 'Immo CI — Immobilier en Côte d\'Ivoire',
  },
  description: 'Trouvez votre bien immobilier en Côte d\'Ivoire. Location, vente, résidences meublées à Abidjan et partout en CI.',
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    siteName: 'Immo CI',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

// apps/web/app/sitemap.ts
import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://immo-ci.vercel.app', lastModified: new Date(), priority: 1 },
    { url: 'https://immo-ci.vercel.app/search', priority: 0.8 },
    { url: 'https://immo-ci.vercel.app/auth/login', priority: 0.5 },
  ]
}
```

### RLS Policy Pattern Standard (BDD-01 à BDD-08)
```sql
-- Pattern réutilisable pour toutes les tables
alter table public.{table} enable row level security;

-- SELECT public (pour les données publiées)
create policy "{Table} publics visibles par tous"
  on public.{table} for select
  using (statut = 'publie');

-- SELECT privé (propriétaire voit ses propres données)
create policy "Propriétaire voit ses {tables}"
  on public.{table} for select
  using (proprietaire_id = auth.uid());

-- INSERT : utilisateur authentifié seulement
create policy "Utilisateur crée son {table}"
  on public.{table} for insert
  with check (user_id = auth.uid());

-- UPDATE/DELETE : propriétaire seulement
create policy "Propriétaire modifie ses {tables}"
  on public.{table} for update
  using (proprietaire_id = auth.uid());
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2024 | Déprécié — ne pas utiliser |
| Import @import Google Fonts | next/font/google | Next.js 13+ | Meilleur LCP, auto-hébergement, zero layout shift |
| getSession() côté serveur | getUser() côté serveur | Supabase 2023 | Sécurité — getSession() ne revalide pas |
| Metro config manuelle (monorepo Expo) | Auto-détection SDK 52+ | Expo SDK 52 (Nov 2024) | Supprime ~50 lignes de config manuelle |
| tailwind.config.ts (JS) | CSS-first @theme directive (v4) | Tailwind CSS v4 (Jan 2025) | Breaking change — rester sur v3 pour ce projet |
| Caching implicite Next.js (App Router) | "use cache" explicite | Next.js 16 (Oct 2025) | Non applicable si on reste sur Next.js 14 |

**Déprecié / obsolète :**
- `@supabase/auth-helpers-nextjs` : remplacé par `@supabase/ssr`
- `experimental-edge` runtime : utiliser `edge` (Next.js 15+, non applicable en v14)
- Config Metro manuelle Expo monorepo : remplacé par auto-détection SDK 52+

---

## Open Questions

1. **Version Next.js : verrouiller sur 14 ou migrer vers 15/16 ?**
   - Ce qu'on sait : Next.js 14.2.35 est disponible et maintenu. Next.js 16 est `latest`.
   - Ce qui est flou : Durée du maintien LTS de Next.js 14 par Vercel.
   - Recommandation : Rester sur Next.js 14.2.35 pour Phase 1 (cohérent avec skills.md). Évaluer migration en Phase 5.

2. **Version Expo SDK : 51 (spécifié) ou 52+ (recommandé) ?**
   - Ce qu'on sait : SDK 51 est spécifié dans skills.md, SDK 52 apporte l'auto-détection monorepo.
   - Ce qui est flou : Compatibilité SDK 51 avec les packages sélectionnés en Phase 1.
   - Recommandation : Utiliser **Expo SDK 52** minimum. L'auto-détection monorepo est une fonctionnalité clé qui simplifie significativement la configuration. SDK 55 (latest) est aussi une option valide.

3. **Phone OTP via SMS ou WhatsApp ?**
   - Ce qu'on sait : Les deux sont supportés par Supabase Auth. WhatsApp Business API requiert un compte Facebook/Meta Business approuvé.
   - Ce qui est flou : Disponibilité du compte WhatsApp Business en Phase 1.
   - Recommandation : Configurer SMS (Twilio ou Vonage) en Phase 1 pour unblock AUTH-03. WhatsApp comme canal optionnel si disponible.

4. **Supabase local dev ou remote project ?**
   - Ce qu'on sait : `supabase start` lance une instance locale Docker. Le projet peut aussi utiliser un projet remote Supabase.
   - Ce qui est flou : Le dev a-t-il Docker installé ?
   - Recommandation : Créer un projet Supabase remote (free tier) pour Phase 1 — évite la dépendance Docker locale.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Tout | ✓ | 24.13.0 | — |
| npm | Gestion packages | ✓ | 11.6.2 | — |
| Git | Versioning | ✓ | 2.53.0 | — |
| Supabase CLI | BDD-09, migrations | ✓ | 2.84.10 | — |
| Vercel CLI | LAND déploiement | ✓ | 50.35.0 | Déploiement via GitHub Actions |
| pnpm | Monorepo recommandé | ✗ | — | npm workspaces (disponible, moins optimal) |
| Docker | Supabase local dev | Non vérifié | — | Supabase remote (free tier) |

**Missing dependencies with no fallback :**
- Aucune dépendance bloquante identifiée pour Phase 1.

**Missing dependencies with fallback :**
- pnpm : npm workspaces fonctionne mais est moins performant pour monorepos. Si pnpm non disponible, continuer avec npm.
- Docker (Supabase local) : utiliser un projet Supabase remote free tier en Phase 1.

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md n'existe pas dans ce projet. Les contraintes sont issues de skills.md et STATE.md :

1. **Stack verrouillée :** Next.js 14 (App Router) + Expo SDK 51/52 + Supabase + Turborepo + CinetPay + Claude API
2. **Design system :** Bleu #1A5276 + Orange #E67E22, mobile-first, Playfair Display + DM Sans
3. **Droit CI :** Contrats OHADA, montants toujours en FCFA
4. **TypeScript strict :** Mode strict obligatoire sur toute la codebase
5. **Validation au démarrage :** Variables d'environnement validées au boot
6. **Structure projet :** Respecter exactement la structure de skills.md section 2
7. **Lingua :** Interface en français, prompts IA en français

---

## Validation Architecture

> `workflow.nyquist_validation` est `false` dans config.json. Section omise.

---

## Sources

### Primary (HIGH confidence)
- npm registry — versions vérifiées le 2026-04-05 : next, turbo, @supabase/supabase-js, @supabase/ssr, tailwindcss, expo, zod, react-hook-form, date-fns
- [Supabase SSR Next.js Docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware pattern, getUser() vs getSession()
- [Supabase Phone Login](https://supabase.com/docs/guides/auth/phone-login) — OTP config
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google) — OAuth setup
- [Supabase Generating Types](https://supabase.com/docs/guides/api/rest/generating-types) — CLI gen types
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS patterns
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — SEO
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) — next/font/google
- [Expo Monorepos Guide](https://docs.expo.dev/guides/monorepos/) — SDK 52 auto-detection
- skills.md du projet — stack complète, design system, structure, variables d'environnement

### Secondary (MEDIUM confidence)
- [Turborepo Medium 2025](https://medium.com/@beenakumawat002/turborepo-monorepo-in-2025-next-js-react-native-shared-ui-type-safe-api-%EF%B8%8F-6194c83adff9) — patterns monorepo 2025
- [Supabase trigger profiles discussion](https://github.com/orgs/supabase/discussions/306) — trigger handle_new_user
- [Expo SDK 52 changelog](https://expo.dev/changelog/2024-11-12-sdk-52) — auto-détection monorepo
- [Tailwind v4 migration guide](https://tailwindcss.com/docs/upgrade-guide) — breaking changes

### Tertiary (LOW confidence)
- [Next.js 16 InfoQ article](https://www.infoq.com/news/2025/12/nextjs-16-release/) — résumé Next.js 16 features (non vérifié via docs officielles)

---

## Metadata

**Confidence breakdown:**
- Standard stack : HIGH — versions vérifiées contre npm registry le 2026-04-05
- Architecture : HIGH — patterns issus des docs officielles Supabase + skills.md projet
- Pitfalls : HIGH — pitfalls 1, 2, 4, 6 vérifiés contre docs officielles ; pitfalls 3, 5, 7 HIGH via expérience documentée

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stack stable, mais vérifier versions npm à la mise en oeuvre)
