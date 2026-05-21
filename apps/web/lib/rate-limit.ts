/**
 * Rate limiter en mémoire (sliding window) — pour protéger les routes
 * publiques (visite, réservation, contact) contre le spam.
 *
 * Limites :
 * - Par IP (extrait via x-forwarded-for ou x-real-ip)
 * - Sliding window (par défaut 10 requêtes / 60 sec)
 *
 * ⚠️ In-memory : NE marche que sur un seul process/worker.
 * Pour scale-out (plusieurs instances Vercel), passer à Upstash Redis.
 * En pratique pour BOGBE'S, Vercel sert depuis 1 région → suffisant.
 */
import type { NextRequest } from 'next/server'

interface Bucket {
  hits: number[]
}

const STORE = new Map<string, Bucket>()
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 min

let lastCleanup = Date.now()

function cleanup(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of STORE.entries()) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs)
    if (bucket.hits.length === 0) STORE.delete(key)
  }
}

export interface RateLimitOptions {
  /** Identifiant unique de l'endpoint (ex: 'visite-create') */
  scope: string
  /** Nombre max de requêtes autorisées dans la fenêtre */
  max: number
  /** Taille de la fenêtre en millisecondes */
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  /** Nombre de hits restants dans la fenêtre */
  remaining: number
  /** Timestamp (ms) à partir duquel la limite est levée */
  resetAt: number
}

export function getClientIp(req: Request | NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return 'unknown'
}

/**
 * Vérifie et incrémente le compteur. Retourne `ok: false` si la limite est atteinte.
 *
 * Usage:
 * ```ts
 * const result = checkRateLimit(req, { scope: 'visite', max: 5, windowMs: 60_000 })
 * if (!result.ok) return new Response('Too Many Requests', { status: 429 })
 * ```
 */
export function checkRateLimit(req: Request | NextRequest, opts: RateLimitOptions): RateLimitResult {
  const ip = getClientIp(req)
  const key = `${opts.scope}:${ip}`
  const now = Date.now()
  cleanup(now, opts.windowMs)

  const bucket = STORE.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < opts.windowMs)

  if (bucket.hits.length >= opts.max) {
    const oldest = bucket.hits[0]!
    return {
      ok: false,
      remaining: 0,
      resetAt: oldest + opts.windowMs,
    }
  }

  bucket.hits.push(now)
  STORE.set(key, bucket)

  return {
    ok: true,
    remaining: opts.max - bucket.hits.length,
    resetAt: now + opts.windowMs,
  }
}

/**
 * Helper pour retourner une 429 standardisée.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return new Response(
    JSON.stringify({
      error: 'too_many_requests',
      message: 'Trop de requêtes — patientez un instant avant de réessayer.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    },
  )
}
