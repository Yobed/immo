# Phase 3: Paiements, Réservations, IA & Dashboard — Research

**Researched:** 2026-04-06
**Domain:** CinetPay payments, PDF contracts (OHADA), Anthropic Claude chatbot, Recharts/Tremor dashboards
**Confidence:** HIGH (core integrations), MEDIUM (CinetPay split commission mechanism)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | Utilisateur peut initier un paiement (Wave, Orange Money, MTN, Moov, CB) | CinetPay v2 checkout API — channels: "ALL" covers all operators |
| PAY-02 | Route API `/api/paiements/initier` crée la transaction CinetPay et retourne l'URL | POST https://api-checkout.cinetpay.com/v2/payment — returns payment_url |
| PAY-03 | Webhook `/api/paiements/webhook` reçoit la confirmation et met à jour BDD | CinetPay sends POST to notify_url; must call /v2/payment/check to verify status |
| PAY-04 | Paiement enregistré dans la table `paiements` avec tous les statuts | Schema in migration 008 — statuts: initie/en_cours/succes/echec/annule/rembourse |
| PAY-05 | Split commission automatique (10% plateforme, 90% propriétaire) | Computed in application layer post-webhook; CinetPay Transfer API for payout |
| PAY-06 | Page de retour paiement (succès / échec / annulation) | return_url param in CinetPay init; searchParams contain status |
| RESA-01 | Locataire peut initier une réservation (sélection dates + paiement) | reservations table exists; conflict check via date range query before insert |
| RESA-02 | Réservation créée avec statut `en_attente` puis confirmée après paiement | Webhook confirms paiement → PATCH reservation statut = 'confirmee' |
| RESA-03 | Contrat de bail PDF généré automatiquement après confirmation | @react-pdf/renderer v4.4.0 + renderToBuffer in Next.js pages/api or with serverExternalPackages |
| RESA-04 | Contrat conforme droit ivoirien OHADA (toutes clauses obligatoires) | Template clauses documented in skills.md section 9 |
| RESA-05 | Montants toujours en FCFA en lettres ET en chiffres dans le contrat | `to-words` v5.4.0 with fr locale — supports currency |
| RESA-06 | Contrat PDF stocké dans Supabase Storage, accessible aux deux parties | supabase.storage.from('contrats').upload() + contrats.pdf_url column |
| IA-01 | Chatbot immobilier CI (Claude API, system prompt géographie Abidjan + prix FCFA) | @anthropic-ai/sdk v0.82.0 — client.messages.stream() → SSE route handler |
| IA-02 | Conversation multi-turn avec historique (context window Anthropic) | messages[] array passed to each create() call; stored client-side or in DB |
| IA-03 | Scoring automatique des annonces (qualité description, cohérence prix/zone, nb photos) | Structured output via Claude — system prompt returns JSON score object |
| IA-04 | Génération de description bien à partir des caractéristiques saisies | Single-turn Claude call with bien characteristics in prompt |
| DASH-01 | 4 KPI cards : revenus du mois, taux d'occupation, réservations en attente, messages non lus | @tremor/react v3.18.7 Card components — compatible React 18 + Next.js 14 |
| DASH-02 | Bar chart revenus 12 derniers mois (Recharts) | recharts v3.8.1 BarChart + "use client" wrapper |
| DASH-03 | Gauge taux d'occupation par bien (Tremor) | Tremor ProgressBar or RadialBar as gauge proxy |
| DASH-04 | Donut répartition paiements par méthode (Wave, OM, MTN, Moov, CB) | recharts v3.8.1 PieChart with innerRadius |
| DASH-05 | Section alertes triées par priorité (rouge / orange / jaune) | Pure React + Supabase query — no additional lib needed |
| DASH-06 | Funnel de conversion : vues → contacts → visites → réservations → signatures | recharts v3.8.1 FunnelChart + Funnel components — available in v2.x+ |
</phase_requirements>

---

## Summary

Phase 3 layers four complex subsystems onto the existing Next.js 14 + Supabase foundation. The database schema is already deployed (migrations 004, 005, 008) which means plans start at integration layer, not schema layer.

**CinetPay** uses a standard redirect-and-webhook flow. The critical insight is that CinetPay deliberately omits the final status from the webhook POST body — the webhook must call `/v2/payment/check` independently to get the true ACCEPTED/REFUSED status. There is no built-in split payout; commission logic is computed in the application and disbursed separately via the Transfer API.

**@react-pdf/renderer** v4.4.0 has a known incompatibility with Next.js App Router route handlers due to React module resolution conflicts. The working pattern is to place the PDF generation route in `pages/api/` (a Pages Router API route can coexist with App Router in Next.js 14) OR add `serverExternalPackages: ['@react-pdf/renderer']` to `next.config.ts`. Both approaches are documented and tested.

**Claude API streaming** works cleanly in Next.js 14 App Router route handlers using `client.messages.stream()` plus a Web `ReadableStream` wrapper to return `text/event-stream` responses.

**Tremor v3.18.7** requires `@headlessui/react`, `@tailwindcss/forms`, and `@remixicon/react` as peer dependencies, plus the Tremor path added to `tailwind.config.ts` content array. All components are client-side and require `'use client'`. Recharts v3.8.1 includes FunnelChart natively.

**Primary recommendation:** Install all five library bundles upfront in one wave, add `serverExternalPackages` to next.config.ts for react-pdf, place PDF generation in a pages/api fallback route, and keep all chart/dashboard components in a `'use client'` boundary.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.82.0 | Claude API client (chatbot, scoring, desc generation) | Official Anthropic SDK, already in skills.md |
| @react-pdf/renderer | 4.4.0 | Generate OHADA contract PDFs server-side | Official react-pdf, supports React 18, Node renderToBuffer |
| @tremor/react | 3.18.7 | KPI cards, ProgressBar gauges for dashboard | React 18 + Next.js 14 compatible, Tailwind-based |
| recharts | 3.8.1 | Bar, Donut, Funnel charts | Most popular React chart lib; FunnelChart included v2.x+ |
| to-words | 5.4.0 | Convert FCFA integer to French words for contracts | 124 locales including fr, supports currency suffix |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @headlessui/react | ^2.2.0 | Tremor peer dependency (modals, dropdowns) | Required by @tremor/react |
| @tailwindcss/forms | ^0.5.9 | Tremor peer dependency (form styling) | Required by @tremor/react |
| @remixicon/react | ^4.5.0 | Tremor peer dependency (icons) | Required by @tremor/react |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| to-words | hand-rolled French number words | to-words has 124-locale i18n, FCFA currency label; hand-rolling misses Belgian/Swiss fr edge cases |
| @react-pdf/renderer | Puppeteer/Playwright PDF | react-pdf is pure Node (no headless browser), cheaper on Vercel serverless |
| recharts FunnelChart | Custom SVG funnel | recharts provides animation, tooltips, responsive container for free |
| @tremor/react | shadcn/ui charts | Tremor has pre-built KPI card layout matching DASH-01 exactly; shadcn requires more assembly |

**Installation:**
```bash
# From monorepo root
npm install --legacy-peer-deps @anthropic-ai/sdk @react-pdf/renderer to-words --workspace=apps/web
npm install --legacy-peer-deps @tremor/react recharts @headlessui/react @remixicon/react --workspace=apps/web
npm install --legacy-peer-deps -D @tailwindcss/forms --workspace=apps/web
```

Note: `--legacy-peer-deps` is already the project standard (set during pannellum-react install).

**Version verification (confirmed 2026-04-06 against npm registry):**
- @react-pdf/renderer: 4.4.0
- @anthropic-ai/sdk: 0.82.0
- recharts: 3.8.1
- @tremor/react: 3.18.7
- to-words: 5.4.0

---

## Architecture Patterns

### Recommended Project Structure (additions to existing)
```
apps/web/
├── app/
│   ├── api/
│   │   ├── paiements/
│   │   │   ├── initier/route.ts      # POST — CinetPay checkout init
│   │   │   └── webhook/route.ts      # POST — CinetPay notify_url
│   │   ├── reservations/
│   │   │   └── route.ts              # POST create, GET list
│   │   ├── chat/
│   │   │   └── route.ts              # POST — Claude streaming SSE
│   │   └── biens/[id]/
│   │       └── score/route.ts        # POST — Claude scoring
│   ├── (pro)/
│   │   └── dashboard/
│   │       └── page.tsx              # Server page — fetch KPIs from Supabase
│   └── (client)/
│       └── reservations/
│           ├── nouvelle/page.tsx     # Reservation flow
│           └── [id]/page.tsx         # Reservation status
├── pages/
│   └── api/
│       └── contrats/
│           └── generer.ts            # react-pdf renderToBuffer (Pages Router)
├── components/
│   ├── dashboard/
│   │   ├── KPICard.tsx              # 'use client' — Tremor Card wrapper
│   │   ├── RevenueBarChart.tsx      # 'use client' — recharts BarChart
│   │   ├── OccupancyGauge.tsx       # 'use client' — Tremor ProgressBar
│   │   ├── PaymentDonut.tsx         # 'use client' — recharts PieChart
│   │   ├── ConversionFunnel.tsx     # 'use client' — recharts FunnelChart
│   │   └── AlertesSection.tsx       # Server or client — sorted alert list
│   ├── paiements/
│   │   ├── PaiementButton.tsx       # 'use client' — triggers /api/paiements/initier
│   │   └── PaiementRetourPage.tsx   # Route page for return_url
│   ├── reservation/
│   │   ├── ReservationFlow.tsx      # Multi-step: dates → summary → paiement
│   │   └── DateConflictChecker.tsx  # Client — checks available dates
│   └── chat/
│       ├── ChatBot.tsx              # 'use client' — SSE consumer
│       └── ChatMessage.tsx          # Message bubble
└── lib/
    ├── cinetpay.ts                   # initierPaiement(), verifierPaiement()
    ├── claude.ts                     # chatImmobilier(), scorerAnnonce(), genererDesc()
    └── contrat-pdf.tsx               # ContratDocument React-PDF component
```

### Pattern 1: CinetPay Redirect Flow
**What:** Client POSTs to `/api/paiements/initier`, receives `payment_url`, redirects. CinetPay POSTs to `/api/paiements/webhook`. Webhook calls `/v2/payment/check` to verify, then updates `paiements` and `reservations` tables.

**When to use:** All payment initiations — reservation deposits and rent payments.

**Example:**
```typescript
// lib/cinetpay.ts
const CINETPAY_BASE = 'https://api-checkout.cinetpay.com/v2'

export async function initierPaiement(params: {
  transactionId: string
  montant: number       // multiple de 5
  description: string
  notifyUrl: string
  returnUrl: string
  metadata?: string
}) {
  const res = await fetch(`${CINETPAY_BASE}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey:         process.env.CINETPAY_API_KEY,
      site_id:        process.env.CINETPAY_SITE_ID,
      transaction_id: params.transactionId,
      amount:         params.montant,
      currency:       'XOF',
      description:    params.description,
      notify_url:     params.notifyUrl,
      return_url:     params.returnUrl,
      channels:       'ALL',   // Wave + OM + MTN + Moov + CB
      lang:           'fr',
      metadata:       params.metadata ?? '',
    }),
  })
  const data = await res.json()
  // data.data.payment_token + data.data.payment_url (HTTP 201)
  return data
}

export async function verifierPaiement(transactionId: string) {
  const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey:         process.env.CINETPAY_API_KEY,
      site_id:        process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
    }),
  })
  // Returns { status: 'ACCEPTED' | 'REFUSED' | 'WAITING_FOR_CUSTOMER', ... }
  return res.json()
}
```

### Pattern 2: Webhook — Verify Then Update
**What:** CinetPay webhook POST contains `cpm_trans_id` but NOT the final status. Must call `/v2/payment/check` to get the real status before updating the DB.

**Critical:** Webhook must return HTTP 200. Failure = CinetPay retries.

```typescript
// app/api/paiements/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifierPaiement } from '@/lib/cinetpay'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.formData()                 // x-www-form-urlencoded
  const transactionId = body.get('cpm_trans_id') as string

  const verification = await verifierPaiement(transactionId)
  const statut = verification.data?.status === 'ACCEPTED' ? 'succes' : 'echec'

  const supabase = createClient()
  await supabase
    .from('paiements')
    .update({ statut, metadata: verification })
    .eq('cinetpay_transaction_id', transactionId)

  if (statut === 'succes') {
    // Update linked reservation to 'confirmee'
    // Trigger contract generation
  }

  return NextResponse.json({ status: 200 })         // MUST return 200
}
```

### Pattern 3: react-pdf in Pages API Route
**What:** Due to React module resolution conflict in Next.js App Router, PDF generation uses a `pages/api/` route. App Router pages call this via fetch().

**Why:** `renderToBuffer` crashes in app/api/ route handlers with "ba.Component is not a constructor" even in Next.js 14.2.x. Pages Router route handlers avoid the conflict.

**Alternative:** Add `serverExternalPackages: ['@react-pdf/renderer']` to `next.config.ts` — this is also a documented workaround and avoids mixing routers.

```typescript
// next.config.ts — preferred approach
const nextConfig: NextConfig = {
  transpilePackages: ['@immo-ci/shared'],
  serverExternalPackages: ['@react-pdf/renderer'],  // ADD THIS
  images: { /* ... existing ... */ },
}
```

```typescript
// app/api/contrats/generer/route.ts — works WITH serverExternalPackages
import { renderToBuffer } from '@react-pdf/renderer'
import { ContratDocument } from '@/lib/contrat-pdf'

export async function POST(req: NextRequest) {
  const data = await req.json()
  const buffer = await renderToBuffer(<ContratDocument {...data} />)
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrat-${data.reservationId}.pdf"`,
    },
  })
}
```

### Pattern 4: Claude Streaming SSE in App Router
**What:** `client.messages.stream()` returns an async iterable. Convert to Web ReadableStream for Next.js Response.

```typescript
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const stream = await client.messages.stream({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system:     SYSTEM_PROMPT_IMMOBILIER_CI,
    messages,
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
  })
}
```

### Pattern 5: Tremor + Recharts Dashboard Components
**What:** All chart/KPI components must be in `'use client'` files. Dashboard page is a Server Component that fetches Supabase data, passes it as props to client chart components.

```typescript
// app/(pro)/dashboard/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server'
import { RevenueBarChart } from '@/components/dashboard/RevenueBarChart'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: paiements } = await supabase
    .from('paiements')
    .select('montant_net_fcfa, created_at, methode')
    .eq('statut', 'succes')
  // Pass data as props to client components
  return <RevenueBarChart data={paiements ?? []} />
}
```

```typescript
// components/dashboard/RevenueBarChart.tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function RevenueBarChart({ data }: { data: PaiementRow[] }) {
  const monthly = aggregateByMonth(data)
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={monthly}>
        <XAxis dataKey="mois" />
        <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`} />
        <Bar dataKey="total" fill="var(--primary)" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Pattern 6: French Number-to-Words for Contracts
**What:** Use `to-words` with French locale to convert FCFA integers to French words.

```typescript
// lib/contrat-pdf.tsx (used in react-pdf Document)
import { ToWords } from 'to-words'

const toWords = new ToWords({
  localeCode: 'fr-FR',
  converterOptions: { currency: false },  // We append "francs CFA" manually
})

export function montantEnLettres(montant: number): string {
  return `${toWords.convert(montant)} francs CFA`
  // e.g. 500000 → "cinq cent mille francs CFA"
}
```

### Anti-Patterns to Avoid
- **Trusting the webhook body for payment status:** CinetPay omits status in webhook. Always call `/v2/payment/check`. Never update reservation based on webhook body alone.
- **Rendering ContratDocument in a Server Component or App Router route without `serverExternalPackages`:** Causes "ba.Component is not a constructor" crash.
- **Importing recharts/Tremor in a Server Component:** Both require browser APIs. Must be in `'use client'` files.
- **Fetching Supabase data inside chart components:** Breaks Server Component optimization. Fetch in the server page, pass data as props.
- **Storing messages array server-side for chatbot:** Multi-turn history belongs to the client (React state) or a lightweight DB record. Do not create a new DB table for this in Phase 3.
- **Generating `transaction_id` non-uniquely:** CinetPay requires a unique transaction_id per payment attempt. Use `crypto.randomUUID()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| French number words | Custom recursive number-to-word function | `to-words` (fr-FR locale) | Handles billions, ordinals, edge cases (71=soixante-et-onze), currency suffix |
| PDF generation | HTML-to-PDF with Puppeteer or wkhtmltopdf | `@react-pdf/renderer` renderToBuffer | Serverless-compatible, no browser process, React component model |
| KPI card layout | Custom CSS grid stats cards | `@tremor/react` Card + Metric | Pre-built responsive design matching dashboard spec exactly |
| Payment status polling | Polling endpoint every N seconds | CinetPay webhook + `/v2/payment/check` | CinetPay pushes status; polling wastes bandwidth and is unreliable |
| Multi-turn conversation state | Custom DB table `chat_sessions` | React useState array of messages | Anthropic context window handles history; DB adds latency with no benefit |
| Date conflict detection | Custom calendar availability UI | SQL query `date_debut <= $end AND date_fin >= $start` | DB index on `reservations_dates_idx` already exists |

**Key insight:** The OHADA contract with French number words is where custom code fails most — "soixante-et-onze mille" edge cases and "FCFA" suffix require battle-tested i18n libraries, not hand-rolled logic.

---

## Common Pitfalls

### Pitfall 1: CinetPay Webhook — Status Never in Body
**What goes wrong:** Developer reads `cpm_error_message` or `status` from the webhook POST body and gets `WAITING_FOR_CUSTOMER` or nothing — marks payment failed prematurely.
**Why it happens:** CinetPay deliberately omits status from webhook for security against MITM.
**How to avoid:** Always call `POST /v2/payment/check` with the `cpm_trans_id` received in webhook. Only then update DB.
**Warning signs:** Reservations stuck in `en_attente` even after successful Wave payment.

### Pitfall 2: react-pdf App Router Crash
**What goes wrong:** `renderToBuffer` in `app/api/contrats/generer/route.ts` throws `TypeError: ba.Component is not a constructor` at runtime.
**Why it happens:** Next.js App Router bundles React differently, causing a duplicate React instance that breaks react-pdf's internal React.Component check.
**How to avoid:** Add `serverExternalPackages: ['@react-pdf/renderer']` to `next.config.ts`. This tells Next.js to load react-pdf from node_modules directly rather than bundling it.
**Warning signs:** Error only appears at request time, not at build time. `next build` succeeds but route crashes on first request.

### Pitfall 3: Tremor Requires Tailwind Content Path
**What goes wrong:** Tremor KPI cards render without styles — no colors, broken layout.
**Why it happens:** Tailwind purges Tremor classes because `node_modules/@tremor/**` is not in the `content` array.
**How to avoid:** Add `"./node_modules/@tremor/**/*.{js,ts,jsx,tsx}"` to `tailwind.config.ts` content array.
**Warning signs:** Tremor components look unstyled in production but may work in dev (JIT).

### Pitfall 4: CinetPay Amount Must Be Multiple of 5
**What goes wrong:** Payment initiation returns validation error for amounts like 150,001 FCFA.
**Why it happens:** XOF currency rules — CinetPay enforces the monetary unit minimum (5 FCFA).
**How to avoid:** Always round amounts to nearest 5: `Math.round(montant / 5) * 5`.
**Warning signs:** CinetPay API returns error code 703 or similar validation failure.

### Pitfall 5: Recharts SSR Hydration Mismatch
**What goes wrong:** `Warning: Expected server HTML to contain <svg>` errors in console; chart flickers on load.
**Why it happens:** Recharts computes responsive dimensions client-side; server renders different width.
**How to avoid:** Wrap chart components with `dynamic(() => import(...), { ssr: false })` OR set a fixed height on `ResponsiveContainer` and accept the flash.
**Warning signs:** Hydration warnings in browser console, janky chart load on mobile.

### Pitfall 6: to-words fr-FR Currency Mode Adds "Euro"
**What goes wrong:** `toWords.convert(500000, { currency: true })` returns "cinq cent mille euros" — wrong currency.
**Why it happens:** `to-words` fr-FR currency config defaults to Euro.
**How to avoid:** Set `currency: false` and manually append "francs CFA" string. Example: `${toWords.convert(500000)} francs CFA`.
**Warning signs:** Contracts generated with "euros" instead of "francs CFA".

### Pitfall 7: Supabase RLS Blocks System Operations
**What goes wrong:** Webhook handler tries to update `paiements` row but gets RLS error — the webhook runs as `anon` role.
**Why it happens:** Webhook is an unauthenticated endpoint. Supabase anon key has limited RLS access.
**How to avoid:** Use `SUPABASE_SERVICE_ROLE_KEY` (already in env) for server-side writes in webhook and PDF generation routes. Never use service role on the client.
**Warning signs:** Supabase returns `{code: "42501", message: "new row violates row-level security"}` in webhook logs.

---

## Code Examples

### OHADA Contract PDF Structure
```typescript
// lib/contrat-pdf.tsx
// Source: skills.md section 9 + react-pdf/renderer docs
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { montantEnLettres } from './number-to-words'

const styles = StyleSheet.create({
  page:    { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  title:   { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  section: { marginBottom: 12 },
  clause:  { marginBottom: 8, lineHeight: 1.5 },
  amount:  { fontFamily: 'Helvetica-Bold' },
})

export function ContratDocument({ contrat, locataire, proprietaire, bien }: ContratProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CONTRAT DE BAIL D'HABITATION</Text>
        <Text style={styles.clause}>
          (Régi par la loi ivoirienne et les dispositions de l'Acte Uniforme OHADA)
        </Text>

        {/* Identité des parties */}
        <View style={styles.section}>
          <Text>BAILLEUR : {proprietaire.nom_complet} — CNI n° {proprietaire.cni}</Text>
          <Text>PRENEUR : {locataire.nom_complet} — CNI n° {locataire.cni}</Text>
        </View>

        {/* Loyer en chiffres ET en lettres */}
        <View style={styles.section}>
          <Text style={styles.amount}>
            Loyer mensuel : {contrat.loyer_mois_fcfa.toLocaleString('fr-FR')} FCFA
          </Text>
          <Text>
            Soit : {montantEnLettres(contrat.loyer_mois_fcfa)}
          </Text>
        </View>

        {/* ... autres clauses OHADA ... */}
      </Page>
    </Document>
  )
}
```

### Reservation Date Conflict Check
```typescript
// app/api/reservations/route.ts
// Check overlapping reservations before insert
const { data: conflicts } = await supabase
  .from('reservations')
  .select('id')
  .eq('bien_id', bienId)
  .not('statut', 'eq', 'annulee')
  .or(`date_debut.lte.${dateFin},date_fin.gte.${dateDebut}`)

if (conflicts && conflicts.length > 0) {
  return NextResponse.json({ error: 'Dates non disponibles' }, { status: 409 })
}
```

### Claude Scoring Prompt
```typescript
// lib/claude.ts
export async function scorerAnnonce(bien: BienData): Promise<AnnoncScore> {
  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: `Tu es un expert immobilier CI. Évalue la qualité de cette annonce.
Réponds UNIQUEMENT en JSON avec ce format exact:
{"score": 0-100, "points_forts": ["..."], "points_faibles": ["..."], "suggestion": "..."}`,
    messages: [{
      role: 'user',
      content: `Annonce: ${JSON.stringify({
        titre: bien.titre,
        description: bien.description,
        prix: bien.prix_fcfa,
        commune: bien.commune,
        nb_photos: bien.nb_medias,
        equipements: bien.equipements,
      })}`,
    }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  return JSON.parse(text)
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tremor v2 (charts built-in) | Tremor v3 (layout only) + recharts separately | 2024 | Tremor 3.x dropped built-in charts; use recharts/Nivo for charts |
| @anthropic-ai/sdk v0.20 | v0.82.0 | 2025 | SDK now supports stream() as async iterable; no more custom SSE parsing |
| react-pdf v3 | v4 (React 19 compat) | 2024 | v4.1.0+ added React 19 support; App Router workaround still needed |
| CinetPay v1 | v2 checkout API | 2023 | v2 base URL: api-checkout.cinetpay.com/v2; v1 deprecated |

**Deprecated/outdated:**
- CinetPay v1 endpoint `https://api.cinetpay.com/v1/`: Use `https://api-checkout.cinetpay.com/v2/payment` instead.
- `@tremor/react` built-in `BarChart`, `DonutChart`, `AreaChart`: Removed in v3. Use recharts directly.
- `experimental.serverComponentsExternalPackages` in next.config: Now top-level `serverExternalPackages` in Next.js 14.1+. The `experimental` prefix no longer needed.

---

## Open Questions

1. **CinetPay Split Payout Timing**
   - What we know: Commission calculation is done in-app (10% plateforme). CinetPay Transfer API exists for sending money to mobile money accounts.
   - What's unclear: Does the Transfer API have a minimum amount or per-transfer fee? Is it suitable for automatic payouts per reservation?
   - Recommendation: Implement commission tracking in DB for Phase 3; defer actual payout transfer to Phase 4 manual step. Log `commission_fcfa` and `montant_net_fcfa` already in `paiements` table.

2. **CinetPay Sandbox Credentials**
   - What we know: CinetPay uses the same API key for test and production (per docs). There may be a test mode flag.
   - What's unclear: How to trigger test payments without real money in dev environment.
   - Recommendation: Contact CinetPay support for sandbox site_id, or use their JavaScript SDK's test mode. Flag this as needing human action before Plan 03-01 execution.

3. **Supabase Storage Bucket for Contracts**
   - What we know: `contrats.pdf_url` column exists in migration 005. No storage bucket named `contrats` was created in migrations 001-008.
   - What's unclear: Was a `contrats` bucket created manually or via seed?
   - Recommendation: Plan 03-03 must create the `contrats` bucket via Supabase dashboard or a new migration. Use private bucket with signed URLs (30-day expiry) for RLS compliance.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All server-side | ✓ | v24.13.0 | — |
| npm | Package install | ✓ | 11.6.2 | — |
| @anthropic-ai/sdk | IA-01 to IA-04 | ✓ (npm) | 0.82.0 | — |
| @react-pdf/renderer | RESA-03, RESA-04 | ✓ (npm) | 4.4.0 | — |
| @tremor/react | DASH-01, DASH-03 | ✓ (npm) | 3.18.7 | — |
| recharts | DASH-02, DASH-04, DASH-06 | ✓ (npm) | 3.8.1 | — |
| to-words | RESA-05 | ✓ (npm) | 5.4.0 | — |
| CinetPay sandbox credentials | PAY-01 to PAY-06 | ? | — | Use placeholder env vars; requires human action |
| ANTHROPIC_API_KEY | IA-01 to IA-04 | ? (env var) | — | Cannot substitute; requires human action |
| Supabase `contrats` storage bucket | RESA-06 | ? | — | Create in Plan 03-03 setup step |

**Missing dependencies with no fallback:**
- `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY` — must be set in `.env.local` before running Plan 03-01
- `ANTHROPIC_API_KEY` — must be set in `.env.local` before running Plan 03-04

**Missing dependencies with fallback:**
- CinetPay sandbox mode: Code can be written with mock responses for local testing; real credentials needed for end-to-end test.

---

## Validation Architecture

> Nyquist validation status: no `workflow.nyquist_validation: false` found in `.planning/config.json`, treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (no jest.config, vitest.config, or test/ dir found in apps/web) |
| Config file | Wave 0 gap — must be created |
| Quick run command | `npm run test -- --run` (after setup) |
| Full suite command | `npm run test` (after setup) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Notes |
|--------|----------|-----------|-------|
| PAY-02 | `/api/paiements/initier` returns payment_url | integration | Mock CinetPay HTTP call |
| PAY-03 | Webhook updates paiements.statut to 'succes' | integration | Mock /v2/payment/check response |
| PAY-05 | commission_fcfa = montant_total * 0.10 | unit | Pure function test |
| RESA-01 | Date conflict returns 409 | integration | Insert two overlapping reservations |
| RESA-05 | montantEnLettres(500000) = "cinq cent mille francs CFA" | unit | Pure function test |
| IA-03 | scorerAnnonce returns score 0-100 | unit | Mock Claude response |
| DASH-01 | KPICard renders with correct FCFA value | unit | React Testing Library |

### Wave 0 Gaps
- [ ] `apps/web/vitest.config.ts` — configure vitest with jsdom environment
- [ ] `apps/web/tests/lib/cinetpay.test.ts` — covers PAY-02, PAY-05
- [ ] `apps/web/tests/lib/contrat-pdf.test.ts` — covers RESA-05 (montantEnLettres)
- [ ] `apps/web/tests/api/webhook.test.ts` — covers PAY-03
- [ ] Framework install: `npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react --workspace=apps/web`

---

## Project Constraints (from CLAUDE.md)

No `./CLAUDE.md` found at project root. Constraints sourced from `STATE.md` Key Decisions and `skills.md`:

| Constraint | Source | Impact on Phase 3 |
|------------|--------|-------------------|
| `next@14.2.35` locked exactly | STATE.md | Cannot use Next.js 15+ `serverExternalPackages` syntax changes |
| Tailwind CSS v3, not v4 | STATE.md | Tremor v3 requires v3.4+ (satisfied); v4 syntax incompatible |
| `--legacy-peer-deps` at monorepo root | STATE.md | Use on all npm installs |
| `supabase.from() cast to any` in API routes | STATE.md | Use `as any` cast for paiements/reservations insert/update |
| `auth.getUser()` in Server Component, userId as prop to Client | STATE.md | Dashboard page fetches userId server-side, passes to chart components |
| `cn()` via clsx + twMerge | STATE.md | All new UI components use cn() from @/lib/utils |
| CSS vars `--primary/--secondary/--accent/--danger` | STATE.md | Chart fill colors use `var(--primary)` etc. |
| Claude model: `claude-sonnet-4-20250514` | skills.md | Use this model ID in all Anthropic calls |
| Amounts always in FCFA | skills.md | All monetary display uses `toLocaleString('fr-FR')` |
| Mobile-first | skills.md | Dashboard must be responsive; charts use ResponsiveContainer |
| TypeScript strict | STATE.md | All new files include explicit types |

---

## Sources

### Primary (HIGH confidence)
- CinetPay official docs (https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation) — payment init params
- CinetPay webhook docs (https://docs.cinetpay.com/api/1.0-fr/checkout/notification) — webhook format, verification flow
- Anthropic streaming docs (https://platform.claude.com/docs/en/api/messages-streaming) — SDK stream pattern
- npm registry verified 2026-04-06: @react-pdf/renderer 4.4.0, @anthropic-ai/sdk 0.82.0, recharts 3.8.1, @tremor/react 3.18.7, to-words 5.4.0
- Tremor installation docs (https://npm.tremor.so/docs/getting-started/installation) — Tailwind config, peer deps

### Secondary (MEDIUM confidence)
- GitHub issue diegomura/react-pdf #2460 — confirmed `serverExternalPackages` workaround for App Router
- WebSearch + multiple GitHub issues — Tremor v3 dropped built-in charts; recharts pattern
- WebSearch — Recharts FunnelChart available in v2.x+ (official API docs at recharts.github.io)

### Tertiary (LOW confidence)
- CinetPay split/Transfer API automatic payout — documentation exists but minimum amounts and fees not confirmed. Recommend manual verification before implementing automatic disbursement.

---

## Metadata

**Confidence breakdown:**
- CinetPay integration: HIGH — official docs fetched, request/response format confirmed
- @react-pdf/renderer Next.js workaround: HIGH — GitHub issues + multiple source confirmation
- Claude streaming pattern: HIGH — official Anthropic docs
- Tremor v3 architecture (no built-in charts): HIGH — official Tremor docs + npm
- Split commission payout mechanism: MEDIUM — mechanism confirmed as Transfer API; fee structure unverified
- French number-to-words: HIGH — to-words v5.4.0 fr-FR confirmed via npm, currency suffix pattern verified

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable libraries); CinetPay docs valid until API change notice
