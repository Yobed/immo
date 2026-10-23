// apps/web/lib/wasender.ts
import { createHmac, timingSafeEqual } from 'node:crypto'
import { logError } from '@/lib/error-logger'
import { forwardToN8nFallback } from '@/lib/n8n/client'

/**
 * Wasender API Client — BOGBE'S GROUPE Platform
 * Intégration pour la gestion intelligente des messages WhatsApp
 */

/**
 * Nettoie une valeur d'env des caractères invisibles (BOM, sauts de ligne,
 * espaces, zero-width chars) qui peuvent s'incruster lors d'un copier-coller
 * depuis le dashboard Vercel ou Wasender. Garde uniquement les caractères
 * ASCII imprimables.
 */
function sanitizeEnv(raw: string | undefined): string {
  if (!raw) return '';
  // eslint-disable-next-line no-control-regex
  const trimmed = raw.trim();
  const unquoted = trimmed.replace(/^("|')(.*)\1$/, '$2');
  return unquoted.replace(/[^!-~]/g, '');
}

const FALLBACK_GATEWAY_URL = 'https://bogbes-whatsapp-gateway.onrender.com';
const FALLBACK_API_KEY = 'bogbes_secret_key_2026';
const FALLBACK_WEBHOOK_SECRET = 'a8271744c3bba421d49850cd785ff068';

const WASSENDER_API_KEY =
  sanitizeEnv(process.env.WHATSAPP_API_KEY || process.env.WASSENDER_API_KEY) || FALLBACK_API_KEY;
const WASSENDER_WEBHOOK_SECRET =
  sanitizeEnv(process.env.WHATSAPP_WEBHOOK_SECRET || process.env.WASSENDER_WEBHOOK_SECRET) ||
  FALLBACK_WEBHOOK_SECRET;
const BASE_URL =
  sanitizeEnv(process.env.WHATSAPP_GATEWAY_URL) || FALLBACK_GATEWAY_URL;

export type WasenderMessageType = 'text' | 'image' | 'video' | 'document' | 'audio';

export interface WasenderSendResponse {
  /** true si l'API ou le fallback a accepté l'envoi */
  success: boolean;
  message?: string;
  data?: {
    msgId?: number;
    jid?: string;
    messageId?: string;
    id?: string;
    status?: string;
    [key: string]: any;
  };
  httpStatus?: number;
  isSubscriptionPastDue?: boolean;
  isLoggedOut?: boolean;
  fallbackUsed?: boolean;
}

export interface WasenderStatusResult {
  connected: boolean;
  status: 'connected' | 'logged_out' | 'past_due' | 'unauthorized' | 'error' | 'unconfigured';
  message: string;
  raw?: any;
}

/**
 * Enregistrement throttlé des coupures Wasender dans error_logs (1 par tranche de 10 min)
 */
let lastOutageLoggedAt = 0;
async function reportWasenderOutage(reason: string, status: number, details?: any): Promise<void> {
  const now = Date.now();
  if (now - lastOutageLoggedAt < 10 * 60 * 1000) return;
  lastOutageLoggedAt = now;

  try {
    await logError(`[WASENDER OUTAGE] ${reason}`, {
      source: 'wasender',
      route: '/lib/wasender',
      level: 'error',
      extra: {
        reason,
        httpStatus: status,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Wasender] Failed to report outage to error_logs:', e);
  }
}

/**
 * Relai de secours vers n8n v2.44.5 ou service tiers si Wasender échoue
 */
async function dispatchFallbackWebhook(payload: {
  to: string;
  content: string;
  type: WasenderMessageType;
  mediaUrl?: string;
  reason: string;
}): Promise<WasenderSendResponse | null> {
  try {
    const res = await forwardToN8nFallback({
      to: payload.to,
      content: payload.content,
      type: payload.type,
      mediaUrl: payload.mediaUrl,
      reason: payload.reason,
    });
    if (res.success) {
      // eslint-disable-next-line no-console
      console.log(`[Wasender Failover] Message relayed to ${payload.to} via n8n fallback`);
      return {
        success: true,
        fallbackUsed: true,
        message: 'Message transmis via passerelle de secours n8n/webhook',
        data: {
          status: 'relayed',
          msgId: Date.now(),
        },
      };
    }
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[Wasender Failover] Webhook fallback failed:', e.message);
  }
  return null;
}

/**
 * Vérifie la signature du webhook Wasender.
 */
export function verifyWasenderSignature(payload: string, signature: string): boolean {
  if (!WASSENDER_WEBHOOK_SECRET || !signature) return false;

  const cleanSig = signature.trim();
  const directSig = cleanSig.replace(/^secret=/i, '').trim();
  const hmacSig = cleanSig.replace(/^sha256=/i, '').trim();

  const constantTimeEqual = (expectedValue: string, receivedValue: string) => {
    const expected = Buffer.from(expectedValue, 'utf8');
    const received = Buffer.from(receivedValue, 'utf8');
    return expected.length === received.length && timingSafeEqual(expected, received);
  };

  if (constantTimeEqual(WASSENDER_WEBHOOK_SECRET, directSig)) return true;

  const expectedHmac = createHmac('sha256', WASSENDER_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  if (constantTimeEqual(expectedHmac, hmacSig)) return true;

  // eslint-disable-next-line no-console
  console.warn(
    `[Wasender] signature mismatch — received=${cleanSig.slice(0, 8)}... expected_secret_length=${WASSENDER_WEBHOOK_SECRET.length}`
  );
  return false;
}

/**
 * Helper interne pour les appels API Wasender
 */
async function wasenderFetch(endpoint: string, options: RequestInit = {}): Promise<WasenderSendResponse> {
  if (!WASSENDER_API_KEY) {
    // eslint-disable-next-line no-console
    console.error('[Wasender] WASSENDER_API_KEY not configured');
    return { success: false, message: 'WASSENDER_API_KEY not configured' };
  }
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const headers = {
    'Authorization': `Bearer ${WASSENDER_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    // Détection immédiate d'un problème de facturation / abonnement expiré (erreur 402)
    const isPastDue = response.status === 402 || /past due|subscription/i.test(data?.message || '');
    if (isPastDue) {
      // eslint-disable-next-line no-console
      console.error(`[Wasender] 402 Subscription past due [${endpoint}]:`, data);
      await reportWasenderOutage('Abonnement Wasender expiré (402 Payment Required)', 402, data);
      return {
        success: false,
        httpStatus: 402,
        isSubscriptionPastDue: true,
        message: data?.message || 'Abonnement Wasender expiré, paiement requis (402)',
        data,
      };
    }

    if (response.status === 401) {
      // eslint-disable-next-line no-console
      console.error(`[Wasender] 401 Unauthorized [${endpoint}]:`, data);
      await reportWasenderOutage('Clé API Wasender non autorisée (401)', 401, data);
      return {
        success: false,
        httpStatus: 401,
        message: data?.message || 'WASSENDER_API_KEY non valide ou non autorisée (401)',
        data,
      };
    }

    const isRateLimited = (resp: Response, payload: any) => {
      const msg = typeof payload?.message === 'string' ? payload.message : '';
      return resp.status === 429 || /5 seconds|protection enabled|rate limit/i.test(msg);
    };

    if (!response.ok || (data && data.success === false && isRateLimited(response, data))) {
      if (isRateLimited(response, data)) {
        // eslint-disable-next-line no-console
        console.warn(`[Wasender] Rate limit / account protection (1 msg / 5s) hit on [${endpoint}]. Waiting 5.5s before retry...`);
        await new Promise((r) => setTimeout(r, 5500));
        const retryResp = await fetch(url, { ...options, headers });
        const retryData = await retryResp.json().catch(() => ({}));
        if (!retryResp.ok) {
          // eslint-disable-next-line no-console
          console.error(`Wasender API Error after retry [${endpoint}]:`, retryData);
          return {
            success: false,
            httpStatus: retryResp.status,
            message: retryData.message || 'API Error after retry',
            data: retryData,
          };
        }
        if (typeof retryData.success === 'undefined') {
          retryData.success = true;
        }
        return {
          ...retryData,
          httpStatus: retryResp.status,
        };
      }

      // eslint-disable-next-line no-console
      console.error(`Wasender API Error [${endpoint}]:`, data);
      return {
        success: false,
        httpStatus: response.status,
        message: data.message || 'API Error',
        data,
      };
    }

    if (typeof data.success === 'undefined') {
      data.success = true;
    }
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error(`Wasender Network Error [${endpoint}]:`, err);
    return { success: false, message: err.message };
  }
}

/**
 * Envoie un message texte simple ou avec média
 */
export async function wasenderSendMessage(
  to: string, 
  content: string, 
  type: WasenderMessageType = 'text',
  mediaUrl?: string
): Promise<WasenderSendResponse> {
  const cleanTo = to.includes('@') ? to : (to.startsWith('+') ? to : `+${to.replace(/\D/g, '')}`);

  const payload: any = {
    to: cleanTo,
    text: content,
  };

  if (type === 'image' && mediaUrl) {
    payload.imageUrl = mediaUrl;
  } else if (type === 'video' && mediaUrl) {
    payload.videoUrl = mediaUrl;
  } else if (type === 'document' && mediaUrl) {
    payload.documentUrl = mediaUrl;
  } else if (type === 'audio' && mediaUrl) {
    payload.audioUrl = mediaUrl;
  }

  const result = await wasenderFetch('/send-message', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!result.success) {
    // Tenter immédiatement le transport de secours si configuré
    const fallbackResult = await dispatchFallbackWebhook({
      to: cleanTo,
      content,
      type,
      mediaUrl,
      reason: result.isSubscriptionPastDue ? 'subscription_past_due' : (result.message || 'wasender_error'),
    });

    if (fallbackResult && fallbackResult.success) {
      // eslint-disable-next-line no-console
      console.log(`[Wasender] Send to ${cleanTo}: SUCCESS (via Fallback Webhook)`);
      return fallbackResult;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[Wasender] Send to ${cleanTo}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  return result;
}

/**
 * Déchiffre un fichier média reçu via WhatsApp
 */
export async function wasenderDecryptMedia(mediaData: any) {
  return wasenderFetch('/decrypt-media', {
    method: 'POST',
    body: JSON.stringify(mediaData),
  });
}

/**
 * Vérifie si un numéro est sur WhatsApp
 */
export async function wasenderCheckNumber(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  return wasenderFetch(`/on-whatsapp/${cleanPhone}`);
}

/**
 * Récupère le statut de connexion et de facturation de l'instance Wasender
 */
export async function wasenderGetStatus(): Promise<WasenderStatusResult> {
  if (!WASSENDER_API_KEY) {
    return {
      connected: false,
      status: 'unconfigured',
      message: 'WASSENDER_API_KEY non configuré',
    };
  }

  try {
    const url = `${BASE_URL}/status`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${WASSENDER_API_KEY}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 402 || /past due|subscription/i.test(data?.message || '')) {
      await reportWasenderOutage('Abonnement Wasender expiré (402 Payment Required)', 402, data);
      return {
        connected: false,
        status: 'past_due',
        message: data?.message || 'Abonnement Wasender expiré, paiement requis (402)',
        raw: data,
      };
    }

    if (res.status === 401) {
      return {
        connected: false,
        status: 'unauthorized',
        message: 'Clé API Wasender non autorisée (401)',
        raw: data,
      };
    }

    const rawStatus = String(data?.status || '').toLowerCase();
    const isConnected = rawStatus === 'connected' || rawStatus === 'authenticated' || rawStatus === 'open';

    return {
      connected: isConnected,
      status: isConnected
        ? 'connected'
        : (rawStatus === 'logged_out' ? 'logged_out' : 'error'),
      message: isConnected
        ? 'Connecté'
        : (rawStatus === 'logged_out' ? 'Session WhatsApp déconnectée' : data?.message || 'Déconnecté'),
      raw: data,
    };
  } catch (err: any) {
    return {
      connected: false,
      status: 'error',
      message: err?.message || 'Erreur réseau Wasender',
    };
  }
}
