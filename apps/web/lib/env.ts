/**
 * Environment Variables Validation
 * Ensures all required env vars are set at application startup
 */

// Required environment variables that must be set
const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const

// Optional but useful to document
const OPTIONAL_VARS = [
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'SAPPHIRE_ADVISOR_PHONE',
  'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_META_PIXEL_ID',
] as const

/**
 * Validate required environment variables
 * Call this in server components or API routes
 * @throws Error if any required variable is missing
 */
export function validateEnv(): void {
  const missing: string[] = []

  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nSee .env.example for reference.`
    throw new Error(message)
  }
}

/**
 * Get required environment variable with type safety
 * @throws Error if variable is not set
 */
export function getEnvVar(key: (typeof REQUIRED_VARS)[number]): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Get optional environment variable
 */
export function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key]
}

/**
 * Check if we're in production
 */
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Check if we're in development
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * URL canonique du site, normalisée :
 *  - trim() retire les \r\n trailing (artefact de copy-paste depuis le
 *    dashboard Vercel — bug constaté en juin 2026 qui cassait sitemap.xml,
 *    canonical, og:image et JSON-LD).
 *  - retire trailing slash pour permettre la concat `${SITE_URL}/foo`.
 *  - fallback alias Vercel si l'env var n'est pas définie.
 *
 *  TOUS les fichiers qui génèrent du HTML SEO-visible (sitemap, robots,
 *  metadata canonical, openGraph images, JSON-LD) DOIVENT utiliser cette
 *  constante au lieu de lire `process.env.NEXT_PUBLIC_SITE_URL` directement.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bogbesgroup.com')
  .trim()
  .replace(/\/$/, '')
