'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui'
import { TYPES_BIEN_LABELS, TYPES_BIEN } from '@immo-ci/shared/constants/biens'
import { COMMUNES_CI } from '@immo-ci/shared/constants/communes'
import type { BienFormData } from './index'

export function Step1Infos({ form }: { form: UseFormReturn<BienFormData> }) {
  const { register, formState: { errors }, watch } = form
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
              ${watch('type_bien') === type ? 'border-primary bg-primary-light text-primary' : 'border-[var(--border)] text-muted hover:border-primary/40'}
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
          className="w-full rounded-btn border border-[var(--border)] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Décrivez le bien, ses atouts, l'environnement..."
          {...register('description')}
        />
        {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-sans font-medium text-[var(--text)] mb-2">Commune *</label>
        <select
          {...register('commune')}
          className="w-full rounded-btn border border-[var(--border)] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        >
          <option value="">Sélectionner une commune...</option>
          {COMMUNES_CI.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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
