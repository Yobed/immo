# Workflow des Agents IA — BOGBE'S GROUPE

## Vue d'ensemble

L'application utilise deux agents IA distincts qui partagent la même infrastructure (Groq / Wasender / Supabase) mais opèrent sur des canaux différents.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENTRÉES UTILISATEUR                         │
├────────────────────┬────────────────────────────────────────────┤
│   Chat du site     │         WhatsApp (Wasender)                │
│  /api/chat         │    /api/whatsapp/webhook                   │
│  (streaming SSE)   │    (POST webhook)                          │
└────────┬───────────┴────────────────┬───────────────────────────┘
         │                            │
         │              ┌─────────────▼────────────────┐
         │              │  isGroupMessage ?             │
         │              │  jid.endsWith('@g.us')        │
         │              └──────┬───────────┬────────────┘
         │                     │ OUI       │ NON
         │              ┌──────▼──┐  ┌─────▼──────────────────┐
         │              │ AGENT   │  │   AGENT SAPPHIRE       │
         │              │OUTREACH │  │   (DM privé WhatsApp)  │
         │              └──────┬──┘  └─────┬──────────────────┘
         │                     │           │
         └─────────────────────▼───────────▼──────────────────────┐
                              lib/ai.ts                            │
                    Groq — llama-3.3-70b-versatile                 │
                    chatImmobilier() / chatImmobilierStream()       │
                              + getAIBienContext()                  │
                              + SYSTEM_PROMPT_IMMOBILIER_CI        │
                    ──────────────────────────────────────         │
                              Supabase                             │
                       biens · offres flash · whatsapp_messages     │
                       visites · agent_prospects · invite_logs      │
         ────────────────────────────────────────────────────────── │
                              Wasender API                         │
                       wasenderSendMessage() — réponses WA         │
         ──────────────────────────────────────────────────────────┘
```

---

## Agent 1 — Sapphire (assistant immobilier)

### Canaux

| Canal | Route | Méthode |
|-------|-------|---------|
| Chat du site | `POST /api/chat` | Streaming SSE (ReadableStream) |
| WhatsApp DM privé | `POST /api/whatsapp/webhook` | Webhook → réponse synchrone |

### Flux (DM WhatsApp)

```
1. Réception webhook Wasender
   → Vérification HMAC-SHA256 (x-webhook-signature)
   → Filtrage : fromMe=true → ignoré / groupe → branche Outreach

2. Opt-out check
   → Regex /^(stop|stopper|arrete|…)$/i
   → Si match → recordOptOut() + message de confirmation + EXIT

3. Sauvegarde message entrant
   → supabase.from('whatsapp_messages').insert({ direction: 'inbound' })

4. Historique (10 derniers messages du JID)
   → SELECT direction, body ORDER BY created_at DESC LIMIT 10
   → Formaté en ChatMessage[] (role: user|assistant)

5. Contexte immobilier
   → getAIBienContext(userMessage, history)
   → SELECT depuis 'biens' (max 5) + offres flash WhatsApp
   → Retourne bloc texte "[CATALOGUE BOGBE'S]" + "[OFFRE FLASH]"

6. Enrichissement RDV (si intent détecté)
   → detectVisiteIntent() → regex visite/rdv/disponible/jours de semaine
   → extractDateFromMessage() → regex date/jour
   → Injection INSTRUCTION RDV dans le contexte Groq

7. Appel Groq
   → chatImmobilier(history, enrichedContext)
   → Model : llama-3.3-70b-versatile
   → Temperature : 0.3 / max_tokens : 800

8. Traitement réponse IA
   → detectRdvConfirmation() → parse tag [RDV_CONFIRME bien_id=X date=Y]
   → Si bien BOGBE'S (UUID) → INSERT into visites (statut: en_attente)
   → Si offre flash (numérique) → wasenderSendMessage(conseiller, notif)
   → extractMediaTags() → parse balises [MEDIA: https://…]
   → Nettoyage des tags RDV de la réponse visible

9. Envoi réponse
   → wasenderSendMessage(senderPn, cleanText, 'text')
   → Pour chaque URL média (max 3) : wasenderSendMessage(senderPn, '', 'image'|'video', url)

10. Sauvegarde réponse sortante
    → supabase.from('whatsapp_messages').insert({ direction: 'outbound' })
```

### Flux (Chat du site)

```
1. POST /api/chat avec body { messages: ChatMessage[], context?: string }
2. getAIBienContext() pour enrichir avec le catalogue
3. chatImmobilierStream() → Groq API avec stream: true
4. ReadableStream retourné directement au client (SSE)
   → Le composant ChatWidget consomme le stream token par token
```

### Détection RDV

Quand le client confirme une visite, Sapphire émet un tag machine-readable :

```
[RDV_CONFIRME bien_id=<UUID|numeric_id> date=<texte_ou_date>]
```

- **UUID (bien BOGBE'S)** → INSERT direct dans `visites` (statut: `en_attente`, source: `whatsapp`)
- **ID numérique (offre flash)** → Notification WhatsApp au conseiller humain (`SAPPHIRE_ADVISOR_PHONE`)

---

## Agent 2 — Outreach (recrutement agents)

### Déclencheur

Message reçu dans un **groupe WhatsApp public** (`jid.endsWith('@g.us')`).

L'agent écoute silencieusement. Il ne répond **jamais** dans le groupe.

### Flux

```
1. Extraction d'annonce
   → extractBienFromWhatsApp(userMessage) — lib/extractors/whatsapp-bien-extractor.ts
   → Groq (Zod-validated JSON) : type_bien, commune, prix, confidence (0-1)
   → Si confidence < 0.7 → abandonné silencieusement

2. Upsert prospect
   → upsertProspect({ phone, jid, displayName, sourceGroupJid, extraction })
   → Table : agent_prospects (upsert par numéro de téléphone)
   → Champs : display_name, last_extraction, source_group_jid, opt_out_at

3. Invitation DM privé
   → shouldInvite(prospect) → cooldown 72h + quota max invites + opt_out check
   → buildInviteMessage() → message personnalisé avec le type de bien et la commune
   → Token unique (randomBytes 16) → lien /invite/<token>
   → wasenderSendMessage(prospect.phone, message, 'text')
   → logInviteSent() → table invite_logs (status: sent|failed)
```

### Règles de déclenchement invitation

| Condition | Résultat |
|-----------|---------|
| prospect.opt_out_at IS NOT NULL | Bloqué |
| Dernière invite < 72h | Bloqué |
| Quota maximal atteint | Bloqué |
| Confidence extraction < 0.7 | Pas d'upsert |

---

## Contexte immobilier — getAIBienContext()

**Fichier :** `lib/ai/tools.ts`

```
Entrée : userMessage + historique conversation

→ Recherche commune dans le message (+ historique) via liste hardcodée CI
→ Recherche type de bien (villa/appartement/studio/…)
→ SELECT depuis 'biens' filtré par commune+type (max 5, score_ia DESC)
→ SELECT depuis table offres flash WhatsApp scrapées (max 3)

Sortie : bloc texte structuré injecté dans le system prompt Groq :
  [CATALOGUE BOGBE'S]
  ID: xxx | Type: Villa | Commune: Cocody | Quartier: Riviera | ...
  Photos: https://...

  [OFFRE FLASH WhatsApp]
  ID: 4521 | Type: Appartement | Commune: Cocody | ...
```

---

## Variables d'environnement requises

| Variable | Usage |
|----------|-------|
| `GROQ_API_KEY` | Authentification Groq API |
| `GROQ_MODEL` | Modèle LLM (défaut: `llama-3.3-70b-versatile`) |
| `WASSENDER_API_KEY` | Envoi messages WhatsApp via Wasender |
| `WASSENDER_WEBHOOK_SECRET` | Vérification HMAC des webhooks entrants |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Accès admin Supabase (webhook) |
| `NEXT_PUBLIC_SITE_URL` | URL du site (liens dans les messages Sapphire) |
| `SAPPHIRE_ADVISOR_PHONE` | Numéro conseiller humain (escalade offres flash) |

---

## Configuration Wasender webhook

**URL à configurer dans le dashboard Wasender :**

```
https://bogbes-groupe.vercel.app/api/whatsapp/webhook
```

**Événements à activer :**
- `messages.received`
- `messages.upsert`

---

## Tables Supabase impliquées

| Table | Rôle |
|-------|------|
| `biens` | Catalogue principal des propriétés BOGBE'S |
| `whatsapp_messages` | Historique conversations WA (inbound / outbound / system) |
| `visites` | RDV confirmés via Sapphire (source: whatsapp) |
| `agent_prospects` | Agents repérés dans les groupes WA (Outreach) |
| `invite_logs` | Traçabilité des invitations envoyées |

---

## Fichiers clés

```
apps/web/
├── app/api/
│   ├── chat/route.ts                          # Chat site (streaming SSE)
│   └── whatsapp/webhook/route.ts              # Webhook Wasender (DM + groupes)
└── lib/
    ├── ai.ts                                  # Groq client + system prompts
    ├── ai/
    │   ├── tools.ts                           # getAIBienContext()
    │   └── whatsapp-bot.ts                    # Helpers WA
    ├── wasender.ts                            # Client Wasender API
    ├── extractors/
    │   └── whatsapp-bien-extractor.ts         # Extraction annonces (Outreach)
    └── outreach/
        ├── agent-prospects.ts                 # Upsert / shouldInvite / logInviteSent
        └── dispatch.ts                        # tryInviteProspect + buildInviteMessage
```
