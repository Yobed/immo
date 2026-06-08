import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, EB_Garamond, Manrope, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Distinctive typographic system — deliberately off the "AI default" list
// (no Inter, Outfit, Playfair, Plus Jakarta, DM Sans, Instrument, Fraunces, Newsreader).
//
// Display: Bricolage Grotesque — variable contemporary, characterful headlines
// Serif:   EB Garamond — classical italic for editorial accents
// Sans:    Manrope — warm geometric body
// Mono:    JetBrains Mono — kept for numeric/reference text
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
})
const serif = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
})
const sans = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
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
  // ⚠️ TOUS les apostrophes des metadata sont des U+2019 (apostrophe typographique)
  // et non U+0027 (apostrophe droite). Next.js encode U+0027 en `&#x27;` dans les
  // meta tags HTML, ce que WhatsApp ne décode pas → affichage littéral "BOGBE&#x27;S"
  // dans les link previews. U+2019 ne nécessite aucun encoding HTML.
  title: { template: `%s | BOGBE’S GROUPE`, default: `BOGBE’S GROUPE — Immobilier en Côte d’Ivoire` },
  description:
    "Trouvez votre bien immobilier en Côte d’Ivoire. Location, vente, résidences meublées à Abidjan et partout en CI.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "BOGBE’S",
  },
  icons: {
    icon: '/bogbes-logo.png',
    apple: '/bogbes-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    url: SITE_URL,
    siteName: "BOGBE’S GROUPE",
    title: "BOGBE’S GROUPE — Immobilier en Côte d’Ivoire",
    description: "Trouvez votre bien immobilier en Côte d’Ivoire. Location, vente à Abidjan.",
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "BOGBE’S GROUPE" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "BOGBE’S GROUPE — Immobilier en Côte d’Ivoire",
    description: "La plateforme immobilière premium de Côte d’Ivoire",
  },
}

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ConditionalWhatsApp } from '@/components/ui/ConditionalWhatsApp'
import { TapFeedback } from '@/components/ui/TapFeedback'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { I18nProvider } from '@/lib/i18n/client'
import { getLocale } from '@/lib/i18n/server'
import { ToastProvider } from '@/components/ui/Toast'
import { ProductionEnvValidator } from '@/components/ProductionEnvValidator'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      className={`${display.variable} ${serif.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-[var(--background)] text-[var(--text)] antialiased overflow-x-hidden" suppressHydrationWarning>
        <I18nProvider locale={locale}>
          <ToastProvider>
            <ThemeProvider>
              <ProductionEnvValidator />
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
