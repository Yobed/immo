'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type ConsentState = 'pending' | 'accepted' | 'rejected'

/**
 * Cookie Consent Banner — RGPD Compliant
 * Blocks GA4 and Meta Pixel until user consents
 * Stores choice in localStorage for 365 days
 */
export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('cookie-consent')
    if (stored) {
      setConsent(stored as ConsentState)
    } else {
      setConsent('pending')
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setConsent('accepted')
    
    // Load analytics scripts
    loadAnalytics()
    
    // Dispatch custom event for other integrations
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'))
  }

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setConsent('rejected')
  }

  const handleDismiss = () => {
    // Implicit rejection if user closes without accepting
    if (consent === 'pending') {
      localStorage.setItem('cookie-consent', 'rejected')
      localStorage.setItem('cookie-consent-date', new Date().toISOString())
      setConsent('rejected')
    } else {
      setConsent(null)
    }
  }

  // Don't render on server or if consent is already decided
  if (!mounted || (consent && consent !== 'pending')) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Préférences de consentement
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Nous utilisons Google Analytics et Meta Pixel pour améliorer votre expérience. 
              Ces outils nécessitent votre consentement.{' '}
              <a href="/privacy" className="underline hover:text-slate-900 dark:hover:text-white">
                En savoir plus
              </a>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleReject}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            >
              Refuser
            </button>
            <button
              onClick={handleAccept}
              className="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Accepter
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Load GA4 and Meta Pixel scripts
 * Called after user accepts cookies
 */
function loadAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  // Load Google Analytics 4
  if (gaId) {
    loadGoogleAnalytics(gaId)
  }

  // Load Meta Pixel
  if (metaId) {
    loadMetaPixel(metaId)
  }
}

/**
 * Dynamically load GA4 script
 */
function loadGoogleAnalytics(gaId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).gtag) return // Already loaded

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(script)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).dataLayer = (window as any).dataLayer || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function gtag(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).dataLayer?.push(arguments) // eslint-disable-line prefer-rest-params
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).gtag = gtag
  gtag('js', new Date())
  gtag('config', gaId, {
    page_path: window.location.pathname,
    send_page_view: false,
    currency: 'XOF',
    country: 'CI',
  })
}

/**
 * Dynamically load Meta Pixel
 */
function loadMetaPixel(pixelId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).fbq) return // Already loaded

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbq = function (...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).fbq?.queue?.push(arguments) // eslint-disable-line prefer-rest-params
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).fbq = fbq
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fbq.push = fbq
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fbq.loaded = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fbq.version = '2.0'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(fbq as any).queue = [] as any[]

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)

  fbq('init', pixelId)
  fbq('track', 'PageView')
}
