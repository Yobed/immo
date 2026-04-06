'use client'
import { useState } from 'react'
import { Button } from '@/components/ui'

export function Hero() {
  const [search, setSearch] = useState('')

  return (
    <section className="relative min-h-[90vh] bg-primary flex items-center overflow-hidden">
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-[#0d3a5c]" />

      <div className="relative z-10 container mx-auto px-4 py-20 text-white">
        <div className="max-w-3xl">
          {/* Badge */}
          <span className="inline-block mb-4 px-3 py-1 rounded-pill bg-secondary/20 text-secondary text-sm font-medium border border-secondary/30">
            Plateforme N°1 en Côte d&apos;Ivoire
          </span>

          {/* Titre principal */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Trouvez votre bien<br />
            <span className="text-secondary">en Côte d&apos;Ivoire</span>
          </h1>

          <p className="font-sans text-lg text-white/80 mb-8 max-w-xl">
            Location et vente à Abidjan et partout en CI. Paiement Wave, Orange Money, MTN. Contrats OHADA en ligne.
          </p>

          {/* Barre de recherche */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un bien, une commune, un quartier..."
              className="flex-1 rounded-btn px-4 py-3 text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
            />
            <Button size="lg" variant="secondary" className="shrink-0">
              Rechercher
            </Button>
          </div>

          {/* CTA App Store / Play Store */}
          <div className="flex flex-wrap gap-3">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-btn bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
            >
              <span className="text-xl" aria-hidden="true">&#63743;</span>
              <div>
                <p className="text-xs text-white/60">Télécharger sur</p>
                <p className="text-sm font-semibold">App Store</p>
              </div>
            </a>
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-btn bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
            >
              <span className="text-xl" aria-hidden="true">&#9654;</span>
              <div>
                <p className="text-xs text-white/60">Disponible sur</p>
                <p className="text-sm font-semibold">Google Play</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
