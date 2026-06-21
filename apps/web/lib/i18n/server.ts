import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config'
import frDict from './dictionaries/fr.json'
import enDict from './dictionaries/en.json'

export type Dictionary = typeof frDict

const DICTIONARIES: Record<Locale, Dictionary> = {
  fr: frDict,
  en: enDict,
}

/** Detect locale: cookie first, then DEFAULT_LOCALE (fr).
 *
 *  On NE détecte PAS Accept-Language : sur le marché ivoirien, beaucoup de
 *  téléphones sont configurés en en-US par défaut alors que l'utilisateur
 *  est francophone. Basculer en EN sans son consentement explicite fait
 *  bouncer 40-60% des visiteurs. Seul le toggle FR/EN du header (qui pose
 *  le cookie NEXT_LOCALE) doit faire passer en EN.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie

  return DEFAULT_LOCALE
}

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const l = locale ?? (await getLocale())
  return DICTIONARIES[l]
}
