'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui'
import { CommuneAutocomplete } from './CommuneAutocomplete'
import {
  TYPES_BIEN,
  TYPES_BIEN_LABELS,
  EQUIPEMENTS_DISPONIBLES,
  EQUIPEMENTS_LABELS,
} from '@immo-ci/shared/constants/biens'
import { cn } from '@/lib/utils'

export function SearchFilters({ onApply }: { onApply?: () => void } = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [commune, setCommune] = useState(searchParams.get('commune') ?? '')
  const [prixMin, setPrixMin] = useState(searchParams.get('prix_min') ?? '')
  const [prixMax, setPrixMax] = useState(searchParams.get('prix_max') ?? '')
  const [typeBien, setTypeBien] = useState(searchParams.get('type_bien') ?? '')
  const [equipements, setEquipements] = useState<string[]>(
    searchParams.get('equipements')?.split(',').filter(Boolean) ?? []
  )

  const toggleEquipement = (eq: string) => {
    setEquipements((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    )
  }

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '0')
    if (commune) params.set('commune', commune); else params.delete('commune')
    if (prixMin) params.set('prix_min', prixMin); else params.delete('prix_min')
    if (prixMax) params.set('prix_max', prixMax); else params.delete('prix_max')
    if (typeBien) params.set('type_bien', typeBien); else params.delete('type_bien')
    if (equipements.length) params.set('equipements', equipements.join(',')); else params.delete('equipements')
    router.push(`${pathname}?${params.toString()}`)
    onApply?.()
  }, [commune, prixMin, prixMax, typeBien, equipements, pathname, searchParams, router, onApply])

  const clearFilters = () => {
    setCommune(''); setPrixMin(''); setPrixMax(''); setTypeBien(''); setEquipements([])
    const q = searchParams.get('q')
    router.push(`${pathname}${q ? `?q=${q}` : ''}`)
  }

  const hasActiveFilters = commune || prixMin || prixMax || typeBien || equipements.length > 0
  const activeCount = [commune, prixMin || prixMax, typeBien, equipements.length > 0 ? '1' : ''].filter(Boolean).length

  return (
    <div className="bg-white rounded-[20px] border border-[var(--border)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}>

      {/* En-tête */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--primary)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" stroke="white" strokeWidth="2" fill="none">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <h3 className="font-sans font-semibold text-white text-sm">Filtres</h3>
          {activeCount > 0 && (
            <span className="bg-[var(--secondary)] text-white text-xs font-bold rounded-pill px-2 py-0.5 leading-none">
              {activeCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-white/60 hover:text-white font-sans transition-colors duration-200 flex items-center gap-1"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Effacer
          </button>
        )}
      </div>

      {/* Corps des filtres */}
      <div className="divide-y divide-[var(--border)]">

        {/* Commune / Quartier */}
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-2.5">
            Localisation
          </label>
          <CommuneAutocomplete
            value={commune}
            onChange={setCommune}
            placeholder="Cocody, Angré, Marcory..."
          />
        </div>

        {/* Type de bien */}
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-2.5">
            Type de bien
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {/* Tous */}
            <button
              type="button"
              onClick={() => setTypeBien('')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-sans text-left transition-all duration-200',
                !typeBien
                  ? 'bg-[var(--primary)] text-white font-medium'
                  : 'text-[var(--text-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]'
              )}
            >
              <span className="text-base">🏠</span>
              Tous les types
            </button>
            {TYPES_BIEN.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeBien(t === typeBien ? '' : t)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-btn text-sm font-sans text-left transition-all duration-200',
                  typeBien === t
                    ? 'bg-[var(--primary)] text-white font-medium'
                    : 'text-[var(--text-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]'
                )}
              >
                <span className="text-base">
                  {t === 'villa' ? '🏡' : t === 'appartement' ? '🏢' : t === 'studio' ? '🛏️' :
                   t === 'maison' ? '🏘️' : t === 'residence_meublee' ? '🛋️' : t === 'bureau' ? '💼' :
                   t === 'commerce' ? '🏪' : t === 'terrain' ? '🌳' : '🏠'}
                </span>
                {TYPES_BIEN_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-2.5">
            Budget mensuel (FCFA)
          </label>
          <div className="space-y-2">
            <div className="relative">
              <input
                placeholder="Minimum"
                type="number"
                value={prixMin}
                onChange={(e) => setPrixMin(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-sans border border-[var(--border)] rounded-btn focus:outline-none bg-[var(--surface)] placeholder:text-[var(--text-subtle)] text-[var(--text)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-subtle)] font-sans px-1">à</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
            <div className="relative">
              <input
                placeholder="Maximum"
                type="number"
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-sans border border-[var(--border)] rounded-btn focus:outline-none bg-[var(--surface)] placeholder:text-[var(--text-subtle)] text-[var(--text)]"
              />
            </div>
          </div>
        </div>

        {/* Équipements */}
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-2.5">
            Équipements
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPEMENTS_DISPONIBLES.map((eq) => (
              <button
                key={eq}
                type="button"
                onClick={() => toggleEquipement(eq)}
                className={cn(
                  'px-2.5 py-1 rounded-pill text-xs font-sans border transition-all duration-200',
                  equipements.includes(eq)
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white font-medium'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)]'
                )}
              >
                {EQUIPEMENTS_LABELS[eq]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-[var(--surface)]">
        <Button className="w-full btn-primary-glow" onClick={applyFilters}>
          Appliquer les filtres
        </Button>
      </div>
    </div>
  )
}
