import { createClient } from '@/lib/supabase/server'
import { BienCard } from '@/components/bien/BienCard'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { MobileFiltersDrawer } from '@/components/search/MobileFiltersDrawer'
import { PropertiesMap } from '@/components/map/PropertiesMap'

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
  const vue = params.vue === 'carte' ? 'carte' : 'grille'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbQuery = (supabase as any)
    .from('biens')
    .select(
      'id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, latitude, longitude',
      { count: 'exact' }
    )
    .eq('statut', 'publie')

  if (params.q?.trim()) {
    dbQuery = dbQuery.textSearch('fts', params.q.trim(), { type: 'plain', config: 'french' })
  }
  if (params.commune) dbQuery = dbQuery.ilike('commune', `%${params.commune}%`)
  if (params.prix_min) dbQuery = dbQuery.gte('prix_mois_fcfa', parseInt(params.prix_min, 10))
  if (params.prix_max) dbQuery = dbQuery.lte('prix_mois_fcfa', parseInt(params.prix_max, 10))
  if (params.type_bien) dbQuery = dbQuery.eq('type_bien', params.type_bien)
  if (params.equipements) {
    const equipList = params.equipements.split(',').filter(Boolean)
    if (equipList.length > 0) dbQuery = dbQuery.contains('equipements', equipList)
  }

  const { data: biens, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const bienRows = (biens ?? []) as BienRow[]
  const totalPages = Math.ceil(((count as number) ?? 0) / PAGE_SIZE)
  const totalResults = (count as number) ?? 0

  // Photos de couverture — requête séparée (même pattern que /biens)
  let coverMap: Record<string, string> = {}
  if (bienRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: medias } = await (supabase as any)
      .from('biens_medias')
      .select('bien_id, url, est_couverture')
      .in('bien_id', bienRows.map((b) => b.id))
      .eq('type', 'photo')
      .order('ordre', { ascending: true })

    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
        if (!coverMap[m.bien_id] || m.est_couverture) coverMap[m.bien_id] = m.url
      }
    }
  }

  const hasFilters = params.q || params.commune || params.prix_min || params.prix_max || params.type_bien || params.equipements

  const activeFilterCount = [params.commune, params.prix_min, params.prix_max, params.type_bien, params.equipements].filter(Boolean).length

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Search bar */}
        <div className="mb-6">
          <SearchBar className="max-w-2xl" initialQuery={params.q ?? ''} />
        </div>

        <div className="flex gap-6">
          {/* Sidebar filtres */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <SearchFilters />
            </div>
          </aside>

          {/* Résultats */}
          <div className="flex-1 min-w-0">
            {/* Header résultats */}
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <MobileFiltersDrawer activeCount={activeFilterCount} />
                <div className="min-w-0">
                  <p className="text-sm font-sans font-semibold text-[var(--text)]">
                    {totalResults === 0
                      ? 'Aucun résultat'
                      : `${totalResults} bien${totalResults > 1 ? 's' : ''} trouvé${totalResults > 1 ? 's' : ''}`}
                  </p>
                  {(params.q || params.type_bien === 'residence_meublee') && (
                    <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
                      {params.q && <>pour « {params.q} »</>}
                      {params.type_bien === 'residence_meublee' && (
                        <span className="text-[var(--secondary)] font-medium">
                          {params.q ? ' · ' : ''}Résidences meublées
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Toggle grille / carte */}
              <div className="flex gap-1 bg-white border border-[var(--border)] rounded-btn p-1"
                style={{ boxShadow: 'var(--shadow-xs)' }}>
                <a href={`/recherche?${new URLSearchParams({ ...params, vue: 'grille' }).toString()}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-sans font-medium transition-all duration-200 ${
                    vue === 'grille'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                  }`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                  Grille
                </a>
                <a href={`/recherche?${new URLSearchParams({ ...params, vue: 'carte' }).toString()}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-sans font-medium transition-all duration-200 ${
                    vue === 'carte'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--primary)]'
                  }`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                  </svg>
                  Carte
                </a>
              </div>
            </div>

            {/* Vue carte */}
            {vue === 'carte' && bienRows.length > 0 && (
              <div className="mb-6">
                <PropertiesMap
                  biens={bienRows.map((b) => ({
                    id: b.id,
                    titre: b.titre,
                    commune: b.commune,
                    latitude: b.latitude,
                    longitude: b.longitude,
                    prix_mois_fcfa: b.prix_mois_fcfa,
                    prix_vente_fcfa: b.prix_vente_fcfa,
                  }))}
                  hauteur={450}
                />
              </div>
            )}

            {/* Résultats vides */}
            {bienRows.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                    <path d="M9 21V12h6v9"/>
                  </svg>
                </div>
                <p className="font-display text-xl text-[var(--text)] mb-2">Aucune annonce trouvée</p>
                <p className="text-muted font-sans text-sm mb-6">Essayez un autre filtre ou modifiez votre recherche.</p>
                {hasFilters && (
                  <a href="/recherche" className="inline-block px-6 py-2 bg-primary text-white rounded-btn text-sm font-sans hover:bg-primary/90 transition-colors">
                    Effacer les filtres
                  </a>
                )}
              </div>
            ) : (
              <>
                {/* Vue grille */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {bienRows.map((bien) => (
                    <BienCard
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
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {page > 0 && (
                      <a href={`/recherche?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                        className="px-4 py-2 rounded-btn text-sm font-sans border border-[var(--border)] text-muted hover:border-primary/40 hover:text-primary transition-colors">
                        ← Précédent
                      </a>
                    )}
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                      <a key={i}
                        href={`/recherche?${new URLSearchParams({ ...params, page: String(i) }).toString()}`}
                        className={`px-4 py-2 rounded-btn text-sm font-sans border transition-colors ${
                          i === page ? 'bg-primary text-white border-primary' : 'border-[var(--border)] text-muted hover:border-primary/40'
                        }`}>
                        {i + 1}
                      </a>
                    ))}
                    {page < totalPages - 1 && (
                      <a href={`/recherche?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                        className="px-4 py-2 rounded-btn text-sm font-sans border border-[var(--border)] text-muted hover:border-primary/40 hover:text-primary transition-colors">
                        Suivant →
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
