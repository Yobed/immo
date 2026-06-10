import Link from 'next/link'
import { Home, Search, MessageCircle } from 'lucide-react'
import { getDictionary } from '@/lib/i18n/server'

export default async function NotFound() {
  const t = await getDictionary()
  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] -mt-32 pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(65% 0.18 45 / 0.08) 0%, transparent 70%)' }}
        />

        <p className="font-display italic text-[var(--accent-luxury)] text-sm tracking-[0.3em] uppercase mb-3">
          404
        </p>
        <h1 className="font-display font-bold text-5xl md:text-7xl text-white tracking-tight leading-none mb-4">
          {t.errors.notFound}
        </h1>
        <p className="text-white/50 text-base font-sans leading-relaxed mb-10 max-w-md mx-auto">
          {t.errors.notFoundBody}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--accent-luxury)] text-[var(--text)] font-display font-bold text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-transform"
          >
            <Home className="w-4 h-4" />
            {t.nav.home}
          </Link>
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors"
          >
            <Search className="w-4 h-4" />
            {t.nav.biens}
          </Link>
          <a
            href="https://wa.me/2250544872051?text=Bonjour%2C%20je%20cherche%20un%20bien%20%C3%A0%20Abidjan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Sapphire
          </a>
        </div>
      </div>
    </main>
  )
}
