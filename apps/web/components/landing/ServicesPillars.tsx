import Link from 'next/link'
import { ShieldCheck, Sparkles, RotateCcw, ScrollText, ArrowUpRight } from 'lucide-react'

interface Pillar {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}

const PILLARS: Pillar[] = [
  {
    icon: <Sparkles className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Conciergerie VIP',
    description: 'Un agent dédié vous accompagne de la première visite à la signature. Disponibilité 7j/7 sur WhatsApp.',
    href: '/services',
  },
  {
    icon: <RotateCcw className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Visite virtuelle 360°',
    description: 'Découvrez chaque pièce comme si vous y étiez. Économisez vos déplacements, ne visitez en personne que les coups de cœur.',
    href: '/biens',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />,
    title: 'KYC & propriétaires vérifiés',
    description: 'Identité, titre de propriété et coordonnées validées. Vous savez exactement à qui vous parlez.',
    href: '/services',
  },
  {
    icon: <ScrollText className="w-6 h-6" strokeWidth={1.5} />,
    title: 'Contrats sécurisés',
    description: 'Bail électronique conforme au droit ivoirien, signature en ligne, quittances automatiques. Tout est tracé.',
    href: '/services',
  },
]

export function ServicesPillars() {
  return (
    <section className="relative py-16 md:py-24 bg-[#0a0f1c] overflow-hidden">
      {/* Top divider line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[#D97706]/50 to-transparent" />

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#D97706] mb-4">
            L&apos;expérience Immo CI
          </p>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight max-w-3xl mx-auto">
            Quatre piliers pour<br />
            <span className="italic font-light text-[#D97706]">une transaction sereine</span>
          </h2>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {PILLARS.map((p, i) => (
            <Link
              key={p.title}
              href={p.href}
              className="group relative bg-white/[0.03] border border-white/10 hover:border-[#D97706]/40 rounded-3xl p-6 md:p-7 transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.05]"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#D97706]/10 border border-[#D97706]/30 flex items-center justify-center text-[#D97706] mb-5 group-hover:bg-[#D97706]/20 transition-colors duration-300">
                {p.icon}
              </div>

              {/* Number */}
              <span className="absolute top-6 right-6 font-mono text-[10px] text-white/20 group-hover:text-[#D97706]/40 transition-colors">
                0{i + 1}
              </span>

              {/* Title */}
              <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-3 leading-tight">
                {p.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                {p.description}
              </p>

              {/* Arrow */}
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#D97706] opacity-60 group-hover:opacity-100 transition-opacity">
                En savoir plus
                <ArrowUpRight className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Subtle gradient on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#D97706]/0 to-[#D97706]/0 group-hover:from-[#D97706]/[0.02] group-hover:to-transparent pointer-events-none transition-all duration-500" />
            </Link>
          ))}
        </div>

        {/* Bottom line */}
        <div className="mt-14 md:mt-20 flex items-center justify-center">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-white/70">
              Plus de <span className="text-white font-bold">450 transactions</span> sécurisées en 2026
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
