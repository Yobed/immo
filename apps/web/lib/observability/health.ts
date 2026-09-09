import { createAdminClient } from '@/lib/supabase/admin'
import { createAnnoncesClient } from '@/lib/supabase/annonces'

export interface HealthSnapshot {
  status: 'ok' | 'degraded'
  checks: { supabase: boolean; catalogue: boolean }
  checkedAt: string
}

/**
 * Vérifie uniquement la disponibilité des dépendances. Aucun compteur,
 * message SQL ou identifiant métier ne sort de cette fonction.
 */
export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const checks = await Promise.allSettled([
    (async () => {
      const { error } = await (createAdminClient() as any)
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
      if (error) throw error
    })(),
    (async () => {
      const { error } = await (createAnnoncesClient() as any)
        .from('v_annonces')
        .select('id', { head: true, count: 'exact' })
        .gt('nb_photos', 0)
      if (error) throw error
    })(),
  ])
  const supabase = checks[0]?.status === 'fulfilled'
  const catalogue = checks[1]?.status === 'fulfilled'
  return {
    status: supabase && catalogue ? 'ok' : 'degraded',
    checks: { supabase, catalogue },
    checkedAt: new Date().toISOString(),
  }
}
