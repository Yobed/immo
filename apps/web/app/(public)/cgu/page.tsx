import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: "Conditions générales d'utilisation" }

export default function CguPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="font-display text-4xl font-black text-[var(--text)] mb-2 uppercase tracking-tight">Conditions générales</h1>
        <p className="text-[var(--text-muted)] text-sm mb-12">Dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-[var(--text)] text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Objet</h2>
            <p>Les présentes conditions régissent l&apos;utilisation de la plateforme BOGBE&apos;S GROUPE, service de mise en relation immobilière en Côte d&apos;Ivoire.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Accès au service</h2>
            <p>L&apos;accès à la plateforme est gratuit pour les locataires. Les propriétaires souhaitant publier des annonces peuvent contacter notre équipe via WhatsApp.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Responsabilités</h2>
            <p>BOGBE&apos;S GROUPE agit en qualité d&apos;intermédiaire. Nous vérifions les annonces publiées mais ne pouvons garantir l&apos;exactitude de toutes les informations fournies par les propriétaires.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Contact</h2>
            <p>Pour toute question : <a href="https://wa.me/2250574243752" className="text-[var(--accent-luxury)] hover:underline">+225 05 74 24 37 52</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
