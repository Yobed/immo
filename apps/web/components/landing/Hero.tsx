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
    <section className="relative min-h-[92vh] bg-primary flex items-stretch overflow-hidden">

      {/* ── CÔTÉ GAUCHE : image ─────────────────────────────── */}
      <div className="hidden lg:block relative w-[52%] shrink-0 overflow-hidden">

        {/* Photo de fond */}
        <Image
          src="/hero-bg.jpg"
          alt="Belle résidence à Abidjan"
          fill
          className="object-cover object-center scale-105"
          priority
          sizes="52vw"
        />

        {/* Overlay dégradé : sombre en bas + bord droit pour transition */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-primary/30" />

        {/* Badge flottant — biens disponibles */}
        <div className="hero-float-1 absolute top-8 left-6 flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F97316]" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold text-primary leading-none">247 biens</p>
            <p className="font-sans text-[10px] text-gray-400 leading-none mt-0.5">disponibles</p>
          </div>
        </div>

        {/* Card flottante — satisfaction */}
        <div className="hero-float-2 absolute bottom-12 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-xl max-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F97316">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </div>
            <span className="font-mono text-xs font-bold text-primary">4.8/5</span>
          </div>
          <p className="font-sans text-[11px] text-gray-500 leading-snug">
            98% de clients satisfaits
          </p>
          <div className="mt-2 flex -space-x-2">
            {['KY','AK','PI','MB'].map((initials, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white font-mono text-[8px] font-bold"
                style={{ background: ['#0C2D5E','#F97316','#0D9F6E','#1A4D8F'][i] }}>
                {initials}
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-500 font-mono text-[8px] font-bold">+</div>
          </div>
        </div>

        {/* Label bas droit */}
        <div className="absolute bottom-6 right-4 text-right">
          <p className="font-sans text-xs text-white/50">Cocody, Abidjan</p>
        </div>
      </div>

      {/* ── CÔTÉ DROIT : contenu ─────────────────────────────── */}
      <div className="relative flex-1 flex items-center overflow-hidden">

        {/* Fond navy + effets déco */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#0d3a5c]" />
        <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />

        {/* Orbe décoratif */}
        <div className="hero-float-3 absolute top-[10%] right-[5%] w-64 h-64 rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />

        {/* Image mobile (visible seulement < lg) */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <Image
            src="/hero-bg.jpg"
            alt="Belle résidence"
            fill
            className="object-cover object-center opacity-10"
            priority
            sizes="100vw"
          />
        </div>

        <div className="relative z-10 w-full px-8 md:px-12 lg:px-14 py-20 text-white">
          <div className="max-w-xl">

            {/* Badge */}
            <span className="hero-badge inline-block mb-5 px-3 py-1.5 rounded-pill bg-[#F97316]/20 text-[#F97316] text-sm font-semibold border border-[#F97316]/30">
              Plateforme immobilière N°1 en Côte d&apos;Ivoire
            </span>

            {/* Titre */}
            <h1 className="hero-title font-display text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-5">
              Trouvez votre bien<br />
              <span style={{ color: '#F97316' }}>en Côte d&apos;Ivoire</span>
            </h1>

            <p className="hero-subtitle font-sans text-base text-white/75 mb-8 max-w-md leading-relaxed">
              Location, vente et résidences meublées à Abidjan et partout en CI.
              Réservation et paiement en ligne en quelques clics.
            </p>

            {/* Barre de recherche */}
            <div className="hero-search flex flex-col sm:flex-row gap-3 mb-8 max-w-lg">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Commune, quartier, type de bien..."
                className="flex-1 rounded-btn px-4 py-3 text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-[#F97316] text-sm shadow-lg"
              />
              <Button size="lg" variant="secondary" className="shrink-0 shadow-lg" onClick={handleSearch}>
                Rechercher
              </Button>
            </div>

            {/* Raccourcis */}
            <div className="hero-pills flex flex-wrap gap-2 mb-10">
              {[
                { label: 'Appartements', href: '/recherche?type_bien=appartement' },
                { label: 'Villas', href: '/recherche?type_bien=villa' },
                { label: 'Résidences meublées', href: '/recherche?type_bien=residence_meublee' },
                { label: 'Studios', href: '/recherche?type_bien=studio' },
                { label: 'Terrains', href: '/recherche?type_bien=terrain' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3 py-1.5 rounded-pill bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-200 text-sm font-sans text-white/90 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Stats rapides */}
            <div className="hero-pills flex flex-wrap gap-x-8 gap-y-3 pt-4 border-t border-white/10">
              {[
                { value: '2 450+', label: 'Biens disponibles' },
                { value: '12', label: 'Communes' },
                { value: '98%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="font-mono text-xl font-bold" style={{ color: '#F97316' }}>{s.value}</span>
                  <span className="font-sans text-xs text-white/50">{s.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

    </section>
  )
}
