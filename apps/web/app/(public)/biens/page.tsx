'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import * as React from 'react'
import { Home, Building2, Palmtree, Warehouse, Briefcase, Landmark, Shovel, ArrowRight, Filter, AlertCircle, MapPin, MessageCircle } from 'lucide-react'
import { FeaturedCard } from '@/components/bien/FeaturedCard'
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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#020617]">
      <PageHeader activeType={activeType} count={count} />

      <main className="max-w-7xl mx-auto px-3 pt-4 pb-28 lg:pb-16" aria-live="polite" aria-busy={loading}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-5"
              role="status" aria-label="Chargement des biens"
            >
              <div className="col-span-2 aspect-video bg-off-white/5 animate-pulse rounded-2xl" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-off-white/5 animate-pulse rounded-xl" />
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
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-5">
                  {biens.map((bien, i) => {
                    const photo = coverMap[bien.id] ?? null
                    if (i === 0) {
                      return (
                        <FeaturedCard
                          key={bien.id}
                          id={bien.id}
                          titre={bien.titre}
                          commune={bien.commune}
                          quartier={bien.quartier}
                          type_bien={bien.type_bien}
                          prix_mois_fcfa={bien.prix_nuit_fcfa ? null : bien.prix_mois_fcfa}
                          prix_nuit_fcfa={bien.prix_nuit_fcfa}
                          prix_vente_fcfa={bien.prix_vente_fcfa}
                          photo_url={photo}
                          is_verifie={bien.is_verifie}
                        />
                      )
                    }
                    return (
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
                          photo_url={photo}
                          is_verifie={bien.is_verifie}
                          score_ia={bien.score_ia}
                          url_visite_3d={bien.url_visite_3d}
                          index={i}
                        />
                        {currentUserId === bien.proprietaire_id && (
                          <div className="absolute top-2 left-2 z-20">
                            <Link
                              href={`/mes-biens/${bien.id}/modifier`}
                              className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg text-[9px] font-bold uppercase tracking-wider border border-white/20"
                            >
                              Modifier
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* CTA WhatsApp flottant — mobile uniquement */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-6 pt-4 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--background) 40%, transparent)' }}
      >
        <a
          href="https://wa.me/2250574243752?text=Bonjour%2C%20je%20cherche%20un%20bien%20%C3%A0%20Abidjan"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 bg-emerald-600 rounded-2xl shadow-2xl shadow-emerald-950/50 w-full active:scale-95 transition-transform duration-150"
        >
          <MessageCircle className="w-5 h-5 text-white shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-white leading-tight">Parler à Sapphire</p>
            <p className="text-[10px] text-white/70 leading-tight">Trouvez votre bien idéal</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/60 shrink-0" />
        </a>
      </div>
    </div>
  )
}


const COLLECTION_LABELS: Record<string, string> = {
  '': 'Abidjan',
  'appartement': 'Appartements',
  'villa': 'Villas de Luxe',
  'studio': 'Studios',
  'residence_meublee': 'Résidences',
  'maison': 'Maisons',
  'bureau': 'Bureaux',
  'terrain': 'Terrains',
  'near_me': 'Autour de moi',
}

function PageHeader({ activeType, count }: { activeType: string; count: number }) {
  const collectionTitle = COLLECTION_LABELS[activeType] ?? 'Abidjan'

  return (
    <header className="relative bg-[#020617] overflow-hidden" data-theme="dark">
      {/* Glow décoratif haut-gauche — identique landing */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(65% 0.18 45 / 0.13) 0%, transparent 65%)' }}
      />

      {/* Titre éditorial */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10 pb-4 md:pt-20 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-display italic text-[var(--accent-luxury)] text-[13px] tracking-wide mb-0.5">
            La Collection
          </p>
          <h1 className="font-display font-bold text-[28px] md:text-5xl text-white tracking-tight leading-none">
            {collectionTitle}
          </h1>
          {count > 0 && (
            <p className="text-white/35 text-[11px] font-sans mt-2 uppercase tracking-[0.2em]">
              {count} bien{count > 1 ? 's' : ''} disponible{count > 1 ? 's' : ''}
            </p>
          )}
        </motion.div>
      </div>

      {/* Filter pills — icône + label court, scroll horizontal */}
      <div className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <nav className="flex gap-1.5 overflow-x-auto scrollbar-hide" aria-label="Filtres de type de bien">
            {TYPE_FILTERS.map((f) => {
              const isActive = f.value === activeType
              const shortLabel = f.label === 'Résidences meublées' ? 'Meublés'
                : f.label === 'Villas de Luxe' ? 'Villas'
                : f.label === 'Appartements' ? 'Appt.'
                : f.label === 'Proche de moi' ? 'Proche'
                : f.label
              return (
                <a
                  key={f.value}
                  href={f.value ? `/biens?type_bien=${f.value}` : '/biens'}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 shrink-0 px-3 py-2 rounded-xl min-w-[48px] transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--accent-luxury)] text-black'
                      : 'bg-white/6 text-white/55 hover:bg-white/12 hover:text-white'
                  }`}
                >
                  <f.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-white/50'}`} aria-hidden="true" />
                  <span className="text-[8px] font-bold uppercase tracking-wide whitespace-nowrap">{shortLabel}</span>
                </a>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}

function EmptyState() {
  return (
    <div className="col-span-2 text-center py-24 px-6">
      <p className="font-display italic text-[var(--accent-luxury)] text-sm mb-1">La Collection</p>
      <h3 className="font-display text-2xl font-bold text-white mb-3 tracking-tight">
        Aucun bien pour l'instant
      </h3>
      <p className="text-white/40 font-sans text-[13px] max-w-xs mx-auto mb-8 leading-relaxed">
        Cette catégorie est en cours de curation. Découvrez nos autres collections.
      </p>
      <a
        href="/biens"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-luxury)] text-black rounded-full text-[12px] font-bold uppercase tracking-widest transition-transform active:scale-95"
      >
        Voir tout
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}
