import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

export const metadata = { title: 'À propos' }

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-luxury)]/10 border border-[var(--accent-luxury)]/20 mb-6">
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
