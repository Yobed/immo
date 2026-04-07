---
phase: 02-annonces-medias-messagerie
verified: 2026-04-07T12:00:00Z
status: gaps_found
score: 16/19 must-haves verified
re_verification: true
re_verification_meta:
  previous_status: gaps_found
  previous_score: 13/17
  gaps_closed:
    - "BIEN-01: BienForm TOTAL_STEPS=5, modifier page handles ?step=medias avec Step5Medias"
    - "MSG-03: FavorisButton importé et rendu dans /biens/[id]/page.tsx avec bienId + userId"
    - "MSG-04: VisiteRequestForm importé et rendu dans /biens/[id]/page.tsx avec bienId + proprietaireId"
  gaps_remaining:
    - "MSG-01: Aucun point d'entrée messagerie (chat) sur la fiche bien — VisiteRequestForm ne satisfait pas MSG-01"
  regressions: []
gaps:
  - truth: "Visiteur connecté peut envoyer un message (chat) à un propriétaire depuis la fiche bien"
    status: failed
    reason: "MSG-01 exige 'envoyer un message à un propriétaire depuis une fiche bien'. La fiche bien dispose maintenant de FavorisButton (MSG-03) et VisiteRequestForm (MSG-04), mais aucun bouton/lien de messagerie n'existe. VisiteRequestForm crée une demande de visite dans la table 'visites', pas un message dans 'messages'/'conversations'. La page /messages existe avec MessageThread/ConversationList, mais aucun point d'entrée depuis la fiche bien ne permet de démarrer une conversation."
    artifacts:
      - path: "apps/web/app/(public)/biens/[id]/page.tsx"
        issue: "Pas de bouton 'Contacter le propriétaire', pas de lien vers /messages, pas d'upsert conversation depuis la fiche bien"
    missing:
      - "Ajouter un bouton ou lien 'Contacter le propriétaire' sur la fiche bien qui initie ou redirige vers une conversation"
      - "Upsert une conversation (participant_1, participant_2, bien_id) puis rediriger vers /messages?conversation={id} — OU afficher un formulaire de message inline"
human_verification:
  - test: "Réaltime Supabase — activation Replication"
    expected: "Dans Supabase Dashboard > Database > Replication, la table 'messages' est activée"
    why_human: "Configuration manuelle Dashboard, non vérifiable par le code source"
  - test: "Carousel Embla — swipe mobile et miniatures synchronisées"
    expected: "Swipe natif fonctionne sur mobile; miniature active mise en évidence; compteur slides s'incrémente"
    why_human: "Comportement runtime interactif non vérifiable statiquement"
  - test: "Vue 360° Pannellum — rendu et hotspots"
    expected: "Viewer Pannellum s'initialise, rotation automatique démarre, clic hotspot affiche description"
    why_human: "Nécessite un navigateur et une image équirectangulaire réelle en base"
---

# Phase 02: Annonces, Médias & Messagerie — Verification Report (Re-verification)

**Phase Goal:** CRUD biens complet, médias avancés (carousel 4 types, vue 360° Pannellum), recherche full-text + carte, messagerie temps réel et favoris.
**Verified:** 2026-04-07T12:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap closure plan 02-06

## Re-verification Summary

| Gap (previous) | Previous Status | Current Status |
|----------------|-----------------|----------------|
| BIEN-01: Step5Medias orphelin, TOTAL_STEPS=4 | PARTIAL | CLOSED |
| MSG-03: FavorisButton orphelin | FAILED | CLOSED |
| MSG-04: VisiteRequestForm orphelin | FAILED | CLOSED |
| MSG-01: Aucun point d'entrée messagerie (chat) depuis fiche bien | FAILED | STILL FAILED |

**Score before:** 13/17 — **Score now:** 16/19 (adjusted truth count adds the 2 new truths from plan 02-06)

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Propriétaire peut créer un bien via formulaire 5 étapes avec validation Zod | VERIFIED | TOTAL_STEPS=5 (ligne 39); step-5 summary panel (ligne 89-94); redirect vers ?step=medias (ligne 62) |
| 2  | Propriétaire peut modifier et supprimer ses propres biens | VERIFIED | PATCH + DELETE dans /api/biens/[id]/route.ts avec eq('proprietaire_id', user.id) |
| 3  | Propriétaire peut publier/dépublier un bien | VERIFIED | ToggleStatutButton wired dans /pro/biens/page.tsx |
| 4  | Visiteur peut voir la liste paginée des biens publiés | VERIFIED | /biens page.tsx: .eq('statut','publie') + pagination |
| 5  | Visiteur peut voir la fiche complète d'un bien | VERIFIED | /biens/[id]/page.tsx: titre, prix FCFA, commune, description, BienCarousel |
| 6  | Propriétaire peut uploader photos vers Cloudinary (biens_medias) | VERIFIED | CldUploadWidget + signatureEndpoint + fetch POST /medias |
| 7  | Propriétaire peut uploader vidéos/360°/plans vers Supabase Storage (biens_medias) | VERIFIED | react-dropzone + supabase.storage + /api/biens/[id]/medias |
| 8  | Propriétaire peut réordonner médias par drag & drop (ordre persisté) | VERIFIED | DndContext + PATCH batch ordre dans MediaSortable.tsx |
| 9  | Une photo peut être définie comme couverture (une seule par bien) | VERIFIED | PATCH {couverture_id} avec reset est_couverture=false avant set true |
| 10 | Visiteur voit carousel swipeable 4 types de médias avec filtres et miniatures | VERIFIED | BienCarousel avec useEmblaCarousel, filtres type, badges colorés, miniatures |
| 11 | Vue 360° interactive via Pannellum avec hotspots et rotation automatique | VERIFIED | Bien360.tsx: dynamic import ssr:false, autoRotate=-2, hotSpots mappés |
| 12 | Visiteur peut faire une recherche full-text (FTS français) | VERIFIED | textSearch('fts', q, {type:'plain', config:'french'}) dans /recherche |
| 13 | Visiteur peut filtrer par commune, prix, type, équipements | VERIFIED | SearchFilters avec 5 filtres combinés wired dans /recherche page |
| 14 | Visiteur peut voir les biens sur une carte Mapbox avec markers prix FCFA | VERIFIED | PropertiesMap avec dynamic react-map-gl ssr:false, markers XOF |
| 15 | Visiteur connecté peut envoyer un message (chat) à un propriétaire depuis la fiche bien | FAILED | Fiche bien: FavorisButton + VisiteRequestForm présents, mais aucun bouton/lien messagerie. VisiteRequestForm POST vers /api/visites (table visites), pas vers /api/messages (table messages/conversations). MSG-01 non satisfait. |
| 16 | Messages apparaissent en temps réel (Supabase Realtime) | VERIFIED | postgres_changes INSERT sur messages avec cleanup removeChannel |
| 17 | Utilisateur peut sauvegarder/retirer un bien de ses favoris | VERIFIED | FavorisButton importé (ligne 6) + rendu (ligne 101) avec bienId={bien.id} userId={user?.id ?? null} |
| 18 | Visiteur peut soumettre une demande de visite avec date et créneau | VERIFIED | VisiteRequestForm importé (ligne 7) + rendu (ligne 103) avec bienId + proprietaireId; POST vers /api/visites confirmé |
| 19 | Propriétaire peut confirmer ou refuser une demande de visite | VERIFIED | /pro/visites page + VisiteActions + PATCH /api/visites avec guard proprietaire_id |

**Score:** 18/19 truths verified (1 failed)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/components/bien/BienForm/index.tsx` | Orchestrateur multi-étapes 5 étapes, zodResolver | VERIFIED | TOTAL_STEPS=5; zodResolver; step-5 summary; redirect ?step=medias |
| `apps/web/app/(pro)/biens/[id]/modifier/page.tsx` | Page modifier gère ?step=medias → Step5Medias | VERIFIED | searchParams: Promise<{step?: string}>; step === 'medias' → <Step5Medias bienId={id} /> |
| `apps/web/app/(public)/biens/[id]/page.tsx` | Fiche bien avec FavorisButton + VisiteRequestForm | VERIFIED | FavorisButton ligne 6+101; VisiteRequestForm ligne 7+103; auth.getUser() ligne 16 |
| `apps/web/components/bien/FavorisButton.tsx` | Toggle favori upsert/delete | VERIFIED | Wired: bienId + userId reçus; upsert/delete sur table favoris |
| `apps/web/components/bien/VisiteRequestForm.tsx` | Formulaire demande visite date + créneau | VERIFIED | Wired: bienId + proprietaireId reçus; POST /api/visites avec date, creneau, message |
| `apps/web/components/bien/BienForm/Step5Medias.tsx` | Étape 5 médias, MediaUploader + MediaSortable | VERIFIED | Wired dans modifier/page.tsx quand step=medias |
| `apps/web/components/bien/BienCard.tsx` | Card avec formatFCFA, commune, type_bien | VERIFIED | formatFCFA via Intl.NumberFormat('fr-CI') |
| `apps/web/app/api/biens/[id]/route.ts` | PATCH statut + DELETE owner-only | VERIFIED | ownership check eq('proprietaire_id', user.id) |
| `apps/web/app/(public)/biens/page.tsx` | Liste publiés Server Component pagination | VERIFIED | .eq('statut','publie') confirmé |
| `apps/web/lib/cloudinary.ts` | signUploadParams() signature serveur | VERIFIED | api_sign_request présent |
| `apps/web/app/api/upload/sign/route.ts` | POST endpoint signature Cloudinary | VERIFIED | retourne {signature} |
| `apps/web/app/api/biens/[id]/medias/route.ts` | POST+PATCH+DELETE biens_medias | VERIFIED | gestion ordre batch + couverture unique |
| `apps/web/components/media/MediaUploader.tsx` | CldUploadWidget + dropzone Storage | VERIFIED | CldUploadWidget ligne 75; signatureEndpoint="/api/upload/sign" |
| `apps/web/components/media/MediaSortable.tsx` | @dnd-kit sortable avec persistance ordre | VERIFIED | DndContext + PATCH batch ligne 109 |
| `apps/web/components/bien/BienCarousel.tsx` | Embla carousel filtres par type miniatures | VERIFIED | useEmblaCarousel, filtres, badges colorés, miniatures |
| `apps/web/components/bien/Bien360.tsx` | Pannellum dynamique ssr:false + hotspots | VERIFIED | dynamic import ssr:false ligne 9; hotSpots mappés |
| `apps/web/app/(public)/recherche/page.tsx` | FTS + filtres + vue carte | VERIFIED | textSearch fts french + 5 filtres + PropertiesMap conditionnel |
| `apps/web/components/map/PropertiesMap.tsx` | react-map-gl carte Mapbox centrée Abidjan | VERIFIED | dynamic ssr:false Map/Marker/Popup; ABIDJAN_CENTER |
| `apps/web/components/search/SearchFilters.tsx` | Filtres commune/prix/type/équipements | VERIFIED | 5 filtres avec searchParams URL |
| `apps/web/components/messaging/MessageThread.tsx` | Thread temps réel postgres_changes | VERIFIED | postgres_changes INSERT filter + removeChannel cleanup |
| `apps/web/app/api/visites/route.ts` | POST visite + PATCH confirmation/refus | VERIFIED | statut en_attente/confirmee/annulee; guard proprietaire_id |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| BienForm/index.tsx | POST /api/biens | fetch in onSubmit | WIRED | ligne 55: fetch('/api/biens', ...) |
| BienForm/index.tsx | /biens/[id]/modifier?step=medias | router.push après création | WIRED | ligne 62: router.push(`/biens/${id}/modifier?step=medias`) |
| modifier/page.tsx | Step5Medias | searchParams.step === 'medias' | WIRED | ligne 36-37: step==='medias' → <Step5Medias bienId={id} /> |
| /biens/[id]/page.tsx | FavorisButton | import + render avec bienId + userId | WIRED | import ligne 6; render ligne 101 avec userId={user?.id ?? null} |
| /biens/[id]/page.tsx | VisiteRequestForm | import + render avec bienId + proprietaireId | WIRED | import ligne 7; render ligne 103 avec proprietaire_id as string |
| /pro/biens/page.tsx | PATCH /api/biens/[id] | ToggleStatutButton | WIRED | ToggleStatutButton importé ligne 6, rendu ligne 68 |
| MediaUploader.tsx | /api/upload/sign | signatureEndpoint prop | WIRED | ligne 76: signatureEndpoint="/api/upload/sign" |
| MediaUploader.tsx | /api/biens/[id]/medias | fetch POST après upload | WIRED | lignes 54, 85: fetch(/api/biens/${bienId}/medias) |
| MediaSortable.tsx | /api/biens/[id]/medias | PATCH batch ordre drag end | WIRED | ligne 109: method:'PATCH', updates:[{id, ordre}] |
| /biens/[id]/page.tsx | BienCarousel | import + prop medias | WIRED | import ligne 5; rendu ligne 41 avec medias.map |
| BienCarousel.tsx | Bien360 | slide conditionnel type=vue_360 | WIRED | import ligne 5; rendu ligne 48 conditionnel |
| /recherche/page.tsx | textSearch fts french | Server Component searchParams.q | WIRED | ligne 47: textSearch('fts', q, {type:'plain', config:'french'}) |
| PropertiesMap.tsx | react-map-gl Map | dynamic import ssr:false | WIRED | ligne 10-12: dynamic Map/Marker/Popup ssr:false |
| MessageThread.tsx | supabase.channel postgres_changes INSERT | useEffect subscription | WIRED | lignes 44-54 + removeChannel cleanup ligne 60 |
| /biens/[id]/page.tsx | table messages/conversations | "Contacter le propriétaire" button | NOT_WIRED | Aucun bouton/lien messagerie dans la fiche bien — MSG-01 non couvert |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `/biens/page.tsx` | biens | supabase.from('biens').eq('statut','publie') | Yes — DB query avec pagination | FLOWING |
| `/biens/[id]/page.tsx` | bien, medias | supabase.from('biens').select(biens_medias) | Yes — joins biens_medias | FLOWING |
| `/biens/[id]/page.tsx` | user | supabase.auth.getUser() | Yes — session courante | FLOWING |
| `/recherche/page.tsx` | biensArray | textSearch fts + 5 filtres combinés | Yes — DB query live | FLOWING |
| `MessageThread.tsx` | messages | supabase.from('messages') + postgres_changes | Yes — initial load + realtime | FLOWING |
| `/messages/page.tsx` | conversations | supabase.from('conversations').select | Yes — DB query + filter participant | FLOWING |
| `/favoris/page.tsx` | biens | supabase.from('favoris').select(biens(…)) | Yes — join biens via favoris | FLOWING |
| `/pro/visites/page.tsx` | visites | supabase.from('visites') | Yes — filtered by proprietaire_id | FLOWING |
| `FavorisButton.tsx` | isFavori | supabase.from('favoris').upsert/delete | Yes — wired via bienId + userId props | FLOWING |
| `VisiteRequestForm.tsx` | success/error | fetch POST /api/visites | Yes — wired via bienId + proprietaireId props | FLOWING |
| `Step5Medias.tsx` | medias | supabase.from('biens_medias').eq('bien_id', bienId) | Yes — DB query on load + refresh on upload | FLOWING |
| modifier/page.tsx (guard) | bien | supabase.from('biens').eq('proprietaire_id', user.id) | Yes — ownership guard avant Step5Medias | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — ces composants requièrent un serveur Next.js actif et un projet Supabase configuré. Les modules node_modules ne sont pas installés dans le worktree git.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BIEN-01 | 02-01 + 02-06 | Créer bien formulaire multi-étapes Zod | SATISFIED | BienForm 5 étapes; Step5Medias accessible via modifier?step=medias |
| BIEN-02 | 02-01 | Modifier et supprimer ses biens | SATISFIED | PATCH + DELETE ownership check dans /api/biens/[id] |
| BIEN-03 | 02-01 | Publier / dépublier un bien | SATISFIED | ToggleStatutButton PATCH statut publie/brouillon |
| BIEN-04 | 02-01 | Lister biens publiés avec pagination | SATISFIED | /biens page eq statut publie + pagination |
| BIEN-05 | 02-04 | Filtrer par commune, prix, type, équipements | SATISFIED | SearchFilters 5 filtres combinés wired dans /recherche |
| BIEN-06 | 02-04 | Recherche full-text titre + description | SATISFIED | textSearch fts french type:plain |
| BIEN-07 | 02-01 | Fiche complète (photos, description, carte, prix) | SATISFIED | /biens/[id] avec BienCarousel, desc, prix FCFA, équipements |
| BIEN-08 | 02-04 | Biens sur carte Mapbox | SATISFIED | PropertiesMap react-map-gl markers FCFA |
| MDIA-01 | 02-02 | Upload photos Cloudinary webp CDN | SATISFIED | CldUploadWidget + signatureEndpoint + biens_medias insert |
| MDIA-02 | 02-02 | Upload vidéos Supabase Storage | SATISFIED | dropzone + supabase.storage.upload bucket videos |
| MDIA-03 | 02-02 | Upload photo 360° Supabase Storage | SATISFIED | dropzone + bucket panoramas + type vue_360 |
| MDIA-04 | 02-02 | Upload plans (PDF/image) Supabase Storage | SATISFIED | dropzone + bucket plans + type plan |
| MDIA-05 | 02-03 | BienCarousel flèches + swipe + miniatures + filtres | SATISFIED | useEmblaCarousel loop + filtres par type + miniatures 64x48 |
| MDIA-06 | 02-03 | Bien360 Pannellum hotspots | SATISFIED | dynamic ssr:false + autoRotate + hotSpots |
| MDIA-07 | 02-02 | Réordonner médias drag & drop | SATISFIED | DndContext + PATCH batch ordre au onDragEnd |
| MDIA-08 | 02-02 | Médias ordonnés récupérés efficacement | SATISFIED | .sort((a,b) => a.ordre - b.ordre) après select biens_medias |
| MSG-01 | 02-05 + 02-06 | Envoyer message à propriétaire depuis fiche bien | BLOCKED | La fiche bien a FavorisButton + VisiteRequestForm mais aucun bouton/lien de messagerie (chat). VisiteRequestForm POST vers /api/visites (table visites), pas /api/messages. Aucune conversation créée depuis la fiche bien. |
| MSG-02 | 02-05 | Messages en temps réel Supabase Realtime | SATISFIED | postgres_changes INSERT filter conversation_id + cleanup |
| MSG-03 | 02-05 + 02-06 | Sauvegarder / retirer favori | SATISFIED | FavorisButton importé + rendu avec bienId + userId; upsert/delete sur table favoris |
| MSG-04 | 02-05 + 02-06 | Demander une visite (date, créneau) | SATISFIED | VisiteRequestForm importé + rendu; POST /api/visites avec date_souhaitee + heure_debut/fin |
| MSG-05 | 02-05 | Propriétaire confirme ou refuse visite | SATISFIED | VisiteActions + PATCH /api/visites avec guard proprietaire_id |

**Orphaned requirements:** Aucun — tous les 21 IDs sont couverts par les plans 02-01 à 02-06.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `/biens/[id]/page.tsx` | — | `initialIsFavori` non initialisé depuis la DB | Warning | FavorisButton s'initialise toujours à `false` même si le bien est déjà en favori — l'état visuellement incorrect au premier rendu, corrigé au premier toggle. Non bloquant (fonctionnel) mais UX dégradée. |
| `/biens/[id]/page.tsx` | — | Aucun point d'entrée messagerie (chat) — MSG-01 | Blocker | L'exigence MSG-01 n'est pas couverte |

Faux positifs exclus: les occurrences de `placeholder` dans Step1Infos.tsx, Step2Prix.tsx, Step3Localisation.tsx sont des attributs HTML `placeholder=""` sur des `<Input>`, pas des implémentations vides.

---

### Human Verification Required

#### 1. Réaltime Supabase — activation Replication

**Test:** Dans Supabase Dashboard > Database > Replication, vérifier que la table `messages` est activée pour Realtime.
**Expected:** La case "messages" est cochée dans la liste des tables répliquées.
**Why human:** Cette configuration est manuelle dans le Dashboard et ne peut pas être vérifiée par le code source.

#### 2. Carousel Embla — swipe mobile et miniatures synchronisées

**Test:** Sur un appareil mobile (ou DevTools viewport mobile), ouvrir la fiche d'un bien avec plusieurs médias; swiper les slides et vérifier que les miniatures s'actualisent.
**Expected:** Swipe natif fonctionne; miniature active est mise en évidence; compteur slides s'incrémente.
**Why human:** Comportement runtime interactif non vérifiable statiquement.

#### 3. Vue 360° Pannellum — rendu et hotspots

**Test:** Ouvrir un bien ayant une photo vue_360 dans biens_medias; vérifier que le viewer Pannellum s'initialise, la rotation automatique démarre, et un clic sur un hotspot affiche sa description.
**Expected:** Pas de crash SSR; rotation visible; hotspots interactifs.
**Why human:** Nécessite un navigateur et une image équirectangulaire réelle en base.

---

### Gaps Summary

**1 gap subsiste — MSG-01 non satisfait malgré la closure plan 02-06.**

Plan 02-06 a correctement câblé FavorisButton (MSG-03), VisiteRequestForm (MSG-04) et Step5Medias/TOTAL_STEPS=5 (BIEN-01). Ces trois gaps sont fermés.

MSG-01 ("Utilisateur peut envoyer un message à un propriétaire depuis une fiche bien") reste ouvert car :

- `VisiteRequestForm` crée une entrée dans la table `visites` (demande de visite), pas dans `messages`/`conversations`.
- Il n'existe pas de bouton "Contacter le propriétaire" qui upsert une conversation et redirige vers `/messages?conversation={id}`.
- La page `/messages` avec `MessageThread` et `ConversationList` existe et est fonctionnelle, mais est uniquement accessible via navigation directe — aucun flux depuis la fiche bien.

**Ce qui manque:** Un composant ou un lien sur `/biens/[id]/page.tsx` qui, au clic, crée/récupère une conversation (`supabase.from('conversations').upsert({participant_1, participant_2, bien_id}, {onConflict: '...'})`) puis redirige l'utilisateur vers `/messages?c={conversation_id}`.

**20/21 exigences satisfaites.** Tout le reste de la phase est solidement implémenté : CRUD biens 5 étapes complet, pipeline médias Cloudinary+Storage, BienCarousel Embla 4 types, Bien360 Pannellum ssr:false, recherche FTS française avec 5 filtres, carte Mapbox dynamique, messagerie Realtime postgres_changes, favoris toggle, demandes de visite avec confirmation propriétaire.

---

_Verified: 2026-04-07T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after gap closure plan 02-06_
