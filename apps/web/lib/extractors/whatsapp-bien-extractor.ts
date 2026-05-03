import { z } from 'zod'

const TYPE_BIEN = ['studio', 'appartement', 'villa', 'maison', 'bureau', 'commerce', 'terrain', 'residence_meublee'] as const

export const ExtractedBienSchema = z.object({
  titre: z.string().min(3).max(200),
  type_bien: z.enum(TYPE_BIEN),
  commune: z.string().min(2).max(80),
  quartier: z.string().max(120).nullable(),
  description: z.string().max(2000),
  surface_m2: z.number().int().positive().max(100000).nullable(),
  nb_pieces: z.number().int().min(0).max(50).nullable(),
  nb_chambres: z.number().int().min(0).max(50).nullable(),
  nb_salles_bain: z.number().int().min(0).max(50).nullable(),
  prix_mois_fcfa: z.number().int().positive().max(100_000_000).nullable(),
  prix_nuit_fcfa: z.number().int().positive().max(10_000_000).nullable(),
  prix_vente_fcfa: z.number().int().positive().max(100_000_000_000).nullable(),
  equipements: z.array(z.string()).max(40),
  confidence: z.number().min(0).max(1),
})

export type ExtractedBien = z.infer<typeof ExtractedBienSchema>

const SYSTEM_PROMPT = `Tu es un parseur d'annonces immobilières WhatsApp pour la Côte d'Ivoire.
Réponds UNIQUEMENT avec un objet JSON conforme au schema ci-dessous, sans texte autour, sans markdown, sans \`\`\`.

Communes courantes d'Abidjan : Cocody, Marcory, Yopougon, Treichville, Plateau, Adjamé, Abobo, Port-Bouët, Koumassi, Attécoubé, Bingerville, Songon, Anyama, Riviera (= quartier de Cocody), 2 Plateaux (= quartier de Cocody), Angré (= quartier de Cocody), Zone 4 (= quartier de Marcory).
Hors Abidjan : Bassam (Grand-Bassam), Bouaké, Yamoussoukro, San-Pedro, Assinie.

Si une commune n'est pas reconnue, mets-la quand même dans "commune". Si un sous-quartier est mentionné (Riviera Bonoumin, 2 Plateaux ENA, etc), mets le quartier dans "quartier" et la commune mère dans "commune".

Types possibles (type_bien) : "studio", "appartement", "villa", "maison", "bureau", "commerce", "terrain", "residence_meublee".
- "residence_meublee" = location courte durée (par nuit / Airbnb).
- Si meublé + location longue durée → "appartement" ou "villa" selon contexte.

Prix : convertis en FCFA entiers. "1.5M", "1,5M", "1500000" → 1500000. "150K" → 150000. Détecte la nature :
- "/mois", "loyer mensuel" → prix_mois_fcfa
- "/nuit", "par nuit" → prix_nuit_fcfa
- "à vendre", "prix de vente" → prix_vente_fcfa
Mets null pour les prix non applicables.

Équipements normalisés (utilise UNIQUEMENT ces valeurs) : climatisation, wifi, parking, gardien, groupe_electrogene, piscine, ascenseur, cuisine_equipee, jardin, terrasse, balcon, meuble, eau_chaude, securite_24h, video_surveillance.

Titre : génère un titre court et accrocheur (max 80 chars) à partir du type + nb chambres + commune. Ex : "Villa 4 chambres Cocody Riviera".

Description : reformule proprement le message brut en 2-4 phrases, sans répéter les champs structurés (prix, surface, etc).

confidence : score 0-1 indiquant à quel point tu es sûr de l'extraction. Si le texte est très court / ambigu / non-immobilier, descends sous 0.6.

Schema JSON exact (toutes les clés obligatoires, mets null pour les champs non détectés) :
{
  "titre": string,
  "type_bien": "studio"|"appartement"|"villa"|"maison"|"bureau"|"commerce"|"terrain"|"residence_meublee",
  "commune": string,
  "quartier": string|null,
  "description": string,
  "surface_m2": number|null,
  "nb_pieces": number|null,
  "nb_chambres": number|null,
  "nb_salles_bain": number|null,
  "prix_mois_fcfa": number|null,
  "prix_nuit_fcfa": number|null,
  "prix_vente_fcfa": number|null,
  "equipements": string[],
  "confidence": number
}`

const FREE_MODELS = [
  'openai/gpt-oss-120b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-3-27b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
] as const

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[]
): Promise<string | null> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://immo-sigma.vercel.app',
      'X-Title': "BOGBE'S GROUPE Tally Webhook",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`http_${res.status}:${errBody.slice(0, 100)}`)
  }
  const data = (await res.json()) as OpenRouterResponse
  return data.choices?.[0]?.message?.content?.trim() ?? null
}

export interface ExtractionResult {
  data: ExtractedBien | null
  trace: string[]
}

export async function extractBienFromWhatsApp(rawMessage: string): Promise<ExtractionResult> {
  const trace: string[] = []
  const rawKey = process.env.OPENROUTER_API_KEY ?? ''
  const apiKey = rawKey.replace(/[\s﻿​]+/g, '')
  if (!apiKey) {
    trace.push('NO_API_KEY')
    return { data: null, trace }
  }
  trace.push(`key_len=${apiKey.length}`)

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Annonce brute :\n\n${rawMessage}` },
  ]

  for (const model of FREE_MODELS) {
    let text: string | null = null
    try {
      text = await callOpenRouter(apiKey, model, messages)
    } catch (e) {
      trace.push(`${model}:throw:${(e as Error).message?.slice(0, 80)}`)
      continue
    }
    if (!text) {
      trace.push(`${model}:empty`)
      continue
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      trace.push(`${model}:no_json`)
      continue
    }
    try {
      const parsed = JSON.parse(jsonMatch[0])
      const validated = ExtractedBienSchema.parse(parsed)
      trace.push(`${model}:ok`)
      return { data: validated, trace }
    } catch (e) {
      trace.push(`${model}:parse_fail:${(e as Error).message?.slice(0, 60)}`)
      continue
    }
  }
  return { data: null, trace }
}
