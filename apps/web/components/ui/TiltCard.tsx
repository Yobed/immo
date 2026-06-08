'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type MotionStyle } from 'framer-motion'

interface TiltCardProps {
  children: React.ReactNode
  /** Amplitude max du tilt en degrés (défaut 8) */
  maxTilt?: number
  /** Force la profondeur (translateZ) sur les enfants si combiné avec perspective (défaut 8px) */
  depth?: number
  /** Affiche un highlight glossy qui suit le curseur */
  glossy?: boolean
  className?: string
}

/**
 * Wrapper de carte avec effet de tilt 3D suivant la souris (style Apple).
 *
 * - Tilt léger ±maxTilt° sur axes X/Y selon position du curseur
 * - Highlight glossy radial qui suit la souris (option glossy)
 * - Spring lissé pour mouvements doux
 * - Retour à zéro au mouseleave
 * - Désactivé si reduced-motion ou tactile (pas de hover)
 */
export function TiltCard({
  children,
  maxTilt = 8,
  depth = 8,
  glossy = true,
  className = '',
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Coordonnées brutes [-0.5, 0.5]
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // Spring lissé pour mouvement souple
  const x = useSpring(rawX, { stiffness: 220, damping: 28, mass: 0.5 })
  const y = useSpring(rawY, { stiffness: 220, damping: 28, mass: 0.5 })

  // Conversion en rotations (sens inversé pour effet naturel)
  const rotateX = useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt])
  const rotateY = useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt])

  // Position du highlight glossy (en % sur la carte)
  const glossyX = useTransform(x, [-0.5, 0.5], ['0%', '100%'])
  const glossyY = useTransform(y, [-0.5, 0.5], ['0%', '100%'])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rawX.set(px)
    rawY.set(py)
  }

  function handleMouseLeave() {
    rawX.set(0)
    rawY.set(0)
  }

  const containerStyle: MotionStyle = prefersReducedMotion
    ? {}
    : {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ perspective: 1200 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={containerStyle}
      >
        {/* Contenu — élevé légèrement en Z pour vrai effet de profondeur */}
        <div
          className="relative w-full h-full"
          style={prefersReducedMotion ? undefined : { transform: `translateZ(${depth}px)` }}
        >
          {children}
        </div>

        {/* Highlight glossy qui suit le curseur (overlay non-interactif) */}
        {glossy && !prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-soft-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: useTransform(
                [glossyX, glossyY],
                ([gx, gy]) =>
                  `radial-gradient(circle 240px at ${gx} ${gy}, rgba(255,255,255,0.45), transparent 60%)`,
              ),
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
