'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { CopyButton } from '@/components/interior/copy-button'

const HEART_PATH = "M12 20.3 4.3 12.6a4.8 4.8 0 0 1 6.8-6.8l.9.9.9-.9a4.8 4.8 0 0 1 6.8 6.8Z"

const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
  const distance = 16
  return {
    x: Math.round(Math.cos(angle) * distance * 10) / 10,
    y: Math.round(Math.sin(angle) * distance * 10) / 10,
    delay: (i % 2) * 0.03,
  }
})

interface CardActionButtonsProps {
  bienId: string
  bienTitle: string
}

export function CardActionButtons({ bienId, bienTitle }: CardActionButtonsProps) {
  const [liked, setLiked] = useState(false)
  const [burst, setBurst] = useState(0)
  const [shareUrl, setShareUrl] = useState(`/biens/${bienId}`)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/biens/${bienId}`)
      try {
        const saved = localStorage.getItem('immo_favorites')
        if (saved) {
          const ids = JSON.parse(saved)
          if (Array.isArray(ids) && ids.includes(bienId)) {
            setLiked(true)
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [bienId])

  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !liked
    setLiked(next)
    if (next) setBurst((b) => b + 1)

    try {
      const saved = localStorage.getItem('immo_favorites')
      let ids: string[] = saved ? JSON.parse(saved) : []
      if (next) {
        if (!ids.includes(bienId)) ids.push(bienId)
      } else {
        ids = ids.filter((id) => id !== bienId)
      }
      localStorage.setItem('immo_favorites', JSON.stringify(ids))
    } catch {
      // ignore
    }
  }

  return (
    <div
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      className="flex items-center gap-2.5"
    >
      {/* Bouton Like avec micro-interaction particule burst (Interior) */}
      <button
        type="button"
        onClick={toggleLike}
        aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 transition-transform active:scale-90 text-white shadow-md group"
      >
        <motion.svg
          viewBox="0 0 24 24"
          fill={liked ? "#ef4444" : "none"}
          stroke={liked ? "#ef4444" : "currentColor"}
          strokeWidth={1.8}
          className="w-4 h-4 transition-colors"
          animate={{ scale: liked ? [1, 1.35, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <path d={HEART_PATH} />
        </motion.svg>

        {/* Particules éclatantes au clic */}
        {!reduced && burst > 0 && (
          <span key={burst} className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {SPARKS.map((s, i) => (
              <motion.span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm"
                initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
                animate={{ x: s.x, y: s.y, scale: 0, opacity: 0 }}
                transition={{ duration: 0.45, delay: s.delay, ease: [0.23, 1, 0.32, 1] }}
              />
            ))}
          </span>
        )}
      </button>

      {/* Bouton Copier le lien avec feedback coché fluide (Interior) */}
      <CopyButton
        value={shareUrl}
        label="Partager"
        copiedLabel="Lien copié !"
        className="!h-9 !px-3 !text-xs !rounded-full !bg-black/60 hover:!bg-black/80 !border-white/20 !text-white !backdrop-blur-md !shadow-md"
      />
    </div>
  )
}
