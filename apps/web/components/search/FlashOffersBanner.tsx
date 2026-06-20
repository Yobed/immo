import Link from 'next/link'
import { Flame, ArrowRight } from 'lucide-react'
import { createLocauxClient } from '@/lib/supabase/locaux'

interface Filters {
  q?: string
  commune?: string
  type_bien?: string
}

/**
 * Bannière qui compte les offres flash WhatsApp correspondant aux filtres
 * actuels de la recherche, et propose un lien vers /offre-flash avec
 * les mêmes filtres pré-appliqués.
 */
export async function FlashOffersBanner({ filters }: { filters: Filters }) {
  const c = createLocauxClient()

  let q = c
    .from('locaux')
    .select('id', { count: 'exact', head: true })
    // Politique permissive alignée sur le catalogue (consolidated.ts) : NULL accepté.
    .not('status', 'eq', 'inactive')
    .not('is_duplicate', 'is', true)
    .or('disponible.is.null,disponible.neq.non')

  if (filters.commune) q = q.ilike('commune', `%${filters.commune}%`)
  if (filters.type_bien) q = q.ilike('type_de_bien', `%${filters.type_bien}%`)
  if (filters.q) {
    q = q.or(
      `message_initial.ilike.%${filters.q}%,caracteristiques.ilike.%${filters.q}%,quartier.ilike.%${filters.q}%`
    )
  }

  const { count } = await q
  if (!count || count === 0) return null

  // Reconstruit l'URL /offre-flash avec les filtres équivalents
  const params = new URLSearchParams()
  if (filters.commune) params.set('commune', filters.commune)
  if (filters.type_bien) params.set('type', filters.type_bien)
  if (filters.q) params.set('q', filters.q)
  const flashUrl = `/offre-flash${params.toString() ? `?${params.toString()}` : ''}`

  return (
    <Link
      href={flashUrl}
      className="group flex items-center justify-between gap-3 px-4 py-3 mb-6 bg-gradient-to-r from-red-900/30 via-orange-900/30 to-pink-900/30 border border-orange-500/40 rounded-2xl hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/10 transition-all"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight">
            <span className="text-orange-400">{count.toLocaleString('fr-FR')}</span>{' '}
            offre{count > 1 ? 's' : ''} flash correspond{count > 1 ? 'ent' : ''} aussi
          </p>
          <p className="text-white/50 text-xs leading-tight mt-0.5 truncate">
            Opportunités captées sur le marché ivoirien
          </p>
        </div>
      </div>
      <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-orange-400 group-hover:gap-2 transition-all">
        Voir <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  )
}
