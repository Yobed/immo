'use client'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui'
import { TYPES_BIEN_LABELS, TYPES_BIEN } from '@immo-ci/shared/constants/biens'
import { COMMUNES_ABIDJAN, COMMUNES_HORS_ABIDJAN, COMMUNES_CI } from '@immo-ci/shared/constants/communes'
import type { BienFormData } from './index'

export function Step1Infos({ form }: { form: UseFormReturn<BienFormData> }) {
  const { register, formState: { errors }, watch, setValue } = form
  const currentCommune = watch('commune') || ''
  const isCustomInit = Boolean(currentCommune && !(COMMUNES_CI as readonly string[]).includes(currentCommune))
  const [customMode, setCustomMode] = useState(isCustomInit)

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-[var(--text)]">Informations générales</h2>
      <Input
        label="Titre de l'annonce"
        placeholder="Ex: Appartement 3 pièces Cocody Riviera"
        {...register('titre')}
        error={errors.titre?.message}
      />
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">Type de bien</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TYPES_BIEN.map((type) => (
            <label key={type} className={`
              flex items-center justify-center p-3 rounded-btn border-2 cursor-pointer text-sm font-sans transition-colors
              ${watch('type_bien') === type ? 'border-[var(--accent-luxury)] bg-[var(--accent-luxury-muted)] text-[var(--accent-luxury)] font-semibold' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-accent-luxury/40'}
            `}>
              <input type="radio" value={type} {...register('type_bien')} className="sr-only" />
              {TYPES_BIEN_LABELS[type]}
            </label>
          ))}
        </div>
        {errors.type_bien && <p className="text-danger text-xs mt-1">{errors.type_bien.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">Description</label>
        <textarea
          rows={4}
          className="w-full rounded-btn border border-[var(--border)] bg-[var(--surface-card)] text-[var(--text)] placeholder:text-[var(--text-muted)] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Décrivez le bien, ses atouts, l'environnement..."
          {...register('description')}
        />
        {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
      </div>
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
      <div className="grid grid-cols-2 gap-4">
        <Input label="Superficie (m²)" type="number" {...register('surface_m2', { valueAsNumber: true })} />
        <Input label="Nombre de pièces" type="number" {...register('nb_pieces', { valueAsNumber: true })} />
        <Input label="Chambres" type="number" {...register('nb_chambres', { valueAsNumber: true })} />
        <Input label="Salles de bain" type="number" {...register('nb_salles_bain', { valueAsNumber: true })} />
      </div>
    </div>
  )
}
