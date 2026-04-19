'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { MapPin, Navigation, Loader2, AlertCircle, Map as MapIcon, List, Clock, Car } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

import { useTheme } from 'next-themes'

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

export function NearMeSection() {
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [biens, setBiens] = useState<BienProche[]>([])
  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid')
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { theme } = useTheme()

  const supabase = createClient()

  // Estimation du temps de trajet (moyenne Abidjan : 25km/h aux heures de pointe)
  const getTravelTime = (distanceMeters: number) => {
    const minutes = Math.round((distanceMeters / 1000) * (60 / 25))
    return minutes < 1 ? 'Moins de 1 min' : `${minutes} min`
  }

  async function fetchNearMe(lat: number, lng: number) {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await (supabase as any).rpc('get_biens_proches', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: 10000 // Rayon de 10km pour plus de résultats
      })

      if (err) throw err

      const rows = (data ?? []) as BienProche[]
      setBiens(rows)

      if (rows.length > 0) {
        const { data: medias } = await supabase
          .from('biens_medias')
          .select('bien_id, url, est_couverture')
          .in('bien_id', rows.map(b => b.id))
          .eq('type', 'photo')
          .order('ordre', { ascending: true })

        if (medias) {
          const cMap: Record<string, string> = {}
          for (const m of medias) {
            if (!cMap[m.bien_id] || m.est_couverture) cMap[m.bien_id] = m.url
          }
          setCoverMap(cMap)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLocate() {
    setLocating(true)
    setError(null)
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.")
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
      (err) => {
        setError("Accès à la position refusé ou indisponible.")
        setLocating(false)
      },
      { timeout: 10000 }
    )
  }

  const mapBiens = useMemo(() => {
    return (biens || []).map(b => ({
      ...b,
      photo_url: coverMap[b.id]
    }))
  }, [biens, coverMap])

  return (
    <section className="relative py-24 overflow-hidden bg-[var(--background)]">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-luxury)]/5 blur-[120px] rounded-full -mr-64 -mt-32" />

      <div className="container relative z-10 mx-auto px-6 max-w-7xl">
        <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-luxury)]/10 flex items-center justify-center border border-[var(--accent-luxury)]/20">
                <Navigation className={`w-5 h-5 text-[var(--accent-luxury)] ${locating ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-[var(--accent-luxury)] font-sans tracking-[0.4em] uppercase text-[11px] font-bold">
                Expérience Locale Augmentée
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-7xl text-[var(--text)] leading-tight tracking-tight">
              Résidences <br/>
              <span className="italic font-serif text-[var(--accent-luxury)] drop-shadow-sm">À quelques minutes.</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {!userPos ? (
              <button
                onClick={handleLocate}
                disabled={locating}
                className="group relative flex items-center gap-4 px-8 py-4 bg-[var(--text)] text-[var(--background)] font-sans text-xs font-bold tracking-widest uppercase rounded-full transition-all hover:scale-105 shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {locating ? 'Localisation...' : 'Biens autour de moi'}
              </button>
            ) : (
              <div className="flex items-center bg-[var(--surface-card)] p-1 rounded-full border border-[var(--border)]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-[var(--text)] text-[var(--background)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  <List className="w-3.5 h-3.5" />
                  Grille
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'split' ? 'bg-[var(--text)] text-[var(--background)] shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  Carte Interactive
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-400 mb-12 max-w-lg mx-auto"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-40 grayscale"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </motion.div>
          ) : biens.length > 0 ? (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px]' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'}
            >
              <div className={viewMode === 'split' ? 'lg:col-span-5 h-[700px] overflow-y-auto pr-4 custom-scrollbar space-y-8' : 'contents'}>
                {biens.map((b, i) => (
                  <div 
                    key={b.id} 
                    className="relative group/card flex flex-col h-full"
                    onMouseEnter={() => setHoveredId(b.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <PremiumBienCard
                      {...b}
                      photo_url={coverMap[b.id]}
                      index={i}
                    />
                    {/* Badge de distance flottant - Repositionné de façon plus élégante et discrète */}
                    <div className="absolute bottom-[130px] left-4 right-4 z-20 flex justify-between items-end pointer-events-none opacity-0 group-hover/card:opacity-100 translate-y-2 group-hover/card:translate-y-0 transition-all duration-500">
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/90 backdrop-blur-md text-[9px] font-bold text-white shadow-xl flex items-center gap-1.5 border border-white/20">
                        <Car className="w-3 h-3" />
                        {getTravelTime(b.dist_meters)}
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-[9px] font-bold text-white shadow-xl border border-white/10">
                        {(b.dist_meters / 1000).toFixed(1)} km
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {viewMode === 'split' && (
                <div className="lg:col-span-7 h-[700px] rounded-[2.5rem] overflow-hidden border border-[var(--border)] shadow-2xl sticky top-24">
                  <PropertiesMap
                    biens={mapBiens}
                    hauteur={700}
                    mapTheme={theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11'}
                    targetCenter={userPos}
                    highlightedId={hoveredId}
                  />
                  {/* User location overlay marker on map (simulated as just the center) */}
                  <div className="absolute bottom-6 left-6 z-10 p-4 bg-[var(--midnight-glow)] backdrop-blur-xl rounded-2xl border border-[var(--border)] max-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                      <span className="text-[10px] font-bold text-[var(--text)] uppercase tracking-widest">Ma Position</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                      Optimisation des résultats dans un rayon de 10km.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : userPos && !loading ? (
            <div className="text-center py-24 border border-dashed border-[var(--border)] rounded-[4rem] bg-[var(--surface)]/30">
              <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-[var(--text-muted)] opacity-40" />
              </div>
              <p className="text-[var(--text-muted)] text-lg mb-8">Aucune résidence d&apos;exception n&apos;a été trouvée dans votre périmètre immédiat.</p>
              <Link href="/biens" className="inline-flex items-center gap-3 px-8 py-3 rounded-full border border-[var(--accent-luxury)] text-[var(--accent-luxury)] uppercase text-[10px] font-bold tracking-[0.3em] hover:bg-[var(--accent-luxury)] hover:text-black transition-all">
                Explorer tout le catalogue
              </Link>
            </div>
          ) : (
            <div className="relative aspect-[16/7] md:aspect-[3/1] rounded-[4rem] overflow-hidden border border-[var(--border)] bg-[var(--surface-card)] flex flex-col items-center justify-center text-center p-12 group transition-all hover:bg-[var(--surface)] duration-700">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-[var(--accent-luxury)]/20 blur-3xl rounded-full animate-pulse" />
                <Navigation className="w-16 h-16 text-[var(--text-muted)] opacity-30 relative z-10 group-hover:text-[var(--accent-luxury)] group-hover:opacity-100 transition-all duration-700" strokeWidth={1} />
              </div>
              <h3 className="text-[var(--text)] opacity-60 font-display text-2xl mb-4 tracking-tight">Découvrez les pépites de votre voisinage.</h3>
              <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto leading-relaxed">
                Notre intelligence locale identifie les résidences meublées les plus prestigieuses à proximité de votre position actuelle.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
