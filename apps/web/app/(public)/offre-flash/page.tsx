import Link from 'next/link'
import { Grid, List as ListIcon, Compass, X } from 'lucide-react'
import * as motion from 'framer-motion/client'
import { SearchBar } from '@/components/search/SearchBar'
import { QuickFilters } from '@/components/search/QuickFilters'
import { UnifiedBienCard } from '@/components/catalogue/UnifiedBienCard'
import { UnifiedBienListCard } from '@/components/catalogue/UnifiedBienListCard'
import { Pagination } from '@/components/ui/Pagination'
import { getLocauxPagedItems, getCatalogueCommunes, type ConsolidatedFilters } from '@/lib/catalogue/consolidated'

export const dynamic = 'force-dynamic'
export const revalidate = 60
export const metadata = {
  title: 'Offres flash — Bons plans immobiliers en temps réel',
  description: 'Bons plans immobiliers captés en temps réel sur le marché ivoirien. Validation conseiller incluse avant chaque visite.',
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    commune?: string
    type_bien?: string
    prix_min?: string
    prix_max?: string
    vue?: string
    page?: string
  }>
}

const PAGE_SIZE = 24

export default async function OffreFlashPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const vue = ['grille', 'liste'].includes(sp.vue as string) ? sp.vue : 'grille'
  const pageIdx = Math.max(0, parseInt(sp.page ?? '0', 10))

  const filters: ConsolidatedFilters = {
    source: 'flash',
    commune: sp.commune?.trim() || undefined,
    type_bien: sp.type_bien?.trim() || undefined,
    q: sp.q?.trim() || undefined,
    prix_min: sp.prix_min ? Number(sp.prix_min) : undefined,
    prix_max: sp.prix_max ? Number(sp.prix_max) : undefined,
    sort: 'recent',
  }

  const [{ items: paginated, total }, communes] = await Promise.all([
    getLocauxPagedItems(filters, pageIdx, PAGE_SIZE),
    getCatalogueCommunes('flash'),
  ])
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const hasFilters = !!(sp.q || sp.commune || sp.prix_min || sp.prix_max || sp.type_bien)

  return (
    <main className="bg-[var(--background)] min-h-screen pt-6 sm:pt-10 lg:pt-16 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        {/* Header — titre + recherche à gauche, compteur + vue à droite */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 mb-4 lg:mb-6">
          <div className="flex-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-orange-500 opacity-75" />
                <span className="relative rounded-full w-2 h-2 bg-orange-500" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-orange-500">
                Bons plans WhatsApp
              </p>
            </div>
            <h1 className="font-display text-2xl md:text-5xl font-bold text-[var(--text)] mb-3 lg:mb-4 tracking-tight">
              Trouvez votre <span className="italic font-serif text-[var(--accent-luxury)]">offre flash</span>
            </h1>
            <SearchBar className="w-full" initialQuery={sp.q ?? ''} />
          </div>

          <div className="flex items-center gap-6 self-end lg:self-center">
            <div className="text-right">
              <p className="text-4xl font-display font-black text-[var(--accent-luxury)] tabular-nums leading-none">
                {total}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
                Offres flash
              </p>
            </div>
            <div className="h-10 w-px bg-[var(--border)]" />
            <div className="flex gap-1 p-1 bg-surface-raised/50 backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-inner">
              <ViewToggle active={vue === 'grille'} href={buildHref(sp, { vue: 'grille' })} icon={Grid} label="Grille" />
              <ViewToggle active={vue === 'liste'} href={buildHref(sp, { vue: 'liste' })} icon={ListIcon} label="Liste" />
            </div>
          </div>
        </div>

        {/* Filtres rapides — pleine largeur du conteneur (jusqu'à 1600px) pour
            que toutes les rangées de chips s'étalent sans être coupées sur PC */}
        <div className="mb-8">
          <QuickFilters communes={communes} />
        </div>

        {/* Bandeau avertissement intermédiation */}
        <div className="mb-8 rounded-2xl border border-orange-500/20 bg-orange-500/[0.03] p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-orange-500 text-sm">⚡</span>
          </div>
          <div className="text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
            <strong className="text-[var(--text)]">Annonces non vérifiées</strong> — issues de sources tierces sur le marché ivoirien.
            Notre conseiller valide la disponibilité avec le propriétaire avant tout engagement.
            <Link href="/catalogue" className="ml-2 inline-flex items-center gap-1 text-[var(--accent-luxury)] hover:underline font-bold">
              Voir aussi nos biens vérifiés →
            </Link>
          </div>
        </div>

        {/* Grille ou Liste — selon ?vue= */}
        {paginated.length === 0 ? (
          <EmptyResults hasFilters={hasFilters} />
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
  return `/offre-flash${params.toString() ? `?${params.toString()}` : ''}`
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

function EmptyResults({ hasFilters }: { hasFilters: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24 bg-[var(--midnight-muted)] rounded-3xl border border-dashed border-[var(--border)] px-6"
    >
      <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Compass className="w-8 h-8 text-orange-500 animate-pulse" />
      </div>
      <h3 className="font-display text-2xl font-black text-[var(--text)] mb-3 uppercase tracking-tight">
        Aucune offre flash
      </h3>
      <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto mb-8 leading-relaxed text-sm">
        {hasFilters
          ? 'Aucune offre flash ne correspond à vos critères. Essayez d\'élargir la recherche.'
          : 'Pas d\'offre flash active pour le moment. Reviens dans quelques minutes — notre équipe veille tourne en continu.'}
      </p>
      <div className="flex gap-3 justify-center">
        {hasFilters && (
          <Link
            href="/offre-flash"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-luxury)] text-[var(--on-accent)] rounded-xl font-black text-[11px] uppercase tracking-wider hover:opacity-90 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser
          </Link>
        )}
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-[var(--border)] text-[var(--text)] rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-white/10 transition-all"
        >
          Voir le catalogue complet
        </Link>
      </div>
    </motion.div>
  )
}
