import Link from 'next/link'
import { Grid, List as ListIcon, Compass, X, ShieldCheck, Flame, Layers } from 'lucide-react'
import * as motion from 'framer-motion/client'
import { SearchBar } from '@/components/search/SearchBar'
import { QuickFilters } from '@/components/search/QuickFilters'
import { UnifiedBienCard } from '@/components/catalogue/UnifiedBienCard'
import { UnifiedBienListCard } from '@/components/catalogue/UnifiedBienListCard'
import { Pagination } from '@/components/ui/Pagination'
import { getConsolidatedCatalogue, type ConsolidatedFilters } from '@/lib/catalogue/consolidated'
import { getDictionary } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'
export const revalidate = 60
export const metadata = {
  title: 'Catalogue complet',
  description: 'Tous les biens : vérifiés BOGBE\'S + offres flash WhatsApp en temps réel.',
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    source?: string
    commune?: string
    type_bien?: string
    prix_min?: string
    prix_max?: string
    sort?: string
    vue?: string
    page?: string
  }>
}

const PAGE_SIZE = 24

export default async function CataloguePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const t = await getDictionary()
  const vue = ['grille', 'liste'].includes(sp.vue as string) ? sp.vue : 'grille'
  const pageIdx = Math.max(0, parseInt(sp.page ?? '0', 10))

  const filters: ConsolidatedFilters = {
    source: sp.source === 'bogbes' || sp.source === 'flash' ? sp.source : null,
    commune: sp.commune?.trim() || undefined,
    type_bien: sp.type_bien?.trim() || undefined,
    q: sp.q?.trim() || undefined,
    prix_min: sp.prix_min ? Number(sp.prix_min) : undefined,
    prix_max: sp.prix_max ? Number(sp.prix_max) : undefined,
    sort: (sp.sort as ConsolidatedFilters['sort']) || 'verified_first',
    // On veut TOUS les biens (vérifiés + flash actifs) remontés — pas de plafonnement
    limitPerSource: 1000,
  }

  const { items, counts } = await getConsolidatedCatalogue(filters)
  const total = items.length
  const paginated = items.slice(pageIdx * PAGE_SIZE, (pageIdx + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentSource = filters.source ?? 'all'
  const hasFilters = !!(sp.q || sp.commune || sp.prix_min || sp.prix_max || sp.type_bien)

  return (
    <main className="bg-[var(--background)] min-h-screen pt-24 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        {/* Header — même shell que /offre-flash */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
          <div className="flex-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-[var(--accent-luxury)] opacity-75" />
                <span className="relative rounded-full w-2 h-2 bg-[var(--accent-luxury)]" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)]">
                Catalogue consolidé
              </p>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-[var(--text)] mb-4 tracking-tight">
              Trouvez votre <span className="italic font-serif text-[var(--accent-luxury)]">bien idéal</span>
            </h1>
            <SearchBar className="w-full" initialQuery={sp.q ?? ''} />
            <div className="mt-4">
              <QuickFilters />
            </div>
          </div>

          <div className="flex items-center gap-6 self-end lg:self-center">
            <div className="text-right">
              <p className="text-4xl font-display font-black text-[var(--accent-luxury)] tabular-nums leading-none">
                {total}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
                Résultats
              </p>
            </div>
            <div className="h-10 w-px bg-[var(--border)]" />
            <div className="flex gap-1 p-1 bg-[var(--midnight-muted)]/50 backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-inner">
              <ViewToggle active={vue === 'grille'} href={buildHref(sp, { vue: 'grille' })} icon={Grid} label="Grille" />
              <ViewToggle active={vue === 'liste'} href={buildHref(sp, { vue: 'liste' })} icon={ListIcon} label="Liste" />
            </div>
          </div>
        </div>

        {/* Onglets source : Tout / Vérifiés / Flash */}
        <div className="flex gap-2 flex-wrap mb-8">
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
        </div>

        {/* Grille ou Liste — selon ?vue= */}
        {paginated.length === 0 ? (
          <EmptyResults hasFilters={hasFilters} t={t} />
        ) : vue === 'liste' ? (
          <div className="flex flex-col gap-3">
            {paginated.map((b, i) => (
              <UnifiedBienListCard key={b.id} bien={b} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {paginated.map((b, i) => (
              <UnifiedBienCard key={b.id} bien={b} index={i} />
            ))}
          </div>
        )}

        {/* Pagination ellipsis-aware */}
        <Pagination
          pageIdx={pageIdx}
          totalPages={totalPages}
          buildHref={(p) => buildHref(sp, { page: String(p) })}
        />
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
          ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)] shadow-md'
          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
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
  color: 'luxury' | 'blue' | 'orange'
  icon: React.ComponentType<{ className?: string }>
  label: string
  count: number
}

function SourceTab({ href, active, color, icon: Icon, label, count }: SourceTabProps) {
  const activeColors = {
    luxury: 'bg-[var(--accent-luxury)] text-[var(--on-accent)] border-[var(--accent-luxury)] shadow-md',
    blue: 'bg-blue-500 text-white border-blue-500 shadow-md',
    orange: 'bg-orange-500 text-white border-orange-500 shadow-md',
  }
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
        active
          ? activeColors[color]
          : 'bg-white/5 text-[var(--text-muted)] border-[var(--border)] hover:bg-white/10 hover:text-[var(--text)]'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
      <span className="opacity-60 ml-1">({count})</span>
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
      <div className="w-20 h-20 bg-[var(--accent-luxury)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
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
