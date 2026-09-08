import { z } from 'zod'

export const validationInput = z.object({
  entity: z.enum(['contact', 'visite', 'reservation']),
  id: z.uuid(),
  action: z.enum(['approve', 'reject']),
  note: z.string().trim().max(2000).nullable().optional(),
}).refine(value => value.action !== 'reject' || Boolean(value.note), {
  message: 'Précisez le motif du refus.', path: ['note'],
})

export function formVersion(form: FormData): number {
  const raw = form.get('version')
  if (typeof raw !== 'string' || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
    throw new Error('Actualisez la page avant de modifier ce dossier.')
  }
  return Number(raw)
}

export function formUuid(form: FormData, key: string): string {
  const result = z.uuid().safeParse(form.get(key))
  if (!result.success) throw new Error('La référence du dossier est invalide.')
  return result.data
}

export type CrmActionResult = { error?: string; message?: string }

export function rpcErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === '42501') return 'Vous devez être connecté avec un compte administrateur.'
  if (error.code === '40001') return 'Ce dossier a déjà été modifié. Actualisez la page avant de réessayer.'
  if (error.code === 'P0002') return 'Ce dossier est introuvable.'
  if (error.code === '22023') return error.message || 'Vérifiez les informations du formulaire.'
  if (error.code?.startsWith('22')) return 'Une valeur ou une date du formulaire est invalide.'
  return 'Le suivi est momentanément indisponible. Aucune modification n’a été enregistrée.'
}
