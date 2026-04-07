import { createClient } from '@/lib/supabase/server'
import { BienCard } from '@/components/bien/BienCard'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
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

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SearchPageParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const page = Math.max(0, parseInt(params.page ?? '0', 10))
  const vue = params.vue === 'carte' ? 'carte' : 'grille'

  // Construire la requête Supabase dynamiquement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbQuery = (supabase as any)
    .from('biens')
    .select(
      `
      id, titre, commune, type_bien, prix_mois_fcfa, prix_vente_fcfa,
      surface_m2, nb_pieces, latitude, longitude,
      biens_medias(url, est_couverture, ordre, type)
    `,
      { count: 'exact' }
    )
    .eq('statut', 'publie')

  // Full-text search — type: 'plain' gère les apostrophes automatiquement (ex: Plateau d'Abidjan)
  // Ne jamais interpoler user input dans raw SQL
  if (params.q?.trim()) {
    dbQuery = dbQuery.textSearch('fts', params.q.trim(), {
      type: 'plain',
      config: 'french',
    })
  }

  // Filtres combinés
  if (params.commune) {
    dbQuery = dbQuery.eq('commune', params.commune)
  }
  if (params.prix_min) {
    dbQuery = dbQuery.gte('prix_mois_fcfa', parseInt(params.prix_min, 10))
  }
  if (params.prix_max) {
    dbQuery = dbQuery.lte('prix_mois_fcfa', parseInt(params.prix_max, 10))
  }
  if (params.type_bien) {
    dbQuery = dbQuery.eq('type_bien', params.type_bien)
  }
  if (params.equipements) {
    const equipList = params.equipements.split(',').filter(Boolean)
    if (equipList.length > 0) {
      // Opérateur @> (contains) : tous les équipements doivent être présents
      dbQuery = dbQuery.contains('equipements', equipList)
    }
  }

  const { data: biens, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const totalPages = Math.ceil(((count as number) ?? 0) / PAGE_SIZE)
  const totalResults = (count as number) ?? 0

  const hasFilters =
    params.q ||
    params.commune ||
    params.prix_min ||
    params.prix_max ||
    params.type_bien ||
    params.equipements

  const biensArray = (biens as Array<{
    id: string
    titre: string
    commune: string
    type_bien: string
    prix_mois_fcfa: number | null
    prix_vente_fcfa: number | null
    surface_m2: number | null
    nb_pieces: number | null
    latitude: number | null
    longitude: number | null
    biens_medias: Array<{ url: string; est_couverture: boolean | null; ordre: number; type: string }>
  }>) ?? []

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Search bar */}
        <div className="mb-6">
          <SearchBar className="max-w-2xl" />
        </div>

        <div className="flex gap-6">
          {/* Sidebar filtres */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <SearchFilters />
          </aside>

          {/* Résultats */}
          <div className="flex-1 min-w-0">
            {/* Header résultats */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted font-sans">
                {totalResults === 0
                  ? 'Aucun résultat'
                  : `${totalResults} bien${totalResults > 1 ? 's' : ''} trouvé${totalResults > 1 ? 's' : ''}`}
                {params.q && (
                  <span className="text-[var(--text)]"> pour « {params.q} »</span>
                )}
              </p>
              {/* Toggle grille / carte */}
              <div className="flex gap-2">
                <a
                  href={`/recherche?${new URLSearchParams({ ...params, vue: 'grille' }).toString()}`}
                  className={`px-3 py-1.5 rounded-btn text-sm font-sans border transition-colors ${
                    vue === 'grille'
                      ? 'bg-primary text-white border-primary'
                      : 'border-[var(--border)] text-muted hover:border-primary/40'
                  }`}
                >
                  Grille
                </a>
                <a
                  href={`/recherche?${new URLSearchParams({ ...params, vue: 'carte' }).toString()}`}
                  className={`px-3 py-1.5 rounded-btn text-sm font-sans border transition-colors ${
                    vue === 'carte'
                      ? 'bg-primary text-white border-primary'
                      : 'border-[var(--border)] text-muted hover:border-primary/40'
                  }`}
                >
                  Carte
                </a>
              </div>
            </div>

            {/* Vue carte */}
            {vue === 'carte' && biensArray.length > 0 && (
              <div className="mb-6">
                <PropertiesMap
                  biens={biensArray.map((b) => ({
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
            {biensArray.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted font-sans mb-2">
                  Aucun bien ne correspond à votre recherche.
                </p>
                {hasFilters && (
                  <a
                    href="/recherche"
                    className="text-sm text-primary font-sans hover:underline"
                  >
                    Effacer les filtres
                  </a>
                )}
              </div>
            ) : (
              <>
                {/* Vue grille */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {biensArray.map((bien) => {
                    const medias = bien.biens_medias ?? []
                    const cover = medias
                      .filter((m) => m.type === 'photo')
                      .sort((a, b) =>
                        a.est_couverture ? -1 : b.est_couverture ? 1 : a.ordre - b.ordre
                      )[0]
                    return (
                      <BienCard
                        key={bien.id}
                        id={bien.id}
                        titre={bien.titre}
                        commune={bien.commune}
                        type_bien={bien.type_bien}
                        prix_mois_fcfa={bien.prix_mois_fcfa}
                        prix_vente_fcfa={bien.prix_vente_fcfa}
                        surface_m2={bien.surface_m2}
                        nb_pieces={bien.nb_pieces}
                        photo_url={cover?.url ?? null}
                      />
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                      <a
                        key={i}
                        href={`/recherche?${new URLSearchParams({ ...params, page: String(i) }).toString()}`}
                        className={`px-4 py-2 rounded-btn text-sm font-sans border transition-colors ${
                          i === page
                            ? 'bg-primary text-white border-primary'
                            : 'border-[var(--border)] text-muted hover:border-primary/40'
                        }`}
                      >
                        {i + 1}
                      </a>
                    ))}
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
