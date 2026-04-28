'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function deleteBienAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const bienId = formData.get('bienId') as string
  if (!bienId) return

  const admin = createAdminClient()

  const { data: files } = await admin.storage.from('biens-medias').list(bienId)
  if (files && files.length > 0) {
    const paths = files.map(f => `${bienId}/${f.name}`)
    await admin.storage.from('biens-medias').remove(paths)
  }

  await admin.from('biens').delete().eq('id', bienId)
  revalidatePath('/admin/moderation')
}

export async function suspendreBienAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const bienId = formData.get('bienId') as string
  if (!bienId) return

  const admin = createAdminClient()
  await admin.from('biens').update({ statut: 'suspendu' }).eq('id', bienId)
  revalidatePath('/admin/moderation')
}

export async function republierBienAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const bienId = formData.get('bienId') as string
  if (!bienId) return

  const admin = createAdminClient()
  await admin.from('biens').update({ statut: 'publie' }).eq('id', bienId)
  revalidatePath('/admin/moderation')
}
