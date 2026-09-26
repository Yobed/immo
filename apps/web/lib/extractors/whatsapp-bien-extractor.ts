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

Communes courantes d'Abidjan : Cocody, Marcory, Yopougon, Treichville, Plateau, Adjamé, Abobo, Port-Bouet, Koumassi, Attécoubé, Bingerville, Songon, Anyama, Riviera (= quartier de Cocody), 2 Plateaux (= quartier de Cocody), Angré (= quartier de Cocody), Zone 4 (= quartier de Marcory).
Hors Abidjan : Bassam (Grand-Bassam), Bonoua, Assinie, Adiaké, Aboisso, Jacqueville, Dabou, Azaguié, Alepe, Agboville, Adzopé, Sikensi, Tiassalé, Grand-Lahou, Yamoussoukro, Bouaké, San-Pédro, Daloa, Korhogo, Man, Gagnoa, Divo, Abengourou, Soubré, Sassandra, Bondoukou, Odienné, Toumodi, Dimbokro.

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

/**
 * Paid models only, ordered by cost and latency. The free pool can return
 * 404/429 when a provider is unavailable, which used to make WhatsApp imports
 * stop even though the API key was valid.
 */
export const DEFAULT_OPENROUTER_MODELS = [
  'qwen/qwen3.7-flash',
  'qwen/qwen3.5-9b',
  'deepseek/deepseek-v4-flash-0731',
] as const

export const DEFAULT_OPENROUTER_TIMEOUT_MS = 12_000

/**
 * Allows a deployment to tune the chain without rebuilding the application.
 * Empty values and duplicates are removed; an empty override falls back to
 * the safe defaults above.
 */
export function getOpenRouterModels(): readonly string[] {
  const configured = (process.env.OPENROUTER_EXTRACTOR_MODELS ?? '')
    .split(',')
    .map((model) => model.trim())
    .filter((model) => model.length > 0 && !model.endsWith(':free'))

  return configured.length > 0
    ? [...new Set(configured)]
    : DEFAULT_OPENROUTER_MODELS
}

export function getOpenRouterTimeoutMs(): number {
  const configured = Number(process.env.OPENROUTER_EXTRACTOR_TIMEOUT_MS)
  return Number.isFinite(configured) && configured >= 1_000 && configured <= 30_000
    ? Math.floor(configured)
    : DEFAULT_OPENROUTER_TIMEOUT_MS
}

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
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), getOpenRouterTimeoutMs())
  let res: Response
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://www.bogbesgroup.com',
        'X-Title': "BOGBE'S GROUPE Tally Webhook",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 450,
        response_format: { type: 'json_object' },
      }),
    })
  } finally {
    clearTimeout(timeout)
  }

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

const CLIENT_SEARCH_RE =
  /\b(je\s+cherche|je\s+recherche|je\s+suis\s+[àa]\s+la\s+recherche|nous\s+cherchons|besoin\s+d['’]un|op[ée]rateur\s+qui\s+cherche|op[ée]rateur\s+recherche|mon\s+client\s+direct\s+a\s+besoin|j['’]ai\s+besoin\s+d['’]une)\b/i

const COMMUNES_FALLBACK: Array<[string, RegExp]> = [
  ['Cocody', /\b(cocody|riviera|angr[ée]|2\s*plateaux|deux\s*plateaux|bonoumin|faya|abatta|palmeraie|danga|ambassade|vallon|m'badon|mbadon|mpouto|anono|attoban|djibi|djorogobit[ée])\b/i],
  ['Yopougon', /\b(yopougon|yop\b|niangon|kowe[ïi]t|lokoa|sopim|mami\s*adjoua|cit[ée]\s*verte)\b/i],
  ['Marcory', /\b(marcory|zone\s*4|orca\s*d[ée]co|bi[ée]try|bietry|remblais)\b/i],
  ['Koumassi', /\b(koumassi)\b/i],
  ['Bingerville', /\b(bingerville|feh\s*kess[ée]|elokato)\b/i],
  ['Grand-Bassam', /\b(bassam|grand[- ]bassam|mondoukou|motob[ée])\b/i],
  ['Assinie', /\b(assinie|assouind[ée])\b/i],
  ['Songon', /\b(songon|km\s*17)\b/i],
  ['Abobo', /\b(abobo|pk\s*18)\b/i],
  ['Port-Bouet', /\b(port[- ]bou[ëe]t|gonzagueville|vridi)\b/i],
  ['Plateau', /\b(plateau)\b/i],
  ['Treichville', /\b(treichville)\b/i],
  ['Yamoussoukro', /\b(yamoussoukro)\b/i],
  ['Jacqueville', /\b(jacqueville|jaqueville)\b/i],
  ['Agboville', /\b(agboville)\b/i],
  ['Abidjan', /\b(abidjan|ile\s*boulay|île\s*boulay|autoroute\s*du\s*nord|pk\s*\d+)\b/i],
]

const QUARTIERS_FALLBACK_RE =
  /\b(Riviera\s*\d?|Riviera\s*Faya|Riviera\s*Palmeraie|Riviera\s*Bonoumin|Riviera\s*Golf\s*\d?|Riviera\s*M'badon|Angr[ée]\s*CHU|Angr[ée]\s*Ch[âa]teau|Angr[ée]\s*\d+e?\s*tranche|2\s*Plateaux\s*Vallon|2\s*Plateaux|Zone\s*4|Niangon|Kowe[ïi]t|Lokoa|Abatta|Danga|Ambassades|Feh\s*Kess[ée]|Cit[ée]\s*Verte)\b/i

export function extractBienDeterministic(rawMessage: string): ExtractedBien | null {
  if (!rawMessage || rawMessage.length < 40) return null
  if (CLIENT_SEARCH_RE.test(rawMessage)) return null

  const isVente =
    /\b(à\s*vendre|a\s*vendre|en\s*vente|mise?\s*en\s*vente|vente\s+d)\b/i.test(rawMessage) &&
    !/\b(à\s*louer|a\s*louer|loue\s*:|loyer)\b/i.test(rawMessage)
  const isLocation = /\b(à\s*louer|a\s*louer|loue\s*:|location|loyer)\b/i.test(rawMessage)
  if (!isVente && !isLocation) return null

  let type_bien: ExtractedBien['type_bien'] | null = null
  if (/\b(villa|duplex|triplex)\b/i.test(rawMessage)) type_bien = 'villa'
  else if (/\b(appartement|appart)\b/i.test(rawMessage) || /\b[2345]\s*pi[èe]ces\b/i.test(rawMessage)) type_bien = 'appartement'
  else if (/\b(studio)\b/i.test(rawMessage)) type_bien = 'studio'
  else if (/\b(magasin|entrep[ôo]t|chambre\s*froide|local|boutique|usine)\b/i.test(rawMessage)) type_bien = 'commerce'
  else if (/\b(bureau)\b/i.test(rawMessage)) type_bien = 'bureau'
  else if (/\b(terrain|parcelle|hectares?|\bha\b|lot\s+de)\b/i.test(rawMessage)) type_bien = 'terrain'
  else if (/\b(maison)\b/i.test(rawMessage)) type_bien = 'maison'

  if (!type_bien) return null

  let commune = ''
  for (const [name, rx] of COMMUNES_FALLBACK) {
    if (rx.test(rawMessage)) {
      commune = name
      break
    }
  }
  if (!commune) return null

  const qMatch = rawMessage.match(QUARTIERS_FALLBACK_RE)
  const quartier = qMatch?.[1]?.trim() || null

  let surface_m2: number | null = null
  const surfM2 = rawMessage.match(/(\d[\d\s.]*)\s*(?:m²|m2)\b/i)
  const surfHa = rawMessage.match(/(\d+(?:[.,]\d+)?)\s*(?:hectares?|ha)\b/i)
  if (surfM2?.[1]) {
    const n = parseInt(surfM2[1].replace(/[\s.]/g, ''), 10)
    if (n > 10 && n <= 100000) surface_m2 = n
  } else if (surfHa?.[1]) {
    const n = parseFloat(surfHa[1].replace(',', '.'))
    if (n > 0 && n <= 10) surface_m2 = Math.round(n * 10000)
  }

  const pMatch = rawMessage.match(/\b(\d{1,2})\s*(?:pi[èe]ces?|chambres?)\b/i)
  const nb_pieces = pMatch?.[1] ? parseInt(pMatch[1], 10) : null

  let prixNum: number | null = null
  const loyerMatch = rawMessage.match(/(?:loyer|prix(?:\s*du\s*loyer)?)\s*[:=-]?\s*(\d+(?:[.\s]\d{3})+|\d+\s*(?:millions?|mils?|milles?))/i)
  const rawPriceTarget = loyerMatch?.[1] ? loyerMatch[1] : rawMessage
  const milMatch = rawPriceTarget.match(/(\d+(?:[.,]\d+)?)\s*millions?/i)
  const milsMatch = rawPriceTarget.match(/(\d{2,4})\s*(?:mils?|milles?)\b/i)
  const dotNumMatch =
    rawPriceTarget.match(/\b(\d{1,3}(?:[.\s]\d{3}){1,3})\s*(?:fcfa|f\s*cfa|fr\b|f\b)/i) ||
    rawMessage.match(/\b(\d{1,3}(?:\.\d{3}){1,3})\b/)

  if (milMatch?.[1]) {
    prixNum = Math.round(parseFloat(milMatch[1].replace(',', '.')) * 1_000_000)
  } else if (milsMatch?.[1]) {
    prixNum = parseInt(milsMatch[1], 10) * 1000
  } else if (dotNumMatch?.[1]) {
    const v = parseInt(dotNumMatch[1].replace(/[.\s]/g, ''), 10)
    if (v >= 15000) prixNum = v
  }

  const equipements: string[] = []
  if (/\b(meubl[ée]e?)\b/i.test(rawMessage)) equipements.push('meuble')
  if (/\b(piscine)\b/i.test(rawMessage)) equipements.push('piscine')
  if (/\b(jardin)\b/i.test(rawMessage)) equipements.push('jardin')
  if (/\b(garage|parking)\b/i.test(rawMessage)) equipements.push('parking')

  const cleanDesc = rawMessage.replace(/\s+/g, ' ').trim().slice(0, 1500)
  const titre = `${type_bien.charAt(0).toUpperCase() + type_bien.slice(1)}${nb_pieces ? ` ${nb_pieces} pièces` : ''} ${commune}${quartier ? ` ${quartier}` : ''}`.slice(0, 180)

  return {
    titre,
    type_bien,
    commune,
    quartier,
    description: cleanDesc,
    surface_m2,
    nb_pieces,
    nb_chambres: nb_pieces,
    nb_salles_bain: null,
    prix_mois_fcfa: isVente ? null : prixNum,
    prix_nuit_fcfa: null,
    prix_vente_fcfa: isVente ? prixNum : null,
    equipements,
    confidence: 0.75,
  }
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

  for (const model of getOpenRouterModels()) {
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

