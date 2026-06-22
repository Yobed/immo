'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RotateCw, MessageCircle, AlertTriangle } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[error.tsx]', error)

    // Cause #1 d'erreur "fantôme" : un déploiement a changé les hash des chunks JS
    // pendant que l'utilisateur naviguait → l'ancien chunk n'existe plus (ChunkLoadError).
    // Un simple rechargement récupère les nouveaux chunks. Garde anti-boucle (10 s).
    const msg = `${error?.name ?? ''} ${error?.message ?? ''}`
    const isChunkError = /ChunkLoadError|Loading chunk [\d]+ failed|dynamically imported module|module script failed/i.test(msg)
    if (isChunkError) {
      try {
        const last = Number(sessionStorage.getItem('chunkReloadAt') || '0')
        if (Date.now() - last > 10000) {
          sessionStorage.setItem('chunkReloadAt', String(Date.now()))
          window.location.reload()
          return
        }
      } catch { /* sessionStorage indispo — on affiche l'écran d'erreur */ }
    }

    // Sinon : on logge la VRAIE erreur côté serveur (error_logs) — sans ça on est
    // aveugles ("On a noté l'incident" était un mensonge jusqu'ici).
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message ?? 'unknown',
          name: error?.name ?? null,
          digest: error?.digest ?? null,
          stack: error?.stack ?? null,
          url: typeof window !== 'undefined' ? window.location.href : null,
          ua: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        }),
        keepalive: true,
      }).catch(() => {})
    } catch { /* non-bloquant */ }
  }, [error])

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 mb-6">
          <AlertTriangle className="w-7 h-7 text-red-400" strokeWidth={2} />
        </div>

        <p className="font-display italic text-[var(--accent-luxury)] text-sm tracking-[0.3em] uppercase mb-3">
          Error
        </p>
        <h1 className="font-display font-bold text-4xl md:text-5xl text-white tracking-tight leading-tight mb-4">
          {t.errors.unexpected}
        </h1>
        <p className="text-white/50 text-base font-sans leading-relaxed mb-2 max-w-md mx-auto">
          {t.errors.unexpectedBody}
        </p>
        {error.digest && (
          <p className="text-white/20 text-[10px] font-mono mb-8 mt-3">ref: {error.digest}</p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent-luxury)] text-[var(--text)] font-display font-bold text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-transform"
          >
            <RotateCw className="w-4 h-4" />
            {t.errors.retry}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors"
          >
            <Home className="w-4 h-4" />
            {t.nav.home}
          </Link>
          <a
            href="https://wa.me/2250544872051"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {t.errors.advisor}
          </a>
        </div>
      </div>
    </main>
  )
}
