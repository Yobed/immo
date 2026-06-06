/**
 * Analytics Events — BOGBE'S GROUPE
 * Toutes les conversions et événements clés de la plateforme.
 *
 * Usage:
 *   import { track } from '@/lib/analytics/events'
 *   track.waitlistSignup({ profil: 'chercheur', source: 'acces-anticipe' })
 *   track.contactProprio({ bienId: '...', commune: 'Cocody' })
 */

import { ANALYTICS_CONFIG } from './config'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type GtagFunction = (
  command: 'event' | 'config' | 'js' | 'set',
  eventOrTarget: string | Date,
  params?: Record<string, unknown>
) => void

type FbqFunction = (
  command: 'track' | 'trackCustom' | 'init',
  eventName: string,
  params?: Record<string, unknown>
) => void

declare global {
  interface Window {
    gtag?: GtagFunction
    fbq?: FbqFunction
    _fbq?: unknown
    dataLayer?: unknown[]
  }
}

// ─── CORE ─────────────────────────────────────────────────────────────────────

function gtagEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  if (!ANALYTICS_CONFIG.GA_ID) return

  // Check cookie consent
  const consent = typeof window !== 'undefined' ? localStorage.getItem('cookie-consent') : null
  if (consent !== 'accepted') return

  if (ANALYTICS_CONFIG.DEBUG) {
    console.log(`[GA4] ${name}`, params)
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}

function pixelEvent(
  name: string,
  params: Record<string, unknown> = {},
  isCustom = false
) {
  if (typeof window === 'undefined') return
  if (!ANALYTICS_CONFIG.META_PIXEL_ID) return

  // Check cookie consent
  const consent = typeof window !== 'undefined' ? localStorage.getItem('cookie-consent') : null
  if (consent !== 'accepted') return

  if (ANALYTICS_CONFIG.DEBUG) {
    console.log(`[Meta Pixel] ${isCustom ? 'Custom: ' : ''}${name}`, params)
  }

  if (typeof window.fbq === 'function') {
    if (isCustom) {
      window.fbq('trackCustom', name, params)
    } else {
      window.fbq('track', name, params)
    }
  }
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export const track = {
  // ── PAGE VIEW ──────────────────────────────────────────────────────────────
  pageView(url: string) {
    gtagEvent('page_view', { page_path: url })
    pixelEvent('PageView')
  },

  // ── ACQUISITION ────────────────────────────────────────────────────────────

  /** Inscription liste d'attente */
  waitlistSignup(params: {
    profil: 'chercheur' | 'proprietaire' | 'agence'
    type_contact: 'whatsapp' | 'email'
    source?: string
  }) {
    gtagEvent('sign_up', {
      method: params.type_contact,
      user_type: params.profil,
      source: params.source ?? 'unknown',
    })
    pixelEvent('Lead', {
      content_name: 'waitlist',
      content_category: params.profil,
    })
  },

  /** Clic bouton "Rechercher un bien" */
  searchStart(params: { commune?: string; type_bien?: string; budget?: number }) {
    gtagEvent('search', {
      search_term: [params.commune, params.type_bien].filter(Boolean).join(' '),
      budget_fcfa: params.budget,
      commune: params.commune,
    })
    pixelEvent('Search', {
      search_string: params.commune,
      content_type: params.type_bien,
    })
  },

  /** Consultation fiche bien */
  viewBien(params: {
    bienId: string
    commune: string
    type_bien: string
    prix?: number
  }) {
    gtagEvent('view_item', {
      item_id: params.bienId,
      item_name: `${params.type_bien} - ${params.commune}`,
      item_category: params.commune,
      item_category2: params.type_bien,
      value: params.prix,
      currency: 'XOF',
    })
    pixelEvent('ViewContent', {
      content_ids: [params.bienId],
      content_type: 'product',
      content_name: `${params.type_bien} - ${params.commune}`,
      value: params.prix,
      currency: 'XOF',
    })
  },

  // ── CONVERSION ─────────────────────────────────────────────────────────────

  /** Contact propriétaire — bouton WhatsApp / formulaire */
  contactProprio(params: {
    bienId: string
    commune: string
    type_bien: string
    methode: 'whatsapp' | 'formulaire' | 'telephone'
    prix?: number
  }) {
    gtagEvent('generate_lead', {
      currency: 'XOF',
      value: params.prix ?? 0,
      item_id: params.bienId,
      commune: params.commune,
      methode_contact: params.methode,
    })
    gtagEvent('contact_proprio', params) // événement custom aussi
    pixelEvent('Contact', {
      content_ids: [params.bienId],
      content_category: params.commune,
    })
    pixelEvent('ContactProprio', params, true) // custom
  },

  /** Début processus de paiement (caution/loyer) */
  beginCheckout(params: {
    bienId: string
    montant: number
    type: 'caution' | 'loyer' | 'reservation'
    commune: string
  }) {
    gtagEvent('begin_checkout', {
      currency: 'XOF',
      value: params.montant,
      items: [{
        item_id: params.bienId,
        item_name: `${params.type} - ${params.commune}`,
        price: params.montant,
        currency: 'XOF',
      }],
    })
    pixelEvent('InitiateCheckout', {
      content_ids: [params.bienId],
      value: params.montant,
      currency: 'XOF',
      num_items: 1,
    })
  },

  /** Paiement réussi */
  purchase(params: {
    transactionId: string
    bienId: string
    montant: number
    type: 'caution' | 'loyer' | 'reservation'
    commune: string
  }) {
    gtagEvent('purchase', {
      transaction_id: params.transactionId,
      currency: 'XOF',
      value: params.montant,
      items: [{
        item_id: params.bienId,
        item_name: `${params.type} - ${params.commune}`,
        price: params.montant,
        currency: 'XOF',
      }],
    })
    pixelEvent('Purchase', {
      content_ids: [params.bienId],
      value: params.montant,
      currency: 'XOF',
      num_items: 1,
    })
  },

  /** Publication d'annonce (côté propriétaire) */
  publishBien(params: {
    bienId: string
    type_bien: string
    commune: string
    prix?: number
  }) {
    gtagEvent('publish_listing', {
      item_id: params.bienId,
      item_category: params.commune,
      item_category2: params.type_bien,
      value: params.prix,
      currency: 'XOF',
    })
    pixelEvent('SubmitApplication', {
      content_name: 'nouvelle_annonce',
      content_category: params.commune,
    })
  },

  // ── ENGAGEMENT ─────────────────────────────────────────────────────────────

  /** Ouverture galerie 360° */
  view360(params: { bienId: string; commune: string }) {
    gtagEvent('view_360', params)
    pixelEvent('View360', params, true)
  },

  /** Clic sur offre flash */
  viewFlashOffer(params: { offerId: string; type: string }) {
    gtagEvent('select_promotion', {
      promotion_id: params.offerId,
      promotion_name: `flash_${params.type}`,
    })
  },

  /** Sauvegarde d'un bien en favori */
  saveBien(params: { bienId: string; commune: string }) {
    gtagEvent('add_to_wishlist', {
      currency: 'XOF',
      items: [{ item_id: params.bienId, item_category: params.commune }],
    })
  },

  /** Chat IA démarré */
  chatStart(params: { source: string }) {
    gtagEvent('chat_start', params)
    pixelEvent('ChatStart', params, true)
  },

  /** Partage WhatsApp (waitlist ou fiche bien) */
  share(params: { method: string; content_type: string; item_id?: string }) {
    gtagEvent('share', params)
  },
}
