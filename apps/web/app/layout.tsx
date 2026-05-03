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
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? 'https://immo-ci.vercel.app'),
  title: { template: `%s | BOGBE'S GROUPE`, default: `BOGBE'S GROUPE — Immobilier en Côte d'Ivoire` },
  description:
    "Trouvez votre bien immobilier en Côte d'Ivoire. Location, vente, résidences meublées à Abidjan et partout en CI.",
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    url: 'https://immo-ci.vercel.app',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${unbounded.variable} ${playfair.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-[var(--background)] text-[var(--text)] antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AnalyticsProvider />
          {children}
          <ConditionalWhatsApp />
          <TapFeedback />
        </ThemeProvider>
      </body>
    </html>
  )
}
