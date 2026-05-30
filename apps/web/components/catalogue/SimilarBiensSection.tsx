import { Sparkles } from 'lucide-react'
import { getConsolidatedCatalogue } from '@/lib/catalogue/consolidated'
import { UnifiedBienCard } from './UnifiedBienCard'

interface Props {
  /** ID brut du bien courant à exclure (sourceId) */
  excludeId: string
  /** Source du bien courant (pour exclusion fiable, évite collisions UUID/numeric) */
  excludeSource?: 'bogbes' | 'flash'
  /** Commune pour cibler les similaires */
  commune: string
  /** Type de bien pour cibler les similaires */
  type_bien: string
  /** Prix de référence (FCFA) — ±25% pour matcher */
  prix_value?: number | null
  /** Titre de la section */
  title?: string
  /** Sous-titre */
  subtitle?: string
}

/**
 * Section "biens similaires" — fetched côté serveur via le catalogue consolidé.
 * À placer en bas d'une fiche bien individuelle (BOGBE'S ou offre flash).
 *
 * Critères :
 * - Même commune (ilike %commune%)
 * - Même type_bien
 * - Prix dans ±25% du prix de référence (plus large que la marge Sapphire pour offrir + d'options)
 * - Exclut le bien courant
 * - Max 4 biens (vérifiés en premier)
 */
export async function SimilarBiensSection({
  excludeId,
  excludeSource,
  commune,
  type_bien,
  prix_value,
  title = 'Biens similaires',
  subtitle = 'Autres options dans la même zone et budget',
}: Props) {
  const margin = 0.25
  const prixMin = prix_value ? Math.round(prix_value * (1 - margin)) : undefined
  const prixMax = prix_value ? Math.round(prix_value * (1 + margin)) : undefined

  const { items } = await getConsolidatedCatalogue({
    commune,
    type_bien,
    prix_min: prixMin,
    prix_max: prixMax,
    sort: 'verified_first',
    limitPerSource: 20,
  })

  // Exclure le bien courant via ID préfixé si possible (évite collision UUID/numeric)
  const excludedFullId = excludeSource ? `${excludeSource}:${excludeId}` : null
  const similar = items
    .filter((b) =>
      excludedFullId ? b.id !== excludedFullId : b.sourceId !== excludeId,
    )
    .slice(0, 4)

  if (similar.length === 0) return null

  return (
    <section className="mt-12 pt-10 border-t border-[var(--border)]">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-5 h-5 text-accent-luxury" />
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-[var(--text)] tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-[var(--text)] mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {similar.map((bien, i) => (
          <UnifiedBienCard key={bien.id} bien={bien} index={i} />
        ))}
      </div>
    </section>
  )
}
