import { createClient } from '@/lib/supabase/server'
import { BienCard } from '@/components/bien/BienCard'
import { CardsCarousel } from '@/components/ui/CardsCarousel'

const TYPE_FILTERS = [
  { label: 'Appartements', value: 'appartement' },
  { label: 'Villas',       value: 'villa' },
  { label: 'Studios',      value: 'studio' },
  { label: 'Résidences meublées', value: 'residence_meublee' },
  { label: 'Maisons',      value: 'maison' },
  { label: 'Bureaux',      value: 'bureau' },
  { label: 'Terrains',     value: 'terrain' },
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
  searchParams: Promise<{ type_bien?: string }>
}) {
  const params = await searchParams
  const activeType = params.type_bien ?? ''
  const supabase = await createClient()

  // Si filtre actif : grille simple paginée
  if (activeType) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: biens, count } = await (supabase as any)
      .from('biens')
      .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces', { count: 'exact' })
      .eq('statut', 'publie')
      .eq('type_bien', activeType)
      .order('created_at', { ascending: false })
      .limit(24)

    const bienRows = (biens ?? []) as BienRow[]
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

    const activeLabel = TYPE_FILTERS.find(f => f.value === activeType)?.label ?? activeType

    return (
      <div className="min-h-screen bg-white">
        <PageHeader activeType={activeType} count={count ?? 0} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="font-display text-xl font-semibold text-[var(--primary)] mb-5">
            {activeLabel}
            <span className="text-sm font-sans font-normal text-muted ml-2">({count ?? 0} bien{(count ?? 0) > 1 ? 's' : ''})</span>
          </h2>
          {bienRows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {bienRows.map((bien) => (
                <BienCard key={bien.id} {...bienProps(bien, coverMap)} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mode par défaut : carrousels par catégorie
  // Fetch 12 biens par type en parallèle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any
  const typeResults = await Promise.all(
    TYPE_FILTERS.map(async (f) => {
      const { data } = await supabaseAny
        .from('biens')
        .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces')
        .eq('statut', 'publie')
        .eq('type_bien', f.value)
        .order('created_at', { ascending: false })
        .limit(12)
      return { ...f, biens: (data ?? []) as BienRow[] }
    })
  )

  // Photos couverture pour tous les biens
  const allIds = typeResults.flatMap(r => r.biens.map(b => b.id))
  let coverMap: Record<string, string> = {}
  if (allIds.length > 0) {
    const { data: medias } = await supabaseAny
      .from('biens_medias')
      .select('bien_id, url, est_couverture')
      .in('bien_id', allIds)
      .eq('type', 'photo')
      .order('ordre', { ascending: true })
    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
        if (!coverMap[m.bien_id] || m.est_couverture) coverMap[m.bien_id] = m.url
      }
    }
  }

  const activeRows = typeResults.filter(r => r.biens.length > 0)

  return (
    <div className="min-h-screen bg-white">
      <PageHeader activeType="" count={allIds.length} />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {activeRows.length === 0 ? (
          <EmptyState />
        ) : (
          activeRows.map((row, idx) => (
            <section key={row.value}>
              {/* Section header avec fond bleu tous les 2 */}
              {idx % 2 === 0 ? (
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[var(--primary)]">{row.label}</h2>
                    <p className="text-sm text-muted font-sans mt-0.5">{row.biens.length} annonce{row.biens.length > 1 ? 's' : ''} disponible{row.biens.length > 1 ? 's' : ''}</p>
                  </div>
                  <a href={`/biens?type_bien=${row.value}`}
                    className="text-sm font-sans font-medium text-[var(--primary)] hover:text-[var(--primary-mid)] transition-colors flex items-center gap-1">
                    Voir tout
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </a>
                </div>
              ) : (
                <div className="relative -mx-4 px-4 py-6 mb-5 bg-[var(--primary)] rounded-[20px] overflow-hidden">
                  <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-white">{row.label}</h2>
                      <p className="text-sm text-white/60 font-sans mt-0.5">{row.biens.length} annonce{row.biens.length > 1 ? 's' : ''} disponible{row.biens.length > 1 ? 's' : ''}</p>
                    </div>
                    <a href={`/biens?type_bien=${row.value}`}
                      className="text-sm font-sans font-medium text-[var(--secondary)] hover:text-[var(--secondary)]/80 transition-colors flex items-center gap-1">
                      Voir tout
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </a>
                  </div>
                </div>
              )}

              <CardsCarousel>
                {row.biens.map((bien) => (
                  <div key={bien.id} className="w-72 shrink-0">
                    <BienCard {...bienProps(bien, coverMap)} />
                  </div>
                ))}
              </CardsCarousel>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function bienProps(bien: BienRow, coverMap: Record<string, string>) {
  return {
    id: bien.id,
    titre: bien.titre,
    commune: bien.commune,
    quartier: bien.quartier,
    type_bien: bien.type_bien,
    prix_mois_fcfa: bien.prix_nuit_fcfa ? null : bien.prix_mois_fcfa,
    prix_nuit_fcfa: bien.prix_nuit_fcfa,
    prix_vente_fcfa: bien.prix_vente_fcfa,
    surface_m2: bien.surface_m2,
    nb_pieces: bien.nb_pieces,
    photo_url: coverMap[bien.id] ?? null,
  }
}

function PageHeader({ activeType, count }: { activeType: string; count: number }) {
  const allFilters = [{ label: 'Tous', value: '' }, ...TYPE_FILTERS]
  return (
    <div className="bg-[var(--primary)] border-b border-[var(--primary-mid)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          Annonces immobilières en Côte d&apos;Ivoire
        </h1>
        <p className="text-white/60 text-sm font-sans mb-4">
          {count} bien{count > 1 ? 's' : ''} disponible{count > 1 ? 's' : ''}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allFilters.map((f) => {
            const isActive = f.value === activeType
            return (
              <a
                key={f.value}
                href={f.value ? `/biens?type_bien=${f.value}` : '/biens'}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-sans border transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-[var(--primary)] border-white font-medium'
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                {f.label}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="flex justify-center mb-4">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      </div>
      <p className="font-display text-xl text-[var(--text)] mb-2">Aucune annonce trouvée</p>
      <p className="text-muted font-sans text-sm mb-6">Essayez un autre type de bien.</p>
      <a href="/biens" className="inline-block px-6 py-2 bg-primary text-white rounded-btn text-sm font-sans hover:bg-primary/90 transition-colors">
        Voir toutes les annonces
      </a>
    </div>
  )
}
