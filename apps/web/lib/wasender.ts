// apps/web/lib/wasender.ts
/**
 * Wasender API Client — BOGBE'S GROUPE Platform
 * Intégration pour la gestion intelligente des messages WhatsApp
 */

/**
 * Nettoie une valeur d'env des caractères invisibles (BOM, sauts de ligne,
 * espaces, zero-width chars) qui peuvent s'incruster lors d'un copier-coller
 * depuis le dashboard Vercel ou Wasender et casser silencieusement le HMAC
 * de signature. Garde uniquement les caractères ASCII imprimables.
 */
function sanitizeEnv(raw: string | undefined): string {
  if (!raw) return '';
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[^!-~]/g, '');
}

const WASSENDER_API_KEY = sanitizeEnv(process.env.WASSENDER_API_KEY);
const WASSENDER_WEBHOOK_SECRET = sanitizeEnv(process.env.WASSENDER_WEBHOOK_SECRET);
const BASE_URL = 'https://www.wasenderapi.com/api';

export type WasenderMessageType = 'text' | 'image' | 'video' | 'document' | 'audio';

export interface WasenderSendResponse {
  /** true si l'API a accepté l'envoi (correspond au champ `success` de l'API Wasender) */
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
}

/**
 * Vérifie la signature du webhook Wasender.
 *
 * Wasender peut envoyer la signature dans plusieurs formats selon la version :
 *   1. HMAC-SHA256 hex (standard)
 *   2. HMAC-SHA256 avec préfixe `sha256=...`
 *   3. Le secret partagé tel quel (variante simple)
 *
 * On accepte les trois pour rester compatible.
 */
export function verifyWasenderSignature(payload: string, signature: string): boolean {
  if (!WASSENDER_WEBHOOK_SECRET) return true; // Skip if no secret configured

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto');
  const sigHmacHex = crypto
    .createHmac('sha256', WASSENDER_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Strip optional 'sha256=' prefix and trim
  const cleanSig = signature.replace(/^sha256=/i, '').trim();

  // Try : HMAC hex match, OR shared-secret match (constant-time-ish).
  if (cleanSig === sigHmacHex) return true;
  if (cleanSig === WASSENDER_WEBHOOK_SECRET) return true;

  // Log helpful diagnostic (truncated) for debugging mismatches
  console.warn(
    `[Wasender] signature mismatch — received=${cleanSig.slice(0, 8)}... expected_hmac=${sigHmacHex.slice(0, 8)}... or shared_secret=${WASSENDER_WEBHOOK_SECRET.slice(0, 8)}...`
  );
  return false;
}

/**
 * Helper interne pour les appels API Wasender
 */
async function wasenderFetch(endpoint: string, options: RequestInit = {}) {
  if (!WASSENDER_API_KEY) {
    console.error('[Wasender] WASSENDER_API_KEY not configured');
    return { success: false, message: 'WASSENDER_API_KEY not configured' } as WasenderSendResponse;
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
    const data = await response.json();

    if (!response.ok) {
      console.error(`Wasender API Error [${endpoint}]:`, data);
      // Normalise en WasenderSendResponse pour les erreurs HTTP
      return { success: false, message: data.message || 'API Error' } as WasenderSendResponse;
    }

    // L'API Wasender retourne { success: boolean, data: {...} }
    // On s'assure que `success` est bien présent (fallback si l'API change)
    if (typeof data.success === 'undefined') {
      data.success = true;
    }
    return data as WasenderSendResponse;
  } catch (err: any) {
    console.error(`Wasender Network Error [${endpoint}]:`, err);
    return { success: false, message: err.message } as WasenderSendResponse;
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
  // Format the phone number to ensure it has the plus sign if needed
  // Wasender expects international format without '+' or with it? 
  // Research says E.164.
  const cleanTo = to.includes('@') ? to : (to.startsWith('+') ? to : `+${to.replace(/\D/g, '')}`);

  let payload: any = {
    to: cleanTo,
    text: content
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
    body: JSON.stringify(payload)
  });

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
    body: JSON.stringify(mediaData)
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
 * Récupère le statut de connexion de l'instance
 */
export async function wasenderGetStatus() {
  return wasenderFetch('/status');
}

