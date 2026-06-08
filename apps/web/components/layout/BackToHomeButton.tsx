'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Home } from 'lucide-react'
import { useCallback } from 'react'

interface BackToHomeButtonProps {
  /**
   * Cible du bouton. Par défaut `/` (home publique).
   * Sur les espaces authentifiés (pro/client/admin), passer `/dashboard` ou
   * équivalent pour rediriger vers le tableau de bord adapté.
   */
  href?: string
  /** Texte du bouton — par défaut "Accueil" */
  label?: string
}

/**
 * Bouton de retour vers une page principale.
 *
 * Stratégie de navigation à 3 niveaux (du plus rapide au plus aggressif) :
 *  1. router.push() — navigation Next.js client-side (SPA-like)
 *  2. router.refresh() pour forcer la revalidation si nécessaire
 *  3. window.location.href en fallback ultime si rien ne se passe en 200ms
 *
 * On utilise un <button> + onClick plutôt qu'un <Link> pour avoir un contrôle
 * total et éviter tout interception (modal overlay, form blocker, etc.).
 */
export function BackToHomeButton({ href = '/', label = 'Accueil' }: BackToHomeButtonProps = {}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = useCallback(() => {
    // Snapshot du chemin actuel pour vérifier la navigation après
    const startPath = window.location.pathname
    // Tentative 1 : router.push (rapide, garde le state SPA)
    router.push(href)
    // Filet de sécurité : si après 200ms on est toujours sur la même page,
    // on force une navigation hard (full reload). Couvre les cas :
    //   - hydratation Next.js cassée
    //   - middleware qui bloque silencieusement
    //   - intercepteur de form non détecté
    setTimeout(() => {
      if (window.location.pathname === startPath) {
        window.location.href = href
      }
    }, 200)
  }, [href, router])

  // Cacher si on est déjà sur la cible
  if (pathname === href) return null

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 pt-3 lg:px-8">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-accent-luxury/40 text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
      >
        <Home className="w-3 h-3" />
        {label}
      </button>
    </div>
  )
}
