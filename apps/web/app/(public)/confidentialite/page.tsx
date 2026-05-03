import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Politique de confidentialité' }

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="font-display text-4xl font-black text-[var(--text)] mb-2 uppercase tracking-tight">Politique de confidentialité</h1>
        <p className="text-[var(--text-muted)] text-sm mb-12">Dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-[var(--text)] text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Données collectées</h2>
            <p>Nous collectons uniquement les données nécessaires au fonctionnement du service : nom, adresse e-mail, numéro de téléphone et préférences de recherche immobilière.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Utilisation des données</h2>
            <p>Vos données sont utilisées exclusivement pour vous mettre en relation avec des propriétaires et gérer votre compte. Elles ne sont jamais revendues à des tiers.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Cookies</h2>
            <p>Ce site utilise des cookies techniques essentiels au fonctionnement (authentification, préférences). Aucun cookie publicitaire n&apos;est utilisé sans votre consentement.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Vos droits</h2>
            <p>Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Contactez-nous via WhatsApp au <a href="https://wa.me/2250574243752" className="text-[var(--accent-luxury)] hover:underline">+225 05 74 24 37 52</a>.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
