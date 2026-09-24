const FORWARD_TIMEOUT_MS = 15_000

/**
 * Regex identifying property keywords, listing terms, or real-estate vocabulary
 * common in Côte d'Ivoire WhatsApp groups.
 */
const PROPERTY_SIGNAL_REGEX = new RegExp(
  [
    /\b(villas?|studios?|appartements?|apparts?|duplex|triplex|terrains?|magasins?|bureaux?|immeubles?|entrep[ôo]ts?|r\+\d|pi[èe]ces?|chambres?|lots?|hectares?)\b/.source,
    /\b([àa]\s+(louer|vendre)|mise\s+en\s+(location|vente)|disponibles?|dispo)\b/.source,
    /\b(caution|avances?|loyers?|superficie|m²|m2|titre\s+foncier|\btf\b|\bacd\b|loti[es]?|morcelable|documents?)\b/.source,
    /\b(direct\s+propri[ée]taire|mandataire|d[ée]marcheur|visite\s+sur\s+rdv)\b/.source,
    /\d[\d\s.,]*\s*(fcfa|f\s?cfa|millions?|milles?)\b/.source,
  ].join('|'),
  'i',
)

/**
 * Only the canonical group event may enter the n8n property importer.
 * If text is provided, also filters out noise/chatter (greetings, stickers, conversations).
 */
export function shouldForwardGroupMessageToScraper(
  event: string,
  remoteJid: string | undefined,
  fromMe: boolean | undefined,
  text?: string | null,
): boolean {
  const isEligibleGroupEvent = (event === 'messages-group.received' || event === 'messages.received')
    && remoteJid?.endsWith('@g.us') === true
    && fromMe !== true

  if (!isEligibleGroupEvent) return false

  // If text is provided, enforce a lightweight relevance check to prevent flooding n8n
  if (text !== undefined && text !== null) {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length < 15) return false
    return PROPERTY_SIGNAL_REGEX.test(trimmed)
  }

  return true
}

/** Reject malformed or insecure destinations before sending WhatsApp data. */
export function getN8nScraperWebhookUrl(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw.trim())
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export async function forwardGroupMessageToScraper(
  targetUrl: string,
  payload: unknown,
): Promise<{ ok: boolean; status: number | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS)
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return { ok: response.ok, status: response.status }
  } catch {
    return { ok: false, status: null }
  } finally {
    clearTimeout(timer)
  }
}
