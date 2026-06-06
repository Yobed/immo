/**
 * In-memory idempotency cache for short-lived deduplication.
 *
 * Use case: Wasender retries a webhook on transient failure
 *   → same message arrives 2× within seconds
 *   → without dedup we'd save it 2×, call the LLM 2×, send 2 replies.
 *
 * Trade-offs:
 *   - In-memory only (per Vercel cold container). Two cold instances handling
 *     the same duplicate webhook would each process once. For Wasender retries
 *     which happen within ~1s on the same instance, this is sufficient.
 *   - Not for cross-region multi-instance safety — use Postgres unique constraint
 *     on (message_id) if you need that guarantee.
 *
 * API
 *   markSeen(key, ttlMs)  → true if first time, false if already seen
 *   getCached(key)        → previously-stored value if any
 *   setCached(key, value) → store an arbitrary payload alongside the marker
 */

interface CacheEntry<T> {
  value: T | undefined
  expiresAt: number
}

const STORE: Map<string, CacheEntry<unknown>> = new Map()
const MAX_ENTRIES = 1000

/**
 * Drop expired entries. Called opportunistically — keeps the map bounded
 * without a setInterval (which doesn't survive Vercel function teardown).
 */
function purgeExpired(now: number): void {
  if (STORE.size < MAX_ENTRIES) return
  for (const [k, v] of STORE.entries()) {
    if (v.expiresAt <= now) STORE.delete(k)
  }
  // Defensive: if we're still over capacity (everything fresh), drop oldest 25 %
  if (STORE.size >= MAX_ENTRIES) {
    const dropCount = Math.floor(MAX_ENTRIES * 0.25)
    const it = STORE.keys()
    for (let i = 0; i < dropCount; i++) {
      const next = it.next()
      if (next.done) break
      STORE.delete(next.value)
    }
  }
}

/**
 * Marks the key as seen and returns whether this was the first time.
 *
 * @returns true if the key was NOT in the cache (first occurrence)
 *          false if it was already there (duplicate)
 */
export function markSeen(key: string, ttlMs = 30_000): boolean {
  const now = Date.now()
  purgeExpired(now)

  const existing = STORE.get(key)
  if (existing && existing.expiresAt > now) {
    return false
  }
  STORE.set(key, { value: undefined, expiresAt: now + ttlMs })
  return true
}

/**
 * Get a previously-cached value for this key.
 */
export function getCached<T>(key: string): T | undefined {
  const entry = STORE.get(key)
  if (!entry || entry.expiresAt <= Date.now()) return undefined
  return entry.value as T | undefined
}

/**
 * Set a value for the key. Resets the TTL window.
 */
export function setCached<T>(key: string, value: T, ttlMs = 30_000): void {
  const now = Date.now()
  purgeExpired(now)
  STORE.set(key, { value, expiresAt: now + ttlMs })
}
