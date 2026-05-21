/**
 * Helpers honeypot — détection bot via champ invisible.
 *
 * Le composant React `<Honeypot />` ajoute un champ caché (offscreen).
 * Les humains ne le voient pas → restent vide.
 * Les bots remplissent tout naïvement → champ rempli.
 */

/** Nom du champ honeypot — doit matcher entre composant et validation */
export const HONEYPOT_NAME = '_address2_zip'

/** Côté client : vérifie un FormData */
export function isHoneypotFilled(fd: FormData): boolean {
  const v = fd.get(HONEYPOT_NAME)
  return typeof v === 'string' && v.trim().length > 0
}

/** Côté server (API route) : vérifie un body JSON parsé */
export function isHoneypotFilledInBody(body: Record<string, unknown> | null | undefined): boolean {
  if (!body) return false
  const v = body[HONEYPOT_NAME]
  return typeof v === 'string' && v.trim().length > 0
}
