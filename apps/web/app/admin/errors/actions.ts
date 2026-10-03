'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateErrorStatusAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Accès interdit')

  const id = formData.get('id') as string
  const status = formData.get('status') as string
  if (!id || !status) throw new Error('Paramètres manquants')

  const validStatuses = ['open', 'investigating', 'resolved', 'ignored']
  if (!validStatuses.includes(status)) throw new Error('Statut invalide')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('error_logs')
    .update({ status })
    .eq('id', id)

  if (error) {
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
  }

  revalidatePath('/admin/errors')
}
