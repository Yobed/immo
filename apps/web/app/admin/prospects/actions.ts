'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { callCrmRpc } from '@/lib/crm/rpc'
import { formUuid, formVersion, type CrmActionResult } from '@/lib/crm/input'

async function update(form: FormData, operation: string, values: Record<string, unknown>): Promise<CrmActionResult> {
  try {
    const id = formUuid(form, 'id')
    await callCrmRpc('crm_update_prospect', {
      p_id: id, p_operation: operation, p_values: values, p_version: formVersion(form),
    })
    for (const path of ['/admin/prospects', '/admin/prospects/' + id, '/admin/performance', '/admin/suivi']) revalidatePath(path)
    return { message: 'Modification enregistrée.' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Impossible d’enregistrer la modification.' }
  }
}

export async function setProspectStatutAction(form: FormData): Promise<CrmActionResult> {
  return update(form, 'status', { statut: String(form.get('statut') || '') })
}
export async function setProspectNoteAction(form: FormData): Promise<CrmActionResult> {
  return update(form, 'note', { note: String(form.get('note') || '').trim() })
}
export async function setProspectAssignAction(form: FormData): Promise<CrmActionResult> {
  return update(form, 'assign', { assigned_to: String(form.get('assigned_to') || '') || null })
}
export async function setProspectRelanceAction(form: FormData): Promise<CrmActionResult> {
  return update(form, 'reminder', { relance_le: String(form.get('relance_le') || '') || null })
}
export async function setProspectOutcomeAction(form: FormData): Promise<CrmActionResult> {
  const rawDate = String(form.get('prochaine_action_at') || '').trim()
  // Africa/Abidjan is UTC. The input is labelled with this timezone.
  const date = rawDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawDate) ? rawDate + ':00Z' : rawDate
  return update(form, 'followup', {
    perte_motif: String(form.get('perte_motif') || '') || null,
    loss_note: String(form.get('loss_note') || '').trim() || null,
    prochaine_action: String(form.get('prochaine_action') || '').trim() || null,
    prochaine_action_at: date || null,
  })
}

const bulkStatus = z.enum(['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne', 'perdu'])

/** Mise à jour groupée conservatrice : chaque ligne garde son contrôle de version. */
export async function bulkSetProspectStatutAction(form: FormData): Promise<CrmActionResult> {
  const parsedStatus = bulkStatus.safeParse(form.get('statut'))
  if (!parsedStatus.success) return { error: 'Choisissez un statut valide.' }
  const selections = form.getAll('selection').filter((value): value is string => typeof value === 'string')
  if (selections.length === 0) return { error: 'Sélectionnez au moins un prospect.' }
  if (selections.length > 50) return { error: 'Sélectionnez au maximum 50 prospects par opération.' }

  let updated = 0
  let failed = 0
  for (const selection of selections) {
    const [rawId, rawVersion] = selection.split('|')
    const id = z.uuid().safeParse(rawId)
    const version = /^\d+$/.test(rawVersion ?? '') ? Number(rawVersion) : NaN
    if (!id.success || !Number.isSafeInteger(version)) {
      failed += 1
      continue
    }
    try {
      await callCrmRpc('crm_update_prospect', {
        p_id: id.data,
        p_operation: 'status',
        p_values: { statut: parsedStatus.data },
        p_version: version,
      })
      updated += 1
    } catch {
      failed += 1
    }
  }

  for (const path of ['/admin/prospects', '/admin/performance', '/admin/suivi']) revalidatePath(path)
  if (failed > 0) return { error: `${updated} prospect(s) mis à jour, ${failed} non modifié(s). Actualisez puis réessayez.` }
  return { message: `${updated} prospect(s) mis à jour.` }
}
