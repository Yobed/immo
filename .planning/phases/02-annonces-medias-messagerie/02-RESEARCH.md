# Phase 02: Annonces, Médias & Messagerie — Research

**Researched:** 2026-04-06
**Domain:** Next.js 14 App Router — CRUD, Cloudinary, Pannellum, Supabase Storage/Realtime, Mapbox, Full-text search
**Confidence:** HIGH

---

## Summary

Phase 2 builds on the completed Phase 1 foundations (monorepo, 14-table Supabase schema with RLS, auth SSR, design system). The work decomposes into five plans: CRUD biens with multi-step form, media upload pipeline (Cloudinary for photos, Supabase Storage for video/360°/plans), carousel and 360° viewer components, full-text search + map view, and real-time messaging + favoris.

Every key integration has an established, verified pattern. The full-text search column (`fts tsvector`) and `biens_medias` table are already in the database from Phase 1 migrations. Supabase Realtime requires one SQL command to enable replication on the `messages` table before subscriptions work. Pannellum must be imported with `ssr: false` due to its browser-only APIs. Mapbox / react-map-gl equally requires a client component or dynamic import. Cloudinary photo upload uses `CldUploadWidget` with a signed upload preset and a `/api/sign-cloudinary-params` API route.

**Primary recommendation:** Follow the skills.md architecture exactly — `components/bien/`, `components/search/`, `components/chat/`, `lib/cloudinary.ts`, `lib/supabase/` — no new patterns are needed; all integrations are well-documented and the DB schema is already deployed.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BIEN-01 | Propriétaire peut créer un bien (formulaire multi-étapes, validation Zod) | react-hook-form 7.72 + Zod 4.3.6 multi-step pattern; zodResolver from @hookform/resolvers |
| BIEN-02 | Propriétaire peut modifier et supprimer ses biens | Standard CRUD with Supabase client + RLS already enforces owner-only access |
| BIEN-03 | Propriétaire peut publier / dépublier un bien | UPDATE statut field ('brouillon'/'publie'/'suspendu') on biens table |
| BIEN-04 | Visiteur peut lister les biens publiés avec pagination | Supabase `.range()` pagination; statut='publie' via RLS |
| BIEN-05 | Visiteur peut filtrer par commune, prix min/max, type, équipements | Supabase `.eq()`, `.gte()`, `.lte()`, `.contains()` composable filters |
| BIEN-06 | Visiteur peut faire une recherche full-text sur titre et description | `fts` tsvector column already in migration 002; `.textSearch('fts', query, { config: 'french' })` |
| BIEN-07 | Visiteur peut voir la fiche complète d'un bien | Next.js dynamic route `[id]` in `(public)/biens/[id]`; JOIN biens_medias |
| BIEN-08 | Visiteur peut voir les biens sur une carte | react-map-gl 8.1 + mapbox-gl 3.21; 'use client' component; NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN |
| MDIA-01 | Upload photos → Cloudinary (webp, CDN, resize auto) | next-cloudinary 6.17.5; CldUploadWidget + signed preset + /api/sign-cloudinary-params |
| MDIA-02 | Upload vidéos → Supabase Storage | createSignedUploadUrl server action → client uploadToSignedUrl; bucket: 'videos' |
| MDIA-03 | Upload photo 360° équirectangulaire → Supabase Storage | Same signed URL pattern; bucket: 'panoramas' |
| MDIA-04 | Upload plans (PDF ou image) → Supabase Storage | Same signed URL pattern; bucket: 'plans' |
| MDIA-05 | Composant BienCarousel (navigation, swipe, miniatures, filtres par type) | embla-carousel-react 8.6; useEmblaCarousel hook; 4 type filters as tabs |
| MDIA-06 | Composant Bien360 (Pannellum.js + hotspots) | pannellum-react 1.2.4; next/dynamic ssr:false; hotspots from biens_medias.hotspots JSONB |
| MDIA-07 | Réordonner médias drag & drop (dashboard) | @dnd-kit/sortable 10.0; DndContext + SortableContext + arrayMove; PATCH ordre |
| MDIA-08 | Médias ordonnés récupérés efficacement | Index biens_medias_bien_ordre_idx already in migration 003; ORDER BY ordre ASC |
| MSG-01 | Utilisateur peut envoyer un message depuis une fiche bien | INSERT into conversations (upsert) then INSERT into messages; RLS already enforces participants |
| MSG-02 | Messages en temps réel (Supabase Realtime) | Enable replication: `alter publication supabase_realtime add table messages`; .channel().on('postgres_changes') |
| MSG-03 | Favoris sauvegarder / retirer | INSERT/DELETE favoris table (already in migration 006); unique(user_id, bien_id) |
| MSG-04 | Demande de visite (date, créneau) | INSERT into visites table (migration 007); statut='en_attente' |
| MSG-05 | Propriétaire confirme ou refuse une visite | UPDATE visites.statut; RLS policy "Propriétaire confirme ou refuse" already in place |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-cloudinary | 6.17.5 | Photo upload widget + CldImage | Official Cloudinary Next.js SDK; handles signing, transforms, CDN |
| @supabase/supabase-js | 2.101.1 | DB, Storage, Realtime client | Already installed; single client for all Supabase services |
| react-hook-form | 7.72.1 | Multi-step form state | Already installed; works with Zod via zodResolver |
| zod | 4.3.6 | Schema validation | Already installed; per-step validation with safeParse |
| embla-carousel-react | 8.6.0 | Swipeable carousel with mobile swipe | Dependency-free, fluid motion, SSR-compatible |
| pannellum-react | 1.2.4 | 360° panorama viewer with hotspots | Wrapper around Pannellum.js; must use dynamic import ssr:false |
| @dnd-kit/sortable | 10.0.0 | Drag & drop media reordering | Accessible, pointer+keyboard, arrayMove helper built-in |
| @dnd-kit/core | 6.3.1 | DnD context (peer of sortable) | Required by @dnd-kit/sortable |
| react-map-gl | 8.1.0 | Mapbox GL JS React wrapper | Official visgl wrapper; 'use client' component |
| mapbox-gl | 3.21.0 | Map rendering engine | Peer dep of react-map-gl; satellite/street styles |
| react-dropzone | 15.0.0 | Drag-drop file input zone | Standard pattern for multi-file upload with progress |
| @hookform/resolvers | ^3.9.0 | zodResolver bridge | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/utilities | 3.2.2 | CSS.Transform helpers for DnD | Always with @dnd-kit/sortable |
| date-fns | 4.1.0 | Date formatting for visite créneau | Already installed |
| clsx + tailwind-merge | installed | cn() utility | Already installed via lib/utils.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pannellum-react | react-pannellum-next | react-pannellum-next is newer and Next.js optimized, but pannellum-react is listed in skills.md and has more community use; skills.md is authoritative |
| embla-carousel-react | swiper | Swiper is heavier (~100KB); Embla is 3KB and matches the mobile-first requirement |
| react-map-gl + mapbox-gl | Google Maps JS API | Mapbox free tier generous; react-map-gl has better React integration; Google Maps requires billing from first request |
| @dnd-kit/sortable | react-beautiful-dnd | react-beautiful-dnd is unmaintained; dnd-kit is the standard in 2025 |

### Installation (packages not yet in package.json)
```bash
cd apps/web
npm install next-cloudinary embla-carousel-react pannellum-react \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  react-map-gl mapbox-gl react-dropzone
```

### Version verification (confirmed 2026-04-06 via npm registry)
| Package | Verified Version |
|---------|-----------------|
| next-cloudinary | 6.17.5 |
| embla-carousel-react | 8.6.0 |
| pannellum-react | 1.2.4 |
| @dnd-kit/core | 6.3.1 |
| @dnd-kit/sortable | 10.0.0 |
| @dnd-kit/utilities | 3.2.2 |
| react-map-gl | 8.1.0 |
| mapbox-gl | 3.21.0 |
| react-dropzone | 15.0.0 |
| zod (already installed) | 4.3.6 |
| react-hook-form (already installed) | 7.72.1 |

---

## Architecture Patterns

### Recommended Project Structure (additions for Phase 2)
```
apps/web/
├── app/
│   ├── (public)/
│   │   ├── biens/
│   │   │   ├── page.tsx             # Liste biens + filtres + search
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Fiche bien complète
│   │   └── carte/
│   │       └── page.tsx             # Vue carte biens
│   ├── (pro)/
│   │   ├── biens/
│   │   │   ├── nouveau/
│   │   │   │   └── page.tsx         # Formulaire multi-étapes
│   │   │   └── [id]/
│   │   │       ├── edit/page.tsx    # Edition bien
│   │   │       └── medias/page.tsx  # Gestion medias + DnD
│   │   └── messages/
│   │       └── page.tsx             # Liste conversations pro
│   ├── (client)/
│   │   └── messages/
│   │       └── page.tsx             # Messages locataire
│   └── api/
│       ├── sign-cloudinary-params/
│       │   └── route.ts             # Signed upload endpoint
│       └── biens/
│           └── [id]/
│               └── statut/
│                   └── route.ts     # Publish/unpublish
├── components/
│   ├── bien/
│   │   ├── BienCard.tsx             # Card pour liste
│   │   ├── BienCarousel.tsx         # 4 types + swipe + miniatures
│   │   ├── Bien360.tsx              # Pannellum dynamic import
│   │   ├── BienMap.tsx              # react-map-gl 'use client'
│   │   ├── BienFilters.tsx          # Filtres commune/prix/type
│   │   └── MediaUploadZone.tsx      # react-dropzone + progress
│   ├── search/
│   │   ├── SearchBar.tsx            # Full-text input
│   │   └── ResultGrid.tsx           # Grid/list toggle
│   └── chat/
│       ├── ConversationList.tsx     # Liste conversations
│       ├── MessageThread.tsx        # Thread temps reel
│       └── MessageInput.tsx         # Envoi message
└── lib/
    ├── cloudinary.ts                # signCloudinaryParams helper
    └── mapbox.ts                    # Token + default center CI
```

### Pattern 1: Multi-Step Form with Zod per-step validation
**What:** Each step has its own Zod schema; validation only on current step fields; final submission combines all.
**When to use:** BIEN-01 — formulaire multi-etapes proprietaire.
```typescript
// Source: react-hook-form + zod pattern (verified community 2025)
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// One useForm at parent level with all fields to prevent state loss between steps
const fullSchema = z.object({
  titre: z.string().min(5).max(100),
  type_bien: z.enum(['studio','appartement','villa','maison','bureau','commerce','terrain','residence_meublee']),
  commune: z.string().min(2),
  prix_mois_fcfa: z.number().int().positive().optional(),
  // ... all fields
})

// Per-step validation without submitting
const step1Fields = ['titre', 'type_bien', 'commune'] as const
const isStep1Valid = z.object({
  titre: fullSchema.shape.titre,
  type_bien: fullSchema.shape.type_bien,
  commune: fullSchema.shape.commune,
}).safeParse(watchedValues).success
```

### Pattern 2: Cloudinary Signed Upload
**What:** Server-side signing keeps API secret off client; CldUploadWidget triggers Cloudinary upload widget.
**When to use:** MDIA-01 — upload photos.
```typescript
// Source: next.cloudinary.dev/clduploadwidget/basic-usage (fetched 2026-04-06)
// apps/web/app/api/sign-cloudinary-params/route.ts
import { v2 as cloudinary } from 'cloudinary'

export async function POST(request: Request) {
  const { paramsToSign } = await request.json()
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )
  return Response.json({ signature })
}

// Component (must be 'use client')
import { CldUploadWidget } from 'next-cloudinary'

<CldUploadWidget
  signatureEndpoint="/api/sign-cloudinary-params"
  onSuccess={(result) => {
    const info = result.info as { secure_url: string; width: number; height: number }
    // Save to biens_medias: type='photo', url=info.secure_url
  }}>
  {({ open }) => (
    <button onClick={() => open()} className="btn-secondary">
      Ajouter photos
    </button>
  )}
</CldUploadWidget>
```

### Pattern 3: Supabase Storage — Signed Upload for Video/360°/Plans
**What:** Server Action generates signed upload URL; client uploads directly to Supabase Storage (avoids 1MB Next.js body limit).
**When to use:** MDIA-02, MDIA-03, MDIA-04.
```typescript
// Source: supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl (fetched 2026-04-06)
// Server Action
'use server'
export async function getSignedUploadUrl(bucket: string, path: string) {
  const supabase = createServerClient(...)
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path)
  if (error) throw error
  return data  // { signedUrl, token, path }
}

// Client: upload to signed URL
const { signedUrl, token, path } = await getSignedUploadUrl('videos', `${bienId}/${filename}`)
const { error } = await supabase.storage
  .from('videos')
  .uploadToSignedUrl(path, token, file)
```

### Pattern 4: Supabase Realtime — Messages
**What:** Subscribe to INSERT events on messages table filtered by conversation_id; useEffect cleanup removes channel.
**When to use:** MSG-02.
```typescript
// Source: supabase.com/docs/guides/realtime/postgres-changes (fetched 2026-04-06)

// PREREQUISITE SQL (run once — add to a new migration or Supabase Dashboard):
// alter publication supabase_realtime add table messages;
// alter publication supabase_realtime add table conversations;

// Client component
useEffect(() => {
  const channel = supabase
    .channel(`conv-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [conversationId])
```

### Pattern 5: Full-Text Search on existing tsvector column
**What:** Migration 002 already has `fts tsvector` generated column + GIN index; use Supabase `.textSearch()`.
**When to use:** BIEN-06, combined with BIEN-05 filters.
```typescript
// Source: supabase.com/docs/reference/javascript/textsearch (fetched 2026-04-06)
async function searchBiens(query: string, filters: BienFilters) {
  let q = supabase
    .from('biens')
    .select('*, biens_medias(url, type, est_couverture, ordre)')
    .eq('statut', 'publie')

  if (query) {
    q = q.textSearch('fts', query, { config: 'french' })
  }
  if (filters.commune) q = q.eq('commune', filters.commune)
  if (filters.prixMin)  q = q.gte('prix_mois_fcfa', filters.prixMin)
  if (filters.prixMax)  q = q.lte('prix_mois_fcfa', filters.prixMax)
  if (filters.type)     q = q.eq('type_bien', filters.type)
  if (filters.equipements?.length) {
    q = q.contains('equipements', filters.equipements)
  }

  return q
    .order('biens_medias(ordre)', { ascending: true })
    .order('created_at', { ascending: false })
    .range(0, 19)
}
```

### Pattern 6: Pannellum dynamic import (ssr: false)
**What:** pannellum-react uses window/document — must be client-only; next/dynamic with ssr:false.
**When to use:** MDIA-06.
```typescript
// Source: skills.md section 6 (authoritative) + pannellum-react npm docs
'use client'
import dynamic from 'next/dynamic'

const Pannellum = dynamic(
  () => import('pannellum-react').then(m => m.Pannellum),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] bg-gray-900 flex items-center justify-center rounded-card">
        <span className="text-white/50 text-sm font-sans">Chargement vue 360°...</span>
      </div>
    ),
  }
)

// next.config.js — also add to prevent CSS import error:
// transpilePackages: ['pannellum-react']
```

### Pattern 7: react-map-gl as 'use client' component
**What:** Mapbox GL JS requires window — mark map wrapper as client component.
**When to use:** BIEN-08.
```typescript
// Source: visgl.github.io/react-map-gl + community verified 2025
'use client'
import Map, { Marker, Popup } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Default center: Abidjan Plateau
const ABIDJAN_CENTER = { longitude: -4.0167, latitude: 5.3600 }

export function BienMap({ biens }: { biens: BienWithCoords[] }) {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{ ...ABIDJAN_CENTER, zoom: 12 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      style={{ width: '100%', height: 400 }}
    >
      {biens.map(bien => bien.latitude && bien.longitude ? (
        <Marker key={bien.id} longitude={bien.longitude} latitude={bien.latitude} />
      ) : null)}
    </Map>
  )
}
```

### Pattern 8: @dnd-kit/sortable for media reordering
**What:** SortableContext wraps media thumbnails; on DragEnd, call arrayMove then batch PATCH ordre to Supabase.
**When to use:** MDIA-07.
```typescript
// Source: docs.dndkit.com/presets/sortable (search-verified 2026-04-06)
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  if (!over || active.id === over.id) return
  const oldIndex = items.findIndex(i => i.id === active.id)
  const newIndex = items.findIndex(i => i.id === over.id)
  const reordered = arrayMove(items, oldIndex, newIndex)
  setItems(reordered)
  // Batch update ordre in Supabase
  await Promise.all(
    reordered.map((item, i) =>
      supabase.from('biens_medias').update({ ordre: i }).eq('id', item.id)
    )
  )
}

<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
    {items.map(item => <SortableMediaThumb key={item.id} media={item} />)}
  </SortableContext>
</DndContext>
```

### Anti-Patterns to Avoid
- **Importing pannellum-react without dynamic import:** Causes `window is undefined` build error on server.
- **Importing mapbox-gl/dist/mapbox-gl.css in a Server Component:** Must be in a 'use client' component.
- **Using Next.js Server Actions to stream video file bodies:** Default 1MB body limit will reject files. Use signed URLs instead.
- **Skipping `alter publication supabase_realtime add table messages`:** Subscriptions will silently receive no events.
- **Storing CLOUDINARY_API_SECRET in client-side code or NEXT_PUBLIC_:** Always sign server-side via route handler.
- **Using Zod `.nonempty()` or `.strip()`:** Removed in Zod 4. Use `.min(1)` for required strings.
- **Calling `useForm` inside each step component:** Creates separate form state per step; values are lost on step change. Use single `useForm` at parent level.
- **Setting two `est_couverture = true` medias for same bien_id:** Violates the partial unique index in migration 003; UPDATE old cover to false before inserting new cover.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo upload + CDN transforms | Custom upload API + resize code | next-cloudinary CldUploadWidget | Cloudinary handles webp conversion, resize, CDN, format negotiation, signed upload automatically |
| Swipe carousel | Custom touch event handlers | embla-carousel-react | Fluid motion, touch velocity, pointer precision, snap points — extremely hard to replicate correctly on mobile |
| 360° panorama viewer | Custom WebGL sphere renderer | pannellum-react | Handles equirectangular projection, inertia, mobile gyroscope, keyboard navigation, hotspots |
| Drag & drop with accessibility | Mouse event listeners on DOM | @dnd-kit/sortable | Keyboard navigation, screen reader announcements, touch support, portal rendering for overlays |
| Full-text search French | Custom LIKE/ILIKE queries | PostgreSQL tsvector (already in migration) | Stemming, stop-words, accent normalization — LIKE cannot match "locaux" from query "local" |
| WebSocket real-time messages | Custom WebSocket server | Supabase Realtime postgres_changes | Zero infrastructure; Supabase manages connections, reconnection, backoff |
| Interactive map of CI | Custom SVG map | react-map-gl + Mapbox | Tile rendering, zoom, satellite/street layers, geocoding — not feasible to hand-roll |
| Multi-file upload with progress | XMLHttpRequest + custom UI | react-dropzone | Handles drag target, file validation, preview URLs, multiple files, progress via onUploadProgress |

**Key insight:** Every media and interactive UI problem in this phase has a battle-tested open source solution. The value is in connecting these solutions to the Supabase data model, not reimplementing them.

---

## Common Pitfalls

### Pitfall 1: pannellum-react CSS import from node_modules
**What goes wrong:** Next.js 14 throws "Global CSS cannot be imported from within node_modules" build error.
**Why it happens:** pannellum-react imports its own CSS file internally; Next.js restricts global CSS imports from node_modules.
**How to avoid:** Add `transpilePackages: ['pannellum-react']` in `next.config.js`.
**Warning signs:** Build fails with CSS-related error mentioning a node_modules path.

### Pitfall 2: Supabase Realtime silently not working
**What goes wrong:** Subscription code runs without error but no events arrive; messages appear stale.
**Why it happens:** The `messages` (and `conversations`) tables are not added to `supabase_realtime` publication. Migration 006 has a comment noting this must be done via Dashboard — it was not automated.
**How to avoid:** Add a new migration (or run in Supabase Dashboard) before Plan 02-05:
```sql
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;
```
**Warning signs:** `.subscribe()` returns status 'SUBSCRIBED' but payload callback never fires.

### Pitfall 3: Mapbox GL Worker in Next.js 14
**What goes wrong:** Bundler warnings about mapbox-gl workers; map tiles fail to load or map is blank.
**Why it happens:** mapbox-gl uses a Web Worker internally that can conflict with Next.js webpack config.
**How to avoid:** In `next.config.js`:
```js
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    'mapbox-gl': 'mapbox-gl',
  }
  return config
}
```
**Warning signs:** Console warnings about worker chunk; map renders blank tiles.

### Pitfall 4: Zod 4 API changes (project uses 4.3.6)
**What goes wrong:** Code from Zod 3 tutorials fails with TypeScript errors.
**Why it happens:** Zod 4 removed `nonempty()`, changed `strip()` to default behavior, changed some coercion APIs.
**How to avoid:** Use `z.string().min(1)` for required strings. Verify against Zod 4 changelog before copying older examples.
**Warning signs:** TypeScript errors on `.nonempty()`, `.strip()`, `.passthrough()` calls.

### Pitfall 5: biens_medias couverture unique constraint violation
**What goes wrong:** Inserting a second `est_couverture = true` media for the same `bien_id` throws `23505 unique violation`.
**Why it happens:** Migration 003 has a partial unique index `WHERE est_couverture = true`.
**How to avoid:** In the upload flow, always UPDATE previous cover to `est_couverture = false` before inserting the new cover. Handle as a transaction or sequential operations.
**Warning signs:** Supabase returns `23505 unique_violation` on `biens_medias` insert.

### Pitfall 6: react-hook-form state loss in multi-step form
**What goes wrong:** Values entered in step 1 are missing when step 3 is rendered.
**Why it happens:** If each step is a separate component with its own `useForm()`, React unmounts it between steps and form state is lost.
**How to avoid:** Use a single `useForm` at the parent level covering all step fields. Control step visibility via state, not component mounting.
**Warning signs:** `getValues()` returns empty/undefined for previously entered fields.

### Pitfall 7: Supabase Storage buckets not created
**What goes wrong:** Upload to 'videos', 'panoramas', or 'plans' bucket fails with "Bucket not found".
**Why it happens:** Phase 1 migrations created DB tables but not Storage buckets — these are separate Supabase resources.
**How to avoid:** Plan 02-02 must create the three buckets (via Supabase Dashboard or `storage.createBucket` API) and set appropriate RLS policies.
**Warning signs:** Supabase Storage API returns `BucketNotFound` error on first upload attempt.

---

## Code Examples

### Full-text search + filters combined
```typescript
// Source: supabase.com/docs/reference/javascript/textsearch + migration 002 fts column
async function searchBiens(query: string, filters: BienFilters, page = 0) {
  let q = supabase
    .from('biens')
    .select('id, titre, commune, quartier, prix_mois_fcfa, type_bien, biens_medias(url, type, est_couverture)')
    .eq('statut', 'publie')

  if (query) q = q.textSearch('fts', query, { config: 'french' })
  if (filters.commune) q = q.eq('commune', filters.commune)
  if (filters.prixMin)  q = q.gte('prix_mois_fcfa', filters.prixMin)
  if (filters.prixMax)  q = q.lte('prix_mois_fcfa', filters.prixMax)
  if (filters.type)     q = q.eq('type_bien', filters.type)
  if (filters.equipements?.length) q = q.contains('equipements', filters.equipements)

  return q
    .order('created_at', { ascending: false })
    .range(page * 20, page * 20 + 19)
}
```

### BienCarousel — type filter tabs + Embla
```typescript
// Source: embla-carousel.com useEmblaCarousel hook
'use client'
import useEmblaCarousel from 'embla-carousel-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'

type MediaType = 'tout' | 'photo' | 'video' | 'vue_360' | 'plan'
const TYPE_LABELS: Record<MediaType, string> = {
  tout: 'Tout', photo: 'Photos', video: 'Videos', vue_360: '360°', plan: 'Plans'
}
// Badge colors per type (from STATE.md: vue360=purple, photo=green, video=orange, plan=blue)
const BADGE_CLASSES: Record<string, string> = {
  photo: 'bg-accent-light text-accent',
  video: 'bg-secondary-light text-secondary',
  vue_360: 'bg-purple-100 text-purple-700',
  plan: 'bg-primary-light text-primary',
}

export function BienCarousel({ medias }: { medias: BienMedia[] }) {
  const [activeType, setActiveType] = useState<MediaType>('tout')
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' })

  const filtered = useMemo(
    () => activeType === 'tout' ? medias : medias.filter(m => m.type === activeType),
    [medias, activeType]
  )

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(TYPE_LABELS) as MediaType[]).map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={cn(
              'flex-none px-3 py-1 rounded-pill text-sm font-sans transition-colors',
              activeType === type
                ? 'bg-primary text-white'
                : 'bg-surface text-muted hover:bg-primary-light'
            )}>
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-card" ref={emblaRef}>
        <div className="flex">
          {filtered.map(media => (
            <div key={media.id} className="relative flex-none w-full">
              {/* Render based on media.type */}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Favoris toggle (MSG-03)
```typescript
// Source: Supabase JS + migration 006 favoris table (unique constraint handles duplicate prevention)
async function toggleFavori(userId: string, bienId: string, isFavori: boolean) {
  if (isFavori) {
    return supabase.from('favoris')
      .delete()
      .eq('user_id', userId)
      .eq('bien_id', bienId)
  }
  return supabase.from('favoris')
    .insert({ user_id: userId, bien_id: bienId })
  // unique(user_id, bien_id) handles duplicate prevention at DB level
}
```

### Conversation upsert then message insert (MSG-01)
```typescript
// Canonical participant ordering ensures the unique(p1, p2, bien_id) constraint works
// regardless of who initiates the conversation
async function sendMessage(senderId: string, receiverId: string, bienId: string, contenu: string) {
  const [p1, p2] = [senderId, receiverId].sort()  // deterministic ordering

  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .upsert(
      { participant_1: p1, participant_2: p2, bien_id: bienId },
      { onConflict: 'participant_1,participant_2,bien_id' }
    )
    .select('id')
    .single()

  if (convErr) throw convErr

  return supabase.from('messages').insert({
    conversation_id: conv.id,
    expediteur_id: senderId,
    contenu,
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/sortable | 2022 | react-beautiful-dnd is unmaintained (last release 2020); dnd-kit is accessible + maintained |
| Cloudinary unsigned presets only | Signed uploads with server API route | 2023 | Security: API secret never exposed to client-side bundle |
| Global Supabase WebSocket listener | .channel() per conversation | 2022 | Channel scoping avoids receiving events intended for other conversations |
| Supabase JS v1 `.on('INSERT')` | Supabase JS v2 `.channel().on('postgres_changes')` | 2022 | Breaking change: v1 API does not work with @supabase/supabase-js 2.x |
| Pannellum vanilla JS in useEffect | pannellum-react + next/dynamic ssr:false | 2022 | Next.js App Router requires either dynamic import or 'use client' |
| Zod 3 `.string().nonempty()` | Zod 4 `.string().min(1)` | 2024 | Zod 4 removed nonempty(); project uses 4.3.6 |

**Deprecated/outdated:**
- `supabase.from('messages').on('INSERT', handler).subscribe()`: Supabase JS v1 syntax. Project uses v2.101.1.
- `z.string().nonempty()`: Removed in Zod 4. Use `z.string().min(1)`.
- `react-pannellum` (by farminf/pannellum-react): CSS import known issue with Next.js 14; requires `transpilePackages` workaround.

---

## Open Questions

1. **Mapbox access token availability**
   - What we know: react-map-gl requires NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN; Mapbox free tier = 50,000 map loads/month.
   - What's unclear: Token not yet in .env.local; client has not confirmed which map provider.
   - Recommendation: Use Mapbox (skills.md names Mapbox first, free tier adequate for MVP). Plan 02-04 must include env var setup step and a fallback static placeholder when token is absent.

2. **Supabase Storage buckets (videos, panoramas, plans) not yet created**
   - What we know: Phase 1 migrations created DB tables but not Storage buckets — separate resource.
   - What's unclear: Whether buckets were created manually in Supabase dashboard.
   - Recommendation: Plan 02-02 must create all three buckets programmatically (via Supabase Dashboard SQL or storage admin API) and configure RLS policies allowing authenticated owners to upload.

3. **Supabase Realtime replication not yet enabled for messages**
   - What we know: Migration 006 has a comment "Note: activer Supabase Realtime via Dashboard" — it was NOT in the migration SQL.
   - What's unclear: Whether this was manually done post-Phase 1.
   - Recommendation: Plan 02-05 must include an idempotent SQL statement or dashboard step to add messages and conversations to supabase_realtime publication.

4. **next.config.js current state**
   - What we know: Mapbox requires a webpack alias and pannellum-react requires transpilePackages.
   - What's unclear: Current content of next.config.js after Phase 1.
   - Recommendation: Plan 02-03 (Pannellum) and 02-04 (Mapbox) must both read and update next.config.js accordingly.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All npm installs | Yes | v24.13.0 | — |
| @supabase/supabase-js | All plans | Yes (installed) | 2.101.1 | — |
| @supabase/ssr | Auth/server | Yes (installed) | 0.10.0 | — |
| next | App Router | Yes (installed) | 14.2.35 | — |
| react-hook-form + zod | BIEN-01 | Yes (installed) | 7.72 + 4.3.6 | — |
| @hookform/resolvers | BIEN-01 | Yes (installed) | ^3.9.0 | — |
| next-cloudinary | MDIA-01 | Not installed | 6.17.5 on npm | — |
| embla-carousel-react | MDIA-05 | Not installed | 8.6.0 on npm | — |
| pannellum-react | MDIA-06 | Not installed | 1.2.4 on npm | — |
| @dnd-kit/core | MDIA-07 | Not installed | 6.3.1 on npm | — |
| @dnd-kit/sortable | MDIA-07 | Not installed | 10.0.0 on npm | — |
| @dnd-kit/utilities | MDIA-07 | Not installed | 3.2.2 on npm | — |
| react-map-gl + mapbox-gl | BIEN-08 | Not installed | 8.1.0 + 3.21.0 on npm | — |
| react-dropzone | MDIA-01-04 | Not installed | 15.0.0 on npm | — |
| NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN | BIEN-08 | Unknown (not in env) | — | Static CI commune image placeholder |
| CLOUDINARY_API_SECRET | MDIA-01 | Unknown (not in env) | — | Cannot upload without it — blocking |
| Supabase Storage buckets (videos/panoramas/plans) | MDIA-02-04 | Unknown | — | Must create in Plan 02-02 — blocking |
| supabase_realtime publication for messages | MSG-02 | Unknown | — | Must enable in Plan 02-05 — blocking |

**Missing dependencies with no fallback (blocking):**
- CLOUDINARY_API_SECRET must be present in .env.local before Plan 02-02 executes
- Supabase Storage buckets 'videos', 'panoramas', 'plans' must be created (Plan 02-02 task)
- supabase_realtime publication must include `messages` table (Plan 02-05 task)

**Missing dependencies with fallback:**
- NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: BienMap can render a static placeholder until token is obtained

---

## Project Constraints (from skills.md / STATE.md)

These directives govern all Phase 2 implementation decisions:

| Directive | Source | Impact on Phase 2 |
|-----------|--------|-------------------|
| `next@14.2.35 locked exactly` | STATE.md | Do not upgrade; use Next.js 14 dynamic import API |
| `Tailwind CSS v3 not v4` | STATE.md | Use tailwind.config.ts with theme.extend; no CSS layer syntax |
| `cn() via clsx + twMerge` | STATE.md | All new components use `cn()` from `@/lib/utils` |
| `CSS vars + Tailwind tokens co-exist` | STATE.md | Use `bg-primary` for palette colors; `border-[var(--border)]` for custom values |
| `vue360 badge uses purple-100/purple-700` | STATE.md | BienCarousel: photo=green, video=orange, vue_360=purple, plan=blue |
| Mobile-first design | skills.md | All components: mobile breakpoints first, then `md:` and `lg:` |
| Playfair Display for titles, DM Sans body | skills.md | `font-display` class for bien titles; `font-sans` for labels/prices |
| JetBrains Mono for prices | skills.md | `font-mono` for prix FCFA display |
| All amounts in FCFA | skills.md + REQUIREMENTS | No EUR/USD; `formatFCFA()` from packages/shared |
| Components must have loading/error/empty states | skills.md | Every new component needs all 3 states |
| TypeScript strict | skills.md | No `any` types; export component AND its prop types |
| pannellum import must be dynamic ssr:false | skills.md section 6 | Required — window dependency |
| Hotspots stored as JSONB in biens_medias | skills.md section 6 | Format: `[{"pitch": -5, "yaw": 120, "texte": "..."}]` |
| Architecture: components/bien/, components/search/, components/chat/ | skills.md section 2 | All new components go in these directories |
| lib/cloudinary.ts, lib/supabase/ | skills.md section 2 | Utility code in these existing lib paths |

---

## Sources

### Primary (HIGH confidence)
- `supabase.com/docs/guides/realtime/postgres-changes` — Realtime subscription pattern, publication setup (fetched 2026-04-06)
- `supabase.com/docs/reference/javascript/textsearch` — textSearch API with tsvector columns (fetched 2026-04-06)
- `supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl` — Signed URL upload pattern (fetched 2026-04-06)
- `next.cloudinary.dev/clduploadwidget/basic-usage` — CldUploadWidget props and signing endpoint (fetched 2026-04-06)
- npm registry — Package versions verified 2026-04-06: next-cloudinary@6.17.5, embla-carousel-react@8.6.0, pannellum-react@1.2.4, @dnd-kit/core@6.3.1, @dnd-kit/sortable@10.0.0, @dnd-kit/utilities@3.2.2, react-map-gl@8.1.0, mapbox-gl@3.21.0, react-dropzone@15.0.0
- `apps/web/package.json` — Confirmed installed packages (read 2026-04-06)
- `supabase/migrations/002_biens.sql` — Confirmed fts tsvector column + GIN index (read 2026-04-06)
- `supabase/migrations/003_biens_medias.sql` — Confirmed schema + RLS + couverture constraint (read 2026-04-06)
- `supabase/migrations/006_messagerie.sql` — Confirmed conversations, messages, favoris schema (read 2026-04-06)
- `supabase/migrations/007_visites_avis.sql` — Confirmed visites schema + RLS (read 2026-04-06)
- `skills.md` — Project canonical architecture, component patterns, env vars (read 2026-04-06)
- `docs.dndkit.com/presets/sortable` — arrayMove, SortableContext pattern (search-verified 2026-04-06)

### Secondary (MEDIUM confidence)
- `embla-carousel.com` — useEmblaCarousel hook API; confirmed by npm description and multiple tutorials
- `visgl.github.io/react-map-gl` — react-map-gl 8.x 'use client' requirement; confirmed by multiple 2025 tutorials
- `pannellum-react` GitHub issue #86 — CSS import issue confirmed; transpilePackages workaround confirmed by community

### Tertiary (LOW confidence)
- None — all key claims backed by official docs or verified package registries

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry on 2026-04-06
- Architecture: HIGH — skills.md is the canonical reference; all patterns verified against official docs
- Pitfalls: HIGH — Zod 4 breaking changes documented, Supabase Realtime publication requirement in official docs, Pannellum CSS issue confirmed on GitHub
- DB schema: HIGH — migrations 002, 003, 006, 007 read directly from source files

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (30-day estimate; Supabase, Cloudinary, and Mapbox APIs are stable)
