'use client'
import { useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, useInView } from 'framer-motion'
import { containerVariants, itemVariants } from './Features'
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

const TYPE_CATEGORIES = [
  { value: null,                label: 'Tous les types' },
  { value: 'appartement',      label: 'Appartement'    },
  { value: 'villa',            label: 'Villa'           },
  { value: 'maison',           label: 'Maison'          },
  { value: 'studio',           label: 'Studio'          },
  { value: 'residence_meublee',label: 'Meublé'          },
  { value: 'bureau',           label: 'Bureau'          },
  { value: 'terrain',          label: 'Terrain'         },
]

// Price ranges in FCFA (covers both rent/month and sale)
const PRICE_RANGES = [
  { label: 'Tous les prix', min: null, max: null },
  { label: '< 300k/mois',   min: null, max: 300_000 },
  { label: '300k – 700k',   min: 300_000, max: 700_000 },
  { label: '700k – 1,5M',   min: 700_000, max: 1_500_000 },
  { label: '1,5M – 3M',     min: 1_500_000, max: 3_000_000 },
  { label: '> 3M',          min: 3_000_000, max: null },
]

function getBienPrice(b: BienMarker): number | null {
  return b.prix_nuit_fcfa ?? b.prix_mois_fcfa ?? b.prix_vente_fcfa ?? null
}

export function MapZones({ biens }: { biens: BienMarker[] }) {
  const [activeCommune, setActiveCommune] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<string | null>(null)
  const [activePriceIdx, setActivePriceIdx] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-100px" })

  const biensWithCoords = useMemo(() => biens.filter((b) => b.latitude && b.longitude), [biens])

  // Count per commune
  const communeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    biensWithCoords.forEach((b) => {
      counts[b.commune] = (counts[b.commune] ?? 0) + 1
    })
    return counts
  }, [biensWithCoords])

  // Active price range
  const priceRange = PRICE_RANGES[activePriceIdx]

  // Apply all filters: commune + search + type + price
  const filteredBiens = useMemo(() => {
    let list = activeCommune ? biensWithCoords.filter((b) => b.commune === activeCommune) : biensWithCoords

    if (activeType) {
      list = list.filter((b) => b.type_bien === activeType)
    }

    if (priceRange.min !== null || priceRange.max !== null) {
      list = list.filter((b) => {
        const p = getBienPrice(b)
        if (p === null) return false
        if (priceRange.min !== null && p < priceRange.min) return false
        if (priceRange.max !== null && p > priceRange.max) return false
        return true
      })
    }

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
  }, [biensWithCoords, activeCommune, activeType, priceRange, searchQuery])

  const targetCenter = activeCommune ? communesCoords[activeCommune] : null

  return (
    <section ref={containerRef} className="py-20 md:py-24 bg-[#0C2D5E] relative overflow-hidden -mt-10 rounded-t-[3rem] z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="container relative z-10 mx-auto px-4"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-10 md:mb-14">
          <p className="font-sans text-xs font-bold text-[var(--secondary)] uppercase tracking-[0.2em] mb-3">
            Couverture Nationale
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
            Découvrez nos exclusivités sur la carte
          </h2>
          <p className="font-sans text-white/60 text-base md:text-lg max-w-xl mx-auto">
            Filtrez par commune, type de bien ou fourchette de prix, et visualisez chaque bien géolocalisé.
          </p>
        </motion.div>

        {/* ── Filter bar — OUTSIDE the map ─────────────────────────────────── */}
        <motion.div variants={itemVariants} className="max-w-6xl mx-auto mb-6 space-y-4">

          {/* Row 1 : Search + Price */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un bien, quartier, commune…"
                className="w-full pl-10 pr-10 py-3 rounded-[2rem] bg-white/5 border border-white/10 text-white placeholder-white/50 text-sm font-sans focus:outline-none focus:border-[var(--secondary)] focus:bg-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
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

            {/* Price range select */}
            <div className="relative shrink-0">
              <select
                value={activePriceIdx}
                onChange={(e) => setActivePriceIdx(Number(e.target.value))}
                className="appearance-none h-full pl-5 pr-10 py-3 rounded-[2rem] bg-white/5 border border-white/10 text-white text-sm font-sans focus:outline-none focus:border-[var(--secondary)] focus:bg-white/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm cursor-pointer min-w-[180px]"
              >
                {PRICE_RANGES.map((r, i) => (
                  <option key={i} value={i} className="bg-[#0C2D5E] text-white">
                    {r.label}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Row 2 : Type filter chips */}
          <div className="flex flex-wrap gap-2">
            {TYPE_CATEGORIES.map((cat) => {
              const count = cat.value
                ? biensWithCoords.filter((b) => b.type_bien === cat.value).length
                : biensWithCoords.length
              const isActive = activeType === cat.value
              return (
                <button
                  key={String(cat.value)}
                  onClick={() => setActiveType(isActive && cat.value !== null ? null : cat.value)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus:outline-none ${
                    isActive
                      ? 'bg-[var(--secondary)] border-[var(--secondary)] text-white shadow-xl hover:-translate-y-0.5'
                      : count === 0
                      ? 'bg-white/3 border-white/5 text-white/30 cursor-default'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5'
                  }`}
                  disabled={count === 0}
                >
                  {cat.label}
                  {count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/15 text-white/70'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Result count */}
          <p className="text-white/40 text-xs font-sans">
            {filteredBiens.length} bien{filteredBiens.length !== 1 ? 's' : ''} affiché{filteredBiens.length !== 1 ? 's' : ''}
            {activeCommune ? ` · ${activeCommune}` : ''}
            {activeType ? ` · ${TYPE_CATEGORIES.find(c => c.value === activeType)?.label}` : ''}
            {activePriceIdx > 0 ? ` · ${PRICE_RANGES[activePriceIdx].label}` : ''}
            {searchQuery ? ` · « ${searchQuery} »` : ''}
          </p>
        </motion.div>

        {/* Map */}
        {biensWithCoords.length > 0 && (
          <motion.div variants={itemVariants} className="max-w-6xl mx-auto mb-10 md:mb-16">
            <div className="rounded-[2.5rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10 p-2 bg-white/5 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.8)] hover:-translate-y-2">
              <div className="rounded-[calc(2.5rem-0.5rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <PropertiesMap
                  biens={filteredBiens}
                  hauteur={500}
                  mapTheme="mapbox://styles/mapbox/streets-v12"
                  targetCenter={targetCenter}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Commune filter buttons */}
        <motion.div variants={itemVariants}>
          <p className="text-center text-white/50 text-xs font-sans uppercase tracking-widest mb-4">
            Filtrer par commune
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            <button
              onClick={() => setActiveCommune(null)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus:outline-none ${
                activeCommune === null
                  ? 'bg-white text-[#0C2D5E] border-white shadow-xl hover:-translate-y-0.5'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:-translate-y-0.5'
              }`}
            >
              Tout
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeCommune === null ? 'bg-[#0C2D5E]/20 text-[#0C2D5E]' : 'bg-white/20 text-white'
              }`}>
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
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus:outline-none ${
                    isActive
                      ? 'bg-[var(--secondary)] border-[var(--secondary)] text-white shadow-xl hover:-translate-y-0.5'
                      : count === 0
                      ? 'bg-white/3 border-white/5 text-white/30 cursor-default'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5'
                  }`}
                  disabled={count === 0}
                  title={count === 0 ? 'Aucun bien géolocalisé' : `${count} bien${count > 1 ? 's' : ''} à ${commune}`}
                >
                  {commune}
                  {count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/15 text-white/80'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mt-8 text-white/30 text-xs tracking-wider uppercase font-sans">
          + Bouaké, Yamoussoukro, San-Pédro et d&apos;autres villes à venir
        </motion.div>
      </motion.div>
    </section>
  )
}
