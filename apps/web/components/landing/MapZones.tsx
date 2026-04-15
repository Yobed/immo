'use client'
import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import type { BienMarker } from '@/components/map/PropertiesMap'

const PropertiesMap = dynamic(
  () => import('@/components/map/PropertiesMap').then((m) => m.PropertiesMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-[20px] bg-white/10 animate-pulse flex items-center justify-center"
        style={{ height: 480 }}
      >
        <span className="text-white/40 text-sm font-sans">Chargement de la carte...</span>
      </div>
    ),
  }
)

const communesCoords: Record<string, { lat: number; lng: number }> = {
  Cocody: { lat: 5.345, lng: -3.985 },
  Plateau: { lat: 5.326, lng: -4.017 },
  Marcory: { lat: 5.304, lng: -3.974 },
  Yopougon: { lat: 5.334, lng: -4.053 },
  Adjamé: { lat: 5.356, lng: -4.02 },
  Abobo: { lat: 5.421, lng: -4.017 },
  Koumassi: { lat: 5.295, lng: -3.945 },
  'Port-Bouet': { lat: 5.253, lng: -3.944 },
  Bingerville: { lat: 5.353, lng: -3.886 },
  Attécoubé: { lat: 5.332, lng: -4.032 },
  Treichville: { lat: 5.303, lng: -4.008 },
  Songon: { lat: 5.312, lng: -4.225 },
}
const communes = Object.keys(communesCoords)

export function MapZones({ biens }: { biens: BienMarker[] }) {
  const [activeCommune, setActiveCommune] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const biensWithCoords = useMemo(() => biens.filter((b) => b.latitude && b.longitude), [biens])

  // Count per commune
  const communeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    biensWithCoords.forEach((b) => {
      counts[b.commune] = (counts[b.commune] ?? 0) + 1
    })
    return counts
  }, [biensWithCoords])

  // Filter by commune + search
  const filteredBiens = useMemo(() => {
    let list = activeCommune ? biensWithCoords.filter((b) => b.commune === activeCommune) : biensWithCoords
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (b) =>
          b.titre.toLowerCase().includes(q) ||
          b.commune.toLowerCase().includes(q) ||
          (b.quartier ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [biensWithCoords, activeCommune, searchQuery])

  const targetCenter = activeCommune ? communesCoords[activeCommune] : null

  return (
    <section className="py-16 md:py-24 bg-[#0C2D5E] relative overflow-hidden">
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <ScrollReveal className="text-center mb-10 md:mb-14">
          <p className="font-sans text-xs font-bold text-[var(--secondary)] uppercase tracking-[0.2em] mb-3">
            Couverture Nationale
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
            Découvrez nos exclusivités sur la carte
          </h2>
          <p className="font-sans text-white/60 text-base md:text-lg max-w-xl mx-auto">
            Filtrez par commune, cherchez par nom ou quartier, et visualisez chaque bien géolocalisé.
          </p>
        </ScrollReveal>

        {/* Search bar */}
        <ScrollReveal delay={0.1} className="max-w-lg mx-auto mb-8">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un bien, quartier, commune…"
              className="w-full pl-10 pr-10 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-sans focus:outline-none focus:border-[var(--secondary)] focus:bg-white/15 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {/* Result count feedback */}
          <p className="text-center text-white/40 text-xs font-sans mt-2">
            {filteredBiens.length} bien{filteredBiens.length !== 1 ? 's' : ''} affiché{filteredBiens.length !== 1 ? 's' : ''}
            {activeCommune ? ` à ${activeCommune}` : ''}
            {searchQuery ? ` pour « ${searchQuery} »` : ''}
          </p>
        </ScrollReveal>

        {/* Map */}
        {biensWithCoords.length > 0 && (
          <ScrollReveal delay={0.2} className="max-w-6xl mx-auto mb-8 md:mb-12">
            <div className="rounded-[20px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10 p-1 bg-white/5 backdrop-blur-xl">
              <div className="rounded-[16px] overflow-hidden">
                <PropertiesMap
                  biens={filteredBiens}
                  hauteur={500}
                  mapTheme="mapbox://styles/mapbox/streets-v12"
                  targetCenter={targetCenter}
                />
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Commune filter buttons */}
        <ScrollReveal delay={0.3}>
          <p className="text-center text-white/50 text-xs font-sans uppercase tracking-widest mb-4">
            Filtrer par commune
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {/* All button */}
            <button
              onClick={() => setActiveCommune(null)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 focus:outline-none ${
                activeCommune === null
                  ? 'bg-white text-[#0C2D5E] border-white shadow-md scale-105'
                  : 'bg-white/5 border-white/15 text-white hover:bg-white/15'
              }`}
            >
              Tout
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeCommune === null ? 'bg-[#0C2D5E]/20 text-[#0C2D5E]' : 'bg-white/20 text-white'
                }`}
              >
                {biensWithCoords.length}
              </span>
            </button>

            {communes.map((commune) => {
              const count = communeCounts[commune] ?? 0
              const isActive = activeCommune === commune
              return (
                <button
                  key={commune}
                  onClick={() => setActiveCommune(isActive ? null : commune)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all duration-200 focus:outline-none ${
                    isActive
                      ? 'bg-[var(--secondary)] border-[var(--secondary)] text-white shadow-lg scale-105'
                      : count === 0
                      ? 'bg-white/3 border-white/8 text-white/30 cursor-default'
                      : 'bg-white/5 border-white/15 text-white hover:bg-white/15 hover:border-white/30'
                  }`}
                  disabled={count === 0}
                  title={count === 0 ? 'Aucun bien géolocalisé' : `${count} bien${count > 1 ? 's' : ''} à ${commune}`}
                >
                  {commune}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/15 text-white/80'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.4} className="text-center mt-8 text-white/30 text-xs tracking-wider uppercase font-sans">
          + Bouaké, Yamoussoukro, San-Pédro et d&apos;autres villes à venir
        </ScrollReveal>
      </div>
    </section>
  )
}
