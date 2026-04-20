import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CommuneAutocomplete } from '@/components/search/CommuneAutocomplete'
import { TYPES_BIEN, TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface SmartFilterProps {
  onFilterChange: (filters: {
    prixMax: string;
    commune: string;
    typeBien: string;
  }) => void;
}

export function SmartFilter({ onFilterChange }: SmartFilterProps) {
  const [prixMax, setPrixMax] = useState('')
  const [commune, setCommune] = useState('')
  const [typeBien, setTypeBien] = useState('')
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceSearch()

  // ── Intelligent Voice Command Parser ──────────────────────────────────────
  useEffect(() => {
    if (transcript) {
      const lower = transcript.toLowerCase()
      let newPrix = prixMax
      let newCommune = commune
      let newType = typeBien

      // 1. Extract Price (Numbers > 1000)
      const priceMatch = lower.match(/\d+[\s\d]*/g)
      if (priceMatch) {
        const val = parseInt(priceMatch[0].replace(/\s/g, ''))
        if (val >= 1000) newPrix = val.toString()
      }

      // 2. Extract Location (Keywords)
      const locations = ['cocody', 'marcory', 'riviera', 'bassam', 'assam', 'plateau', 'treichville', 'yopougon', 'abobo', 'assinie']
      for (const loc of locations) {
        if (lower.includes(loc)) {
          newCommune = loc.charAt(0).toUpperCase() + loc.slice(1)
          break
        }
      }

      // 3. Extract Type
      if (lower.includes('villa')) newType = 'villa'
      else if (lower.includes('appartement')) newType = 'appartement'
      else if (lower.includes('studio')) newType = 'studio'
      else if (lower.includes('meubl')) newType = 'residence_meublee'

      setPrixMax(newPrix)
      setCommune(newCommune)
      setTypeBien(newType)
      onFilterChange({ prixMax: newPrix, commune: newCommune, typeBien: newType })
    }
  }, [transcript])

  const handleApply = () => {
    onFilterChange({ prixMax, commune, typeBien })
  }

  const activeCount = useMemo(() => {
    let count = 0
    if (prixMax) count++
    if (commune) count++
    if (typeBien) count++
    return count
  }, [prixMax, commune, typeBien])

  return (
    <div className="w-full mb-10">
      <div className="flex flex-wrap items-center gap-4 bg-[var(--midnight-muted)]/50 border border-[var(--border)] p-2 rounded-2xl backdrop-blur-md">
        
        {/* Quick Range / Budget */}
        <div className="flex-1 min-w-[200px] relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent-luxury)] opacity-50 group-focus-within:opacity-100 transition-opacity">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <input
            type="number"
            value={prixMax}
            onChange={(e) => {
              setPrixMax(e.target.value)
              onFilterChange({ prixMax: e.target.value, commune, typeBien })
            }}
            placeholder="Budget max (FCFA)..."
            className="w-full bg-[var(--midnight-light)]/40 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm font-sans focus:ring-1 focus:ring-[var(--accent-luxury)]/30 transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Location Dropdown (Smart Search) */}
        <div className="flex-[1.5] min-w-[280px]">
          <CommuneAutocomplete
            value={commune}
            onChange={(val) => {
              setCommune(val)
              onFilterChange({ prixMax, commune: val, typeBien })
            }}
            className="!bg-transparent"
          />
        </div>

        {/* Type Filter */}
        <div className="hidden lg:flex items-center gap-1 bg-[var(--background)] px-2 py-1 rounded-xl border border-[var(--border)]">
          <button 
            onClick={() => {
              setTypeBien('')
              onFilterChange({ prixMax, commune, typeBien: '' })
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all",
              !typeBien ? "bg-[var(--accent-luxury)] text-[var(--midnight)]" : "text-[var(--text-muted)] hover:text-[var(--off-white)]"
            )}
          >
            Tous
          </button>
          {['villa', 'appartement', 'studio', 'residence_meublee'].map((t) => (
            <button 
              key={t}
              onClick={() => {
                const newVal = typeBien === t ? '' : t
                setTypeBien(newVal)
                onFilterChange({ prixMax, commune, typeBien: newVal })
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all whitespace-nowrap",
                typeBien === t ? "bg-[var(--accent-luxury)] text-[var(--midnight)]" : "text-[var(--text-muted)] hover:text-[var(--off-white)]"
              )}
            >
              {TYPES_BIEN_LABELS[t as keyof typeof TYPES_BIEN_LABELS] || t}
            </button>
          ))}
        </div>

        {/* Mobile Type Trigger */}
        <div className="lg:hidden">
            <select 
                value={typeBien}
                onChange={(e) => {
                    setTypeBien(e.target.value)
                    onFilterChange({ prixMax, commune, typeBien: e.target.value })
                }}
                className="bg-[var(--midnight-light)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-sans text-[var(--text)]"
            >
                <option value="">Tous les types</option>
                {TYPES_BIEN.map(t => (
                    <option key={t} value={t}>{TYPES_BIEN_LABELS[t as keyof typeof TYPES_BIEN_LABELS] || t}</option>
                ))}
            </select>
        </div>

        {/* Voice Search Component */}
        {isSupported && (
          <div className="relative">
            <button
              onClick={() => isListening ? stopListening() : startListening()}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 animate-pulse",
                isListening 
                  ? "bg-red-500/20 border-red-500 text-red-500" 
                  : "bg-[var(--midnight-light)]/40 border-[var(--accent-luxury)]/40 text-[var(--accent-luxury)] hover:border-[var(--accent-luxury)]"
              )}
              title="Recherche Vocale"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              
              {isListening && (
                <div className="absolute -inset-1 rounded-xl border border-red-500/50 animate-ping opacity-20" />
              )}
            </button>
            
            {/* Listening Wave Interface Overlay */}
            {isListening && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                 <div className="bg-[#0a0a18]/90 border border-[var(--accent-luxury)]/30 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-[0_0_100px_rgba(212,175,55,0.1)]">
                    <div className="flex gap-1.5 h-12 items-center">
                       {[1,2,3,4,5,6,3,2,4,2].map((h, i) => (
                         <div 
                           key={i} 
                           className="w-1.5 bg-[var(--accent-luxury)] rounded-full"
                           style={{ 
                             height: '20%',
                             animation: `quiet 0.8s ease-in-out infinite h-${h}`,
                             animationDelay: `${i * 0.05}s`
                           }}
                         />
                       ))}
                    </div>
                    <p className="text-[var(--accent-luxury)] text-xs font-bold uppercase tracking-widest animate-pulse">
                        À votre écoute...
                    </p>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* Clear Button */}
        {activeCount > 0 && (
          <button 
            onClick={() => {
              setPrixMax('')
              setCommune('')
              setTypeBien('')
              onFilterChange({ prixMax: '', commune: '', typeBien: '' })
            }}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold">Suggestions :</span>
        {['Cocody', 'Riviera', 'Assinie', 'Villa avec Piscine'].map((s) => (
           <button 
            key={s}
            onClick={() => {
              if (s === 'Villa avec Piscine') {
                setTypeBien('villa')
                onFilterChange({ prixMax, commune, typeBien: 'villa' })
              } else {
                setCommune(s)
                onFilterChange({ prixMax, commune: s, typeBien })
              }
            }}
            className="text-[10px] text-[var(--accent-luxury)]/70 hover:text-[var(--accent-luxury)] transition-colors border-b border-transparent hover:border-[var(--accent-luxury)] pb-0.5"
           >
             {s}
           </button>
        ))}
      </div>
    </div>
  )
}
