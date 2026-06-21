'use client'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui'
import type { BienFormData } from './index'

export function Step2Prix({ form }: { form: UseFormReturn<BienFormData> }) {
  const { register, watch, formState: { errors } } = form
  const typeBien = watch('type_bien')
  const isNuitee = typeBien === 'residence_meublee'

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl text-[var(--text)]">Prix & Charges</h2>

      {isNuitee ? (
        <>
          <div className="px-4 py-3 bg-[var(--accent-luxury-muted)] border border-accent-luxury/20 rounded-card">
            <p className="text-sm font-sans text-[var(--accent-luxury)] font-medium">Résidence meublée — location à la nuitée</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Indiquer le tarif par nuit. Le total sera calculé automatiquement selon la durée du séjour.</p>
          </div>
          <Input
            label="Prix par nuit (FCFA) *"
            type="number"
            placeholder="Ex: 25000"
            {...register('prix_nuit_fcfa', { valueAsNumber: true })}
            error={errors.prix_nuit_fcfa?.message}
          />
          <Input
            label="Charges (FCFA/nuit, optionnel)"
            type="number"
            placeholder="Ex: 2000"
            {...register('charges_mois_fcfa', { valueAsNumber: true })}
            hint="Eau, électricité, ménage... inclus dans le tarif ou en sus"
          />
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--text-muted)] font-sans">Indiquer au moins un prix (location mensuelle ou vente)</p>
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
            placeholder="Ex: 500000 (souvent 1 à 3 mois de loyer)"
            {...register('depot_garantie_fcfa', { valueAsNumber: true })}
            hint="Caution versée par le locataire à l'entrée, restituée à son départ s'il n'y a pas de dégâts. Ce n'est pas une commission BOGBE'S."
          />
        </>
      )}
    </div>
  )
}
