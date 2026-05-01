import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

interface CommuneCard {
  name: string
  tagline: string
  count: number | null
  image: string
  href: string
  size: 'large' | 'medium' | 'small'
}

const COMMUNES: CommuneCard[] = [
  {
    name: 'Cocody',
    tagline: 'L\'élégance résidentielle',
    count: null,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
    href: '/biens?commune=Cocody',
    size: 'large',
  },
  {
    name: 'Marcory',
    tagline: 'Zone 4 · La modernité',
    count: null,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
    href: '/biens?commune=Marcory',
    size: 'medium',
  },
  {
    name: 'Plateau',
    tagline: 'Le coeur des affaires',
    count: null,
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=1200&auto=format&fit=crop',
    href: '/biens?commune=Plateau',
    size: 'medium',
  },
  {
    name: 'Riviera',
    tagline: 'Quartier prisé de Cocody',
    count: null,
    image: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?q=80&w=1200&auto=format&fit=crop',
    href: '/biens?quartier=Riviera',
    size: 'small',
  },
  {
    name: 'Bingerville',
    tagline: 'L\'authentique à 20 min',
    count: null,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop',
    href: '/biens?commune=Bingerville',
    size: 'small',
  },
  {
    name: 'Assinie',
    tagline: 'Évasion balnéaire',
    count: null,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop',
    href: '/biens?commune=Assinie',
    size: 'small',
  },
]

export function PrestigeCommunes() {
  return (
    <section className="relative py-16 md:py-24 bg-[#020617] overflow-hidden">
      {/* Subtle gold glow background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-amber-500 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        {/* Section header */}
        <div className="flex items-end justify-between gap-6 mb-10 md:mb-14 flex-wrap">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--accent-luxury)] mb-4">
              Destinations de prestige
            </p>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight">
              Les adresses qui<br />
              <span className="italic font-light text-[var(--accent-luxury)]">font la différence</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base mt-5 max-w-xl leading-relaxed">
              Six destinations choisies pour leur cadre de vie, leur potentiel d&apos;investissement et la qualité de leur immobilier.
            </p>
          </div>
          <Link
            href="/biens"
            className="hidden md:inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] uppercase text-[var(--accent-luxury)] border-b border-[var(--accent-luxury)]/40 pb-1 hover:border-[var(--accent-luxury)] transition-colors"
          >
            Toutes les communes <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[180px]">
          {COMMUNES.map((c, i) => {
            const colSpan =
              c.size === 'large' ? 'col-span-2 md:col-span-7 row-span-2' :
              c.size === 'medium' ? 'col-span-2 md:col-span-5 row-span-2' :
              'col-span-1 md:col-span-4 row-span-1'

            return (
              <Link
                key={c.name}
                href={c.href}
                className={`group relative ${colSpan} rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 hover:border-[var(--accent-luxury)]/50 transition-all duration-500`}
              >
                {/* Image with subtle zoom */}
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 30vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  priority={i < 2}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* Hover gold glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-luxury)]/0 to-[var(--accent-luxury)]/0 group-hover:from-[var(--accent-luxury)]/15 group-hover:to-transparent transition-all duration-500" />

                {/* Text */}
                <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent-luxury)] mb-1 md:mb-2 opacity-90">
                    {c.tagline}
                  </p>
                  <div className="flex items-end justify-between gap-2">
                    <h3 className={`font-display font-bold text-white tracking-tight leading-none ${
                      c.size === 'large' ? 'text-3xl md:text-5xl' :
                      c.size === 'medium' ? 'text-2xl md:text-4xl' :
                      'text-xl md:text-2xl'
                    }`}>
                      {c.name}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-white/60 group-hover:text-[var(--accent-luxury)] group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="md:hidden mt-6 text-center">
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] uppercase text-[var(--accent-luxury)] border-b border-[var(--accent-luxury)]/40 pb-1"
          >
            Toutes les communes <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
