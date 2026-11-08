import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogue Numérique Prestige 2026 | Agence Immo Abidjan',
  description: 'Feuilletez notre sélection confidentielle de résidences d\'exception à Abidjan : Villas Cocody Riviera, Penthouses Zone 4 et Domaines Assinie. Directement sur votre smartphone.',
  openGraph: {
    title: '📖 Catalogue Numérique Prestige Abidjan 2026',
    description: 'Feuilletez le recueil annuel d\'exception : Villas d\'architecte, Penthouses panoramiques, Terrains ACD certifiés. Ouvrez directement sur mobile.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85',
        width: 1200,
        height: 630,
        alt: 'Catalogue Numérique Prestige Abidjan 2026',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '📖 Catalogue Numérique Prestige Abidjan 2026',
    description: 'Feuilletez le recueil annuel d\'exception d\'Agence Immo Abidjan sur votre smartphone.',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85'],
  },
};

export default function MobileCatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}