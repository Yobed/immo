'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'

/**
 * Bouton compact "Retour à l'accueil" qui apparaît sur TOUTES les pages
 * sauf la racine `/`. Discret, juste sous le header.
 */
export function BackToHomeButton() {
  const pathname = usePathname()

  // Visible partout sauf sur la home
  if (pathname === '/') return null

  return (
    <div className="max-w-7xl mx-auto px-4 pt-3 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent-luxury)]/40 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
      >
        <Home className="w-3 h-3" />
        Accueil
      </Link>
    </div>
  )
}
