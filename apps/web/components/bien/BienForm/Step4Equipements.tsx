'use client'
import { UseFormReturn } from 'react-hook-form'
import { EQUIPEMENTS_DISPONIBLES, EQUIPEMENTS_LABELS } from '@immo-ci/shared/constants/biens'
import { cn } from '@/lib/utils'
import type { BienFormData } from './index'

export function Step4Equipements({ form }: { form: UseFormReturn<BienFormData> }) {
  const { watch, setValue } = form
  const selected = watch('equipements') ?? []

  const toggle = (equip: string) => {
    const next = selected.includes(equip)
      ? selected.filter((e) => e !== equip)
      : [...selected, equip]
    setValue('equipements', next, { shouldDirty: true })
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-[var(--text)]">Équipements & Commodités</h2>
      <p className="text-sm text-muted font-sans">Sélectionnez les équipements présents dans le bien</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EQUIPEMENTS_DISPONIBLES.map((equip) => (
          <button
            key={equip}
            type="button"
            onClick={() => toggle(equip)}
            className={cn(
              'flex items-center gap-2 p-3 rounded-btn border-2 text-sm font-sans transition-colors text-left',
              selected.includes(equip)
                ? 'border-primary bg-primary-light text-primary'
                : 'border-[var(--border)] text-muted hover:border-primary/40'
            )}
          >
            <span className={`w-4 h-4 rounded flex-shrink-0 border ${selected.includes(equip) ? 'bg-primary border-primary' : 'border-muted'}`} />
            {EQUIPEMENTS_LABELS[equip]}
          </button>
        ))}
      </div>
    </div>
  )
}
