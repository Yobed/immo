'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { ANALYTICS_CONFIG } from '@/lib/analytics/config'
import { track } from '@/lib/analytics/events'

/* ─── Route change tracker (inner — needs Suspense) ─── */
function RouteChangeTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    track.pageView(url)
  }, [pathname, searchParams])

  return null
}

/* ─── Google Analytics 4 Scripts ─── */
function GoogleAnalytics() {
  if (!ANALYTICS_CONFIG.GA_ID) return null

  return (
    <>
      <Script
        id="ga-init"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.GA_ID}`}
      />
      <Script
        id="ga-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ANALYTICS_CONFIG.GA_ID}', {
              page_path: window.location.pathname,
              send_page_view: false,
              currency: 'XOF',
              country: 'CI',
            });
          `,
        }}
      />
    </>
  )
}

/* ─── Meta Pixel Scripts ─── */
function MetaPixel() {
  if (!ANALYTICS_CONFIG.META_PIXEL_ID) return null

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${ANALYTICS_CONFIG.META_PIXEL_ID}');
          fbq('track', 'PageView');
        `,
      }}
    />
  )
}

/* ─── Main Analytics Provider ─── */
export function AnalyticsProvider() {
  return (
    <>
      <GoogleAnalytics />
      <MetaPixel />
      <Suspense fallback={null}>
        <RouteChangeTracker />
      </Suspense>
    </>
  )
}
