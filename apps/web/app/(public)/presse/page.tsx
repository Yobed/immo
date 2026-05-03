import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

export const metadata = { title: 'Presse' }

export default function PressePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-luxury)]/10 border border-[var(--accent-luxury)]/20 mb-6">
          <Clock className="w-7 h-7 text-[var(--accent-luxury)]" />
        </div>
        <h1 className="font-display text-3xl font-black text-[var(--text)] mb-3 uppercase tracking-tight">Presse</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
          Notre kit presse est en préparation. Pour toute demande média, contactez-nous via WhatsApp.
        </p>
        <a href="https://wa.me/2250574243752" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[var(--accent-luxury)] font-bold text-sm hover:underline mb-4 block">
          Contacter l&apos;équipe →
        </a>
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-muted)] font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}
