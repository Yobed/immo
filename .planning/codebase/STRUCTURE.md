# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```
apps/web/
├── app/                        # Next.js App Router — all routes
│   ├── layout.tsx              # Root layout: fonts, global CSS, metadata
│   ├── (auth)/                 # Authentication flows (no shared layout)
│   │   ├── login/page.tsx      # Email/password + Google OAuth login (Client Component)
│   │   ├── register/page.tsx   # Registration form
│   │   ├── verify-otp/page.tsx # Phone OTP login
│   │   └── callback/route.ts   # OAuth code→session exchange handler
│   ├── (public)/               # Public browsing — unauthenticated OK
│   │   ├── layout.tsx          # Header with SearchBar, conditional auth nav, footer
│   │   ├── page.tsx            # Landing page (Hero, Features, FeaturedProperties…)
│   │   ├── biens/
│   │   │   ├── page.tsx        # Property listing grid (RSC, server-paginated)
│   │   │   └── [id]/page.tsx   # Property detail page (RSC, 2-col layout + map)
│   │   ├── recherche/page.tsx  # Filtered search: URL params, grid/map toggle (RSC)
│   │   └── chat/page.tsx       # AI chatbot page (wraps ChatBot Client Component)
│   ├── (pro)/                  # Property owner portal — auth required
│   │   ├── layout.tsx          # Header: PRO badge, owner nav, NotificationBell
│   │   ├── dashboard/page.tsx  # KPI dashboard with parallel Supabase fetches (RSC)
│   │   ├── mes-biens/
│   │   │   ├── page.tsx        # Property list with status badges (RSC)
│   │   │   ├── nouveau/
│   │   │   │   ├── page.tsx    # New property form page (wraps BienForm)
│   │   │   │   └── actions.ts  # Server Actions: createBien(), updateBien()
│   │   │   └── [id]/
│   │   │       └── modifier/page.tsx  # Edit property + Step5Medias (RSC, step param)
│   │   ├── visites/page.tsx    # Visit requests management (RSC + VisiteActions CC)
│   │   ├── quittances/page.tsx # Rent receipts list (RSC)
│   │   ├── avis-recus/page.tsx # Reviews received (RSC)
│   │   └── profil/page.tsx     # Profile + KYC status (RSC)
│   ├── (client)/               # Tenant/buyer portal — auth required
│   │   ├── layout.tsx          # Header: tenant nav, NotificationBell, UserMenu
│   │   ├── favoris/page.tsx    # Saved properties (RSC)
│   │   ├── mes-visites/page.tsx         # Tenant visit history (RSC)
│   │   ├── reservations/
│   │   │   ├── page.tsx        # Reservation list (RSC)
│   │   │   ├── nouvelle/page.tsx        # New reservation wizard (RSC + ReservationFlow CC)
│   │   │   └── [id]/page.tsx   # Reservation detail (RSC)
│   │   ├── messages/page.tsx   # Messaging (RSC + ConversationList/MessageThread CC)
│   │   ├── mes-avis/page.tsx   # Reviews submitted (RSC)
│   │   ├── notifications/page.tsx       # Notification center (RSC)
│   │   └── paiement/retour/page.tsx     # Payment return/confirmation page (RSC)
│   └── api/                    # Route Handlers — mutation and webhook endpoints
│       ├── auth/logout/route.ts
│       ├── biens/
│       │   ├── route.ts        # POST create property
│       │   └── [id]/
│       │       ├── route.ts    # PATCH update, DELETE property
│       │       ├── description/route.ts  # POST AI description via Claude
│       │       ├── medias/route.ts       # GET/POST/DELETE media management
│       │       └── score/route.ts        # GET listing completeness score
│       ├── chat/route.ts       # POST streaming chat proxy to Anthropic
│       ├── contrats/
│       │   ├── generer/route.ts          # POST generate PDF contract
│       │   └── [id]/route.ts   # GET/PATCH contract
│       ├── kyc/route.ts        # POST KYC document upload
│       ├── notifications/
│       │   ├── route.ts        # GET list notifications
│       │   └── [id]/route.ts   # PATCH mark as read
│       ├── paiements/
│       │   ├── initier/route.ts          # POST initiate CinetPay payment
│       │   └── webhook/route.ts          # POST CinetPay payment webhook
│       ├── quittances/
│       │   ├── generer/route.ts          # POST generate PDF rent receipt
│       │   └── webhook/route.ts          # POST payment webhook for quittances
│       ├── reservations/route.ts         # POST create reservation
│       ├── upload/sign/route.ts          # POST Cloudinary signed upload URL
│       ├── avis/
│       │   ├── route.ts        # POST submit review
│       │   └── [id]/reponse/route.ts     # POST owner reply to review
│       └── visites/route.ts    # POST/PATCH visit requests
│
├── components/                 # Shared React components (all co-located by domain)
│   ├── auth/
│   │   ├── LogoutButton.tsx    # CC — calls /api/auth/logout
│   │   └── UserMenu.tsx        # CC — dropdown with email, role badge, logout
│   ├── avis/
│   │   ├── AvisCard.tsx        # Review display card
│   │   ├── AvisForm.tsx        # CC — review submission form
│   │   ├── ReponseForm.tsx     # CC — owner reply form
│   │   └── StarRating.tsx      # CC — interactive star rating
│   ├── bien/
│   │   ├── BienCard.tsx        # Property grid card (used in listing + search)
│   │   ├── BienCarousel.tsx    # CC — photo/video/360 carousel
│   │   ├── BienMap.tsx         # CC — single property Mapbox map
│   │   ├── Bien360.tsx         # CC — 360° viewer
│   │   ├── ContactProprietaireButton.tsx  # CC — opens messaging to owner
│   │   ├── FavorisButton.tsx   # CC — heart toggle, direct Supabase client write
│   │   ├── ToggleStatutButton.tsx         # CC — publish/draft toggle
│   │   ├── VisiteRequestForm.tsx          # CC — visit request form
│   │   └── BienForm/           # CC — multi-step property creation/edit wizard
│   │       ├── index.tsx       # BienForm orchestrator (5 steps, react-hook-form + zod)
│   │       ├── Step1Infos.tsx  # Title, type, commune, description
│   │       ├── Step2Prix.tsx   # Pricing fields (location / nuitée / vente)
│   │       ├── Step3Localisation.tsx  # Address + Mapbox geocoding
│   │       ├── Step4Equipements.tsx  # Amenity checkboxes
│   │       └── Step5Medias.tsx # Photo/video/360 upload via Cloudinary
│   ├── chat/
│   │   ├── ChatBot.tsx         # CC — streaming AI chat interface
│   │   └── ChatMessage.tsx     # Chat message bubble
│   ├── dashboard/
│   │   ├── AlertesSection.tsx  # Alert list component
│   │   ├── KPICard.tsx         # KPI metric card
│   │   ├── OccupancyGauge.tsx  # Occupancy bar chart (Recharts, ssr:false)
│   │   ├── RevenueBarChart.tsx # Monthly revenue bar chart (Recharts, ssr:false)
│   │   ├── PaymentDonut.tsx    # Payment method donut chart (Recharts, ssr:false)
│   │   └── ConversionFunnel.tsx  # Conversion funnel chart (Recharts, ssr:false)
│   ├── kyc/
│   │   ├── KYCStatusBadge.tsx  # Badge showing KYC verification status
│   │   └── KYCUploader.tsx     # CC — document upload for identity verification
│   ├── landing/
│   │   ├── Hero.tsx            # Landing page hero section
│   │   ├── HowItWorks.tsx      # Steps explanation section
│   │   ├── FeaturedProperties.tsx  # Featured listings section
│   │   ├── Features.tsx        # Feature highlights
│   │   ├── MapZones.tsx        # Abidjan commune map section
│   │   ├── Testimonials.tsx    # User testimonials
│   │   ├── Stats.tsx           # Platform stats section
│   │   ├── Partners.tsx        # Partner logos
│   │   ├── CTAFinal.tsx        # Final call-to-action
│   │   └── Footer.tsx          # Landing-specific footer
│   ├── layout/
│   │   └── MobileMenu.tsx      # CC — mobile hamburger nav drawer
│   ├── map/
│   │   └── PropertiesMap.tsx   # CC — Mapbox map with multiple property markers
│   ├── media/
│   │   ├── MediaUploader.tsx   # CC — drag-and-drop upload, Cloudinary signed
│   │   ├── MediaSortable.tsx   # CC — drag-to-reorder media with dnd-kit
│   │   └── MediaTypeIcon.tsx   # Icon for media type (photo/video/360)
│   ├── messaging/
│   │   ├── ConversationList.tsx  # CC — list of message threads
│   │   ├── MessageThread.tsx   # CC — realtime message thread with Supabase channel
│   │   └── MessageInput.tsx    # CC — message composer
│   ├── notifications/
│   │   ├── NotificationBell.tsx   # CC — bell icon with badge, realtime subscription
│   │   ├── NotificationCenter.tsx # CC — full notification list page
│   │   └── NotificationItem.tsx   # Single notification row with mark-as-read
│   ├── paiements/
│   │   └── PaiementButton.tsx  # CC — CinetPay payment trigger button
│   ├── reservation/
│   │   ├── DatePicker.tsx      # CC — date range picker
│   │   └── ReservationFlow.tsx # CC — multi-step reservation wizard
│   ├── search/
│   │   ├── SearchBar.tsx       # CC — autocomplete search input
│   │   ├── SearchFilters.tsx   # CC — filter sidebar (commune, prix, type, équipements)
│   │   └── CommuneAutocomplete.tsx  # CC — commune name autocomplete
│   └── ui/                     # Primitive design system components
│       ├── Badge.tsx           # Pill badge with variants (success/warning/danger/info…)
│       ├── Button.tsx          # Button with variants and loading state
│       ├── Card.tsx            # Card container
│       ├── Input.tsx           # Form input with label
│       └── index.ts            # Barrel export
│
├── lib/                        # Utilities and service clients
│   ├── supabase/
│   │   ├── server.ts           # createClient() for RSC/Route Handlers (cookie-based)
│   │   └── client.ts           # createClient() for Client Components (browser)
│   ├── auth-fetch.ts           # authFetch() — fetch wrapper adding Bearer token from session
│   ├── server-auth.ts          # getServerUser() — validates auth from cookie or Bearer header
│   ├── claude.ts               # Anthropic Claude SDK client + chatImmobilierStream()
│   ├── cloudinary.ts           # Cloudinary upload URL signing helpers
│   ├── cinetpay.ts             # CinetPay payment gateway helpers
│   ├── mapbox.ts               # Mapbox geocoding helpers
│   ├── whatsapp.ts             # WhatsApp notification helpers
│   ├── contrat-pdf.tsx         # React-PDF contract document template
│   ├── quittance-pdf.tsx       # React-PDF rent receipt document template
│   ├── database.types.ts       # Local Supabase type overrides (partial)
│   ├── env.ts                  # Environment variable validation
│   └── utils.ts                # Shared utilities (cn() Tailwind merge helper)
│
├── middleware.ts               # Edge middleware: auth guard for protected routes
├── next.config.ts              # Next.js config: transpilePackages, serverExternalPackages, images
├── tsconfig.json               # TypeScript config: strict, paths alias @/* → ./*
├── tailwind.config.ts          # Tailwind CSS config with custom design tokens
├── types/                      # Global TypeScript declaration files
└── shared-pkg/                 # Local shared package mirror (not node_modules)
```

## Directory Purposes

**`app/`:**
- Purpose: All Next.js routes organized by route groups
- Contains: `layout.tsx`, `page.tsx`, `route.ts` files
- Key files: `app/layout.tsx` (root), `app/middleware.ts` is at the `apps/web/` root, not inside `app/`

**`components/`:**
- Purpose: All React components, co-located by domain
- Contains: Server Components (no directive), Client Components (`'use client'`)
- Key files: `components/ui/` for design primitives, `components/bien/BienForm/` for the main pro workflow

**`lib/`:**
- Purpose: Service clients, utilities, auth helpers
- Contains: Supabase client factories, external SDK wrappers, auth helpers
- Key files: `lib/supabase/server.ts` and `lib/supabase/client.ts` are the two Supabase entry points

## Naming Conventions

**Files:**
- Pages: `page.tsx` (App Router convention)
- Route Handlers: `route.ts`
- Layouts: `layout.tsx`
- Server Actions: `actions.ts` (co-located with page)
- Components: PascalCase `.tsx` (e.g., `BienCard.tsx`, `NotificationBell.tsx`)
- Utilities: camelCase `.ts` (e.g., `auth-fetch.ts`, `server-auth.ts`)

**Directories:**
- Route groups: `(group-name)` with parentheses (e.g., `(pro)`, `(public)`)
- Dynamic segments: `[id]` brackets
- Component categories: kebab-case domain names (e.g., `bien/`, `notifications/`, `messaging/`)

## Where to Add New Code

**New pro page:**
- Route: `app/(pro)/<feature>/page.tsx`
- Tests: `tests/<feature>.spec.ts`
- Auth: add path prefix to `protectedRoutes` array in `middleware.ts` if needed

**New client page:**
- Route: `app/(client)/<feature>/page.tsx`
- Pattern: RSC that fetches via `createClient()` then passes data to Client Component leaves

**New API mutation endpoint:**
- Handler: `app/api/<resource>/route.ts`
- Auth: call `getServerUser(request)` from `lib/server-auth.ts` at the top of each handler

**New Server Action:**
- File: co-locate as `app/(pro|client)/<feature>/actions.ts` with `'use server'` directive

**New shared component:**
- Domain component: `components/<domain>/ComponentName.tsx`
- UI primitive: `components/ui/ComponentName.tsx` + export from `components/ui/index.ts`

**New utility/service:**
- Library: `lib/<service-name>.ts`

**New domain within bien form:**
- New step: `components/bien/BienForm/Step6<Name>.tsx` following existing Step pattern

## Special Directories

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`shared-pkg/`:**
- Purpose: Local copy/mirror of the `@immo-ci/shared` package (constants, types)
- Generated: No
- Committed: Yes
- Note: also consumed as `transpilePackages: ['@immo-ci/shared']` in `next.config.ts`

**`tests/`:**
- Purpose: Playwright end-to-end tests
- Generated: No
- Committed: Yes

**`playwright-report/`:**
- Purpose: Playwright HTML test reports
- Generated: Yes
- Committed: No

**`types/`:**
- Purpose: Global TypeScript `.d.ts` declaration files
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-09*
