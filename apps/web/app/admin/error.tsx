'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCw, ArrowLeft, ShieldAlert } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[admin/error.tsx]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] p-8 max-w-lg w-full text-center shadow-lg">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-5">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-[var(--text)] mb-2">
          Erreur de chargement du module admin
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
          {error.message || 'Une anomalie est survenue lors de l’affichage de cette page.'}
        </p>
        {error.digest && (
          <p className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--surface-hover)] py-1 px-2 rounded mb-6 inline-block">
            ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-luxury)] text-[var(--text)] font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            <RotateCw className="w-4 h-4" /> Réessayer
          </button>
          <Link
            href="/admin/suivi"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au suivi
          </Link>
        </div>
      </div>
    </div>
  )
}
