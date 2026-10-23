import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import pino from 'pino';
import { existsSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from '@whiskeysockets/baileys';

const PORT = parseInt(process.env.PORT || '5685', 10);
function findAuthDir() {
  if (process.env.AUTH_DIR && existsSync(process.env.AUTH_DIR)) return process.env.AUTH_DIR;
  const candidates = [
    resolve(process.cwd(), 'auth'),
    resolve(process.cwd(), 'wa_auth'),
    resolve(process.cwd(), 'services/whatsapp-gateway/auth'),
    resolve(process.cwd(), 'scratch/wa_auth'),
  ];
  for (const c of candidates) {
    if (existsSync(c) && existsSync(resolve(c, 'creds.json'))) return c;
  }
  return process.env.AUTH_DIR || resolve(process.cwd(), 'auth');
}
const AUTH_DIR = findAuthDir();
const API_KEY = process.env.WHATSAPP_API_KEY || process.env.API_KEY || 'bogbes_secret_key_2026';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://www.bogbesgroup.com/api/whatsapp/webhook';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.WASSENDER_WEBHOOK_SECRET || 'a8271744c3bba421d49850cd785ff068';
const N8N_SCRAPER_URL = process.env.N8N_SCRAPER_URL || 'https://kassio1-n8n-free.hf.space/webhook/wassender-immobilier';
const N8N_HEALTH_URL = process.env.N8N_HEALTH_URL || 'https://kassio1-n8n-free.hf.space/healthz';
const PUBLIC_GATEWAY_URL = process.env.PUBLIC_URL || 'https://bogbes-whatsapp-gateway.onrender.com';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fzccugmyoglemjwidqrl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Y2N1Z215b2dsZW1qd2lkcXJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM0MjQyNiwiZXhwIjoyMTA1OTE4NDI2fQ.SfKL0NUJUVF4dI5Vn1nCDHzxCa_P05pnIiy33f5yHDk';

const logger = pino({ level: 'info' });

// ─── ☁️ SAUVEGARDE ET RESTAURATION SESSION SUPABASE CLOUD ────────────────────
async function restoreSessionFromCloud(dir) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    logger.info('☁️ Recherche sauvegarde session dans Supabase Storage (whatsapp-auth)...');
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/whatsapp-auth/session_bundle.json`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      logger.info(`ℹ️ Pas d'archive distante trouvée (statut ${res.status}). Initialisation locale.`);
      return false;
    }
    const bundle = await res.json();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    let count = 0;
    for (const [file, content] of Object.entries(bundle)) {
      writeFileSync(resolve(dir, file), content, 'utf8');
      count++;
    }
    logger.info(`✅ Session WhatsApp restaurée avec succès depuis Supabase Cloud (${count} fichiers injectés).`);
    return true;
  } catch (err) {
    logger.warn(`⚠️ Erreur restauration session cloud: ${err.message}`);
    return false;
  }
}

let syncTimeout = null;
async function backupSessionToCloud(dir) {
  if (!SUPABASE_URL || !SUPABASE_KEY || !existsSync(dir)) return;
  try {
    const files = readdirSync(dir).filter(f => f.endsWith('.json'));
    if (files.length === 0 || !files.includes('creds.json')) return;

    const bundle = {};
    for (const f of files) {
      bundle[f] = readFileSync(resolve(dir, f), 'utf8');
    }
    const body = JSON.stringify(bundle);

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/whatsapp-auth/session_bundle.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        'x-upsert': 'true',
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      logger.info(`☁️ Sauvegarde session WhatsApp synchronisée vers Supabase (${files.length} fichiers sauvegardés).`);
    } else {
      logger.warn(`⚠️ Échec backup session Supabase: statut ${res.status}`);
    }
  } catch (err) {
    logger.warn(`⚠️ Erreur backup session Supabase: ${err.message}`);
  }
}

function triggerCloudSync(dir) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => backupSessionToCloud(dir), 8000);
}

async function purgeCloudSession() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    logger.info('☁️ Purge de la session WhatsApp dans Supabase Storage (whatsapp-auth)...');
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/whatsapp-auth`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: ['session_bundle.json'] }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      logger.info('✅ Archive cloud session_bundle.json purgée avec succès de Supabase.');
    } else {
      logger.warn(`⚠️ Statut purge session Supabase: ${res.status}`);
    }
  } catch (err) {
    logger.warn(`⚠️ Erreur purge session Supabase: ${err.message}`);
  }
}

let sock = null;
let qrCodeDataUrl = null;
let currentPairingCode = null;
let connectionStatus = 'logged_out'; // 'connected' | 'connecting' | 'logged_out'
let connectedPhone = null;
let reconnectTimer = null;
let totalMessagesReceived = 0;
let totalMessagesForwarded = 0;
let lastMessageAt = null;
let lastConnectionEvents = [];
let lastDisconnectReason = null;

// ─── 🛡️ BOUCLIER ANTI-BAN WHATSAPP (SÉCURITÉ MAXIMALE) ────────────────────────
let reconnectAttempts = 0;
function getReconnectDelay() {
  reconnectAttempts++;
  // Exponential backoff : 5s, 10s, 20s, 40s, max 60s + gigue aléatoire (1 à 4s)
  const base = Math.min(60000, 5000 * Math.pow(1.8, Math.min(reconnectAttempts - 1, 5)));
  const jitter = Math.floor(Math.random() * 4000);
  return Math.floor(base + jitter);
}

const outboundQueue = [];
let isProcessingQueue = false;
let dailyOutboundCount = 0;
let lastOutboundResetDay = new Date().toDateString();
const MAX_DAILY_OUTBOUND = 100; // Protection stricte : max 100 envois/24h sur ligne de scraping

function checkDailyReset() {
  const today = new Date().toDateString();
  if (today !== lastOutboundResetDay) {
    dailyOutboundCount = 0;
    lastOutboundResetDay = today;
  }
}

async function enqueueOutboundMessage(task) {
  checkDailyReset();
  if (dailyOutboundCount >= MAX_DAILY_OUTBOUND) {
    throw new Error(`[Bouclier Anti-Ban] Quota de sécurité atteint (${MAX_DAILY_OUTBOUND} msg/jour). Envoi bloqué pour préserver le numéro.`);
  }

  return new Promise((resolve, reject) => {
    outboundQueue.push({ task, resolve, reject });
    processOutboundQueue();
  });
}

async function processOutboundQueue() {
  if (isProcessingQueue || outboundQueue.length === 0) return;
  isProcessingQueue = true;

  while (outboundQueue.length > 0) {
    const item = outboundQueue.shift();
    try {
      if (!sock || connectionStatus !== 'connected') {
        throw new Error('Passerelle WhatsApp déconnectée');
      }

      const { to, text, content } = item.task;

      // 1. Simulation humaine : "en train d'écrire..." (composing)
      try {
        await sock.sendPresenceUpdate('composing', to);
      } catch {}

      // 2. Délai de frappe réaliste proportionnel au message (ex: 2.5s à 7s aléatoire)
      const textLen = (text || '').length;
      const humanDelayMs = Math.min(8000, 1800 + textLen * 18) + Math.random() * 2000;
      await new Promise((r) => setTimeout(r, humanDelayMs));

      // 3. Pause naturelle avant émission
      try {
        await sock.sendPresenceUpdate('paused', to);
      } catch {}

      // 4. Transmission réelle du message
      const result = await sock.sendMessage(to, content);
      dailyOutboundCount++;
      logger.info({ to, dailyOutboundCount }, '✅ [Anti-Ban] Message transmis avec délai humain réaliste');

      item.resolve(result);

      // 5. Anti-burst cooling delay (5 à 9 secondes minimum entre 2 messages différents)
      if (outboundQueue.length > 0) {
        const coolingMs = 5000 + Math.random() * 4000;
        await new Promise((r) => setTimeout(r, coolingMs));
      }
    } catch (err) {
      item.reject(err);
    }
  }

  isProcessingQueue = false;
}

try {
  if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { recursive: true });
  }
} catch (e) {
  logger.warn({ err: e.message }, 'Pre-creation of AUTH_DIR skipped');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

/**
 * Initialise ou reconnecte le socket Baileys WhatsApp
 */
async function connectToWhatsApp() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end();
    } catch {}
    sock = null;
  }

  try {
    await restoreSessionFromCloud(AUTH_DIR);
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    logger.info('Démarrage Baileys avec version stable native');

    connectionStatus = 'connecting';

    sock = makeWASocket({
      logger: pino({ level: 'info' }),
      auth: state,
      browser: ['Windows', 'Chrome', '124.0.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      markOnlineOnConnect: true, // Requis pour recevoir les messages de groupe en temps réel
      getMessage: async () => undefined, // Évite les crashs Stream Errored (ack) sur retries
      appStateMacVerification: {
        patch: false,
        snapshot: false,
      },
      options: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Origin': 'https://web.whatsapp.com',
        },
      },
    });

    sock.ev.on('creds.update', async () => {
      await saveCreds();
      triggerCloudSync(AUTH_DIR);
    });

    sock.ev.on('connection.update', async (update) => {
      logger.info({ connection: update.connection, hasQr: !!update.qr, lastDisconnect: update.lastDisconnect?.error?.message }, 'Event connection.update');
      const { connection, lastDisconnect, qr } = update;

      lastConnectionEvents.push({
        time: new Date().toISOString(),
        connection,
        hasQr: !!qr,
        err: lastDisconnect?.error?.message,
        statusCode: lastDisconnect?.error?.output?.statusCode,
      });
      if (lastConnectionEvents.length > 20) lastConnectionEvents.shift();

      if (lastDisconnect) {
        lastDisconnectReason = {
          time: new Date().toISOString(),
          message: lastDisconnect.error?.message,
          statusCode: lastDisconnect.error?.output?.statusCode,
          stack: lastDisconnect.error?.stack,
        };
      }

      if (qr) {
        try {
          qrCodeDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
          connectionStatus = 'connecting';
          logger.info('Nouveau QR Code WhatsApp généré avec succès');

          try {
            await QRCode.toFile(resolve(process.cwd(), 'scratch', 'whatsapp-qr.png'), qr, { width: 400, margin: 2 });
            await QRCode.toFile('C:\\Users\\WILFRIED\\.gemini\\antigravity\\brain\\8dde7a4f-e08b-405a-a498-2fcaa606451d\\whatsapp-qr.png', qr, { width: 400, margin: 2 });
          } catch {}
        } catch (err) {
          logger.error('Erreur génération QR Code DataURL:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;
        const shouldReconnect = !isLoggedOut;
        const delay = getReconnectDelay();
        logger.warn(`Connexion Baileys fermée. Code: ${statusCode}. Reconnexion dans ${Math.round(delay/1000)}s (Tentative #${reconnectAttempts}): ${shouldReconnect}`);

        connectionStatus = 'logged_out';
        qrCodeDataUrl = null;
        currentPairingCode = null;
        connectedPhone = null;

        if (shouldReconnect) {
          reconnectTimer = setTimeout(connectToWhatsApp, delay);
        } else {
          logger.error('Session WhatsApp déconnectée par Meta (Logged Out / 401). Purge automatique locale et cloud...');
          await purgeCloudSession();
          if (existsSync(AUTH_DIR)) {
            try { rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
          }
          reconnectAttempts = 0;
          reconnectTimer = setTimeout(connectToWhatsApp, 2500);
        }
      } else if (connection === 'open') {
        reconnectAttempts = 0; // Réinitialisation du compteur anti-tempête
        connectionStatus = 'connected';
        qrCodeDataUrl = null;
        currentPairingCode = null;
        connectedPhone = sock.user?.id ? sock.user.id.split(':')[0].replace(/\D/g, '') : null;
        logger.info(`✅ Connecté à WhatsApp ! Numéro: +${connectedPhone}`);
        triggerCloudSync(AUTH_DIR);
        try {
          await sock.sendPresenceUpdate('available');
        } catch {}
      }
    });

    // Ingestion & Relai des messages entrants
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      logger.info({ count: messages.length, type }, '📥 [Baileys] messages.upsert reçu');

      for (const msg of messages) {
        if (!msg.message) continue;
        totalMessagesReceived++;
        lastMessageAt = new Date().toISOString();
        const jid = msg.key.remoteJid || '';
        const fromMe = msg.key.fromMe || false;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          '';

        const isGroup = jid.endsWith('@g.us');

        // 1. Message de groupe WhatsApp -> Relai direct Scraper n8n
        if (isGroup && !fromMe && N8N_SCRAPER_URL) {
          totalMessagesForwarded++;
          const groupPayload = {
            event: 'messages-group.received',
            data: {
              messages: [msg],
              message: msg,
              key: msg.key,
              groupName: '',
            },
            sender: msg.key.participant || jid,
            from: jid,
            text,
            message: msg,
            timestamp: Date.now(),
          };
          forwardToWebhook(N8N_SCRAPER_URL, groupPayload).catch(() => null);
        }

        // 2. Message direct 1-à-1 -> Relai Next.js (CRM / Sapphire IA)
        if (!isGroup && WEBHOOK_URL) {
          const payload = {
            event: fromMe ? 'messages.sent' : 'messages.received',
            data: {
              id: msg.key.id,
              from: jid,
              to: sock.user?.id || '',
              body: text,
              fromMe,
              pushName: msg.pushName || '',
              timestamp: msg.messageTimestamp,
              key: msg.key,
              message: msg.message,
            },
          };
          forwardToWebhook(WEBHOOK_URL, payload, WEBHOOK_SECRET).catch(() => null);
        }
      }
    });
  } catch (err) {
    logger.error('Erreur connectToWhatsApp:', err);
    connectionStatus = 'logged_out';
    reconnectTimer = setTimeout(connectToWhatsApp, 5000);
  }
}

/**
 * Relai payload vers webhook distant avec tolérance aux pannes et repli
 */
async function forwardToWebhook(url, payload, secret = '') {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (secret) {
      headers['X-Webhook-Signature'] = secret;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      logger.info(`✅ Webhook transmis avec succès vers ${url} (status ${res.status})`);
    } else {
      logger.warn(`Webhook ${url} a répondu avec statut ${res.status}`);
    }
  } catch (err) {
    logger.error(`Échec relai webhook vers ${url}: ${err.message}`);
    // Si c'est l'URL locale 127.0.0.1 qui a échoué, tenter le repli direct vers n8n Cloud
    if (url.includes('127.0.0.1') && !url.includes('hf.space')) {
      const fallbackUrl = 'https://kassio1-n8n-free.hf.space/webhook/wassender-immobilier';
      try {
        await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        logger.info(`✅ Message relayé avec succès vers n8n Cloud via repli: ${fallbackUrl}`);
      } catch (e) {
        logger.error(`Échec repli n8n cloud: ${e.message}`);
      }
    }
  }
}

// ─── Authentification API ───────────────────────────────────────────────────
function requireApiKey(req, res, next) {
  if (!API_KEY) return next();
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const keyParam = req.query.apiKey || req.headers['x-api-key'];

  if (token === API_KEY || keyParam === API_KEY) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Non autorisé: Clé API invalide' });
}

// ─── Routes API (Compatibles Wasender & Standard Gateway) ─────────────────────

const handleStatus = (req, res) => {
  checkDailyReset();
  res.json({
    success: true,
    status: connectionStatus,
    phone: connectedPhone,
    stats: {
      received: totalMessagesReceived,
      forwarded: totalMessagesForwarded,
      lastMessageAt,
    },
    antiBan: {
      enabled: true,
      dailyOutbound: dailyOutboundCount,
      dailyLimit: MAX_DAILY_OUTBOUND,
      queuePending: outboundQueue.length,
      mode: 'passive_scraping_safe',
    },
    instance: 'bogbes-whatsapp-gateway',
    timestamp: new Date().toISOString(),
  });
};
app.get('/status', handleStatus);
app.get('/api/status', handleStatus);

app.get(['/debug-wa', '/api/debug-wa'], (req, res) => {
  res.json({
    status: connectionStatus,
    phone: connectedPhone,
    authDir: AUTH_DIR,
    stats: {
      received: totalMessagesReceived,
      forwarded: totalMessagesForwarded,
      lastMessageAt,
    },
    events: lastConnectionEvents,
    lastDisconnect: lastDisconnectReason,
  });
});

const handleSendMessage = async (req, res) => {
  if (connectionStatus !== 'connected' || !sock) {
    return res.status(503).json({
      success: false,
      message: 'Passerelle WhatsApp déconnectée. Veuillez scanner le QR code ou associer votre numéro.',
      status: connectionStatus,
    });
  }

  const { to, text, imageUrl, videoUrl, documentUrl, audioUrl } = req.body;
  if (!to) {
    return res.status(400).json({ success: false, message: 'Destinataire "to" requis' });
  }

  let cleanTo = String(to).replace(/\D/g, '');
  if (!cleanTo.endsWith('@g.us')) {
    try {
      const [waContact] = await sock.onWhatsApp(cleanTo);
      if (waContact?.jid) {
        cleanTo = waContact.jid;
      } else if (!cleanTo.endsWith('@s.whatsapp.net')) {
        cleanTo = `${cleanTo}@s.whatsapp.net`;
      }
    } catch {
      if (!cleanTo.endsWith('@s.whatsapp.net')) {
        cleanTo = `${cleanTo}@s.whatsapp.net`;
      }
    }
  }

  try {
    let content = null;

    if (imageUrl) {
      content = {
        image: { url: imageUrl },
        caption: text || '',
      };
    } else if (videoUrl) {
      content = {
        video: { url: videoUrl },
        caption: text || '',
      };
    } else if (documentUrl) {
      content = {
        document: { url: documentUrl },
        mimetype: 'application/pdf',
        fileName: 'document.pdf',
        caption: text || '',
      };
    } else if (audioUrl) {
      content = {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: true,
      };
    } else {
      content = {
        text: text || '',
      };
    }

    // 🛡️ Passage obligatoire par la file sécurisée Anti-Ban (Typing presence + Délai humain + Quota)
    const result = await enqueueOutboundMessage({
      to: cleanTo,
      text: text || '',
      content,
    });

    return res.json({
      success: true,
      message: 'Message envoyé avec succès',
      data: {
        msgId: result?.key?.id || Date.now(),
        id: result?.key?.id,
        jid: cleanTo,
        status: 'sent',
      },
    });
  } catch (err) {
    logger.error(`Erreur envoi message vers ${cleanTo}:`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
app.post('/send-message', requireApiKey, handleSendMessage);
app.post('/api/send-message', requireApiKey, handleSendMessage);

const handleOnWhatsApp = async (req, res) => {
  const phone = req.params.phone?.replace(/\D/g, '');
  if (!phone || !sock) {
    return res.json({ success: false, onWhatsApp: false });
  }
  try {
    const [result] = await sock.onWhatsApp(phone);
    return res.json({ success: true, onWhatsApp: result?.exists || false, jid: result?.jid });
  } catch {
    return res.json({ success: false, onWhatsApp: false });
  }
};
app.get('/on-whatsapp/:phone', requireApiKey, handleOnWhatsApp);
app.get('/api/on-whatsapp/:phone', requireApiKey, handleOnWhatsApp);

// Association alternative par Code à 8 chiffres (Sans Caméra)
const handlePairingCode = async (req, res) => {
  const phone = String(req.body.phone || req.query.phone || '').replace(/\D/g, '');
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Numéro de téléphone requis (ex: 2250789263373)' });
  }

  if (connectionStatus === 'connected') {
    return res.status(400).json({
      success: false,
      message: `La passerelle est déjà connectée au numéro +${connectedPhone}. Cliquez sur 'Déconnecter la session' pour associer un autre numéro.`
    });
  }

  try {
    // Si pas de socket ou session déjà enregistrée / socket fermé
    const isRegistered = sock?.authState?.creds?.registered;
    if (!sock || isRegistered) {
      logger.info('Purge et recréation d\'une session vierge pour autoriser le code d\'association...');
      if (sock) {
        try { sock.ev.removeAllListeners(); sock.end(); } catch {}
        sock = null;
      }
      if (existsSync(AUTH_DIR)) {
        try { rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
      }
      await purgeCloudSession();
      await connectToWhatsApp();

      // Attendre que le socket soit initialisé et prêt
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 400));
        if (sock && !sock.authState?.creds?.registered) break;
      }
    }

    if (!sock) {
      return res.status(503).json({ success: false, message: 'Passerelle en cours d\'initialisation, réessayez dans 3 secondes.' });
    }

    logger.info(`Génération du code d'association pour le numéro: +${phone}`);
    await new Promise((r) => setTimeout(r, 800));
    const code = await sock.requestPairingCode(phone);
    currentPairingCode = code;
    logger.info(`Code d'association généré avec succès: ${code}`);

    if (req.is('json') || req.headers.accept?.includes('application/json') || req.headers['content-type']?.includes('application/json')) {
      return res.json({ success: true, code, phone });
    }
    return res.redirect('/?code=' + encodeURIComponent(code));
  } catch (err) {
    logger.error('Erreur requestPairingCode:', err);
    return res.status(500).json({
      success: false,
      message: err.message === 'Connection Closed'
        ? 'Connexion réinitialisée. Cliquez à nouveau sur "Obtenir le code" pour finaliser.'
        : err.message
    });
  }
};
app.post('/api/pairing-code', handlePairingCode);
app.get('/api/pairing-code', handlePairingCode);

const handleDisconnect = async (req, res) => {
  try {
    logger.info('Demande de réinitialisation/déconnexion reçue...');
    if (sock) {
      try { await sock.logout(); } catch {}
      try { sock.ev.removeAllListeners(); sock.end(); } catch {}
      sock = null;
    }
    if (existsSync(AUTH_DIR)) {
      try { rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
    }
    await purgeCloudSession();

    connectionStatus = 'logged_out';
    connectedPhone = null;
    qrCodeDataUrl = null;
    currentPairingCode = null;
    reconnectAttempts = 0;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectToWhatsApp, 1500);

    if (req.accepts('html') && !req.is('json')) {
      return res.redirect('/');
    }
    return res.json({ success: true, message: 'Session réinitialisée (local et cloud purgés)' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
app.post('/api/disconnect', handleDisconnect);
app.get('/api/disconnect', handleDisconnect);

// Liste des groupes WhatsApp actifs surveillés
app.get(['/groups', '/api/groups'], async (req, res) => {
  try {
    if (!sock || connectionStatus !== 'connected') {
      return res.status(503).json({ success: false, status: connectionStatus, error: 'Passerelle non connectée' });
    }
    const groups = await sock.groupFetchAllParticipating();
    const list = Object.values(groups).map((g) => ({
      id: g.id,
      name: g.subject,
      participants: g.participants?.length || 0,
      creation: g.creation ? new Date(g.creation * 1000).toISOString() : null,
    }));
    return res.json({ success: true, count: list.length, groups: list });
  } catch (err) {
    logger.error('Erreur groupFetchAllParticipating:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Forcer la présence et la synchronisation
app.get(['/sync', '/api/sync'], async (req, res) => {
  try {
    if (!sock || connectionStatus !== 'connected') {
      return res.status(503).json({ success: false, error: 'Passerelle non connectée' });
    }
    await sock.sendPresenceUpdate('available');
    return res.json({ success: true, message: 'Présence WhatsApp forcée : disponible' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Test d'ingestion direct vers n8n (vérifie la chaîne end-to-end)
app.all(['/test-ingest', '/api/test-ingest'], async (req, res) => {
  try {
    const text = req.body?.text || req.query?.text || 'Villa 4 pièces à louer Cocody Angré 350.000 FCFA contact 0778311541';
    const testPayload = {
      event: 'messages-group.received',
      data: {
        messages: [{
          key: { remoteJid: '120363404877349153@g.us', fromMe: false, participant: '2250778311541@s.whatsapp.net' },
          message: { conversation: text },
          messageTimestamp: Math.floor(Date.now() / 1000),
        }],
      },
      sender: '2250778311541@s.whatsapp.net',
      from: '120363404877349153@g.us',
      text,
      timestamp: Date.now(),
    };
    await forwardToWebhook(N8N_SCRAPER_URL, testPayload);
    return res.json({ success: true, forwardedTo: N8N_SCRAPER_URL, payload: testPayload });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Redirections préventives vers l'accueil
app.get('/api', (req, res) => res.redirect('/' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')));
app.get('/api/', (req, res) => res.redirect('/' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')));

// ─── Dashboard Web & QR Code ────────────────────────────────────────────────
const renderDashboard = (req, res) => {
  const isConnected = connectionStatus === 'connected';
  const displayedCode = req.query.code || currentPairingCode;

  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BOGBE'S GROUPE — Passerelle WhatsApp Privée</title>
  <style>
    :root {
      --bg: #0b1120;
      --card: #131d35;
      --border: #1e293b;
      --accent: #10b981;
      --gold: #d4af37;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 28px;
      padding: 36px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .badge.connected { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge.connecting { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge.logged_out { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; color: var(--gold); }
    p { color: var(--muted); font-size: 13px; line-height: 1.5; margin: 0 0 24px; }
    .qr-box {
      background: #ffffff;
      padding: 16px;
      border-radius: 18px;
      display: inline-block;
      margin: 0 auto 20px;
      box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.4);
    }
    .qr-box img { display: block; width: 240px; height: 240px; }
    .pairing-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 18px;
      margin-top: 20px;
      text-align: left;
    }
    .pairing-title {
      font-size: 13px;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .code-display {
      background: #0f172a;
      border: 2px dashed #38bdf8;
      border-radius: 12px;
      padding: 14px;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0.25em;
      text-align: center;
      color: #38bdf8;
      margin: 12px 0;
      font-family: monospace;
    }
    .input-group {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    input[type="text"] {
      flex: 1;
      background: #0f172a;
      border: 1px solid var(--border);
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
    }
    .btn-action {
      background: #0284c7;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-action:hover { background: #0369a1; }
    .spinner {
      display: inline-block;
      width: 44px;
      height: 44px;
      border: 3px solid rgba(255,255,255,0.1);
      border-radius: 50%;
      border-top-color: var(--gold);
      animation: spin 1s ease-in-out infinite;
      margin: 30px 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .info {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      font-size: 12px;
      text-align: left;
      margin-bottom: 24px;
    }
    .info div { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .info div:last-child { margin-bottom: 0; }
    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;
      padding: 10px 22px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-danger:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge ${connectionStatus}">
      ● ${connectionStatus === 'connected' ? 'Connecté' : connectionStatus === 'connecting' ? 'Attente d\'association' : 'Prêt pour association'}
    </div>

    <h1>BOGBE'S GROUPE</h1>
    <p>Passerelle WhatsApp Souveraine & 100% Gratuite (0 FCFA/mois)</p>

    ${
      isConnected
        ? `
        <div style="font-size: 56px; margin: 20px 0;">✅</div>
        <h2 style="font-size: 18px; margin: 0 0 8px; color: #34d399;">WhatsApp opérationnel</h2>
        <p style="margin-bottom: 24px;">Numéro connecté : <strong>+${connectedPhone || 'Inconnu'}</strong></p>
        <div class="info">
          <div><span style="color:var(--muted)">Moteur :</span> <strong>Baileys (WebSockets)</strong></div>
          <div><span style="color:var(--muted)">Relai CRM Next.js :</span> <strong>Actif (Direct)</strong></div>
          <div><span style="color:var(--muted)">Relai Scraper n8n :</span> <strong>Hugging Face Cloud (24/7)</strong></div>
        </div>
        <form method="POST" action="/api/disconnect">
          <button type="submit" class="btn-danger">Déconnecter la session</button>
        </form>
      `
        : `
        ${
          qrCodeDataUrl
            ? `
            <div class="qr-box">
              <img src="${qrCodeDataUrl}" alt="Scanner le QR Code WhatsApp">
            </div>
            <p style="font-size: 12px;">Méthode 1 : Scannez ce QR Code depuis WhatsApp > Appareils connectés.</p>
          `
            : `
            <div class="spinner"></div>
            <p style="font-size: 12px;">Génération du flux de connexion...</p>
          `
        }

        ${
          displayedCode
            ? `
            <div class="pairing-box">
              <div class="pairing-title">📱 Code d'association généré</div>
              <div class="code-display">${displayedCode}</div>
              <p style="font-size: 11px; margin: 0; color: var(--muted);">
                Sur votre téléphone : WhatsApp > <strong>Appareils connectés</strong> > <strong>Associer avec un numéro de téléphone</strong> et entrez ce code.
              </p>
            </div>
          `
            : `
            <div class="pairing-box">
              <div class="pairing-title">✨ Méthode 2 : Associer par Numéro (Sans Caméra)</div>
              <p style="font-size: 11px; margin-bottom: 8px;">Entrez votre numéro WhatsApp pour recevoir un code à 8 chiffres :</p>
              <form id="pair-form" onsubmit="handlePairing(event)" class="input-group">
                <input type="text" id="pair-phone" name="phone" placeholder="ex: 2250789263373" required>
                <button type="submit" id="pair-btn" class="btn-action">Obtenir le code</button>
              </form>
              <div id="pair-dynamic-result" style="display:none; margin-top:12px;">
                <div class="code-display" id="pair-dynamic-code"></div>
                <p style="font-size: 11px; margin: 6px 0 0; color: #34d399; font-weight:600;">
                  Code actif ! Ouvrez WhatsApp > Appareils connectés > Associer avec un numéro de téléphone et tapez ce code.
                </p>
              </div>
            </div>
          `
        }
        <form method="POST" action="/api/disconnect" style="margin-top: 18px;">
          <button type="submit" style="background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 7px 16px; border-radius: 10px; font-size: 11px; cursor: pointer; transition: all 0.2s;">
            🔄 Réinitialiser la passerelle (Nouveau QR / Code)
          </button>
        </form>
      `
    }
  </div>

  <script>
    // Polling régulier pour détecter la connexion instantanément
    let isConnected = ${isConnected};
    if (!isConnected) {
      setInterval(async () => {
        try {
          const res = await fetch('/status');
          const data = await res.json();
          if (data.status === 'connected') {
            window.location.reload();
          }
        } catch {}
      }, 2500);
    }

    async function handlePairing(e) {
      e.preventDefault();
      const btn = document.getElementById('pair-btn');
      const phoneInput = document.getElementById('pair-phone');
      const resBox = document.getElementById('pair-dynamic-result');
      const codeElem = document.getElementById('pair-dynamic-code');

      btn.disabled = true;
      btn.innerText = 'Génération...';

      try {
        const res = await fetch('/api/pairing-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneInput.value })
        });
        const data = await res.json();
        if (data.success && data.code) {
          codeElem.innerText = data.code;
          resBox.style.display = 'block';
        } else {
          alert('Erreur: ' + (data.message || 'Impossible de générer le code'));
        }
      } catch (err) {
        alert('Erreur de communication: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = 'Obtenir le code';
      }
    }
  </script>
</body>
</html>
  `);
};

app.get(['/', '/index.html', '/api', '/api/'], renderDashboard);

// ─── 🔄 BOUCLE ANTI-VEILLE CLOUD 24/7 (SYMBIOTIC KEEP-ALIVE) ─────────────────
function startKeepAliveLoop() {
  const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes (inférieur au timeout d'inactivité Render de 15 min)
  logger.info('🔄 Démarrage du bouclier anti-veille 24/7 (cycle: 4 min)...');

  // Premier auto-ping différé 45s après le démarrage
  setTimeout(runPingCycle, 45000);
  setInterval(runPingCycle, INTERVAL_MS);

  async function runPingCycle() {
    // 1. Auto-ping de sa propre URL publique pour forcer une requête entrante dans Render
    if (PUBLIC_GATEWAY_URL) {
      try {
        const pingUrl = `${PUBLIC_GATEWAY_URL}/status`;
        const res = await fetch(pingUrl, { signal: AbortSignal.timeout(12000) });
        logger.info(`🏓 [Anti-Veille Render] Auto-ping public OK (statut ${res.status})`);
      } catch (err) {
        logger.warn(`⚠️ [Anti-Veille Render] Auto-ping: ${err.message}`);
      }
    }

    // 2. Ping de n8n sur Hugging Face Space pour maintenir le traitement actif
    if (N8N_HEALTH_URL) {
      try {
        const res = await fetch(N8N_HEALTH_URL, { signal: AbortSignal.timeout(12000) });
        logger.info(`🏓 [Anti-Veille n8n] Ping n8n Space OK (statut ${res.status})`);
      } catch (err) {
        logger.warn(`⚠️ [Anti-Veille n8n] Ping: ${err.message}`);
      }
    }

    // 3. Sauvegarde de sécurité périodique de la session WhatsApp dans Supabase
    triggerCloudSync(AUTH_DIR);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Passerelle WhatsApp Baileys active sur http://0.0.0.0:${PORT}`);
  connectToWhatsApp().catch(err => logger.error('Erreur démarrage initial Baileys:', err));
  startKeepAliveLoop();
});
