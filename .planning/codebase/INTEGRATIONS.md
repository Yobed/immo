# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

### Supabase (Primary Backend)
- **Purpose:** Database (PostgreSQL), Auth, Storage, Realtime
- **SDK:** `@supabase/supabase-js` 2.101.1 + `@supabase/ssr` 0.10.0
- **Browser client:** `apps/web/lib/supabase/client.ts` — `createBrowserClient` from `@supabase/ssr`
- **Server client:** `apps/web/lib/supabase/server.ts` — `createServerClient` with Next.js `cookies()` store
- **Webhook/service client:** Created inline in API route handlers using `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS for unauthenticated contexts such as payment webhooks)
- **Middleware:** `apps/web/middleware.ts` — refreshes session and validates JWT via `supabase.auth.getUser()` on every request

### Anthropic Claude AI
- **Purpose:** Immobilier chatbot (streaming SSE), listing quality scoring, listing description generation
- **SDK:** `@anthropic-ai/sdk` 0.82.0
- **Client:** `apps/web/lib/claude.ts`
- **Model used:** `claude-sonnet-4-20250514`
- **Functions:**
  - `chatImmobilierStream()` — streaming chat for `/api/chat` (IA-01/IA-02)
  - `scorerAnnonce()` — JSON scoring 0–100 for listing quality (IA-03), called from `apps/web/app/api/biens/[id]/score/route.ts`
  - `genererDescription()` — marketing description generation (IA-04), called from `apps/web/app/api/biens/[id]/description/route.ts`
- **Auth env var:** `ANTHROPIC_API_KEY`

### Cloudinary (Media Storage & CDN)
- **Purpose:** Property photo and media storage, image optimization, CDN delivery
- **Server SDK:** `cloudinary` 2.9.0 — upload signature generation
- **Next.js SDK:** `next-cloudinary` 6.17.5 — optimized `<CldImage>` and related components
- **Client:** `apps/web/lib/cloudinary.ts` — configures `cloudinary.v2`, exports `signUploadParams()`
- **Upload flow:** Client requests signature from `apps/web/app/api/upload/sign/route.ts`, then uploads directly to Cloudinary (signed upload pattern)
- **Image delivery:** `next.config.ts` whitelists `res.cloudinary.com` for `next/image`
- **Auth env vars:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Mapbox (Geolocation & Maps)
- **Purpose:** Interactive property location maps, geocoding
- **SDKs:** `mapbox-gl` 3.21.0 + `react-map-gl` 8.1.0
- **Types:** `@types/mapbox-gl` 3.4.1
- **Client:** `apps/web/lib/mapbox.ts` — exports `MAPBOX_TOKEN` and `ABIDJAN_CENTER` (lat/lng/zoom for Abidjan default view)
- **Component:** `apps/web/components/map/` — `PropertiesMap` (inferred)
- **Auth env var:** `NEXT_PUBLIC_MAPBOX_TOKEN` (public, embedded in browser bundle)
- **Default center:** Abidjan (-4.008256, 5.352781, zoom 11)

### CinetPay (Payment Gateway)
- **Purpose:** Mobile money and card payments in XOF (West Africa)
- **Integration type:** Direct REST API (no official SDK — custom client)
- **Client:** `apps/web/lib/cinetpay.ts`
- **API base:** `https://api-checkout.cinetpay.com/v2` (via `CINETPAY_BASE_URL`)
- **Supported channels:** Wave, Orange Money, MTN, Moov, Carte Bancaire (channels: `'ALL'`)
- **Currency:** XOF (amounts must be multiples of 5)
- **Commission:** 10% platform fee calculated server-side via `calculerSplit()`
- **Payment flow:**
  1. `POST /api/paiements/initier` → calls `initierPaiement()` → returns `payment_url` for redirect
  2. CinetPay POSTs webhook to `POST /api/paiements/webhook` (x-www-form-urlencoded)
  3. Webhook calls `verifierPaiement()` against CinetPay `/v2/payment/check` (NEVER trusts webhook body status)
  4. On `ACCEPTED`: updates `paiements` table, confirms linked `reservations` record
- **Auth env vars:** `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`
- **Webhook endpoint:** `NEXT_PUBLIC_URL + /api/paiements/webhook`
- **Return URL:** `NEXT_PUBLIC_URL + /paiement/retour`

### WhatsApp Business API (Notifications)
- **Purpose:** Automated rent reminder messages to tenants (J-3, J-1, J+1, J+7 milestones)
- **Integration type:** Direct Meta Graph API v19.0 (no SDK)
- **Client:** `apps/web/lib/whatsapp.ts`
- **API endpoint:** `https://graph.facebook.com/v19.0/{phoneNumberId}/messages`
- **Message format:** Plain text, E.164 phone numbers, max 4096 chars
- **Templates:** `RELANCE_MESSAGES` — four milestone templates (`J-3`, `J-1`, `J+1`, `J+7`) in French
- **Auth env vars:** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`

## Data Storage

### Database
- **Provider:** Supabase (PostgreSQL)
- **Connection env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service role:** `SUPABASE_SERVICE_ROLE_KEY` — used in webhook handlers that run outside user auth context
- **ORM/Client:** Supabase JS client (typed via `@immo-ci/shared` generated types in `apps/web/shared-pkg/types/database.ts`)
- **Key tables (observed from query patterns):** `paiements`, `reservations`, `biens`, `notifications`, `avis`, `visites`, `quittances`, `contrats`, `kyc`
- **RLS:** Enabled (service role key explicitly used in webhooks to bypass RLS)

### File Storage
- **Provider:** Cloudinary (primary media store for property photos, videos)
- **Supabase Storage:** Whitelisted in `next.config.ts` (`*.supabase.co`) — may be used for documents (KYC, contracts)
- **Local filesystem:** Not used for persistent storage

### Caching
- None detected — no Redis, Vercel KV, or in-memory cache layer

## Authentication & Identity

- **Provider:** Supabase Auth
- **Session strategy:** Cookie-based (SSR-compatible via `@supabase/ssr`)
- **Session refresh:** Middleware (`apps/web/middleware.ts`) refreshes on every request
- **JWT validation:** Always via `supabase.auth.getUser()` server-side — never decoded from cookie directly
- **Protected routes:** `/pro`, `/client`, `/dashboard`, `/mes-biens`, `/mes-avis`, `/mes-visites`, `/visites`, `/quittances`, `/profil`, `/avis-recus`
- **Auth routes:** `apps/web/app/(auth)/` — login, register, verify-otp, callback
- **Server auth helper:** `apps/web/lib/server-auth.ts` — `getServerUser()` used in API route handlers
- **Logout:** `apps/web/app/api/auth/logout/route.ts`

## Monitoring & Observability

- **Error tracking:** Not detected (no Sentry, Datadog, etc.)
- **Logs:** `console.*` only — no structured logging library
- **Analytics:** Not detected

## PDF Generation

- **Library:** `@react-pdf/renderer` 4.4.0
- **Purpose:** Legal document generation (rental contracts, quittances de loyer)
- **Files:** `apps/web/lib/contrat-pdf.tsx`, `apps/web/lib/quittance-pdf.tsx`
- **API routes:** `apps/web/app/api/contrats/generer/route.ts`, `apps/web/app/api/quittances/generer/route.ts`
- **Config:** Declared as `serverExternalPackages` in `next.config.ts` to prevent App Router bundling crash

## CI/CD & Deployment

- **Hosting:** Vercel (inferred from `metadataBase: 'https://immo-ci.vercel.app'`)
- **CI Pipeline:** Not detected in repository

## Webhooks & Callbacks

**Incoming:**
- `POST /api/paiements/webhook` — CinetPay payment status notifications (x-www-form-urlencoded)
- `POST /api/quittances/webhook` — quittance-related webhook (likely rent payment confirmations)
- `GET /app/(auth)/callback` — Supabase Auth OAuth callback

**Outgoing:**
- WhatsApp Business API — rent reminder messages sent from server
- CinetPay API — payment initiation and verification calls
- Anthropic API — chat completions and scoring

## Environment Configuration

**Required environment variables:**

| Variable | Scope | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Webhook handlers (RLS bypass) |
| `NEXT_PUBLIC_URL` | Public | Webhook + return URLs for CinetPay |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Public | Mapbox map rendering |
| `CLOUDINARY_CLOUD_NAME` | Server only | Cloudinary config |
| `CLOUDINARY_API_KEY` | Server only | Cloudinary config |
| `CLOUDINARY_API_SECRET` | Server only | Upload signature generation |
| `ANTHROPIC_API_KEY` | Server only | Claude AI chat/scoring/generation |
| `CINETPAY_API_KEY` | Server only | Payment initiation + verification |
| `CINETPAY_SITE_ID` | Server only | CinetPay site identification |
| `CINETPAY_BASE_URL` | Server only | CinetPay API base (optional, defaults to prod) |
| `WHATSAPP_PHONE_NUMBER_ID` | Server only | WhatsApp message sending |
| `WHATSAPP_ACCESS_TOKEN` | Server only | WhatsApp API authentication |
| `NODE_ENV` | Build | Environment detection |

**Env validation:** Subset validated at startup via Zod in `apps/web/lib/env.ts` (covers Supabase keys, `NEXT_PUBLIC_URL`, `NODE_ENV` only — other vars validated at usage point)

---

*Integration audit: 2026-04-09*
