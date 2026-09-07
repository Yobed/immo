'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Vérifie que l'utilisateur courant est admin. */
async function assertAdmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not_authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('not_admin')
}

const VALID_STATUTS = ['nouveau', 'contacte', 'visite_planifiee', 'visite_realisee', 'relance', 'gagne', 'perdu', 'en_cours', 'rdv', 'traite'] as const

function revalidate(id?: string): void {
  revalidatePath('/admin/prospects')
  if (id) revalidatePath(`/admin/prospects/${id}`)
}

/** Change le statut de suivi d'un prospect. */
export async function setProspectStatutAction(formData: FormData): Promise<void> {
  const actor = await getAdminId()
  const id = formData.get('id') as string
  const statut = formData.get('statut') as string
  if (!id || !(VALID_STATUTS as readonly string[]).includes(statut)) return
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: previous } = await (admin as any).from('prospects').select('statut').eq('id', id).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update = await (admin as any).from('prospects').update({ statut, statut_changed_at: new Date().toISOString(), statut_changed_by: actor }).eq('id', id)
  if (update.error) {
    // Compatibilité pendant le déploiement de la migration CRM.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('prospects').update({ statut }).eq('id', id)
  }
  // La journalisation reste best-effort pour rester compatible avec les bases non encore migrées.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('prospect_activities').insert({ prospect_id: id, actor_id: actor, type: 'status_change', from_status: previous?.statut ?? null, to_status: statut })
  // Journal commun CRM (best-effort pendant la transition de schéma).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('crm_events').insert({ prospect_id: id, entity_type: 'prospect', entity_id: id, actor_id: actor, event_type: 'status_changed', from_status: previous?.statut ?? null, to_status: statut })
  revalidate(id)
}

async function getAdminId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not_authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('not_admin')
  return user.id
}

/** Enregistre une note de suivi (admin) sur un prospect. */
export async function setProspectNoteAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  const note = ((formData.get('note') as string) || '').trim().slice(0, 500)
  if (!id) return
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('prospects').update({ note: note || null }).eq('id', id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('crm_events').insert({ prospect_id: id, entity_type: 'prospect', entity_id: id, event_type: 'note_added', note })
  revalidate(id)
}

/** Assigne (ou désassigne) un prospect à un commercial. */
export async function setProspectAssignAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  const assigned = (formData.get('assigned_to') as string) || ''
  if (!id) return
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('prospects').update({ assigned_to: assigned || null }).eq('id', id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('crm_events').insert({ prospect_id: id, entity_type: 'prospect', entity_id: id, event_type: 'assigned', metadata: { assigned_to: assigned || null } })
  revalidate(id)
}

/** Fixe (ou efface) une date de relance. */
export async function setProspectRelanceAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  const relance = (formData.get('relance_le') as string) || ''
  if (!id) return
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('prospects').update({ relance_le: relance || null }).eq('id', id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('crm_events').insert({ prospect_id: id, entity_type: 'prospect', entity_id: id, event_type: 'reminder_set', metadata: { relance_le: relance || null } })
  revalidate(id)
}

/** Enregistre la prochaine action et le motif de perte du prospect. */
export async function setProspectOutcomeAction(formData: FormData): Promise<void> {
  const actor = await getAdminId()
  const id = String(formData.get('id') || '')
  const perteMotif = String(formData.get('perte_motif') || '').trim().slice(0, 120)
  const prochaineAction = String(formData.get('prochaine_action') || '').trim().slice(0, 200)
  const prochaineActionAt = String(formData.get('prochaine_action_at') || '').trim() || null
  if (!id) return
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('prospects').update({ perte_motif: perteMotif || null, prochaine_action: prochaineAction || null, prochaine_action_at: prochaineActionAt, statut_changed_by: actor }).eq('id', id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('crm_events').insert({ prospect_id: id, entity_type: 'prospect', entity_id: id, actor_id: actor, event_type: 'note_added', note: prochaineAction || perteMotif || null, metadata: { perte_motif: perteMotif || null, prochaine_action_at: prochaineActionAt } })
  revalidate(id)
}
