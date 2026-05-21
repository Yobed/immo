'use client'
import Link from 'next/link'
import { useState } from 'react'
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
  image?: string          // Optional cover image (replaces icon-based card when present)
  iconBg: string
  iconColor: string
  ctaColor: string
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
      image: '/journey/je-cherche.png',
      iconBg: 'bg-[#C5A059]/10 border-[#C5A059]/30',
      iconColor: 'text-amber-700',
      ctaColor: 'text-amber-700',
    },
    {
      icon: <Flame className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j2Label,
      title: t.journey.j2Title,
      description: t.journey.j2Desc,
      cta: t.journey.j2Cta,
      href: '/offre-flash',
      image: '/journey/offres-flash.png',
      iconBg: 'bg-orange-500/10 border-orange-500/30',
      iconColor: 'text-orange-600',
      ctaColor: 'text-orange-600',
    },
    {
      icon: <Compass className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j3Label,
      title: t.journey.j3Title,
      description: t.journey.j3Desc,
      cta: t.journey.j3Cta,
      href: '/recherche',
      image: '/journey/recherche-avancee.png',
      iconBg: 'bg-blue-500/10 border-blue-500/30',
      iconColor: 'text-blue-700',
      ctaColor: 'text-blue-700',
    },
    {
      icon: <Crown className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j4Label,
      title: t.journey.j4Title,
      description: t.journey.j4Desc,
      cta: t.journey.j4Cta,
      href: '/login?next=/mes-biens/nouveau',
      image: '/journey/proprietaire.png',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-700',
      ctaColor: 'text-amber-700',
    },
    {
      icon: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
      label: t.journey.j5Label,
      title: t.journey.j5Title,
      description: t.journey.j5Desc,
      cta: t.journey.j5Cta,
      href: TALLY_FORM_URL,
      external: true,
      image: '/journey/publier-whatsapp.png',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-700',
      ctaColor: 'text-emerald-700',
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
          <p className="font-sans text-sm md:text-base text-[var(--text-muted)] mt-6 leading-relaxed">
            {t.journey.subtitle}
          </p>
        </div>

        {/* Primary persona switch — answers "Je suis…" at a glance, above the 5 cards */}
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-[var(--text-muted)] mr-1">{t.journey.iAm}</span>
          <Link
            href="/biens"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-full bg-[var(--accent-luxury)] text-[var(--on-accent)] font-bold text-[12px] uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
          >
            {t.journey.imRenter} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/login?next=/mes-biens/nouveau"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--text)] font-bold text-[12px] uppercase tracking-wider hover:border-[var(--accent-luxury)] active:scale-95 transition-all"
          >
            {t.journey.imOwner} <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Journey cards — secondary level, image when available, icon fallback otherwise */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          {JOURNEYS.map((j, i) => (
            <JourneyCard key={j.title} journey={j} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function JourneyCard({ journey: j, index: i }: { journey: Journey; index: number }) {
  const [imgError, setImgError] = useState(false)
  const linkProps = j.external
    ? { href: j.href, target: '_blank' as const, rel: 'noopener' }
    : { href: j.href }

  const showImage = j.image && !imgError

  if (showImage) {
    return (
      <Link
        {...linkProps}
        aria-label={`${j.title} — ${j.label}`}
        className="group relative block aspect-[4/3] sm:aspect-[5/4] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-card)] transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--accent-luxury)] focus-visible:ring-offset-2"
      >
        {/* Use plain img for graceful error handling */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={j.image}
          alt=""
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-700"
        />

        {/* Persona pill — visible always, top-left */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-card)]/95 backdrop-blur-sm border border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--text)]">
          {j.label}
        </span>

        {/* Bottom gradient + title — readable on any image */}
        <div className="absolute inset-x-0 bottom-0 pt-12 pb-3 px-3 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
          <h3 className="font-display text-base md:text-lg font-bold text-white leading-tight mb-0.5 line-clamp-1">
            {j.title}
          </h3>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-white/85 group-hover:gap-2 transition-all">
            {j.cta}
            <ArrowUpRight className="w-3 h-3" />
          </p>
        </div>
      </Link>
    )
  }

  // Fallback: icon-based card
  return (
    <Link
      {...linkProps}
      className="group relative flex flex-col bg-[var(--surface-card)] rounded-2xl p-5 md:p-6 border border-[var(--border)] transition-all duration-500 hover:bg-[var(--surface-hover)] hover:-translate-y-1 shadow-sm hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-5">
        <div className={`w-11 h-11 rounded-xl ${j.iconBg} border flex items-center justify-center ${j.iconColor}`}>
          {j.icon}
        </div>
        <span className="font-mono text-[10px] text-[var(--text-muted)] mt-1" aria-hidden="true">
          0{i + 1}
        </span>
      </div>

      <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2">
        {j.label}
      </p>

      <h3 className="font-display text-2xl text-[var(--text)] leading-tight mb-3">
        {j.title}
      </h3>

      <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed mb-6 flex-1">
        {j.description}
      </p>

      <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] ${j.ctaColor} group-hover:gap-2.5 transition-all mt-auto`}>
        {j.cta}
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  )
}
