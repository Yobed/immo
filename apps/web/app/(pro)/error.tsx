'use client'
import Link from 'next/link'

export default function ProError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-4">
      <div className="bg-white rounded-card border border-[var(--border)] p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="font-display text-xl text-[var(--text)] mb-2">Une erreur est survenue</h1>
        <p className="font-sans text-sm text-muted mb-6">{error.message ?? 'Veuillez réessayer.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-sans hover:bg-primary/90 transition-colors">
            Réessayer
          </button>
          <Link href="/dashboard" className="px-4 py-2 border border-[var(--border)] rounded-btn text-sm font-sans text-muted hover:border-primary/40 transition-colors">
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  )
}
