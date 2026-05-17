'use client'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow, type BienExterne } from '@/lib/locaux/mapper'
import { formatFCFA } from '@/lib/format'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Home, Building2, Palmtree, Warehouse, Briefcase, Shovel,
  Store, Flame, MapPin, MessageCircle, ArrowRight, AlertCircle,
  ChevronLeft, ChevronRight, BedDouble, Maximize, Mic, MicOff,
  ChevronDown, Search,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useVoiceSearch, parseVoiceCommand } from '@/hooks/useVoiceSearch'
import { useT } from '@/lib/i18n/client'

const PAGE_SIZE = 20

const TYPE_FILTERS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'Tous',         value: '',            icon: Flame },
  { label: 'Appartements', value: 'appartement', icon: Building2 },
  { label: 'Villas',       value: 'villa',       icon: Palmtree },
  { label: 'Studios',      value: 'studio',      icon: Warehouse },
  { label: 'Maisons',      value: 'maison',      icon: Home },
  { label: 'Bureaux',      value: 'bureau',      icon: Briefcase },
  { label: 'Terrains',     value: 'terrain',     icon: Shovel },
  { label: 'Commerce',     value: 'commerce',    icon: Store },
]

const OFFRE_FILTERS = [
  { label: 'Vente + Location', value: '' },
  { label: 'À vendre',         value: 'vente' },
  { label: 'À louer',          value: 'location' },
]

const COMMUNES = ['Cocody', 'Plateau', 'Yopougon', 'Marcory', 'Treichville', 'Adjamé', 'Abobo', 'Koumassi', 'Port-Bouët']

const BUDGET_FILTERS = [
  { label: 'Tout budget', value: '' },
  { label: '≤ 500k',      value: '500000' },
  { label: '≤ 1.5M',      value: '1500000' },
  { label: '≤ 10M',       value: '10000000' },
  { label: '≤ 50M',       value: '50000000' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function priceDisplay(b: BienExterne): string {
  if (b.prix_value == null) return b.prix_label || 'Prix sur demande'
  const formatted = formatFCFA(b.prix_value)
  if (b.prix_unit === 'fcfa_par_m2') return `${formatted} /m²`
  if (b.prix_unit === 'fcfa_par_mois') return `${formatted} /mois`
  return formatted
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (isNaN(diff)) return ''
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

export default function OffreFlashPage() {
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
      <OffreFlashContent />
    </Suspense>
  )
}

function OffreFlashContent() {
  const searchParams   = useSearchParams()
  const router         = useRouter()
  const tx             = useT()
  const activeType     = searchParams.get('type')       ?? ''
  const activeOffre    = searchParams.get('offre')      ?? ''
  const activeCommune  = searchParams.get('commune')    ?? ''
  const activeBudget   = searchParams.get('budget_max') ?? ''
  const page           = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const [biens, setBiens]   = useState<BienExterne[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [voiceHint, setVoiceHint] = useState('')

  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceSearch()

  const locauxRef = useRef(createLocauxClient())
  const locaux    = locauxRef.current

  // Voice → navigate
  useEffect(() => {
    if (!transcript) return
    const f = parseVoiceCommand(transcript)
    setVoiceHint(transcript)
    const p = new URLSearchParams()
    const t = f.type ?? activeType
    if (t) p.set('type', t)
    if (f.offre ?? activeOffre) p.set('offre', f.offre ?? activeOffre)
    if (f.commune) p.set('commune', f.commune)
    if (f.budgetMax) p.set('budget_max', f.budgetMax)
    router.push(`/offre-flash${p.toString() ? `?${p.toString()}` : ''}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript])

  // Clear hint on filter change
  useEffect(() => { setVoiceHint('') }, [activeType, activeOffre, activeCommune, activeBudget])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (locaux as any)
        .from('locaux')
        .select(
          // SECURITY: ne JAMAIS exposer telephone/telephone_bien côté client.
          // Toutes les prises de contact passent par le conseiller BOGBE'S.
          'id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,caracteristiques,publie_par,meubles,chambre,disponible,surface,groupe_whatsapp_origine,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at',
          { count: 'exact' }
        )
        .eq('status', 'active')
        .eq('is_duplicate', false)
        .order('date_publication', { ascending: false, nullsFirst: false })

      if (activeType)    q = q.ilike('type_de_bien', `%${activeType}%`)
      if (activeOffre)   q = q.ilike('type_offre', `${activeOffre}%`)
      if (activeCommune) q = q.ilike('commune', `%${activeCommune}%`)
      if (activeBudget)  q = q.lte('prix_normalise', parseInt(activeBudget))

      const from = (page - 1) * PAGE_SIZE
      q = q.range(from, from + PAGE_SIZE - 1)

      const { data: rows, count, error: err } = await q
      if (err) throw new Error(err.message)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = ((rows ?? []) as any as LocauxRow[]).map(mapLocauxRow)
      setBiens(mapped)
      setTotal(count ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [locaux, activeType, activeOffre, activeCommune, activeBudget, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const buildLink = (overrides: Record<string, string | null>) => {
    const p = new URLSearchParams()
    if (activeType)    p.set('type', activeType)
    if (activeOffre)   p.set('offre', activeOffre)
    if (activeCommune) p.set('commune', activeCommune)
    if (activeBudget)  p.set('budget_max', activeBudget)
    if (page > 1)      p.set('page', String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v == null || v === '') p.delete(k)
      else p.set(k, v)
    })
    const s = p.toString()
    return `/offre-flash${s ? `?${s}` : ''}`
  }

  const typeLabel = TYPE_FILTERS.find(f => f.value === activeType)?.label ?? 'Flash'

  return (
    <div className="min-h-screen bg-[#020617]">
      <PageHeader
        activeType={activeType}
        activeOffre={activeOffre}
        activeCommune={activeCommune}
        activeBudget={activeBudget}
        count={total}
        typeLabel={typeLabel}
        buildLink={buildLink}
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

      <main className="max-w-7xl mx-auto px-3 pt-3 pb-28 lg:pb-16" aria-live="polite" aria-busy={loading}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-5"
              role="status"
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
              <h3 className="font-display text-2xl font-bold text-off-white mb-3">{tx.flash.loadError}</h3>
              <p className="text-off-white/60 mb-8 max-w-md mx-auto">{error}</p>
              <button
                onClick={load}
                className="px-8 py-3 bg-off-white/10 hover:bg-off-white/20 text-off-white rounded-full font-bold transition-colors"
              >
                {tx.flash.retry}
              </button>
            </motion.div>
          ) : (
            <motion.div key="grid" variants={containerVariants} initial="hidden" animate="visible">
              {biens.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {/* Mobile: grille verticale 2 colonnes */}
                  <div className="md:hidden grid grid-cols-2 gap-2.5">
                    {biens.map((bien) => (
                      <Link
                        key={bien.id}
                        href={`/offre-flash/${bien.id}`}
                        className="flex flex-col rounded-2xl overflow-hidden bg-[var(--surface-card)] border border-white/8 active:scale-95 transition-transform duration-150"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-black/20">
                          {bien.image_url ? (
                            <Image src={bien.image_url} alt={bien.titre} fill className="object-cover" sizes="(max-width: 768px) 50vw, 200px" unoptimized />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                              <Flame className="w-8 h-8 text-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/55 backdrop-blur-sm text-[7px] font-bold uppercase tracking-wide text-white">
                            {bien.type_bien.replace(/_/g, ' ')}
                          </span>
                          {bien.is_recent && (
                            <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                              <Flame className="w-2.5 h-2.5 text-white" />
                            </span>
                          )}
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">{bien.titre}</p>
                          </div>
                        </div>
                        <div className="px-2.5 py-2 flex items-center justify-between gap-1">
                          <span className="text-[9px] font-black text-[var(--accent-luxury)] uppercase tracking-wide truncate">{bien.commune}</span>
                          <span className="text-[10px] font-bold text-[var(--accent-luxury)] shrink-0">{priceDisplay(bien)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Desktop: grille */}
                  <div className="hidden md:grid grid-cols-3 xl:grid-cols-4 gap-4">
                    {biens.map((bien, i) => (
                      <motion.div key={bien.id} variants={itemVariants} className={i === 0 ? 'col-span-2' : ''}>
                        <FlashCard bien={bien} featured={i === 0} index={i} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      {page > 1 && (
                        <Link href={buildLink({ page: String(page - 1) })}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white/8 border border-white/12 rounded-xl text-sm font-bold text-white/70 hover:bg-white/15 hover:text-white transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" /> Précédent
                        </Link>
                      )}
                      <span className="px-4 py-2 text-sm text-white/40 font-medium">{page} / {totalPages}</span>
                      {page < totalPages && (
                        <Link href={buildLink({ page: String(page + 1) })}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white/8 border border-white/12 rounded-xl text-sm font-bold text-white/70 hover:bg-white/15 hover:text-white transition-all"
                        >
                          Suivant <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  )}

                  <div className="mt-10 p-4 bg-orange-950/30 border border-orange-900/30 rounded-xl flex items-start gap-3 text-xs text-orange-200/60">
                    <Flame className="w-4 h-4 mt-0.5 shrink-0 text-orange-500/60" />
                    <p>
                      Annonces issues de notre réseau de groupes WhatsApp. Vérifiez l&apos;authenticité de l&apos;offre avant tout paiement. BOGBE&apos;S GROUPE ne valide pas individuellement chaque annonce flash.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-6 pt-4 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--background) 40%, transparent)' }}
      >
        <a
          href="https://wa.me/2250544872051?text=Bonjour%2C%20je%20cherche%20un%20bien%20%C3%A0%20Abidjan"
          target="_blank" rel="noopener noreferrer"
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
  activeType, activeOffre, activeCommune, activeBudget, count, typeLabel, buildLink,
  isListening, isSupported, onMic,
}: {
  activeType: string; activeOffre: string; activeCommune: string; activeBudget: string
  count: number; typeLabel: string
  buildLink: (o: Record<string, string | null>) => string
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
    const o = ov.offre !== undefined ? ov.offre : activeOffre
    if (t) p.set('type', t)
    if (c) p.set('commune', c)
    if (b) p.set('budget_max', b)
    if (o) p.set('offre', o)
    router.push(`/offre-flash?${p.toString()}`)
  }, [activeType, communeVal, budgetVal, activeOffre, router])

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
          <p className="font-display italic text-orange-400 text-[13px] tracking-wide mb-0.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> {tx.flash.pageTitle}
          </p>
          <h1 className="font-display font-bold text-[28px] md:text-5xl text-white tracking-tight leading-none">
            {typeLabel}
          </h1>
          {count > 0 && (
            <p className="text-white/35 text-[11px] font-sans mt-2 uppercase tracking-[0.2em]">
              {(count > 1 ? tx.flash.active_plural : tx.flash.active).replace('{{count}}', count.toLocaleString())}
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
                list="flash-communes"
                placeholder="Commune (ex. Cocody)"
                value={communeVal}
                onChange={e => setCommuneVal(e.target.value)}
                onBlur={() => { if (communeVal !== activeCommune) go({ commune: communeVal }) }}
                onKeyDown={e => e.key === 'Enter' && go()}
                className="w-full min-w-0 bg-transparent text-slate-900 placeholder-slate-400 text-sm outline-none font-medium"
              />
              <datalist id="flash-communes">
                {COMMUNES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* Budget */}
            <div className="flex items-center gap-2 flex-1 px-4 md:px-6 py-3 md:py-3.5 border-b md:border-b-0 md:border-r border-slate-200">
              <span className="text-slate-400 text-xs font-bold shrink-0">FCFA</span>
              <input
                type="number"
                placeholder={tx.flash.budgetMax}
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
                {TYPE_FILTERS.filter(f => f.value).map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 md:right-5 pointer-events-none" />
            </div>

            {/* Offre */}
            <div className="flex items-center gap-2 flex-1 px-4 md:px-6 py-3 md:py-3.5 md:border-r border-slate-200 relative border-b md:border-b-0">
              <select
                value={activeOffre}
                onChange={e => go({ offre: e.target.value })}
                className="w-full bg-transparent text-slate-900 text-sm outline-none appearance-none cursor-pointer font-medium pr-6"
              >
                {OFFRE_FILTERS.map(f => (
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
                className="shrink-0 flex items-center justify-center gap-2 flex-1 md:flex-none md:w-11 md:h-11 px-5 md:px-0 py-2.5 md:py-0 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all active:scale-95 shadow-md"
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

// ─── Card desktop ───────────────────────────────────────────────────────────

function FlashCard({ bien, featured, index }: { bien: BienExterne; featured: boolean; index: number }) {
  return (
    <Link
      href={`/offre-flash/${bien.id}`}
      className="group relative flex flex-col bg-[var(--surface-card)] border border-[var(--border)] rounded-[2rem] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.35)] hover:-translate-y-1 h-full"
    >
      <div className={`relative ${featured ? 'aspect-video' : 'aspect-[4/5]'} overflow-hidden bg-[var(--midnight-muted)]`}>
        {bien.image_url ? (
          <Image
            src={bien.image_url}
            alt={bien.titre}
            fill
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
            sizes={featured ? '(max-width: 1280px) 66vw, 50vw' : '(max-width: 1280px) 33vw, 25vw'}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Flame className="w-12 h-12 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-xl border border-white/12 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            {bien.type_bien.replace(/_/g, ' ')}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
            bien.type_offre === 'vente'    ? 'bg-amber-500/85 border-amber-400/30 text-white'
            : bien.type_offre === 'location' ? 'bg-blue-500/85 border-blue-400/30 text-white'
            : 'bg-white/15 border-white/20 text-white'
          }`}>
            {bien.type_offre === 'vente' ? 'Vente' : bien.type_offre === 'location' ? 'Location' : 'Offre'}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-wider text-white">
            <span className="relative flex w-1.5 h-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-orange-500" />
            </span>
            Flash
          </span>
          {bien.is_recent && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider">
              <Flame className="w-2.5 h-2.5" /> Nouveau
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col p-4 pt-3.5 flex-1">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--accent-luxury)]" strokeWidth={2.5} />
            <span className="text-xs font-black text-[var(--accent-luxury)] uppercase tracking-[0.12em] truncate">{bien.commune}</span>
          </div>
          <span className="text-base font-display font-bold text-[var(--accent-luxury)] tracking-tight shrink-0 whitespace-nowrap">
            {priceDisplay(bien)}
          </span>
        </div>

        <h3 className={`font-display ${featured ? 'text-[18px]' : 'text-[15px]'} font-bold text-[var(--text)] tracking-tight leading-[1.3] line-clamp-2 mb-3`}>
          {bien.titre}
        </h3>

        {(bien.nb_chambres || bien.surface_m2) ? (
          <div className="flex items-center gap-4 mb-3">
            {bien.nb_chambres && bien.nb_chambres > 0 && (
              <div className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-bold text-[var(--text)]">{bien.nb_chambres} ch.</span>
              </div>
            )}
            {bien.surface_m2 && (
              <div className="flex items-center gap-1.5">
                <Maximize className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-bold text-[var(--text)]">{bien.surface_m2.toLocaleString('fr-FR')} m²</span>
              </div>
            )}
            {bien.meuble && (
              <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded text-[9px] font-black uppercase tracking-wider border border-blue-500/20">
                Meublé
              </span>
            )}
          </div>
        ) : null}

        <p className="mt-auto text-[10px] text-white/30 font-medium">{relativeTime(bien.date_publication)}</p>
      </div>
    </Link>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  const tx = useT()
  const suggestions = [
    { label: tx.flash.all, href: '/offre-flash',                 desc: '' },
    { label: tx.filters.villas, href: '/offre-flash?type=villa',      desc: '' },
    { label: tx.filters.appartements, href: '/offre-flash?type=appartement', desc: '' },
    { label: tx.filters.lands, href: '/offre-flash?type=terrain',    desc: '' },
  ]
  return (
    <div className="col-span-2 lg:col-span-4 py-20 px-6">
      <div className="max-w-md mx-auto text-center mb-10">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">{tx.flash.noCategoryResults}</h3>
        <p className="text-white/40 text-[13px] leading-relaxed">Voici d&apos;autres sélections qui pourraient vous intéresser.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
        {suggestions.map((s) => (
          <a key={s.href} href={s.href}
            className="flex flex-col gap-1 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-white/8 transition-all text-center active:scale-95"
          >
            <span className="text-white font-bold text-[12px]">{s.label}</span>
            <span className="text-white/40 text-[10px]">{s.desc}</span>
          </a>
        ))}
      </div>
      <div className="text-center">
        <a
          href={`https://wa.me/2250544872051?text=${encodeURIComponent("Bonjour, je cherche un bien qui ne figure pas dans vos offres flash. Pouvez-vous m'aider ?")}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-[12px] font-bold uppercase tracking-widest transition-all active:scale-95"
        >
          <ArrowRight className="w-3.5 h-3.5" /> Demander via WhatsApp
        </a>
        <p className="text-white/25 text-[10px] mt-3">{tx.flash.noVerifiedOffer}</p>
      </div>
    </div>
  )
}
