import { NextRequest, NextResponse } from 'next/server'
import { cleanZombieN8nExecutions } from '@/lib/locaux/dedup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Watchdog périodique pour la file n8n :
 * 1. Débloque les exécutions zombie (en 'running' > 10m ou 'new' > 15m)
 * 2. Purge les anciens logs d'exécution (> 3 jours) pour préserver le quota Supabase Postgres
 *
 * Peut être appelé par Vercel Cron ou un monitoring externe (UptimeRobot, etc.).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET?.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\ufeff]/g, '') || ''

  // Sécurité : autoriser si CRON_SECRET valide OU si requête interne Vercel
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (expected && !isVercelCron && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const stats = await cleanZombieN8nExecutions()
    return NextResponse.json({
      ok: true,
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
