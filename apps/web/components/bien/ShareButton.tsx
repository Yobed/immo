'use client'
import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  titre: string
  url?: string
  className?: string
}

export function ShareButton({ titre, url, className = '' }: Props) {
  const [state, setState] = useState<'idle' | 'copied'>('idle')

  const share = async () => {
    const shareUrl = url ?? window.location.href
    const text = `🏠 ${titre} — BOGBE'S GROUPE`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: text, url: shareUrl })
        return
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
    } catch {}
  }

  return (
    <button
      onClick={share}
      aria-label="Partager ce bien"
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-luxury)]/50 text-[var(--text-muted)] hover:text-[var(--text)] transition-all text-sm font-bold active:scale-95 ${className}`}
    >
      {state === 'copied'
        ? <><Check className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500">Lien copié !</span></>
        : <><Share2 className="w-4 h-4" /><span>Partager</span></>
      }
    </button>
  )
}
