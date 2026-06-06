/**
 * Single source of truth for the Sapphire / BOGBE'S advisor WhatsApp number.
 *
 * Why centralized
 *   The advisor number changes when we rotate the Wasender connection
 *   (new SIM, new test account, business expansion to multiple agents).
 *   Without a central helper, every wa.me link, every footer CTA, every
 *   notif endpoint hardcoded the number — so a rotation became a 20-file
 *   sweep with high risk of leaving stale numbers in production.
 *
 * Env vars
 *   SAPPHIRE_ADVISOR_PHONE        — server-side (webhook, notifications)
 *   NEXT_PUBLIC_ADVISOR_PHONE     — client-side (wa.me links, footer, chat hub)
 *
 * Fallback
 *   The default below is the CURRENT active Wasender number. Keep it in sync
 *   when rotating: this is the safety net if either env var is unset.
 *
 * Format
 *   Always returns E.164 without the leading '+' (e.g. '2250574243752'),
 *   which is what wa.me URLs expect. Use {@link advisorPhoneE164} if you
 *   need the '+225…' variant for display.
 */

const DEFAULT_ADVISOR_PHONE = '2250574243752'

/**
 * Strip every char except digits — accepts '+225 05 74 24 37 52', '225057...',
 * '0574243752', etc. and returns the canonical digits string.
 */
function digitsOnly(input: string): string {
  return input.replace(/\D/g, '')
}

/**
 * Returns the advisor phone in wa.me-compatible format (digits only, no +).
 *
 * Server-side usage automatically prefers SAPPHIRE_ADVISOR_PHONE;
 * client-side usage (after Next.js inlines env at build time) reads
 * NEXT_PUBLIC_ADVISOR_PHONE. Either falls back to DEFAULT_ADVISOR_PHONE
 * if missing.
 */
export function getAdvisorPhone(): string {
  const fromEnv =
    process.env.SAPPHIRE_ADVISOR_PHONE ||
    process.env.NEXT_PUBLIC_ADVISOR_PHONE ||
    DEFAULT_ADVISOR_PHONE
  return digitsOnly(fromEnv)
}

/**
 * Returns the advisor phone in display E.164 format with the leading '+'.
 * Use for UI text ("Appelez-nous au +225 …"), NOT for wa.me URLs.
 */
export function advisorPhoneE164(): string {
  return `+${getAdvisorPhone()}`
}

/**
 * Build a wa.me deep link with an optional pre-filled message.
 *   buildWaMeLink('Bonjour, je cherche…') → https://wa.me/225...?text=...
 */
export function buildWaMeLink(prefilledText?: string): string {
  const base = `https://wa.me/${getAdvisorPhone()}`
  if (!prefilledText) return base
  return `${base}?text=${encodeURIComponent(prefilledText)}`
}
