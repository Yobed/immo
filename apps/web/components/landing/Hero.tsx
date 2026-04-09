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
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-[#0d3a5c]" />

      <div className="relative z-10 container mx-auto px-4 py-20 text-white">
        <div className="max-w-3xl">
          {/* Badge */}
          <span className="inline-block mb-4 px-3 py-1 rounded-pill bg-secondary/20 text-secondary text-sm font-medium border border-secondary/30">
            Plateforme immobilière N°1 en Côte d&apos;Ivoire
          </span>

          {/* Titre principal */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Trouvez votre bien<br />
            <span className="text-secondary">en Côte d&apos;Ivoire</span>
          </h1>

          <p className="font-sans text-lg text-white/80 mb-8 max-w-xl">
            Location, vente et résidences meublées à Abidjan et partout en CI.
            Demande de visite et réservation en ligne.
          </p>

          {/* Barre de recherche */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-2xl">
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
          <div className="flex flex-wrap gap-2 mb-8">
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
                className="px-3 py-1.5 rounded-pill bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-sm font-sans text-white/90"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
