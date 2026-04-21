/**
 * WassenderService - Interface with Wassender WhatsApp API
 * Documentation: https://wasenderapi.com/api-docs
 */

export class WassenderService {
  private static API_KEY = '5bad69e29793e748f2fea9043435cd4844aadd6b0947b650b2efb82c86c34017';
  private static BASE_URL = 'https://wasenderapi.com/api';

  /**
   * Send a text message
   */
  static async sendTextMessage(to: string, message: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone: to,
          message: message,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Wassender sendTextMessage error:', error);
      throw error;
    }
  }

  /**
   * Send an image message
   */
  static async sendImageMessage(to: string, imageUrl: string, caption?: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone: to,
          image: imageUrl,
          caption: caption || '',
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Wassender sendImageMessage error:', error);
      throw error;
    }
  }

  /**
   * Send a video message
   */
  static async sendVideoMessage(to: string, videoUrl: string, caption?: string) {
    try {
      const response = await fetch(`${this.BASE_URL}/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          phone: to,
          video: videoUrl,
          caption: caption || '',
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Wassender sendVideoMessage error:', error);
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  static async getSessions() {
    try {
      const response = await fetch(`${this.BASE_URL}/whatsapp-sessions`, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Accept': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Wassender getSessions error:', error);
      throw error;
    }
  }

  /**
   * Check session status
   */
  static async getStatus() {
    try {
      const response = await fetch(`${this.BASE_URL}/status`, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Accept': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Wassender getStatus error:', error);
      throw error;
    }
  }
}
