---
phase: 03-paiements-r-servations-ia-dashboard
plan: "04"
subsystem: ia-chatbot
tags: [claude-api, sse-streaming, chatbot, scoring, ia, immobilier-ci]
dependency_graph:
  requires: []
  provides: [chatbot-ia-ci, scoring-annonces, generation-descriptions, api-chat-sse]
  affects: [apps/web/lib/claude.ts, apps/web/app/api/chat, apps/web/app/api/biens/[id]/score, apps/web/app/api/biens/[id]/description, apps/web/components/chat]
tech_stack:
  added: ["@anthropic-ai/sdk@0.82.0"]
  patterns: [SSE streaming via ReadableStream, multi-turn React state, Anthropic messages.stream()]
key_files:
  created:
    - apps/web/lib/claude.ts
    - apps/web/app/api/chat/route.ts
    - apps/web/app/api/biens/[id]/score/route.ts
    - apps/web/app/api/biens/[id]/description/route.ts
    - apps/web/components/chat/ChatMessage.tsx
    - apps/web/components/chat/ChatBot.tsx
    - apps/web/app/(public)/chat/page.tsx
  modified:
    - apps/web/package.json
decisions:
  - "@anthropic-ai/sdk v0.82.0 installed in apps/web — hoisted to monorepo root by npm workspaces"
  - "SSE streaming via content_block_delta chunks — not raw EventSource protocol, just raw ReadableStream text"
  - "Multi-turn history maintained in React useState client-side — no DB persistence in Phase 3"
  - "Scoring resilient via JSON.parse try/catch returning fallback object on model parse error"
metrics:
  duration: "4min"
  completed: "2026-04-07"
  tasks: 2
  files: 7
---

# Phase 3 Plan 04: IA Chatbot Immobilier CI — SSE Streaming + Scoring + Descriptions Summary

**One-liner:** Claude API chatbot with Abidjan geography/FCFA pricing via SSE streaming, plus JSON scoring and marketing description generation for property listings.

## What Was Built

Full AI layer for the Immo CI platform:

1. **lib/claude.ts** — Centralized Anthropic client with 3 functions:
   - `chatImmobilierStream()` — streaming chat with immobilier CI system prompt (Abidjan communes, FCFA prices, French language rules)
   - `scorerAnnonce()` — synchronous scoring returning `{score, niveau, points_forts, recommandations, resume}` with JSON.parse try/catch resilience
   - `genererDescription()` — marketing description generation from property characteristics

2. **POST /api/chat** — SSE endpoint converting Anthropic SDK stream to Web ReadableStream via `content_block_delta` chunks

3. **POST /api/biens/[id]/score** — Auth-gated scoring route (owner-only) that fetches bien data + photo count from Supabase then calls `scorerAnnonce()`

4. **POST /api/biens/[id]/description** — Auth-gated description generation route (owner-only)

5. **ChatBot.tsx** — Client component with:
   - Multi-turn conversation state via React `useState<Message[]>`
   - SSE consumer via `res.body.getReader()` + `TextDecoder({ stream: true })`
   - Real-time token streaming updating last assistant message in-place
   - 3 initial suggestion buttons (empty state)
   - "En cours de reflexion..." indicator during stream

6. **ChatMessage.tsx** — Visual bubble differentiation user (right, primary blue) vs assistant (left, white card)

7. **/chat page** — Public Server Component at `(public)/chat/page.tsx`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Anthropic SDK not installed**
- **Found during:** Task 1 setup
- **Issue:** `@anthropic-ai/sdk` missing from apps/web, blocking all IA routes
- **Fix:** `npm install @anthropic-ai/sdk --legacy-peer-deps` in apps/web; SDK v0.82.0 installed and hoisted to monorepo root
- **Files modified:** apps/web/package.json, package-lock.json
- **Commit:** 38f4166

## Known Stubs

None — all IA functions are fully wired. The chatbot calls real Claude API; scoring and description routes call real Supabase + Claude API. ANTHROPIC_API_KEY env var required at runtime (not stubbed, returns auth error gracefully if missing).

## Self-Check: PASSED
