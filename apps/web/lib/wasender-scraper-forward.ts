const FORWARD_TIMEOUT_MS = 15_000

/** Only the canonical group event may enter the n8n property importer. */
export function shouldForwardGroupMessageToScraper(
  event: string,
  remoteJid: string | undefined,
  fromMe: boolean | undefined,
): boolean {
  return (event === 'messages-group.received' || event === 'messages.received')
    && remoteJid?.endsWith('@g.us') === true
    && fromMe !== true
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
