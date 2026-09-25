import { createAdminClient } from '@/lib/supabase/admin'
import { createAnnoncesClient } from '@/lib/supabase/annonces'
import { locauxReadClients } from '@/lib/supabase/locaux'

export interface HealthSnapshot {
  status: 'ok' | 'degraded'
  checks: {
    supabase: boolean
    catalogue: boolean
    freshLocaux: boolean
    n8n: boolean
  }
  checkedAt: string
}

/**
 * Vérifie la disponibilité de TOUTES les dépendances critiques :
 * 1. Base CRM principale (profiles, prospects, biens)
 * 2. Base catalogue web (v_annonces)
 * 3. Bases d'ingestion WhatsApp (locaux)
 * 4. Moteur de scraping n8n (/healthz)
 */
export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const checks = await Promise.allSettled([
    // 1. Supabase Principal
    (async () => {
      const { error } = await (createAdminClient() as any)
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
      if (error) throw error
    })(),
    // 2. Annonces Scrappées Web
    (async () => {
      const { error } = await (createAnnoncesClient() as any)
        .from('v_annonces')
        .select('id', { head: true, count: 'exact' })
        .gt('nb_photos', 0)
      if (error) throw error
    })(),
    // 3. Supabase Locaux (Offres flash WhatsApp : au moins 1 base active)
    (async () => {
      const results = await Promise.allSettled(
        locauxReadClients().map(async (sb) => {
          const { error } = await (sb as any)
            .from('locaux')
            .select('id', { head: true, count: 'exact' })
          if (error) throw error
        }),
      )
      if (!results.some((r) => r.status === 'fulfilled')) {
        throw new Error('All locaux databases unreachable')
      }
    })(),
    // 4. Moteur n8n (Hugging Face)
    (async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      try {
        const res = await fetch('https://kassio1-n8n-free.hf.space/healthz', {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (!res.ok) throw new Error(`n8n health status ${res.status}`)
      } finally {
        clearTimeout(timeoutId)
      }
    })(),
  ])

  const supabase = checks[0]?.status === 'fulfilled'
  const catalogue = checks[1]?.status === 'fulfilled'
  const freshLocaux = checks[2]?.status === 'fulfilled'
  const n8n = checks[3]?.status === 'fulfilled'

  const allOk = supabase && catalogue && freshLocaux && n8n

  return {
    status: allOk ? 'ok' : 'degraded',
    checks: { supabase, catalogue, freshLocaux, n8n },
    checkedAt: new Date().toISOString(),
  }
}
