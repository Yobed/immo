'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Button, Input } from '@/components/ui'
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
    if (commune) params.set('commune', commune)
    else params.delete('commune')
    if (prixMin) params.set('prix_min', prixMin)
    else params.delete('prix_min')
    if (prixMax) params.set('prix_max', prixMax)
    else params.delete('prix_max')
    if (typeBien) params.set('type_bien', typeBien)
    else params.delete('type_bien')
    if (equipements.length) params.set('equipements', equipements.join(','))
    else params.delete('equipements')
    router.push(`${pathname}?${params.toString()}`)
    onApply?.()
  }, [commune, prixMin, prixMax, typeBien, equipements, pathname, searchParams, router, onApply])

  const clearFilters = () => {
    setCommune('')
    setPrixMin('')
    setPrixMax('')
    setTypeBien('')
    setEquipements([])
    const q = searchParams.get('q')
    router.push(`${pathname}${q ? `?q=${q}` : ''}`)
  }

  const hasActiveFilters =
    commune || prixMin || prixMax || typeBien || equipements.length > 0

  return (
    <div className="bg-white rounded-card border border-[var(--border)] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-sans font-medium text-[var(--text)]">Filtres</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-danger font-sans hover:underline"
          >
            Effacer tout
          </button>
        )}
      </div>

      {/* Commune / quartier */}
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">
          Commune ou quartier
        </label>
        <CommuneAutocomplete
          value={commune}
          onChange={setCommune}
          placeholder="Ex : Cocody, Angré..."
        />
      </div>

      {/* Type de bien */}
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">
          Type de bien
        </label>
        <select
          value={typeBien}
          onChange={(e) => setTypeBien(e.target.value)}
          className="w-full rounded-btn border border-[var(--border)] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Tous les types</option>
          {TYPES_BIEN.map((t) => (
            <option key={t} value={t}>
              {TYPES_BIEN_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Prix */}
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">
          Prix mensuel (FCFA)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Min (ex: 100000)"
            type="number"
            value={prixMin}
            onChange={(e) => setPrixMin(e.target.value)}
          />
          <Input
            placeholder="Max (ex: 500000)"
            type="number"
            value={prixMax}
            onChange={(e) => setPrixMax(e.target.value)}
          />
        </div>
      </div>

      {/* Équipements */}
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">
          Équipements
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {EQUIPEMENTS_DISPONIBLES.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => toggleEquipement(eq)}
              className={cn(
                'text-left px-2 py-1.5 rounded-btn text-xs font-sans border transition-colors',
                equipements.includes(eq)
                  ? 'border-primary bg-primary-light text-primary font-medium'
                  : 'border-[var(--border)] text-muted hover:border-primary/40'
              )}
            >
              {EQUIPEMENTS_LABELS[eq]}
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={applyFilters}>
        Appliquer les filtres
      </Button>
    </div>
  )
}
