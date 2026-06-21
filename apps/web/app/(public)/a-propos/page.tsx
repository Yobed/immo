import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

export const metadata = {
  title: "À propos — La plateforme immobilière sans arnaque de Côte d'Ivoire",
  description: "Notre mission : sécuriser le marché immobilier ivoirien. Découvrez notre équipe, notre méthode et notre engagement pour des transactions sans intermédiaires douteux.",
  keywords: ['bogbes groupe à propos', 'agence immobilière abidjan', 'plateforme immobilière côte d\'ivoire', 'équipe immobilière ci'],
  alternates: { canonical: '/a-propos' },
  openGraph: {
    title: "À propos de BOGBE'S GROUPE — Sécuriser l'immobilier ivoirien",
    description: "Une équipe, une méthode anti-arnaque, une promesse : que chaque transaction immobilière en Côte d'Ivoire se déroule sans accroc.",
    type: 'website' as const,
  },
}

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-luxury/10 border border-accent-luxury/20 mb-6">
          <Clock className="w-7 h-7 text-[var(--accent-luxury)]" />
        </div>
        <h1 className="font-display text-3xl font-black text-[var(--text)] mb-3 uppercase tracking-tight">À propos</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
          Cette page est en cours de rédaction. Retrouvez-nous bientôt pour découvrir l&apos;histoire de BOGBE&apos;S GROUPE.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--accent-luxury)] font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}
