'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { COMMUNES_CI, QUARTIERS_PREMIUM } from '@immo-ci/shared/constants/communes'

// Toutes les suggestions = communes + quartiers premium
const ALL_SUGGESTIONS = [
  ...COMMUNES_CI.map((c) => ({ label: c, type: 'commune' as const })),
  ...QUARTIERS_PREMIUM.map((q) => ({ label: q, type: 'quartier' as const })),
]

interface CommuneAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Si true, n'affiche que les communes (pas les quartiers) */
  communeOnly?: boolean
}

export function CommuneAutocomplete({
  value,
  onChange,
  placeholder = 'Commune ou quartier...',
  className = '',
  communeOnly = false,
}: CommuneAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pool = communeOnly
    ? ALL_SUGGESTIONS.filter((s) => s.type === 'commune')
    : ALL_SUGGESTIONS

  const suggestions = value.trim().length === 0
    ? pool.slice(0, 8)  // suggestions par défaut (premières)
    : pool.filter((s) =>
        s.label.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10)

  // Fermer si clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const select = useCallback((label: string) => {
    onChange(label)
    setOpen(false)
    inputRef.current?.blur()
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[highlighted]) select(suggestions[highlighted].label)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(0) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-btn border border-[var(--border)] px-3 py-2 pr-8 text-sm font-sans focus:outline-none focus:border-[var(--accent-luxury)] bg-[var(--midnight-light)] text-[var(--text)] placeholder:text-[var(--text-muted)]"
        />
        {/* Icône loupe / effacer */}
        {value ? (
          <button
            type="button"
            onClick={() => { onChange(''); inputRef.current?.focus(); setOpen(true) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--off-white)] transition-colors"
            tabIndex={-1}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        ) : (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-[100] top-full left-0 right-0 mt-1 bg-[var(--midnight-muted)] border border-[var(--border)] rounded-card shadow-md overflow-hidden backdrop-blur-xl">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.type}-${s.label}`}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(s.label) }}
              onMouseEnter={() => setHighlighted(idx)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-sans transition-colors ${
                idx === highlighted
                  ? 'bg-[var(--accent-luxury)]/10 text-[var(--accent-luxury)]'
                  : 'text-[var(--off-white-muted)] hover:bg-[var(--midnight-light)]'
              }`}
            >
              <span className="flex-shrink-0 flex items-center justify-center w-4 h-4">
                {s.type === 'commune' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                    <rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                  </svg>
                )}
              </span>
              <span className="flex-1">{s.label}</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] opacity-60">{s.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
