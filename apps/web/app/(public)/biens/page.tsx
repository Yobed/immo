import { createClient } from '@/lib/supabase/server'
import { BienCard } from '@/components/bien/BienCard'

const PAGE_SIZE = 12

const TYPE_FILTERS = [
  { label: 'Tous', value: '' },
  { label: 'Appartements', value: 'appartement' },
  { label: 'Villas', value: 'villa' },
  { label: 'Résidences meublées', value: 'residence_meublee' },
  { label: 'Studios', value: 'studio' },
  { label: 'Maisons', value: 'maison' },
  { label: 'Bureaux', value: 'bureau' },
  { label: 'Terrains', value: 'terrain' },
]

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
}

export default async function BiensListePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type_bien?: string }>
}) {
  const params = await searchParams
  const page = Math.max(0, parseInt(params.page ?? '0', 10))
  const activeType = params.type_bien ?? ''
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('biens')
    .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces', { count: 'exact' })
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })

  if (activeType) query = query.eq('type_bien', activeType)
  query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const { data: biens, count } = await query
  const bienRows = (biens ?? []) as BienRow[]
  const totalPages = Math.ceil(((count as number) ?? 0) / PAGE_SIZE)

  // Photos de couverture
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

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Hero barre de recherche */}
      <div className="bg-primary/5 border-b border-[var(--border)] py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-2xl text-[var(--text)] mb-4">
            Annonces immobilières en Côte d&apos;Ivoire
            {count ? <span className="text-muted text-base font-sans font-normal ml-2">({count} bien{count > 1 ? 's' : ''})</span> : null}
          </h1>

          {/* Filtres rapides par type */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TYPE_FILTERS.map((f) => {
              const isActive = f.value === activeType
              const href = f.value
                ? `/biens?type_bien=${f.value}`
                : '/biens'
              return (
                <a
                  key={f.value}
                  href={href}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-sans border transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-muted border-[var(--border)] hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {f.label}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grille */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {bienRows.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-4">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
            </div>
            <p className="font-display text-xl text-[var(--text)] mb-2">Aucune annonce trouvée</p>
            <p className="text-muted font-sans text-sm mb-6">Essayez un autre type de bien ou supprimez les filtres.</p>
            <a href="/biens" className="inline-block px-6 py-2 bg-primary text-white rounded-btn text-sm font-sans hover:bg-primary/90 transition-colors">
              Voir toutes les annonces
            </a>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
              <div className="flex justify-center gap-2 mt-10">
                {page > 0 && (
                  <a href={`/biens?${activeType ? `type_bien=${activeType}&` : ''}page=${page - 1}`}
                    className="px-4 py-2 rounded-btn text-sm font-sans border border-[var(--border)] text-muted hover:border-primary/40 hover:text-primary transition-colors">
                    ← Précédent
                  </a>
                )}
                {Array.from({ length: totalPages }, (_, i) => (
                  <a
                    key={i}
                    href={`/biens?${activeType ? `type_bien=${activeType}&` : ''}page=${i}`}
                    className={`px-4 py-2 rounded-btn text-sm font-sans border transition-colors ${
                      i === page
                        ? 'bg-primary text-white border-primary'
                        : 'border-[var(--border)] text-muted hover:border-primary/40'
                    }`}
                  >
                    {i + 1}
                  </a>
                ))}
                {page < totalPages - 1 && (
                  <a href={`/biens?${activeType ? `type_bien=${activeType}&` : ''}page=${page + 1}`}
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
  )
}
