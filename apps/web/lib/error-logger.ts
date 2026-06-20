/**
 * Logger d'erreurs runtime — stocke dans Supabase table `error_logs`.
 *
 * Usage typique :
 *   try {
 *     await somethingRisky()
 *   } catch (err) {
 *     await logError(err, { source: 'api', route: '/api/visites', userId: user.id })
 *     return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
 *   }
 *
 * Non-bloquant : si l'insert Supabase échoue, on log en console et on continue.
 * Le but est d'éviter de doubler une erreur en cassant le logger lui-même.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

export interface ErrorContext {
  /** Source du log : 'api', 'server-action', 'page', 'webhook', etc. */
  source?: string
  /** Route concernée (ex: '/api/reservations') */
  route?: string
  /** User connecté au moment de l'erreur (UUID Supabase) */
  userId?: string | null
  /** Données additionnelles (params, body, headers utiles) — pas de secrets ! */
  extra?: Record<string, unknown>
  /** Level : 'error' (default) | 'warn' | 'info' */
  level?: 'error' | 'warn' | 'info'
}

/**
 * Génère un fingerprint stable à partir du message + route. Permet de
 * grouper les occurrences identiques au lieu de spammer la table.
 */
function makeFingerprint(message: string, route: string | undefined): string {
  const normalized = message
    .replace(/\d+/g, 'N') // remplace nombres (id, ports, timestamps) par N
    .replace(/['"]/g, '') // ignore quotes
    .toLowerCase()
    .slice(0, 200)
  const input = `${normalized}|${route ?? ''}`
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

/**
 * Log une erreur dans Supabase. Non-bloquant : si le logger plante, on continue.
 * Tronque les champs pour éviter de dépasser les limites Postgres.
 */
export async function logError(
  error: unknown,
  context: ErrorContext = {},
): Promise<void> {
  try {
    const message = (() => {
      if (error instanceof Error) return error.message
      if (typeof error === 'string') return error
      try { return JSON.stringify(error) } catch { return 'Unknown error' }
    })().slice(0, 500)

    const stack = error instanceof Error && error.stack
      ? error.stack.slice(0, 5000)
      : null

    const fingerprint = makeFingerprint(message, context.route)

    const sanitizedExtra = sanitizeContext(context.extra)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    await supabase.from('error_logs').insert({
      level: context.level ?? 'error',
      message,
      stack,
      context: sanitizedExtra,
      source: context.source ?? null,
      route: context.route ?? null,
      user_id: context.userId ?? null,
      fingerprint,
    })
  } catch (loggerErr) {
    // Le logger lui-même a planté — on ne peut rien faire de mieux que console.error
    // Important : NE PAS rethrow, sinon on casse le caller
    // eslint-disable-next-line no-console
    console.error('[error-logger] Failed to log error:', loggerErr, '\nOriginal error:', error)
  }
}

/**
 * Retire les valeurs sensibles potentielles (password, token, key, secret)
 * du contexte avant insertion. Garde la structure JSON.
 */
function sanitizeContext(extra: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!extra) return {}
  const result: Record<string, unknown> = {}
  const SENSITIVE_KEYS = /password|token|secret|api[_-]?key|authorization|cookie|session/i

  for (const [key, value] of Object.entries(extra)) {
    if (SENSITIVE_KEYS.test(key)) {
      result[key] = '[REDACTED]'
      continue
    }
    if (typeof value === 'string' && value.length > 1000) {
      result[key] = value.slice(0, 1000) + '...[truncated]'
    } else if (typeof value === 'object' && value !== null) {
      try {
        const str = JSON.stringify(value)
        result[key] = str.length > 1000 ? str.slice(0, 1000) + '...[truncated]' : value
      } catch {
        result[key] = '[unserializable]'
      }
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Wrapper pratique pour les routes API : log l'erreur ET retourne une réponse JSON.
 *
 * Usage :
 *   export async function POST(req: NextRequest) {
 *     try {
 *       // ... logique ...
 *     } catch (err) {
 *       return logAndRespond(err, req, { route: '/api/visites' })
 *     }
 *   }
 */
export async function logAndRespond(
  error: unknown,
  request: Request,
  context: Omit<ErrorContext, 'route'> = {},
): Promise<Response> {
  const url = new URL(request.url)
  await logError(error, {
    ...context,
    source: context.source ?? 'api',
    route: url.pathname,
  })
  return new Response(
    JSON.stringify({ error: 'Erreur interne. Notre équipe a été notifiée.' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } },
  )
}
