'use server'

import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function mergeProspectsAction(formData: FormData) {
  const primaryId = String(formData.get('primary_id') || '')
  const duplicateId = String(formData.get('duplicate_id') || '')
  if (!primaryId || !duplicateId || primaryId === duplicateId) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/prospects/doublons')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') notFound()
  const admin = createAdminClient()
  for (const table of ['contact_requests', 'visites', 'reservations']) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from(table).update({ prospect_id: primaryId }).eq('prospect_id', duplicateId)
  }
  // La fiche secondaire est conservée pour l'audit, mais retirée du pipeline actif.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('prospects').update({ statut: 'perdu', perte_motif: 'doublon', prochaine_action: null, prochaine_action_at: null }).eq('id', duplicateId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('crm_events').insert({ prospect_id: primaryId, event_type: 'merge', note: `Fiche ${duplicateId} fusionnée depuis la vue doublons`, actor_id: user.id })
  revalidatePath('/admin/prospects/doublons')
  revalidatePath('/admin/performance')
}
