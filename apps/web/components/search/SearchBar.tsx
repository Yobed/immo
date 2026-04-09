'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { COMMUNES_CI, QUARTIERS_PREMIUM } from '@immo-ci/shared/constants/communes'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'

// Pool de suggestions statique — pas de useSearchParams
const ALL_SUGGESTIONS = [
  ...COMMUNES_CI.map((c) => ({ label: c, category: 'Commune', icon: '🏙️' })),
  ...QUARTIERS_PREMIUM.map((q) => ({ label: q, category: 'Quartier', icon: '📍' })),
  ...Object.values(TYPES_BIEN_LABELS).map((label) => ({ label, category: 'Type', icon: '🏠' })),
]

interface SearchBarProps {
  placeholder?: string
  className?: string
  initialQuery?: string
}

export function SearchBar({
  placeholder = 'Commune, quartier, type de bien...',
  className = '',
  initialQuery = '',
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = query.trim().length === 0
    ? ALL_SUGGESTIONS.slice(0, 6)
    : ALL_SUGGESTIONS.filter((s) =>
        s.label.toLowerCase().includes(query.trim().toLowerCase())
      ).slice(0, 8)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const navigate = (q: string) => {
    startTransition(() => router.push(`/recherche?q=${encodeURIComponent(q.trim())}`))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(false)
    if (query.trim()) navigate(query)
  }

  const selectSuggestion = (label: string) => {
    setQuery(label)
    setOpen(false)
    navigate(label)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && e.key === 'ArrowDown') { setOpen(true); return }
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && suggestions[highlighted]) { e.preventDefault(); selectSuggestion(suggestions[highlighted].label) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full rounded-btn border border-[var(--border)] pl-9 pr-8 py-2.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          {query && (
            <button type="button" tabIndex={-1}
              onClick={() => { setQuery(''); inputRef.current?.focus(); setOpen(true) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-[var(--text)]">
              <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        <button type="submit" disabled={isPending}
          className="flex-shrink-0 px-4 py-2.5 bg-primary text-white text-sm font-sans font-medium rounded-btn hover:bg-primary/90 disabled:opacity-70 transition-colors">
          {isPending ? '…' : 'Chercher'}
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[100] top-full left-0 right-0 mt-1 bg-white border border-[var(--border)] rounded-card shadow-lg overflow-hidden">
          {suggestions.map((s, idx) => (
            <li key={`${s.category}-${s.label}`}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s.label) }}
                onMouseEnter={() => setHighlighted(idx)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 text-sm font-sans border-b border-[var(--border)] last:border-b-0 transition-colors ${
                  idx === highlighted ? 'bg-primary/8 text-primary' : 'text-[var(--text)] hover:bg-[var(--surface)]'
                }`}
              >
                <span className="w-5 text-center flex-shrink-0">{s.icon}</span>
                <span className="flex-1 font-medium">{s.label}</span>
                <span className="text-xs text-muted">{s.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
