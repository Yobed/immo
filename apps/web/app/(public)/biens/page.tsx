'use client'
import { createClient } from '@/lib/supabase/client'
import { BienCard } from '@/components/bien/BienCard'
import { CardsCarousel } from '@/components/ui/CardsCarousel'
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

type TypeRow = { label: string; value: string; icon: LucideIcon; biens: BienRow[] }

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
  const [typeResults, setTypeResults] = useState<TypeRow[]>([])
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
          // Mode magazine — carousels par catégorie
          const results = await Promise.all(
            TYPE_FILTERS.filter(f => f.value !== '').map(async (f) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data } = await (supabase as any)
                .from('biens')
                .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, is_verifie, score_ia, url_visite_3d, proprietaire_id')
                .eq('statut', 'publie')
                .eq('type_bien', f.value)
                .order('created_at', { ascending: false })
                .limit(8)
              return { ...f, biens: (data ?? []) as BienRow[] }
            })
          )
          const allIds = results.flatMap(r => r.biens.map(b => b.id))
          const cMap = await getCoverMap(allIds)
          if (!cancelled) { setTypeResults(results); setCoverMap(cMap); setCount(allIds.length) }
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

      <main className="max-w-7xl mx-auto px-4 py-16" aria-live="polite" aria-busy={loading}>
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
          ) : activeType ? (
            <motion.div key="grid" variants={containerVariants} initial="hidden" animate="visible">
              {/* Header de section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div>
                  <span className="text-[var(--accent-luxury)] font-bold tracking-[0.4em] uppercase text-[9px] block mb-4">
                    Collection curatée
                  </span>
                  <h2 className="font-display text-5xl md:text-7xl font-black text-[var(--text)] tracking-tight leading-none">
                    {activeLabel}
                  </h2>
                </div>
                <div className="text-right border-l border-[var(--border)] pl-8 shrink-0">
                  <p className="text-[var(--text-muted)] font-sans text-[10px] uppercase tracking-[0.2em] mb-1">Disponibles</p>
                  <p className="text-[var(--text)] font-display text-4xl font-bold">{count}</p>
                </div>
              </div>

              {biens.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {biens.map((bien) => (
                    <motion.div key={bien.id} variants={itemVariants} className="relative group/card">
                      <BienCard {...bienProps(bien, coverMap)} />
                      {currentUserId === bien.proprietaire_id && (
                        <div className="absolute top-6 right-6 z-20">
                          <Link 
                            href={`/mes-biens/${bien.id}/modifier`}
                            className="px-5 py-2.5 bg-secondary text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-2xl hover:scale-105 transition-transform border border-white/20"
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
          ) : (
            <motion.div key="magazine" variants={containerVariants} initial="hidden" animate="visible" className="space-y-32">
              {typeResults.filter(r => r.biens.length > 0).map((row, idx) => (
                <section key={row.value} aria-labelledby={`section-${row.value}`}>
                  {/* Header catégorie */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-luxury)]/8 flex items-center justify-center
                          text-[var(--accent-luxury)] border border-[var(--accent-luxury)]/15">
                          <row.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[var(--accent-luxury)] font-bold tracking-[0.3em] uppercase text-[9px]">
                          La Collection
                        </span>
                      </div>
                      <h2
                        id={`section-${row.value}`}
                        className="font-display text-4xl md:text-6xl font-black text-off-white tracking-[0.01em] leading-[0.9]"
                      >
                        {row.label}
                      </h2>
                    </div>

                    <a
                      href={`/biens?type_bien=${row.value}`}
                      className="group/link inline-flex items-center gap-4 px-8 py-4 bg-midnight
                        hover:bg-primary transition-all duration-500 rounded-2xl text-off-white
                        shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-primary/20 shrink-0"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Voir tout</span>
                      <div className="w-8 h-8 rounded-full bg-off-white/10 group-hover/link:bg-off-white/20
                        flex items-center justify-center transition-colors">
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                      </div>
                    </a>
                  </div>

                  <CardsCarousel cardWidth={340}>
                    <div className="flex gap-6">
                      {row.biens.map((bien: BienRow) => (
                        <div key={bien.id} className="w-[300px] sm:w-[340px] lg:w-[380px] shrink-0 relative group/card">
                          <BienCard {...bienProps(bien, coverMap)} isExclusive={idx === 0} />
                          {currentUserId === bien.proprietaire_id && (
                            <div className="absolute top-6 right-6 z-20">
                              <Link 
                                href={`/mes-biens/${bien.id}/modifier`}
                                className="px-5 py-2.5 bg-secondary text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-2xl hover:scale-105 transition-transform border border-white/20"
                              >
                                Modifier
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardsCarousel>
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function bienProps(bien: BienRow, coverMap: Record<string, string>) {
  return {
    id: bien.id, titre: bien.titre, commune: bien.commune, quartier: bien.quartier,
    type_bien: bien.type_bien,
    prix_mois_fcfa: bien.prix_nuit_fcfa ? null : bien.prix_mois_fcfa,
    prix_nuit_fcfa: bien.prix_nuit_fcfa,
    prix_vente_fcfa: bien.prix_vente_fcfa,
    surface_m2: bien.surface_m2, nb_pieces: bien.nb_pieces,
    photo_url: coverMap[bien.id] ?? null,
    isVerified: bien.is_verifie,
    aiScore: bien.score_ia,
    distMeters: bien.dist_meters,
    url_visite_3d: bien.url_visite_3d,
  }
}

function PageHeader({ activeType, count }: { activeType: string; count: number }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 180)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="relative pt-28 pb-20 md:pt-48 md:pb-40 bg-midnight overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/15 rounded-full
          blur-[120px] -translate-y-1/2 translate-x-1/4 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--secondary)]/8 rounded-full
          blur-[100px] translate-y-1/2 -translate-x-1/4 opacity-40" />
        <div className="absolute inset-0 bg-dots opacity-4" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 text-[var(--accent-luxury)] font-bold
            tracking-[0.5em] uppercase text-[9px] mb-10 py-2.5 px-6 rounded-full
            border border-[var(--accent-luxury)]/25 bg-[var(--accent-luxury)]/8 backdrop-blur-md">
            Archive Immobilière de Prestige
          </span>

          <h1 className="font-display text-6xl md:text-[10rem] font-black text-off-white mb-8
            tracking-[-0.03em] leading-[0.88] uppercase">
            L&apos;Art de<br />Vivre.
          </h1>

          <p className="text-off-white/65 text-base md:text-xl font-sans max-w-xl mx-auto mb-20 leading-relaxed font-light">
            {count > 0 ? (
              <>
                Une sélection de{' '}
                <span className="text-off-white font-semibold">{count} adresses</span>
                {' '}pour les amateurs d&apos;espaces singuliers.
              </>
            ) : 'Chargement de la collection…'}
          </p>
        </motion.div>

        {/* Barre de filtres */}
        <div className={`sticky top-6 z-50 max-w-4xl mx-auto transition-all duration-500
          ${scrolled ? 'scale-[0.97]' : 'scale-100'}`}>
          <div className="bg-midnight-muted/85 backdrop-blur-2xl border border-off-white/10 p-1.5 rounded-full shadow-xl">
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide py-0.5 px-1"
              aria-label="Filtres de type de bien">
              {TYPE_FILTERS.map((f) => {
                const isActive = f.value === activeType
                return (
                  <a
                    key={f.value}
                    href={f.value ? `/biens?type_bien=${f.value}` : '/biens'}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      flex items-center gap-2 shrink-0 px-5 py-3 rounded-full text-[10px] font-bold
                      transition-all duration-300 uppercase tracking-[0.15em]
                      ${isActive
                        ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-md shadow-primary/25'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--text)]/5'
                      }
                    `}
                  >
                    <f.icon className={`w-3 h-3 ${isActive ? 'text-[var(--on-primary)]' : 'text-[var(--text-subtle)]'}`} aria-hidden="true" />
                    {f.label}
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
