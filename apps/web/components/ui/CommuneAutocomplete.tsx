'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { MapPin, X } from 'lucide-react'
import { COMMUNES_CI, QUARTIERS_PREMIUM } from '@immo-ci/shared/constants/communes'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * Input autocomplete pour les communes / quartiers d'Abidjan.
 * Liste fournie par @immo-ci/shared/constants/communes.
 * Évite les erreurs de saisie ("cocodi", "rivieria"...) qui font rater des biens.
 */
export function CommuneAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = 'Commune ou quartier...',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const all = useMemo(() => {
    return [
      ...COMMUNES_CI.map((c) => ({ label: c, type: 'Commune' as const })),
      ...QUARTIERS_PREMIUM.map((q) => ({ label: q, type: 'Quartier' as const })),
    ]
  }, [])

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return all.slice(0, 8)
    return all
      .filter((s) => s.label.toLowerCase().includes(q))
      .sort((a, b) => {
        // Priorité aux matches préfixe
        const aPrefix = a.label.toLowerCase().startsWith(q)
        const bPrefix = b.label.toLowerCase().startsWith(q)
        if (aPrefix && !bPrefix) return -1
        if (!aPrefix && bPrefix) return 1
        return a.label.length - b.label.length
      })
      .slice(0, 8)
  }, [value, all])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(label: string) {
    onChange(label)
    setOpen(false)
    onSubmit?.(label)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && e.key === 'ArrowDown') {
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (suggestions[highlighted]) {
        e.preventDefault()
        select(suggestions[highlighted].label)
      } else if (value.trim()) {
        e.preventDefault()
        onSubmit?.(value.trim())
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 focus-within:border-[var(--accent-luxury)] transition-colors">
        <MapPin className="w-4 h-4 text-[var(--accent-luxury)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setHighlighted(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]/40 min-w-0"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            aria-label="Effacer"
            className="w-5 h-5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--surface-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          <ul className="py-1">
            {suggestions.map((s, idx) => (
              <li key={`${s.type}-${s.label}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    select(s.label)
                  }}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={cn(
                    'w-full text-left px-3 py-2 flex items-center justify-between gap-2 text-sm transition-colors',
                    idx === highlighted
                      ? 'bg-[var(--accent-luxury)]/10 text-[var(--accent-luxury)]'
                      : 'text-[var(--text)] hover:bg-[var(--surface)]',
                  )}
                >
                  <span className="font-medium truncate">{s.label}</span>
                  <span className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] shrink-0">
                    {s.type}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
