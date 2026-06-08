'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageLightboxProps {
  images: string[]
  /** Index initial à afficher quand on ouvre */
  initialIndex?: number
  open: boolean
  onClose: () => void
  /** Alt text de base — les images seront numérotées "N / total" */
  alt?: string
}

/**
 * Lightbox premium pour galerie d'images.
 *
 * Fonctionnalités :
 *  - Plein écran avec backdrop noir gradient + blur
 *  - Navigation : flèches gauche/droite (desktop) + swipe (mobile) + touches ←/→
 *  - Zoom : bouton +/- (desktop) + pinch-to-zoom natif (mobile)
 *  - Thumbnails au bas avec scroll horizontal + active highlight
 *  - Compteur "3 / 12"
 *  - Body scroll lock
 *  - Touche Esc pour fermer
 *  - Click sur backdrop pour fermer
 *  - Reduced motion : transitions courtes
 */
export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
  alt = 'Photo',
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const imgWrapperRef = useRef<HTMLDivElement>(null)
  const thumbContainerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const total = images.length

  // Reset index quand on ouvre la lightbox
  useEffect(() => {
    if (open) {
      setIndex(initialIndex)
      setZoom(1)
    }
  }, [open, initialIndex])

  const goNext = useCallback(() => {
    setZoom(1)
    setIndex((i) => (i + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    setZoom(1)
    setIndex((i) => (i - 1 + total) % total)
  }, [total])

  // Clavier : ← → Esc
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 3))
      else if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goNext, goPrev])

  // Lock body scroll + signale aux autres composants fixed (cookie banner,
  // bouton WhatsApp flottant, etc.) qu'un modal est ouvert via `data-modal-open`.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    document.documentElement.setAttribute('data-modal-open', 'true')
    return () => {
      document.body.style.overflow = prev
      document.body.style.paddingRight = ''
      document.documentElement.removeAttribute('data-modal-open')
    }
  }, [open])

  // Scroll thumbnail dans la vue quand index change
  useEffect(() => {
    if (!thumbContainerRef.current) return
    const container = thumbContainerRef.current
    const active = container.querySelector<HTMLButtonElement>(`[data-thumb-index="${index}"]`)
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [index])

  // Swipe gesture handler
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x > threshold) goPrev()
    else if (info.offset.x < -threshold) goNext()
  }

  if (!open || total === 0) return null

  const currentImage = images[index]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Galerie photo — ${index + 1} sur ${total}`}
          className="fixed inset-0 z-[500] flex flex-col bg-gradient-to-br from-black via-black/95 to-slate-950 backdrop-blur-xl"
          style={{ height: '100dvh' }}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => {
            // Click sur backdrop (pas sur l'image) → ferme
            if (e.target === e.currentTarget) onClose()
          }}
        >
          {/* Top bar : compteur + zoom + fermer */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-white">
            <div className="text-sm font-medium tabular-nums">
              <span className="font-bold">{index + 1}</span>
              <span className="opacity-50 mx-1">/</span>
              <span className="opacity-70">{total}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Zoom controls — masqués si une seule image ou en très petit écran */}
              <div className="hidden sm:flex items-center gap-1 mr-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 1))}
                  disabled={zoom <= 1}
                  aria-label="Réduire le zoom"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  disabled={zoom >= 3}
                  aria-label="Augmenter le zoom"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la galerie"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image area + flèches lat */}
          <div
            className="relative flex-1 flex items-center justify-center px-2 sm:px-6 overflow-hidden"
            ref={imgWrapperRef}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose()
            }}
          >
            {/* Prev arrow */}
            {total > 1 && (
              <button
                type="button"
                onClick={goPrev}
                aria-label="Image précédente"
                className="hidden sm:flex absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image (draggable pour swipe sur mobile) */}
            <motion.div
              key={index}
              drag={zoom === 1 && total > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={handleDragEnd}
              className="relative max-w-full max-h-full flex items-center justify-center touch-pan-y cursor-grab active:cursor-grabbing"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage}
                alt={`${alt} ${index + 1} sur ${total}`}
                className="max-w-full max-h-[65dvh] sm:max-h-[70dvh] object-contain select-none"
                draggable={false}
              />
            </motion.div>

            {/* Next arrow */}
            {total > 1 && (
              <button
                type="button"
                onClick={goNext}
                aria-label="Image suivante"
                className="hidden sm:flex absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Thumbnails bar */}
          {total > 1 && (
            <div
              ref={thumbContainerRef}
              className="flex gap-2 px-3 sm:px-6 pb-4 pt-2 overflow-x-auto no-scrollbar"
            >
              {images.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  data-thumb-index={i}
                  onClick={() => {
                    setZoom(1)
                    setIndex(i)
                  }}
                  aria-label={`Aller à l'image ${i + 1}`}
                  className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden transition-all ${
                    i === index
                      ? 'ring-2 ring-[var(--accent-luxury)] opacity-100 scale-100'
                      : 'opacity-60 hover:opacity-100 scale-95'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
