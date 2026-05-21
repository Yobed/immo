'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

function useCounter(target: number, active: boolean, duration = 2500) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])
  return count
}

const STATS = [
  {
    target: 2450,
    label: 'Biens d\'Exception',
    suffix: '+',
    desc: 'Une sélection rigoureuse pour des résidents exigeants.',
  },
  {
    target: 12,
    label: 'Rayonnement Local',
    suffix: '',
    desc: 'Communes stratégiques couvertes avec excellence.',
  },
  {
    target: 98,
    label: 'Clients Heureux',
    suffix: '%',
    desc: 'Le taux de recommandation de nos utilisateurs.',
  },
  {
    target: 48,
    label: 'Prestige Global',
    suffix: '/5',
    desc: 'Une note reflétant notre engagement absolu.',
    tenths: true,
  },
]

export function Stats() {
  const [isActive, setIsActive] = useState(false)

  return (
    <section
      className="py-[var(--section-py)] bg-[var(--background)] relative overflow-hidden -mt-10 rounded-t-[var(--radius-2xl)] z-[70]"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" />
      </div>

      <div className="relative container mx-auto px-6 max-w-7xl">
        {/* Editorial Header — title carries the full message, no redundant lede */}
        <div className="mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <span className="text-[var(--text-muted)] font-sans tracking-[0.35em] uppercase text-xs mb-6 block font-medium">
              Performance & Rigueur
            </span>
            <h2 className="font-display text-4xl md:text-7xl font-light text-[var(--text)] leading-[1.05] tracking-tighter">
              L'immobilier en <span className="italic font-serif opacity-70">sa plus haute expression.</span>
            </h2>
          </motion.div>
        </div>

        {/* Minimalist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Vertical Divider Line for Large Screens */}
          <div className="absolute inset-y-0 left-1/4 w-[1px] bg-[var(--border)] opacity-20 hidden lg:block" />
          <div className="absolute inset-y-0 left-2/4 w-[1px] bg-[var(--border)] opacity-20 hidden lg:block" />
          <div className="absolute inset-y-0 left-3/4 w-[1px] bg-[var(--border)] opacity-20 hidden lg:block" />

          {STATS.map((s, idx) => (
            <StatItem key={s.label} {...s} index={idx} onEnter={() => setIsActive(true)} active={isActive} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatItem({ target, label, suffix, desc, tenths, index, onEnter, active }: any) {
  const count = useCounter(target, active)
  const display = tenths ? (count / 10).toFixed(1) : count.toLocaleString('fr-FR')

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onViewportEnter={onEnter}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      className="group"
    >
      <div className="mb-8">
        <span className="text-xs font-sans tracking-[0.18em] uppercase text-[var(--text-muted)] opacity-90 mb-8 block transition-colors group-hover:text-[var(--text)]">
          Ref. 0{index + 1}
        </span>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="font-display text-6xl md:text-8xl font-thin tracking-tighter text-[var(--text)] transition-transform duration-700 group-hover:scale-105 inline-block">
            {display}
          </span>
          <span className="font-serif italic text-2xl md:text-4xl text-[var(--text-muted)]">{suffix}</span>
        </div>
        <h3 className="font-display text-xl font-light text-[var(--text)] mb-4 tracking-tight">
          {label}
        </h3>
        <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed max-w-[200px]">
          {desc}
        </p>
      </div>
    </motion.div>
  )
}
