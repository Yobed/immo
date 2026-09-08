/** Remove markup and direct contact details from third-party listing text. */
export function publicDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/gi, '[lien retiré]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[contact retiré]')
    .replace(/(?:\+|00)?225(?:[\s().-]*\d){8,10}/g, '[contact retiré]')
    .replace(/(?<!\d)0[157](?:[\s().-]*\d){8}(?!\d)/g, '[contact retiré]')
    .replace(/\s+/g, ' ')
    .trim()
  return text || null
}
