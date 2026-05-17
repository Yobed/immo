'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import * as React from 'react'
import {
  Home, Building2, Palmtree, Warehouse, Briefcase, Landmark, Shovel,
  ArrowRight, AlertCircle, MapPin, MessageCircle, Mic, MicOff, Search, ChevronDown,
} from 'lucide-react'
import { FeaturedCard } from '@/components/bien/FeaturedCard'
import type { LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchAlert } from '@/components/search/SearchAlert'
import { useComparator } from '@/hooks/useComparator'
import { ComparatorBar } from '@/components/bien/ComparatorBar'
import { ComparatorHint } from '@/components/bien/ComparatorHint'
import { useT } from '@/lib/i18n/client'
import { useVoiceSearch, parseVoiceCommand } from '@/hooks/useVoiceSearch'
import { formatFCFA } from '@/lib/format'

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
  const tx            = useT()
  const typeFromUrl   = searchParams.get('type_bien') ?? ''
  const communeFromUrl = searchParams.get('commune') ?? ''
  const budgetFromUrl  = searchParams.get('budget_max') ?? ''

  const [activeType, setActiveType]       = useState(typeFromUrl)
  const [biens, setBiens]                 = useState<BienRow[]>([])
  const [coverMap, setCoverMap]           = useState<Record<string, string>>({})
  const [photosMap, setPhotosMap]         = useState<Record<string, string[]>>({})
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
    if (f.offre) p.set('offre', f.offre)
    router.push(`/biens${p.toString() ? `?${p.toString()}` : ''}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript])

  // Clear hint on filter change
  useEffect(() => { setVoiceHint('') }, [typeFromUrl, communeFromUrl, budgetFromUrl])

  const getCoverMap = useCallback(async (ids: string[]): Promise<{ cover: Record<string, string>; photos: Record<string, string[]> }> => {
    if (ids.length === 0) return { cover: {}, photos: {} }
    const { data: medias } = await (supabase as any)
      .from('biens_medias')
      .select('bien_id, url, est_couverture, ordre')
      .in('bien_id', ids)
      .eq('type', 'photo')
      .order('est_couverture', { ascending: false })
      .order('ordre', { ascending: true })

    const cover: Record<string, string> = {}
    const photos: Record<string, string[]> = {}
    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
        if (!cover[m.bien_id] || m.est_couverture) cover[m.bien_id] = m.url
        if (!photos[m.bien_id]) photos[m.bien_id] = []
        if (photos[m.bien_id].length < 5) photos[m.bien_id].push(m.url)
      }
    }
    return { cover, photos }
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
            const { cover, photos } = await getCoverMap(rows.map(b => b.id))
            if (!cancelled) { setBiens(rows); setCoverMap(cover); setPhotosMap(photos); setCount(rows.length) }
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
          if (budgetFromUrl) {
            const b = parseInt(budgetFromUrl)
            if (!isNaN(b)) {
              q = q.or(`prix_mois_fcfa.lte.${b},prix_vente_fcfa.lte.${b},prix_nuit_fcfa.lte.${b}`)
            }
          }

          const { data, count: c, error: err } = await q
          if (err) throw new Error(err.message)
          const rows = (data ?? []) as BienRow[]
          const { cover, photos } = await getCoverMap(rows.map(b => b.id))
          if (!cancelled) { setBiens(rows); setCoverMap(cover); setPhotosMap(photos); setCount(c ?? 0) }
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
        activeType={typeFromUrl}
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
              <h3 className="font-display text-2xl font-bold text-off-white mb-3">{tx.biensPage.errorLoading}</h3>
              <p className="text-off-white/60 mb-8 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-off-white/10 hover:bg-off-white/20 text-off-white rounded-full font-bold transition-colors"
              >
                {tx.biensPage.retry}
              </button>
            </motion.div>
          ) : (
            <motion.div key="grid" variants={containerVariants} initial="hidden" animate="visible">
              {biens.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {/* Mobile: 1 colonne verticale */}
                  <div className="md:hidden flex flex-col gap-3">
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
                          className="flex flex-col rounded-2xl overflow-hidden bg-[var(--surface-card)] border border-white/8 active:scale-[0.98] transition-transform duration-150"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-black/20">
                            {photo ? (
                              <Image src={photo} alt={bien.titre} fill className="object-cover" sizes="100vw" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                <MapPin className="w-10 h-10 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                            <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/55 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wide text-white">
                              {bien.type_bien.replace(/_/g, ' ')}
                            </span>
                            {bien.is_verifie && (
                              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                              </span>
                            )}
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-white text-base font-bold leading-tight line-clamp-2">{bien.titre}</p>
                            </div>
                          </div>
                          <div className="px-4 py-3 flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-[var(--accent-luxury)] uppercase tracking-wide truncate">{bien.commune}</span>
                            {prix && <span className="text-sm font-bold text-[var(--accent-luxury)] shrink-0">{prix}</span>}
                          </div>
                        </Link>
                      )
                    })}
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
                            photos={photosMap[bien.id]}
                            is_verifie={bien.is_verifie}
                            score_ia={bien.score_ia}
                            url_visite_3d={bien.url_visite_3d}
                            index={i}
                            isSelected={compareIsSelected(bien.id)}
                            onSelect={compareFull && !compareIsSelected(bien.id) ? undefined : () => compareToggle({
                              id: bien.id, titre: bien.titre, commune: bien.commune,
                              type_bien: bien.type_bien,
                              prix: bien.prix_nuit_fcfa ? `${formatFCFA(bien.prix_nuit_fcfa)} / nuit`
                                : bien.prix_mois_fcfa ? `${formatFCFA(bien.prix_mois_fcfa)} / mois`
                                : bien.prix_vente_fcfa ? formatFCFA(bien.prix_vente_fcfa)
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
      {compareSelected.length === 0 && <ComparatorHint />}

      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-6 pt-4 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--background) 40%, transparent)' }}
      >
        <a
          href="https://wa.me/2250544872051?text=Bonjour%2C%20je%20cherche%20un%20bien%20%C3%A0%20Abidjan"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 bg-emerald-600 rounded-2xl shadow-2xl shadow-emerald-950/50 w-full active:scale-95 transition-transform duration-150"
        >
          <MessageCircle className="w-5 h-5 text-white shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-white leading-tight">{tx.biensPage.speakToSapphire}</p>
            <p className="text-[10px] text-white/70 leading-tight">{tx.biensPage.findIdealBien}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/60 shrink-0" />
        </a>
      </div>
    </div>
  )
}

// ─── Header ────────────────────────────────────────────────────────────────

function PageHeader({
  activeType, activeCommune, activeBudget, count, isListening, isSupported, onMic,
}: {
  activeType: string; activeCommune: string; activeBudget: string; count: number
  isListening: boolean; isSupported: boolean; onMic: () => void
}) {
  const router = useRouter()
  const tx = useT()
  const [budgetVal, setBudgetVal] = useState(activeBudget)
  const [communeVal, setCommuneVal] = useState(activeCommune)

  useEffect(() => { setBudgetVal(activeBudget) }, [activeBudget])
  useEffect(() => { setCommuneVal(activeCommune) }, [activeCommune])

  const go = useCallback((ov: Record<string, string> = {}) => {
    const p = new URLSearchParams()
    const t = ov.type !== undefined ? ov.type : activeType
    const c = ov.commune !== undefined ? ov.commune : communeVal
    const b = ov.budget !== undefined ? ov.budget : budgetVal
    if (t && t !== 'near_me') p.set('type_bien', t)
    if (c) p.set('commune', c)
    if (b) p.set('budget_max', b)
    router.push(`/biens?${p.toString()}`)
  }, [activeType, communeVal, budgetVal, router])

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
          {tx.nav.home}
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-display italic text-[var(--accent-luxury)] text-[13px] tracking-wide mb-0.5">{tx.biensPage.collection}</p>
          <h1 className="font-display font-bold text-[28px] md:text-5xl text-white tracking-tight leading-none">{tx.biensPage.abidjan}</h1>
          {count > 0 && (
            <p className="text-white/35 text-[11px] font-sans mt-2 uppercase tracking-[0.2em]">
              {(count > 1 ? tx.biensPage.available_plural : tx.biensPage.available).replace('{{count}}', String(count))}
            </p>
          )}
        </motion.div>
      </div>

      <div className="sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-7xl mx-auto px-3 py-3">
          {/* Single pill search bar — citu.ci style */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center bg-white rounded-2xl md:rounded-full shadow-xl overflow-hidden border border-slate-200">
            {/* Commune */}
            <div className="flex items-center gap-2 flex-1 px-4 md:px-6 py-3 md:py-3.5 border-b md:border-b-0 md:border-r border-slate-200">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                list="biens-communes"
                placeholder="Commune (ex. Cocody)"
                value={communeVal}
                onChange={e => setCommuneVal(e.target.value)}
                onBlur={() => { if (communeVal !== activeCommune) go({ commune: communeVal }) }}
                onKeyDown={e => e.key === 'Enter' && go()}
                className="w-full min-w-0 bg-transparent text-slate-900 placeholder-slate-400 text-sm outline-none font-medium"
              />
              <datalist id="biens-communes">
                {COMMUNES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-2 flex-1 px-4 md:px-6 py-3 md:py-3.5 border-b md:border-b-0 md:border-r border-slate-200">
              <span className="text-slate-400 text-xs font-bold shrink-0">FCFA</span>
              <input
                type="number"
                placeholder="Budget max"
                value={budgetVal}
                onChange={e => setBudgetVal(e.target.value)}
                onBlur={() => { if (budgetVal !== activeBudget) go({ budget: budgetVal }) }}
                onKeyDown={e => e.key === 'Enter' && go()}
                className="w-full min-w-0 bg-transparent text-slate-900 placeholder-slate-400 text-sm outline-none font-medium"
              />
            </div>

            {/* Type */}
            <div className="flex items-center gap-2 flex-1 px-4 md:px-6 py-3 md:py-3.5 md:border-r border-slate-200 relative border-b md:border-b-0">
              <select
                value={activeType}
                onChange={e => go({ type: e.target.value })}
                className="w-full bg-transparent text-slate-900 text-sm outline-none appearance-none cursor-pointer font-medium pr-6"
              >
                <option value="">Tous les types</option>
                {TYPE_FILTERS.filter(f => f.value && f.value !== 'near_me').map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 md:right-5 pointer-events-none" />
            </div>

            {/* Search + Mic */}
            <div className="flex items-center justify-end gap-2 px-3 py-3 md:py-2 md:pr-2">
              {isSupported && (
                <button
                  onClick={onMic}
                  aria-label={isListening ? 'Arrêter' : 'Recherche vocale'}
                  className={`shrink-0 p-2.5 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => go()}
                aria-label="Rechercher"
                className="shrink-0 flex items-center justify-center gap-2 flex-1 md:flex-none md:w-11 md:h-11 px-5 md:px-0 py-2.5 md:py-0 rounded-full bg-[var(--accent-luxury)] hover:opacity-90 text-black font-bold text-sm transition-all active:scale-95 shadow-md"
              >
                <Search className="w-4 h-4" />
                <span className="md:hidden">Rechercher</span>
              </button>
            </div>
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
          href={`https://wa.me/2250544872051?text=${encodeURIComponent("Bonjour, je cherche un bien qui ne figure pas encore dans votre catalogue. Pouvez-vous m'aider ?")}`}
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
