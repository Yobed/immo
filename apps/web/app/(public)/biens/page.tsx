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
  { label: 'Villas de Luxe', value: 'villa', icon: Palmtree },
  { label: 'Studios',      value: 'studio', icon: Warehouse },
  { label: 'Hôtels & Résidences', value: 'residence_meublee', icon: Landmark },
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
    <div className="min-h-screen bg-midnight">
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
                <div key={i} className="aspect-[3/4] bg-gray-100/50 animate-pulse rounded-[1.5rem]" />
              ))}
            </motion.div>
          ) : activeType ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-luxury)] shadow-[0_0_8px_var(--accent-luxury)]" />
                    <span className="text-[var(--accent-luxury)] font-bold tracking-[0.3em] uppercase text-[9px]">💎 Sélection Curatée</span>
                  </div>
                  <h2 className="font-display text-5xl md:text-8xl font-black text-white tracking-tight leading-none">
                    {activeLabel}
                  </h2>
                </div>
                <div className="text-right border-l border-white/10 pl-8">
                  <p className="text-white/50 font-sans text-[10px] uppercase tracking-[0.2em] mb-2">Disponibilité</p>
                  <p className="text-white font-display text-5xl font-bold">{count}</p>
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
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-luxury)]/5 flex items-center justify-center text-[var(--accent-luxury)] border border-[var(--accent-luxury)]/10">
                          <row.icon className="w-6 h-6" />
                        </div>
                        <span className="text-[var(--accent-luxury)] font-bold tracking-[0.3em] uppercase text-[9px]">✨ La Collection ImmoDash</span>
                      </div>
                      <h2 className="font-display text-4xl md:text-8xl font-black text-white tracking-[0.02em] leading-[0.9] mb-6">
                        {row.label}
                      </h2>
                      <div className="h-1 w-32 bg-secondary/50 rounded-full" />
                    </div>
                    
                    <a 
                      href={`/biens?type_bien=${row.value}`}
                      className="group/link inline-flex items-center gap-6 px-10 py-5 bg-[#050510] hover:bg-primary transition-all duration-700 rounded-2xl text-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-primary/30"
                    >
                      <div className="flex flex-col items-start mr-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-50 mb-1">Explorer</span>
                        <span className="text-sm font-bold whitespace-nowrap">{row.label}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 group-hover/link:bg-white/20 flex items-center justify-center transition-colors">
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
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-3 text-[var(--accent-luxury)] font-bold tracking-[0.5em] uppercase text-[9px] mb-12 py-3 px-8 rounded-full border border-[var(--accent-luxury)]/30 bg-[var(--accent-luxury)]/10 backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            🏛️ Archive Immobilière de Prestige
          </span>
          <h1 className="font-display text-7xl md:text-[13rem] font-black text-white mb-12 tracking-[-0.04em] leading-[0.85] uppercase">
            L&apos;Art de <br />
            Vivre.
          </h1>
          <p className="text-white/70 text-lg md:text-2xl font-sans max-w-2xl mx-auto mb-24 leading-relaxed px-4 font-light tracking-wide">
            Immersion dans une sélection de <span className="text-white font-medium">{count} adresses rares</span>, 
            extraites pour les collectionneurs d&apos;espaces singuliers.
          </p>
        </motion.div>

        {/* Dynamic Navigation Bar */}
        <motion.div 
          className={`
            sticky top-8 z-50 max-w-5xl mx-auto transition-all duration-700
            ${scrolled ? 'scale-[0.98] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]' : 'scale-100 shadow-xl'}
          `}
        >
          <div className="bg-[#050510]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <nav className="flex gap-1 overflow-x-auto no-scrollbar py-1 px-1" aria-label="Filtres de propriétés">
              {TYPE_FILTERS.map((f) => {
                const isActive = f.value === activeType
                return (
                  <a
                    key={f.value}
                    href={f.value ? `/biens?type_bien=${f.value}` : '/biens'}
                    aria-current={isActive ? 'page' : undefined}
                    className={`
                      flex items-center gap-3 flex-shrink-0 px-8 py-4 rounded-full text-[10px] font-bold transition-all duration-500
                      ${isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-white/80 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <f.icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-primary'}`} />
                    <span className="uppercase tracking-[0.2em]">{f.label}</span>
                  </a>
                )
              })}
            </nav>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-56 px-8 rounded-[3rem] bg-white/[0.02] border border-white/10">
      <div className="w-24 h-24 bg-white/5 rounded-3xl mx-auto flex items-center justify-center shadow-sm border border-white/10 mb-12">
        <Filter className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="font-display text-5xl font-black text-white mb-8 tracking-tighter">Épure Absolue</h3>
      <p className="text-white/80 font-sans text-xl max-w-lg mx-auto mb-16 font-light leading-relaxed">
        &ldquo;La rareté définit l&apos;exception.&rdquo;<br />
        Cette collection est en cours de curation. Explorez nos autres archives ou contactez votre agent dédié.
      </p>
      <a 
        href="/biens" 
        className="inline-flex items-center gap-6 px-12 py-6 bg-[#050510] text-white rounded-full font-bold hover:bg-primary transition-all duration-500 shadow-2xl hover:shadow-primary/20"
      >
        Réinitialiser l&apos;Expérience
        <ArrowRight className="w-5 h-5" />
      </a>
    </div>
  )
}
