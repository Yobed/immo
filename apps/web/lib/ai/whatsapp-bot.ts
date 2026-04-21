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
    // Regex pour capturer les URLs d'images (jpg, png, webp) et vidéos (mp4)
    const imageRegex = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)/gi;
    const videoRegex = /https?:\/\/[^\s"'<>]+\.(?:mp4|mov|avi)/gi;

    const images = text.match(imageRegex) || [];
    const videos = text.match(videoRegex) || [];

    // Limiter à 3 images max pour ne pas spammer
    for (const url of images.slice(0, 3)) {
        await wasenderSendMessage(jid, '', 'image', url);
    }

    // Envoyer la vidéo si présente
    for (const url of videos.slice(0, 1)) {
        await wasenderSendMessage(jid, '', 'video', url);
    }
}

/**
 * Reformate les réponses AI pour une meilleure expérience sur WhatsApp
 */
function formatForWhatsApp(text: string): string {
    return text
        // Remplacer les liens Markdown [Titre](/chemin) par "Titre : https://immo-sigma.vercel.app/chemin"
        .replace(/\[([^\]]+)\]\(\/([^\)]+)\)/g, (match, title, path) => {
            return `*${title}* : https://immo-sigma.vercel.app/${path}`;
        })
        // Mettre en gras les titres de biens (souvent entre [ID: ...])
        .replace(/\[ID: [^\]]+\]/g, (match) => `*${match}*`)
        // Nettoyer les doubles sauts de lignes excessifs
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
