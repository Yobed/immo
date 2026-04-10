'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui'

export function Hero() {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const q = search.trim()
    router.push(q ? `/recherche?q=${encodeURIComponent(q)}` : '/biens')
  }

  return (
    <section className="relative bg-primary overflow-hidden" style={{ minHeight: '92svh' }}>

      {/* ── IMAGE GAUCHE — desktop uniquement ── */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[52%] overflow-hidden">
        <Image
          src="/hero-bg.jpg"
          alt="Belle résidence"
          fill
          className="object-cover object-center"
          priority
          sizes="52vw"
        />
        {/* Overlay transition vers le côté droit */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-primary/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-primary/20" />

        {/* Card flottante — haut */}
        <div className="hero-float-1 absolute top-8 left-6 flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F97316]" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold text-primary leading-none">247 biens</p>
            <p className="font-sans text-[10px] text-gray-400 leading-none mt-0.5">disponibles</p>
          </div>
        </div>

        {/* Card flottante — bas */}
        <div className="hero-float-2 absolute bottom-12 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-xl" style={{ maxWidth: '200px' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#F97316">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <span className="font-mono text-xs font-bold text-primary">4.8/5</span>
          </div>
          <p className="font-sans text-[11px] text-gray-500 leading-snug">98% de clients satisfaits</p>
          <div className="mt-2 flex -space-x-1.5">
            {['KY','AK','PI','MB'].map((ini, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white font-mono text-[8px] font-bold shrink-0"
                style={{ background: ['#0C2D5E','#F97316','#0D9F6E','#1A4D8F'][i] }}>
                {ini}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOND MOBILE : image subtile ── */}
      <div className="lg:hidden absolute inset-0 pointer-events-none">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-[0.08]"
          priority
          sizes="100vw"
        />
      </div>

      {/* Déco fond */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#0d3a5c] lg:from-transparent lg:via-transparent lg:to-transparent" />
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />

      {/* ── CONTENU ── */}
      <div className="relative z-10 flex items-center justify-end min-h-[92svh] lg:min-h-0 lg:h-full">
        <div className="w-full lg:w-[52%] px-5 sm:px-8 lg:px-12 py-16 sm:py-20 text-white">
          <div className="max-w-lg mx-auto lg:mx-0">

            {/* Badge */}
            <span className="hero-badge inline-block mb-4 px-3 py-1.5 rounded-full bg-[#F97316]/20 text-[#F97316] text-xs sm:text-sm font-semibold border border-[#F97316]/30">
              Plateforme immobilière N°1 en Côte d&apos;Ivoire
            </span>

            {/* Titre */}
            <h1 className="hero-title font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Trouvez votre bien<br />
              <span style={{ color: '#F97316' }}>en Côte d&apos;Ivoire</span>
            </h1>

            <p className="hero-subtitle font-sans text-sm sm:text-base text-white/75 mb-6 leading-relaxed">
              Location, vente et résidences meublées à Abidjan.
              Réservation et paiement en ligne en quelques clics.
            </p>

            {/* Barre de recherche */}
            <div className="hero-search flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Commune, quartier..."
                className="flex-1 rounded-xl px-4 py-3 text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm shadow-lg"
              />
              <Button size="lg" variant="secondary" className="shrink-0 shadow-lg text-sm" onClick={handleSearch}>
                Rechercher
              </Button>
            </div>

            {/* Raccourcis */}
            <div className="hero-pills flex flex-wrap gap-2 mb-8">
              {[
                { label: 'Appartements', href: '/recherche?type_bien=appartement' },
                { label: 'Villas', href: '/recherche?type_bien=villa' },
                { label: 'Résidences meublées', href: '/recherche?type_bien=residence_meublee' },
                { label: 'Studios', href: '/recherche?type_bien=studio' },
              ].map((item) => (
                <a key={item.label} href={item.href}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 text-xs sm:text-sm font-sans text-white/90 hover:text-white">
                  {item.label}
                </a>
              ))}
            </div>

            {/* Stats */}
            <div className="hero-pills flex gap-6 sm:gap-8 pt-4 border-t border-white/10">
              {[
                { value: '2 450+', label: 'Biens' },
                { value: '12', label: 'Communes' },
                { value: '98%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="font-mono text-lg sm:text-xl font-bold" style={{ color: '#F97316' }}>{s.value}</span>
                  <span className="font-sans text-[10px] sm:text-xs text-white/50">{s.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

    </section>
  )
}
