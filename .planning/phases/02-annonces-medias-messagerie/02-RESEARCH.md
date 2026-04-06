# Phase 2: Annonces, Médias & Messagerie — Research

**Researched:** 2026-04-06
**Domain:** Next.js 14 App Router — Cloudinary upload, Pannellum 360°, Supabase Realtime, Mapbox, full-text search PostgreSQL, multi-step forms, drag-and-drop, swipeable carousel
**Confidence:** HIGH (stack decisions from skills.md + Phase 1 summaries verified; package versions confirmed via npm registry)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BIEN-01 | Formulaire multi-étapes propriétaire, validation Zod | react-hook-form 7.72.1 + zod 4.3.6 already installed; multi-step with local state pattern |
| BIEN-02 | Propriétaire peut modifier et supprimer ses biens | Same form reused in edit mode; server action + Supabase RLS for delete |
| BIEN-03 | Propriétaire peut publier / dépublier un bien | `statut` column on `biens` table (brouillon/publie/suspendu) — toggle via PATCH |
| BIEN-04 | Visiteur peut lister les biens publiés avec pagination | Supabase `.range()` + server component; statut='publie' filter |
| BIEN-05 | Visiteur peut filtrer par commune, prix min/max, type, équipements | PostgreSQL WHERE + `@>` array operator for equipements; Supabase query builder |
| BIEN-06 | Visiteur peut faire une recherche full-text | `fts` tsvector column on `biens` already exists (French); `.textSearch('fts', query)` |
| BIEN-07 | Visiteur peut voir la fiche complète d'un bien | Dynamic route `/biens/[id]`; joins biens + biens_medias + profiles |
| BIEN-08 | Visiteur peut voir les biens sur une carte | react-map-gl 8.1.0 + mapbox-gl 3.21.0; dynamic import required (no SSR) |
| MDIA-01 | Upload photos → Cloudinary | next-cloudinary 6.17.5 CldUploadWidget; server action signs upload |
| MDIA-02 | Upload vidéos → Supabase Storage | Supabase Storage bucket `videos`; signed upload URL via Edge Function or API route |
| MDIA-03 | Upload photo 360° → Supabase Storage | Bucket `panoramas`; equirectangular JPEG; pannellum-react 1.2.4 for viewer |
| MDIA-04 | Upload plans → Supabase Storage | Bucket `plans`; PDF or image; iframe viewer or next/image |
| MDIA-05 | Composant BienCarousel (flèches + swipe + miniatures + filtres) | embla-carousel-react 8.6.0; mobile swipe native; filter by `type` column |
| MDIA-06 | Composant Bien360 (Pannellum + hotspots) | pannellum-react 1.2.4; dynamic import ssr:false; hotspots from JSONB |
| MDIA-07 | Drag & drop pour réordonner les médias | @dnd-kit/sortable 10.0.0 + @dnd-kit/core 6.3.1 |
| MDIA-08 | Médias ordonnés efficacement (index bien_id + ordre) | `biens_medias_bien_ordre_idx` already created in migration 003 |
| MSG-01 | Message depuis fiche bien → propriétaire | Create conversation (upsert unique constraint) + insert message |
| MSG-02 | Messages en temps réel (Supabase Realtime) | `supabase.channel().on('postgres_changes')` on `messages` table; enable Realtime in Dashboard |
| MSG-03 | Favoris sauvegarde / retrait | `favoris` table with unique(user_id, bien_id) — upsert / delete |
| MSG-04 | Demande de visite (date, créneau) | `visites` table already in migration 007; form → insert |
| MSG-05 | Propriétaire confirme ou refuse demande de visite | UPDATE visites SET statut='confirmee'/'annulee'; RLS allows proprietaire_id |
</phase_requirements>

---

## Summary

Phase 2 builds the core listing and communication product on top of the Phase 1 foundation. The DB schema is already fully deployed (14 tables, 43 RLS policies). No new migrations are required — all tables (`biens`, `biens_medias`, `conversations`, `messages`, `favoris`, `visites`) exist with correct indexes and RLS.

The five plans form a clear dependency chain: CRUD Biens (02-01) must come first because all other plans reference `bien_id`. Upload & Médias (02-02) must precede the Carousel/360° viewer (02-03) because the viewer consumes URLs stored during upload. Search & Map (02-04) and Messaging (02-05) can proceed in parallel after 02-01 is stable.

The principal technical risks are: (1) Pannellum's React wrapper `pannellum-react` declares `peerDependencies: react@16.x` — it works with React 18 but requires `--legacy-peer-deps` during install; (2) Mapbox GL JS requires a dynamic import with `ssr: false` in Next.js 14 App Router to avoid WebGL errors; (3) Supabase Realtime on `messages` must be enabled manually in the Supabase Dashboard (Database > Replication).

**Primary recommendation:** Install all Phase 2 packages in a single `npm install` at the start of plan 02-01 to surface peer dependency conflicts early.

---

## Project Constraints (from CLAUDE.md / skills.md / Phase 1 decisions)

| Constraint | Value | Source |
|------------|-------|--------|
| Next.js version | `14.2.35` (exact, no caret) | STATE.md key decisions |
| Tailwind CSS | v3 (`^3.4.17`), not v4 | STATE.md key decisions |
| React | `^18.3.1` | apps/web/package.json |
| Supabase JS | `2.101.1` (already installed) | apps/web/package.json |
| react-hook-form | `7.72.1` (already installed) | apps/web/package.json |
| zod | `4.3.6` (already installed) | apps/web/package.json |
| @hookform/resolvers | `^3.9.0` (already installed) | apps/web/package.json |
| date-fns | `4.1.0` (already installed) | apps/web/package.json |
| Monorepo | Turborepo npm workspaces | STATE.md |
| Currency | Always FCFA, never EUR/USD | skills.md |
| Design system | bleu `#1A5276` + orange `#E67E22`, cn() from @/lib/utils | 01-04-SUMMARY |
| Components | TypeScript strict, mobile-first, Tailwind | skills.md section 13 |
| Font | Playfair Display (titles), DM Sans (body), JetBrains Mono (prices) | 01-04-SUMMARY |
| Supabase auth | `@supabase/ssr` via `lib/supabase/client.ts` and `lib/supabase/server.ts` | 01-03 |
| Image CDN | Cloudinary for photos; Supabase Storage for video/360°/plans | skills.md section 5 |
| 360° viewer | Pannellum.js (locked decision) | skills.md section 6 |
| Map | Mapbox GL JS or Google Maps (TBD in 02-04) | ROADMAP.md |
| DB schema | 8 migrations applied, no new migration needed for Phase 2 | 01-02-SUMMARY |

---

## Standard Stack

### Core — Already Installed (apps/web/package.json)

| Library | Version | Purpose |
|---------|---------|---------|
| `next` | `14.2.35` | App Router, Server Components, API routes |
| `@supabase/supabase-js` | `2.101.1` | DB, Auth, Storage, Realtime |
| `@supabase/ssr` | `0.10.0` | SSR-safe Supabase client for Next.js |
| `react-hook-form` | `7.72.1` | Form state management |
| `zod` | `4.3.6` | Schema validation |
| `@hookform/resolvers` | `^3.9.0` | Connects zod to react-hook-form |
| `date-fns` | `4.1.0` | Date manipulation |
| `clsx` + `tailwind-merge` | `^2.1.0` + `^2.3.0` | cn() utility |

### To Install (Phase 2 additions)

| Library | Version | Purpose | Why This One |
|---------|---------|---------|--------------|
| `next-cloudinary` | `^6.17.5` | Cloudinary upload widget + CldImage | Official Next.js integration; supports Next 14; `CldUploadWidget` handles signed uploads |
| `cloudinary` | `^2.9.0` | Server-side Cloudinary SDK (signing) | Required server-side for signature generation in API route |
| `pannellum-react` | `^1.2.4` | 360° equirectangular panorama viewer | Recommended in skills.md; open source; mobile-friendly; hotspot support |
| `embla-carousel-react` | `^8.6.0` | Swipeable carousel component | Lightweight, performant, native swipe on mobile; no jQuery dep |
| `embla-carousel-autoplay` | `^8.6.0` | Autoplay plugin for Embla | Same version family as core |
| `@dnd-kit/core` | `^6.3.1` | Drag & drop primitives | Accessibility-first, works with React 18, no legacy deps |
| `@dnd-kit/sortable` | `^10.0.0` | Sortable list abstraction over @dnd-kit/core | Simplifies reorder-in-list pattern for media |
| `react-map-gl` | `^8.1.0` | React wrapper for Mapbox GL JS | Maintained by Visgl team; works with mapbox-gl 3.x |
| `mapbox-gl` | `^3.21.0` | WebGL map renderer | Industry standard; Mapbox free tier 50k loads/month |
| `react-dropzone` | `^15.0.0` | File drag-and-drop upload zone | Widely used, accessible, framework agnostic |

**Installation command:**
```bash
cd apps/web
npm install next-cloudinary cloudinary pannellum-react embla-carousel-react embla-carousel-autoplay @dnd-kit/core @dnd-kit/sortable react-map-gl mapbox-gl react-dropzone --legacy-peer-deps
```

> `--legacy-peer-deps` is required because `pannellum-react@1.2.4` declares `peerDependencies: { react: '16.x' }` but works correctly with React 18. This is a known discrepancy in the package metadata.

### Types to Install

```bash
npm install --save-dev @types/mapbox-gl --legacy-peer-deps
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pannellum-react` | `react-pannellum` (1.1.2-alpha) | react-pannellum is alpha, published by individual, no stable version; pannellum-react has 32 published versions |
| `pannellum-react` | Raw Pannellum.js via CDN | CDN breaks SSR; wrapper is cleaner |
| `embla-carousel-react` | Swiper (12.1.3) | Swiper is 3x larger bundle; Embla is ~5KB gzipped; both work on mobile |
| `react-map-gl` + `mapbox-gl` | Google Maps JS API via `@vis.gl/react-google-maps` | Google Maps requires paid API key after 28k loads/month; Mapbox free tier is 50k loads |
| `@dnd-kit` | `react-beautiful-dnd` | react-beautiful-dnd is deprecated (not maintained since 2022); @dnd-kit is the community successor |
| `next-cloudinary` | Direct Cloudinary Upload Widget via `<script>` | `next-cloudinary` provides typed React components and integrates with next/image |

---

## Architecture Patterns

### Recommended Project Structure (additions for Phase 2)

```
apps/web/
├── app/
│   ├── (public)/
│   │   ├── biens/
│   │   │   ├── page.tsx               # Liste biens — Server Component with filters
│   │   │   └── [id]/
│   │   │       └── page.tsx           # Fiche bien — Server Component
│   │   └── recherche/
│   │       └── page.tsx               # Recherche + carte — Client Component wrapper
│   ├── (pro)/
│   │   └── biens/
│   │       ├── nouveau/
│   │       │   └── page.tsx           # Formulaire multi-étapes création
│   │       ├── [id]/
│   │       │   └── modifier/
│   │       │       └── page.tsx       # Edition bien
│   │       └── page.tsx               # Liste mes biens
│   ├── (client)/
│   │   ├── messages/
│   │   │   └── page.tsx               # MessageList + MessageThread
│   │   └── favoris/
│   │       └── page.tsx               # Favoris list
│   └── api/
│       ├── upload/
│       │   └── sign/
│       │       └── route.ts           # POST — sign Cloudinary upload
│       └── biens/
│           └── [id]/
│               └── route.ts           # PATCH statut publie/brouillon
│
├── components/
│   ├── bien/
│   │   ├── BienCard.tsx               # Card de liste (photo, prix, commune, type)
│   │   ├── BienCarousel.tsx           # Carousel 4 types — Client Component
│   │   ├── Bien360.tsx                # Pannellum viewer — dynamic import ssr:false
│   │   ├── BienMap.tsx                # Mapbox map — dynamic import ssr:false
│   │   ├── BienFilters.tsx            # Filtres commune/prix/type
│   │   └── BienForm/
│   │       ├── index.tsx              # Orchestrateur multi-étapes
│   │       ├── Step1Infos.tsx         # Titre, type, commune, description
│   │       ├── Step2Prix.tsx          # Prix FCFA, charges, dépôt
│   │       ├── Step3Localisation.tsx  # Commune, quartier, coordonnées GPS
│   │       ├── Step4Equipements.tsx   # Checkboxes équipements
│   │       └── Step5Medias.tsx        # Upload photos/video/360°/plans
│   ├── media/
│   │   ├── MediaUploader.tsx          # react-dropzone + progress
│   │   ├── MediaSortable.tsx          # @dnd-kit sortable grid
│   │   └── MediaTypeIcon.tsx          # Icône par type (photo/video/360/plan)
│   ├── search/
│   │   ├── SearchBar.tsx              # Full-text input
│   │   └── SearchFilters.tsx          # Sidebar filtres
│   ├── map/
│   │   └── PropertiesMap.tsx          # react-map-gl avec markers biens
│   └── messaging/
│       ├── ConversationList.tsx        # Liste des conversations
│       ├── MessageThread.tsx           # Thread temps réel
│       └── MessageInput.tsx            # Zone de saisie + envoi
│
├── lib/
│   ├── cloudinary.ts                  # signUploadParams() helper
│   ├── supabase/                      # client.ts + server.ts (déjà en place)
│   └── mapbox.ts                      # MAPBOX_ACCESS_TOKEN helper
```

### Pattern 1: Multi-Step Form with react-hook-form + Zod

**What:** Step state managed by local `useState`, single `useForm` at the orchestrator level, sub-steps receive `register`/`control`/`watch` as props.
**When to use:** All BIEN-01 creation and BIEN-02 edit flows.

```tsx
// components/bien/BienForm/index.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const BienSchema = z.object({
  titre: z.string().min(5, 'Minimum 5 caractères'),
  type_bien: z.enum(['studio','appartement','villa','maison','bureau','commerce','terrain','residence_meublee']),
  commune: z.string().min(1, 'Commune requise'),
  description: z.string().min(20, 'Description trop courte'),
  prix_mois_fcfa: z.number().min(0).optional(),
  prix_vente_fcfa: z.number().min(0).optional(),
  // ... autres champs
})
type BienFormData = z.infer<typeof BienSchema>

export function BienForm() {
  const [step, setStep] = useState(1)
  const form = useForm<BienFormData>({ resolver: zodResolver(BienSchema), mode: 'onChange' })
  
  const onSubmit = async (data: BienFormData) => {
    // Server action ou API route POST /api/biens
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {step === 1 && <Step1Infos form={form} />}
      {step === 2 && <Step2Prix form={form} />}
      {/* ... */}
      <StepNavigation step={step} setStep={setStep} totalSteps={5} form={form} />
    </form>
  )
}
```

### Pattern 2: Cloudinary Photo Upload — Signed Upload via API Route

**What:** Client requests a signature from a Next.js API route (keeps API secret server-side). `CldUploadWidget` uses the signature to upload directly to Cloudinary CDN.
**When to use:** MDIA-01 — photo upload only. Videos, 360°, plans go to Supabase Storage.

```ts
// app/api/upload/sign/route.ts
import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  const body = await req.json()
  const { paramsToSign } = body
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!)
  return NextResponse.json({ signature })
}
```

```tsx
// components/media/PhotoUploader.tsx — uses CldUploadWidget
'use client'
import { CldUploadWidget } from 'next-cloudinary'

export function PhotoUploader({ onUpload }: { onUpload: (url: string) => void }) {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/upload/sign"
      uploadPreset="immo-ci-photos"  // Create this preset in Cloudinary Dashboard
      options={{
        maxFiles: 20,
        resourceType: 'image',
        folder: 'biens',
        transformation: [{ width: 1200, crop: 'limit', format: 'webp', quality: 'auto' }]
      }}
      onSuccess={(result) => {
        const info = result.info as { secure_url: string }
        onUpload(info.secure_url)
      }}
    >
      {({ open }) => (
        <button type="button" onClick={() => open()} className="...">
          Ajouter des photos
        </button>
      )}
    </CldUploadWidget>
  )
}
```

### Pattern 3: Supabase Storage Upload (Video / 360° / Plans)

**What:** Client uploads directly to Supabase Storage via the browser Supabase client. RLS on storage buckets controls access.
**When to use:** MDIA-02 (videos), MDIA-03 (360°), MDIA-04 (plans).

```ts
// Bucket names: 'videos', 'panoramas', 'plans'
// Bucket must be created in Supabase Dashboard > Storage

// Client-side upload
const supabase = createClient()  // browser client
const file = files[0]
const path = `${bienId}/${Date.now()}-${file.name}`

const { data, error } = await supabase.storage
  .from('videos')  // or 'panoramas' or 'plans'
  .upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

if (data) {
  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(data.path)
  // Insert into biens_medias with publicUrl
}
```

**Supabase Storage bucket configuration (do in Dashboard, not migration):**
- Bucket `videos`: public = true, max file size 500MB (video), allowed MIME: `video/*`
- Bucket `panoramas`: public = true, max file size 50MB, allowed MIME: `image/*`
- Bucket `plans`: public = true, max file size 20MB, allowed MIME: `application/pdf,image/*`

### Pattern 4: Pannellum 360° Viewer — Dynamic Import

**What:** `pannellum-react` uses browser APIs (WebGL, requestAnimationFrame). Must be dynamically imported with `ssr: false`. Hotspots come from the `hotspots jsonb` column in `biens_medias`.
**When to use:** MDIA-06 — Bien360 component.

```tsx
// components/bien/Bien360.tsx
'use client'
import dynamic from 'next/dynamic'

const Pannellum = dynamic(
  () => import('pannellum-react').then((m) => m.Pannellum),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] bg-gray-900 rounded-card flex items-center justify-center">
        <span className="text-white/50 text-sm font-sans">Chargement vue 360°...</span>
      </div>
    ),
  }
)

interface Hotspot { pitch: number; yaw: number; texte: string }

export function Bien360({ panoramaUrl, hotspots = [], hauteur = 320 }: {
  panoramaUrl: string
  hotspots?: Hotspot[]
  hauteur?: number
}) {
  return (
    <div className="w-full rounded-card overflow-hidden" style={{ height: hauteur }}>
      <Pannellum
        width="100%"
        height={`${hauteur}px`}
        image={panoramaUrl}
        pitch={10}
        yaw={180}
        hfov={110}
        autoLoad
        autoRotate={-2}
        compass
        showZoomCtrl
        showFullscreenCtrl
        hotSpots={hotspots.map((h) => ({
          pitch: h.pitch,
          yaw: h.yaw,
          type: 'info',
          text: h.texte,
          cssClass: 'custom-hotspot',
        }))}
      />
    </div>
  )
}
```

### Pattern 5: Embla Carousel with Type Filters

**What:** Embla Carousel wraps all media items. `activeFilter` state controls which `type` is shown. Thumbnails sync with the active slide.
**When to use:** MDIA-05 — BienCarousel component.

```tsx
'use client'
import useEmblaCarousel from 'embla-carousel-react'
import { useState, useCallback } from 'react'
import type { BienMedia } from '@immo-ci/shared/types/database'

type FilterType = 'all' | 'photo' | 'video' | 'vue_360' | 'plan'

export function BienCarousel({ medias }: { medias: BienMedia[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  
  const filtered = activeFilter === 'all'
    ? medias
    : medias.filter((m) => m.type === activeFilter)
  
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  
  // ... render
}
```

### Pattern 6: Supabase Realtime — Messages Channel

**What:** Subscribe to `postgres_changes` on the `messages` table, filtered to current `conversation_id`. New messages append to local state without a full page refresh.
**When to use:** MSG-02 — MessageThread component.

**Prerequisite:** Enable Realtime on `messages` table in Supabase Dashboard > Database > Replication.

```tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function MessageThread({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Load existing messages
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data) })

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  return (/* ... */)
}
```

### Pattern 7: Full-Text Search via Supabase

**What:** The `biens` table has a generated `fts tsvector` column (French dictionary) covering `titre`, `description`, `commune`, `quartier`. Use `.textSearch()` in the query builder.
**When to use:** BIEN-06 — full-text search feature.

```ts
// Server Component or API route
const supabase = await createClient()  // server client

const { data } = await supabase
  .from('biens')
  .select('id, titre, commune, type_bien, prix_mois_fcfa, statut')
  .eq('statut', 'publie')
  .textSearch('fts', query, { type: 'plain', config: 'french' })
  .range(offset, offset + limit - 1)
```

**Combined filter + FTS query:**
```ts
let query = supabase
  .from('biens')
  .select('*')
  .eq('statut', 'publie')

if (commune) query = query.eq('commune', commune)
if (prixMin) query = query.gte('prix_mois_fcfa', prixMin)
if (prixMax) query = query.lte('prix_mois_fcfa', prixMax)
if (typeBien) query = query.eq('type_bien', typeBien)
if (equipements.length) query = query.contains('equipements', equipements)
if (searchText) query = query.textSearch('fts', searchText, { type: 'plain', config: 'french' })

query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
```

### Pattern 8: Mapbox GL JS — Dynamic Import in App Router

**What:** `mapbox-gl` uses `window` and WebGL — cannot run on server. Use `dynamic()` with `ssr: false`. Wrap in a Client Component.
**When to use:** BIEN-08 — map view of properties.

```tsx
// components/map/PropertiesMap.tsx
'use client'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('react-map-gl').then((m) => m.Map), { ssr: false })
const Marker = dynamic(() => import('react-map-gl').then((m) => m.Marker), { ssr: false })

export function PropertiesMap({ biens }: { biens: Bien[] }) {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ longitude: -4.008256, latitude: 5.352781, zoom: 11 }}  // Abidjan
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {biens.map((bien) => (
        <Marker
          key={bien.id}
          longitude={bien.longitude ?? -4.008256}
          latitude={bien.latitude ?? 5.352781}
        >
          <div className="bg-secondary text-white text-xs font-mono px-2 py-1 rounded-pill shadow-md">
            {formatFCFA(bien.prix_mois_fcfa ?? 0)}
          </div>
        </Marker>
      ))}
    </Map>
  )
}
```

**Add to next.config.ts remotePatterns** (already configured for `res.cloudinary.com` and `*.supabase.co`). Add Mapbox tiles if needed (they load from mapbox CDN, not next/image, so no change required).

**Add to .env.local:**
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

### Pattern 9: @dnd-kit Sortable for Media Reorder

**What:** Wrap media grid in `DndContext` + `SortableContext`. Each item uses `useSortable`. On drag end, update `ordre` in `biens_medias` via PATCH.
**When to use:** MDIA-07 — drag & drop reorder in owner dashboard.

```tsx
'use client'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

export function MediaSortable({ medias, onReorder }: Props) {
  const [items, setItems] = useState(medias)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((m) => m.id === active.id)
      const newIndex = items.findIndex((m) => m.id === over.id)
      const reordered = arrayMove(items, oldIndex, newIndex)
      setItems(reordered)
      // Persist: batch update ordre values
      onReorder(reordered.map((m, i) => ({ id: m.id, ordre: i })))
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        {items.map((media) => <SortableMediaItem key={media.id} media={media} />)}
      </SortableContext>
    </DndContext>
  )
}
```

### Anti-Patterns to Avoid

- **Do not import `pannellum-react` at the top level** — it accesses `window` on import. Always use `dynamic(..., { ssr: false })`.
- **Do not import `mapbox-gl` at the top level** — same reason. Always dynamic import.
- **Do not use `<img>` for Cloudinary URLs** — use `<CldImage>` from `next-cloudinary` or `next/image` with `remotePatterns` (already configured for `res.cloudinary.com`).
- **Do not use Supabase `.from('messages').select()` inside a render loop** — fetch once with `useEffect`, then use Realtime subscription for updates.
- **Do not store Cloudinary API secret client-side** — sign uploads via `/api/upload/sign` route only.
- **Do not fetch medias separately from the bien** — use a single Supabase query with join or an explicit second query on `biens_medias` with `bien_id` filter; the index `biens_medias_bien_ordre_idx` makes this efficient.
- **Do not use `window.localStorage` for conversation state** — Supabase Realtime handles this; local state via `useState` is sufficient.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image CDN + resize + webp conversion | Custom image proxy | `next-cloudinary` + Cloudinary | Transformations, CDN, signed delivery already handled |
| 360° equirectangular viewer | Raw WebGL/Three.js panorama | `pannellum-react` | Handles touch, gyro, hotspots, fullscreen — 5K+ lines of WebGL code |
| Swipeable carousel with touch | Custom touch event handlers | `embla-carousel-react` | Handles velocity, momentum, loop, breakpoints |
| Drag and drop with keyboard a11y | Custom drag listeners | `@dnd-kit/sortable` | Accessibility tree, screen readers, collision detection |
| WebGL map with markers | Leaflet + custom tiles | `react-map-gl` + Mapbox | Vector tiles, clustering, custom markers, CI attribution |
| Full-text search tokenization | pg_trgm custom search | Supabase `.textSearch()` on `fts` tsvector | Already configured with French dictionary in migration 002 |
| Real-time message polling | `setInterval` + fetch | Supabase Realtime channels | WebSocket managed by Supabase, works through RLS |

**Key insight:** The DB schema is already fully instrumented for Phase 2. Every table and index needed (fts on biens, biens_medias_bien_ordre_idx, messages Realtime activation, favoris unique constraint) was created in Phase 1 migrations. Phase 2 is purely application-layer work.

---

## Common Pitfalls

### Pitfall 1: pannellum-react React 16 peer dep
**What goes wrong:** `npm install pannellum-react` fails or warns about incompatible peer deps (declares `react@16.x`, project uses `react@^18.3.1`).
**Why it happens:** Package maintainer has not updated `peerDependencies` metadata despite React 18 compatibility.
**How to avoid:** Always install with `--legacy-peer-deps`. The package works correctly at runtime with React 18.
**Warning signs:** `npm error peer dep conflict react` during install.

### Pitfall 2: Supabase Realtime not enabled on messages table
**What goes wrong:** The subscription to `postgres_changes` on `messages` silently does nothing — no messages arrive in real time.
**Why it happens:** Supabase Realtime is an opt-in per-table setting. The migration creates the table but cannot enable Replication (that requires the Supabase API or Dashboard).
**How to avoid:** As part of plan 02-05 setup, explicitly document the manual step: Dashboard > Database > Replication > Enable on `messages`.
**Warning signs:** `useEffect` subscribes without error, but new messages from a second session never appear.

### Pitfall 3: mapbox-gl / react-map-gl SSR window error
**What goes wrong:** `ReferenceError: window is not defined` at build time when mapbox-gl is statically imported in a Server Component or at module level.
**Why it happens:** mapbox-gl accesses `window` on import for WebGL context detection.
**How to avoid:** Always wrap `Map` and `Marker` in `dynamic(..., { ssr: false })`. Keep the map component in a separate file tagged `'use client'`.
**Warning signs:** Build fails with `window is not defined` or map shows blank square.

### Pitfall 4: Cloudinary upload preset not configured
**What goes wrong:** `CldUploadWidget` returns a 401 "Upload preset not found" error.
**Why it happens:** The upload preset (`immo-ci-photos`) must be created in the Cloudinary Dashboard before it can be referenced in code.
**How to avoid:** Create the signed upload preset in Cloudinary Dashboard > Settings > Upload > Upload Presets with folder=`biens`, allowed formats=`jpg,jpeg,png,webp`, max file size=10MB, transformation=`w_1200,c_limit,f_webp,q_auto`.
**Warning signs:** Console shows 401 from `api.cloudinary.com/v1_1/...`.

### Pitfall 5: Conversation uniqueness constraint violation
**What goes wrong:** Trying to create a new conversation between the same two participants for the same `bien_id` throws a unique constraint error.
**Why it happens:** `conversations` table has `unique(participant_1, participant_2, bien_id)`.
**How to avoid:** Use `upsert` (`.from('conversations').upsert({...}, { onConflict: 'participant_1,participant_2,bien_id', ignoreDuplicates: false })`) to get the existing conversation ID.
**Warning signs:** Supabase returns `23505 duplicate key value violates unique constraint`.

### Pitfall 6: biens_medias couverture unique index
**What goes wrong:** Setting a second media as `est_couverture = true` for the same bien fails silently or throws a unique constraint error.
**Why it happens:** Migration 003 creates `biens_medias_couverture_unique_idx` (partial unique index where `est_couverture = true`).
**How to avoid:** Before setting a new cover, first reset the current cover: `UPDATE biens_medias SET est_couverture = false WHERE bien_id = $1 AND est_couverture = true`, then set the new one.

### Pitfall 7: next-cloudinary beta vs stable
**What goes wrong:** Installing `next-cloudinary@^7.0.0-beta.*` gets a beta version with breaking API changes.
**Why it happens:** npm `^7.0.0-beta` resolves to beta tags when using caret on a pre-release version.
**How to avoid:** Install `next-cloudinary@^6.17.5` (latest stable). The beta 7.x is not production-ready.

### Pitfall 8: Full-text search query with special characters
**What goes wrong:** User queries containing apostrophes (common in French: "Plateau d'Abidjan") break the tsvector query.
**Why it happens:** Raw string interpolation into `textSearch()` is not sanitized.
**How to avoid:** Use `type: 'plain'` (not `websearch` or `phrase`) in `.textSearch()` options — it automatically handles special characters. Do not interpolate user input into raw SQL.

---

## DB Schema — No New Migrations Required

All tables needed for Phase 2 are already created in Phase 1 migrations:

| Table | Migration | Phase 2 Usage |
|-------|-----------|---------------|
| `biens` | 002 | CRUD, FTS via `fts` tsvector, statut toggle |
| `biens_medias` | 003 | Photo/video/360/plan URLs, `ordre`, `hotspots jsonb` |
| `conversations` | 006 | Messaging threads; unique constraint for upsert |
| `messages` | 006 | Real-time messages; activate Realtime in Dashboard |
| `favoris` | 006 | User favorites; unique(user_id, bien_id) |
| `visites` | 007 | Visit requests and confirmations |

**Key DB facts verified from migrations:**
- `biens.fts` — generated column `tsvector` using French dictionary on `titre || description || commune || quartier` (migration 002) — FTS ready, no extra migration
- `biens_medias_bien_ordre_idx` — composite index `(bien_id, ordre)` exists (migration 003) — ordering is O(log n)
- `biens_medias_couverture_unique_idx` — partial unique index where `est_couverture = true` (migration 003) — only one cover photo per bien
- `conversations` unique constraint `(participant_1, participant_2, bien_id)` (migration 006) — use upsert, not insert
- Supabase Storage buckets (`videos`, `panoramas`, `plans`) do NOT exist yet — must be created in Dashboard before plan 02-02

**One setup step required before plan 02-02:** Create 3 Storage buckets in Supabase Dashboard:
- `videos` — public, max 500MB, MIME: video/*
- `panoramas` — public, max 50MB, MIME: image/*
- `plans` — public, max 20MB, MIME: application/pdf,image/*

---

## Dependencies Between Plans (Execution Order)

```
02-01 CRUD Biens (foundation — no deps)
  └── 02-02 Upload & Médias (depends on bien_id from 02-01)
        └── 02-03 Carousel & Vue 360° (depends on media URLs from 02-02)

02-01 CRUD Biens
  ├── 02-04 Recherche & Carte (depends on biens table having data)
  └── 02-05 Messagerie & Social (depends on bien_id for conversation context)
```

**Strict ordering:** 02-01 → 02-02 → 02-03. Plans 02-04 and 02-05 can begin independently after 02-01 is complete.

**Why 02-01 must be first:**
- 02-02 needs to associate uploaded media with a `bien_id` — a bien must exist first
- 02-04 Recherche needs biens with real data (communes, prix) to test filtering and FTS
- 02-05 Messagerie needs `bien_id` to create conversations

**Why 02-02 before 02-03:**
- BienCarousel and Bien360 consume `biens_medias` rows — the upload pipeline (02-02) must insert those rows first

---

## Environment Availability Audit

| Dependency | Required By | Available | Version | Action |
|------------|------------|-----------|---------|--------|
| Node.js | All | ✓ | v24.13.0 | None |
| npm | Package install | ✓ | 11.6.2 | None |
| `next` | App Router | ✓ | 14.2.35 | None |
| `@supabase/supabase-js` | All DB/Realtime | ✓ | 2.101.1 | None |
| `react-hook-form` + `zod` | Forms | ✓ | installed | None |
| `next-cloudinary` | Photo upload | ✗ | — | Install in 02-01 |
| `cloudinary` (server SDK) | Upload signing | ✗ | — | Install in 02-01 |
| `pannellum-react` | 360° viewer | ✗ | — | Install in 02-01 |
| `embla-carousel-react` | Carousel | ✗ | — | Install in 02-01 |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag & drop | ✗ | — | Install in 02-01 |
| `react-map-gl` + `mapbox-gl` | Map view | ✗ | — | Install in 02-01 |
| `react-dropzone` | File upload UI | ✗ | — | Install in 02-01 |
| Cloudinary account | Photo CDN | Unknown | — | Requires credentials in .env.local |
| Mapbox account | Map tiles | Unknown | — | Requires NEXT_PUBLIC_MAPBOX_TOKEN |
| Supabase Storage buckets | Video/360°/Plans | ✗ | — | Create manually in Dashboard before 02-02 |
| Supabase Realtime on `messages` | MSG-02 | ✗ | — | Enable in Dashboard before 02-05 |

**Missing dependencies with no fallback:**
- Cloudinary account credentials — without these, MDIA-01 photo upload is blocked. Plan 02-02 must include a note to set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` in `.env.local`.
- Mapbox token — without this, BIEN-08 map view renders blank. Plan 02-04 must include `NEXT_PUBLIC_MAPBOX_TOKEN` setup.

**Missing dependencies with fallback:**
- Supabase Storage buckets — if not created, upload returns "Bucket not found". Fallback: document bucket creation as a prerequisite task in plan 02-02.
- Supabase Realtime — if not enabled, messaging still works as a normal CRUD app (no real-time push). Fallback: optimistic UI with polling every 5s. Enable Realtime as a prerequisite task in plan 02-05.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Cloudinary Upload Widget via `<script>` CDN tag | `next-cloudinary` CldUploadWidget React component | Type-safe, SSR-compatible, no global script injection |
| `react-beautiful-dnd` | `@dnd-kit/sortable` | react-beautiful-dnd deprecated in 2022; @dnd-kit is the standard |
| Leaflet.js for maps | `react-map-gl` + Mapbox GL JS v3 | Vector tiles, WebGL rendering, better mobile performance |
| Supabase Realtime v1 (deprecated broadcast) | Supabase `postgres_changes` on channel | Direct DB change subscription, works through RLS |
| Custom tsvector search queries | Supabase `.textSearch()` builder | Type-safe, prevents SQL injection |
| Pannellum via CDN `<script>` | `pannellum-react` + `dynamic({ ssr: false })` | Works with App Router, no global namespace pollution |

**Deprecated / outdated (do not use):**
- `react-beautiful-dnd` — deprecated, no longer maintained
- Supabase Realtime v1 "broadcast" without schema — use `postgres_changes` with explicit `schema`, `table`, `filter`
- `@cloudinary/react` v1 — replaced by `next-cloudinary` for Next.js projects
- Mapbox GL JS v1/v2 — v3 is current; `react-map-gl@8` requires mapbox-gl v3

---

## Open Questions

1. **Mapbox vs Google Maps final decision**
   - What we know: skills.md says "Mapbox ou Google Maps" (open choice)
   - What's unclear: Whether the project has a Mapbox account already configured
   - Recommendation: Use Mapbox (free 50k loads/month) unless a Google Maps API key is already in `.env.local`. Check `.env.local` at plan start. Mapbox is the research recommendation.

2. **Cloudinary upload preset — signed vs unsigned**
   - What we know: `CldUploadWidget` supports both signed (via `signatureEndpoint`) and unsigned (via `uploadPreset` only) uploads
   - What's unclear: Which mode was intended by the project setup
   - Recommendation: Use signed uploads (via `/api/upload/sign`) to prevent unauthorized use of the Cloudinary account. The API route pattern is documented above.

3. **Video size limits on Supabase Storage free tier**
   - What we know: Supabase free plan has 1GB Storage total; pro plan has 100GB
   - What's unclear: Whether the project is on free or pro tier
   - Recommendation: Set a 50MB limit per video file at the upload UI level. Document this constraint in the MediaUploader component.

4. **Mapbox token public exposure**
   - What we know: `NEXT_PUBLIC_MAPBOX_TOKEN` must be a public env var (prefixed `NEXT_PUBLIC_`) because mapbox-gl runs client-side
   - What's unclear: Security implications of exposing the token
   - Recommendation: Restrict the Mapbox token in the Mapbox Dashboard to the production domain only (URL restrictions). This prevents unauthorized usage even if the token is visible in the browser.

---

## Code Examples

### Save biens_medias after upload
```ts
// After Cloudinary upload (photo) or Supabase Storage upload (other types)
const supabase = createClient()

await supabase.from('biens_medias').insert({
  bien_id: bienId,
  type: 'photo',   // or 'video', 'vue_360', 'plan'
  url: publicUrl,  // Cloudinary URL or Supabase public URL
  ordre: currentMaxOrdre + 1,
  est_couverture: isFirst,  // first photo becomes cover
  largeur: 1200,
  hauteur: 800,
})
```

### Toggle bien statut (publish/unpublish)
```ts
// Server Action or API route — only proprietaire_id === auth.uid() passes RLS
await supabase
  .from('biens')
  .update({ statut: newStatut })
  .eq('id', bienId)
  .eq('proprietaire_id', userId)
```

### Upsert conversation + first message
```ts
// Get or create conversation
const { data: conv } = await supabase
  .from('conversations')
  .upsert({
    participant_1: senderId,
    participant_2: ownerId,
    bien_id: bienId,
  }, { onConflict: 'participant_1,participant_2,bien_id', ignoreDuplicates: false })
  .select('id')
  .single()

// Insert first message
await supabase.from('messages').insert({
  conversation_id: conv.id,
  expediteur_id: senderId,
  contenu: messageText,
})
```

### Batch update media ordre after drag reorder
```ts
async function persistReorder(items: { id: string; ordre: number }[]) {
  // Supabase doesn't support batch updates natively — use Promise.all
  await Promise.all(
    items.map(({ id, ordre }) =>
      supabase.from('biens_medias').update({ ordre }).eq('id', id)
    )
  )
}
```

### Favoris toggle
```ts
async function toggleFavori(userId: string, bienId: string, isFavorite: boolean) {
  if (isFavorite) {
    await supabase.from('favoris').delete().match({ user_id: userId, bien_id: bienId })
  } else {
    await supabase.from('favoris').insert({ user_id: userId, bien_id: bienId })
  }
}
```

---

## Sources

### Primary (HIGH confidence)
- apps/web/package.json — exact installed versions for already-present packages
- supabase/migrations/002_biens.sql — confirms fts tsvector column and index exist
- supabase/migrations/003_biens_medias.sql — confirms biens_medias_bien_ordre_idx and couverture unique index
- supabase/migrations/006_messagerie.sql — confirms conversations/messages/favoris schema and RLS
- supabase/migrations/007_visites_avis.sql — confirms visites table and RLS for MSG-04/MSG-05
- skills.md section 5 (Architecture des médias), section 6 (Pannellum), section 2 (project structure) — primary spec
- npm registry — all package versions confirmed via `npm view` on 2026-04-06

### Secondary (MEDIUM confidence)
- `pannellum-react` npm metadata — version 1.2.4, peer dep React 16.x noted (known discrepancy, React 18 works)
- `react-map-gl` npm metadata — version 8.1.0, peer dep mapbox-gl>=1.13.0 (v3.21.0 satisfies)
- `@dnd-kit/sortable` npm metadata — version 10.0.0, peer dep @dnd-kit/core ^6.3.0

### Tertiary (LOW confidence)
- Supabase Storage free tier limits (1GB total) — from general knowledge, not verified against current pricing page. Validate at plan 02-02 time.
- Mapbox free tier 50k loads/month — from general knowledge. Validate at plan 02-04 time.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed via npm registry 2026-04-06
- DB schema: HIGH — verified by reading actual migration files
- Architecture patterns: HIGH — derived directly from skills.md spec + Phase 1 summaries
- Pitfalls: MEDIUM — based on known library behaviors; pannellum React 16 peer dep confirmed via npm
- Environment availability: MEDIUM — npm packages confirmed; Cloudinary/Mapbox account status unknown

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable libraries; Supabase Realtime API stable)

---

## RESEARCH COMPLETE
