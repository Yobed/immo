import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, EB_Garamond, Manrope, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { SITE_URL } from '@/lib/env'

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
    // images: auto-detected via app/opengraph-image.tsx convention.
    // Les pages /biens/[id] et /offre-flash/[id] ont leur propre OG dynamique.
  },
  twitter: {
    card: 'summary_large_image',
    title: "BOGBE’S GROUPE — Immobilier en Côte d’Ivoire",
    description: "La plateforme immobilière premium de Côte d’Ivoire",
  },
  // Preuve de propriété Google Search Console (propriété https://www.bogbesgroup.com).
  // Ne pas supprimer : Google révoque l'accès Search Console si la balise disparaît.
  verification: {
    google: 'k3vHpgHzwPRl5_skYFkwf5kueFXebOR8w1_y_RGfTsw',
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
        {/* JSON-LD global : Organization + WebSite avec SearchAction.
            Permet à Google d'afficher le sitelinks search box dans la
            SERP "BOGBE'S GROUPE" et fournit les infos officielles de
            l'entreprise (logo, nom légal, contact, réseaux). */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: "BOGBE'S GROUPE",
                legalName: "BOGBE'S GROUPE",
                url: SITE_URL,
                logo: `${SITE_URL}/bogbes-logo.png`,
                image: `${SITE_URL}/opengraph-image`,
                description: "Plateforme immobilière premium de Côte d'Ivoire. Location, vente et résidences meublées à Abidjan, sans arnaque.",
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Abidjan',
                  addressCountry: 'CI',
                },
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+225 05 44 87 20 51',
                  contactType: 'customer service',
                  availableLanguage: ['fr', 'en'],
                  areaServed: 'CI',
                },
                areaServed: { '@type': 'Country', name: "Côte d'Ivoire" },
                // Profils officiels — relie l'entreprise à ses réseaux pour Google.
                // Ajouter ici Instagram/TikTok/LinkedIn quand les comptes existeront.
                sameAs: ['https://www.facebook.com/edenbogbe.97'],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                url: SITE_URL,
                name: "BOGBE'S GROUPE",
                inLanguage: 'fr-CI',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: `${SITE_URL}/recherche?q={search_term_string}`,
                  },
                  'query-input': 'required name=search_term_string',
                },
              },
            ]),
          }}
        />
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
