import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BienCard } from '@/components/bien/BienCard'

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

export async function FeaturedProperties() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(6)

  const rows = (biens ?? []) as BienRow[]

  // Photos de couverture
  let coverMap: Record<string, string> = {}
  if (rows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: medias } = await (supabase as any)
      .from('biens_medias')
      .select('bien_id, url, est_couverture')
      .in('bien_id', rows.map((b) => b.id))
      .eq('type', 'photo')
      .order('ordre', { ascending: true })

    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
        if (!coverMap[m.bien_id] || m.est_couverture) {
          coverMap[m.bien_id] = m.url
        }
      }
    }
  }

  if (rows.length === 0) return null

  return (
    <section className="py-20 bg-surface">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Dernières annonces
          </h2>
          <p className="font-sans text-muted text-lg max-w-xl mx-auto">
            Découvrez les biens immobiliers disponibles à Abidjan et en Côte d&apos;Ivoire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
          {rows.map((bien) => (
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

        <div className="text-center">
          <Link
            href="/biens"
            className="inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors rounded-btn bg-primary text-white hover:bg-primary/90 px-6 py-3 text-base"
          >
            Voir toutes les annonces →
          </Link>
        </div>
      </div>
    </section>
  )
}
