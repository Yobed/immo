import { createClient } from '@/lib/supabase/server'
import { STATUTS_PUBLICS } from '@/lib/catalogue/statuts'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { PremiumBienListCard } from '@/components/bien/PremiumBienListCard'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { MobileFiltersDrawer } from '@/components/search/MobileFiltersDrawer'
import { PropertiesMap } from '@/components/map/PropertiesMap'
import { Compass, Grid, Map as MapIcon, SlidersHorizontal, List, X } from 'lucide-react'
import { FlashOffersBanner } from '@/components/search/FlashOffersBanner'
import { FlashOffersInline } from '@/components/search/FlashOffersInline'
import { QuickFilters } from '@/components/search/QuickFilters'
import Link from 'next/link'
import * as motion from 'framer-motion/client'

const PAGE_SIZE = 12

interface SearchPageParams {
  q?: string
  commune?: string
  prix_min?: string
  prix_max?: string
  type_bien?: string
  equipements?: string
  vue?: string
  page?: string
}

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
  latitude: number | null
  longitude: number | null
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SearchPageParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const page = Math.max(0, parseInt(params.page ?? '0', 10))
  const vue = ['carte', 'grille', 'liste'].includes(params.vue as string) ? params.vue : 'grille'

  let dbQuery = (supabase as any)
    .from('biens')
    .select(
      'id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, latitude, longitude',
      { count: 'exact' }
    )
    .in('statut', [...STATUTS_PUBLICS])

  if (params.q?.trim()) {
    dbQuery = dbQuery.textSearch('fts', params.q.trim(), { type: 'plain', config: 'french' })
  }
  if (params.commune) dbQuery = dbQuery.ilike('commune', `%${params.commune}%`)
  const prixMin = params.prix_min ? parseInt(params.prix_min, 10) : NaN
  const prixMax = params.prix_max ? parseInt(params.prix_max, 10) : NaN
  if (!isNaN(prixMin)) dbQuery = dbQuery.gte('prix_mois_fcfa', prixMin)
  if (!isNaN(prixMax)) dbQuery = dbQuery.lte('prix_mois_fcfa', prixMax)
  if (params.type_bien) dbQuery = dbQuery.eq('type_bien', params.type_bien)
  if (params.equipements) {
    const equipList = params.equipements.split(',').filter(Boolean)
    if (equipList.length > 0) dbQuery = dbQuery.contains('equipements', equipList)
  }

  const { data: biens, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const bienRows = (biens ?? []) as BienRow[]
  const totalResults = (count as number) ?? 0
  const totalPages = Math.ceil(totalResults / PAGE_SIZE)

  // Photos de couverture
  const coverMap = await getCoverMap(supabase, bienRows.map(b => b.id))

  const hasFilters = !!(params.q || params.commune || params.prix_min || params.prix_max || params.type_bien || params.equipements)
  const activeFilterCount = [params.commune, params.prix_min, params.prix_max, params.type_bien, params.equipements].filter(Boolean).length

  return (
    <main className="bg-[var(--background)] min-h-screen pt-6 sm:pt-10 lg:pt-16 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">

        {/* Superior Search & Stats Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 mb-6 lg:mb-12">
          <div className="flex-1 max-w-3xl">
            <h1 className="font-display text-2xl md:text-5xl font-bold text-off-white mb-3 lg:mb-4 tracking-tight">
              Trouvez votre résidence
            </h1>
            <SearchBar className="w-full" initialQuery={params.q ?? ''} />
            <div className="mt-4 lg:hidden">
              <QuickFilters />
            </div>
          </div>
          
          <div className="flex items-center gap-6 self-end lg:self-center">
            <div className="text-right">
              <p className="text-4xl font-display font-black text-[var(--accent-luxury)] tabular-nums leading-none">
                {totalResults}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">
                Résultats trouvés
              </p>
            </div>
            <div className="h-10 w-px bg-[var(--border)]" />
            <div className="flex gap-1 p-1 bg-surface-raised/50 backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-inner">
              <ViewToggle active={vue === 'grille'} href={`/recherche?${new URLSearchParams({ ...params, vue: 'grille' }).toString()}`} icon={Grid} label="Grille" />
              <ViewToggle active={vue === 'liste'} href={`/recherche?${new URLSearchParams({ ...params, vue: 'liste' }).toString()}`} icon={List} label="Liste" />
              <ViewToggle active={vue === 'carte'} href={`/recherche?${new URLSearchParams({ ...params, vue: 'carte' }).toString()}`} icon={MapIcon} label="Carte" />
            </div>
          </div>
        </div>

        {/* Bannière Offres Flash WhatsApp si correspondances */}
        <FlashOffersBanner filters={{ q: params.q, commune: params.commune, type_bien: params.type_bien }} />

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Side Filters (Editorial Style) */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-28 bg-[var(--surface-card)] rounded-[2rem] border border-[var(--border)] p-8 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 mb-8">
                <SlidersHorizontal className="w-4 h-4 text-[var(--accent-luxury)]" />
                <h3 className="font-display font-bold text-lg text-[var(--text)]">Affinage</h3>
              </div>
              <SearchFilters />
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1 min-w-0">
            <div className="lg:hidden mb-6">
              <MobileFiltersDrawer activeCount={activeFilterCount} />
            </div>

            {vue === 'carte' && bienRows.length > 0 && (
              <div className="mb-10 rounded-[3rem] overflow-hidden border border-off-white/10 shadow-2xl h-[500px]">
                <PropertiesMap
                  biens={bienRows.map((b) => ({
                    id: b.id,
                    titre: b.titre,
                    commune: b.commune,
                    quartier: b.quartier,
                    type_bien: b.type_bien,
                    latitude: b.latitude,
                    longitude: b.longitude,
                    prix_mois_fcfa: b.prix_mois_fcfa,
                    prix_nuit_fcfa: b.prix_nuit_fcfa,
                    prix_vente_fcfa: b.prix_vente_fcfa,
                  }))}
                  hauteur={500}
                />
              </div>
            )}

            {bienRows.length === 0 ? (
              <EmptyResults hasFilters={hasFilters} />
            ) : vue === 'liste' ? (
              <div className="flex flex-col gap-6">
                {bienRows.map((bien, i) => (
                  <PremiumBienListCard
                    key={bien.id}
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
                    photo_url={coverMap[bien.id] ?? null}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {bienRows.map((bien, i) => (
                  <PremiumBienCard
                    key={bien.id}
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
                    photo_url={coverMap[bien.id] ?? null}
                    index={i}
                    isCompact={true}
                  />
                ))}
              </div>
            )}

            {/* Premium Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-20">
                <PaginationGroup params={params} page={page} totalPages={totalPages} />
              </div>
            )}

            {/* Section unifiée : offres flash WhatsApp correspondant aux mêmes filtres */}
            <FlashOffersInline
              filters={{
                q: params.q,
                commune: params.commune,
                type_bien: params.type_bien,
                prix_min: params.prix_min,
                prix_max: params.prix_max,
              }}
              limit={6}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function ViewToggle({ active, href, icon: Icon, label }: { active: boolean; href: string; icon: any; label: string }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
        active 
          ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)] shadow-lg shadow-accent-luxury/20' 
          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}

function PaginationGroup({ params, page, totalPages }: { params: any; page: number; totalPages: number }) {
  return (
    <nav className="flex items-center gap-2 p-2 bg-surface-raised/50 backdrop-blur-xl rounded-2xl border border-[var(--border)] shadow-inner">
      {page > 0 && <PageLink href={`/recherche?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`} icon="←" />}
      <div className="flex gap-1 px-2">
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
          <Link 
            key={i}
            href={`/recherche?${new URLSearchParams({ ...params, page: String(i) }).toString()}`}
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-[11px] font-black transition-all duration-300 ${
              i === page 
                ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)] shadow-lg shadow-accent-luxury/20' 
                : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]'
            }`}
          >
            {i + 1}
          </Link>
        ))}
      </div>
      {page < totalPages - 1 && <PageLink href={`/recherche?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`} icon="→" />}
    </nav>
  )
}

function PageLink({ href, icon }: { href: string; icon: string }) {
  return (
    <Link 
      href={href} 
      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-[var(--border)] text-[var(--text)] transition-all duration-300 hover:bg-[var(--accent-luxury)] hover:text-[var(--on-accent)] hover:border-transparent active:scale-90"
    >
      <span className="text-lg leading-none mt-[-2px]">{icon}</span>
    </Link>
  )
}

function EmptyResults({ hasFilters }: { hasFilters: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24 bg-[var(--midnight-muted)] rounded-[3rem] border border-dashed border-[var(--border)] px-6"
    >
      <div className="w-24 h-24 bg-accent-luxury/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
        <Compass className="w-10 h-10 text-[var(--accent-luxury)] animate-pulse" />
      </div>
      <h3 className="font-display text-3xl font-black text-[var(--text)] mb-4 tracking-tight uppercase italic">
        Aucun bien trouvé
      </h3>
      <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto mb-10 leading-relaxed">
        Nous n&apos;avons pas trouvé de propriétés correspondant à vos critères actuels. Essayez d&apos;élargir votre zone de recherche.
      </p>
      {hasFilters && (
        <Link 
          href="/recherche" 
          className="inline-flex items-center gap-3 px-10 py-4 bg-[var(--accent-luxury)] text-[var(--on-accent)] rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-accent-luxury/20 active:scale-95 transition-all"
        >
          <X className="w-4 h-4" />
          Réinitialiser les filtres
        </Link>
      )}
    </motion.div>
  )
}

async function getCoverMap(supabase: any, ids: string[]) {
  if (ids.length === 0) return {}
  const { data: medias } = await supabase
    .from('biens_medias')
    .select('bien_id, url, est_couverture')
    .in('bien_id', ids)
    .eq('type', 'photo')
    .order('est_couverture', { ascending: false }).order('ordre', { ascending: true })
  const map: Record<string, string> = {}
  if (medias) {
    for (const m of medias) {
      if (!map[m.bien_id] || m.est_couverture) map[m.bien_id] = m.url
    }
  }
  return map
}


