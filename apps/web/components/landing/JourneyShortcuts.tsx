import Link from 'next/link'
import { Search, Flame, Compass, Crown, MessageCircle, ArrowUpRight } from 'lucide-react'

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

const JOURNEYS: Journey[] = [
  {
    icon: <Search className="w-5 h-5" strokeWidth={1.5} />,
    label: 'Acheteur · Locataire',
    title: 'Je cherche un bien',
    description: 'Catalogue de résidences vérifiées par notre équipe. Conciergerie VIP incluse.',
    cta: 'Voir les annonces',
    href: '/biens',
    accent: 'Vérifié',
    borderColor: 'border-[#C5A059]/30 hover:border-[#C5A059]',
    iconBg: 'bg-[#C5A059]/10 border-[#C5A059]/30',
    iconColor: 'text-[#C5A059]',
  },
  {
    icon: <Flame className="w-5 h-5" strokeWidth={1.5} />,
    label: 'Bons plans',
    title: 'Offres flash en direct',
    description: 'Annonces remontées en continu de notre réseau d\'agents WhatsApp.',
    cta: 'Découvrir',
    href: '/offre-flash',
    accent: 'Live',
    borderColor: 'border-orange-500/30 hover:border-orange-500',
    iconBg: 'bg-orange-500/10 border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  {
    icon: <Compass className="w-5 h-5" strokeWidth={1.5} />,
    label: 'Chercheur exigeant',
    title: 'Recherche avancée',
    description: 'Filtrez par budget, surface, équipements. Comparez sources vérifiées et offres flash.',
    cta: 'Affiner',
    href: '/recherche',
    accent: 'Outils',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  {
    icon: <Crown className="w-5 h-5" strokeWidth={1.5} />,
    label: 'Pro · Agence',
    title: 'Compte propriétaire',
    description: 'Inscription complète. Gérez vos annonces, contrats, quittances et visites.',
    cta: 'Créer un compte',
    href: '/login?next=/mes-biens/nouveau',
    accent: 'Premium',
    borderColor: 'border-amber-500/30 hover:border-[#D97706]',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  {
    icon: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
    label: 'Particulier · 1 minute',
    title: 'Publier via WhatsApp',
    description: 'Sans inscription. Collez votre annonce, validez en 1 clic via WhatsApp.',
    cta: 'Ouvrir le formulaire',
    href: TALLY_FORM_URL,
    external: true,
    accent: 'Express',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
]

export function JourneyShortcuts() {
  return (
    <section className="relative py-16 md:py-24 bg-[#0a0e1a] overflow-hidden">
      {/* Top divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-[#C5A059]/40 to-transparent" />

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#C5A059]" />
            <p className="text-[10px] font-medium tracking-[0.5em] uppercase text-[#C5A059]">
              Par où commencer
            </p>
            <div className="h-px w-8 bg-[#C5A059]" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight">
            Chaque besoin,<br />
            <span className="font-editorial text-[#C5A059]">son parcours.</span>
          </h2>
          <p className="font-sans text-sm md:text-base text-white/60 mt-6 leading-relaxed">
            Cinq voies adaptées à votre profil. Choisissez celle qui vous correspond.
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
                className={`group relative flex flex-col bg-white/[0.02] backdrop-blur-sm rounded-2xl p-5 md:p-6 border ${j.borderColor} transition-all duration-500 hover:bg-white/[0.04] hover:-translate-y-1 ${i === 4 ? 'lg:col-start-3 lg:col-end-4 md:col-span-2 lg:col-span-1' : ''}`}
              >
                {/* Header: number + accent */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 rounded-xl ${j.iconBg} border flex items-center justify-center ${j.iconColor}`}>
                    {j.icon}
                  </div>
                  <span className="font-mono text-[10px] text-white/30 mt-1">
                    0{i + 1}
                  </span>
                </div>

                {/* Label */}
                <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/40 mb-2">
                  {j.label}
                </p>

                {/* Title */}
                <h3 className="font-display text-2xl text-white leading-tight mb-3">
                  {j.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-xs text-white/60 leading-relaxed mb-6 flex-1">
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
