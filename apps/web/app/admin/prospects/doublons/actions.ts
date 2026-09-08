'use server'

import { revalidatePath } from 'next/cache'
import { callCrmRpc } from '@/lib/crm/rpc'
import { formUuid, type CrmActionResult } from '@/lib/crm/input'

export async function mergeProspectsAction(form: FormData): Promise<CrmActionResult> {
  try {
    const primaryId = formUuid(form, 'primary_id')
    const duplicateId = formUuid(form, 'duplicate_id')
    await callCrmRpc('crm_merge_prospects', {
      p_primary: primaryId, p_duplicate: duplicateId, p_request: formUuid(form, 'request_id'),
    })
    for (const path of ['/admin/prospects/doublons', '/admin/prospects', '/admin/performance',
      '/admin/prospects/' + primaryId, '/admin/prospects/' + duplicateId]) revalidatePath(path)
    return { message: 'Fusion enregistrée. L’historique des deux fiches est conservé.' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'La fusion n’a pas été enregistrée.' }
  }
}
