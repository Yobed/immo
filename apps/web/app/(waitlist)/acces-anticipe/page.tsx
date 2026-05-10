import type { Metadata } from 'next'
import { WaitlistHero } from '@/components/waitlist/WaitlistHero'

export const metadata: Metadata = {
  title: "Accès Anticipé — BOGBE'S GROUPE",
  description:
    "Rejoignez la liste d'attente BOGBE'S GROUPE. Trouvez votre logement à Abidjan sans arnaque — paiement Wave, contrat légal, photos 360°.",
  openGraph: {
    title: "BOGBE'S GROUPE — Accès Anticipé",
    description: "La première plateforme immobilière de confiance en Côte d'Ivoire. Inscrivez-vous pour l'accès en avant-première.",
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}

export default function AccesAnticipePage() {
  return <WaitlistHero />
}
