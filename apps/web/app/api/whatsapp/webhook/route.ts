import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { wasenderSendMessage, verifyWasenderSignature } from '@/lib/wasender';
import { chatImmobilier } from '@/lib/ai';
import { getAIBienContext } from '@/lib/ai/tools';

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
function detectRdvConfirmation(aiText: string): { confirmed: boolean; bienId?: string; date?: string } {
  const rdvTag = /\[RDV_CONFIRME bien_id=([a-f0-9-]+) date=([^\]]+)\]/i.exec(aiText);
  if (rdvTag) {
    return { confirmed: true, bienId: rdvTag[1], date: rdvTag[2] };
  }
  return { confirmed: false };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    if (signature && !verifyWasenderSignature(rawBody, signature)) {
      console.error('Invalid WhatsApp Webhook Signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const senderPn = msg.key?.cleanedSenderPn || jid?.split('@')[0];
    const contactName = msg.pushName || 'Client';

    const userMessage =
      msg.messageBody ||
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.text ||
      '';

    if (!senderPn || !userMessage) {
      return NextResponse.json({ status: 'ignored' });
    }

    const supabase = getSupabase();

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

    // 3. Contexte immobilier (biens + médias)
    const context = await getAIBienContext(userMessage);

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
      await supabase.from('visites').insert({
        bien_id: rdvCheck.bienId,
        client_jid: jid,
        client_name: contactName,
        client_phone: senderPn,
        date_souhaitee: rdvCheck.date || new Date().toISOString().slice(0, 10),
        statut: 'en_attente',
        source: 'whatsapp',
        notes: `Demande via WhatsApp. Message : "${userMessage.slice(0, 200)}"`,
      }).select('id').single();
    }

    // 7. Extraire les balises [MEDIA: URL] et nettoyer les tags RDV
    const cleanedAi = aiResponse.replace(/\[RDV_CONFIRME[^\]]*\]/gi, '').trim();
    const { cleanText, mediaUrls } = extractMediaTags(cleanedAi);

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
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
