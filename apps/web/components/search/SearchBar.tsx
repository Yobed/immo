'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { COMMUNES_CI, QUARTIERS_PREMIUM } from '@immo-ci/shared/constants/communes'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { Search, MapPin, Home, Building2, X, ArrowRight, Loader2, Mic, MicOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
import { cn } from '@/lib/utils'

const TYPEWRITER_PLACEHOLDERS = [
  'Studio meublé à Cocody...',
  'Villa avec piscine à Riviera...',
  'Appartement 2 pièces au Plateau...',
  'Maison à Bingerville...',
  'Bureau climatisé Zone 4...',
  'Moins de 300k/mois à Yopougon...',
]

// Délais machine à écrire (ms) — réglés pour lisibilité confortable
const TYPING_SPEED  = 75
const ERASING_SPEED = 35
const PAUSE_AFTER_TYPED  = 3000
const PAUSE_AFTER_ERASED = 500

// Version: 1.0.3 (Force mobile visibility)
// Cache-bust: 2026-04-20_14-00

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
  disableTypewriter?: boolean
}

export function SearchBar({
  placeholder = 'Où souhaitez-vous habiter ?',
  className = '',
  initialQuery = '',
  disableTypewriter = false,
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [isPending, startTransition] = useTransition()
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceSearch()
  const [focused, setFocused] = useState(false)
  const [displayed, setDisplayed]     = useState('')
  const [phraseIdx, setPhraseIdx]     = useState(0)
  const [phase, setPhase]             = useState<'typing' | 'pausing' | 'erasing' | 'waiting'>('typing')
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

  useEffect(() => {
    if (transcript) {
      setQuery(transcript)
      // Small timeout to allow the user to see the transcript before searching
      const timer = setTimeout(() => {
        navigate(transcript)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [transcript])

  useEffect(() => {
    const target = TYPEWRITER_PLACEHOLDERS[phraseIdx]
    let timer: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (displayed.length < target.length) {
        timer = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), TYPING_SPEED)
      } else {
        timer = setTimeout(() => setPhase('pausing'), PAUSE_AFTER_TYPED)
      }
    } else if (phase === 'pausing') {
      timer = setTimeout(() => setPhase('erasing'), 0)
    } else if (phase === 'erasing') {
      if (displayed.length > 0) {
        timer = setTimeout(() => setDisplayed(d => d.slice(0, -1)), ERASING_SPEED)
      } else {
        timer = setTimeout(() => setPhase('waiting'), PAUSE_AFTER_ERASED)
      }
    } else {
      // waiting → passe à la phrase suivante
      setPhraseIdx(i => (i + 1) % TYPEWRITER_PLACEHOLDERS.length)
      setPhase('typing')
    }

    return () => clearTimeout(timer)
  }, [phase, displayed, phraseIdx])

  const navigate = (textQuery: string) => {
    startTransition(() => {
      import('@/lib/searchParser').then(({ parseSearchQuery }) => {
        const p = parseSearchQuery(textQuery)
        const search = new URLSearchParams()
        if (p.q) search.set('q', p.q)
        if (p.commune) search.set('commune', p.commune)
        if (p.type_bien) search.set('type_bien', p.type_bien)
        if (p.equipements && p.equipements.length > 0) search.set('equipements', p.equipements.join(','))
        if (p.prix_max) search.set('prix_max', p.prix_max)
        
        router.push(`/recherche?${search.toString()}`)
        setOpen(false)
      })
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
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form 
        onSubmit={handleSubmit} 
        className="group flex items-center gap-1.5 p-1.5 bg-[var(--surface-card)] rounded-2xl border border-[var(--border)] shadow-md focus-within:border-[var(--accent-luxury)] transition-all duration-300"
      >
        <div className="flex-1 flex items-center gap-1.5 pl-2 relative overflow-hidden">
          <Search className={cn(
            "w-4 h-4 shrink-0 transition-colors duration-300",
            query ? "text-[var(--accent-luxury)]" : "text-[var(--text-muted)]"
          )} />
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true) }}
              onFocus={() => { setFocused(true); setOpen(true) }}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              placeholder={disableTypewriter ? (placeholder || 'Rechercher...') : undefined}
              className="w-full bg-transparent py-2 text-sm font-sans text-[var(--text)] focus:outline-none min-w-0 placeholder:text-[var(--text-muted)]"
            />
            {/* Placeholder machine à écrire — visible si vide, non focalisé, et activé */}
            {!query && !focused && !disableTypewriter && (
              <div className="absolute inset-0 flex items-center pointer-events-none select-none">
                <span className="text-base font-sans text-[var(--text-muted)] truncate max-w-full pr-4">
                  {displayed}
                  <span className="inline-block w-[2px] h-[1em] bg-[var(--accent-luxury)] ml-[1px] align-middle animate-[caret_1s_step-end_infinite]" />
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pr-1 shrink-0">
          <button
            type="button"
            disabled={!isSupported}
            onClick={() => isListening ? stopListening() : startListening()}
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300",
              isListening
                ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-[mic-blink_1s_infinite]"
                : "text-[var(--accent-luxury)] bg-accent-luxury/10 hover:bg-accent-luxury/20 border border-transparent hover:border-accent-luxury/20",
              !isSupported && "hidden"
            )}
            title={isSupported ? "Recherche vocale" : "Recherche vocale non supportée par votre navigateur"}
          >
            {isListening
              ? <MicOff size={18} />
              : <Mic size={18} className="animate-pulse" />
            }
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-6 sm:py-2.5 bg-[var(--accent-luxury)] text-[var(--on-accent)] rounded-xl sm:rounded-2xl font-display font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-[0_8px_16px_rgba(249,115,22,0.3)] active:scale-95 transition-all duration-300"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Explorer</span>
                <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Listening Wave Overlay (Subtle) */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-[200] top-full left-0 right-0 mt-2 overflow-hidden bg-[var(--surface-card)] border border-accent-luxury/30 rounded-2xl shadow-md p-6 text-center"
          >
            <div className="flex justify-center gap-1.5 h-8 items-center mb-4">
              {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-[var(--accent-luxury)] rounded-full"
                  style={{
                    height: '30%',
                    animation: `quiet 0.8s ease-in-out infinite h-${h}`,
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>
            <p className="text-[var(--accent-luxury)] text-xs font-bold uppercase tracking-widest animate-pulse mb-1">
              À votre écoute...
            </p>
            <p className="text-[var(--text-muted)] text-[10px] italic">
              "Appartement de luxe à Cocody"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute z-[200] top-full left-0 right-0 mt-2 overflow-hidden bg-slate-900 border border-white/10 rounded-2xl shadow-md p-2"
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
                        ? 'bg-accent-luxury/10 text-[var(--accent-luxury)] translate-x-1' 
                        : 'text-[var(--text)] hover:bg-[var(--midnight-light)]'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      idx === highlighted ? 'bg-accent-luxury/20' : 'bg-[var(--midnight-light)]'
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
