'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { FavorisNote } from './FavorisNote'

interface Props {
  bienId: string
  userId: string
  initialIsFavori?: boolean
  className?: string
}

export function FavorisWithNote({ bienId, userId, initialIsFavori = false, className }: Props) {
  const [isFavori, setIsFavori] = useState(initialIsFavori)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    if (isFavori) {
      await supabase.from('favoris').delete().eq('user_id', userId).eq('bien_id', bienId)
      setIsFavori(false)
    } else {
      await supabase.from('favoris').upsert({ user_id: userId, bien_id: bienId }, { onConflict: 'user_id,bien_id', ignoreDuplicates: true })
      setIsFavori(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col">
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-bold transition-all active:scale-95',
          isFavori
            ? 'text-rose-500 border-rose-300 bg-rose-50'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent-luxury)]/50',
          loading && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavori ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {isFavori ? 'Sauvegardé' : 'Sauvegarder'}
      </button>
      <FavorisNote bienId={bienId} isFavori={isFavori} />
    </div>
  )
}
