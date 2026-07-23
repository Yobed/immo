import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { wasenderSendMessage, verifyWasenderSignature } from '@/lib/wasender';
import { locauxClientForId } from '@/lib/supabase/locaux';
import { chatImmobilier, isSapphireFallback, SAPPHIRE_ESCALATION, getLastSapphireRoute } from '@/lib/ai';
import { getAIBienContext } from '@/lib/ai/tools';
import { extractBienFromWhatsApp } from '@/lib/extractors/whatsapp-bien-extractor';
import { upsertProspect, recordOptOut } from '@/lib/outreach/agent-prospects';
import { tryInviteProspect } from '@/lib/outreach/dispatch';
import { notifyOwnerVisitPending } from '@/lib/notifications/whatsapp-notifier';
import { markSeen } from '@/lib/idempotency';

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
const HANDOFF_REGEX = /conseiller commercial va prendre (le relais|la rel[eè]ve)/i;

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

/**
 * Signaux d'ANNONCE immobilière entrante : un agent/propriétaire/démarcheur
 * qui CONFIE un bien, à ne surtout pas traiter comme un client qui cherche.
 * Vocabulaire réel des annonces WhatsApp CI (cf. captures terrain) :
 * « 8.000.000/ lot », « 700milles * 5mois », « Com : 40% », « mandataire
 * exclusif », « morcelable », « TF », prix au m², hectares…
 * ≥3 signaux = annonce sûre ; 1-2 signaux sur message long = confirmation IA.
 */
function listingSignals(text: string): number {
  let score = 0;
  if (/\b[àa]\s+(louer|vendre)\b|\bdisponibles?\b|\bdispo\b/i.test(text)) score++;
  if (
    /\d[\d\s.,]*\s*(fcfa|f\s?cfa|francs?|millions?|milles?)\b/i.test(text) ||
    /\b\d{1,3}(?:[.,]\d{3}){2,}\b/.test(text) || // 8.000.000 sans devise
    /\d\s*\/\s*(m²|m2|lot|mois)\b/i.test(text) // prix au m² / au lot
  ) score++;
  if (/\b(villas?|studios?|appartements?|duplex|triplex|terrains?|magasins?|bureaux?|entrep[ôo]ts?|r\+\d|pi[èe]ces?|chambres?|lots?|hectares?)\b/i.test(text)) score++;
  if (/\b(caution|avances?|loyers?|mois de loyer|superficie|m2|m²|titre foncier|tf\b|acd|loti[es]?|morcelable|documents?)\b/i.test(text)) score++;
  if (/\b(commissions?|com\s*[:.]?\s*\d{1,2}\s*%|mandataires?|d[ée]marcheurs?|je suis directe?|apporteur)\b/i.test(text)) score++;
  if (/(\+?225[\s.]?\d{2}|\b0[157][\s.]?\d{2})[\s.]?\d{2}[\s.]?\d{2}/.test(text) || /\b\d{10}\b/.test(text)) score++;
  return score;
}

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

export async function POST(req: NextRequest) {
  const requestStartedAt = Date.now();
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    // Verify signature if present.
    // Log entry pour diagnostiquer les 401 silencieux : on saura toujours
    // qu'un payload est arrivé même quand la signature ne matche pas.
    console.log(`[Webhook] POST received bodyLen=${rawBody.length} hasSig=${!!signature} sigPrefix=${signature?.slice(0, 8) ?? 'none'}`);
    if (signature && !verifyWasenderSignature(rawBody, signature)) {
      console.warn('[Webhook] Signature invalid — rejecting with 401');
      return NextResponse.json({error: 'Invalid signature'}, {status: 401})
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    // Wasender envoie 2 events pour chaque message entrant (messages.received
    // ET messages.upsert). On NE traite QUE messages.upsert pour éviter de
    // répondre 2 fois au même message. Les autres events sont ignorés silencieusement.
    if (event !== 'messages.upsert') {
      return NextResponse.json({ status: 'ignored', reason: `event=${event} not processed (only messages.upsert)` });
    }

    const messages = data?.messages;
    if (!messages) return NextResponse.json({ status: 'ignored' });

    const msg = Array.isArray(messages) ? messages[0] : messages;

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
          .select('body')
          .eq('jid', jid)
          .eq('direction', 'outbound')
          .gte('created_at', new Date(Date.now() - 5 * 60_000).toISOString())
          .limit(10);
        const isOurBot = (((recentOut as unknown) as { body: string }[]) ?? []).some(
          (r) => r.body === userMessage,
        );
        if (!isOurBot) {
          await sb.from('whatsapp_messages').insert({
            jid,
            direction: 'system',
            body: 'HUMAN_TAKEOVER',
            metadata: { preview: String(userMessage).slice(0, 80) },
          });
        }
      }
      return NextResponse.json({ status: 'ignored' });
    }

    const rawPn = msg.key?.cleanedSenderPn || jid?.split('@')[0] || '';
    // Normalize Ivory Coast 8-digit legacy format (22544872051) → 10-digit (2250544872051)
    const senderPn = normalizeCIPhone(rawPn);
    const contactName = msg.pushName || 'Client';

    // Remove: user message content must not be logged in production

    if (!senderPn || !userMessage) {
      return NextResponse.json({ status: 'ignored' });
    }

    // Idempotency: short-circuit if Wasender retried the same message within 30 s.
    // Prevents duplicate DB writes, double LLM calls, and double Sapphire replies.
    const dedupKey = buildDedupKey(msg.key?.id, jid, userMessage)
    if (!markSeen(dedupKey, 30_000)) {
      console.warn(`[webhook] duplicate inbound suppressed key=${dedupKey}`)
      return NextResponse.json({ status: 'ok', branch: 'duplicate' })
    }

    const supabase = getSupabase();

    // ─── Branche OUTREACH : message provenant d'un groupe public ───
    const isGroupMessage = typeof jid === 'string' && jid.endsWith('@g.us');
    if (isGroupMessage) {
      // 1. Extraction de l'annonce (silencieux : on ne répond JAMAIS dans le groupe)
      const { data: extracted } = await extractBienFromWhatsApp(userMessage);
      const isAd = !!extracted && extracted.confidence >= MIN_EXTRACTION_CONFIDENCE;
      if (!isAd) {
        return NextResponse.json({ status: 'ok', branch: 'group_no_ad' });
      }

      // 2. Upsert prospect (par numéro)
      const prospect = await upsertProspect({
        phone: senderPn,
        jid: msg.key?.participant || jid,
        displayName: contactName,
        sourceGroupJid: jid,
        sourceGroupName: msg.subject || null,
        extraction: extracted,
      });

      // 3. Tentative d'envoi DM privé (cooldown + quota gérés en interne)
      const result = await tryInviteProspect(prospect);
      return NextResponse.json({
        status: 'ok',
        branch: 'group_outreach',
        invited: result.sent,
        reason: result.sent ? undefined : result.reason,
      });
    }

    // ─── Opt-out : STOP / STOPPER / etc. ───
    if (OPT_OUT_REGEX.test(userMessage)) {
      await recordOptOut(senderPn);
      await wasenderSendMessage(senderPn, 'Reçu. Tu ne recevras plus de message de notre part. À bientôt.', 'text');
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

    // 1c. Mutes actifs : reprise humaine (60 min) OU fournisseur de biens
    // identifié (24 h — un démarcheur envoie souvent son annonce en PLUSIEURS
    // messages : texte, photos, « Com : 40% »… tous doivent rester sans réponse).
    const { data: sysMarks } = await supabase
      .from('whatsapp_messages')
      .select('body, created_at')
      .eq('jid', jid)
      .eq('direction', 'system')
      .in('body', ['HUMAN_TAKEOVER', 'LISTING_PROVIDER'])
      .gte('created_at', new Date(Date.now() - 24 * 3_600_000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    const now = Date.now();
    const marks = ((sysMarks as unknown) as { body: string; created_at: string }[]) ?? [];
    if (marks.some((m) => m.body === 'HUMAN_TAKEOVER' && now - new Date(m.created_at).getTime() < 3_600_000)) {
      return NextResponse.json({ status: 'ok', branch: 'human_takeover_mute' });
    }
    if (marks.some((m) => m.body === 'LISTING_PROVIDER')) {
      return NextResponse.json({ status: 'ok', branch: 'listing_provider_mute' });
    }

    // 2. Historique de conversation (10 derniers messages)
    const { data: history } = await supabase
      .from('whatsapp_messages')
      .select('direction, body')
      .eq('jid', jid)
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedHistory = ((history as any[]) || [])
      .reverse()
      .map((m) => ({
        role: m.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
        content: m.body,
      }));

    // 2b. ANNONCE entrante (agent/proprio/démarcheur qui CONFIE un bien) → ne
    // JAMAIS proposer des biens en retour. Détection 2 étages : ≥3 signaux =
    // annonce sûre ; 1-2 signaux sur message long = confirmation par le même
    // extracteur IA que le scraping des groupes (il reconnaît les annonces).
    const sig = listingSignals(userMessage);
    let isListing = sig >= 3;
    if (!isListing && sig >= 1 && userMessage.length >= 80) {
      const { data: extracted } = await extractBienFromWhatsApp(userMessage).catch(() => ({ data: null }));
      isListing = !!extracted && extracted.confidence >= MIN_EXTRACTION_CONFIDENCE;
    }
    if (isListing) {
      // Marqueur fournisseur → mute 24 h (couvre les fragments suivants :
      // photos, « Com : 40% », vidéos…). Le conseiller reprend la main.
      await supabase.from('whatsapp_messages').insert({
        jid,
        direction: 'system',
        body: 'LISTING_PROVIDER',
        metadata: { signals: sig },
      });
      const alreadyReplied = formattedHistory.some(
        (m) => m.role === 'assistant' && m.content.startsWith('Merci pour votre proposition'),
      );
      if (!alreadyReplied) {
        const advisorPhone = process.env.SAPPHIRE_ADVISOR_PHONE || '+2250544872051';
        await wasenderSendMessage(
          advisorPhone,
          `📥 Annonce reçue en DM (démarcheur/agence ?)\n👤 ${contactName} — ${senderPn}\n💬 "${userMessage.slice(0, 300)}"`,
          'text',
        ).catch(() => null);
        await humanReplyDelay(PARTNER_REPLY, requestStartedAt);
        await wasenderSendMessage(senderPn, PARTNER_REPLY, 'text');
        await supabase.from('whatsapp_messages').insert({
          jid,
          direction: 'outbound',
          body: PARTNER_REPLY,
          metadata: { type: 'listing_partner_reply' },
        });
      }
      return NextResponse.json({
        status: 'ok',
        branch: alreadyReplied ? 'listing_muted' : 'listing_partner',
      });
    }

    // 2c. Suivi post-clôture : le dernier message Sapphire annonçait la reprise
    // par un conseiller → silence, SAUF sélection d'un bien ou nouveau besoin.
    const lastAssistantMsg = [...formattedHistory].reverse().find((m) => m.role === 'assistant');
    if (
      lastAssistantMsg &&
      HANDOFF_REGEX.test(lastAssistantMsg.content) &&
      !SELECTS_BIEN_REGEX.test(userMessage) &&
      !NEW_NEED_REGEX.test(userMessage)
    ) {
      return NextResponse.json({ status: 'ok', branch: 'handoff_silence' });
    }

    // 3. Contexte immobilier (biens + médias) — historique passé pour retrouver commune/type des échanges précédents
    const context = await getAIBienContext(userMessage, formattedHistory);

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
        await wasenderSendMessage(senderPn, SAPPHIRE_ESCALATION, 'text');
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
            date_souhaitee: dateSouhaitee,
            statut: 'en_attente',
            source: 'whatsapp',
            notes: `Demande via WhatsApp. Message : "${userMessage.slice(0, 200)}"`,
          }).select('id').single();

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
        const flashUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app'}/offre-flash/${rdvCheck.bienId}`;
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app';
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
        ? await wasenderSendMessage(senderPn, cleanText, 'image', coverPhoto!)
            .then((r) => !!r?.success)
            .catch(() => false)
        : false;
      if (!sentWithPhoto) {
        await wasenderSendMessage(senderPn, cleanText, 'text');
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
    // Don't log error details — may contain user data
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
