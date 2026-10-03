'use client'
import { useState } from 'react'
import { UseFormReturn, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui'
import { COMMUNES_ABIDJAN, COMMUNES_HORS_ABIDJAN, COMMUNES_CI } from '@immo-ci/shared/constants/communes'
import { LocationPicker } from '@/components/bien/LocationPicker'
import type { BienFormData } from './index'

export function Step3Localisation({ form }: { form: UseFormReturn<BienFormData> }) {
  const { register, setValue, control, watch, formState: { errors } } = form
  const currentCommune = watch('commune') || ''
  const isCustomInit = Boolean(currentCommune && !(COMMUNES_CI as readonly string[]).includes(currentCommune))
  const [customMode, setCustomMode] = useState(isCustomInit)

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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-sans font-medium text-[var(--text)]">Commune *</label>
          <button
            type="button"
            onClick={() => {
              if (customMode) {
                setCustomMode(false)
                if (!(COMMUNES_CI as readonly string[]).includes(currentCommune)) {
                  setValue('commune', '', { shouldDirty: true })
                }
              } else {
                setCustomMode(true)
              }
            }}
            className="text-xs text-[var(--accent-luxury)] hover:underline font-sans"
          >
            {customMode ? 'Choisir dans la liste' : 'Autre commune ? Saisir manuellement'}
          </button>
        </div>
        {customMode ? (
          <Input
            placeholder="Saisissez le nom de la commune (ex: Bonoua, Assinie...)"
            {...register('commune')}
          />
        ) : (
          <select
            {...register('commune')}
            className="w-full rounded-btn border border-[var(--border)] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--surface-card)] text-[var(--text)]"
          >
            <option value="">Sélectionner une commune...</option>
            {currentCommune && !(COMMUNES_CI as readonly string[]).includes(currentCommune) && (
              <option value={currentCommune}>{currentCommune}</option>
            )}
            <optgroup label="District d'Abidjan">
              {COMMUNES_ABIDJAN.map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
            <optgroup label="Autres communes de Côte d'Ivoire">
              {COMMUNES_HORS_ABIDJAN.map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
          </select>
        )}
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
