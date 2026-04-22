'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import * as React from 'react'
import { Home, Building2, Palmtree, Warehouse, Briefcase, Landmark, Shovel, ArrowRight, Filter, AlertCircle, MapPin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const TYPE_FILTERS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'Proche de moi',    value: 'near_me',           icon: MapPin },
  { label: 'Tous',               value: '',                  icon: Home },
  { label: 'Appartements',       value: 'appartement',       icon: Building2 },
  { label: 'Villas de Luxe',     value: 'villa',             icon: Palmtree },
  { label: 'Studios',            value: 'studio',            icon: Warehouse },
  { label: 'Résidences meublées',value: 'residence_meublee', icon: Landmark },
  { label: 'Maisons',            value: 'maison',            icon: Home },
  { label: 'Bureaux',            value: 'bureau',            icon: Briefcase },
  { label: 'Terrains',           value: 'terrain',           icon: Shovel },
]

type BienRow = {
  id: string; titre: string; commune: string; quartier: string | null
  type_bien: string; prix_mois_fcfa: number | null; prix_nuit_fcfa: number | null
  prix_vente_fcfa: number | null; surface_m2: number | null; nb_pieces: number | null
  is_verifie: boolean; score_ia: number; dist_meters?: number
  url_visite_3d?: string | null; proprietaire_id: string
}


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
}

// Suspense requis par Next.js 14 quand useSearchParams() est utilisé dans un client component
export default function BiensListePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl px-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-off-white/5 animate-pulse rounded-[1.5rem]" />
          ))}
        </div>
      </div>
    }>
      <BiensContent />
    </Suspense>
  )
}

function BiensContent() {
  // useSearchParams() = hook Next.js correct pour client components
  // évite la prop searchParams instable qui causait un useEffect en boucle infinie
  const searchParams = useSearchParams()
  const typeFromUrl = searchParams.get('type_bien') ?? ''

  const [activeType, setActiveType] = useState<string>(typeFromUrl)
  const [biens, setBiens] = useState<BienRow[]>([])

  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Instance Supabase stable — une seule fois, jamais recréée
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const getCoverMap = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return {}
    const { data: medias } = await (supabase as any)
      .from('biens_medias')
      .select('bien_id, url, est_couverture')
      .in('bien_id', ids)
      .eq('type', 'photo')
      .order('est_couverture', { ascending: false })

    const map: Record<string, string> = {}
    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
        if (!map[m.bien_id] || m.est_couverture) map[m.bien_id] = m.url
      }
    }
    return map
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        const type = typeFromUrl
        if (!cancelled) setActiveType(type)

        if (type === 'near_me') {
          // Mode Proche de moi
          let loc = userLocation
          if (!loc) {
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
              })
              loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
              if (!cancelled) setUserLocation(loc)
            } catch (err) {
              throw new Error("Impossible d'accéder à votre position. Vérifiez vos réglages navigateur.")
            }
          }

          if (loc) {
            const { data, error: err } = await (supabase as any).rpc('get_biens_proches', {
              user_lat: loc.lat,
              user_lng: loc.lng,
              radius_meters: 10000 // 10km radius
            })

            if (err) throw new Error(err.message)
            const rows = (data ?? []) as BienRow[]
            const cMap = await getCoverMap(rows.map(b => b.id))
            if (!cancelled) { setBiens(rows); setCoverMap(cMap); setCount(rows.length) }
          }
        } else if (type) {
          // Mode filtre actif — grille paginée
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, count: c, error: err } = await (supabase as any)
            .from('biens')
            .select(
              'id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, is_verifie, score_ia, url_visite_3d, proprietaire_id',
              { count: 'exact' }
            )
            .eq('statut', 'publie')
            .eq('type_bien', type)
            .order('created_at', { ascending: false })
            .limit(24)

          if (err) throw new Error(err.message)
          const rows = (data ?? []) as BienRow[]
          const cMap = await getCoverMap(rows.map(b => b.id))
          if (!cancelled) { setBiens(rows); setCoverMap(cMap); setCount(c ?? 0) }

        } else {
          // Mode grille — tous les biens
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, count: c, error: err } = await (supabase as any)
            .from('biens')
            .select(
              'id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, is_verifie, score_ia, url_visite_3d, proprietaire_id',
              { count: 'exact' }
            )
            .eq('statut', 'publie')
            .order('created_at', { ascending: false })
            .limit(24)

          if (err) throw new Error(err.message)
          const rows = (data ?? []) as BienRow[]
          const cMap = await getCoverMap(rows.map(b => b.id))
          if (!cancelled) { setBiens(rows); setCoverMap(cMap); setCount(c ?? 0) }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    // Fetch user for quick edit
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id)
    })

    return () => { cancelled = true }
  }, [typeFromUrl, supabase, getCoverMap])

  const activeLabel = TYPE_FILTERS.find(f => f.value === activeType)?.label ?? activeType

  return (
    <div className="min-h-screen bg-midnight">
      <PageHeader activeType={activeType} count={count} />

      <main className="max-w-7xl mx-auto px-4 pt-6 pb-16" aria-live="polite" aria-busy={loading}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              role="status" aria-label="Chargement des biens"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-off-white/5 animate-pulse rounded-[1.5rem]" />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-32 px-8"
              role="alert"
            >
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-6" />
              <h3 className="font-display text-2xl font-bold text-off-white mb-3">Erreur de chargement</h3>
              <p className="text-off-white/60 mb-8 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-off-white/10 hover:bg-off-white/20 text-off-white rounded-full font-bold transition-colors"
              >
                Réessayer
              </button>
            </motion.div>
          ) : (
            <motion.div key="grid" variants={containerVariants} initial="hidden" animate="visible">
              {biens.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {biens.map((bien, i) => (
                    <motion.div key={bien.id} variants={itemVariants} className="relative group/card">
                      <PremiumBienCard
                        id={bien.id}
                        titre={bien.titre}
                        commune={bien.commune}
                        quartier={bien.quartier}
                        type_bien={bien.type_bien}
                        prix_mois_fcfa={bien.prix_nuit_fcfa ? null : bien.prix_mois_fcfa}
                        prix_nuit_fcfa={bien.prix_nuit_fcfa}
                        prix_vente_fcfa={bien.prix_vente_fcfa}
                        surface_m2={bien.surface_m2}
                        nb_pieces={bien.nb_pieces}
                        photo_url={coverMap[bien.id] ?? null}
                        is_verifie={bien.is_verifie}
                        score_ia={bien.score_ia}
                        url_visite_3d={bien.url_visite_3d}
                        index={i}
                      />
                      {currentUserId === bien.proprietaire_id && (
                        <div className="absolute top-4 left-4 z-20">
                          <Link
                            href={`/mes-biens/${bien.id}/modifier`}
                            className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-xl hover:scale-105 transition-transform border border-white/20"
                          >
                            Modifier
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}


function PageHeader({ activeType, count }: { activeType: string; count: number }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 180)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="relative pt-16 pb-4 md:pt-24 md:pb-6 bg-midnight overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 md:mb-8"
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold text-off-white tracking-tight">
            Annonces immobilières
          </h1>
          {count > 0 && (
            <p className="text-off-white/40 text-sm mt-1">
              {count} bien{count > 1 ? 's' : ''} disponible{count > 1 ? 's' : ''}
            </p>
          )}
        </motion.div>

        {/* Barre de filtres */}
        <div className={`sticky top-4 z-50 transition-all duration-300 ${scrolled ? 'scale-[0.98]' : 'scale-100'}`}>
          <div className="bg-midnight-muted/90 backdrop-blur-2xl border border-off-white/10 p-1 rounded-full shadow-xl">
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide py-0.5 px-1" aria-label="Filtres de type de bien">
              {TYPE_FILTERS.map((f) => {
                const isActive = f.value === activeType
                return (
                  <a
                    key={f.value}
                    href={f.value ? `/biens?type_bien=${f.value}` : '/biens'}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      flex items-center gap-1.5 shrink-0 px-4 py-2.5 rounded-full text-[10px] font-bold
                      transition-all duration-200 uppercase tracking-[0.12em]
                      ${isActive
                        ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--text)]/5'
                      }
                    `}
                  >
                    <f.icon className={`w-3 h-3 shrink-0 ${isActive ? 'text-[var(--on-primary)]' : 'text-[var(--text-subtle)]'}`} aria-hidden="true" />
                    <span className="hidden sm:inline">{f.label}</span>
                    <span className="sm:hidden">{f.label.split(' ')[0]}</span>
                  </a>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-48 px-8 rounded-[2.5rem] bg-off-white/[0.02] border border-off-white/8">
      <div className="w-20 h-20 bg-off-white/5 rounded-2xl mx-auto flex items-center justify-center
        border border-off-white/10 mb-10">
        <Filter className="w-7 h-7 text-off-white/20" aria-hidden="true" />
      </div>
      <h3 className="font-display text-3xl font-black text-off-white mb-5 tracking-tighter">
        Aucun bien trouvé
      </h3>
      <p className="text-off-white/60 font-sans text-base max-w-md mx-auto mb-12 leading-relaxed">
        Cette catégorie est en cours de curation. Explorez nos autres collections.
      </p>
      <a
        href="/biens"
        className="inline-flex items-center gap-3 px-10 py-4 bg-off-white/8 hover:bg-off-white/15
          text-off-white rounded-full font-bold transition-all duration-300 border border-off-white/10"
      >
        Voir toutes les annonces
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  )
}
