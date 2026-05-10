import 'server-only'
import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config'
import frDict from './dictionaries/fr.json'
import enDict from './dictionaries/en.json'

export type Dictionary = typeof frDict

const DICTIONARIES: Record<Locale, Dictionary> = {
  fr: frDict,
  en: enDict,
}

/** Detect locale: cookie first, then Accept-Language header, then default. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie

  const headerStore = await headers()
  const accept = headerStore.get('accept-language') ?? ''
  const primary = accept.split(',')[0]?.split('-')[0]?.toLowerCase()
  if (isLocale(primary)) return primary

  return DEFAULT_LOCALE
}

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const l = locale ?? (await getLocale())
  return DICTIONARIES[l]
}
