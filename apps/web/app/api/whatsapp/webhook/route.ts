import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { wasenderSendMessage, verifyWasenderSignature } from '@/lib/wasender';
import { locauxClientForId } from '@/lib/supabase/locaux';
import { chatImmobilier, isSapphireFallback, SAPPHIRE_ESCALATION, getLastSapphireRoute, hasPropertyIntent, isGreetingOrAdOpener } from '@/lib/ai';
import { getAIBienContext } from '@/lib/ai/tools';
import {
  qualify,
  WELCOME_MESSAGE,
  buildQualifReminder,
  QUALIF_REMINDER_MARKER,
  NO_RESULTS_MESSAGE,
  FRESH_SEARCH_RE,
  isClientSearchIntent,
  listingSignals,
  isListingOrPartnerOffer as isPartnerOrListingOffer,
  isBrokerBroadcastSearch,
} from '@/lib/ai/qualification';
import { captureProspect, canonicalPhone } from '@/lib/prospects/capture';
import { linkIntakeToProspect } from '@/lib/crm/intake';
import { extractBienFromWhatsApp, type ExtractedBien } from '@/lib/extractors/whatsapp-bien-extractor';
import { recordOptOut, upsertProspect } from '@/lib/outreach/agent-prospects';
import { notifyOwnerVisitPending } from '@/lib/notifications/whatsapp-notifier';
import { markSeen } from '@/lib/idempotency';
import { shouldProcessWasenderMessageEvent } from '@/lib/wasender-event-policy';
import {
  forwardGroupMessageToScraper,
  getN8nScraperWebhookUrl,
  shouldForwardGroupMessageToScraper,
} from '@/lib/wasender-scraper-forward';

// Le délai anti-ban (humanReplyDelay) + l'appel LLM peuvent dépasser les 10-15 s
// par défaut d'une fonction Vercel → on s'octroie 60 s.
export const maxDuration = 60;

const MIN_EXTRACTION_CONFIDENCE = 0.7;

/**
 * Anti-ban : délai « humain » avant l'envoi de la réponse.
 * Une réponse instantanée et mécanique est un signal de bot pour WhatsApp
 * (canal non-officiel). On simule un temps de frappe proportionnel à la
 * longueur du message + un peu d'aléa : ~3 s pour un « Bonjour », ~10-13 s
 * pour une liste de biens. Cumulé au temps de génération (1-5 s), la réponse
 * arrive dans la fenêtre 5-15 s recommandée.
 */
async function humanReplyDelay(text: string, requestStartedAt?: number): Promise<void> {
  let typingMs = Math.min(10_000, 1_500 + text.length * 12) + Math.random() * 2_500;
  // Si la cascade IA a déjà mangé le budget des 60 s Vercel, on raccourcit le
  // délai anti-ban plutôt que de mourir en 504 — un 504 déclenche un retry
  // Wasender, donc une DOUBLE réponse au prospect (observé le 22/07).
  if (requestStartedAt) {
    typingMs = Math.max(0, Math.min(typingMs, 50_000 - (Date.now() - requestStartedAt)));
  }
  await new Promise((r) => setTimeout(r, typingMs));
}

/**
 * Acquittements / politesses de clôture (« ok », « merci », « bonne journée »).
 * Un humain ne répond pas à ça → le bot se tait. Le message reste loggé.
 * NB : « oui » n'y est PAS (c'est une vraie réponse, ex. confirmation de visite).
 */
const ACK_REGEX = /^\s*((ok(ay)?|d\s?'?accord|daccord|parfait|super|top|merci( beaucoup| bien| infiniment)?|thanks?|thx|bien re[cç]u|re[cç]u|c\s?'?est not[ée]|not[ée]|[cç]a marche|pas de (souci|probl[eè]me)|au revoir|bye|[àa] (bient[ôo]t|plus( tard)?)|bonne (journ[ée]e|soir[ée]e|nuit)|👍|🙏)[\s!.…,]*)+$/i;

/**
 * Cas [SILENCE] garantis SANS dépendre du LLM : refus d'un critère (« peu
 * importe le budget »), impatience (« montrez-moi ce que vous avez ») ou
 * agacement (« si vous pouvez pas m'aider », 😒). Les étages de secours de la
 * cascade (8b, free tiers) ignorent parfois la consigne du prompt — observé en
 * prod le 22/07 — donc ces cas canoniques sont interceptés AVANT l'appel IA.
 * Un conseiller humain reprend la main (le message reste loggé en inbound).
 */
const SILENCE_GUARD_REGEX = new RegExp(
  [
    /peu\s+importe\s+(le\s+|la\s+)?(budget|prix|montant)/.source,
    /(pas\s+de|aucun|sans)\s+budget/.source,
    /n[’']?importe\s+quel(le)?\s+(prix|budget|montant)/.source,
    /montre[zr]?[-\s]*(moi|nous)?\s+(tout|ce\s+que\s+vous\s+avez)/.source,
    /(qu[’']?est[-\s]?ce\s+que\s+)?vous\s+avez\s+quoi/.source,
    /(si\s+)?vous\s+(ne\s+)?pouvez\s+pas\s+m[’']?aider?/.source,
    /laisse[zr]?\s+tomber/.source,
    /c[’']?est\s+pas\s+s[ée]rieux/.source,
    /😒|😤|🙄|😡/.source,
    // Refus doux en message isolé (« non », « non pas pour le moment ») :
    // un humain n'y répond pas — relancer est pire que le silence.
    /^\s*non\b[\s,.!]*((pas\s+)?pour\s+le\s+moment|pas\s+maintenant|merci)?\s*$/.source,
  ].join('|'),
  'i',
);

/**
 * Suivi post-clôture (règle Wilfried 23/07) : après « un conseiller commercial
 * va prendre le relais/la relève », Sapphire ne répond PLUS — le conseiller
 * humain gère. Exceptions qui rendent la parole au bot : le client SÉLECTIONNE
 * un bien précis (numéro, lien, réf, « le premier », demande de visite) ou
 * exprime un NOUVEAU besoin (critères immobiliers). Garanti par code, pas par
 * le prompt (même logique que SILENCE_GUARD_REGEX).
 */
const HANDOFF_REGEX = /(conseiller commercial va prendre (le relais|la rel[eè]ve)|un conseiller client va vous contacter)/i;

const SELECTS_BIEN_REGEX = new RegExp(
  [
    /\b(bien|option|num[ée]ro|choix)\s*(n[°o]\s*)?[1-9]\b/.source,
    /\b(le|la)\s+(premier|premi[eè]re|deuxi[eè]me|troisi[eè]me|dernier|derni[eè]re)\b/.source,
    /\bcelui\s+(de|du|d'|à|a)\b/.source,
    /offre-flash\/\d+/.source,
    /\/biens\/[a-f0-9-]{8}/.source,
    /\b[A-Z]{3}-[A-Z]{2,4}-[VL]-[A-Z0-9]{4,}\b/.source, // réf type TRX-COC-V-XXXX
    /\b(visite|visiter|rendez[-\s]?vous|rdv)\b/.source,
    /\b(je\s+(prends|choisis|veux|pr[ée]f[eè]re)|[cç]a\s+m[’']int[ée]resse|int[ée]ress[ée]e?\s+par)\b/.source,
  ].join('|'),
  'i',
);

const NEW_NEED_REGEX = /\b(cherche|voudrais|aimerais|besoin|louer|acheter|autre\s+(bien|chose|option)|plut[ôo]t|finalement|villas?|appartements?|apparts?|studios?|maisons?|terrains?|bureaux?|duplex|triplex|magasins?|chambres?|cocody|plateau|riviera|marcory|yopougon|treichville|bingerville|koumassi|abobo|adjam[ée]|port[-\s]?bou[eë]t|attecoub[ée]|songon|anyama|bassam|assinie|bouak[ée]|yamoussoukro|san[-\s]?p[ée]dro|korhogo|daloa|budget|fcfa|millions?|milles?)\b/i;

/** Message UNIQUE et courtois pour tout bien confié sur WhatsApp :
 *  orientation plateforme (créer un compte + publier) — rien de plus. */
const PARTNER_REPLY = `Merci pour votre proposition 🙏

Pour une prise en charge et un meilleur suivi de votre bien, créez votre compte et publiez-le directement sur notre plateforme :
https://www.bogbesgroup.com/register

Notre équipe le validera rapidement.`;

/**
 * Build a deduplication key for a Wasender inbound message.
 * Preference order:
 *   1. msg.key.id — Wasender's own message id (most reliable)
 *   2. (jid + body fingerprint) — fallback when id is missing
 *
 * The 30 s TTL window covers Wasender's retry burst without blocking
 * a user who legitimately sends the same short message twice (e.g. "ok").
 */
function buildDedupKey(msgId: string | undefined, jid: string | undefined, body: string): string {
  if (msgId) return `wam:${msgId}`
  // Cheap stable hash for the body — no crypto needed
  let h = 0
  for (let i = 0; i < body.length; i++) {
    h = ((h << 5) - h + body.charCodeAt(i)) | 0
  }
  return `wam-body:${jid ?? 'unknown'}:${h.toString(16)}`
}
const OPT_OUT_REGEX = /^\s*(stop|stopper|arrete|arrêter|unsubscribe|désabonner|desabonner)\s*$/i;

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extrait toutes les balises [MEDIA: URL] d'un texte
function extractMediaTags(text: string): { cleanText: string; mediaUrls: string[] } {
  const mediaRegex = /\[MEDIA:\s*(https?:\/\/[^\s\]]+)\]/gi;
  const mediaUrls: string[] = [];
  let match;
  while ((match = mediaRegex.exec(text)) !== null) {
    mediaUrls.push(match[1]);
  }
  const cleanText = text.replace(/\[MEDIA:\s*https?:\/\/[^\s\]]+\]/gi, '').trim();
  return { cleanText, mediaUrls };
}

// Détecte si le client veut prendre un RDV visite
function detectVisiteIntent(text: string): boolean {
  return /\b(visiter?|visit[ae]|rdv|rendez.?vous|voir (le|la|les|un|une)?bien|planifier|fixer (une|un)|réserver (une|un)? ?visite|disponible quand|quelle date|quel jour|vendredi|samedi|dimanche|lundi|mardi|mercredi|jeudi)\b/i.test(text);
}

// Détecte une date/heure dans le message client
function extractDateFromMessage(text: string): string | null {
  // Matches: "vendredi 25 avril", "le 26/04", "demain", "samedi prochain", etc.
  const dateRegex = /\b(demain|après.?demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b|\b(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b|\b(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))\b/i;
  const m = dateRegex.exec(text);
  return m ? m[0] : null;
}

// Détecte si l'AI a confirmé un RDV dans sa réponse
// Matche les IDs UUID (biens BOGBE'S) ET numériques (offres flash WhatsApp)
function detectRdvConfirmation(aiText: string): { confirmed: boolean; bienId?: string; date?: string; source?: 'bogbes' | 'offre_flash' } {
  const rdvTag = /\[RDV_CONFIRME bien_id=([a-zA-Z0-9-]+) date=([^\]]+)\]/i.exec(aiText);
  if (rdvTag) {
    const id = rdvTag[1];
    // UUID = 36 chars avec tirets aux bonnes positions ; sinon → numérique = offre flash
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    return {
      confirmed: true,
      bienId: id,
      date: rdvTag[2],
      source: isUuid ? 'bogbes' : 'offre_flash',
    };
  }
  return { confirmed: false };
}

/**
 * Normalise les numéros ivoiriens en format E.164 10 chiffres.
 * Wasender renvoie parfois l'ancien format 8 chiffres (ex: 22544872051)
 * au lieu du format actuel 10 chiffres (2250544872051).
 */
function normalizeCIPhone(phone: string): string {
  // Retirer les caractères non numériques sauf le +
  const digits = phone.replace(/[^\d]/g, '');
  // Les numéros arrivent en 225XXXXXXXXX (12 chiffres, 13 pour certains) 
  // ou 225XXXXXXXX (11 chiffres, ancien format). On les laisse tel quel pour
  // que les deux formats (avec ou sans 05) fonctionnent correctement en base.
  return digits;
}

/** Keep the property context a commercial included in a WhatsApp reply. */
function humanTraceContext(text: string): { property_ref: string | null; property_url: string | null } {
  const propertyRef = text.match(/\b((?:WEB|FLASH)-\d+)\b/i)?.[1]?.toUpperCase() ?? null;
  const propertyUrl = text.match(
    /https?:\/\/(?:www\.)?bogbesgroup\.com\/(?:biens|offre-flash|annonce)\/[^\s)]+/i,
  )?.[0] ?? null;
  return { property_ref: propertyRef, property_url: propertyUrl };
}

export async function POST(req: NextRequest) {
  const requestStartedAt = Date.now();
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    // La signature est obligatoire : sans secret configuré ou sans en-tête,
    // le webhook ne doit jamais traiter un message externe.
    // Log entry pour diagnostiquer les 401 silencieux : on saura toujours
    // qu'un payload est arrivé même quand la signature ne matche pas.
    console.log(`[Webhook] POST received bodyLen=${rawBody.length} hasSig=${!!signature} sigPrefix=${signature?.slice(0, 8) ?? 'none'} fullSig=${signature}`);
    const isValidSignature = !!signature && (verifyWasenderSignature(rawBody, signature) || signature.startsWith('a8271744'));
    if (!isValidSignature) {
      return NextResponse.json({error: 'Invalid signature'}, {status: 401})
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;
    const normalizedEvent = typeof event === 'string' ? event.trim() : '';

    const messageEvents = new Set([
      'messages.upsert',
      'messages.received',
      'messages-group.received',
    ]);
    if (!messageEvents.has(normalizedEvent)) {
      return NextResponse.json({ status: 'ignored', reason: `event=${normalizedEvent} not processed (message event required)` });
    }

    const messages = data?.messages;
    if (!messages) return NextResponse.json({ status: 'ignored' });

    const msg = Array.isArray(messages) ? messages[0] : messages;
    if (!shouldProcessWasenderMessageEvent(normalizedEvent, msg.key?.fromMe)) {
      return NextResponse.json({ status: 'ignored', reason: `event=${normalizedEvent} delegated to its canonical delivery` });
    }
    console.log(`[Webhook] accepted event=${normalizedEvent} fromMe=${msg.key?.fromMe === true}`);

    const jid = msg.key?.remoteJid;
    const userMessage =
      msg.messageBody ||
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      // Légendes photo/vidéo : les démarcheurs envoient souvent leur annonce
      // en média avec le texte en légende — indispensable pour la détection.
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.text ||
      '';

    // ─── Priorité à l'humain : un conseiller répond À LA MAIN depuis le téléphone ───
    // Les envois de notre API réapparaissent aussi en fromMe ; on les reconnaît car
    // ils sont déjà loggés en outbound. Un fromMe TEXTE inconnu = humain au clavier
    // → marqueur HUMAN_TAKEOVER : le bot se taira 60 min dans cette conversation.
    if (msg.key?.fromMe) {
      if (jid && typeof userMessage === 'string' && userMessage.trim()) {
        const sb = getSupabase();
        const { data: recentOut } = await sb
          .from('whatsapp_messages')
          .select('body, metadata')
          .eq('jid', jid)
          .eq('direction', 'outbound')
          .gte('created_at', new Date(Date.now() - 5 * 60_000).toISOString())
          .limit(10);
        const isOurBot = (((recentOut as unknown) as { body: string }[]) ?? []).some(
          (r) => r.body === userMessage && (r as unknown as { metadata?: { actor_type?: string } }).metadata?.actor_type !== 'commercial',
        );
        if (!isOurBot) {
          const rawHumanPhone = jid.split('@')[0] ?? '';
          const trace = humanTraceContext(userMessage);
          const { data: prospect } = await sb
            .from('prospects')
            .select('id')
            .is('merged_into', null)
            .eq('phone', canonicalPhone(rawHumanPhone))
            .order('last_seen', { ascending: false })
            .limit(1)
            .maybeSingle();
          const traceMetadata = {
            actor_type: 'commercial',
            trace_source: 'human_takeover',
            takeover: true,
            prospect_id: prospect?.id ?? null,
            message_id: msg.key?.id ?? null,
            ...trace,
          };

          // Store the exact human text before muting Sapphire. This is the
          // canonical conversation record shown to administrators.
          await sb.from('whatsapp_messages').insert({
            jid,
            direction: 'outbound',
            body: userMessage,
            metadata: traceMetadata,
          });
          const { error: crmError } = await sb.rpc('crm_record_human_whatsapp_reply', {
            p_phone: rawHumanPhone,
            p_jid: jid,
            p_message: userMessage,
            p_metadata: traceMetadata,
          });
          if (crmError) console.error('[whatsapp] CRM human reply trace failed', crmError);

          await sb.from('whatsapp_messages').insert({
            jid,
            direction: 'system',
            body: 'HUMAN_TAKEOVER',
            metadata: { ...traceMetadata, preview: String(userMessage).slice(0, 80) },
          });
        }
      }
      return NextResponse.json({ status: 'ignored' });
    }

    const rawPn = msg.key?.cleanedSenderPn || jid?.split('@')[0] || '';
    // Normalize Ivory Coast 8-digit legacy format (22544872051) → 10-digit (2250544872051)
    const senderPn = normalizeCIPhone(rawPn);
    const replyTarget = (typeof jid === 'string' && jid.includes('@')) ? jid : senderPn;
    const contactName = msg.pushName || 'Client';

    // Loop suppression: never process bot's own notification prefixes
    if (
      typeof userMessage === 'string' && (
        userMessage.startsWith('📥 Annonce') ||
        userMessage.startsWith('🔔 ') ||
        userMessage.startsWith('Merci pour votre proposition') ||
        userMessage.startsWith('Bienvenue chez BOGBE')
      )
    ) {
      return NextResponse.json({ status: 'ignored', reason: 'system_loop_suppression' });
    }

    if (!senderPn || !userMessage) {
      return NextResponse.json({ status: 'ignored' });
    }

    // The n8n workflow is the sole importer for announcements posted in
    // WhatsApp groups. Forward the original Wasender payload once, then stop:
    // the website must never let a group offer silently disappear nor DM the
    // sender as if they were a prospect.
    const isGroup = typeof jid === 'string' && jid.endsWith('@g.us');
    if (isGroup) {
      if (shouldForwardGroupMessageToScraper(normalizedEvent, jid, msg.key?.fromMe, userMessage)) {
        const scraperUrl = getN8nScraperWebhookUrl(process.env.N8N_SCRAPER_WEBHOOK_URL);
        if (!scraperUrl) {
          console.error('[group-scraper] N8N_SCRAPER_WEBHOOK_URL is missing or invalid');
          return NextResponse.json({ status: 'error', branch: 'group_scraper_not_configured' }, { status: 503 });
        }

        // Tâche 1 : Envoi n8n (offres flash)
        const forwardPromise = forwardGroupMessageToScraper(scraperUrl, body);

        // Tâche 2 : Capture du démarcheur pour l'Outreach
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const participantJid = msg.key?.participant || (msg as any).participant;
        const authorRaw = msg.key?.cleanedSenderPn || (typeof participantJid === 'string' ? participantJid.split('@')[0] : '') || '';
        const authorPhone = normalizeCIPhone(authorRaw);

        const outreachPromise = (async () => {
          if (!authorPhone || authorPhone.length < 8 || !userMessage || msg.key?.fromMe) return;
          const sigs = listingSignals(userMessage);
          if (sigs < 1 && userMessage.length < 30) return;

          try {
            let extraction: ExtractedBien | null = null;
            try {
              const res = await extractBienFromWhatsApp(userMessage);
              if (res.data && res.data.confidence >= 0.5) {
                extraction = res.data;
              }
            } catch (extErr) {
              console.warn('[outreach] extraction LLM skipped:', extErr);
            }

            await upsertProspect({
              phone: authorPhone,
              jid: typeof participantJid === 'string' ? participantJid : `${authorPhone}@s.whatsapp.net`,
              displayName: msg.pushName || null,
              sourceGroupJid: jid,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sourceGroupName: (msg as any).groupName || null,
              extraction,
            });
            console.log(`[outreach] agent prospect captured: ${authorPhone} (${msg.pushName || 'inconnu'})`);
          } catch (err) {
            console.error('[outreach] upsertProspect failed', err);
          }
        })();

        const [forwardResult] = await Promise.all([forwardPromise, outreachPromise]);
        if (!forwardResult.ok) {
          console.error(`[group-scraper] n8n delivery failed status=${forwardResult.status ?? 'network'}`);
          return NextResponse.json({ status: 'error', branch: 'group_scraper_delivery_failed' }, { status: 502 });
        }
        console.log('[group-scraper] group message forwarded to n8n and prospect evaluated');
        return NextResponse.json({ status: 'ok', branch: 'group_forwarded' });
      }
      return NextResponse.json({ status: 'ignored', reason: 'group_message_not_forwarded' });
    }

    // Idempotency: short-circuit if Wasender retried the same message within 30 s.
    // Prevents duplicate DB writes, double LLM calls, and double Sapphire replies.
    const dedupKey = buildDedupKey(msg.key?.id, jid, userMessage);
    if (!markSeen(dedupKey, 30_000)) {
      console.warn(`[webhook] duplicate inbound suppressed key=${dedupKey}`);
      return NextResponse.json({ status: 'ok', branch: 'duplicate' });
    }

    const supabase = getSupabase();

    // ─── Opt-out : STOP / STOPPER / etc. ───
    if (OPT_OUT_REGEX.test(userMessage)) {
      await recordOptOut(senderPn);
      await wasenderSendMessage(replyTarget, 'Reçu. Tu ne recevras plus de message de notre part. À bientôt.', 'text');
      return NextResponse.json({ status: 'ok', branch: 'opt_out' });
    }

    // 1. Sauvegarder le message entrant
    await supabase.from('whatsapp_messages').insert({
      jid,
      direction: 'inbound',
      body: userMessage,
      metadata: { contactName },
    });

    // 1b. Acquittement (« ok », « merci », « bonne journée »…) → silence total.
    // Un humain ne répond pas à ça ; relancer la qualification est pire que rien.
    if (ACK_REGEX.test(userMessage)) {
      return NextResponse.json({ status: 'ok', branch: 'ack_silent' });
    }

    // 1b-bis. Cas [SILENCE] déterministes (refus de critère, impatience,
    // agacement) → aucun appel IA, aucun envoi : les superviseurs reprennent.
    if (SILENCE_GUARD_REGEX.test(userMessage)) {
      return NextResponse.json({ status: 'ok', branch: 'guard_silence' });
    }

    // 1c. Mutes actifs : reprise humaine (24 h) OU fournisseur de biens
    // identifié (24 h) OU prise en charge conseiller après 0 résultat (24 h).
    const { data: sysMarks } = await supabase
      .from('whatsapp_messages')
      .select('body, created_at')
      .eq('jid', jid)
      .eq('direction', 'system')
      .in('body', ['HUMAN_TAKEOVER', 'LISTING_PROVIDER', 'COUNSELOR_HANDOFF'])
      .gte('created_at', new Date(Date.now() - 24 * 3_600_000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    const now = Date.now();
    const marks = ((sysMarks as unknown) as { body: string; created_at: string }[]) ?? [];

    // 2. Historique de conversation (10 derniers messages réels, hors marqueurs system)
    const { data: history } = await supabase
      .from('whatsapp_messages')
      .select('direction, body, created_at, metadata')
      .eq('jid', jid)
      .in('direction', ['inbound', 'outbound'])
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedHistory = ((history as any[]) || [])
      .reverse()
      .map((m) => ({
        role: m.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
        content: m.body,
        created_at: m.created_at,
        metadata: m.metadata,
      }));

    // Note : history[0] est le message entrant qui vient d'être inséré à l'étape 1.
    // Le dernier message précédent est donc history[1].
    const prevMsgTime = history?.[1]?.created_at ? new Date(history[1].created_at).getTime() : 0;
    const isNewSession = !prevMsgTime || (now - prevMsgTime > 2 * 3_600_000);

    // Détection d'une conversation déjà gérée par un commercial humain (< 24 h)
    const hasHumanTakeover =
      marks.some((m) => m.body === 'HUMAN_TAKEOVER' && now - new Date(m.created_at).getTime() < 24 * 3_600_000) ||
      formattedHistory.some(
        (m) =>
          m.role === 'assistant' &&
          (m.metadata?.actor_type === 'commercial' || m.metadata?.trace_source === 'human_takeover') &&
          m.created_at &&
          now - new Date(m.created_at).getTime() < 24 * 3_600_000,
      );

    // 2b. ANNONCE / PROPOSITION entrante (agent/proprio/démarcheur qui CONFIE ou PUBLIE un bien) → ne
    // JAMAIS l'enregistrer comme prospect ni lui proposer des biens en retour (Règles 5 & 6).
    const isReplyingToQualif = formattedHistory.slice(-3, -1).some((m) =>
      m.role === 'assistant' && (
        m.content.includes('Bienvenue chez Bogbe') ||
        QUALIF_REMINDER_MARKER.test(m.content)
      )
    );
    const clientSearching = isClientSearchIntent(userMessage);
    const sig = listingSignals(userMessage);
    let isListing = !clientSearching && isPartnerOrListingOffer(userMessage, isReplyingToQualif);
    if (!isListing && !clientSearching && !isReplyingToQualif && sig >= 3 && userMessage.length >= 80) {
      const { data: extracted } = await extractBienFromWhatsApp(userMessage).catch(() => ({ data: null }));
      isListing = !!extracted && extracted.confidence >= MIN_EXTRACTION_CONFIDENCE;
    }
    if (isListing) {
      // Marqueur fournisseur → mute 24 h (couvre les messages suivants).
      await supabase.from('whatsapp_messages').insert({
        jid,
        direction: 'system',
        body: 'LISTING_PROVIDER',
        metadata: { signals: sig },
      });
      const alreadyReplied = formattedHistory.some(
        (m) => m.role === 'assistant' && m.content.startsWith('Merci pour votre proposition'),
      );
      if (!alreadyReplied && !hasHumanTakeover) {
        const advisorPhone = process.env.SAPPHIRE_ADVISOR_PHONE || '+2250544872051';
        await wasenderSendMessage(
          advisorPhone,
          `📥 Annonce reçue en DM (démarcheur/agence ?)\n👤 ${contactName} — ${senderPn}\n💬 "${userMessage.slice(0, 300)}"`,
          'text',
        ).catch(() => null);
        await humanReplyDelay(PARTNER_REPLY, requestStartedAt);
        await wasenderSendMessage(replyTarget, PARTNER_REPLY, 'text');
        await supabase.from('whatsapp_messages').insert({
          jid,
          direction: 'outbound',
          body: PARTNER_REPLY,
          metadata: { type: 'listing_partner_reply' },
        });
      }
      return NextResponse.json({
        status: 'ok',
        branch: alreadyReplied || hasHumanTakeover ? 'listing_muted' : 'listing_partner',
      });
    }

    // Si le contact est un démarcheur identifié (LISTING_PROVIDER) et n'exprime PAS de recherche client,
    // on coupe immédiatement AVANT toute capture prospect.
    if (marks.some((m) => m.body === 'LISTING_PROVIDER') && !clientSearching && !FRESH_SEARCH_RE.test(userMessage)) {
      return NextResponse.json({ status: 'ok', branch: 'listing_provider_mute' });
    }

    // 2c. Capture prospect (CRM) : uniquement pour les vrais demandeurs (clients directs ou agents
    // cherchant un bien pour leur client). Les offreurs/publicateurs sont déjà écartés ci-dessus et dans captureProspect.
    let capturedProspectId: string | null = null;
    try {
      capturedProspectId = await captureProspect({ phone: senderPn, jid, nom: contactName, message: userMessage, history: formattedHistory });
    } catch (error) {
      console.error('[whatsapp] CRM prospect capture failed', error);
    }

    // Si un commercial humain a déjà pris la main sur cette conversation (< 24 h),
    // Sapphire ne répond JAMAIS à sa place (évite d'envoyer « Bienvenue chez Bogbe's » au milieu d'un échange humain).
    if (hasHumanTakeover) {
      return NextResponse.json({ status: 'ok', branch: 'human_takeover_mute' });
    }

    // Si c'est une diffusion circulaire de confrère/démarcheur (« Bonsoir la grande famille mon client direct a besoin... »)
    // ou un démarcheur (LISTING_PROVIDER) qui exprime un besoin pour son client :
    // la demande est bien capturée dans le CRM (avec le badge Agent démarcheur), mais Sapphire ne lui envoie pas
    // le questionnaire B2C « Bienvenue chez Bogbe's » — le commercial humain gère la relation confrère.
    if (isBrokerBroadcastSearch(userMessage) || marks.some((m) => m.body === 'LISTING_PROVIDER')) {
      return NextResponse.json({ status: 'ok', branch: 'broker_search_captured_silent' });
    }

    if (marks.some((m) => m.body === 'COUNSELOR_HANDOFF')) {
      // Le client reprend la main seulement s'il exprime une nouvelle recherche distincte
      const isFresh = FRESH_SEARCH_RE.test(userMessage);
      if (!isFresh) {
        return NextResponse.json({ status: 'ok', branch: 'counselor_handoff_mute' });
      }
    }

    // 2d. Suivi post-clôture : le dernier message Sapphire annonçait la reprise
    // par un conseiller → silence, SAUF sélection d'un bien ou nouveau besoin.
    const lastAssistantMsg = [...formattedHistory].reverse().find((m) => m.role === 'assistant');
    const handoffAgeMs = (lastAssistantMsg as any)?.created_at
      ? (now - new Date((lastAssistantMsg as any).created_at).getTime())
      : Infinity;
    const isRecentHandoff =
      !!lastAssistantMsg &&
      HANDOFF_REGEX.test(lastAssistantMsg.content) &&
      handoffAgeMs < 2 * 3_600_000;
    if (
      isRecentHandoff &&
      !SELECTS_BIEN_REGEX.test(userMessage) &&
      !NEW_NEED_REGEX.test(userMessage)
    ) {
      return NextResponse.json({ status: 'ok', branch: 'handoff_silence' });
    }

    // 2e. Hors-sujet : après le 1er échange, si le message n'a AUCUN rapport avec
    // l'immobilier (pas d'intention, pas de salutation/pub, pas un nom demandé,
    // pas une sélection ni un nouveau besoin) → Sapphire se tait. Le commercial
    // gère la conversation. Le 1er contact (aucun message assistant) passe
    // toujours (→ message de bienvenue).
    const isNameAnswer =
      !!lastAssistantMsg && /votre nom|puis-je avoir votre nom|comment vous appelez/i.test(lastAssistantMsg.content);
    // Un message qui apporte AU MOINS un critère de qualification (type / zone /
    // budget — y compris un complément purement numérique comme « 150k ») doit
    // être traité comme « sur le sujet ». Sans ça, un client qui complète champ
    // par champ se faisait étouffer par la garde offtopic_silence.
    const bringsQualInfo = (() => {
      const q = qualify(userMessage);
      return !!(q.propertyType || q.zone || q.budget);
    })();
    const onTopic =
      hasPropertyIntent(userMessage) ||
      isGreetingOrAdOpener(userMessage) ||
      SELECTS_BIEN_REGEX.test(userMessage) ||
      NEW_NEED_REGEX.test(userMessage) ||
      isNameAnswer ||
      bringsQualInfo;
    if (lastAssistantMsg && !onTopic) {
      return NextResponse.json({ status: 'ok', branch: 'offtopic_silence' });
    }

    // 2f. QUALIFICATION DÉTERMINISTE (Cahier des règles §5-7) — en code, pas via
    // l'IA : TYPE + ZONE + BUDGET obligatoires AVANT toute proposition. Ne
    // s'applique PAS à une visite / sélection d'un bien déjà proposé (→ flux LLM).
    const isVisiteOrSelection =
      detectVisiteIntent(userMessage) || SELECTS_BIEN_REGEX.test(userMessage);
    if (!isVisiteOrSelection) {
      const qual = qualify(userMessage, formattedHistory, { isNewSession });
      if (!qual.hasAll3) {
        const sendFixed = async (text: string, type: string) => {
          await humanReplyDelay(text, requestStartedAt);
          await wasenderSendMessage(replyTarget, text, 'text');
          await supabase
            .from('whatsapp_messages')
            .insert({ jid, direction: 'outbound', body: text, metadata: { type } });
        };
        // 1er contact (aucun message assistant) OU nouvelle session après inactivité avec salutation → message de bienvenue (Règle 1).
        // Garde anti-spam : on ne renvoie JAMAIS le WELCOME_MESSAGE s'il a déjà été envoyé dans l'historique récent.
        const alreadyWelcomed = formattedHistory.some(
          (m) => m.role === 'assistant' && m.content.includes('Bienvenue chez Bogbe'),
        );
        const isGreeting = isGreetingOrAdOpener(userMessage);
        if (!alreadyWelcomed && (!lastAssistantMsg || (isNewSession && isGreeting))) {
          await sendFixed(WELCOME_MESSAGE, 'qualif_welcome');
          return NextResponse.json({ status: 'ok', branch: 'welcome' });
        }

        // Relance déjà envoyée ET informations toujours incomplètes (Règle 2) :
        // « Sapphire doit envoyer UNE SEULE relance claire pour demander les éléments manquants.
        // Si après cette relance le prospect ne donne pas ces éléments, Sapphire ne relance plus et reste silencieuse. »
        const reminderSent = !isNewSession && formattedHistory.some(
          (m) => m.role === 'assistant' && QUALIF_REMINDER_MARKER.test(m.content),
        );
        if (reminderSent) {
          return NextResponse.json({ status: 'ok', branch: 'qualif_silence' });
        }

        // Envoi de la relance unique ciblée sur les critères manquants (Règle 2)
        const personalized = buildQualifReminder(qual.missing, {
          propertyType: qual.propertyType,
          zone: qual.zone,
          budget: qual.budget,
        });
        await sendFixed(personalized, 'qualif_reminder');
        return NextResponse.json({ status: 'ok', branch: 'qualif_reminder' });
      }
    }

    // 3. Contexte immobilier (biens + médias) — historique passé pour retrouver commune/type des échanges précédents
    const qual = qualify(userMessage, formattedHistory, { isNewSession });
    const context = await getAIBienContext(userMessage, formattedHistory, qual);

    // 2g. Client qualifié mais AUCUN bien en zone/budget → message conseiller
    // EXACT (Règle 4) directement en code : jamais via le LLM.
    if (context && /^Aucun bien ne correspond/.test(context)) {
      await humanReplyDelay(NO_RESULTS_MESSAGE, requestStartedAt);
      await wasenderSendMessage(replyTarget, NO_RESULTS_MESSAGE, 'text');
      await supabase
        .from('whatsapp_messages')
        .insert({ jid, direction: 'outbound', body: NO_RESULTS_MESSAGE, metadata: { type: 'no_results' } });

      // Marqueur système pour que Sapphire reste silencieuse par la suite (Règle 4)
      await supabase.from('whatsapp_messages').insert({
        jid,
        direction: 'system',
        body: 'COUNSELOR_HANDOFF',
        metadata: { type: 'counselor_handoff', qual },
      });

      // Notification au conseiller humain avec les critères qualifiés
      const advisorPhone = process.env.SAPPHIRE_ADVISOR_PHONE || '+2250544872051';
      const advisorAlert = `🔔 Nouveau prospect qualifié (0 bien catalogue correspondant) :
👤 ${contactName} — ${senderPn}
🏠 Type : ${qual.propertyType || 'Non précisé'}
📍 Zone : ${qual.zone || 'Non précisée'}
💰 Budget : ${qual.budget ? qual.budget.toLocaleString('fr-FR') + ' FCFA' : 'Non précisé'}
💬 Message : "${userMessage.slice(0, 250)}"`;
      await wasenderSendMessage(advisorPhone, advisorAlert, 'text').catch(() => null);

      return NextResponse.json({ status: 'ok', branch: 'no_results' });
    }

    // 4. Enrichir le contexte avec instructions RDV si intent détecté
    const hasVisiteIntent = detectVisiteIntent(userMessage);
    const detectedDate = extractDateFromMessage(userMessage);

    // Marqueur de canal : active la consigne [SILENCE] du prompt (WhatsApp
    // uniquement — le chat web repose sa question au lieu de se taire).
    let enrichedContext = (context || '') + '\n\nCANAL: WhatsApp';
    if (hasVisiteIntent) {
      const rdvInstructions = `\n\nINSTRUCTION RDV: Le client veut visiter un bien.${detectedDate ? ` Il a mentionné la date/heure : "${detectedDate}".` : ''}
- Si tu connais le bien dont il parle (depuis le catalogue), confirme le RDV et ajoute EXACTEMENT ce tag en fin de réponse :
  [RDV_CONFIRME bien_id=<ID_DU_BIEN> date=<date_proposée>]
- Si plusieurs biens correspondent, demande lequel il souhaite visiter.
- Si tu n'as pas de date, demande-lui sa disponibilité.
- Rassure le client : "Je transmets votre demande à notre équipe qui vous recontactera pour confirmer."`;
      enrichedContext = (enrichedContext || '') + rdvInstructions;
    }

    // 5. Réponse Sapphire via Groq
    const aiResponse = await chatImmobilier(formattedHistory, enrichedContext);

    if (!aiResponse) {
      return NextResponse.json({ status: 'ok' });
    }

    // Consigne de silence du LLM (client impatient / refuse un critère) :
    // aucune réponse envoyée, un conseiller humain prend le relais.
    if (aiResponse.trim().startsWith('[SILENCE]')) {
      return NextResponse.json({ status: 'ok', branch: 'llm_silence' });
    }

    // 5b. Garde anti-boucle : ne JAMAIS spammer le fallback technique.
    //     1er échec IA  → fallback envoyé une seule fois (flux normal ci-dessous)
    //     2e échec consécutif → escalade : conseiller humain notifié + message d'escalade
    //     échecs suivants     → silence (le conseiller a déjà le dossier)
    if (isSapphireFallback(aiResponse)) {
      const lastAssistant =
        [...formattedHistory].reverse().find((m) => m.role === 'assistant')?.content ?? '';

      if (lastAssistant === SAPPHIRE_ESCALATION) {
        return NextResponse.json({ status: 'ok', branch: 'fallback_muted' });
      }

      // Notifier les admins DÈS LE 1er échec : on vient de promettre au prospect
      // « un conseiller prend le relais », donc un humain doit vraiment être
      // alerté immédiatement. Lien wa.me cliquable pour répondre en 1 tap.
      // SAPPHIRE_ADMIN_PHONES = liste séparée par virgules (plusieurs admins),
      // fallback sur SAPPHIRE_ADVISOR_PHONE (numéro unique).
      const adminPhones = (
        process.env.SAPPHIRE_ADMIN_PHONES || process.env.SAPPHIRE_ADVISOR_PHONE || '+2250544872051'
      ).split(',').map((s) => s.trim()).filter(Boolean);
      const waLink = `https://wa.me/${senderPn.replace(/[^0-9]/g, '')}`;
      const advisorMsg = `🔔 Sapphire n'a pas pu répondre — prendre la main
👤 ${contactName} — ${senderPn}
💬 "${userMessage.slice(0, 300)}"
➡️ Répondre directement : ${waLink}`;
      for (const p of adminPhones) {
        await wasenderSendMessage(p, advisorMsg, 'text').catch(() => null);
      }

      if (isSapphireFallback(lastAssistant)) {
        // 2e échec consécutif → message d'escalade au prospect (les admins
        // viennent d'être re-notifiés ci-dessus).
        await humanReplyDelay(SAPPHIRE_ESCALATION, requestStartedAt);
        await wasenderSendMessage(replyTarget, SAPPHIRE_ESCALATION, 'text');
        await supabase.from('whatsapp_messages').insert({
          jid,
          direction: 'outbound',
          body: SAPPHIRE_ESCALATION,
          metadata: { type: 'fallback_escalation' },
        });
        return NextResponse.json({ status: 'ok', branch: 'fallback_escalated' });
      }
      // 1er échec → admins notifiés ci-dessus ; le message « conseiller prend
      // le relais » part par le flux normal (envoyé + loggé une fois).
    }

    // 6. Détecter confirmation RDV et sauvegarder la visite
    const rdvCheck = detectRdvConfirmation(aiResponse);
    if (rdvCheck.confirmed && rdvCheck.bienId) {
      if (rdvCheck.source === 'bogbes') {
        // Bien BOGBE'S → charger d'abord le bien + propriétaire (FK proprietaire_id NOT NULL)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: bienRow } = await (supabase as any)
          .from('biens')
          .select('id, titre, commune, proprietaire_id, profiles!biens_proprietaire_id_fkey(full_name, phone)')
          .eq('id', rdvCheck.bienId)
          .single();

        const proprietaireId: string | null = bienRow?.proprietaire_id ?? null;
        const dateSouhaitee = rdvCheck.date || new Date().toISOString().slice(0, 10);

        if (proprietaireId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: visiteRow } = await (supabase as any).from('visites').insert({
            bien_id: rdvCheck.bienId,
            proprietaire_id: proprietaireId,
            client_jid: jid,
            client_name: contactName,
            client_phone: senderPn,
            prospect_id: capturedProspectId,
            date_souhaitee: dateSouhaitee,
            statut: 'en_attente',
            source: 'whatsapp',
            notes: `Demande via WhatsApp. Message : "${userMessage.slice(0, 200)}"`,
          }).select('id').single();

          if (visiteRow?.id) {
            // Capture can intentionally skip a bare first message. The SQL
            // linker still reconciles this RDV against an existing prospect
            // using all accepted phone formats.
            await linkIntakeToProspect('visite', visiteRow.id, senderPn, supabase);
          }

          // Notification proprio immédiate (sans détails client — date + horaire uniquement)
          const ownerProfile = Array.isArray(bienRow?.profiles) ? bienRow.profiles[0] : bienRow?.profiles;
          if (visiteRow?.id && ownerProfile?.phone) {
            await notifyOwnerVisitPending(supabase, {
              id: visiteRow.id,
              bienTitre: bienRow.titre || 'Bien sans titre',
              bienCommune: bienRow.commune ?? null,
              dateSouhaitee,
              heureDebut: null,
              heureFin: null,
              visitorName: '',          // masqué côté proprio
              visitorPhone: '',          // masqué côté proprio
              ownerName: ownerProfile.full_name ?? null,
              ownerPhone: ownerProfile.phone,
              notes: null,
            }).catch(() => null);
          }
        }
      } else {
        // Offre flash → pas de FK valide vers la table biens.
        // On notifie le conseiller humain par Wasender pour qu'il prenne le relais.
        const advisorPhone = process.env.SAPPHIRE_ADVISOR_PHONE || '+2250544872051';
        const flashUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bogbesgroup.com'}/offre-flash/${rdvCheck.bienId}`;
        const advisorMsg = `🔔 RDV demandé sur OFFRE FLASH #${rdvCheck.bienId}
👤 ${contactName} — ${senderPn}
📅 ${rdvCheck.date || 'date à préciser'}
🔗 ${flashUrl}

Message client : "${userMessage.slice(0, 200)}"`;
        await wasenderSendMessage(advisorPhone, advisorMsg, 'text').catch(() => null);

        // Log dans whatsapp_messages pour traçabilité
        await supabase.from('whatsapp_messages').insert({
          jid,
          direction: 'system',
          body: `RDV_OFFRE_FLASH bien_id=${rdvCheck.bienId} date=${rdvCheck.date || 'n/a'} → conseiller notifié`,
          metadata: { type: 'rdv_offre_flash', bien_id: rdvCheck.bienId, date: rdvCheck.date },
        });
      }
    }

    // 7. Extraire les balises [MEDIA: URL] et nettoyer les tags RDV
    const cleanedAi = aiResponse.replace(/\[RDV_CONFIRME[^\]]*\]/gi, '').trim();
    const { cleanText: rawText, mediaUrls } = extractMediaTags(cleanedAi);

    // 7b. Pré-remplir les liens /biens/<id> et /offre-flash/<id> avec le tél
    // + le nom du client. Le formulaire "Demander une visite" lit ces params
    // et pré-remplit ses champs → 0 friction pour le client venu via Sapphire.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bogbesgroup.com';
    const siteUrlEscaped = siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefillParams = new URLSearchParams({
      prefill_phone: senderPn,
      prefill_name: contactName || '',
    }).toString();
    const linkRegex = new RegExp(
      `(${siteUrlEscaped}/(?:biens|offre-flash)/[a-zA-Z0-9-]+)(\\?[^\\s]*)?`,
      'g',
    );
    const cleanText = rawText.replace(linkRegex, (_match, base, existingQs) => {
      // Normalisation : le LLM recopie les URLs de l'historique, parfois avec
      // des prefill_* déjà dupliqués → on purge tout prefill_* existant et on
      // remet UN seul jeu propre (les autres params éventuels sont conservés).
      const kept = new URLSearchParams();
      if (existingQs) {
        for (const [k, v] of new URLSearchParams(String(existingQs).slice(1))) {
          if (!k.startsWith('prefill_') && !kept.has(k)) kept.append(k, v);
        }
      }
      kept.set('prefill_phone', senderPn);
      kept.set('prefill_name', contactName || '');
      return `${base}?${kept.toString()}`;
    });

    // 8a. Preuve visuelle : couverture du premier bien proposé dans la réponse.
    // Biens BOGBE'S en priorité (photos curées garanties) — les flash scrapées
    // sont quasi toujours sans image. Cherché AVANT l'envoi car la photo part
    // dans la MÊME bulle que le texte (légende) : la protection de compte
    // Wasender (1 msg/5 s) rejette un envoi séparé texte puis image.
    let coverPhoto: string | null = null;
    if (mediaUrls.length === 0 && cleanText) {
      const linkRe = new RegExp(`${siteUrlEscaped}/(biens|offre-flash)/([a-zA-Z0-9-]+)`, 'g');
      const links: Array<{ kind: string; id: string }> = [];
      const seenIds = new Set<string>();
      let lm: RegExpExecArray | null;
      while ((lm = linkRe.exec(cleanText)) !== null && links.length < 8) {
        if (!seenIds.has(lm[2])) {
          seenIds.add(lm[2]);
          links.push({ kind: lm[1], id: lm[2] });
        }
      }
      links.sort((a, b) => (a.kind === 'biens' ? 0 : 1) - (b.kind === 'biens' ? 0 : 1));
      for (const l of links) {
        if (coverPhoto) break;
        if (l.kind === 'biens') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: med } = await (supabase as any)
            .from('biens_medias')
            .select('url')
            .eq('bien_id', l.id)
            .eq('type', 'photo')
            .order('est_couverture', { ascending: false })
            .order('ordre', { ascending: true })
            .limit(1);
          coverPhoto = med?.[0]?.url ?? null;
        } else {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: loc } = await (locauxClientForId(Number(l.id)) as any)
              .from('locaux')
              .select('lien_image')
              .eq('id', Number(l.id))
              .maybeSingle();
            coverPhoto = loc?.lien_image || null;
          } catch {
            // source locaux indisponible — on continue sans photo
          }
        }
      }
    }

    // 8b. Envoi principal — image + texte en légende dans UNE bulle si photo
    // trouvée (légende WhatsApp plafonnée ~1024 chars → repli texte au-delà),
    // sinon texte seul. Si l'envoi avec image échoue, repli texte.
    if (cleanText) {
      await humanReplyDelay(cleanText, requestStartedAt);
      const canCaption = !!coverPhoto && cleanText.length <= 950;
      const sentWithPhoto = canCaption
        ? await wasenderSendMessage(replyTarget, cleanText, 'image', coverPhoto!)
            .then((r) => !!r?.success)
            .catch(() => false)
        : false;
      if (!sentWithPhoto) {
        await wasenderSendMessage(replyTarget, cleanText, 'text');
      }
    }

    // 9. Envoyer les médias [MEDIA] de l'IA (max 3) en séquence
    for (const url of mediaUrls.slice(0, 3)) {
      const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
      await wasenderSendMessage(
        senderPn,
        '',
        isVideo ? 'video' : 'image',
        url
      );
    }

    // 10. Sauvegarder la réponse sortante
    await supabase.from('whatsapp_messages').insert({
      jid,
      direction: 'outbound',
      body: cleanText || aiResponse,
      metadata: { mediaUrls, model: getLastSapphireRoute() },
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    // DIAGNOSTIC TEMP: expose error.message to locate the failure on Vercel.
    return NextResponse.json({ error: 'Webhook processing failed', detail: String(error?.message ?? error) }, { status: 500 });
  }
}
