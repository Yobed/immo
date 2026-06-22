import { createClient } from '@supabase/supabase-js'

/**
 * Compte les vues (analytics_events.event_type='vue_bien') des 7 derniers jours
 * pour un lot de biens, en UNE seule requête (au lieu de N appels API par carte).
 *
 * Service client : analytics_events est protégée en lecture par RLS, comme la
 * route /api/biens/[id]/view qui sert le même compteur.
 *
 * ponytail: tally en JS sur les lignes brutes (cap 20k). Suffisant pour une page
 * de catalogue (≤ 24 biens). Si le volume d'events explose, remplacer par une
 * fonction SQL GROUP BY (RPC) pour compter côté DB.
 */
export async function getViewCounts7d(bienIds: string[]): Promise<Record<string, number>> {
  if (bienIds.length === 0) return {}

  // Non-bloquant : la preuve sociale est un bonus, elle ne doit JAMAIS casser une
  // page. Toute erreur (env manquant, requête KO, RLS) → on rend {} silencieusement.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return {}

    const supabase = createClient(url.trim(), key.trim())
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('analytics_events')
      .select('bien_id')
      .eq('event_type', 'vue_bien')
      .gte('created_at', since)
      .in('bien_id', bienIds)
      .limit(20000)

    const counts: Record<string, number> = {}
    for (const r of (data ?? []) as { bien_id: string }[]) {
      if (r.bien_id) counts[r.bien_id] = (counts[r.bien_id] ?? 0) + 1
    }
    return counts
  } catch {
    return {}
  }
}
