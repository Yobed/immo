import { NextRequest, NextResponse } from 'next/server'
import { cleanZombieN8nExecutions } from '@/lib/locaux/dedup'
import { logError } from '@/lib/error-logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Watchdog périodique pour la file n8n (Hugging Face Spaces v2.44.5) :
 * 1. Ping /healthz pour maintenir le conteneur éveillé (anti-sleep mode)
 * 2. Vérifie la disponibilité du moteur et mesure la latence réseau
 * 3. Débloque et purge les exécutions obsolètes
 * 4. Alerte automatiquement dans error_logs si n8n est inaccessible
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET?.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\ufeff]/g, '') || ''

  // Sécurité : autoriser si CRON_SECRET valide OU si requête interne Vercel Cron
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (expected && !isVercelCron && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const stats = await cleanZombieN8nExecutions()

    // Si n8n ne répond pas, enregistrer une alerte pour visibilité cockpit
    if (!stats.n8nHealthy) {
      await logError(`[N8N WATCHDOG] Instance n8n inaccessible ou en échec : ${stats.message}`, {
        source: 'n8n-watchdog',
        route: '/api/cron/watchdog-n8n',
        level: 'warn',
        extra: {
          latencyMs: stats.latencyMs,
          message: stats.message,
        },
      })
    }

    return NextResponse.json({
      ok: stats.n8nHealthy,
      timestamp: new Date().toISOString(),
      ...stats,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}

export const POST = GET
