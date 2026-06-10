'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface FavorisButtonProps {
  bienId: string
  userId: string | null
  initialIsFavori?: boolean
  className?: string
}

export function FavorisButton({ bienId, userId, initialIsFavori = false, className }: FavorisButtonProps) {
  const [isFavori, setIsFavori] = useState(initialIsFavori)
  const [loading, setLoading] = useState(false)
  const [popKey, setPopKey] = useState(0)
  const supabase = createClient()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      // Redirige vers login en mémorisant la page de retour
      const redirect = typeof window !== 'undefined' ? window.location.pathname : '/'
      window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
      return
    }

    // Pop animation au clic (changement de clé = re-trigger CSS animation)
    setPopKey(k => k + 1)

    // Optimistic update : on change l'UI tout de suite, on rollback si erreur
    const wasFavori = isFavori
    setIsFavori(!wasFavori)
    setLoading(true)
    try {
      if (wasFavori) {
        const { error } = await supabase
          .from('favoris')
          .delete()
          .eq('user_id', userId)
          .eq('bien_id', bienId)
        if (error) throw error
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('favoris')
          .upsert(
            { user_id: userId, bien_id: bienId },
            { onConflict: 'user_id,bien_id', ignoreDuplicates: true }
          )
        if (error) throw error
      }
    } catch {
      // Rollback en cas d'erreur — l'utilisateur voit le bouton revenir à son état
      setIsFavori(wasFavori)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm',
        isFavori
          ? 'bg-danger text-white hover:bg-danger/90'
          : 'bg-[var(--surface-card)] text-muted hover:text-danger hover:border-danger border border-[var(--border)]',
        loading && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <svg
        key={popKey}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isFavori ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={popKey > 0 ? 'heart-pop' : undefined}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
