---
phase: 01-fondations-infrastructure
plan: 04
subsystem: ui
tags: [tailwindcss, react, typescript, design-system, clsx, tailwind-merge]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js 14 monorepo with tailwindcss ^3.4.17 devDependency and clsx/tailwind-merge in package.json
provides:
  - CI color palette (primary #1A5276 / secondary #E67E22 / accent / danger / warning) in tailwind.config.ts
  - CSS custom properties (--primary, --secondary, --accent, --danger, --warning, --surface, --text, --border) in globals.css
  - Tailwind v3 extended config: fontFamily (Playfair Display / DM Sans / JetBrains Mono), borderRadius (card/btn/pill)
  - cn() utility combining clsx + twMerge at apps/web/lib/utils.ts
  - Button component with forwardRef, 5 variants, 3 sizes, loading spinner
  - Card component with 4 padding variants and rounded-card
  - Badge component with 9 variants including photo/video/vue360/plan for media type labeling
  - Input component with forwardRef, label/error/hint props
  - Barrel export at apps/web/components/ui/index.ts
affects: [landing-page, bien-card, bien-carousel, search, dashboard, forms, auth-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "forwardRef pattern for all interactive UI components (Button, Input)"
    - "cn() for composable Tailwind class merging — import from @/lib/utils"
    - "CSS variables + Tailwind tokens co-existing: Tailwind uses token names (bg-primary), CSS vars used for arbitrary values (border-[var(--border)])"
    - "Badge variants for media types: photo (green), video (orange), vue360 (purple), plan (blue)"

key-files:
  created:
    - apps/web/tailwind.config.ts
    - apps/web/lib/utils.ts
    - apps/web/components/ui/Button.tsx
    - apps/web/components/ui/Card.tsx
    - apps/web/components/ui/Badge.tsx
    - apps/web/components/ui/Input.tsx
    - apps/web/components/ui/index.ts
  modified:
    - apps/web/app/globals.css

key-decisions:
  - "Tailwind v3 locked at ^3.4.17 — not v4 (CSS-first) which would break tailwind.config.ts syntax"
  - "next/font/google in layout.tsx is the primary font loading mechanism; Google Fonts @import in globals.css is supplementary fallback"
  - "CSS variables and Tailwind tokens co-exist: components use Tailwind tokens (bg-primary) where possible, CSS vars (border-[var(--border)]) for values not in the Tailwind palette"
  - "vue360 variant in Badge uses purple-100/purple-700 to differentiate from the green photo, orange video, and blue plan variants"

patterns-established:
  - "UI components: export named const with forwardRef for interactive elements, regular function for display-only"
  - "All components import cn() from @/lib/utils for class composition"
  - "Barrel export via apps/web/components/ui/index.ts — consumers import from @/components/ui"

requirements-completed: [FOND-05]

# Metrics
duration: 15min
completed: 2026-04-05
---

# Phase 01 Plan 04: Design System Summary

**Tailwind v3 CI design system with primary/secondary/accent palette, DM Sans + Playfair Display typography, and Button/Card/Badge/Input components ready for the full application.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-05T00:00:00Z
- **Completed:** 2026-04-05T00:15:00Z
- **Tasks:** 5
- **Files modified:** 8

## Accomplishments
- Extended Tailwind v3 config with full CI color palette (7 semantic colors with light variants), 3 font families, and 3 custom border-radius tokens
- Added Google Fonts @import to globals.css alongside CSS variables for all design tokens; @tailwind directives in place
- Built Button (forwardRef, 5 variants, 3 sizes, loading state), Card (4 padding modes), Badge (9 variants including all 4 media types), Input (forwardRef, label/error/hint)
- Barrel-exported all components from apps/web/components/ui/index.ts

## Task Commits

All tasks committed atomically in a single comprehensive commit:

1. **Tasks 1-5: Tailwind config, globals.css, utils, Button, Card, Badge, Input, barrel export** - `93df3ed` (feat)

## Files Created/Modified
- `apps/web/tailwind.config.ts` - CI palette, Playfair Display/DM Sans/JetBrains Mono, border-radius tokens
- `apps/web/app/globals.css` - Google Fonts @import + @tailwind directives + CSS variables
- `apps/web/lib/utils.ts` - cn() combining clsx + twMerge
- `apps/web/components/ui/Button.tsx` - forwardRef button with 5 variants and loading spinner
- `apps/web/components/ui/Card.tsx` - surface card with rounded-card and 4 padding sizes
- `apps/web/components/ui/Badge.tsx` - inline label with vue360/photo/video/plan media variants
- `apps/web/components/ui/Input.tsx` - forwardRef input with label, error (red ring), hint
- `apps/web/components/ui/index.ts` - barrel export for Button, Card, Badge, Input

## Decisions Made
- Kept next/font/google in layout.tsx as primary font loading (Next.js 14 recommended); Google Fonts CSS @import added to globals.css as per plan specification without removing the layout.tsx mechanism
- Used purple-100/purple-700 for vue360 badge to visually separate it from the other media type badges

## Deviations from Plan

None — plan executed exactly as written. tailwind.config.ts, globals.css, lib/utils.ts, and Button.tsx were already partially created from prior work; verified contents match spec exactly before proceeding to create the remaining files (Badge.tsx, Input.tsx, index.ts).

## Issues Encountered

None — all dependencies (tailwindcss ^3.4.17, clsx, tailwind-merge) were already present in apps/web/package.json from plan 01-01. postcss.config.js was not recreated (already existed).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- All UI primitives available via `import { Button, Card, Badge, Input } from '@/components/ui'`
- Ready for landing page construction (plan 01-05 or next landing phase)
- Design tokens accessible as Tailwind classes (bg-primary, text-secondary, rounded-card, rounded-pill) or CSS variables (var(--primary), var(--border))

---
*Phase: 01-fondations-infrastructure*
*Completed: 2026-04-05*
