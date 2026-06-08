'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

interface AnimatedCounterProps {
  /** Valeur cible vers laquelle on compte */
  to: number
  /** Durée en ms (par défaut 1500) */
  duration?: number
  /** Préfixe statique (ex: "≈") */
  prefix?: string
  /** Suffixe statique (ex: "+", "k") */
  suffix?: string
  /** Locale pour le séparateur de milliers (par défaut fr-FR) */
  locale?: string
  className?: string
}

/**
 * Compteur animé qui démarre à 0 et s'incrémente vers `to` quand le composant
 * entre dans le viewport. Utilise un easing "spring" doux pour finir avec un
 * léger rebond. Si l'utilisateur préfère reduced-motion, affiche directement
 * la valeur finale.
 */
export function AnimatedCounter({
  to,
  duration = 1500,
  prefix = '',
  suffix = '',
  locale = 'fr-FR',
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const prefersReducedMotion = useReducedMotion()
  const [display, setDisplay] = useState(prefersReducedMotion ? to : 0)

  useEffect(() => {
    if (!inView || prefersReducedMotion) {
      setDisplay(to)
      return
    }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      // easeOutQuart : démarre rapide puis ralentit nettement
      const eased = 1 - Math.pow(1 - t, 4)
      setDisplay(Math.round(eased * to))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration, prefersReducedMotion])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {prefix}
      {display.toLocaleString(locale)}
      {suffix}
    </motion.span>
  )
}

/**
 * Variante pour les valeurs textuelles (ex: "< 1h", "5h30") qui n'ont pas
 * de sens à incrémenter. Apparition simple en fade-up quand visible.
 */
interface AnimatedLabelProps {
  label: string
  className?: string
}

export function AnimatedLabel({ label, className = '' }: AnimatedLabelProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {label}
    </motion.span>
  )
}
