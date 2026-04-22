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

    // 1. Sauvegarder le message entrant
    await getSupabase().from('whatsapp_messages').insert({
      jid,
      direction: 'inbound',
      body: userMessage,
      metadata: { contactName },
    });

    // 2. Historique de conversation (10 derniers messages)
    const { data: history } = await getSupabase()
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

    // 4. Réponse Sapphire via Groq
    const aiResponse = await chatImmobilier(formattedHistory, context || undefined);

    if (!aiResponse) {
      return NextResponse.json({ status: 'ok' });
    }

    // 5. Extraire les balises [MEDIA: URL]
    const { cleanText, mediaUrls } = extractMediaTags(aiResponse);

    // 6. Envoyer le texte principal
    if (cleanText) {
      await wasenderSendMessage(senderPn, cleanText, 'text');
    }

    // 7. Envoyer les médias (max 3) en séquence
    for (const url of mediaUrls.slice(0, 3)) {
      const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
      await wasenderSendMessage(
        senderPn,
        '',
        isVideo ? 'video' : 'image',
        url
      );
    }

    // 8. Sauvegarder la réponse sortante
    await getSupabase().from('whatsapp_messages').insert({
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
