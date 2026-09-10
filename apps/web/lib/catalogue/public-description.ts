/** Remove markup and direct contact details from third-party listing text. */
export function publicDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/gi, ' ')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, ' ')
    .replace(/(?:\+|00)?225(?:[\s().-]*\d){8,10}/g, ' ')
    .replace(/(?<!\d)0[157](?:[\s().-]*\d){8}(?!\d)/g, ' ')
    // Hashtags are useful for the source publisher, but add noise to the
    // public listing and can expose identifying campaign labels.
    .replace(/#[\p{L}\p{N}_-]+/gu, ' ')
    // Keep line breaks as meaningful separators for the detail-page parser.
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\r?\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+([,.;:])/g, '$1')
    .replace(/([,.;:])[ \t]{2,}/g, '$1 ')
    .trim()
  return text || null
}
