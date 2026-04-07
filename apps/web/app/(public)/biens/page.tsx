import { createClient } from '@/lib/supabase/server'
import { BienCard } from '@/components/bien/BienCard'

const PAGE_SIZE = 12

export default async function BiensListePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(0, parseInt(params.page ?? '0', 10))
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens, count } = await (supabase as any)
    .from('biens')
    .select(`
      id, titre, commune, type_bien, prix_mois_fcfa, prix_vente_fcfa,
      surface_m2, nb_pieces,
      biens_medias(url, est_couverture, ordre)
    `, { count: 'exact' })
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const totalPages = Math.ceil(((count as number) ?? 0) / PAGE_SIZE)

  return (
    <main className="bg-surface min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="font-display text-3xl text-[var(--text)] mb-6">
          Annonces immobilières en Côte d'Ivoire
        </h1>
        {(!biens || (biens as unknown[]).length === 0) ? (
          <p className="text-muted font-sans py-16 text-center">Aucune annonce disponible pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(biens as Array<{
              id: string
              titre: string
              commune: string
              type_bien: string
              prix_mois_fcfa: number | null
              prix_vente_fcfa: number | null
              surface_m2: number | null
              nb_pieces: number | null
              biens_medias: Array<{ url: string; est_couverture: boolean | null; ordre: number }>
            }>).map((bien) => {
              const cover = bien.biens_medias?.find((m) => m.est_couverture)?.url ?? bien.biens_medias?.[0]?.url
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
                  photo_url={cover ?? null}
                />
              )
            })}
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => (
              <a
                key={i}
                href={`/biens?page=${i}`}
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
      </div>
    </main>
  )
}
