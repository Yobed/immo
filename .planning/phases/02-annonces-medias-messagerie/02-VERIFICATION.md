---
phase: 02-annonces-medias-messagerie
verified: 2026-04-06T12:00:00Z
status: gaps_found
score: 13/17 must-haves verified
re_verification: false
gaps:
  - truth: "Propriétaire peut créer un bien via un formulaire 5 étapes avec validation Zod"
    status: partial
    reason: "BienForm a TOTAL_STEPS=4 (infos, prix, localisation, équipements). Step5Medias.tsx existe mais n'est importé nulle part. Le BienForm redirige vers modifier?step=medias après création, mais la page modifier ne gère pas le paramètre step et ne rend pas Step5Medias."
    artifacts:
      - path: "apps/web/components/bien/BienForm/index.tsx"
        issue: "TOTAL_STEPS=4, Step5Medias non importé ni intégré"
      - path: "apps/web/app/(pro)/biens/[id]/modifier/page.tsx"
        issue: "searchParams non utilisés — step=medias ignoré, Step5Medias non rendu"
      - path: "apps/web/components/bien/BienForm/Step5Medias.tsx"
        issue: "Composant ORPHELIN — créé mais importé nulle part"
    missing:
      - "Importer Step5Medias dans BienForm/index.tsx ou dans la page modifier"
      - "Gérer le paramètre searchParams.step dans /biens/[id]/modifier/page.tsx"
      - "Afficher Step5Medias quand step=medias (avec bienId comme prop)"

  - truth: "Visiteur connecté peut envoyer un message à un propriétaire depuis la fiche bien"
    status: failed
    reason: "VisiteRequestForm et FavorisButton existent comme composants mais ne sont pas importés ni utilisés dans /biens/[id]/page.tsx. La fiche bien publique n'expose aucun moyen de contacter le propriétaire ou de demander une visite."
    artifacts:
      - path: "apps/web/app/(public)/biens/[id]/page.tsx"
        issue: "Ni FavorisButton ni VisiteRequestForm importés ou rendus — fiche bien est en lecture seule"
      - path: "apps/web/components/bien/FavorisButton.tsx"
        issue: "Composant ORPHELIN — existe mais non utilisé dans les pages publiques"
      - path: "apps/web/components/bien/VisiteRequestForm.tsx"
        issue: "Composant ORPHELIN — existe mais non utilisé dans les pages publiques"
    missing:
      - "Importer FavorisButton dans /biens/[id]/page.tsx et le rendre avec bienId + userId (depuis session)"
      - "Importer VisiteRequestForm dans /biens/[id]/page.tsx et le rendre avec bienId + proprietaireId"
      - "Récupérer l'utilisateur connecté dans la page fiche bien pour passer userId à FavorisButton"

  - truth: "Utilisateur peut sauvegarder et retirer un bien de ses favoris"
    status: failed
    reason: "FavorisButton est orphelin — non intégré dans la fiche bien publique ni dans BienCard. L'utilisateur n'a aucun point d'entrée UI pour ajouter un favori."
    artifacts:
      - path: "apps/web/components/bien/FavorisButton.tsx"
        issue: "Composant ORPHELIN — aucun parent ne l'importe"
    missing:
      - "Intégrer FavorisButton dans /biens/[id]/page.tsx"
      - "Optionnellement, intégrer dans BienCard pour la liste /biens"

  - truth: "Visiteur peut soumettre une demande de visite avec date et créneau"
    status: failed
    reason: "VisiteRequestForm existe et soumet vers /api/visites, mais n'est pas intégré dans la fiche bien publique. Aucun point d'entrée UI n'est accessible au visiteur."
    artifacts:
      - path: "apps/web/components/bien/VisiteRequestForm.tsx"
        issue: "Composant ORPHELIN — non intégré dans /biens/[id]/page.tsx"
    missing:
      - "Importer et rendre VisiteRequestForm dans /biens/[id]/page.tsx avec bienId et proprietaireId"
---

# Phase 02: Annonces, Médias & Messagerie — Verification Report

**Phase Goal:** CRUD biens complet, médias avancés (carousel 4 types, vue 360° Pannellum), recherche full-text + carte, messagerie temps réel et favoris.
**Verified:** 2026-04-06T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Propriétaire peut créer un bien via formulaire 5 étapes avec validation Zod | PARTIAL | BienForm existe avec zodResolver, mais TOTAL_STEPS=4; Step5Medias orphelin |
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
| 15 | Visiteur connecté peut envoyer un message à un propriétaire depuis la fiche bien | FAILED | FavorisButton + VisiteRequestForm non intégrés dans /biens/[id]/page.tsx |
| 16 | Messages apparaissent en temps réel (Supabase Realtime) | VERIFIED | postgres_changes INSERT sur messages avec cleanup removeChannel |
| 17 | Utilisateur peut sauvegarder/retirer un bien de ses favoris | FAILED | FavorisButton orphelin — aucun point d'entrée UI dans pages publiques |
| 18 | Visiteur peut soumettre une demande de visite | FAILED | VisiteRequestForm orphelin — non intégré dans fiche bien |
| 19 | Propriétaire peut confirmer ou refuser une demande de visite | VERIFIED | /pro/visites page + VisiteActions + PATCH /api/visites avec guard proprietaire_id |

**Score:** 13/17 truths verified (4 failed, 1 partial counted in failed group)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/components/bien/BienForm/index.tsx` | Orchestrateur multi-étapes zodResolver | PARTIAL | zodResolver OK; TOTAL_STEPS=4 pas 5; Step5Medias non intégré |
| `apps/web/components/bien/BienCard.tsx` | Card avec formatFCFA, commune, type_bien | VERIFIED | formatFCFA via Intl.NumberFormat('fr-CI') |
| `apps/web/app/api/biens/[id]/route.ts` | PATCH statut + DELETE owner-only | VERIFIED | ownership check eq('proprietaire_id', user.id) |
| `apps/web/app/(public)/biens/page.tsx` | Liste publiés Server Component pagination | VERIFIED | .eq('statut','publie') confirmé |
| `apps/web/app/(public)/biens/[id]/page.tsx` | Fiche bien avec biens_medias | VERIFIED | biens_medias join + BienCarousel |
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
| `apps/web/components/bien/FavorisButton.tsx` | Toggle favori upsert/delete | ORPHANED | Composant substantif mais non utilisé dans pages publiques |
| `apps/web/components/bien/VisiteRequestForm.tsx` | Formulaire demande visite | ORPHANED | Composant substantif mais non intégré dans /biens/[id]/page.tsx |
| `apps/web/app/api/visites/route.ts` | POST visite + PATCH confirmation/refus | VERIFIED | statut en_attente/confirmee/annulee; guard proprietaire_id |
| `apps/web/components/bien/BienForm/Step5Medias.tsx` | Étape 5 médias du formulaire | ORPHANED | Fichier existe mais non importé nulle part |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| BienForm/index.tsx | POST /api/biens | fetch in onSubmit | WIRED | ligne 55: fetch('/api/biens', ...) |
| /pro/biens/page.tsx | PATCH /api/biens/[id] | ToggleStatutButton | WIRED | ToggleStatutButton importé ligne 6, rendu ligne 68 |
| MediaUploader.tsx | /api/upload/sign | signatureEndpoint prop | WIRED | ligne 76: signatureEndpoint="/api/upload/sign" |
| MediaUploader.tsx | /api/biens/[id]/medias | fetch POST après upload | WIRED | lignes 54, 85: fetch(/api/biens/${bienId}/medias) |
| MediaSortable.tsx | /api/biens/[id]/medias | PATCH batch ordre drag end | WIRED | ligne 109: method:'PATCH', updates:[{id, ordre}] |
| /biens/[id]/page.tsx | BienCarousel | import + prop medias | WIRED | import ligne 5; rendu ligne 38 avec medias.map |
| BienCarousel.tsx | Bien360 | slide conditionnel type=vue_360 | WIRED | import ligne 5; rendu ligne 48 conditionnel |
| /recherche/page.tsx | textSearch fts french | Server Component searchParams.q | WIRED | ligne 47: textSearch('fts', q, {type:'plain', config:'french'}) |
| PropertiesMap.tsx | react-map-gl Map | dynamic import ssr:false | WIRED | ligne 10-12: dynamic Map/Marker/Popup ssr:false |
| MessageThread.tsx | supabase.channel postgres_changes INSERT | useEffect subscription | WIRED | lignes 44-54 + removeChannel cleanup ligne 60 |
| FavorisButton.tsx | favoris upsert/delete | handleToggle onClick | NOT_WIRED | FavorisButton non intégré dans fiche bien ni BienCard |
| VisiteRequestForm.tsx | /api/visites | fetch POST | PARTIAL | fetch wired en interne (ligne 40) mais composant orphelin dans les pages |
| /biens/[id]/page.tsx | FavorisButton | import + render | NOT_WIRED | Non importé dans la fiche bien |
| /biens/[id]/page.tsx | VisiteRequestForm | import + render | NOT_WIRED | Non importé dans la fiche bien |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `/biens/page.tsx` | biens | supabase.from('biens').eq('statut','publie') | Yes — DB query with pagination | FLOWING |
| `/biens/[id]/page.tsx` | bien, medias | supabase.from('biens').select(biens_medias) | Yes — joins biens_medias | FLOWING |
| `/recherche/page.tsx` | biensArray | textSearch fts + 5 filtres combinés | Yes — DB query live | FLOWING |
| `MessageThread.tsx` | messages | supabase.from('messages') + postgres_changes | Yes — initial load + realtime | FLOWING |
| `/messages/page.tsx` | conversations | supabase.from('conversations').select | Yes — DB query + filter participant | FLOWING |
| `/favoris/page.tsx` | biens | supabase.from('favoris').select(biens(…)) | Yes — join biens via favoris | FLOWING |
| `/pro/visites/page.tsx` | visites | supabase.from('visites') | Yes — filtered by proprietaire_id | FLOWING |
| `FavorisButton.tsx` | isFavori | supabase.from('favoris').upsert/delete | N/A — orphelin, pas rendu | DISCONNECTED |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — ces composants requièrent un serveur Next.js actif et un projet Supabase configuré. Les modules node_modules ne sont pas installés dans le worktree git.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BIEN-01 | 02-01 | Créer bien formulaire multi-étapes Zod | PARTIAL | BienForm 4 étapes avec zodResolver; Step5Medias non intégré |
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
| MSG-01 | 02-05 | Envoyer message à propriétaire depuis fiche bien | BLOCKED | MessageThread existe mais fiche bien n'a aucun lien vers /messages ni bouton contact |
| MSG-02 | 02-05 | Messages en temps réel Supabase Realtime | SATISFIED | postgres_changes INSERT filter conversation_id + cleanup |
| MSG-03 | 02-05 | Sauvegarder / retirer favori | BLOCKED | FavorisButton orphelin — non intégré dans fiche bien |
| MSG-04 | 02-05 | Demander une visite (date, créneau) | BLOCKED | VisiteRequestForm orphelin — non intégré dans fiche bien |
| MSG-05 | 02-05 | Propriétaire confirme ou refuse visite | SATISFIED | VisiteActions + PATCH /api/visites avec guard proprietaire_id |

**Orphaned requirements (mappés phase 2 mais non couverts par un plan):** Aucun — tous les 21 IDs sont couverts par les plans 02-01 à 02-05.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `BienForm/Step5Medias.tsx` | — | Composant créé mais jamais importé | Blocker | Upload médias inaccessible depuis le flux création bien |
| `FavorisButton.tsx` | — | Composant créé mais jamais intégré dans pages publiques | Blocker | Favoris non utilisables — objectif MSG-03 non atteint |
| `VisiteRequestForm.tsx` | — | Composant créé mais jamais intégré dans fiche bien | Blocker | Demandes visite impossibles — objectif MSG-04 non atteint |
| `modifier/page.tsx` | — | BienForm redirige vers `?step=medias` mais la page n'a aucun handler pour ce param | Warning | Flux création → médias est rompu (redirection silencieusement ignorée) |

Faux positifs exclus: les occurrences de `placeholder` dans Step1Infos.tsx, Step2Prix.tsx, Step3Localisation.tsx sont des attributs HTML `placeholder=""` sur des `<Input>`, pas des implémentations vides.

---

### Human Verification Required

#### 1. Messagerie — accès depuis fiche bien

**Test:** Depuis la fiche d'un bien publié, vérifier qu'un utilisateur connecté peut initier une conversation avec le propriétaire.
**Expected:** Bouton "Contacter le propriétaire" ou équivalent visible et fonctionnel sur /biens/[id].
**Why human:** La fiche bien ne rend ni FavorisButton ni VisiteRequestForm — cet accès n'existe pas actuellement; la vérification UI nécessite un navigateur.

#### 2. Réaltime Supabase — activation Replication

**Test:** Dans Supabase Dashboard > Database > Replication, vérifier que la table `messages` est activée pour Realtime.
**Expected:** La case "messages" est cochée dans la liste des tables répliquées.
**Why human:** Cette configuration est manuelle dans le Dashboard et ne peut pas être vérifiée par le code source.

#### 3. Carousel Embla — swipe mobile et miniatures synchronisées

**Test:** Sur un appareil mobile (ou DevTools viewport mobile), ouvrir la fiche d'un bien avec plusieurs médias; swiper les slides et vérifier que les miniatures s'actualisent.
**Expected:** Swipe natif fonctionne; miniature active est mise en évidence; compteur slides s'incrémente.
**Why human:** Comportement runtime interactif non vérifiable statiquement.

#### 4. Vue 360° Pannellum — rendu et hotspots

**Test:** Ouvrir un bien ayant une photo vue_360 dans biens_medias; vérifier que le viewer Pannellum s'initialise, la rotation automatique démarre, et un clic sur un hotspot affiche sa description.
**Expected:** Pas de crash SSR; rotation visible; hotspots interactifs.
**Why human:** Nécessite un navigateur et une image équirectangulaire réelle en base.

---

### Gaps Summary

**3 composants sont orphelins — créés mais jamais intégrés dans les pages qui en ont besoin.**

La cause commune est que le plan 02-05 a créé FavorisButton, VisiteRequestForm, et Step5Medias comme composants autonomes sans les câbler dans les pages consommatrices. La fiche bien publique (`/biens/[id]/page.tsx`) n'a pas été modifiée pour intégrer les interactions utilisateur (favoris, contact, visite). Le modifier page n'a pas été mis à jour pour exposer Step5Medias via le paramètre `?step=medias`.

**Impact sur les exigences:**
- BIEN-01 (formulaire 5 étapes): partiellement satisfaite — 4 étapes fonctionnelles, étape médias inaccessible
- MSG-01 (message depuis fiche bien): non satisfaite — pas de bouton contact dans la fiche
- MSG-03 (favoris): non satisfaite — FavorisButton orphelin
- MSG-04 (demande visite): non satisfaite — VisiteRequestForm orphelin

**Tout le reste de la phase est solidement implémenté:** CRUD biens complet, pipeline médias Cloudinary+Storage, BienCarousel Embla 4 types, Bien360 Pannellum ssr:false, recherche FTS française avec 5 filtres, carte Mapbox dynamique, messagerie Realtime postgres_changes, page favoris et /pro/visites avec confirmation. 13 des 17 comportements observables sont vérifiés.

---

_Verified: 2026-04-06T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
