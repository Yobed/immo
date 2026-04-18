'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui'
import { COMMUNES_CI } from '@immo-ci/shared/constants/communes'
import type { BienFormData } from './index'

export function Step3Localisation({ form }: { form: UseFormReturn<BienFormData> }) {
  const { register, formState: { errors } } = form
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-[var(--text)]">Localisation</h2>
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">Commune *</label>
        <select
          {...register('commune')}
          className="w-full rounded-btn border border-[var(--border)] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--surface-card)]"
        >
          <option value="">Sélectionner une commune...</option>
          {COMMUNES_CI.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.commune && <p className="text-danger text-xs mt-1">{errors.commune.message}</p>}
      </div>
      <Input label="Quartier" placeholder="Ex: Riviera Golf" {...register('quartier')} />
      <Input label="Adresse" placeholder="Ex: Rue des Jardins, Immeuble Plateau" {...register('adresse_complete')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Latitude" type="number" step="any" placeholder="5.352781" {...register('latitude', { valueAsNumber: true })} />
        <Input label="Longitude" type="number" step="any" placeholder="-4.008256" {...register('longitude', { valueAsNumber: true })} />
      </div>
      <p className="text-xs text-muted font-sans">Les coordonnées GPS permettent d'afficher le bien sur la carte. Vous pouvez les obtenir via Google Maps (clic droit → Coordonnées GPS).</p>
    </div>
  )
}
