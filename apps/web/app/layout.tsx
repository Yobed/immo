import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
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
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? 'https://immo-ci.vercel.app'),
  title: { template: '%s | Immo CI', default: "Immo CI — Immobilier en Côte d'Ivoire" },
  description:
    "Trouvez votre bien immobilier en Côte d'Ivoire. Location, vente, résidences meublées à Abidjan et partout en CI.",
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    url: 'https://immo-ci.vercel.app',
    siteName: 'Immo CI',
    title: "Immo CI — Immobilier en Côte d'Ivoire",
    description: "Trouvez votre bien immobilier en Côte d'Ivoire. Location, vente à Abidjan.",
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Immo CI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Immo CI — Immobilier en Côte d'Ivoire",
    description: "La plateforme immobilière premium de Côte d'Ivoire",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-white text-text antialiased overflow-x-hidden">{children}</body>
    </html>
  )
}
