'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { locauxAdminForId } from '@/lib/supabase/locaux'

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
  // Routage par id : les offres historiques (id ≤ 99999) vivent dans l'ancien projet
  const sb = locauxAdminForId(Number(id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from('locaux') as any).update({ status: 'inactive' }).eq('id', Number(id))
  revalidatePath('/admin/flash')
}

/** Restaure une offre flash masquée : status='active'. */
export async function restaurerFlashAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  if (!id) return
  const sb = locauxAdminForId(Number(id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from('locaux') as any).update({ status: 'active' }).eq('id', Number(id))
  revalidatePath('/admin/flash')
}

/**
 * Marque une offre flash comme OCCUPÉE : disponible='Non'.
 * La plupart des biens scrapés sont déjà loués/vendus quand on appelle le
 * démarcheur. `disponible='non'` exclut le bien du catalogue ET des
 * propositions Sapphire (isStillActive → false), sans supprimer la ligne.
 */
export async function marquerOccupeAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  if (!id) return
  const sb = locauxAdminForId(Number(id))
  // ⚠️ 'non' EN MINUSCULE obligatoire : le filtre DB du catalogue paginé
  // (consolidated.ts) compare `disponible.neq.non` de façon SENSIBLE à la casse.
  // 'Non' (majuscule) était exclu par le mapper JS (Sapphire) mais PAS par ce
  // filtre DB → l'offre restait visible dans le catalogue paginé.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from('locaux') as any).update({ disponible: 'non' }).eq('id', Number(id))
  revalidatePath('/admin/flash')
}

/** Marque une offre flash comme DISPONIBLE : disponible='oui' (réintègre le catalogue). */
export async function marquerDisponibleAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = formData.get('id') as string
  if (!id) return
  const sb = locauxAdminForId(Number(id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from('locaux') as any).update({ disponible: 'oui' }).eq('id', Number(id))
  revalidatePath('/admin/flash')
}
