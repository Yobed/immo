'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Step1Infos } from './Step1Infos'
import { Step2Prix } from './Step2Prix'
import { Step3Localisation } from './Step3Localisation'
import { Step4Equipements } from './Step4Equipements'
import { Button } from '@/components/ui'
import { TYPES_BIEN } from '@immo-ci/shared/constants/biens'

export const BienSchema = z.object({
  titre: z.string().min(5, 'Minimum 5 caractères').max(100),
  type_bien: z.enum([...TYPES_BIEN] as [string, ...string[]]),
  commune: z.string().min(1, 'Commune requise'),
  quartier: z.string().optional(),
  adresse_complete: z.string().optional(),
  description: z.string().min(20, 'Description trop courte (min 20 caractères)'),
  surface_m2: z.number().positive().optional(),
  nb_pieces: z.number().int().positive().optional(),
  nb_chambres: z.number().int().nonnegative().optional(),
  nb_salles_bain: z.number().int().nonnegative().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  prix_mois_fcfa: z.number().nonnegative().optional(),
  prix_vente_fcfa: z.number().nonnegative().optional(),
  charges_mois_fcfa: z.number().nonnegative().optional(),
  depot_garantie_fcfa: z.number().nonnegative().optional(),
  equipements: z.array(z.string()).default([]),
}).refine(
  (d) => (d.prix_mois_fcfa ?? 0) > 0 || (d.prix_vente_fcfa ?? 0) > 0,
  { message: 'Indiquer un prix (location ou vente)', path: ['prix_mois_fcfa'] }
)

export type BienFormData = z.infer<typeof BienSchema>

const TOTAL_STEPS = 4

export function BienForm({ defaultValues }: { defaultValues?: Partial<BienFormData> }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<BienFormData>({
    resolver: zodResolver(BienSchema),
    mode: 'onChange',
    defaultValues: { equipements: [], ...defaultValues },
  })

  const onSubmit = async (data: BienFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/biens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur création bien')
      const { id } = await res.json()
      router.push(`/biens/${id}/modifier?step=medias`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-pill transition-colors ${
              i + 1 <= step ? 'bg-primary' : 'bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && <Step1Infos form={form} />}
        {step === 2 && <Step2Prix form={form} />}
        {step === 3 && <Step3Localisation form={form} />}
        {step === 4 && <Step4Equipements form={form} />}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>
              Précédent
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              className="ml-auto"
              onClick={async () => {
                const valid = await form.trigger(
                  step === 1 ? ['titre', 'type_bien', 'commune', 'description']
                  : step === 2 ? ['prix_mois_fcfa']
                  : step === 3 ? []
                  : ['equipements']
                )
                if (valid) setStep(s => s + 1)
              }}
            >
              Suivant
            </Button>
          ) : (
            <Button type="submit" className="ml-auto" loading={isSubmitting}>
              Enregistrer le bien
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
