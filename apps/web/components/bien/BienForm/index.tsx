'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createBien, updateBien } from '@/app/(pro)/mes-biens/nouveau/actions'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Step1Infos } from './Step1Infos'
import { Step2Prix } from './Step2Prix'
import { Step3Localisation } from './Step3Localisation'
import { Step4Equipements } from './Step4Equipements'
import { Button } from '@/components/ui'
import { useAIListingAnalyzer } from '@/hooks/useAIListingAnalyzer'
import { AIQualityMeter } from '../AIQualityMeter'

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
  prix_nuit_fcfa: numOpt(z.number().nonnegative()),
  prix_vente_fcfa: numOpt(z.number().nonnegative()),
  charges_mois_fcfa: numOpt(z.number().nonnegative()),
  depot_garantie_fcfa: numOpt(z.number().nonnegative()),
  equipements: z.array(z.string()).default([]),
})

export type BienFormData = z.infer<typeof BienSchema>

const TOTAL_STEPS = 5

function validateStep(
  step: number,
  values: Partial<BienFormData>,
  setError: (name: keyof BienFormData, err: { message: string }) => void,
  clearErrors: (names: (keyof BienFormData)[]) => void
): boolean {
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
    const { type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa } = values
    if (type_bien === 'residence_meublee') {
      if (!prix_nuit_fcfa || prix_nuit_fcfa <= 0) {
        setError('prix_nuit_fcfa', { message: 'Le prix par nuit est requis pour une résidence meublée' })
        return false
      }
      clearErrors(['prix_nuit_fcfa'])
    } else {
      if ((!prix_mois_fcfa || prix_mois_fcfa <= 0) && (!prix_vente_fcfa || prix_vente_fcfa <= 0)) {
        setError('prix_mois_fcfa', { message: 'Indiquer un prix (location ou vente)' })
        return false
      }
      clearErrors(['prix_mois_fcfa'])
    }
  }
  return true
}

interface BienFormProps {
  defaultValues?: Partial<BienFormData>
  /** Fourni lors de la modification d'un bien existant — appelle updateBien au lieu de createBien */
  bienId?: string
}

export function BienForm({ defaultValues, bienId }: BienFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<BienFormData>({
    mode: 'onTouched',
    defaultValues: { equipements: [], ...defaultValues },
  })

  // Surveillance en temps réel pour l'IA
  const watchedData = form.watch()
  const aiAnalysis = useAIListingAnalyzer(watchedData)

  // Validation manuelle des champs requis avant soumission finale
  const validateAll = (): boolean => {
    const values = form.getValues()
    for (let s = 1; s <= 4; s++) {
      const ok = validateStep(s, values, form.setError, form.clearErrors)
      if (!ok) {
        setStep(s)          // retourne à l'étape problématique
        return false
      }
    }
    return true
  }

  const handleFinalSubmit = async () => {
    console.log('Final submit triggered');
    if (!validateAll()) {
      console.warn('Validation failed before final submit');
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const data = {
        ...form.getValues(),
        score_ia: aiAnalysis.score
      } as unknown as Record<string, unknown>
      
      console.log('Sending data to action:', data);
      const result = bienId
        ? await updateBien(bienId, data)
        : await createBien(data)
      
      console.log('Action result:', result);

      if ('error' in result) {
        console.error('Server action error:', result.error);
        setSubmitError(result.error)
        return
      }
      
      const targetUrl = `/mes-biens/${result.id}/modifier?step=medias`;
      console.log('Redirecting to:', targetUrl);
      window.location.href = targetUrl;
    } catch (err) {
      console.error('Submission exception:', err);
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
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne Formulaire (Main) */}
        <div className="lg:col-span-8">
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

          <div className="bg-surface p-6 rounded-3xl border border-[var(--border)] shadow-sm">
            {step === 1 && <Step1Infos form={form} />}
            {step === 2 && <Step2Prix form={form} />}
            {step === 3 && <Step3Localisation form={form} />}
            {step === 4 && <Step4Equipements form={form} />}
            {step === 5 && (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                  </svg>
                </div>
                <p className="font-display text-xl text-[var(--text)] mb-2">Prêt à ajouter les médias ?</p>
                <p className="font-sans text-muted text-sm">
                  {bienId
                    ? "Les informations seront mises à jour. Vous pourrez gérer photos, vidéos et vue 360° à l'étape suivante."
                    : "L'annonce sera créée en brouillon. Vous pourrez ajouter photos, vidéos et vue 360° à l'étape suivante."}
                </p>
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
                <Button
                  type="button"
                  className="ml-auto"
                  loading={isSubmitting}
                  onClick={handleFinalSubmit}
                >
                  Continuer vers les médias
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Colonne IA Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <AIQualityMeter analysis={aiAnalysis} />
          
          <div className="p-5 rounded-3xl bg-indigo-600/5 border border-indigo-200/50 hidden lg:block">
            <h4 className="text-sm font-display font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Pourquoi un score élevé ?</h4>
            <ul className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 space-y-2 list-disc pl-4">
              <li>Mise en avant prioritaire dans les recherches</li>
              <li>Éligibilité aux campagnes WhatsApp Pro</li>
              <li>Confiance accrue des locataires vérifiés</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
