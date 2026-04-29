import Link from 'next/link'
import Image from 'next/image'
import { Search, ArrowRight } from 'lucide-react'

interface HeroEditorialProps {
  bgImage?: string
}

const DEFAULT_BG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop'

export function HeroEditorial({ bgImage = DEFAULT_BG }: HeroEditorialProps) {
  return (
    <section className="relative w-full h-[100svh] min-h-[640px] max-h-[920px] bg-[#0a0e1a] overflow-hidden">
      {/* Single image — no rotation, calm */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt="Résidence de prestige Côte d'Ivoire"
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105"
        />
      </div>

      {/* Refined dark gradient — preserves image visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-transparent to-transparent" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
      }} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top brand line */}
        <div className="px-6 md:px-12 pt-8 md:pt-10">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="h-px w-12 bg-[#C5A059]" />
            <p className="text-[10px] md:text-[11px] font-medium tracking-[0.5em] uppercase text-[#C5A059]">
              Immo CI · Sapphire Edition
            </p>
          </div>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-12">
          <div className="max-w-7xl mx-auto w-full">
            <div className="max-w-4xl">
              <h1 className="font-display text-[42px] sm:text-6xl md:text-7xl lg:text-[88px] xl:text-[104px] leading-[1.02] text-white tracking-tight mb-6 md:mb-8">
                <span className="block">L&apos;immobilier</span>
                <span className="block font-editorial text-[#C5A059]">d&apos;exception</span>
                <span className="block">en Côte d&apos;Ivoire</span>
              </h1>
              <p className="font-sans text-base md:text-lg text-white/80 max-w-xl leading-relaxed mb-10">
                Résidences vérifiées, conciergerie premium et veille de marché en direct. Toutes les voies vers votre prochain bien réunies en un seul lieu.
              </p>

              {/* Inline search — minimaliste */}
              <form action="/recherche" method="get" className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Cocody, villa avec piscine, 4 chambres..."
                    className="w-full pl-11 pr-4 py-4 bg-white/95 backdrop-blur text-slate-900 rounded-full text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059] shadow-2xl"
                  />
                </div>
                <button
                  type="submit"
                  className="px-7 py-4 bg-[#C5A059] hover:bg-[#b08e4d] text-white rounded-full font-semibold text-sm transition-colors shadow-2xl flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Rechercher
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom — chiffres clés */}
        <div className="px-6 md:px-12 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-6 md:gap-12 pt-6 border-t border-white/10">
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  450<span className="text-[#C5A059]">+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-2">
                  Transactions sécurisées
                </p>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  7<span className="text-[#C5A059]">k+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-2">
                  Annonces en direct
                </p>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  18<span className="text-[#C5A059]">+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-2">
                  Communes couvertes
                </p>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] text-white/40 font-medium">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative rounded-full w-2 h-2 bg-emerald-400" />
                </span>
                Mis à jour en temps réel
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
