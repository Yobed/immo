'use client'
import { UseFormReturn, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui'
import { COMMUNES_CI } from '@immo-ci/shared/constants/communes'
import { LocationPicker } from '@/components/bien/LocationPicker'
import type { BienFormData } from './index'

export function Step3Localisation({ form }: { form: UseFormReturn<BienFormData> }) {
  const { register, setValue, control, formState: { errors } } = form

  const latitude = useWatch({ control, name: 'latitude' })
  const longitude = useWatch({ control, name: 'longitude' })

  const handlePickerChange = ({ latitude, longitude, address }: { latitude: number; longitude: number; address?: string }) => {
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setValue('latitude', undefined as unknown as number, { shouldValidate: true, shouldDirty: true })
      setValue('longitude', undefined as unknown as number, { shouldValidate: true, shouldDirty: true })
      return
    }
    setValue('latitude', Number(latitude.toFixed(6)), { shouldValidate: true, shouldDirty: true })
    setValue('longitude', Number(longitude.toFixed(6)), { shouldValidate: true, shouldDirty: true })
    if (address) {
      const current = (form.getValues('adresse_complete') || '').trim()
      if (!current) setValue('adresse_complete', address, { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-[var(--text)]">Localisation</h2>
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">Commune *</label>
        <select
          {...register('commune')}
          className="w-full rounded-btn border border-[var(--border)] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--surface-card)] text-[var(--text)]"
        >
          <option value="">Sélectionner une commune...</option>
          {COMMUNES_CI.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.commune && <p className="text-danger text-xs mt-1">{errors.commune.message}</p>}
      </div>

      <Input label="Quartier" placeholder="Ex: Riviera Golf" {...register('quartier')} />
      <Input label="Adresse" placeholder="Ex: Rue des Jardins, Immeuble Plateau" {...register('adresse_complete')} />

      {/* Carte interactive : recherche + clic + GPS + drag */}
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">
          Coordonnées GPS
        </label>
        <LocationPicker
          latitude={typeof latitude === 'number' ? latitude : null}
          longitude={typeof longitude === 'number' ? longitude : null}
          onChange={handlePickerChange}
        />
        <p className="text-xs text-[var(--text-muted)] font-sans mt-2">
          Recherchez une adresse, cliquez sur la carte, ou utilisez le bouton 🎯 pour votre position. Le marqueur est déplaçable.
        </p>
      </div>

      {/* Inputs manuels (cachés mais accessibles si besoin de saisie précise) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--text)] font-medium">
          Saisir manuellement les coordonnées
        </summary>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <Input label="Latitude" type="number" step="any" placeholder="5.352781" {...register('latitude', { valueAsNumber: true })} />
          <Input label="Longitude" type="number" step="any" placeholder="-4.008256" {...register('longitude', { valueAsNumber: true })} />
        </div>
      </details>
    </div>
  )
}
