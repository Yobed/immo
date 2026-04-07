'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui'
import type { BienFormData } from './index'

export function Step2Prix({ form }: { form: UseFormReturn<BienFormData> }) {
  const { register, formState: { errors } } = form
  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-[var(--text)]">Prix & Charges</h2>
      <p className="text-sm text-muted font-sans">Indiquer au moins un prix (location mensuelle ou vente)</p>
      <Input
        label="Loyer mensuel (FCFA)"
        type="number"
        placeholder="Ex: 250000"
        {...register('prix_mois_fcfa', { valueAsNumber: true })}
        error={errors.prix_mois_fcfa?.message}
        hint="Laisser vide si bien à vendre uniquement"
      />
      <Input
        label="Prix de vente (FCFA)"
        type="number"
        placeholder="Ex: 45000000"
        {...register('prix_vente_fcfa', { valueAsNumber: true })}
        hint="Laisser vide si bien en location uniquement"
      />
      <Input
        label="Charges mensuelles (FCFA)"
        type="number"
        placeholder="Ex: 15000"
        {...register('charges_mois_fcfa', { valueAsNumber: true })}
        hint="Eau, électricité, ordures... inclus dans le loyer ou en sus"
      />
      <Input
        label="Dépôt de garantie (FCFA)"
        type="number"
        placeholder="Ex: 500000"
        {...register('depot_garantie_fcfa', { valueAsNumber: true })}
      />
    </div>
  )
}
