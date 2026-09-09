import Link from 'next/link'
import { CatalogueMapView } from '@/components/catalogue/CatalogueMapLoader'
import { Grid, List as ListIcon, Compass, X, ShieldCheck, Flame, Layers, Globe, Map as MapIcon } from 'lucide-react'
import * as motion from 'framer-motion/client'
import { SearchBar } from '@/components/search/SearchBar'
import { QuickFilters } from '@/components/search/QuickFilters'
import { UnifiedBienCard } from '@/components/catalogue/UnifiedBienCard'
import { UnifiedBienListCard } from '@/components/catalogue/UnifiedBienListCard'
import { Pagination } from '@/components/ui/Pagination'
import { getConsolidatedCatalogue, getLocauxPagedItems, getLocauxCount, getAnnoncesPagedItems, getAnnoncesCountStatus, getCatalogueCommunes, type ConsolidatedFilters } from '@/lib/catalogue/consolidated'
import { getViewCounts7d } from '@/lib/analytics/view-counts'
import { getDictionary } from '@/lib/i18n/server'
import { formatCount } from '@/lib/format'

// Map view (Mapbox, client-only) chargée via un module client dédié :
// Next 15 interdit `ssr: false` avec next/dynamic dans un Server Component.
// Voir components/catalogue/CatalogueMapLoader.tsx.

export const dynamic = 'force-dynamic'
export const metadata = {
  title: "Catalogue immobilier complet à Abidjan — 9000+ biens",
  description: "Trouvez votre bien à Abidjan : villas, appartements, studios et résidences meublées à Cocody, Plateau, Marcory, Yopougon. Catalogue vérifié BOGBE'S + offres flash WhatsApp en temps réel.",
  keywords: ['immobilier abidjan', 'location appartement abidjan', 'villa cocody', 'achat bien côte d\'ivoire', 'studio meublé abidjan', 'catalogue immobilier ci'],
  alternates: { canonical: '/catalogue' },
  openGraph: {
    title: "Catalogue immobilier complet à Abidjan — BOGBE'S GROUPE",
    description: "Villas, appartements, studios et résidences meublées dans toutes les communes d'Abidjan. Vérifiés + offres flash en temps réel.",
    type: 'website',
  },
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    source?: string
    commune?: string
    type_bien?: string
    type_offre?: string
    prix_min?: string
    prix_max?: string
    /** Équipements en CSV (ex: "piscine,parking,climatisation") */
    equipements?: string
    sort?: string
    vue?: string
    page?: string
  }>
}

const PAGE_SIZE = 24

export default async function CataloguePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const t = await getDictionary()
  const vue = ['grille', 'liste', 'carte'].includes(sp.vue as string) ? sp.vue : 'grille'
  const pageIdx = Math.max(0, parseInt(sp.page ?? '0', 10))

  const typeOffre =
    sp.type_offre === 'vente' || sp.type_offre === 'location' ? sp.type_offre : undefined

  // Équipements en CSV → array (filtre "contains" sur les biens BOGBE'S,
  // texte libre matché sur les caractéristiques des offres flash)
  const equipementsArr = sp.equipements
    ?.split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const sourceFilter =
    sp.source === 'bogbes' || sp.source === 'flash' || sp.source === 'web' ? sp.source : null
  const filters: ConsolidatedFilters = {
    source: sourceFilter,
    commune: sp.commune?.trim() || undefined,
    type_bien: sp.type_bien?.trim() || undefined,
    type_offre: typeOffre,
    q: sp.q?.trim() || undefined,
    equipements: equipementsArr && equipementsArr.length > 0 ? equipementsArr : undefined,
    prix_min: sp.prix_min ? Number(sp.prix_min) : undefined,
    prix_max: sp.prix_max ? Number(sp.prix_max) : undefined,
    sort: (sp.sort as ConsolidatedFilters['sort']) || 'verified_first',
  }

  // Vue "flash only" : pagination serveur directe (tous les biens, sans cap mémoire).
  // Vue "bogbes" ou "all" : consolidation en mémoire (peu de biens vérifiés, tolérable).
  let items: Awaited<ReturnType<typeof getConsolidatedCatalogue>>['items'] = []
  let counts = { bogbes: 0, flash: 0, web: 0, total: 0 }
  let total = 0        // pour la pagination (items chargés)
  let displayTotal = 0 // pour le compteur affiché (vrai total DB)
  let sourceUnavailable = false
  let paginated: typeof items = []
  let totalPages = 0

  if (sourceFilter === 'flash') {
    const [{ items: flashItems, total: flashTotal }, communes_] = await Promise.all([
      getLocauxPagedItems(filters, pageIdx, PAGE_SIZE),
      getCatalogueCommunes('flash'),
    ])
    items = flashItems
    paginated = flashItems
    total = flashTotal
    displayTotal = flashTotal
    totalPages = Math.ceil(flashTotal / PAGE_SIZE)
    counts = { bogbes: 0, flash: flashTotal, web: 0, total: flashTotal }
    var communes = communes_
  } else if (sourceFilter === 'web') {
    const [{ items: webItems, total: webTotal, unavailable }, communes_] = await Promise.all([
      getAnnoncesPagedItems(filters, pageIdx, PAGE_SIZE),
      getCatalogueCommunes('web'),
    ])
    items = webItems
    paginated = webItems
    total = webTotal
    displayTotal = webTotal
    totalPages = Math.ceil(webTotal / PAGE_SIZE)
    counts = { bogbes: 0, flash: 0, web: webTotal, total: webTotal }
    sourceUnavailable = unavailable
    var communes = communes_
  } else {
    const [catalogue, communes_, flashTotal, webStatus] = await Promise.all([
      getConsolidatedCatalogue({ ...filters, limitPerSource: 500 }),
      getCatalogueCommunes(sourceFilter),
      getLocauxCount(filters),
      getAnnoncesCountStatus(filters),
    ])
    const webTotal = webStatus.count
    sourceUnavailable = webStatus.unavailable
    items = catalogue.items
    counts = {
      bogbes: catalogue.counts.bogbes,
      flash: flashTotal,
      web: webTotal,
      total: catalogue.counts.bogbes + flashTotal + webTotal,
    }
    total = catalogue.items.length
    displayTotal = counts.total
    paginated = catalogue.items.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE)
    totalPages = Math.ceil(total / PAGE_SIZE)
    var communes = communes_
  }

  // Preuve sociale RÉELLE : vues 7j des biens BOGBE'S visibles (1 requête sur la
  // page courante, ≤ 24 ids — jamais N appels). Flash exclu (pas de tracking vue_bien).
  const bogbesIds = paginated.filter(b => b.source === 'bogbes').map(b => b.sourceId)
  if (bogbesIds.length > 0) {
    const viewCounts = await getViewCounts7d(bogbesIds)
    paginated = paginated.map(b =>
      b.source === 'bogbes' ? { ...b, vues_7j: viewCounts[b.sourceId] ?? 0 } : b,
    )
  }

  const currentSource = sourceFilter ?? 'all'
  const hasFilters = !!(sp.q || sp.commune || sp.prix_min || sp.prix_max || sp.type_bien)

  return (
    <main className="bg-[var(--background)] min-h-screen pt-6 sm:pt-10 lg:pt-16 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        {/* Header — titre + recherche à gauche, compteur + vue à droite */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 mb-4 lg:mb-6">
          <div className="flex-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-[var(--accent-luxury)] opacity-75" />
                <span className="relative rounded-full w-2 h-2 bg-[var(--accent-luxury)]" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)]">
                Catalogue consolidé
              </p>
            </div>
            <h1 className="font-display text-2xl md:text-5xl font-bold text-[var(--text)] mb-3 lg:mb-4 tracking-tight">
              Trouvez votre <span className="italic font-serif text-[var(--accent-luxury)]">bien idéal</span>
            </h1>
            <SearchBar className="w-full" initialQuery={sp.q ?? ''} />
          </div>

          <div className="flex items-center gap-6 self-end lg:self-center">
            <div className="text-right">
              <p className="text-4xl font-display font-black text-[var(--accent-luxury)] tabular-nums leading-none">
                {formatCount(displayTotal)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
                Résultats
              </p>
            </div>
            <div className="h-10 w-px bg-[var(--border)]" />
            {/* Desktop : 3 toggles (Grille / Liste / Carte) */}
            <div className="hidden lg:flex gap-1 p-1 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)]">
              <ViewToggle active={vue === 'grille'} href={buildHref(sp, { vue: '' })} icon={Grid} label="Grille" />
              <ViewToggle active={vue === 'liste'} href={buildHref(sp, { vue: 'liste' })} icon={ListIcon} label="Liste" />
              <ViewToggle active={vue === 'carte'} href={buildHref(sp, { vue: 'carte' })} icon={MapIcon} label="Carte" />
            </div>
            {/* Mobile : 2 toggles (Liste / Carte) — Grille est masquée car son rendu mobile
                est identique à Liste (1 colonne horizontale). On affiche Liste comme défaut. */}
            <div className="flex lg:hidden gap-1 p-1 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)]">
              <ViewToggle
                active={vue !== 'carte'}
                href={buildHref(sp, { vue: '' })}
                icon={ListIcon}
                label="Liste"
              />
              <ViewToggle active={vue === 'carte'} href={buildHref(sp, { vue: 'carte' })} icon={MapIcon} label="Carte" />
            </div>
          </div>
        </div>

        {/* Onglets source : placés avant les filtres pour rester visibles immédiatement */}
        <div className="sticky top-16 z-30 -mx-4 px-4 py-2 mb-8 flex gap-2 flex-wrap bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)] sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0">
          <SourceTab
            href={buildHref(sp, { source: '' })}
            active={currentSource === 'all'}
            color="luxury"
            icon={Layers}
            label={t.catalogue.allSources}
            count={counts.total}
          />
          <SourceTab
            href={buildHref(sp, { source: 'bogbes' })}
            active={currentSource === 'bogbes'}
            color="blue"
            icon={ShieldCheck}
            label={t.catalogue.verified}
            count={counts.bogbes}
          />
          <SourceTab
            href={buildHref(sp, { source: 'flash' })}
            active={currentSource === 'flash'}
            color="orange"
            icon={Flame}
            label={t.flash.title}
            count={counts.flash}
          />
          <SourceTab
            href={buildHref(sp, { source: 'web' })}
            active={currentSource === 'web'}
            color="emerald"
            icon={Globe}
            label={t.catalogue.webListings}
            count={counts.web}
          />
        </div>

        {/* Filtres rapides — regroupés dans un panneau pour clarifier les choix */}
        <section aria-label="Affiner la recherche" className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/45 p-3 sm:p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text)]">Affinez votre recherche</h2>
            <span className="hidden sm:inline text-[11px] text-[var(--text-muted)]">Choisissez un ou plusieurs critères</span>
          </div>
          <QuickFilters communes={communes} />
        </section>

        {sourceUnavailable && (
          <div role="status" className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            Les annonces web sont momentanément indisponibles. Les autres sources restent consultables ; réessayez dans quelques instants.
          </div>
        )}

        {/* Grille / Liste / Carte — selon ?vue=
            Carte = exploration géographique pure (les détails sont dans le popup).
            Grille/Liste = comparaison visuelle des biens. */}
        {paginated.length === 0 && vue !== 'carte' ? (
          <EmptyResults hasFilters={hasFilters} t={t} />
        ) : vue === 'carte' ? (
          <CatalogueMapView items={items} />
        ) : vue === 'liste' ? (
          <div className="flex flex-col gap-3">
            {paginated.map((b, i) => (
              <UnifiedBienListCard key={b.id} bien={b} index={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Vue "Grille" responsive :
                - Mobile (<lg) : layout liste (1 colonne horizontale, lisible, prix mis en avant)
                - Desktop (lg+) : vraie grille 4-5 colonnes
                C'est le pattern standard immobilier mobile (Booking, Airbnb, SeLoger). */}
            <div className="flex flex-col gap-3 lg:hidden">
              {paginated.map((b, i) => (
                <UnifiedBienListCard key={`m-${b.id}`} bien={b} index={i} />
              ))}
            </div>
            <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginated.map((b, i) => (
                <UnifiedBienCard key={`d-${b.id}`} bien={b} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Pagination — masquée en vue carte (la carte montre TOUS les biens) */}
        {vue !== 'carte' && (
          <Pagination
            pageIdx={pageIdx}
            totalPages={totalPages}
            buildHref={(p) => buildHref(sp, { page: String(p) })}
          />
        )}
      </div>
    </main>
  )
}

function buildHref(currentSp: Record<string, string | undefined>, overrides: Record<string, string>): string {
  const params = new URLSearchParams()
  Object.entries(currentSp).forEach(([k, v]) => {
    if (v) params.set(k, v)
  })
  Object.entries(overrides).forEach(([k, v]) => {
    if (v) params.set(k, v)
    else params.delete(k)
  })
  return `/catalogue${params.toString() ? `?${params.toString()}` : ''}`
}

function ViewToggle({ active, href, icon: Icon, label }: { active: boolean; href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
        active
          ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)] shadow-sm'
          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}

interface SourceTabProps {
  href: string
  active: boolean
  color: 'luxury' | 'blue' | 'orange' | 'emerald'
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
}

function SourceTab({ href, active, color, icon: Icon, label, count }: SourceTabProps) {
  // One active color keeps the tabs scannable. The icon and label carry the
  // meaning of each source; color is reserved for the selected state.
  const activeColors = {
    luxury: 'bg-[var(--accent-luxury)] text-[var(--on-accent)] border-[var(--accent-luxury)] shadow-sm',
    blue: 'bg-[var(--accent-luxury)] text-[var(--on-accent)] border-[var(--accent-luxury)] shadow-sm',
    orange: 'bg-[var(--accent-luxury)] text-[var(--on-accent)] border-[var(--accent-luxury)] shadow-sm',
    emerald: 'bg-[var(--accent-luxury)] text-[var(--on-accent)] border-[var(--accent-luxury)] shadow-sm',
  }
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-md)] text-xs font-bold tracking-wide transition-all border ${
        active
          ? activeColors[color]
          : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
      <span className="opacity-60 ml-1">({formatCount(count)})</span>
    </Link>
  )
}

function PageLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-[var(--border)] text-[var(--text)] hover:bg-[var(--accent-luxury)] hover:text-[var(--on-accent)] hover:border-transparent active:scale-90 transition-all"
    >
      <span className="text-lg leading-none">{children}</span>
    </Link>
  )
}

function EmptyResults({ hasFilters, t }: { hasFilters: boolean; t: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24 bg-[var(--midnight-muted)] rounded-3xl border border-dashed border-[var(--border)] px-6"
    >
      <div className="w-20 h-20 bg-accent-luxury/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Compass className="w-8 h-8 text-[var(--accent-luxury)] animate-pulse" />
      </div>
      <h3 className="font-display text-2xl font-black text-[var(--text)] mb-3 uppercase tracking-tight">
        {t.catalogue.empty}
      </h3>
      <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto mb-8 leading-relaxed text-sm">
        Aucun bien ne correspond à vos critères actuels. Essayez d&apos;élargir votre recherche.
      </p>
      {hasFilters && (
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-luxury)] text-[var(--on-accent)] rounded-xl font-black text-[11px] uppercase tracking-wider hover:opacity-90 transition-all"
        >
          <X className="w-3.5 h-3.5" />
          {t.featured.reset}
        </Link>
      )}
    </motion.div>
  )
}
