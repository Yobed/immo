'use client'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Navigation, Loader2, Car, ExternalLink, ChevronRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import Image from 'next/image'

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
      className={`w-[168px] shrink-0 rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'border-[var(--accent-luxury)] ring-2 ring-[var(--accent-luxury)]/50'
          : 'border-[var(--border)] hover:border-[var(--accent-luxury)]/40'
      }`}
      onClick={onSelect}
      onMouseEnter={() => onHover(b.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-[var(--surface-card)]">
        {coverUrl ? (
          <Image src={coverUrl} alt={b.titre} fill className="object-cover transition-transform duration-500 hover:scale-105" sizes="168px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <MapPin className="w-6 h-6 text-[var(--accent-luxury)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {b.is_verifie && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-500/80 backdrop-blur-md rounded-full text-[7px] font-bold text-white uppercase tracking-wide">Certifié</span>
        )}
        {b.dist_meters < 999999 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded-full">
            <Car className="w-2 h-2 text-white" />
            <span className="text-white text-[8px] font-bold">{getTravelTime(b.dist_meters)}</span>
          </div>
        )}
      </div>
      <div className="p-2.5 bg-[var(--surface-card)]">
        <p className="text-[8px] font-bold text-[var(--accent-luxury)] uppercase tracking-widest mb-0.5 truncate">{b.commune}{b.quartier ? ` · ${b.quartier}` : ''}</p>
        <p className="text-[12px] font-semibold text-[var(--text)] truncate mb-1.5 leading-tight">{b.titre}</p>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-[var(--text)]">{formatPrice(b)}</p>
          <Link href={`/biens/${b.id}`} onClick={e => e.stopPropagation()} className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--accent-luxury)]/10 hover:bg-[var(--accent-luxury)] transition-all">
            <ExternalLink className="w-3 h-3 text-[var(--accent-luxury)]" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function formatPrice(b: BienProche): string {
  const v = b.prix_nuit_fcfa || b.prix_mois_fcfa || b.prix_vente_fcfa || 0
  const suffix = b.prix_nuit_fcfa ? '/nuit' : b.prix_mois_fcfa ? '/mois' : ''
  const label = v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1_000)}k`
  return `${label} FCFA${suffix}`
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
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
        .eq('statut', 'publie')
      
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

  const mapBiens = useMemo(() => {
    return biens.map((b: BienProche) => ({ ...b, photo_url: coverMap[b.id] }))
  }, [biens, coverMap])

  const selectedBien = useMemo(() => biens.find(b => b.id === selectedId) ?? null, [biens, selectedId])

  const mapTheme = theme === 'light'
    ? 'mapbox://styles/mapbox/streets-v12'
    : 'mapbox://styles/mapbox/satellite-streets-v12'

  return (
    <section className="relative py-20 overflow-hidden bg-[var(--background)]">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent-luxury)]/5 blur-[150px] rounded-full -mr-64 -mt-32 pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-luxury)]/10 flex items-center justify-center border border-[var(--accent-luxury)]/20">
                <Navigation className={`w-5 h-5 text-[var(--accent-luxury)] ${locating ? 'animate-spin' : ''}`} />
              </div>
              <span className="text-[var(--accent-luxury)] font-sans tracking-[0.4em] uppercase text-[11px] font-bold">
                Carte Interactive · Filtre Géo
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-[var(--text)] leading-tight tracking-tight">
              Biens{' '}
              <span className="italic font-serif text-[var(--accent-luxury)]">autour de vous</span>
            </h2>
            <p className="text-[var(--text-muted)] mt-3 text-sm max-w-lg font-sans">
              Tous nos biens immobiliers s&apos;affichent sur cette carte, filtrés et triés dynamiquement par rapport à votre position ! Cliquez sur Activer ma position pour resserrer le filtre géographique.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={handleLocate}
              disabled={locating}
              className="flex items-center gap-3 px-7 py-3.5 bg-[var(--text)] text-[var(--background)] font-sans text-xs font-bold tracking-widest uppercase rounded-full transition-all hover:scale-105 shadow-2xl active:scale-95 disabled:opacity-50"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {locating ? 'Localisation...' : 'Rafraîchir ma position'}
            </button>
            {userPos && (
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  Filtre Géo Actif
                </span>
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

        {/* ── MAIN LAYOUT: Map always on top ── */}
        <div className="flex flex-col gap-8">

          {/* BIG MAP — ALWAYS mounted, loading spinner overlays on top */}
          <div ref={mapContainerRef} className="rounded-3xl overflow-hidden ring-1 ring-[var(--border)] p-1 bg-[var(--surface-card)] backdrop-blur-3xl transition-all duration-1000 ease-[0.16, 1, 0.3, 1] hover:ring-[var(--accent-luxury)]" style={{ height: '560px' }}>
            <div className="rounded-[calc(1.5rem-4px)] overflow-hidden bg-[var(--background)] relative h-full">
            {/* Map is ALWAYS rendered — never unmounted */}
            <PropertiesMap
              biens={mapBiens}
              hauteur={560}
              mapTheme={mapTheme}
              targetCenter={userPos}
              highlightedId={hoveredId}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              userLocation={userPos}
            />

            {/* Loading overlay — sits above the map, doesn't unmount it */}
            {loading && biens.length === 0 && (
              <div className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[var(--accent-luxury)] animate-spin" />
                  <p className="text-[var(--text-muted)] text-sm font-sans uppercase tracking-[0.2em] font-bold">Chargement complet…</p>
                </div>
              </div>
            )}

            {/* Map overlay badges */}
            <div className="absolute top-5 left-5 z-10 flex gap-2 flex-wrap">
              {userPos && (
                <div className="px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-[var(--accent-luxury)]/30 flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  <span className="text-[var(--accent-luxury)] text-[10px] font-bold uppercase tracking-widest">Ma position Géo</span>
                </div>
              )}
              {biens.length > 0 && (
                <div className="px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">{biens.length} biens filtrés</span>
                </div>
              )}
            </div>

            {/* Route info badge — desktop only (mobile handled by PropertiesMap compact bar) */}
            {selectedBien && (
              <div className="hidden sm:flex absolute bottom-5 left-1/2 -translate-x-1/2 z-10 px-5 py-3 bg-black/80 backdrop-blur-xl rounded-full border border-[var(--accent-luxury)]/40 items-center gap-4 shadow-2xl">
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
                <div key={i} className="w-[168px] shrink-0 aspect-[3/4] rounded-2xl bg-[var(--surface-card)] animate-pulse" />
              ))}
            </div>
          ) : biens.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest font-bold mb-5 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-[var(--accent-luxury)]" />
                {selectedId ? 'Bien sélectionné — Itinéraire affiché sur la carte' : 'Triés par distance · Cliquez pour voir le trajet'}
              </p>

              {/* ── MOBILE : rangées par catégorie ── */}
              <div className="md:hidden space-y-8">
                {NEAR_CATEGORIES.map(cat => {
                  const items = biens.filter(b => b.type_bien === cat.key)
                  if (items.length === 0) return null
                  return (
                    <div key={cat.key}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display font-bold text-base text-[var(--text)] tracking-tight">{cat.label}</h3>
                        <Link
                          href={`/biens?type_bien=${cat.key}`}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-luxury)]"
                        >
                          Voir tout <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
                        {items.map((b, i) => (
                          <NearCard
                            key={b.id}
                            b={b}
                            coverUrl={coverMap[b.id]}
                            isSelected={selectedId === b.id}
                            onSelect={() => setSelectedId(selectedId === b.id ? null : b.id)}
                            onHover={setHoveredId}
                            getTravelTime={getTravelTime}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── DESKTOP : grille plate ── */}
              <div className={`hidden md:grid gap-4 transition-all duration-700 ${
                selectedId
                  ? 'grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                  : 'grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}>
                {biens.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 10) * 0.05, duration: 0.5 }}
                    className={`relative group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 ${
                      selectedId === b.id
                        ? 'border-[var(--accent-luxury)] ring-2 ring-[var(--accent-luxury)]/50 shadow-[0_0_30px_rgba(212,175,55,0.2)]'
                        : 'border-[var(--border)] hover:border-[var(--accent-luxury)]/40'
                    }`}
                    onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}
                    onMouseEnter={() => setHoveredId(b.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="aspect-[4/3] bg-[var(--surface-card)] relative overflow-hidden">
                      {coverMap[b.id] ? (
                        <Image src={coverMap[b.id]} alt={b.titre} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="20vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20"><MapPin className="w-8 h-8 text-[var(--accent-luxury)]" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {selectedId === b.id && <div className="absolute inset-0 bg-[var(--accent-luxury)]/10 border-2 border-[var(--accent-luxury)] rounded-2xl" />}
                      {b.is_verifie && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500/80 backdrop-blur-md rounded-full text-[8px] font-bold text-white uppercase tracking-wide">Certifié</span>
                      )}
                      {b.dist_meters < 999999 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/90 backdrop-blur-md rounded-full">
                          <Car className="w-2.5 h-2.5 text-white" />
                          <span className="text-white text-[9px] font-bold">{getTravelTime(b.dist_meters)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-[var(--surface-card)]">
                      <p className="text-[9px] font-bold text-[var(--accent-luxury)] uppercase tracking-widest mb-0.5 truncate">{b.commune}{b.quartier ? ` · ${b.quartier}` : ''}</p>
                      <p className="text-sm font-semibold text-[var(--text)] truncate mb-2">{b.titre}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black text-[var(--text)]">{formatPrice(b)}</p>
                        <Link href={`/biens/${b.id}`} onClick={e => e.stopPropagation()} className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--accent-luxury)]/10 hover:bg-[var(--accent-luxury)] transition-all">
                          <ExternalLink className="w-3 h-3 text-[var(--accent-luxury)]" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link href="/biens" className="inline-flex items-center gap-3 px-8 py-3 rounded-full border border-[var(--accent-luxury)] text-[var(--accent-luxury)] text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[var(--accent-luxury)] hover:text-black transition-all">
                  Explorer tout le catalogue <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-[2rem] bg-[var(--surface-card)]">
              <MapPin className="w-12 h-12 text-[var(--accent-luxury)] opacity-50 mx-auto mb-4" />
              <p className="text-[var(--text-muted)] mb-6 font-sans">Aucun bien trouvé sur la plateforme.</p>
              <Link href="/biens" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[var(--accent-luxury)] text-[var(--accent-luxury)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--accent-luxury)] hover:text-black transition-all">
                Voir le catalogue
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
