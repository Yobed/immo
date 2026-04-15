'use client'
import { useEffect, useState } from 'react'
import { useInView } from '@/hooks/useInView'

function useCounter(target: number, active: boolean, duration = 1800) {
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
    label: 'Biens disponibles',
    suffix: '+',
    desc: 'Annonces vérifiées',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
    ),
    color: '#F97316',
    delay: 0,
  },
  {
    target: 12,
    label: 'Communes',
    suffix: '',
    desc: 'Couverte à Abidjan',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
    color: '#0D9F6E',
    delay: 100,
  },
  {
    target: 98,
    label: 'Satisfaction',
    suffix: '%',
    desc: 'Clients satisfaits',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    color: '#F97316',
    delay: 200,
  },
  {
    target: 48,
    label: 'Note moyenne',
    suffix: '/5',
    desc: 'Sur toutes les plateformes',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    tenths: true,
    color: '#0D9F6E',
    delay: 300,
  },
]

function StatCard({
  target, label, suffix, desc, icon, tenths, color, delay, active,
}: {
  target: number; label: string; suffix: string; desc: string; icon: React.ReactNode
  tenths?: boolean; color: string; delay: number; active: boolean
}) {
  const count = useCounter(target, active)
  const display = tenths ? (count / 10).toFixed(1) : count.toLocaleString('fr-FR')

  return (
    <div
      className={`sr sr-up ${active ? 'visible' : ''} group relative rounded-[24px] p-7 overflow-hidden transition-all duration-700 hover:-translate-y-2 cursor-default card-glass`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[24px] pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}20 0%, transparent 70%)` }}
      />

      {/* Top gradient accent bar */}
      <div
        className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="relative">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>

        {/* Number */}
        <p
          className="font-mono text-4xl sm:text-5xl font-bold mb-1 leading-none"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}BB)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {display}<span className="text-2xl">{suffix}</span>
        </p>

        <p className="font-display font-semibold text-white text-base mb-0.5">{label}</p>
        <p className="font-sans text-white/45 text-sm">{desc}</p>
      </div>
    </div>
  )
}

export function Stats() {
  const { ref, visible } = useInView(0.12)

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="py-20 sm:py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #06173A 0%, #0C2D5E 50%, #0a2550 100%)' }}
    >
      {/* Animated orbs */}
      <div
        className="absolute right-0 top-0 w-[500px] h-[500px] anim-orb-1 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}
      />
      <div
        className="absolute left-0 bottom-0 w-[400px] h-[400px] anim-orb-2 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(13,159,110,0.12) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)' }}
      />
      <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-16 sr sr-up ${visible ? 'visible' : ''}`}>
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-sm font-bold uppercase tracking-wider font-sans">
            Nos résultats
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Immo CI en chiffres
          </h2>
          <p className="font-sans text-white/55 text-lg max-w-md mx-auto leading-relaxed">
            La confiance de milliers d&apos;ivoiriens, prouvée par les données.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} active={visible} />
          ))}
        </div>

        {/* Bottom trust bar */}
        <div className={`sr sr-up ${visible ? 'visible' : ''} mt-16 flex flex-wrap justify-center gap-6`} style={{ transitionDelay: '400ms' }}>
          {['Wave', 'Orange Money', 'MTN', 'CinetPay'].map((p) => (
            <div key={p} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="font-sans text-xs text-white/60 font-medium">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
