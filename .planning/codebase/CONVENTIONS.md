# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

**Files:**
- React components: PascalCase, `.tsx` extension — `BienCard.tsx`, `SearchBar.tsx`, `Button.tsx`
- Server Actions files: camelCase — `actions.ts`
- Utility/lib files: camelCase — `utils.ts`, `server-auth.ts`, `auth-fetch.ts`
- Multi-step form steps: `StepNName.tsx` pattern — `Step1Infos.tsx`, `Step2Prix.tsx`
- Barrel files: `index.ts` or `index.tsx` at directory root

**Directories:**
- Component subdirectories: camelCase — `components/bien/`, `components/search/`, `components/ui/`
- Route groups: parenthesized — `(public)`, `(pro)`, `(client)`, `(auth)`
- Dynamic segments: bracket notation — `[id]`, `[id]/modifier`

**Functions & Components:**
- React components: PascalCase exported functions — `export function BienCard(...)`, `export function Button(...)`
- Helper functions: camelCase — `formatFCFA()`, `validateStep()`, `navigate()`
- Server Actions: camelCase async functions in `actions.ts` — `createBien()`, `updateBien()`
- Event handlers: `handle` prefix — `handleSubmit()`, `handleNext()`, `handleFinalSubmit()`, `handleKeyDown()`

**Types & Interfaces:**
- Interfaces: PascalCase with descriptive suffix — `BienCardProps`, `ButtonProps`, `InputProps`
- Type aliases: PascalCase — `ButtonVariant`, `ButtonSize`, `BadgeVariant`, `BienRow`
- Inferred Zod types: `export type BienFormData = z.infer<typeof BienSchema>`
- Zod schemas: PascalCase with `Schema` suffix — `BienSchema`

**Variables:**
- camelCase throughout — `coverMap`, `bienRows`, `totalPages`, `isNuitee`
- Boolean flags: `is` prefix — `isOwner`, `isNuitee`, `isSubmitting`
- Constants: SCREAMING_SNAKE_CASE for fixed data maps — `TYPE_COLORS`, `EQUIPEMENTS_ICONS`, `BIEN_FIELDS`

## Component Structure

**Standard pattern for UI primitives** (`components/ui/`):
```tsx
'use client'                        // only when needed
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type VariantName = 'primary' | 'secondary' | ...

interface ComponentProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: VariantName
  // custom props
}

const variants: Record<VariantName, string> = {
  primary: 'bg-primary text-white ...',
}

export const Component = forwardRef<HTMLButtonElement, ComponentProps>(
  ({ variant = 'primary', className, ...props }, ref) => (
    <element
      ref={ref}
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    />
  )
)
Component.displayName = 'Component'
```

**Functional component without ref** (Badge, Card pattern):
```tsx
export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return <span className={cn(baseClasses, variants[variant], className)}>{children}</span>
}
```

**Multi-step form step** (`components/bien/BienForm/StepN*.tsx`):
```tsx
'use client'
import { UseFormReturn } from 'react-hook-form'
import type { BienFormData } from './index'

export function StepNName({ form }: { form: UseFormReturn<BienFormData> }) {
  const { register, formState: { errors }, watch } = form
  return <div className="space-y-5">...</div>
}
```

**Server Component page** (Next.js App Router):
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function PageName({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  // fetch data directly, no useEffect
  return <main>...</main>
}
```

**Directive placement:**
- `'use client'` appears as first line when required (interactive state, hooks, event handlers)
- `'use server'` appears as first line in `actions.ts` files
- Most page components are Server Components (no directive)

## CSS / Tailwind Patterns

**Class merging utility** (`lib/utils.ts`):
```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
Use `cn()` for all conditional class composition. Never string-concatenate classes directly.

**Variant maps** — define outside the component, never inline ternaries for multi-variant logic:
```ts
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
  outline: 'border border-primary text-primary hover:bg-primary-light',
}
```

**Inline ternary** — acceptable for binary state (active/inactive toggle):
```tsx
className={`... ${isActive ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-muted border-[var(--border)]'}`}
```

**CSS variable usage** — use CSS vars for semantic colors, not hardcoded hex:
```tsx
// Correct
className="border border-[var(--border)] text-[var(--text)] bg-[var(--surface)]"
// Also correct (Tailwind alias)
className="bg-surface text-text border-border"
```

**Responsive layout pattern**:
```tsx
// Mobile-first, flex to grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
// Two-column layout with sticky sidebar
className="flex flex-col lg:flex-row gap-8 items-start"
// Desktop-only sidebar
className="hidden lg:block w-96 flex-shrink-0"
```

**Spacing rhythm:** `space-y-5` for form fields, `gap-2`/`gap-3`/`gap-4` for flex/grid, `p-4`/`p-5`/`p-6` for cards.

**Custom border-radius tokens** (from `tailwind.config.ts`):
- `rounded-card` (16px) — all cards, panels, content blocks
- `rounded-btn` (12px) — buttons, inputs, selects, filter chips
- `rounded-pill` (999px) — badges, tags, small status indicators

## Design Tokens

**CSS Variables** defined in `app/globals.css`, mirrored in `tailwind.config.ts`:

| Variable | Value | Usage |
|---|---|---|
| `--primary` | `#1A5276` | Main brand blue — buttons, links, focus rings |
| `--primary-light` | `#EAF4FF` | Hover backgrounds, info badges |
| `--secondary` | `#E67E22` | CTA orange — action buttons, PRO badge |
| `--secondary-light` | `#FEF5E7` | Secondary hover states |
| `--accent` | `#27AE60` | Green — success, available status |
| `--accent-light` | `#E9F7EF` | Success badge backgrounds |
| `--danger` | `#E74C3C` | Red — errors, unavailable |
| `--danger-light` | `#FDEDEC` | Error badge backgrounds |
| `--warning` | `#F39C12` | Yellow — pending, draft status |
| `--surface` | `#F4F6F8` | Page background |
| `--surface-card` | `#FFFFFF` | Card backgrounds |
| `--text` | `#1C2833` | Primary text |
| `--text-muted` | `#7F8C8D` | Secondary text (also `text-muted` Tailwind alias) |
| `--border` | `#E5E8EC` | All borders |

**Typography tokens:**
- `font-display` → Playfair Display (headings, page titles, prices in detail view)
- `font-sans` → DM Sans (body text, labels, nav, UI copy)
- `font-mono` → JetBrains Mono (numeric values — prices, stats, areas)

**Typography usage rule:**
- Headings (`h1`, `h2`): `font-display`
- Body / UI labels: `font-sans`
- Numbers (FCFA prices, m², counts): `font-mono`

## Data Fetching Conventions

**Server Component fetching** (preferred for pages):
```tsx
// In async page components — direct Supabase call, no API route needed
const supabase = await createClient()  // from '@/lib/supabase/server'
const { data: bien } = await (supabase as any).from('biens').select(...)
```

**`eslint-disable @typescript-eslint/no-explicit-any`** is widely used (78 occurrences in 36 files) to work around Supabase client type inference. This is a known pattern in the codebase — use it consistently when querying Supabase rather than fighting the types.

**Server Actions** (`'use server'` in `actions.ts` co-located with the page):
```ts
// app/(pro)/mes-biens/nouveau/actions.ts
'use server'
export async function createBien(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?...')
  const { data: result, error } = await (supabase.from('biens') as any).insert(...)
  if (error) return { error: error.message }
  return { id: result.id }
}
```
- Return `{ error: string }` on failure, `{ id: string }` (or data shape) on success
- Never throw — always return the error for the client to handle
- Always check auth inside the action, redirect if not authenticated

**Client-side navigation** — use `useRouter().push()` wrapped in `useTransition()` for non-critical navigation, or `startTransition()` for search bar navigation.

## Import Aliases

**Single alias defined in `tsconfig.json`:**
```json
{ "@/*": ["./*"] }
```

**Import order convention** (observed consistently):
1. React and Next.js — `'react'`, `'next/...'`
2. Third-party libraries — `'react-hook-form'`, `'zod'`, etc.
3. Internal shared package — `'@immo-ci/shared/...'`
4. Internal `@/` paths — `'@/lib/...'`, `'@/components/...'`, `'@/app/...'`
5. Relative imports — `'./Step1Infos'`, `'./index'`

**Shared package imports:**
```ts
import { TYPES_BIEN_LABELS, EQUIPEMENTS_LABELS } from '@immo-ci/shared/constants/biens'
import { COMMUNES_CI } from '@immo-ci/shared/constants/communes'
```

## TypeScript Usage

**Compiler settings** (`tsconfig.json`): `strict: true`, `noEmit: true`, `target: ES2017`

**Interface extension pattern:**
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}
```
Extend the native HTML element's attribute type, then spread `{...props}` to pass through all HTML attributes.

**`forwardRef` typing:**
```ts
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => <input ref={ref} {...props} />
)
Input.displayName = 'Input'  // Always set displayName on forwardRef components
```

**Explicit `any` usage** — gated behind eslint-disable comments. Do not add new `any` without the suppression comment. Prefer typed alternatives when the Supabase generated types (`lib/database.types.ts`) allow it.

**Zod + react-hook-form** — forms use manual per-step validation (`validateStep`) rather than `zodResolver`, to avoid blocking users on invisible errors from future steps. The Zod schema (`BienSchema`) is still defined for type inference via `z.infer<>`.

**`numOpt` helper** for optional number fields in forms:
```ts
const numOpt = (schema: z.ZodNumber) =>
  z.preprocess((v) => (typeof v === 'number' && isNaN(v)) ? undefined : v, schema.optional())
```
Always wrap optional numeric form fields with this when using `valueAsNumber: true`.

## Comments

**Inline explanations** — used for non-obvious decisions:
```ts
// HTML number inputs with valueAsNumber:true produce NaN when empty — Zod 4 rejects NaN
// so we preprocess NaN → undefined for all optional number fields
```

**Section dividers** — use JSX comments inside large render trees:
```tsx
{/* ── Colonne gauche : médias + détails ── */}
{/* Prix en bas de l'image */}
```

**JSDoc:** Not used. No `@param`/`@returns` annotations present in the codebase.

---

*Convention analysis: 2026-04-09*
