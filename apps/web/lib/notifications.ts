/**
 * lib/notifications.ts
 * Système de notifications hybride (Web + WhatsApp Bridge)
 * Pour une plateforme immobilière de référence en Côte d'Ivoire.
 */

type NotificationType = 'RESERVATION' | 'PAIEMENT' | 'VISITE' | 'ALERTE_PRIX';

interface NotificationPayload {
  to: string; // Numéro WhatsApp ou Email
  customerName: string;
  propertyName: string;
  amount?: string;
  date?: string;
  link?: string;
}

const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL; // n8n or Make.com
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Envoie une notification via le canal optimal
 */
export async function sendNotification(type: NotificationType, payload: NotificationPayload) {
  console.log(`[Notification] Envoi de type ${type} vers ${payload.to}`);

  // 1. Préparation du message
  const message = formatMessage(type, payload);

  // 2. Envoi Web (Console / Log)
  if (!IS_PRODUCTION) {
    console.log("--- MOCK WHATSAPP MESSAGE ---");
    console.log(message);
    console.log("-----------------------------");
    return { success: true, mode: 'mock' };
  }

  // 3. WhatsApp Bridge (Production)
  if (WHATSAPP_WEBHOOK_URL) {
    try {
      const response = await fetch(WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          whatsapp: payload.to,
          message,
          ...payload
        })
      });
      return { success: response.ok, mode: 'webhook' };
    } catch (error) {
      console.error("[Notification Error]", error);
      return { success: false, error };
    }
  }

  return { success: false, reason: 'No webhook configured' };
}

function formatMessage(type: NotificationType, p: NotificationPayload): string {
  switch (type) {
    case 'RESERVATION':
      return `💎 *NOUVELLE RÉSERVATION - BOGBE'S GROUPE PRO*\n\nBonjour,\nUne nouvelle réservation a été effectuée pour *${p.propertyName}*.\n👤 Client : ${p.customerName}\n📅 Date : ${p.date || 'Dès que possible'}\n\n🔗 Gérer ici : ${p.link || 'https://immodash.ci/dashboard'}`;
    
    case 'PAIEMENT':
      return `✅ *PAIEMENT CONFIRMÉ - BOGBE'S GROUPE PRO*\n\nFélicitations !\nUn paiement de *${p.amount} FCFA* a été reçu pour *${p.propertyName}*.\nL'annonce a été automatiquement mise à jour en statut "Indisponible".`;

    case 'VISITE':
      return `👀 *DEMANDE DE VISITE - BOGBE'S GROUPE PRO*\n\n${p.customerName} souhaite visiter *${p.propertyName}*.\nVeuillez confirmer votre disponibilité sur la plateforme.`;

    case 'ALERTE_PRIX':
      return `📉 *OPTIMISATION DE PRIX*\n\nVotre bien *${p.propertyName}* est inoccupé depuis 15 jours. L'IA suggère une remise de 10% pour attirer des clients VIP.`;
    
    default:
      return `Nouvelle notification BOGBE'S GROUPE PRO pour ${p.propertyName}`;
  }
}
