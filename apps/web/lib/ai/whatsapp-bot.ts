// apps/web/lib/ai/whatsapp-bot.ts
import { chatImmobilier, ChatMessage } from '../ai';
import { getAIBienContext } from './tools';

import { wasenderSendMessage } from '../wasender';

/**
 * Traite les messages entrants de WhatsApp pour Sapphire Intelligence
 */
export async function handleWhatsAppSapphire(jid: string, userMessage: string) {
    console.log(`[Sapphire WhatsApp] Message de ${jid}: ${userMessage}`);

    // 1. Obtenir du contexte dynamique (biens pertinents avec photos/vidéos)
    const context = await getAIBienContext(userMessage);

    // 2. Préparer l'historique
    const messages: ChatMessage[] = [
        { role: 'user', content: userMessage }
    ];

    // 3. Obtenir la réponse de Sapphire
    const response = await chatImmobilier(messages, context || undefined);

    // 4. Détecter et envoyer les médias en pièces jointes réelles
    await extractAndSendMedia(jid, response);

    // 5. Post-processing du texte pour WhatsApp
    const finalResponse = formatForWhatsApp(response);

    return finalResponse;
}

/**
 * Extrait les URLs de médias de la réponse et les envoie via Wasender
 */
async function extractAndSendMedia(jid: string, text: string) {
    // 1. Chercher spécifiquement les balises [MEDIA: url] demandées par le nouveau prompt
    const mediaRegex = /\[MEDIA:\s*(https?:\/\/[^\]]+)\]/gi;
    let match;
    const mediaUrls: string[] = [];
    
    while ((match = mediaRegex.exec(text)) !== null) {
        mediaUrls.push(match[1]);
    }

    // Si on a trouvé des balises MEDIA, on les envoie
    if (mediaUrls.length > 0) {
        for (const url of mediaUrls.slice(0, 3)) {
            await wasenderSendMessage(jid, '', 'image', url);
        }
    } else {
        // 2. Fallback: Ancienne méthode de détection d'URLs d'images brutes au cas où
        const imageRegex = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)/gi;
        const videoRegex = /https?:\/\/[^\s"'<>]+\.(?:mp4|mov|avi)/gi;

        const images = text.match(imageRegex) || [];
        const videos = text.match(videoRegex) || [];

        for (const url of images.slice(0, 3)) {
            await wasenderSendMessage(jid, '', 'image', url);
        }
        for (const url of videos.slice(0, 1)) {
            await wasenderSendMessage(jid, '', 'video', url);
        }
    }
}

/**
 * Reformate les réponses AI pour une meilleure expérience sur WhatsApp
 */
function formatForWhatsApp(text: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app';
    return text
        // Remplacer les liens Markdown [Titre](/chemin) par l'URL dynamique (fallback)
        .replace(/\[([^\]]+)\]\(\/([^\)]+)\)/g, (match, title, path) => {
            return `*${title}* : ${baseUrl}/${path}`;
        })
        // Mettre en gras les titres de biens (souvent entre [ID: ...])
        .replace(/\[ID: [^\]]+\]/g, (match) => `*${match}*`)
        // Supprimer complètement la balise [MEDIA: ...] pour qu'elle ne soit pas visible par le client
        .replace(/\[MEDIA:\s*https?:\/\/[^\]]+\]/gi, '')
        // Nettoyer les doubles sauts de lignes excessifs
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
