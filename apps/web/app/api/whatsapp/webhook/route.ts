import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { wasenderSendMessage, verifyWasenderSignature } from '@/lib/wasender';
import { chatImmobilier } from '@/lib/ai';
import { getAIBienContext } from '@/lib/ai/tools';
import { extractBienFromWhatsApp } from '@/lib/extractors/whatsapp-bien-extractor';
import { upsertProspect, recordOptOut } from '@/lib/outreach/agent-prospects';
import { tryInviteProspect } from '@/lib/outreach/dispatch';
import { notifyOwnerVisitPending } from '@/lib/notifications/whatsapp-notifier';

const MIN_EXTRACTION_CONFIDENCE = 0.7;
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
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    // Verify signature if present
    if (signature && !verifyWasenderSignature(rawBody, signature)) {
      return NextResponse.json({error: 'Invalid signature'}, {status: 401})
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    if (event !== 'messages.received' && event !== 'messages.upsert') {
      return NextResponse.json({ status: 'ignored' });
    }

    const messages = data?.messages;
    if (!messages) return NextResponse.json({ status: 'ignored' });

    const msg = Array.isArray(messages) ? messages[0] : messages;

    if (msg.key?.fromMe) {
      return NextResponse.json({ status: 'ignored' });
    }

    const jid = msg.key?.remoteJid;
    const rawPn = msg.key?.cleanedSenderPn || jid?.split('@')[0] || '';
    // Normalize Ivory Coast 8-digit legacy format (22544872051) → 10-digit (2250544872051)
    const senderPn = normalizeCIPhone(rawPn);
    const contactName = msg.pushName || 'Client';

    const userMessage =
      msg.messageBody ||
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.text ||
      '';

    // Remove: user message content must not be logged in production

    if (!senderPn || !userMessage) {
      return NextResponse.json({ status: 'ignored' });
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

    // 3. Contexte immobilier (biens + médias) — historique passé pour retrouver commune/type des échanges précédents
    const context = await getAIBienContext(userMessage, formattedHistory);

    // 4. Enrichir le contexte avec instructions RDV si intent détecté
    const hasVisiteIntent = detectVisiteIntent(userMessage);
    const detectedDate = extractDateFromMessage(userMessage);

    let enrichedContext = context || undefined;
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
      if (existingQs) {
        return `${base}${existingQs}&${prefillParams}`;
      }
      return `${base}?${prefillParams}`;
    });

    // 8. Envoyer le texte principal
    if (cleanText) {
      await wasenderSendMessage(senderPn, cleanText, 'text');
    }

    // 9. Envoyer les médias (max 3) en séquence
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
      metadata: { mediaUrls },
    });

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    // Don't log error details — may contain user data
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
