'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { ANALYTICS_CONFIG } from '@/lib/analytics/config'
import { track } from '@/lib/analytics/events'
import { CookieConsent } from '@/components/CookieConsent'

/* ─── Route change tracker (inner — needs Suspense) ─── */
function RouteChangeTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only track if user has consented to analytics
    const consent = localStorage.getItem('cookie-consent')
    if (consent !== 'accepted') return

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    track.pageView(url)
  }, [pathname, searchParams])

  return null
}

/* ─── Main Analytics Provider ─── */
export function AnalyticsProvider() {
  return (
    <>
      {/* Cookie consent banner — blocks GA4 and Meta Pixel until accepted */}
      <CookieConsent />

      {/* Route change tracker (only fires after consent) */}
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  )
}
