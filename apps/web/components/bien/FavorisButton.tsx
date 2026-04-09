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
  const supabase = createClient()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      window.location.href = '/login'
      return
    }

    setLoading(true)
    if (isFavori) {
      // Retrait du favori
      await supabase
        .from('favoris')
        .delete()
        .eq('user_id', userId)
        .eq('bien_id', bienId)
      setIsFavori(false)
    } else {
      // Ajout en favori — upsert pour éviter duplicate key sur unique(user_id, bien_id)
      await supabase
        .from('favoris')
        .upsert(
          { user_id: userId, bien_id: bienId },
          { onConflict: 'user_id,bien_id', ignoreDuplicates: true }
        )
      setIsFavori(true)
    }
    setLoading(false)
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
          : 'bg-white text-muted hover:text-danger hover:border-danger border border-[var(--border)]',
        loading && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isFavori ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
