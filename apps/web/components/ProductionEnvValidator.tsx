'use client'

import { useEffect } from 'react'

/**
 * Production Environment Validator
 * Runs only in browser, only in production
 * Alerts if required env vars are missing
 */
export function ProductionEnvValidator() {
  useEffect(() => {
    // Only validate in production
    if (process.env.NODE_ENV !== 'production') return

    // Check if critical vars are defined (minimal check - full validation at API layer)
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]

    const missing = requiredVars.filter(
      (v) => !process.env[`NEXT_PUBLIC_${v.replace('NEXT_PUBLIC_', '')}`]
    )

    if (missing.length > 0) {
      console.error(
        '[ProductionEnvValidator] Missing environment variables:',
        missing
      )
    }
  }, [])

  return null
}
