'use client'
import { createClient } from '@/lib/supabase/client'
import { BienCard } from '@/components/bien/BienCard'
import { CardsCarousel } from '@/components/ui/CardsCarousel'
import * as React from 'react'
import { LucideIcon, Home, Building2, Palmtree, Warehouse, Briefcase, Landmark, Shovel, Sparkles, ArrowRight, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const TYPE_FILTERS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'Tous', value: '', icon: Home },
  { label: 'Appartements', value: 'appartement', icon: Building2 },
  { label: 'Villas',       value: 'villa', icon: Palmtree },
  { label: 'Studios',      value: 'studio', icon: Warehouse },
  { label: 'Résidences meublées', value: 'residence_meublee', icon: Landmark },
  { label: 'Maisons',      value: 'maison', icon: Home },
  { label: 'Bureaux',      value: 'bureau', icon: Briefcase },
  { label: 'Terrains',     value: 'terrain', icon: Shovel },
]

type BienRow = {
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
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
  }
}

export default function BiensListePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ type_bien?: string }>
}) {
  const [activeType, setActiveType] = useState<string>('')
  const [biens, setBiens] = useState<BienRow[]>([])
  const [typeResults, setTypeResults] = useState<any[]>([])
  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const params = await searchParamsPromise
      const type = params.type_bien ?? ''
      setActiveType(type)
      setLoading(true)

      if (type) {
        // Mode Filtre Actif
        const { data, count: c } = await supabase
          .from('biens')
          .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces', { count: 'exact' })
          .eq('statut', 'publie')
          .eq('type_bien', type)
          .order('created_at', { ascending: false })
          .limit(24)

        const rows = (data ?? []) as BienRow[]
        const cMap = await getCoverMap(supabase, rows.map(b => b.id))
        setBiens(rows)
        setCoverMap(cMap)
        setCount(c ?? 0)
      } else {
        // Mode Magazine
        const results = await Promise.all(
          TYPE_FILTERS.filter(f => f.value !== '').map(async (f) => {
            const { data } = await supabase
              .from('biens')
              .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces')
              .eq('statut', 'publie')
              .eq('type_bien', f.value)
              .order('created_at', { ascending: false })
              .limit(8)
            return { ...f, biens: (data ?? []) as BienRow[] }
          })
        )
        const allIds = results.flatMap(r => r.biens.map(b => b.id))
        const cMap = await getCoverMap(supabase, allIds)
        setTypeResults(results)
        setCoverMap(cMap)
        setCount(allIds.length)
      }
      setLoading(false)
    }
    loadData()
  }, [searchParamsPromise, supabase])

  const activeLabel = TYPE_FILTERS.find(f => f.value === activeType)?.label ?? activeType

  return (
    <div className="min-h-screen bg-white">
      <PageHeader activeType={activeType} count={count} />
      
      <main className="max-w-7xl mx-auto px-4 py-20">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse rounded-[2rem]" />
              ))}
            </motion.div>
          ) : activeType ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-primary font-bold tracking-[0.2em] uppercase text-[10px]">Sélection Exclusive</span>
                  </div>
                  <h2 className="font-display text-5xl md:text-6xl font-black text-gray-950 tracking-tighter">
                    {activeLabel}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 font-sans text-sm uppercase tracking-widest mb-1">Résultats trouvés</p>
                  <p className="text-gray-950 font-display text-4xl font-bold">{count}</p>
                </div>
              </div>

              {biens.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                  {biens.map((bien) => (
                    <motion.div key={bien.id} variants={itemVariants}>
                      <BienCard {...bienProps(bien, coverMap)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="magazine"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-40"
            >
              {typeResults.filter(r => r.biens.length > 0).map((row, idx) => (
                <section key={row.value} className="relative group">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                          <row.icon className="w-5 h-5" />
                        </div>
                        <span className="text-primary font-bold tracking-[0.2em] uppercase text-[10px]">La Collection</span>
                      </div>
                      <h2 className="font-display text-4xl md:text-7xl font-black text-gray-950 tracking-tighter mb-4">
                        {row.label}
                      </h2>
                      <div className="h-1.5 w-24 bg-primary/20 rounded-full" />
                    </div>
                    
                    <a 
                      href={`/biens?type_bien=${row.value}`}
                      className="group/link inline-flex items-center gap-4 px-8 py-4 bg-gray-50 hover:bg-primary transition-all duration-500 rounded-2xl border border-gray-100 hover:border-primary text-gray-950 hover:text-white"
                    >
                      <div className="flex flex-col items-start mr-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Voir tout</span>
                        <span className="text-sm font-bold whitespace-nowrap">Collection {row.label}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white group-hover/link:bg-white/20 flex items-center justify-center transition-colors">
                        <ArrowRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                      </div>
                    </a>
                  </div>

                  <CardsCarousel cardWidth={340}>
                    <div className="flex gap-10">
                      {row.biens.map((bien: any) => (
                        <div key={bien.id} className="w-[340px] lg:w-[420px] shrink-0">
                          <BienCard {...bienProps(bien, coverMap)} isExclusive={idx === 0} />
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

async function getCoverMap(supabase: any, ids: string[]) {
  if (ids.length === 0) return {}
  const { data: medias } = await supabase
    .from('biens_medias')
    .select('bien_id, url, est_couverture')
    .in('bien_id', ids)
    .eq('type', 'photo')
    .order('ordre', { ascending: true })
  
  const map: Record<string, string> = {}
  if (medias) {
    for (const m of medias) {
      if (!map[m.bien_id] || m.est_couverture) map[m.bien_id] = m.url
    }
  }
  return map
}

function bienProps(bien: BienRow, coverMap: Record<string, string>) {
  return {
    id: bien.id,
    titre: bien.titre,
    commune: bien.commune,
    quartier: bien.quartier,
    type_bien: bien.type_bien,
    prix_mois_fcfa: bien.prix_nuit_fcfa ? null : bien.prix_mois_fcfa,
    prix_nuit_fcfa: bien.prix_nuit_fcfa,
    prix_vente_fcfa: bien.prix_vente_fcfa,
    surface_m2: bien.surface_m2,
    nb_pieces: bien.nb_pieces,
    photo_url: coverMap[bien.id] ?? null,
  }
}

function PageHeader({ activeType, count }: { activeType: string; count: number }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 200)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative pt-32 pb-24 md:pt-56 md:pb-48 bg-[#0a0a0a] overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/4 animate-pulse opacity-40" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/4 opacity-30" />
        <div className="absolute inset-0 bg-dots opacity-5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 text-primary font-bold tracking-[0.4em] uppercase text-[10px] mb-8 py-2 px-6 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            Curateurs d&apos;Exceptions
          </span>
          <h1 className="font-display text-6xl md:text-[11rem] font-black text-white mb-10 tracking-tighter leading-[0.8] mix-blend-lighten">
            L&apos;Art de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary animate-gradient-x">Vivre.</span>
          </h1>
          <p className="text-white/50 text-xl font-sans max-w-3xl mx-auto mb-20 leading-relaxed px-4">
            Découvrez une sélection de <span className="text-white font-bold">{count} adresses prestigieuses</span>, 
            pensées pour ceux qui ne font aucun compromis sur l&apos;excellence.
          </p>
        </motion.div>

        {/* Dynamic Navigation Bar */}
        <motion.div 
          className={`
            sticky top-8 z-50 max-w-5xl mx-auto transition-all duration-500
            ${scrolled ? 'scale-95 shadow-2xl' : 'scale-100 shadow-xl'}
          `}
        >
          <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-2.5 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
              {TYPE_FILTERS.map((f) => {
                const isActive = f.value === activeType
                return (
                  <a
                    key={f.value}
                    href={f.value ? `/biens?type_bien=${f.value}` : '/biens'}
                    className={`
                      flex items-center gap-3 flex-shrink-0 px-8 py-4 rounded-full text-[11px] md:text-xs font-bold transition-all duration-500
                      ${isActive
                        ? 'bg-primary text-white shadow-xl shadow-primary/30'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <f.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                    <span className="uppercase tracking-widest">{f.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-40 px-4 rounded-[4rem] bg-gray-50 border-2 border-dashed border-gray-100">
      <div className="w-28 h-28 bg-white rounded-full mx-auto flex items-center justify-center shadow-2xl mb-10 group-hover:scale-110 transition-transform duration-700">
        <Filter className="w-10 h-10 text-gray-200" />
      </div>
      <h3 className="font-display text-4xl font-bold text-gray-900 mb-6 tracking-tight">Aucun résultat d&apos;exception</h3>
      <p className="text-gray-400 font-sans text-xl max-w-xl mx-auto mb-12 italic leading-relaxed">
        &ldquo;L&apos;excellence est une quête permanente.&rdquo;<br />
        Notre collection évolue chaque jour. Essayez un autre filtre ou contactez notre conciergerie.
      </p>
      <a 
        href="/biens" 
        className="inline-flex items-center gap-4 px-10 py-5 bg-gray-950 text-white rounded-full font-bold hover:bg-primary transition-all duration-300 shadow-2xl"
      >
        Réinitialiser l&apos;expérience
        <ArrowRight className="w-5 h-5" />
      </a>
    </div>
  )
}
