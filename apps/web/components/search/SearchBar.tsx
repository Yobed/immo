'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { COMMUNES_CI, QUARTIERS_PREMIUM } from '@immo-ci/shared/constants/communes'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { Search, MapPin, Home, Building2, X, ArrowRight, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ALL_SUGGESTIONS = [
  ...COMMUNES_CI.map((c) => ({ label: c, category: 'Commune', icon: MapPin })),
  ...QUARTIERS_PREMIUM.map((q) => ({ label: q, category: 'Quartier', icon: MapPin })),
  ...Object.entries(TYPES_BIEN_LABELS).map(([key, label]) => ({ 
    label, 
    category: 'Type', 
    icon: label.toLowerCase().includes('meublée') ? Home : Building2 
  })),
]

interface SearchBarProps {
  placeholder?: string
  className?: string
  initialQuery?: string
}

export function SearchBar({
  placeholder = 'Où souhaitez-vous habiter ?',
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
    startTransition(() => {
      router.push(`/recherche?q=${encodeURIComponent(q.trim())}`)
      setOpen(false)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(query)
  }

  const selectSuggestion = (label: string) => {
    setQuery(label)
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
      <form onSubmit={handleSubmit} className="group flex items-center gap-3 p-1.5 bg-[var(--midnight-muted)] rounded-[1.5rem] border border-[var(--border)] shadow-2xl shadow-black/40 focus-within:border-[var(--accent-luxury)]/50 transition-all duration-300">
        <div className="relative flex-1 flex items-center gap-3 pl-4">
          <Search className={`w-5 h-5 transition-colors duration-300 ${query ? 'text-[var(--accent-luxury)]' : 'text-[var(--text-muted)]'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full bg-transparent py-3 text-base md:text-lg font-display font-medium text-[var(--off-white)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button 
              type="button" 
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="p-1.5 hover:bg-[var(--midnight-light)] rounded-full text-[var(--text-muted)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={isPending || !query.trim()}
          className="flex items-center gap-2 px-6 py-3.5 bg-[var(--accent-luxury)] text-white rounded-2xl font-display font-bold text-sm tracking-wide disabled:opacity-50 hover:opacity-90 hover:shadow-lg hover:shadow-[var(--accent-luxury)]/20 transition-all active:scale-95 translate-all duration-300"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Découvrir
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute z-[100] top-full left-0 right-0 mt-4 overflow-hidden bg-[var(--midnight-muted)]/90 backdrop-blur-xl rounded-[2rem] border border-[var(--border)] shadow-2xl p-2"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-4 py-3 mb-1">
              Suggestions de recherche
            </div>
            <ul className="space-y-1">
              {suggestions.map((s, idx) => (
                <li key={`${s.category}-${s.label}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s.label) }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-4 rounded-xl transition-all duration-200 ${
                      idx === highlighted 
                        ? 'bg-[var(--accent-luxury)]/10 text-[var(--accent-luxury)] translate-x-1' 
                        : 'text-[var(--off-white-muted)] hover:bg-[var(--midnight-light)]'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      idx === highlighted ? 'bg-[var(--accent-luxury)]/20' : 'bg-[var(--midnight-light)]'
                    }`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">{s.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-sans">{s.category}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
