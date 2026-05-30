'use client'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STATUTS_PUBLICS } from '@/lib/catalogue/statuts'
import { MapPin, Navigation, Loader2, Car, ExternalLink, ChevronRight, ArrowUpRight, ShieldCheck } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useT } from '@/lib/i18n/client'
import { formatFCFACompact } from '@/lib/format'

// Charger la carte dynamiquement pour éviter les erreurs d'hydratation
const PropertiesMap = dynamic(
  () => import('@/components/map/PropertiesMap').then((m) => m.PropertiesMap),
  { ssr: false }
)

type BienProche = {
  id: string
  titre: string
  commune: string
  quartier: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_nuit_fcfa: number | null
  prix_vente_fcfa: number | null
  surface_m2: number | null
  nb_pieces: number | null
  latitude: number | null
  longitude: number | null
  est_disponible: boolean
  is_verifie: boolean
  score_ia: number
  dist_meters: number
}

const NEAR_CATEGORIES = [
  { key: 'villa',             label: 'Villas de Luxe' },
  { key: 'appartement',       label: 'Appartements' },
  { key: 'residence_meublee', label: 'Résidences meublées' },
  { key: 'studio',            label: 'Studios' },
  { key: 'maison',            label: 'Maisons' },
  { key: 'bureau',            label: 'Bureaux' },
  { key: 'terrain',           label: 'Terrains' },
]

function NearCard({
  b, coverUrl, isSelected, onSelect, onHover, getTravelTime,
}: {
  b: BienProche
  coverUrl?: string
  isSelected: boolean
  onSelect: () => void
  onHover: (id: string | null) => void
  getTravelTime: (d: number) => string
}) {
  return (
    <div
      className={`w-[192px] md:w-[240px] shrink-0 rounded-2xl md:rounded-[1.5rem] overflow-hidden border cursor-pointer transition-all duration-300 flex flex-col ${
        isSelected
          ? 'border-[var(--accent-luxury)] ring-2 ring-accent-luxury/50'
          : 'border-[var(--border)] hover:border-accent-luxury/40'
      }`}
      onClick={onSelect}
      onMouseEnter={() => onHover(b.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-[var(--surface-card)]">
        {coverUrl ? (
          <Image src={coverUrl} alt={b.titre} fill className="object-cover transition-transform duration-500 hover:scale-105" sizes="(max-width: 768px) 192px, 240px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <MapPin className="w-6 h-6 text-[var(--accent-luxury)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {b.is_verifie && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-wide shadow-md" title="Vérifié physiquement par l'équipe BOGBE'S">
            <ShieldCheck className="w-2.5 h-2.5" />
            Vérifié
          </span>
        )}
        {b.dist_meters < 999999 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded-full">
            <Car className="w-2 h-2 text-white" />
            <span className="text-white text-[8px] font-bold">{getTravelTime(b.dist_meters)}</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-[var(--surface-card)]">
        <p className="text-[9px] font-display font-bold text-[var(--accent-luxury)] uppercase tracking-[0.1em] mb-1 truncate">
          {b.commune}{b.quartier ? ` · ${b.quartier}` : ''}
        </p>
        <p className="text-[13px] font-bold text-[var(--text)] truncate mb-2 leading-tight">
          {b.titre}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-[12px] font-display font-bold text-[var(--accent-luxury)] tracking-tight">
            {formatPrice(b)}
          </p>
          <Link href={`/biens/${b.id}`} onClick={e => e.stopPropagation()} className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-luxury/10 hover:bg-[var(--accent-luxury)] transition-all">
            <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-luxury)]" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function formatPrice(b: BienProche): string {
  const v = b.prix_nuit_fcfa || b.prix_mois_fcfa || b.prix_vente_fcfa || 0
  const suffix = b.prix_nuit_fcfa ? '/nuit' : b.prix_mois_fcfa ? '/mois' : ''
  return `${formatFCFACompact(v)}${suffix}`
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // metres
  const p1 = lat1 * Math.PI / 180
  const p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180
  const dl = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

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

function addJitter(val: number) {
  return val + (Math.random() - 0.5) * 0.04 // Roughly ±2km jitter
}

export function NearMeSection({ initialBiens = [] }: { initialBiens?: any[] }) {
  const tx = useT()
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapHeight, setMapHeight] = useState(420)

  useEffect(() => {
    function updateHeight() {
      const w = window.innerWidth
      setMapHeight(w < 640 ? 380 : w < 768 ? 420 : 560)
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Use initialBiens as default to avoid empty map on load
  const [biens, setBiens] = useState<BienProche[]>([])

  // Normalize and jitter biens helper
  const normalizeBiens = useCallback((raw: any[]) => {
    return raw.map(b => {
      let bLat = Number(typeof b.latitude === 'string' ? b.latitude.replace(',', '.') : b.latitude)
      let bLng = Number(typeof b.longitude === 'string' ? b.longitude.replace(',', '.') : b.longitude)
      
      // Jitter logic for markers without precise coordinates - Case-insensitive match
      if (!bLat || !bLng || isNaN(bLat) || isNaN(bLng) || (bLat === 0 && bLng === 0)) {
        // Find commune case-insensitively
        const searchName = (b.commune || '').toLowerCase().trim()
        const communeKey = Object.keys(communesCoords).find(k => k.toLowerCase().trim() === searchName)
        const base = communeKey ? communesCoords[communeKey] : communesCoords['Cocody'] || { lat: 5.3484, lng: -4.0107 }
        
        bLat = addJitter(base.lat)
        bLng = addJitter(base.lng)
      }
      return {
        ...b,
        latitude: bLat,
        longitude: bLng,
        dist_meters: b.dist_meters || 999999
      }
    }) as BienProche[]
  }, [])

  // Sync initialBiens to state
  useEffect(() => {
    if (initialBiens?.length > 0) {
      setBiens(normalizeBiens(initialBiens))
    }
  }, [initialBiens, normalizeBiens])

  // Pre-seed coverMap from initialBiens if photo_url is present
  const [coverMap, setCoverMap] = useState<Record<string, string>>(() => {
    const cMap: Record<string, string> = {}
    initialBiens.forEach(b => { if (b.photo_url) cMap[b.id] = b.photo_url })
    return cMap
  })

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { theme } = useTheme()
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Scroll vers la carte quand un bien est sélectionné depuis la liste
  useEffect(() => {
    if (selectedId && mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedId])

  const supabase = createClient() as any

  const getTravelTime = (distanceMeters: number) => {
    const minutes = Math.round((distanceMeters / 1000) * (60 / 25))
    return minutes < 1 ? '< 1 min' : `${minutes} min`
  }

  async function fetchMedias(ids: string[]) {
    if (ids.length === 0) return
    const { data: medias } = await supabase
      .from('biens_medias')
      .select('bien_id, url, est_couverture')
      .in('bien_id', ids)
      .eq('type', 'photo')
      .order('ordre', { ascending: true })

    if (medias) {
      const cMap: Record<string, string> = {}
      for (const m of medias) {
        if (!cMap[m.bien_id] || m.est_couverture) cMap[m.bien_id] = m.url
      }
      setCoverMap(prev => ({ ...prev, ...cMap }))
    }
  }

  async function fetchAllAndSort(lat: number | null, lng: number | null) {
    setLoading(true)
    setError(null)
    try {
      // Fetch all published properties so the map resembles "Trouvez l'Exception"
      const { data } = await supabase
        .from('biens')
        .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, latitude, longitude, est_disponible, is_verifie, score_ia')
        .in('statut', [...STATUTS_PUBLICS])
      
      const rows = data || []
      
      let processed = normalizeBiens(rows)
      
      // Sort by proximity if we have a location
      if (lat !== null && lng !== null) {
        processed = processed.map(b => ({
          ...b,
          dist_meters: getDistance(lat, lng, b.latitude!, b.longitude!)
        }))
        processed.sort((a, b) => a.dist_meters - b.dist_meters)
      } else {
        // Just sort by random or leave as is to display something while GPS locates
        processed.sort((a, b) => (a.score_ia || 0) > (b.score_ia || 0) ? -1 : 1)
      }

      // Sort by proximity if we have a location
      if (lat !== null && lng !== null) {
        processed.sort((a: BienProche, b: BienProche) => a.dist_meters - b.dist_meters)
      } else {
        // Just sort by random or leave as is to display something while GPS locates
        processed.sort((a: BienProche, b: BienProche) => (a.score_ia || 0) > (b.score_ia || 0) ? -1 : 1)
      }
      
      // Limit to 50
      processed = processed.slice(0, 50)

      setBiens(processed)
      await fetchMedias(processed.map((b: BienProche) => b.id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch immediately on mount, updating with GPS if granted
  useEffect(() => {
    // If we have initialBiens from server, we skip the first fetch and just sort them as "far away" (999km)
    // or we fetch immediately if list is empty.
    if (biens.length === 0) {
      fetchAllAndSort(null, null)
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserPos(newPos)
          fetchAllAndSort(newPos.lat, newPos.lng)
        },
        () => {
          // Keep default if location denied
        },
        { timeout: 6000 }
      )
    }
  }, [])

  function handleLocate() {
    setLocating(true)
    setError(null)
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée.")
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPos(newPos)
        setLocating(false)
        fetchAllAndSort(newPos.lat, newPos.lng)
      },
      () => {
        setError("Position refusée ou indisponible.")
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  // ── Quick filters (Airbnb-style above the map) ────────────────────────────
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterOffre, setFilterOffre] = useState<'all' | 'location' | 'vente'>('all')
  const [filterMaxPrice, setFilterMaxPrice] = useState<number | null>(null)

  // Get the max price across all biens to scale the slider
  const maxPriceInData = useMemo(() => {
    let max = 0
    for (const b of biens) {
      const v = Math.max(b.prix_mois_fcfa ?? 0, b.prix_nuit_fcfa ?? 0, b.prix_vente_fcfa ?? 0)
      if (v > max) max = v
    }
    return max
  }, [biens])

  const filteredBiens = useMemo(() => {
    return biens.filter((b) => {
      if (filterType && b.type_bien !== filterType) return false
      if (filterOffre === 'location' && !b.prix_mois_fcfa && !b.prix_nuit_fcfa) return false
      if (filterOffre === 'vente' && !b.prix_vente_fcfa) return false
      if (filterMaxPrice !== null) {
        const price = b.prix_mois_fcfa ?? b.prix_nuit_fcfa ?? b.prix_vente_fcfa ?? 0
        if (price > filterMaxPrice) return false
      }
      return true
    })
  }, [biens, filterType, filterOffre, filterMaxPrice])

  const activeFilterCount =
    (filterType ? 1 : 0) + (filterOffre !== 'all' ? 1 : 0) + (filterMaxPrice !== null ? 1 : 0)

  // Construit l'URL /catalogue qui propage les filtres actifs de la carte —
  // évite la perte de contexte quand l'utilisateur passe carte → catalogue.
  const cataloguePath = useMemo(() => {
    const params = new URLSearchParams()
    if (filterType) params.set('type_bien', filterType)
    if (filterOffre !== 'all') params.set('type_offre', filterOffre)
    if (filterMaxPrice !== null) params.set('prix_max', String(filterMaxPrice))
    const qs = params.toString()
    return qs ? `/catalogue?${qs}` : '/catalogue'
  }, [filterType, filterOffre, filterMaxPrice])

  const mapBiens = useMemo(() => {
    return filteredBiens.map((b: BienProche) => ({ ...b, photo_url: coverMap[b.id] }))
  }, [filteredBiens, coverMap])

  const selectedBien = useMemo(() => filteredBiens.find(b => b.id === selectedId) ?? null, [filteredBiens, selectedId])

  const mapTheme = theme === 'light'
    ? 'mapbox://styles/mapbox/streets-v12'
    : 'mapbox://styles/mapbox/satellite-streets-v12'

  return (
    <section className="relative py-20 overflow-hidden bg-[var(--background)]">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-luxury/5 blur-[150px] rounded-full -mr-64 -mt-32 pointer-events-none" />

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-luxury/10 flex items-center justify-center border border-accent-luxury/20">
                <Navigation className={`w-5 h-5 text-[var(--accent-luxury)] ${locating ? 'animate-spin' : ''}`} />
              </div>
              <span className="text-[var(--accent-luxury)] font-sans tracking-[0.4em] uppercase text-[11px] font-bold">
                {tx.near.interactive}
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-6xl text-[var(--text)] leading-tight tracking-tight">
              {tx.near.title}{' '}
              <span className="italic font-serif text-[var(--accent-luxury)]">{tx.near.titleAccent}</span>
            </h2>
            <p className="text-[var(--text-muted)] mt-3 text-sm max-w-lg font-sans">
              {tx.near.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => (window.location.href = cataloguePath)}
              className="flex items-center gap-2 px-5 py-3 bg-[var(--text)] text-[var(--background)] font-display text-[11px] font-bold tracking-[0.2em] uppercase rounded-full transition-all hover:scale-105 shadow-lg active:scale-95"
            >
              {tx.near.exploreAds}
              <ArrowUpRight className="w-4 h-4 text-[var(--accent-luxury)]" />
            </button>
            <button
              onClick={handleLocate}
              disabled={locating}
              className="flex items-center gap-2 px-5 py-3 border border-[var(--border)] text-[var(--text)] font-sans text-xs font-bold tracking-widest uppercase rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {locating ? tx.near.locating : tx.near.myPosition}
            </button>
            {userPos && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">{tx.near.geoActive}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm font-sans">
            {error}
          </div>
        )}

        {/* ── QUICK FILTERS (Airbnb-style) ─────────────────────────────── */}
        <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {/* Offre toggle */}
          <div
            className="inline-flex p-1 rounded-full bg-[var(--surface-hover)] shrink-0"
            role="radiogroup"
            aria-label="Type d'offre"
          >
            {(['all', 'location', 'vente'] as const).map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={filterOffre === o}
                onClick={() => setFilterOffre(o)}
                className={`px-3 md:px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  filterOffre === o
                    ? 'bg-[var(--text)] text-[var(--background)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {o === 'all' ? 'Tous' : o === 'location' ? 'Location' : 'Vente'}
              </button>
            ))}
          </div>

          {/* Type chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 md:flex-1 md:mx-0 md:px-0">
            {NEAR_CATEGORIES.map((cat) => {
              const active = filterType === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setFilterType(active ? null : cat.key)}
                  aria-pressed={active}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                    active
                      ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)] border-[var(--accent-luxury)]'
                      : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-accent-luxury/40 hover:text-[var(--text)]'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Budget slider */}
          {maxPriceInData > 0 && (
            <div className="flex items-center gap-2 shrink-0 md:min-w-[200px]">
              <label htmlFor="budget-max" className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">
                Max
              </label>
              <input
                id="budget-max"
                type="range"
                min={0}
                max={maxPriceInData}
                step={Math.max(50_000, Math.round(maxPriceInData / 100 / 10_000) * 10_000)}
                value={filterMaxPrice ?? maxPriceInData}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setFilterMaxPrice(v >= maxPriceInData ? null : v)
                }}
                aria-label="Budget maximum"
                className="flex-1 md:w-24 accent-[var(--accent-luxury)]"
              />
              <span className="text-[11px] font-semibold text-[var(--accent-luxury)] tabular-nums min-w-[60px] text-right">
                {filterMaxPrice === null ? '∞' : formatFCFACompact(filterMaxPrice, false)}
              </span>
            </div>
          )}

          {/* Reset */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => { setFilterType(null); setFilterOffre('all'); setFilterMaxPrice(null) }}
              className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-3 py-1.5"
            >
              Réinitialiser ({activeFilterCount})
            </button>
          )}
        </div>

        {/* ── MAIN LAYOUT: Map always on top ── */}
        <div className="flex flex-col gap-8">

          {/* BIG MAP — ALWAYS mounted, loading spinner overlays on top */}
          <div ref={mapContainerRef} className="group rounded-3xl overflow-hidden ring-1 ring-[var(--border)] p-1 bg-[var(--surface-card)] backdrop-blur-md transition-all duration-1000 hover:ring-[var(--accent-luxury)]" style={{ height: mapHeight + 2 }}>
            <div className="rounded-[calc(1.5rem-4px)] overflow-hidden bg-[var(--background)] relative h-full transition-all duration-700">
            {/* Map is ALWAYS rendered — never unmounted */}
            <PropertiesMap
              biens={mapBiens}
              hauteur={mapHeight}
              mapTheme={mapTheme}
              targetCenter={userPos}
              highlightedId={hoveredId}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              userLocation={userPos}
            />

            {/* Loading overlay — sits above the map, doesn't unmount it */}
            {loading && biens.length === 0 && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[var(--accent-luxury)] animate-spin" />
                  <p className="text-[var(--text-muted)] text-sm font-sans uppercase tracking-[0.2em] font-bold">Chargement complet…</p>
                </div>
              </div>
            )}

            {/* Map overlay badges */}
            <div className="absolute top-5 left-5 z-10 flex gap-2 flex-wrap">
              {userPos && (
                <div className="px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-accent-luxury/30 flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  <span className="text-[var(--accent-luxury)] text-[10px] font-bold uppercase tracking-widest">Ma position Géo</span>
                </div>
              )}
              {filteredBiens.length > 0 && (
                <div className="px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-3">
                  <div className="w-2 h-2 bg-[var(--accent-luxury)] rounded-full animate-pulse" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                    {filteredBiens.length}
                    {activeFilterCount > 0 && biens.length !== filteredBiens.length ? ` / ${biens.length}` : ''}
                    {' '}biens
                  </span>
                </div>
              )}
            </div>

            {/* Route info badge — desktop only (mobile handled by PropertiesMap compact bar) */}
            {selectedBien && (
              <div className="hidden sm:flex absolute bottom-5 left-1/2 -translate-x-1/2 z-10 px-5 py-3 bg-black/80 backdrop-blur-xl rounded-full border border-accent-luxury/40 items-center gap-4 shadow-md">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-luxury)] animate-pulse" />
                <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                  Itinéraire vers : {selectedBien.titre}
                </span>
                {userPos && (
                  <span className="text-[var(--accent-luxury)] text-[10px] font-bold flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    {getTravelTime(selectedBien.dist_meters)}
                  </span>
                )}
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-white/40 text-xs hover:text-white transition-colors ml-2"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          </div>

          {/* PROPERTY CARDS below the map */}
          {loading && biens.length === 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-[192px] md:w-[240px] shrink-0 aspect-[3/4] rounded-2xl md:rounded-[1.5rem] bg-[var(--surface-card)] animate-pulse" />
              ))}
            </div>
          ) : biens.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest font-bold mb-5 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-[var(--accent-luxury)]" />
                {selectedId ? tx.near.selected : tx.near.sortedByDistance}
              </p>

              {/* ── TOUS LES ECRANS : rangées par catégorie avec scroll horizontal ── */}
              <div className="space-y-8">
                {NEAR_CATEGORIES.map(cat => {
                  // If user filtered a specific type, only show that row
                  if (filterType && filterType !== cat.key) return null
                  const items = filteredBiens.filter(b => b.type_bien === cat.key)
                  if (items.length === 0) return null
                  return (
                    <div key={cat.key}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 rounded-full bg-[var(--accent-luxury)]" />
                          <h3 className="font-display font-bold text-lg text-[var(--text)] tracking-tight">{cat.label}</h3>
                        </div>
                        <Link
                          href={`/catalogue?type_bien=${cat.key}${filterOffre !== 'all' ? `&type_offre=${filterOffre}` : ''}${filterMaxPrice !== null ? `&prix_max=${filterMaxPrice}` : ''}`}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-luxury)] border-b border-accent-luxury/40 pb-0.5 hover:border-[var(--accent-luxury)] transition-colors"
                        >
                          {tx.near.viewAll} <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="overflow-hidden">
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:-mx-6 md:px-6 snap-x snap-mandatory">
                        {items.map((b, i) => (
                          <div key={b.id} className="snap-start">
                            <NearCard
                              b={b}
                              coverUrl={coverMap[b.id]}
                              isSelected={selectedId === b.id}
                              onSelect={() => setSelectedId(selectedId === b.id ? null : b.id)}
                              onHover={setHoveredId}
                              getTravelTime={getTravelTime}
                            />
                          </div>
                        ))}
                      </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-10 text-center">
                <Link href={cataloguePath} className="inline-flex items-center gap-3 px-8 py-3 rounded-full border border-[var(--accent-luxury)] text-[var(--accent-luxury)] text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[var(--accent-luxury)] hover:text-[var(--text)] transition-all">
                  {tx.near.exploreCatalogue}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--accent-luxury)] text-[var(--text)] text-[8px]">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-[2rem] bg-[var(--surface-card)]">
              <MapPin className="w-12 h-12 text-[var(--accent-luxury)] opacity-50 mx-auto mb-4" />
              <p className="text-[var(--text-muted)] mb-6 font-sans">{tx.near.noBien}</p>
              <Link href="/biens" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[var(--accent-luxury)] text-[var(--accent-luxury)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--accent-luxury)] hover:text-[var(--text)] transition-all">
                {tx.near.viewCatalogue}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
