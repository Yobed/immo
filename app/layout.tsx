import type { Metadata } from 'next';
import Script from 'next/script';
import { Plus_Jakarta_Sans, Cormorant_Garamond } from 'next/font/google';
import ScrollCraftProvider from '@/components/ScrollCraftProvider';
import AmbientSpotlight from '@/components/AmbientSpotlight';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Agence Immo | Architecture de Prestige & Baux d\'Exception à Abidjan',
  description: 'Cabinet immobilier de référence en Côte d\'Ivoire. Demeures contemporaines à Cocody Riviera Golf, penthouses en Zone 4 et propriétés d\'exception sous séquestre notarié.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${cormorant.variable} scroll-smooth light`} suppressHydrationWarning>
      <head>
        <Script src="/scrollcraft.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased selection:bg-[#C8A97E] selection:text-white">
        <ThemeProvider>
          <AmbientSpotlight />
          <ScrollCraftProvider>
            {children}
          </ScrollCraftProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
