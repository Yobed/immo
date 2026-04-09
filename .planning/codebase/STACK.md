# Technology Stack

**Analysis Date:** 2026-04-09

## Languages

**Primary:**
- TypeScript 6.0.2 — all application code (frontend, API routes, shared types)

**Secondary:**
- CSS — via Tailwind utility classes; no standalone `.css` files except `globals.css`

## Runtime

**Environment:**
- Node.js (version not pinned; no `.nvmrc` detected)

**Package Manager:**
- npm (inferred from `package.json`; no lockfile type specified)
- Lockfile: `package-lock.json` (standard npm)

## Frameworks

**Core:**
- Next.js 14.2.35 — App Router, React Server Components, API Route Handlers
- React 18.3.1 — UI rendering
- React DOM 18.3.1 — DOM bindings

**Testing:**
- Playwright 1.59.1 — end-to-end tests (`apps/web/playwright.config.ts`)
  - Commands: `npm run e2e`, `npm run e2e:ui`, `npm run e2e:report`

**Build/Dev:**
- TypeScript compiler (`tsc`) — type checking via `npm run type-check`
- Next.js built-in bundler — no Webpack or Turbopack config detected
- PostCSS 8.4.x + Autoprefixer 10.4.x — CSS processing (`apps/web/postcss.config.js`)
- `@tailwindcss/forms` 0.5.11 — form element base styles (declared in devDeps, plugin usage unconfirmed in config)

## Styling System

**Framework:** Tailwind CSS 3.4.17

**Configuration:** `apps/web/tailwind.config.ts`

**Content paths scanned:**
- `./app/**/*.{ts,tsx}`
- `./components/**/*.{ts,tsx}`
- `./node_modules/@tremor/**/*.{js,ts,jsx,tsx}` (Tremor component library)

**Custom design tokens:**
```
colors:
  primary:   #1A5276 (dark blue) / primary-light: #EAF4FF
  secondary: #E67E22 (orange)   / secondary-light: #FEF5E7
  accent:    #27AE60 (green)    / accent-light: #E9F7EF
  danger:    #E74C3C            / danger-light: #FDEDEC
  warning:   #F39C12
  surface:   #F4F6F8
  muted:     #7F8C8D

borderRadius:
  card: 16px
  btn:  12px
  pill: 999px

fontFamily:
  display: Playfair Display (serif)
  sans:    DM Sans
  mono:    JetBrains Mono
```

**Utility helpers:**
- `cn()` in `apps/web/lib/utils.ts` — merges Tailwind classes via `clsx` + `tailwind-merge`

**Fonts:** Loaded via `next/font/google` in `apps/web/app/layout.tsx`:
- Playfair Display (400, 600, 700) → `--font-display`
- DM Sans (300, 400, 500) → `--font-sans`
- JetBrains Mono (400, 500) → `--font-mono`

## Component Library

**Internal UI primitives** (`apps/web/components/ui/`):
- `Button.tsx` — variants: `primary | secondary | outline | ghost | danger`; sizes: `sm | md | lg`; `loading` prop with spinner
- `Card.tsx` — padding variants: `none | sm | md | lg`; uses `rounded-card`
- `Badge.tsx`, `Input.tsx` — present
- Barrel export: `apps/web/components/ui/index.ts`

**Third-party component library:**
- Tremor 3.18.7 (`@tremor/react`) — charts and dashboard primitives (included in Tailwind content scan)
- Recharts 3.8.1 — charting library (likely paired with Tremor)

**Pattern:** Custom primitives built with `forwardRef` + `cn()` + Tailwind variant maps. No CVA (class-variance-authority) detected.

**Feature component directories** (`apps/web/components/`):
- `auth/`, `avis/`, `bien/`, `bien/BienForm/`, `chat/`, `dashboard/`
- `kyc/`, `landing/`, `layout/`, `map/`, `media/`, `messaging/`
- `notifications/`, `paiements/`, `reservation/`, `search/`

## State Management

- No global state library (no Redux, Zustand, Jotai, or Context providers detected at root layout)
- Forms managed by **React Hook Form 7.72.1** + **Zod 4.3.6** (via `@hookform/resolvers`)
- Server state fetched directly in Server Components or via `fetch` in client components
- Auth state provided by Supabase SSR session via cookies

## Data & Validation

- **Zod 4.3.6** — schema validation for forms and env vars
- **`apps/web/lib/env.ts`** — validates required env vars at startup using Zod
- **`apps/web/lib/database.types.ts`** — re-exports Supabase-generated DB types; canonical types live in `apps/web/shared-pkg/types/database.ts`

## App Router Structure

**Route groups** (`apps/web/app/`):
- `(auth)/` — login, register, verify-otp, callback
- `(client)/` — favoris, mes-avis, mes-visites, messages, notifications, paiement, reservations
- `(pro)/` — dashboard, mes-biens, profil, quittances, visites, avis-recus
- `(public)/` — biens, chat, recherche
- `api/` — REST + streaming route handlers (auth, avis, biens, chat, contrats, kyc, notifications, paiements, quittances, reservations, upload, visites)

**Middleware:** `apps/web/middleware.ts` — protects routes via Supabase session check, redirects unauthenticated users to `/login`

## Key Dependencies

**Critical:**
- `@supabase/ssr` 0.10.0 — Supabase SSR client for App Router
- `@supabase/supabase-js` 2.101.1 — Supabase JS SDK
- `react-hook-form` 7.72.1 — form state management
- `zod` 4.3.6 — schema validation
- `next-cloudinary` 6.17.5 — Cloudinary image components for Next.js
- `cloudinary` 2.9.0 — server-side Cloudinary SDK (upload signing)
- `@anthropic-ai/sdk` 0.82.0 — Claude AI for chatbot, scoring, description generation
- `mapbox-gl` 3.21.0 + `react-map-gl` 8.1.0 — interactive property maps
- `@react-pdf/renderer` 4.4.0 — server-side PDF generation (contracts, quittances); configured as `serverExternalPackages`

**UI/UX:**
- `@dnd-kit/core` 6.3.1 + `@dnd-kit/sortable` 10.0.0 — drag-and-drop (likely media reordering)
- `embla-carousel-react` 8.6.0 + `embla-carousel-autoplay` 8.6.0 — image carousels
- `pannellum-react` 1.2.4 — 360° panoramic viewer for property photos
- `react-dropzone` 15.0.0 — file upload UI
- `date-fns` 4.1.0 — date formatting/manipulation
- `to-words` 5.4.0 — number-to-words (likely for legal document amounts)

## Shared Package

**Location:** `apps/web/shared-pkg/` (aliased as `@immo-ci/shared`)

**Contents:**
- `types/database.ts` — Supabase-generated database types
- `types/index.ts` — domain types
- `constants/biens.ts`, `constants/communes.ts`, `constants/index.ts` — Côte d'Ivoire domain constants
- `utils/formatDate.ts`, `utils/formatFCFA.ts` — formatting utilities
- `index.ts` — barrel export

**Transpilation:** Declared in `next.config.ts` as `transpilePackages: ['@immo-ci/shared']` (TypeScript source, not pre-compiled)

## Configuration

**Environment validation:** `apps/web/lib/env.ts` — Zod schema validates at import time:
- `NEXT_PUBLIC_SUPABASE_URL` (required, URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required)
- `NEXT_PUBLIC_URL` (required, URL)
- `NODE_ENV`

**Build config:** `apps/web/next.config.ts`
- `transpilePackages: ['@immo-ci/shared']`
- `serverExternalPackages: ['@react-pdf/renderer']`
- `images.remotePatterns`: `res.cloudinary.com`, `*.supabase.co`

## Platform Requirements

**Development:**
- Node.js with npm
- `.env.local` with Supabase, Cloudinary, CinetPay, Mapbox, Anthropic, WhatsApp credentials

**Production:**
- Vercel (inferred from `metadataBase: 'https://immo-ci.vercel.app'` in root layout)
- Supabase project (hosted)

---

*Stack analysis: 2026-04-09*
