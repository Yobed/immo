'use client'
import Link from 'next/link'

export default function ClientError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-4">
      <div className="bg-[var(--surface-card)] rounded-card border border-[var(--border)] p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h1 className="font-display text-xl text-[var(--text)] mb-2">Une erreur est survenue</h1>
        <p className="font-sans text-sm text-muted mb-6">{error.message ?? 'Veuillez réessayer.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-sans hover:bg-primary/90 transition-colors">
            Réessayer
          </button>
          <Link href="/biens" className="px-4 py-2 border border-[var(--border)] rounded-btn text-sm font-sans text-muted hover:border-primary/40 transition-colors">
            Retour aux annonces
          </Link>
        </div>
      </div>
    </div>
  )
}
