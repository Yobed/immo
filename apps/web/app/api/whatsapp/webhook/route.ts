import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { wasenderSendMessage, verifyWasenderSignature } from '@/lib/wasender';
import { chatImmobilier } from '@/lib/ai';
import { getAIBienContext } from '@/lib/ai/tools';

// Supabase client will be created inside the route handler to avoid top-level env var build errors
// or using a getter
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');

    // Vérification de la signature si configurée
    if (signature && !verifyWasenderSignature(rawBody, signature)) {
        console.error('Invalid WhatsApp Webhook Signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Wasender standard payload
    const { event, data } = body;

    // Ignore events that are not messages.received or upsert
    if (event !== 'messages.received' && event !== 'messages.upsert') {
      return NextResponse.json({ status: 'ignored' });
    }

    const messages = data?.messages;
    if (!messages) return NextResponse.json({ status: 'ignored' });

    // Handle both array and object formats for messages
    const msg = Array.isArray(messages) ? messages[0] : messages;
    
    // Ignore outgoing messages
    if (msg.key?.fromMe) {
        return NextResponse.json({ status: 'ignored' });
    }

    const jid = msg.key?.remoteJid;
    // remoteJid format: 1234567890@s.whatsapp.net
    const senderPn = msg.key?.cleanedSenderPn || jid?.split('@')[0];
    const contactName = msg.pushName || 'Client';

    // Extract message content safely
    const userMessage = msg.messageBody || 
                       msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text ||
                       msg.text || 
                       '';

    if (!senderPn || !userMessage) {
      console.log('Ignoring message: missing senderPn or userMessage', { senderPn, userMessage });
      return NextResponse.json({ status: 'ignored' });
    }

    // 1. Sauvegarder le message entrant dans Supabase
    await getSupabase().from('whatsapp_messages').insert({
      jid,
      direction: 'inbound',
      body: userMessage,
      metadata: { contactName }
    });

    // 2. Récupérer l'historique récent pour la conversation
    const { data: history } = await getSupabase()
      .from('whatsapp_messages')
      .select('direction, body')
      .eq('jid', jid)
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedHistory = ((history as any[]) || [])
      .reverse()
      .map(msg => ({
        role: msg.direction === 'inbound' ? 'user' : 'assistant' as 'user' | 'assistant',
        content: msg.body
      }));

    // 3. Chercher du contexte immobilier (biens pertinents)
    // On cherche si le message mentionne un bien ou une commune
    const context = await getAIBienContext(userMessage);

    // 4. Appeler Sapphire Intelligence (AI)
    const aiResponse = await chatImmobilier(formattedHistory, context || undefined);

    if (aiResponse) {
      // 5. Détecter si Sapphire a inclus une balise média
      // Recherche de "[MEDIA: https://...]" à la fin du texte
      const mediaRegex = /\[MEDIA:\s*(https?:\/\/[^\s\]]+)\]/i;
      const mediaMatch = aiResponse.match(mediaRegex);
      
      let finalSpeech = aiResponse;
      let mediaUrl = undefined;
      
      if (mediaMatch) {
        mediaUrl = mediaMatch[1];
        // On nettoie le texte pour ne pas avoir la balise brute
        finalSpeech = aiResponse.replace(mediaMatch[0], '').trim();
      }

      // 6. Envoyer la réponse via Wasender
      const wasenderResult = await wasenderSendMessage(
        senderPn, 
        finalSpeech, 
        mediaUrl ? (mediaUrl.endsWith('.mp4') ? 'video' : 'image') : 'text',
        mediaUrl
      );

      // 7. Sauvegarder la réponse sortante
      await getSupabase().from('whatsapp_messages').insert({
        jid,
        direction: 'outbound',
        body: finalSpeech,
        media_url: mediaUrl,
        metadata: { wasenderResult }
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
