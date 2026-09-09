/**
 * Formats an Ivorian phone number for wa.me links.
 *
 * Profiles can contain +225 numbers, 00-prefixed international numbers, or
 * local numbers such as 05 44 87 20 51. WhatsApp's wa.me endpoint only
 * accepts digits in international format, so keep one canonical conversion
 * for every admin contact action.
 */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null

  let digits = phone.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('225')) return digits

  // Côte d'Ivoire local format: 10 digits, including the leading 0.
  // Older records may contain 8 or 9 digits without that leading 0.
  if (digits.length <= 10) return `225${digits}`

  // Preserve an already international number from another country rather
  // than silently attaching the Ivorian country code to malformed data.
  return digits
}

export function whatsappLink(
  phone: string | null | undefined,
  text?: string,
): string | null {
  const normalized = normalizeWhatsAppPhone(phone)
  if (!normalized) return null
  return `https://wa.me/${normalized}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
