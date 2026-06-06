/**
 * Secure Server-Side Logger
 * Logs structured data without leaking PII or sensitive information
 */

export const logger = {
  /**
   * Log errors with context, but never include user messages or PII
   * Usage: logger.error('payment_failed', {userId, errorCode: 'TIMEOUT'})
   */
  error: (context: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, meta)
    }
    // In production, send to Sentry/observability service
    // sentry.captureException(new Error(context), {extra: meta})
  },

  /**
   * Log warnings with context
   */
  warn: (context: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${context}]`, meta)
    }
  },

  /**
   * Log info (non-sensitive operational events)
   */
  info: (context: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[${context}]`, meta)
    }
  },
}
