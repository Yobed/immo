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

const VALID_STATUTS = ['nouveau', 'en_cours', 'traite', 'perdu']

/** Change le statut de suivi d'un prospect. */
export async function setProspectStatutAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  const statut = formData.get('statut') as string
  if (!id || !VALID_STATUTS.includes(statut)) return
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('prospects').update({ statut }).eq('id', id)
  revalidatePath('/admin/prospects')
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
  revalidatePath('/admin/prospects')
}
