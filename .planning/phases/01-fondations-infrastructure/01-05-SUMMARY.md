---
phase: 01-fondations-infrastructure
plan: 05
subsystem: web/landing
tags: [landing-page, seo, nextjs, components, mobile-first]
dependency_graph:
  requires: [01-04]
  provides: [landing-page, seo-sitemap, seo-robots, public-route-group]
  affects: [apps/web/app/(public), apps/web/components/landing, apps/web/app/layout.tsx]
tech_stack:
  added: []
  patterns: [next-app-router, route-groups, metadata-api, mobile-first-tailwind, server-components]
key_files:
  created:
    - apps/web/app/(public)/page.tsx
    - apps/web/app/(public)/layout.tsx
    - apps/web/components/landing/Hero.tsx
    - apps/web/components/landing/HowItWorks.tsx
    - apps/web/components/landing/FeaturedProperties.tsx
    - apps/web/components/landing/Features.tsx
    - apps/web/components/landing/MapZones.tsx
    - apps/web/components/landing/Testimonials.tsx
    - apps/web/components/landing/Stats.tsx
    - apps/web/components/landing/Partners.tsx
    - apps/web/components/landing/CTAFinal.tsx
    - apps/web/components/landing/Footer.tsx
    - apps/web/app/sitemap.ts
    - apps/web/app/robots.ts
  modified:
    - apps/web/app/layout.tsx
decisions:
  - "Used HTML entity escapes (&#x..;) for emoji in JSX to avoid linting issues with emoji literals in TSX"
  - "Button component does not support asChild prop, used Link with manual Tailwind classes for CTA buttons"
  - "Badge variants limited to design system values — used 'success'/'video' for property type badges instead of 'accent'/'secondary'"
  - "Patched layout.tsx openGraph/twitter only — preserved all next/font/google imports and JSX"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-05"
  tasks: 4
  files: 15
---

# Phase 01 Plan 05: Landing Page Summary

## One-liner

10-section French landing page for Immo CI with Hero searchbar + App Store/Google Play CTAs, Playfair Display headings, JetBrains Mono stats, and full Next.js SEO (openGraph, sitemap.ts, robots.ts).

## What Was Built

### Task 1 — SEO Metadata, sitemap, robots (commit: 312cde2)

- Patched `apps/web/app/layout.tsx` to add `openGraph` and `twitter` fields to the existing metadata object
- Did NOT rewrite the file — preserved `next/font/google` imports, CSS variables, and all JSX
- Created `apps/web/app/sitemap.ts` using `MetadataRoute.Sitemap` (3 routes: /, /biens, /login)
- Created `apps/web/app/robots.ts` using `MetadataRoute.Robots` (disallow /pro/, /client/, /api/)

### Task 2 — Hero section (commit: 13aee6d)

- `apps/web/components/landing/Hero.tsx` — `'use client'` with useState for search
- H1 uses `font-display` (Playfair Display)
- Search input + secondary-variant Button
- App Store and Google Play CTA links with rounded-btn styling
- `text-secondary` (orange) highlight on title

### Task 3 — 8 remaining sections (commit: a112ab9)

All sections in `apps/web/components/landing/`:

| Component | Key Content |
|---|---|
| HowItWorks | "Comment ça marche" — Publiez/Réservez/Payez steps |
| FeaturedProperties | 3 fictitious properties with FCFA prices, Card + Badge components |
| Features | 6 differentiators including 360°, OHADA, IA, WhatsApp |
| MapZones | 12 communes d'Abidjan as pill badges on primary background |
| Testimonials | 3 testimonials (propriétaire, locataire, agence) with star rating |
| Stats | 4 metrics with `font-mono` (JetBrains Mono) large numbers |
| Partners | Wave, Orange Money, MTN, Moov Money, CinetPay, Cloudinary text logos |
| CTAFinal | "Prêt à trouver votre bien?" + /biens + /register CTAs |
| Footer | 4 columns (À propos, Biens, Compte, Contact) + "© 2026 Immo CI" |

### Task 4 — Page assembly + public layout (commit: 7a46cea)

- `apps/web/app/(public)/page.tsx` — imports and renders all 10 sections in order
- `apps/web/app/(public)/layout.tsx` — minimal passthrough layout (no auth middleware)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Button component does not support asChild prop**
- **Found during:** Task 3 (FeaturedProperties initial draft)
- **Issue:** Button.tsx is a native `<button>` wrapped in forwardRef, has no `asChild`/Slot support. Using `asChild` would silently fail.
- **Fix:** Replaced `<Button asChild>` with `<Link>` elements styled with manual Tailwind classes matching the button variants
- **Files modified:** `apps/web/components/landing/FeaturedProperties.tsx`, `apps/web/components/landing/CTAFinal.tsx`

**2. [Rule 2 - Missing] Badge variants mismatch**
- **Found during:** Task 3 (FeaturedProperties)
- **Issue:** Plan referenced `variant="accent"` and `variant="secondary"` but Badge only supports: default, success, warning, danger, info, photo, video, vue360, plan
- **Fix:** Used `variant="success"` for "Vente" and `variant="video"` for "Location" — semantically coherent orange/green visual distinction

## Known Stubs

The following components use static/fictitious data as documented in the plan:

| File | Stub Type | Reason | Future Plan |
|---|---|---|---|
| `FeaturedProperties.tsx` | 3 hardcoded property objects | Plan specifies "props statiques factices" | Future biens listing plan will wire real Supabase data |
| `Testimonials.tsx` | 3 hardcoded testimonial objects | Landing page static content | Can be CMS-driven in a future phase |
| `Stats.tsx` | 4 hardcoded stat values | Landing page static content | Can be database-driven in a future analytics plan |
| `Partners.tsx` | 6 hardcoded partner entries | Static partner list | Intentional static content |

These stubs are intentional per the plan specification and do not prevent the landing page's goal of demonstrating the product.

## Self-Check: PASSED

Files verified:
- FOUND: apps/web/app/(public)/page.tsx
- FOUND: apps/web/app/(public)/layout.tsx
- FOUND: apps/web/components/landing/Hero.tsx
- FOUND: apps/web/components/landing/HowItWorks.tsx
- FOUND: apps/web/components/landing/FeaturedProperties.tsx
- FOUND: apps/web/components/landing/Features.tsx
- FOUND: apps/web/components/landing/MapZones.tsx
- FOUND: apps/web/components/landing/Testimonials.tsx
- FOUND: apps/web/components/landing/Stats.tsx
- FOUND: apps/web/components/landing/Partners.tsx
- FOUND: apps/web/components/landing/CTAFinal.tsx
- FOUND: apps/web/components/landing/Footer.tsx
- FOUND: apps/web/app/sitemap.ts
- FOUND: apps/web/app/robots.ts

Commits verified:
- FOUND: 312cde2 — SEO metadata, sitemap, robots
- FOUND: 13aee6d — Hero section
- FOUND: a112ab9 — 8 landing sections
- FOUND: 7a46cea — page assembly
