import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

/**
 * Layout de la console d'administration — espace DISSOCIÉ de l'espace
 * propriétaire. Garde l'accès (admin uniquement) centralisée ici, et fournit
 * un chrome dédié via AdminShell. Les pages admin gardent leur contenu propre.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/suivi')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') notFound()

  return <AdminShell email={user.email ?? ''}>{children}</AdminShell>
}
