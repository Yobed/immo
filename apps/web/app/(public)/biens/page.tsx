'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import * as React from 'react'
import {
  Home, Building2, Palmtree, Warehouse, Briefcase, Landmark, Shovel,
  ArrowRight, AlertCircle, MapPin, MessageCircle, Mic, MicOff,
} from 'lucide-react'
import { FeaturedCard } from '@/components/bien/FeaturedCard'
import type { LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchAlert } from '@/components/search/SearchAlert'
import { useComparator } from '@/hooks/useComparator'
import { ComparatorBar } from '@/components/bien/ComparatorBar'
import { useVoiceSearch, parseVoiceCommand } from '@/hooks/useVoiceSearch'

const TYPE_FILTERS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'Proche de moi',     value: 'near_me',           icon: MapPin },
  { label: 'Tous',              value: '',                  icon: Home },
  { label: 'Appartements',      value: 'appartement',       icon: Building2 },
  { label: 'Villas de Luxe',    value: 'villa',             icon: Palmtree },
  { label: 'Studios',           value: 'studio',            icon: Warehouse },
  { label: 'Résidences meublées', value: 'residence_meublee', icon: Landmark },
  { label: 'Maisons',           value: 'maison',            icon: Home },
  { label: 'Bureaux',           value: 'bureau',            icon: Briefcase },
  { label: 'Terrains',          value: 'terrain',           icon: Shovel },
]

const COMMUNES = ['Cocody', 'Plateau', 'Yopougon', 'Marcory', 'Treichville', 'Adjamé', 'Abobo', 'Koumassi', 'Port-Bouët']

const BUDGET_FILTERS = [
  { label: 'Tout budget', value: '' },
  { label: '≤ 200k/mois', value: '200000' },
  { label: '≤ 500k/mois', value: '500000' },
  { label: '≤ 1M/mois',   value: '1000000' },
  { label: '≤ 2M/mois',   value: '2000000' },
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

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
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const typeFromUrl   = searchParams.get('type_bien') ?? ''
  const communeFromUrl = searchParams.get('commune') ?? ''
  const budgetFromUrl  = searchParams.get('budget_max') ?? ''

  const [activeType, setActiveType]       = useState(typeFromUrl)
  const [biens, setBiens]                 = useState<BienRow[]>([])
  const [coverMap, setCoverMap]           = useState<Record<string, string>>({})
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [count, setCount]                 = useState(0)
  const [userLocation, setUserLocation]   = useState<{ lat: number; lng: number } | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [voiceHint, setVoiceHint]         = useState('')

  const { selected: compareSelected, toggle: compareToggle, clear: compareClear, isSelected: compareIsSelected, isFull: compareFull } = useComparator()
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceSearch()

  const supabaseRef = useRef(createClient())
  const supabase    = supabaseRef.current

  // Voice → navigate
  useEffect(() => {
    if (!transcript) return
    const f = parseVoiceCommand(transcript)
    setVoiceHint(transcript)
    const p = new URLSearchParams()
    const t = f.type ?? typeFromUrl
    if (t) p.set('type_bien', t)
    if (f.commune) p.set('commune', f.commune)
    if (f.budgetMax) p.set('budget_max', f.budgetMax)
    router.push(`/biens${p.toString() ? `?${p.toString()}` : ''}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript])

  // Clear hint on filter change
  useEffect(() => { setVoiceHint('') }, [typeFromUrl, communeFromUrl, budgetFromUrl])

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
        if (!cancelled) setActiveType(typeFromUrl)

        if (typeFromUrl === 'near_me') {
          let loc = userLocation
          if (!loc) {
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
              })
              loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
              if (!cancelled) setUserLocation(loc)
            } catch {
              throw new Error("Impossible d'accéder à votre position. Vérifiez vos réglages navigateur.")
            }
          }
          if (loc) {
            const { data, error: err } = await (supabase as any).rpc('get_biens_proches', {
              user_lat: loc.lat, user_lng: loc.lng, radius_meters: 10000,
            })
            if (err) throw new Error(err.message)
            const rows = (data ?? []) as BienRow[]
            const cMap = await getCoverMap(rows.map(b => b.id))
            if (!cancelled) { setBiens(rows); setCoverMap(cMap); setCount(rows.length) }
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let q = (supabase as any)
            .from('biens')
            .select(
              'id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, is_verifie, score_ia, url_visite_3d, proprietaire_id',
              { count: 'exact' }
            )
            .eq('statut', 'publie')
            .order('created_at', { ascending: false })
            .limit(24)

          if (typeFromUrl)    q = q.eq('type_bien', typeFromUrl)
          if (communeFromUrl) q = q.ilike('commune', `%${communeFromUrl}%`)
          if (budgetFromUrl)  q = q.lte('prix_mois_fcfa', parseInt(budgetFromUrl))

          const { data, count: c, error: err } = await q
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
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id)
    })
    return () => { cancelled = true }
  }, [typeFromUrl, communeFromUrl, budgetFromUrl, supabase, getCoverMap, userLocation])

  return (
    <div className="min-h-screen bg-[#020617]">
      <PageHeader
        activeType={activeType}
        activeCommune={communeFromUrl}
        activeBudget={budgetFromUrl}
        count={count}
        isListening={isListening}
        isSupported={isSupported}
        onMic={isListening ? stopListening : startListening}
      />

      {/* Feedback vocal */}
      {voiceHint && (
        <div className="max-w-7xl mx-auto px-4 py-1.5">
          <p className="text-[10px] text-white/35 flex items-center gap-1.5">
            <Mic className="w-3 h-3 text-orange-400" />
            <span>Recherche vocale : &ldquo;{voiceHint}&rdquo;</span>
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-2 pb-1">
        <SearchAlert commune={communeFromUrl || undefined} typeBien={typeFromUrl || undefined} />
      </div>

      <main className="max-w-7xl mx-auto px-3 pt-3 pb-28 lg:pb-16" aria-live="polite" aria-busy={loading}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-5"
              role="status" aria-label="Chargement des biens"
            >
              <div className="col-span-2 rounded-2xl overflow-hidden">
                <div className="aspect-video bg-white/5 animate-pulse rounded-2xl" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-white/5 animate-pulse rounded-lg w-3/4" />
                  <div className="h-3 bg-white/5 animate-pulse rounded-lg w-1/2" />
                </div>
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-white/5 animate-pulse rounded-xl" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3 bg-white/5 animate-pulse rounded w-4/5" />
                    <div className="h-3 bg-white/5 animate-pulse rounded w-2/3" />
                    <div className="h-4 bg-white/5 animate-pulse rounded w-1/2" />
                  </div>
                </div>
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
                <>
                  {/* Mobile: défilement horizontal épuré */}
                  <div className="md:hidden overflow-hidden -mx-3">
                    <div className="flex gap-2.5 overflow-x-auto pb-4 px-3 no-scrollbar">
                      {biens.map((bien) => {
                        const photo = coverMap[bien.id] ?? null
                        const prix = bien.prix_nuit_fcfa
                          ? `${Math.round(bien.prix_nuit_fcfa / 1000)}k/nuit`
                          : bien.prix_mois_fcfa
                          ? `${Math.round(bien.prix_mois_fcfa / 1000)}k/mois`
                          : bien.prix_vente_fcfa
                          ? `${(bien.prix_vente_fcfa / 1000000).toFixed(0)}M`
                          : ''
                        return (
                          <Link
                            key={bien.id}
                            href={`/biens/${bien.id}`}
                            className="shrink-0 w-[148px] flex flex-col rounded-2xl overflow-hidden bg-[var(--surface-card)] border border-white/8 active:scale-95 transition-transform duration-150"
                          >
                            <div className="relative aspect-[3/4] overflow-hidden bg-black/20">
                              {photo ? (
                                <Image src={photo} alt={bien.titre} fill className="object-cover" sizes="148px" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                  <MapPin className="w-8 h-8 text-white" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-sm text-[7px] font-bold uppercase tracking-wide text-white">
                                {bien.type_bien.replace(/_/g, ' ')}
                              </span>
                              {bien.is_verifie && (
                                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                                </span>
                              )}
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">{bien.titre}</p>
                              </div>
                            </div>
                            <div className="px-2.5 py-2 flex items-center justify-between gap-1">
                              <span className="text-[9px] font-black text-[var(--accent-luxury)] uppercase tracking-wide truncate">{bien.commune}</span>
                              {prix && <span className="text-[10px] font-bold text-[var(--accent-luxury)] shrink-0">{prix}</span>}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Desktop: grille */}
                  <div className="hidden md:grid grid-cols-3 xl:grid-cols-4 gap-4">
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
                            isSelected={compareIsSelected(bien.id)}
                            onSelect={compareFull && !compareIsSelected(bien.id) ? undefined : () => compareToggle({
                              id: bien.id, titre: bien.titre, commune: bien.commune,
                              type_bien: bien.type_bien,
                              prix: bien.prix_nuit_fcfa ? `${bien.prix_nuit_fcfa.toLocaleString()} FCFA/nuit`
                                : bien.prix_mois_fcfa ? `${bien.prix_mois_fcfa.toLocaleString()} FCFA/mois`
                                : bien.prix_vente_fcfa ? `${bien.prix_vente_fcfa.toLocaleString()} FCFA`
                                : 'Prix sur demande',
                              surface_m2: bien.surface_m2, nb_pieces: bien.nb_pieces,
                              photo_url: photo ?? null, is_verifie: bien.is_verifie,
                            })}
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
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ComparatorBar
        selected={compareSelected}
        onRemove={(id) => { const b = compareSelected.find(x => x.id === id); if (b) compareToggle(b) }}
        onClear={compareClear}
      />

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

// ─── Helpers ───────────────────────────────────────────────────────────────

const COLLECTION_LABELS: Record<string, string> = {
  '': 'Abidjan', 'appartement': 'Appartements', 'villa': 'Villas de Luxe',
  'studio': 'Studios', 'residence_meublee': 'Résidences', 'maison': 'Maisons',
  'bureau': 'Bureaux', 'terrain': 'Terrains', 'near_me': 'Autour de moi',
}

function buildBiensLink(overrides: Record<string, string | null>, type: string, commune: string, budget: string) {
  const p = new URLSearchParams()
  if (type)    p.set('type_bien', type)
  if (commune) p.set('commune', commune)
  if (budget)  p.set('budget_max', budget)
  Object.entries(overrides).forEach(([k, v]) => {
    if (v == null || v === '') p.delete(k)
    else p.set(k, v)
  })
  const s = p.toString()
  return `/biens${s ? `?${s}` : ''}`
}

// ─── Header ────────────────────────────────────────────────────────────────

function PageHeader({
  activeType, activeCommune, activeBudget, count, isListening, isSupported, onMic,
}: {
  activeType: string; activeCommune: string; activeBudget: string; count: number
  isListening: boolean; isSupported: boolean; onMic: () => void
}) {
  const collectionTitle = COLLECTION_LABELS[activeType] ?? 'Abidjan'

  return (
    <header className="relative bg-[#020617] overflow-hidden" data-theme="dark">
      <div
        className="absolute -top-24 -left-24 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(65% 0.18 45 / 0.13) 0%, transparent 65%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-6 pb-4 md:pt-16 md:pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Accueil
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-display italic text-[var(--accent-luxury)] text-[13px] tracking-wide mb-0.5">La Collection</p>
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

      <div className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-7xl mx-auto px-3 py-2 space-y-1.5">

          {/* Row 1 — Type */}
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
                  href={buildBiensLink({ type_bien: f.value || null }, f.value, activeCommune, activeBudget)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 shrink-0 px-3 py-2 rounded-xl min-w-[48px] transition-all duration-200 ${
                    isActive ? 'bg-[var(--accent-luxury)] text-black' : 'bg-white/6 text-white/55 hover:bg-white/12 hover:text-white'
                  }`}
                >
                  <f.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-white/50'}`} aria-hidden="true" />
                  <span className="text-[8px] font-bold uppercase tracking-wide whitespace-nowrap">{shortLabel}</span>
                </a>
              )
            })}
          </nav>

          {/* Row 2 — Zone + Mic */}
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1">
              <a
                href={buildBiensLink({ commune: null }, activeType, '', activeBudget)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all duration-200 ${
                  !activeCommune ? 'bg-white/15 text-white border border-white/20' : 'bg-white/5 text-white/40 hover:text-white/70'
                }`}
              >
                Tout CI
              </a>
              {COMMUNES.map((c) => {
                const isActive = activeCommune === c
                return (
                  <a
                    key={c}
                    href={buildBiensLink({ commune: c }, activeType, c, activeBudget)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all duration-200 whitespace-nowrap ${
                      isActive ? 'bg-white/15 text-white border border-white/20' : 'bg-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {c}
                  </a>
                )
              })}
            </div>

            {/* Mic */}
            {isSupported && (
              <button
                onClick={onMic}
                aria-label={isListening ? 'Arrêter la recherche vocale' : 'Recherche vocale'}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all duration-200 border ${
                  isListening
                    ? 'bg-red-500 border-red-400 text-white animate-pulse'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/12 hover:text-white'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isListening ? 'Écoute…' : 'Vocal'}</span>
              </button>
            )}
          </div>

          {/* Row 3 — Budget */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {BUDGET_FILTERS.map((b) => {
              const isActive = b.value === activeBudget
              return (
                <a
                  key={b.value}
                  href={buildBiensLink({ budget_max: b.value || null }, activeType, activeCommune, b.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all duration-200 whitespace-nowrap ${
                    isActive ? 'bg-white/15 text-white border border-white/20' : 'bg-white/5 text-white/40 hover:text-white/70'
                  }`}
                >
                  {b.label}
                </a>
              )
            })}
          </div>

        </div>
      </div>
    </header>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyState() {
  const suggestions = [
    { label: 'Toutes les annonces',  href: '/biens',                           desc: 'Explorer tout le catalogue' },
    { label: 'Résidences meublées',  href: '/biens?type_bien=residence_meublee', desc: 'Court et moyen séjour' },
    { label: 'Appartements',         href: '/biens?type_bien=appartement',      desc: 'Locations longue durée' },
    { label: 'Villas',               href: '/biens?type_bien=villa',            desc: 'Haut standing et prestige' },
  ]

  return (
    <div className="col-span-2 lg:col-span-4 py-20 px-6">
      <div className="max-w-md mx-auto text-center mb-10">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">Aucun bien dans cette catégorie</h3>
        <p className="text-white/40 text-[13px] leading-relaxed">
          Pas de panique — voici d&apos;autres sélections qui pourraient vous intéresser.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
        {suggestions.map((s) => (
          <a key={s.href} href={s.href}
            className="flex flex-col gap-1 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--accent-luxury)]/40 hover:bg-white/8 transition-all text-center active:scale-95"
          >
            <span className="text-white font-bold text-[12px]">{s.label}</span>
            <span className="text-white/40 text-[10px]">{s.desc}</span>
          </a>
        ))}
      </div>
      <div className="text-center">
        <a
          href={`https://wa.me/2250574243752?text=${encodeURIComponent("Bonjour, je cherche un bien qui ne figure pas encore dans votre catalogue. Pouvez-vous m'aider ?")}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[12px] font-bold uppercase tracking-widest transition-all active:scale-95"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Demander via WhatsApp
        </a>
        <p className="text-white/25 text-[10px] mt-3">Notre équipe peut trouver le bien idéal pour vous</p>
      </div>
    </div>
  )
}
