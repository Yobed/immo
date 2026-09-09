import { NextResponse } from 'next/server'
import { getHealthSnapshot } from '@/lib/observability/health'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public liveness/readiness probe. It deliberately exposes no counts, keys or database errors. */
export async function GET() {
  const health = await getHealthSnapshot()
  const ok = health.status === 'ok'
  return NextResponse.json(
    { status: health.status, checks: health.checks, generatedAt: health.checkedAt },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
