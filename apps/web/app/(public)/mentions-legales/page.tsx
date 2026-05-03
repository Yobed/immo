import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Mentions légales' }

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <h1 className="font-display text-4xl font-black text-[var(--text)] mb-2 uppercase tracking-tight">Mentions légales</h1>
        <p className="text-[var(--text-muted)] text-sm mb-12">Dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-[var(--text)] text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Éditeur du site</h2>
            <p>BOGBE&apos;S GROUPE Multi Services<br />
            Abidjan, Côte d&apos;Ivoire<br />
            WhatsApp : <a href="https://wa.me/2250574243752" className="text-[var(--accent-luxury)] hover:underline">+225 05 74 24 37 52</a></p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Hébergement</h2>
            <p>Ce site est hébergé par Vercel Inc., 340 Pine Street, San Francisco, CA 94104, États-Unis.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Propriété intellectuelle</h2>
            <p>L&apos;ensemble du contenu de ce site (textes, images, logos, graphismes) est la propriété exclusive de BOGBE&apos;S GROUPE Multi Services. Toute reproduction sans autorisation est interdite.</p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 uppercase tracking-wider text-[var(--accent-luxury)]">Contact</h2>
            <p>Pour toute question : <a href="mailto:contact@bogbesgroupe.ci" className="text-[var(--accent-luxury)] hover:underline">contact@bogbesgroupe.ci</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
