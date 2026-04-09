import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' FCFA'
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
          {rows.map((bien) => {
            const photo = coverMap[bien.id]
            const prix = bien.prix_nuit_fcfa
              ? `${formatFCFA(bien.prix_nuit_fcfa)}/nuit`
              : bien.prix_mois_fcfa
              ? `${formatFCFA(bien.prix_mois_fcfa)}/mois`
              : bien.prix_vente_fcfa
              ? formatFCFA(bien.prix_vente_fcfa)
              : null

            return (
              <Link key={bien.id} href={`/biens/${bien.id}`} className="block group">
                <div className="bg-white rounded-card border border-[var(--border)] overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Photo */}
                  <div className="relative aspect-[4/3] bg-primary/10">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={bien.titre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/20 text-5xl">
                        🏠
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant="default" className="text-xs">
                        {TYPES_BIEN_LABELS[bien.type_bien] ?? bien.type_bien}
                      </Badge>
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="p-4">
                    {prix && (
                      <p className="font-mono text-lg font-semibold text-primary mb-1">{prix}</p>
                    )}
                    <h3 className="font-display text-base font-semibold text-[var(--text)] line-clamp-1 mb-1">
                      {bien.titre}
                    </h3>
                    <p className="font-sans text-sm text-muted mb-3">
                      {bien.quartier ? `${bien.quartier}, ` : ''}{bien.commune}
                    </p>
                    {(bien.surface_m2 || bien.nb_pieces) && (
                      <div className="flex gap-4 text-xs text-muted font-sans">
                        {bien.nb_pieces && <span>{bien.nb_pieces} pièce{bien.nb_pieces > 1 ? 's' : ''}</span>}
                        {bien.surface_m2 && <span>{bien.surface_m2} m²</span>}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
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
