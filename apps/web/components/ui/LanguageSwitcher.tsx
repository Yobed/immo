'use client'
import { useState } from 'react'
import { Globe } from 'lucide-react'
import { LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n/config'
import { useI18n } from '@/lib/i18n/client'

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full'
  className?: string
}

export function LanguageSwitcher({ variant = 'compact', className = '' }: LanguageSwitcherProps) {
  const { locale, t } = useI18n()
  const [isPending, setIsPending] = useState(false)

  const setLocale = (next: Locale) => {
    if (next === locale || isPending) return
    setIsPending(true)
    // Cookie 1 an, accessible sur tout le site, supporte HTTPS et HTTP
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${isHttps ? '; Secure' : ''}`
    // Hard reload pour garantir que tous les composants serveur ET client se re-rendent avec le nouveau dictionnaire
    if (typeof window !== 'undefined') window.location.reload()
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`} role="group" aria-label={t.language.switch}>
        <Globe className="w-3.5 h-3.5 text-slate-400" aria-hidden />
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            disabled={isPending}
            aria-pressed={l === locale}
            className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
              l === locale
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-900'
            } disabled:opacity-50`}
          >
            {l}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <label htmlFor="locale-select" className="sr-only">
        {t.language.switch}
      </label>
      <Globe className="w-4 h-4 text-slate-400" aria-hidden />
      <select
        id="locale-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        disabled={isPending}
        className="bg-transparent text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent-luxury/50"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {t.language[l]}
          </option>
        ))}
      </select>
    </div>
  )
}
