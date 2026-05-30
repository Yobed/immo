'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Vérifie l'admin et renvoie son id. */
async function getAdminUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not_authenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('not_admin')
  return user.id
}

/** Notifie le propriétaire (in-app) du résultat de la validation. */
async function notifyOwner(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  ownerId: string | null,
  bienId: string,
  kind: 'validee' | 'refusee',
  titre: string,
  motif?: string,
): Promise<void> {
  if (!ownerId) return
  const payload =
    kind === 'validee'
      ? {
          type: 'annonce_validee',
          titre: 'Annonce approuvée ✅',
          contenu: `Votre annonce « ${titre} » a été validée par notre équipe et est maintenant en ligne.`,
        }
      : {
          type: 'annonce_refusee',
          titre: 'Annonce à corriger',
          contenu: `Votre annonce « ${titre} » n'a pas été validée. Motif : ${motif || 'non précisé'}. Vous pouvez la modifier puis la resoumettre.`,
        }
  try {
    await admin.from('notifications').insert({
      user_id: ownerId,
      lien_type: 'bien',
      lien_id: bienId,
      ...payload,
    })
  } catch {
    /* notification best-effort — ne bloque pas la validation */
  }
}

/** Approuve une annonce en attente → publie. */
export async function approuverBienAction(formData: FormData): Promise<void> {
  const adminId = await getAdminUserId()
  const bienId = formData.get('bienId') as string
  if (!bienId) return

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (admin.from('biens') as any)
    .select('proprietaire_id, titre')
    .eq('id', bienId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('biens') as any)
    .update({
      statut: 'publie',
      valide_le: new Date().toISOString(),
      valide_par: adminId,
      rejet_motif: null,
    })
    .eq('id', bienId)

  await notifyOwner(admin, bien?.proprietaire_id ?? null, bienId, 'validee', bien?.titre ?? 'votre bien')

  revalidatePath('/admin/validation')
  revalidatePath('/mes-biens')
}

/** Refuse une annonce en attente → refuse, avec motif communiqué au proprio. */
export async function refuserBienAction(formData: FormData): Promise<void> {
  const adminId = await getAdminUserId()
  const bienId = formData.get('bienId') as string
  const motif = ((formData.get('motif') as string) || '').trim()
  if (!bienId) return

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (admin.from('biens') as any)
    .select('proprietaire_id, titre')
    .eq('id', bienId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('biens') as any)
    .update({
      statut: 'refuse',
      valide_le: new Date().toISOString(),
      valide_par: adminId,
      rejet_motif: motif || 'Non précisé',
    })
    .eq('id', bienId)

  await notifyOwner(admin, bien?.proprietaire_id ?? null, bienId, 'refusee', bien?.titre ?? 'votre bien', motif)

  revalidatePath('/admin/validation')
  revalidatePath('/mes-biens')
}
