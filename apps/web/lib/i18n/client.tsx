'use client'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Locale } from './config'
import frDict from './dictionaries/fr.json'
import enDict from './dictionaries/en.json'

export type Dictionary = typeof frDict

const CLIENT_DICTIONARIES: Record<Locale, Dictionary> = { fr: frDict, en: enDict }

interface I18nContextValue {
  locale: Locale
  t: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

interface I18nProviderProps {
  locale: Locale
  children: ReactNode
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: CLIENT_DICTIONARIES[locale] }),
    [locale],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}

export function useT(): Dictionary {
  return useI18n().t
}
