'use client'
import { useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, useInView } from 'framer-motion'
import { useTheme } from 'next-themes'
import { containerVariants, itemVariants } from './Features'
import type { BienMarker } from '@/components/map/PropertiesMap'

const PropertiesMap = dynamic(
  () => import('@/components/map/PropertiesMap').then((m) => m.PropertiesMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-[20px] bg-[var(--surface-card)] animate-pulse flex items-center justify-center border border-[var(--border)]"
        style={{ height: 480 }}
      >
        <span className="text-[var(--text-muted)] text-sm font-sans">Chargement de la carte...</span>
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

function getBienPrice(b: BienMarker): number | null {
  return b.prix_nuit_fcfa ?? b.prix_mois_fcfa ?? b.prix_vente_fcfa ?? null
}

export function MapZones({ biens }: { biens: BienMarker[] }) {
  const [activeCommune, setActiveCommune] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<string | null>(null)
  const [searchQueryMinPrice, setSearchQueryMinPrice] = useState<number | ''>('')
  const [searchQueryMaxPrice, setSearchQueryMaxPrice] = useState<number | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const { theme } = useTheme()
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


  // Apply all filters: commune + search + type + price
  const filteredBiens = useMemo(() => {
    let list = activeCommune ? biensWithCoords.filter((b) => b.commune === activeCommune) : biensWithCoords

    if (activeType) {
      list = list.filter((b) => b.type_bien === activeType)
    }

    // Min/Max Price filtering logic
    const minVal = searchQueryMinPrice ? Number(searchQueryMinPrice) : null
    const maxVal = searchQueryMaxPrice ? Number(searchQueryMaxPrice) : null

    if (minVal !== null || maxVal !== null) {
      list = list.filter((b) => {
        const p = getBienPrice(b)
        if (p === null) return false
        if (minVal !== null && p < minVal) return false
        if (maxVal !== null && p > maxVal) return false
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
  }, [biensWithCoords, activeCommune, activeType, searchQueryMinPrice, searchQueryMaxPrice, searchQuery])

  const targetCenter = activeCommune ? communesCoords[activeCommune] : null
  const mapStyle = theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11'

  return (
    <section ref={containerRef} className="py-[var(--section-py)] bg-[var(--background)] relative overflow-hidden -mt-10 rounded-t-[3rem] z-40 border-t border-[var(--border)]">
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="container relative z-10 mx-auto px-6 max-w-7xl"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-12 md:mb-16 text-center lg:text-left">
          <span className="text-[var(--text-muted)] font-sans tracking-[0.4em] uppercase text-[10px] mb-6 block">
            Exploration Géographique
          </span>
          <h2 className="font-display text-5xl md:text-7xl font-light text-[var(--text)] leading-[1.1] tracking-tighter mb-8">
            Trouvez l&apos;Exception <br className="hidden lg:block"/>
            <span className="italic font-serif opacity-70">au Cœur d&apos;Abidjan.</span>
          </h2>
          <p className="font-sans text-base md:text-lg text-[var(--text-muted)] max-w-xl leading-relaxed mx-auto lg:mx-0">
            Filtrez avec précision et visualisez chaque opportunité géolocalisée sur notre interface cartographique haute définition.
          </p>
        </motion.div>

        {/* Unified Filter Dashboard */}
        <motion.div variants={itemVariants} className="mb-10 p-8 rounded-[2.5rem] bg-[var(--surface-card)] border border-[var(--border)] shadow-2xl backdrop-blur-3xl relative z-50">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
            
            {/* 1. Recherche Textuelle */}
            <div className="lg:col-span-2 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-1">Recherche</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] opacity-60 group-focus-within:text-[var(--accent-luxury)] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quartier, résidence, mot-clé..."
                  className="w-full pl-14 pr-12 py-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-subtle)] text-sm font-sans focus:outline-none focus:border-[var(--accent-luxury)] transition-all"
                />
              </div>
            </div>

            {/* 2. Budget Min/Max */}
            <div className="lg:col-span-2 space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60 ml-1">Budget (FCFA)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={searchQueryMinPrice}
                    onChange={(e) => setSearchQueryMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Min"
                    className="w-full px-5 py-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-subtle)] text-sm font-sans focus:outline-none focus:border-[var(--accent-luxury)] transition-all"
                  />
                </div>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={searchQueryMaxPrice}
                    onChange={(e) => setSearchQueryMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Max"
                    className="w-full px-5 py-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-subtle)] text-sm font-sans focus:outline-none focus:border-[var(--accent-luxury)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3. Boutons de Filtres Groupés (Types + Communes) */}
            <div className="lg:col-span-4 flex flex-col gap-4 pt-4 border-t border-[var(--border)]">
               <div className="flex flex-wrap gap-2 pr-4">
                {TYPE_CATEGORIES.map((cat) => {
                  const isActive = activeType === cat.value
                  return (
                    <button
                      key={String(cat.value)}
                      onClick={() => setActiveType(isActive && cat.value !== null ? null : cat.value)}
                      className={`px-4 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all ${
                        isActive
                          ? 'bg-[var(--accent-luxury)] border-[var(--accent-luxury)] text-[var(--midnight)] shadow-lg'
                          : 'bg-[var(--background)]/30 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  )
                })}
              </div>

               <div className="flex flex-wrap gap-2 border-t border-[var(--border)]/30 pt-4">
                 <button
                   onClick={() => setActiveCommune(null)}
                   className={`px-4 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all ${
                     activeCommune === null
                       ? 'bg-[var(--text)] border-[var(--text)] text-[var(--background)]'
                       : 'bg-[var(--background)]/30 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                   }`}
                 >
                   Tout Abidjan
                 </button>
                 {communes.map((commune) => {
                   const isActive = activeCommune === commune
                   const count = communeCounts[commune] ?? 0
                   return (
                     <button
                       key={commune}
                       onClick={() => setActiveCommune(isActive ? null : commune)}
                       disabled={count === 0}
                       className={`px-4 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all ${
                         isActive
                           ? 'bg-[var(--accent-luxury)] border-[var(--accent-luxury)] text-[var(--midnight)]'
                           : count === 0
                           ? 'opacity-20 cursor-not-allowed border-[var(--border)]'
                           : 'bg-[var(--background)]/30 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                       }`}
                     >
                       {commune} <span className="opacity-40 ml-1">{count}</span>
                     </button>
                   )
                 })}
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]/50">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--surface-card)] bg-[var(--midnight-muted)] flex items-center justify-center overflow-hidden">
                    <span className="text-[8px] font-bold text-[var(--accent-luxury)]">💎</span>
                  </div>
                ))}
              </div>
              <p className="text-[var(--text-muted)] opacity-60 text-[10px] uppercase tracking-widest font-sans">
                {filteredBiens.length} Propriété{filteredBiens.length !== 1 ? 's' : ''} disponible{filteredBiens.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {(activeCommune || activeType || searchQueryMinPrice || searchQueryMaxPrice || searchQuery) && (
              <button 
                onClick={() => {
                  setActiveCommune(null)
                  setActiveType(null)
                  setSearchQueryMinPrice('')
                  setSearchQueryMaxPrice('')
                  setSearchQuery('')
                }}
                className="text-[var(--accent-luxury)] hover:underline text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
              >
                Tout Réinitialiser
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </motion.div>


        {/* Map - Deep Contrast */}
        {biensWithCoords.length > 0 && (
          <motion.div variants={itemVariants} className="mb-14">
            <div className="rounded-3xl overflow-hidden ring-1 ring-[var(--border)] p-1 bg-[var(--surface-card)] backdrop-blur-3xl transition-all duration-1000 ease-[0.16, 1, 0.3, 1] hover:ring-[var(--accent-luxury)]">
              <div className="rounded-[calc(1.5rem-4px)] overflow-hidden bg-[var(--background)]">
                <PropertiesMap
                  biens={filteredBiens}
                  hauteur={600}
                  mapTheme={mapStyle}
                  targetCenter={targetCenter}
                />
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="text-center mt-12 text-[var(--text-muted)] opacity-50 text-[9px] tracking-[0.3em] uppercase font-sans">
          Extension en cours : San-Pédro · Bouaké · Yamoussoukro
        </motion.div>
      </motion.div>
    </section>
  )
}
