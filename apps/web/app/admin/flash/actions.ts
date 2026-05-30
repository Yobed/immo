'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createLocauxAdminClient } from '@/lib/supabase/locaux'

/** Vérifie que l'utilisateur courant est admin. */
async function assertAdmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not_authenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('not_admin')
}

/**
 * Retire une offre flash : status='inactive' dans la base locaux.
 * Soft-hide réversible — l'offre disparaît du catalogue / des offres flash
 * (isStillActive renvoie false) mais la ligne reste en base.
 */
export async function retirerFlashAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  if (!id) return
  const sb = createLocauxAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from('locaux') as any).update({ status: 'inactive' }).eq('id', Number(id))
  revalidatePath('/admin/flash')
}

/** Restaure une offre flash masquée : status='active'. */
export async function restaurerFlashAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  if (!id) return
  const sb = createLocauxAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from('locaux') as any).update({ status: 'active' }).eq('id', Number(id))
  revalidatePath('/admin/flash')
}
