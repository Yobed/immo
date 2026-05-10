'use client'
import Link from 'next/link'
import { Search, Flame, Compass, Crown, MessageCircle, ArrowUpRight } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

interface Journey {
  icon: React.ReactNode
  label: string
  title: string
  description: string
  cta: string
  href: string
  external?: boolean
  accent: string
  borderColor: string
  iconBg: string
  iconColor: string
}

const TALLY_FORM_URL = 'https://tally.so/r/QKxNNp'

export function JourneyShortcuts() {
  const t = useT()
  const JOURNEYS: Journey[] = [
    {
      icon: <Search className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j1Label,
      title: t.journey.j1Title,
      description: t.journey.j1Desc,
      cta: t.journey.j1Cta,
      href: '/biens',
      accent: t.card.verified,
      borderColor: 'border-[#C5A059]/30 hover:border-[#C5A059]',
      iconBg: 'bg-[#C5A059]/10 border-[#C5A059]/30',
      iconColor: 'text-amber-700',
    },
    {
      icon: <Flame className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j2Label,
      title: t.journey.j2Title,
      description: t.journey.j2Desc,
      cta: t.journey.j2Cta,
      href: '/offre-flash',
      accent: 'Live',
      borderColor: 'border-orange-500/30 hover:border-orange-500',
      iconBg: 'bg-orange-500/10 border-orange-500/30',
      iconColor: 'text-orange-600',
    },
    {
      icon: <Compass className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j3Label,
      title: t.journey.j3Title,
      description: t.journey.j3Desc,
      cta: t.journey.j3Cta,
      href: '/recherche',
      accent: 'Pro',
      borderColor: 'border-blue-500/30 hover:border-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/30',
      iconColor: 'text-blue-700',
    },
    {
      icon: <Crown className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j4Label,
      title: t.journey.j4Title,
      description: t.journey.j4Desc,
      cta: t.journey.j4Cta,
      href: '/login?next=/mes-biens/nouveau',
      accent: 'Premium',
      borderColor: 'border-amber-500/30 hover:border-[var(--accent-luxury)]',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-700',
    },
    {
      icon: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j5Label,
      title: t.journey.j5Title,
      description: t.journey.j5Desc,
      cta: t.journey.j5Cta,
      href: TALLY_FORM_URL,
      external: true,
      accent: 'Express',
      borderColor: 'border-emerald-500/30 hover:border-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-700',
    },
  ]
  return (
    <section className="relative py-16 md:py-24 bg-[var(--background)] overflow-hidden">
      {/* Top divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-8 bg-amber-700" />
            <p className="text-[10px] font-medium tracking-[0.5em] uppercase text-amber-700">
              {t.journey.kicker}
            </p>
            <div className="h-px w-8 bg-amber-700" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-[var(--text)] leading-[1.05] tracking-tight">
            {t.journey.title1}<br />
            <span className="font-display italic text-[var(--accent-luxury)]">{t.journey.title2}</span>
          </h2>
          <p className="font-sans text-sm md:text-base text-slate-600 mt-6 leading-relaxed">
            {t.journey.subtitle}
          </p>
        </div>

        {/* Journey cards — flow horizontal sur desktop, stack mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {JOURNEYS.map((j, i) => {
            const linkProps = j.external
              ? { href: j.href, target: '_blank' as const, rel: 'noopener' }
              : { href: j.href }
            return (
              <Link
                key={j.title}
                {...linkProps}
                className={`group relative flex flex-col bg-[var(--surface-card)] rounded-2xl p-5 md:p-6 border border-[var(--border)] transition-all duration-500 hover:bg-[var(--surface-hover)] hover:-translate-y-1 shadow-sm hover:shadow-md`}
              >
                {/* Header: number + accent */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 rounded-xl ${j.iconBg} border flex items-center justify-center ${j.iconColor}`}>
                    {j.icon}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 mt-1" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>

                {/* Label */}
                <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-slate-500 mb-2">
                  {j.label}
                </p>

                {/* Title */}
                <h3 className="font-display text-2xl text-[var(--text)] leading-tight mb-3">
                  {j.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed mb-6 flex-1">
                  {j.description}
                </p>

                {/* CTA */}
                <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] ${j.iconColor} group-hover:gap-2.5 transition-all mt-auto`}>
                  {j.cta}
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
