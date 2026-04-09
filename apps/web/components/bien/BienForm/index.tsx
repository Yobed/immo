'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createBien } from '@/app/(pro)/mes-biens/nouveau/actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Step1Infos } from './Step1Infos'
import { Step2Prix } from './Step2Prix'
import { Step3Localisation } from './Step3Localisation'
import { Step4Equipements } from './Step4Equipements'
import { Button } from '@/components/ui'

// HTML number inputs with valueAsNumber:true produce NaN when empty — Zod 4 rejects NaN
// so we preprocess NaN → undefined for all optional number fields
const numOpt = (schema: z.ZodNumber) =>
  z.preprocess((v) => (typeof v === 'number' && isNaN(v)) ? undefined : v, schema.optional())

export const BienSchema = z.object({
  titre: z.string().min(5, 'Minimum 5 caractères').max(100),
  type_bien: z.string().min(1, 'Type de bien requis'),
  commune: z.string().min(1, 'Commune requise'),
  quartier: z.string().optional(),
  adresse_complete: z.string().optional(),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)'),
  surface_m2: numOpt(z.number().positive()),
  nb_pieces: numOpt(z.number().int().positive()),
  nb_chambres: numOpt(z.number().int().nonnegative()),
  nb_salles_bain: numOpt(z.number().int().nonnegative()),
  latitude: numOpt(z.number()),
  longitude: numOpt(z.number()),
  prix_mois_fcfa: numOpt(z.number().nonnegative()),
  prix_vente_fcfa: numOpt(z.number().nonnegative()),
  charges_mois_fcfa: numOpt(z.number().nonnegative()),
  depot_garantie_fcfa: numOpt(z.number().nonnegative()),
  equipements: z.array(z.string()).default([]),
})

export type BienFormData = z.infer<typeof BienSchema>

const TOTAL_STEPS = 5

function validateStep(step: number, values: Partial<BienFormData>, setError: (name: keyof BienFormData, err: { message: string }) => void, clearErrors: (names: (keyof BienFormData)[]) => void): boolean {
  if (step === 1) {
    let ok = true
    const { titre, type_bien, commune, description } = values
    if (!titre || titre.trim().length < 5) {
      setError('titre', { message: 'Minimum 5 caractères' }); ok = false
    } else clearErrors(['titre'])
    if (!type_bien || type_bien.trim() === '') {
      setError('type_bien', { message: 'Type de bien requis' }); ok = false
    } else clearErrors(['type_bien'])
    if (!commune || commune.trim() === '') {
      setError('commune', { message: 'Commune requise' }); ok = false
    } else clearErrors(['commune'])
    if (!description || description.trim().length < 10) {
      setError('description', { message: 'Description trop courte (min 10 caractères)' }); ok = false
    } else clearErrors(['description'])
    return ok
  }
  if (step === 2) {
    const { prix_mois_fcfa, prix_vente_fcfa } = values
    if ((!prix_mois_fcfa || prix_mois_fcfa <= 0) && (!prix_vente_fcfa || prix_vente_fcfa <= 0)) {
      setError('prix_mois_fcfa', { message: 'Indiquer un prix (location ou vente)' })
      return false
    }
    clearErrors(['prix_mois_fcfa'])
  }
  return true
}

export function BienForm({ defaultValues }: { defaultValues?: Partial<BienFormData> }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<BienFormData>({
    resolver: zodResolver(BienSchema),
    mode: 'onTouched',
    defaultValues: { equipements: [], ...defaultValues },
  })

  const onSubmit = async (data: BienFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await createBien(data as unknown as Record<string, unknown>)
      if ('error' in result) {
        setSubmitError(result.error)
        return
      }
      router.push(`/mes-biens/${result.id}/modifier?step=medias`)
    } catch (err) {
      setSubmitError(String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    const values = form.getValues()
    const ok = validateStep(step, values, form.setError, form.clearErrors)
    if (ok) setStep(s => s + 1)
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
        {step === 5 && (
          <div className="text-center py-6">
            <p className="font-display text-xl text-[var(--text)] mb-2">Prêt à publier ?</p>
            <p className="font-sans text-muted text-sm">Vous pourrez ajouter des photos, vidéos et une vue 360° à l&apos;étape suivante.</p>
          </div>
        )}

        {submitError && (
          <div className="mt-4 p-3 rounded-btn bg-red-50 border border-red-200 text-red-700 text-sm font-sans">
            {submitError}
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>
              Précédent
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button type="button" className="ml-auto" onClick={handleNext}>
              Suivant
            </Button>
          ) : (
            <Button type="submit" className="ml-auto" loading={isSubmitting}>
              Continuer vers les médias
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
