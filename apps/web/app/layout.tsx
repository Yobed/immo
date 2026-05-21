import type { Metadata, Viewport } from 'next'
import { Unbounded, Playfair_Display, Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_URL ?? 'https://bogbes-groupe.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: `%s | BOGBE'S GROUPE`, default: `BOGBE'S GROUPE — Immobilier en Côte d'Ivoire` },
  description:
    "Trouvez votre bien immobilier en Côte d'Ivoire. Location, vente, résidences meublées à Abidjan et partout en CI.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "BOGBE'S",
  },
  icons: {
    icon: '/bogbes-logo.png',
    apple: '/bogbes-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    url: SITE_URL,
    siteName: "BOGBE'S GROUPE",
    title: "BOGBE'S GROUPE — Immobilier en Côte d'Ivoire",
    description: "Trouvez votre bien immobilier en Côte d'Ivoire. Location, vente à Abidjan.",
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "BOGBE'S GROUPE" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "BOGBE'S GROUPE — Immobilier en Côte d'Ivoire",
    description: "La plateforme immobilière premium de Côte d'Ivoire",
  },
}

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ConditionalWhatsApp } from '@/components/ui/ConditionalWhatsApp'
import { TapFeedback } from '@/components/ui/TapFeedback'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { I18nProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'
import { ToastProvider } from '@/components/ui/Toast'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      className={`${unbounded.variable} ${playfair.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-[var(--background)] text-[var(--text)] antialiased overflow-x-hidden" suppressHydrationWarning>
        <I18nProvider locale={locale}>
          <ToastProvider>
            <ThemeProvider>
              <AnalyticsProvider />
              {children}
              <ConditionalWhatsApp />
              <TapFeedback />
            </ThemeProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
