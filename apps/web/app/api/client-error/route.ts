import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/error-logger'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

/**
 * Reçoit les erreurs client (boundary error.tsx) et les enregistre dans error_logs
 * via logError. Non-bloquant : répond toujours 200, ne casse jamais le client.
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { scope: 'client-error', max: 20, windowMs: 10 * 60_000 })
  if (!rl.ok) return rateLimitResponse(rl)
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const err = new Error(typeof body.message === 'string' ? body.message : 'client error')
    err.name = typeof body.name === 'string' ? body.name : 'ClientError'
    if (typeof body.stack === 'string') err.stack = body.stack

    await logError(err, {
      source: 'client',
      route: typeof body.url === 'string' ? body.url : undefined,
      level: 'error',
      extra: { digest: body.digest ?? null, ua: body.ua ?? null, url: body.url ?? null },
    })
  } catch {
    // jamais casser le logger
  }
  return NextResponse.json({ ok: true })
}
