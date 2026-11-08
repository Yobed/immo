/**
 * SERVEUR WHATSAPP AUTONOME (BAILEYS + AGENT IA IMMOBILIER)
 * Port: 4000
 */

import express from 'express';
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion 
} from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { REAL_ESTATE_SYSTEM_PROMPT } from './agent-prompt.js';
import { PROPERTIES_CATALOG, searchCatalog, formatPropertyCardWhatsApp, formatFCFA } from './catalog-service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const AUTH_DIR = path.join(__dirname, 'auth_immo');
const LEADS_FILE = path.join(__dirname, 'leads_whatsapp.json');

let sock = null;
let currentQR = null;
let connectionStatus = 'initializing';
const conversationStore = new Map();

// Assurer l'existence du fichier des leads
if (!fs.existsSync(LEADS_FILE)) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

/**
 * MOTEUR IA HYBRIDE (Gemini API + Moteur NLP Immobilier Local de Secours)
 */
async function generateAIResponse(userPhone, userMessage) {
  const history = conversationStore.get(userPhone) || [];
  history.push({ role: 'user', content: userMessage });
  if (history.length > 10) history.shift();
  conversationStore.set(userPhone, history);

  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey && geminiKey !== 'your-gemini-api-key-here') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${REAL_ESTATE_SYSTEM_PROMPT}\n\nCATALOGUE ACTUEL DISPONIBLE :\n${JSON.stringify(PROPERTIES_CATALOG, null, 2)}\n\nHISTORIQUE :\n${JSON.stringify(history)}\n\nMESSAGE DU CLIENT : ${userMessage}` }]
            }
          ]
        })
      });
      const data = await response.json();
      const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (botReply) {
        return botReply;
      }
    } catch (err) {
      console.warn('[AI Engine] Erreur appel Gemini, bascule sur le moteur local :', err.message);
    }
  }

  // MOTEUR EXPERT IMMOBILIER LOCAL (100% Autonome & Immédiat)
  const lower = userMessage.toLowerCase();

  // 1. Salutations
  if (lower.match(/\b(bonjour|bonsoir|salut|hello|coucou|aide)\b/)) {
    return `Bonjour et bienvenue chez *Agence Immo* à Abidjan ! ✨

Je suis *Aya*, votre conseillère immobilière dédiée. 

Comment puis-je vous accompagner aujourd'hui ?
1️⃣ 🏠 *Acheter un bien* (Villa, Appartement, Penthouse)
2️⃣ 📍 *Acheter un terrain sécurisé* (avec ACD vérifié)
3️⃣ 🔑 *Louer un appartement ou des bureaux*
4️⃣ 🤝 *Confier un bien en vente ou en gestion*

Dites-moi simplement ce que vous recherchez ! 😊`;
  }

  // 2. Recherche Terrains avec ACD
  if (lower.includes('terrain') || lower.includes('parcelle') || lower.includes('lot') || lower.includes('acd')) {
    const terrain = PROPERTIES_CATALOG.find((p) => p.type === 'terrain');
    return `Excellente initiative ! La sécurisation foncière est notre priorité absolue à Abidjan. 📜✨

Nous disposons actuellement d'une opportunité d'angle très recherchée :

${formatPropertyCardWhatsApp(terrain)}

✅ *Sécurité juridique garantie* : Titre ACD vérifié auprès du Ministère de la Construction et de la Conservation Foncière.

Souhaitez-vous planifier une visite sur le terrain ce samedi ou un jour en semaine ? 📅`;
  }

  // 3. Recherche Villas / Cocody / Piscine
  if (lower.includes('villa') || lower.includes('cocody') || lower.includes('golf') || lower.includes('piscine')) {
    const villa = PROPERTIES_CATALOG.find((p) => p.type === 'villa' && p.district.includes('Cocody'));
    return `Voici l'une de nos plus belles propriétés disponibles à Cocody :

${formatPropertyCardWhatsApp(villa)}

🌟 *Les points forts* : Finitions d'exception, grand salon double hauteur, piscine à débordement et groupe électrogène insonorisé.

Voulez-vous que nous vous organisions une visite privée avec notre négociateur ? 🤝`;
  }

  // 4. Recherche Location / Plateau / Zone 4
  if (lower.includes('louer') || lower.includes('location') || lower.includes('plateau') || lower.includes('zone 4') || lower.includes('penthouse')) {
    const prop = lower.includes('penthouse') 
      ? PROPERTIES_CATALOG.find((p) => p.type === 'penthouse')
      : PROPERTIES_CATALOG.find((p) => p.operation === 'rent');
    
    return `Nous avons exactement ce qu'il vous faut :

${formatPropertyCardWhatsApp(prop)}

Souhaitez-vous recevoir la vidéo de présentation du bien ou réserver un créneau de visite dès aujourd'hui ? 📲`;
  }

  // 5. Demande de Plaquette / Brochure / Dossier PDF / Flipbook / Catalogue
  if (lower.match(/\b(catalogue|magazine|portfolio)\b/)) {
    return `Avec grand plaisir ! Voici notre *Catalogue Général Prestige 2026* :

📖 *Feuilleter notre catalogue numérique* :
http://localhost:3001/catalogue

📄 *Télécharger le Catalogue Complet en PDF A4* :
http://localhost:3001/brochures/CATALOGUE-PRESTIGE-ABIDJAN-2026.pdf

✨ *Au sommaire de cette édition* :
• Cartographie des quartiers d'Abidjan & indices de rendement
• Collection exclusive de Villas contemporaines (Cocody & Assinie)
• Penthouses avec vue lagune (Marcory Zone 4)
• Parcelles foncières titrées avec ACD vérifié Ministère (Bingerville)

Quel type d'investissement retient votre attention ? 🤝`;
  }

  if (lower.match(/\b(plaquette|brochure|dossier|fiche|pdf|flipbook)\b/)) {
    const villa = PROPERTIES_CATALOG.find((p) => p.reference === 'VIL-RG-2026') || PROPERTIES_CATALOG[0];
    return `Avec plaisir ! Voici le dossier complet et la plaquette de prestige :

🏡 *${villa.title}* (${villa.district})
💰 *${formatFCFA(villa.price)}* • ACD Vérifié Notarié

📖 *Consulter le Flipbook interactif* :
https://heyzine.com/flip-book/e12d59cb9e.html

📄 *Télécharger la plaquette vectorielle A4 PDF* :
http://localhost:3001/brochures/${villa.reference}.pdf

Ce dossier inclut :
• Les plans architecturaux et la double page centrale
• L'attestation de conformité foncière ACD
• La simulation de valorisation et rendement locatif

Souhaitez-vous planifier une visite des lieux cette semaine ? 🤝`;
  }

  // 6. Visite / Rendez-vous
  if (lower.includes('visite') || lower.includes('visiter') || lower.includes('rendez-vous') || lower.includes('rdv') || lower.includes('disponible')) {
    return `C'est bien noté ! Nous serons ravis de vous faire visiter ce bien. 📅✨

Pour caler le rendez-vous au planning :
1. Quel jour vous conviendrait le mieux (ex: Demain 15h, ou Samedi 10h) ?
2. Quel est votre nom complet ?

Dès réception, j'enregistre votre visite dans notre agenda agence et notre négociateur vous contacte pour confirmer le lieu de rendez-vous ! 📍`;
  }

  // Réponse par défaut avec proposition de contact
  return `Merci pour votre message ! 

Pour vous proposer les meilleures opportunités adaptées à votre projet à Abidjan :
• Quel type de bien recherchez-vous (Villa, Appartement, Terrain) ?
• Dans quelle commune ou quartier (Cocody, Marcory, Plateau, Bingerville, Assinie) ?
• Quelle est votre fourchette de budget approximative en FCFA ?

Je suis à votre écoute pour vous conseiller. 🤝`;
}

/**
 * INITIALISATION DE BAILEYS
 */
async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`[WhatsApp Bot] Initialisation Baileys v${version.join('.')} (dernière version: ${isLatest})`);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Agence Immo Abidjan', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr;
      connectionStatus = 'qr_ready';
      console.log('\n======================================================');
      console.log('📱 SCANNEZ LE QR CODE WHATSAPP CI-DESSOUS :');
      console.log(`Ou ouvrez dans votre navigateur : http://localhost:${PORT}/qr`);
      console.log('======================================================\n');
      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      connectionStatus = 'disconnected';
      console.log('[WhatsApp Bot] Connexion interrompue. Reconnexion automatique :', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 3000);
      }
    } else if (connection === 'open') {
      connectionStatus = 'connected';
      currentQR = null;
      console.log('\n======================================================');
      console.log('✅ AGENT IA WHATSAPP "AYA" CONNECTÉ AVEC SUCCÈS !');
      console.log(`Prêt à recevoir les messages au port ${PORT}`);
      console.log('======================================================\n');
    }
  });

  // RÉCEPTION DES MESSAGES
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const sender = msg.key.remoteJid;
      if (sender.includes('@g.us') || sender.includes('status@broadcast')) continue; // ignorer groupes et statuts

      const textMessage = 
        msg.message.conversation || 
        msg.message.extendedTextMessage?.text || 
        msg.message.imageMessage?.caption || 
        '';

      if (!textMessage.trim()) continue;

      const userPhone = sender.replace('@s.whatsapp.net', '');
      const pushName = msg.pushName || 'Client';

      console.log(`\n[WhatsApp Reçu] de +${userPhone} (${pushName}) : "${textMessage}"`);

      // Simulation de saisie (typing...)
      await sock.sendPresenceUpdate('composing', sender);
      await new Promise((r) => setTimeout(r, 1200));

      // Génération de la réponse IA
      const botResponse = await generateAIResponse(userPhone, textMessage);

      // Envoi de la réponse
      await sock.sendMessage(sender, { text: botResponse });
      await sock.sendPresenceUpdate('paused', sender);
      console.log(`[WhatsApp Envoyé] à +${userPhone} : "${botResponse.slice(0, 80)}..."`);

      // Enregistrement du lead pour le CRM
      try {
        const rawLeads = fs.readFileSync(LEADS_FILE, 'utf-8');
        const leads = JSON.parse(rawLeads);
        const existingIdx = leads.findIndex((l) => l.phone === `+${userPhone}`);
        const leadEntry = {
          phone: `+${userPhone}`,
          full_name: pushName,
          last_message: textMessage,
          last_response: botResponse.slice(0, 150),
          last_interaction: new Date().toISOString(),
          lead_score: textMessage.toLowerCase().includes('visite') ? 'hot' : 'warm',
        };

        if (existingIdx >= 0) {
          leads[existingIdx] = { ...leads[existingIdx], ...leadEntry };
        } else {
          leads.unshift(leadEntry);
        }

        fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
      } catch (e) {
        console.error('[Leads Storage] Erreur sauvegarde lead :', e.message);
      }

      // Remontée automatique en temps réel vers le CRM Next.js
      try {
        const crmUrl = process.env.CRM_URL || 'http://localhost:3001';
        const res = await fetch(`${crmUrl}/api/crm/whatsapp/incoming`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: `+${userPhone}`,
            senderName: pushName,
            text: textMessage,
            botReply: botResponse,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          })
        });
        if (res.ok) {
          console.log(`[CRM Sync] ✅ Remontée en temps réel réussie vers le CRM pour +${userPhone} (${pushName})`);
        }
      } catch (crmErr) {
        // Mode silencieux si le serveur Next.js n'écoute pas encore
      }
    }
  });
}

/**
 * ROUTES WEB EXPRESS POUR SUPERVISION & SCAN QR CODE
 */
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    qr_available: Boolean(currentQR),
    timestamp: new Date().toISOString(),
    agent: 'Aya (Agence Immo Abidjan)',
  });
});

app.get('/qr', async (req, res) => {
  if (connectionStatus === 'connected') {
    return res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8"><title>WhatsApp Connecté</title>
        <style>
          body { background: #0c131f; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #152136; border: 1px solid #23385a; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .badge { background: #059669; color: white; padding: 8px 16px; border-radius: 50px; font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">✅ Connecté à WhatsApp</span>
          <h1 style="color: #cda869; margin-top: 20px;">Agent IA "Aya" Actif</h1>
          <p style="color: #94a3b8;">Le bot répond en temps réel aux clients de l'Agence Immo.</p>
        </div>
      </body>
      </html>
    `);
  }

  if (!currentQR) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8"><title>Initialisation WhatsApp</title>
        <meta http-equiv="refresh" content="3">
        <style>
          body { background: #0c131f; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        </style>
      </head>
      <body>
        <div>
          <h2>Initialisation de la session WhatsApp...</h2>
          <p>Génération du QR Code en cours, la page va s'actualiser...</p>
        </div>
      </body>
      </html>
    `);
  }

  const qrImageUrl = await QRCode.toDataURL(currentQR);

  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Scanner WhatsApp - Agence Immo</title>
      <meta http-equiv="refresh" content="20">
      <style>
        body { background: #0c131f; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .box { background: #152136; border: 1px solid #23385a; padding: 35px; border-radius: 24px; text-align: center; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); }
        h1 { color: white; font-size: 20px; margin-bottom: 8px; }
        p { color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 20px; }
        img { border-radius: 12px; border: 6px solid white; margin: 0 auto; display: block; }
        .steps { text-align: left; background: #0c131f; padding: 15px; border-radius: 12px; margin-top: 20px; font-size: 12px; color: #cbd5e1; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>📱 Connexion WhatsApp Agent IA</h1>
        <p>Scannez ce code depuis WhatsApp sur votre téléphone (Appareils connectés).</p>
        <img src="${qrImageUrl}" alt="QR Code WhatsApp" width="260" height="260" />
        <div class="steps">
          1. Ouvrez <strong>WhatsApp</strong> sur votre téléphone<br>
          2. Allez dans <strong>Réglages / Menu</strong> &gt; <strong>Appareils connectés</strong><br>
          3. Touchez <strong>Connecter un appareil</strong> et visez l'écran.
        </div>
      </div>
    </body>
    </html>
  `);
});

// Endpoint pour déclencher un message sortant depuis le CRM
app.post('/api/send-message', async (req, res) => {
  const { phone, message } = req.body;
  if (!sock || connectionStatus !== 'connected') {
    return res.status(503).json({ error: 'Le bot WhatsApp n\'est pas encore connecté' });
  }

  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, to: jid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Démarrage serveur & bot
app.listen(PORT, () => {
  console.log(`[Serveur Web Bot] Actif sur http://localhost:${PORT}`);
  console.log(`[QR Code Web] Disponible sur http://localhost:${PORT}/qr`);
  startWhatsAppBot();
});
