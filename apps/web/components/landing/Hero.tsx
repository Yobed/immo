'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

export function Hero() {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const q = search.trim()
    router.push(q ? `/recherche?q=${encodeURIComponent(q)}` : '/biens')
  }

  return (
    <section className="relative min-h-[90vh] bg-primary flex items-center overflow-hidden">
      {/* Gradient de fond */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-[#0d3a5c]" />

      {/* Orbes flottants décoratifs */}
      <div className="hero-float-1 absolute top-[12%] right-[8%] w-72 h-72 rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }} />
      <div className="hero-float-2 absolute bottom-[15%] right-[20%] w-48 h-48 rounded-full opacity-[0.05] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
      <div className="hero-float-3 absolute top-[40%] right-[3%] w-32 h-32 rounded-full opacity-[0.08] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #1A4D8F 0%, transparent 70%)' }} />

      {/* Grille de points subtile */}
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />

      {/* Lignes diagonales décoratives */}
      <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden pointer-events-none opacity-[0.04]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 60px)'
        }} />
      </div>

      {/* Badge pulsant en haut à droite */}
      <div className="hero-float-1 absolute top-10 right-10 hidden lg:flex items-center gap-2 bg-white/8 border border-white/15 rounded-2xl px-4 py-3 pointer-events-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <span className="font-sans text-xs text-white/70">247 biens disponibles</span>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 text-white">
        <div className="max-w-3xl">
          {/* Badge */}
          <span className="hero-badge inline-block mb-4 px-3 py-1 rounded-pill bg-secondary/20 text-secondary text-sm font-medium border border-secondary/30">
            Plateforme immobilière N°1 en Côte d&apos;Ivoire
          </span>

          {/* Titre principal */}
          <h1 className="hero-title font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Trouvez votre bien<br />
            <span className="text-secondary">en Côte d&apos;Ivoire</span>
          </h1>

          <p className="hero-subtitle font-sans text-lg text-white/80 mb-8 max-w-xl">
            Location, vente et résidences meublées à Abidjan et partout en CI.
            Demande de visite et réservation en ligne.
          </p>

          {/* Barre de recherche */}
          <div className="hero-search flex flex-col sm:flex-row gap-3 mb-10 max-w-2xl">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Commune, quartier, type de bien..."
              className="flex-1 rounded-btn px-4 py-3 text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
            />
            <Button size="lg" variant="secondary" className="shrink-0" onClick={handleSearch}>
              Rechercher
            </Button>
          </div>

          {/* Raccourcis rapides */}
          <div className="hero-pills flex flex-wrap gap-2 mb-8">
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
          <div className="hero-pills flex flex-wrap gap-6 mt-4">
            {[
              { value: '2 450+', label: 'Biens' },
              { value: '12', label: 'Communes' },
              { value: '98%', label: 'Satisfaction' },
            ].map((s) => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold text-secondary">{s.value}</span>
                <span className="font-sans text-xs text-white/50">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
