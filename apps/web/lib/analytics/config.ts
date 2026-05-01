/**
 * Analytics Configuration — Immo CI
 * Centralise les IDs et flags de tous les outils de tracking.
 */

export const ANALYTICS_CONFIG = {
  /** Google Analytics 4 — Measurement ID (format: G-XXXXXXXXXX) */
  GA_ID: process.env.NEXT_PUBLIC_GA_ID ?? '',

  /** Meta (Facebook) Pixel ID */
  META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '',

  /** Activer le debug mode en dev */
  DEBUG: process.env.NODE_ENV === 'development',

  /** Désactiver complètement en local si non configuré */
  get ENABLED(): boolean {
    return process.env.NODE_ENV === 'production' || !!this.GA_ID
  },
}
