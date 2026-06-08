'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, X } from 'lucide-react'

/**
 * Activity feed live : une bulle discrète en bas à gauche qui affiche les
 * dernières demandes de visite anonymisées. Auto-rotate toutes les 8s.
 *
 * Comportement :
 *  - Apparaît 3s après le mount (laisse le temps de voir la page d'abord)
 *  - Se rétracte au scroll rapide pour ne pas gêner
 *  - Réapparaît à l'arrêt du scroll
 *  - Click X → masquée pour toute la session (localStorage)
 *  - Cachée sur la home après le premier scroll (pour ne pas concurrencer le hero)
 */

interface FeedItem {
  who: string
  action: string
  where: string
  when: string
}

const STORAGE_KEY = 'bogbes:activity-feed-dismissed'
const ROTATE_MS = 8000
const APPEAR_DELAY_MS = 3000

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'à l\'instant'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const scrollTimer = useRef<number | null>(null)

  // Fetch des activités au mount
  useEffect(() => {
    // Vérifie le localStorage : si dismissed dans la session, ne rien faire
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        setDismissed(true)
        return
      }
    } catch {
      /* sessionStorage peut être bloqué en privé/iframe — on continue */
    }

    let cancelled = false
    fetch('/api/activity-feed')
      .then((r) => r.json())
      .then((data: { items: FeedItem[] }) => {
        if (cancelled) return
        if (data.items && data.items.length > 0) {
          setItems(data.items)
          // Apparition différée pour ne pas voler la vedette au hero
          setTimeout(() => !cancelled && setVisible(true), APPEAR_DELAY_MS)
        }
      })
      .catch(() => {
        /* silencieux : feed est cosmétique, échec ne casse rien */
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Rotation auto
  useEffect(() => {
    if (items.length < 2) return
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, ROTATE_MS)
    return () => clearInterval(interval)
  }, [items.length])

  // Détection du scroll : masque le feed pendant le scroll, le ré-affiche à l'arrêt
  useEffect(() => {
    function onScroll() {
      setScrolling(true)
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => setScrolling(false), 600)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current)
    }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* idem */
    }
  }

  // Ne rien rendre si pas de data ou dismissed
  if (dismissed || items.length === 0) return null

  const current = items[index]
  const shouldShow = visible && !scrolling

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          // Position : bottom-left, au-dessus de la MobileTabBar et du cookie banner
          // → bottom-[170px] sur mobile, bottom-6 sur desktop.
          className="fixed left-3 sm:left-6 bottom-[170px] lg:bottom-6 z-[90] pointer-events-auto max-w-[280px] sm:max-w-xs"
          initial={prefersReducedMotion ? false : { opacity: 0, x: -20, y: 8 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20, y: 8 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative flex items-start gap-2.5 pl-3 pr-2 py-2.5 rounded-xl bg-[var(--surface-card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-[0_8px_28px_-8px_rgba(0,0,0,0.25)]">
            {/* Pulse dot */}
            <span className="relative flex w-2 h-2 mt-1.5 shrink-0">
              <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
            </span>

            {/* Contenu rotatif (animation entre items) */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${index}-${current.when}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[11px] text-[var(--text)] leading-snug">
                    <span className="font-bold">{current.who}</span> {current.action}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 inline-flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    {current.where}
                    <span className="mx-1 opacity-50">·</span>
                    <span>{timeAgo(current.when)}</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bouton fermer */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Masquer les notifications d'activité"
              className="shrink-0 w-5 h-5 -mr-0.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
