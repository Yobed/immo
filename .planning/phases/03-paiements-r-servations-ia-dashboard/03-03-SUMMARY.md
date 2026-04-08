---
phase: 03-paiements-r-servations-ia-dashboard
plan: 03
status: completed
completed_at: "2026-04-07"
duration_min: 10
tasks_completed: 2
files_modified: 4
---

# Summary: 03-03 — Contrats PDF OHADA

## What Was Done

### Task 1 — next.config.ts + lib/contrat-pdf.tsx
- Patched `apps/web/next.config.ts` avec `serverExternalPackages: ['@react-pdf/renderer']` — evite le crash "ba.Component is not a constructor" en App Router route handlers
- Installe `@react-pdf/renderer@4.4.0` et `to-words@5.4.0` dans `apps/web`
- Cree `apps/web/lib/contrat-pdf.tsx` avec :
  - `montantEnLettres()` : ToWords fr-FR, `currency: false` (jamais "euros"), suffixe "francs CFA" manuel
  - `ContratDocument` : 6 articles OHADA (parties, bien, duree, loyer+charges, depot garantie, resiliation)
  - Loyer en chiffres (`toLocaleString`) ET en lettres (`montantEnLettres`) — RESA-05 critique

### Task 2 — Routes API contrats
- Cree `apps/web/app/api/contrats/generer/route.ts` (POST) :
  - Service role key (appelable depuis webhook non authentifie)
  - `renderToBuffer(createElement(ContratDocument, props))` pour generer le PDF
  - `supabase.storage.createBucket('contrats', { public: false })` — cree si inexistant
  - Upload PDF → bucket `contrats`, URL signee 1 an stockee dans `contrats.pdf_url`
  - Insert dans table `contrats`, retourne `{ contratId, pdfUrl }`
- Cree `apps/web/app/api/contrats/[id]/route.ts` (GET) :
  - Auth obligatoire (getUser)
  - Verifie `bailleur_id === user.id || preneur_id === user.id` avant de retourner pdf_url
  - Retourne 403 si l'utilisateur n'est ni bailleur ni preneur

## Key Decisions

- **montant_loyer_fcfa not montant_fcfa** — nom reel du champ dans migration 004 (cf. Key Decisions STATE.md)
- **to-words currency:false** — currency:true genere "euros" meme avec locale fr-FR
- **createElement wrapper** — renderToBuffer attend un ReactElement, pas JSX direct
- **bucket contrats pas encore cree** — createBucket avec gestion erreur Duplicate

## Files Modified

| File | Action |
|---|---|
| `apps/web/next.config.ts` | serverExternalPackages added |
| `apps/web/lib/contrat-pdf.tsx` | Created — ContratDocument + montantEnLettres |
| `apps/web/app/api/contrats/generer/route.ts` | Created — PDF generation + Storage upload |
| `apps/web/app/api/contrats/[id]/route.ts` | Created — secure PDF URL access |

## Success Criteria Status

1. ✅ next.config.ts contient `serverExternalPackages: ['@react-pdf/renderer']`
2. ✅ POST /api/contrats/generer retourne `{ contratId, pdfUrl }` apres upload Supabase Storage
3. ✅ Loyer en chiffres ET en lettres (montantEnLettres) — jamais "euros"
4. ✅ 6 articles OHADA : parties, bien, duree, loyer+charges, depot garantie, resiliation
5. ✅ GET /api/contrats/[id] retourne 403 si ni bailleur ni preneur
