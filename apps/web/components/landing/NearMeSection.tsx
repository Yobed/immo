'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Navigation, Loader2, Car, Clock, Star, ExternalLink, ChevronRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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

function formatPrice(b: BienProche): string {
  const v = b.prix_nuit_fcfa || b.prix_mois_fcfa || b.prix_vente_fcfa || 0
  const suffix = b.prix_nuit_fcfa ? '/nuit' : b.prix_mois_fcfa ? '/mois' : ''
  const label = v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1_000)}k`
  return `${label} FCFA${suffix}`
}

export function NearMeSection() {
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [biens, setBiens] = useState<BienProche[]>([])
  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { theme } = useTheme()

  const supabase = createClient()

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

  async function fetchNearMe(lat: number, lng: number) {
    setLoading(true)
    setError(null)
    try {
      const { data } = await (supabase as any).rpc('get_biens_proches', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: 10000
      })

      const rows = (data ?? []) as BienProche[]

      if (rows.length === 0) {
        const { data: latest } = await supabase
          .from('biens')
          .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, latitude, longitude, est_disponible, is_verifie, score_ia')
          .eq('statut', 'publie')
          .order('created_at', { ascending: false })
          .limit(12)
        if (latest) {
          const fallback = latest.map((b: any) => ({ ...b, dist_meters: 999999 })) as BienProche[]
          setBiens(fallback)
          await fetchMedias(fallback.map(b => b.id))
        }
      } else {
        setBiens(rows)
        await fetchMedias(rows.map(b => b.id))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-locate on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserPos(newPos)
          setLocating(false)
          fetchNearMe(newPos.lat, newPos.lng)
        },
        () => {
          setLocating(false)
          // Load default properties even without GPS
          fetchNearMe(5.3484, -4.0107) // Abidjan center
        },
        { timeout: 6000 }
      )
    } else {
      fetchNearMe(5.3484, -4.0107)
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
        fetchNearMe(newPos.lat, newPos.lng)
      },
      () => {
        setError("Position refusée ou indisponible.")
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  const mapBiens = useMemo(() => {
    return biens.map(b => ({ ...b, photo_url: coverMap[b.id] }))
  }, [biens, coverMap])

  const selectedBien = useMemo(() => biens.find(b => b.id === selectedId) ?? null, [biens, selectedId])

  const mapTheme = theme === 'light'
    ? 'mapbox://styles/mapbox/light-v11'
    : 'mapbox://styles/mapbox/dark-v11'

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
                Carte Interactive · Abidjan
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-[var(--text)] leading-tight tracking-tight">
              Biens{' '}
              <span className="italic font-serif text-[var(--accent-luxury)]">autour de vous</span>
            </h2>
            <p className="text-[var(--text-muted)] mt-3 text-sm max-w-lg">
              Cliquez sur un bien dans la liste pour tracer l&apos;itinéraire sur la carte.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {!userPos && (
              <button
                onClick={handleLocate}
                disabled={locating}
                className="flex items-center gap-3 px-7 py-3.5 bg-[var(--text)] text-[var(--background)] font-sans text-xs font-bold tracking-widest uppercase rounded-full transition-all hover:scale-105 shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {locating ? 'Localisation...' : 'Activer ma position'}
              </button>
            )}
            {userPos && (
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  GPS Actif · 10km
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── MAIN LAYOUT: Map always on top ── */}
        <div className="flex flex-col gap-8">

          {/* BIG MAP — ALWAYS mounted, loading spinner overlays on top */}
          <div className="rounded-3xl overflow-hidden ring-1 ring-[var(--border)] p-1 bg-[var(--surface-card)] backdrop-blur-3xl transition-all duration-1000 ease-[0.16, 1, 0.3, 1] hover:ring-[var(--accent-luxury)]" style={{ height: '560px' }}>
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
                  <p className="text-[var(--text-muted)] text-sm">Chargement des biens…</p>
                </div>
              </div>
            )}

            {/* Map overlay badges */}
            <div className="absolute top-5 left-5 z-10 flex gap-2 flex-wrap">
              {userPos && (
                <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  <span className="text-white text-[9px] font-bold uppercase tracking-widest">Ma position</span>
                </div>
              )}
              {biens.length > 0 && (
                <div className="px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                  <span className="text-white text-[9px] font-bold uppercase tracking-widest">{biens.length} biens</span>
                </div>
              )}
            </div>

            {/* Route info badge */}
            {selectedBien && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 px-5 py-3 bg-black/80 backdrop-blur-xl rounded-full border border-[var(--accent-luxury)]/40 flex items-center gap-4 shadow-2xl">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : biens.length > 0 ? (
            <div>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest font-bold mb-5 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-[var(--accent-luxury)]" />
                {selectedId ? 'Bien sélectionné — Itinéraire affiché sur la carte' : 'Cliquez sur un bien pour voir le trajet'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {biens.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    className={`relative group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 ${
                      selectedId === b.id
                        ? 'border-[var(--accent-luxury)] ring-2 ring-[var(--accent-luxury)]/50 shadow-[0_0_30px_rgba(212,175,55,0.2)]'
                        : 'border-[var(--border)] hover:border-[var(--accent-luxury)]/40'
                    }`}
                    onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}
                    onMouseEnter={() => setHoveredId(b.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Cover image */}
                    <div className="aspect-[4/3] bg-[var(--surface-card)] relative overflow-hidden">
                      {coverMap[b.id] ? (
                        <Image
                          src={coverMap[b.id]}
                          alt={b.titre}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                          <MapPin className="w-8 h-8 text-[var(--text-muted)]" />
                        </div>
                      )}
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Selected indicator */}
                      {selectedId === b.id && (
                        <div className="absolute inset-0 bg-[var(--accent-luxury)]/10 border-2 border-[var(--accent-luxury)] rounded-2xl" />
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {b.is_verifie && (
                          <span className="px-2 py-0.5 bg-blue-500/80 rounded-full text-[8px] font-bold text-white uppercase tracking-wide">
                            Certifié
                          </span>
                        )}
                      </div>

                      {/* Distance badge */}
                      {b.dist_meters < 999999 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-emerald-500/90 rounded-full">
                          <Car className="w-2.5 h-2.5 text-white" />
                          <span className="text-white text-[8px] font-bold">{getTravelTime(b.dist_meters)}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 bg-[var(--surface-card)]">
                      <p className="text-[9px] font-bold text-[var(--accent-luxury)] uppercase tracking-widest mb-1 truncate">
                        {b.commune}{b.quartier ? ` · ${b.quartier}` : ''}
                      </p>
                      <p className="text-xs font-semibold text-[var(--text)] truncate mb-2">{b.titre}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-[var(--text)]">{formatPrice(b)}</p>
                        <Link
                          href={`/biens/${b.id}`}
                          onClick={e => e.stopPropagation()}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--accent-luxury)]/10 hover:bg-[var(--accent-luxury)] hover:text-black transition-all"
                        >
                          <ExternalLink className="w-3 h-3 text-[var(--accent-luxury)]" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Link to full catalog */}
              <div className="mt-8 text-center">
                <Link
                  href="/biens"
                  className="inline-flex items-center gap-3 px-8 py-3 rounded-full border border-[var(--accent-luxury)] text-[var(--accent-luxury)] text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[var(--accent-luxury)] hover:text-black transition-all"
                >
                  Explorer tout le catalogue
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-3xl">
              <MapPin className="w-12 h-12 text-[var(--text-muted)] opacity-30 mx-auto mb-4" />
              <p className="text-[var(--text-muted)] mb-6">Aucun bien trouvé à proximité.</p>
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
