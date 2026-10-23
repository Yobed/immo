/**
 * Client d'orchestration n8n — BOGBE'S GROUPE Platform
 * Gère la communication avec l'instance n8n v2.44.5 hébergée sur Hugging Face Spaces.
 */

function sanitizeUrl(raw: string | undefined, defaultUrl: string): string {
  if (!raw) return defaultUrl;
  const clean = raw.trim().replace(/^["']|["']$/g, '').trim();
  try {
    const url = new URL(clean);
    return url.origin;
  } catch {
    return defaultUrl;
  }
}

export const N8N_BASE_URL = sanitizeUrl(
  process.env.N8N_BASE_URL,
  'https://kassio1-n8n-free.hf.space'
);

export const N8N_SCRAPER_URL =
  process.env.N8N_SCRAPER_WEBHOOK_URL?.trim().replace(/^["']|["']$/g, '') ||
  `${N8N_BASE_URL}/webhook/wassender-immobilier`;

export const N8N_FALLBACK_URL =
  process.env.N8N_WHATSAPP_FALLBACK_URL?.trim().replace(/^["']|["']$/g, '') ||
  process.env.WHATSAPP_FALLBACK_WEBHOOK_URL?.trim().replace(/^["']|["']$/g, '') ||
  `${N8N_BASE_URL}/webhook/whatsapp-fallback`;

export interface N8nHealthCheckResult {
  ok: boolean;
  status: number | null;
  latencyMs: number;
  message: string;
  wokenUp?: boolean;
}

/**
 * Sonde l'état de santé de n8n et réveille le conteneur Hugging Face s'il est en veille (cold start).
 */
export async function checkN8nHealth(timeoutMs = 8000): Promise<N8nHealthCheckResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${N8N_BASE_URL}/healthz`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    const latencyMs = Date.now() - start;

    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        latencyMs,
        message: `n8n v2.44.5 actif (${latencyMs}ms)`,
        wokenUp: latencyMs > 2500, // Une latence > 2.5s indique souvent la sortie de veille du conteneur
      };
    }

    return {
      ok: false,
      status: res.status,
      latencyMs,
      message: `n8n a répondu avec le statut HTTP ${res.status}`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const isTimeout = err?.name === 'AbortError';
    return {
      ok: false,
      status: null,
      latencyMs,
      message: isTimeout
        ? `Délai d'attente dépassé (${timeoutMs}ms) — conteneur en cours de réveil ou inaccessible`
        : (err?.message || 'Erreur réseau vers n8n'),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Envoie une notification de secours à n8n pour transmission multi-canal
 * (Telegram, SMS, Email, Meta Cloud API) lorsque Wasender est indisponible.
 */
export async function forwardToN8nFallback(payload: {
  to: string;
  content: string;
  type?: string;
  mediaUrl?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; message: string; httpStatus?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(N8N_FALLBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'bogbes-platform',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    if (res.ok) {
      return {
        success: true,
        message: 'Notification relayée avec succès vers n8n',
        httpStatus: res.status,
      };
    }

    return {
      success: false,
      message: `n8n fallback webhook a répondu avec HTTP ${res.status}`,
      httpStatus: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Erreur réseau vers n8n fallback',
    };
  } finally {
    clearTimeout(timer);
  }
}
