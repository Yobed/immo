import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { AutoRefreshOnFocus } from '@/components/admin/AutoRefreshOnFocus'

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

  if (profile?.role !== 'admin') {
    return (
      <main className="min-h-screen bg-[var(--surface-hover)] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-amber-950 mb-2">Accès Administrateur Requis</h1>
          <p className="text-sm text-amber-900 mb-4">
            Vous êtes connecté avec le compte <strong className="font-mono">{user.email}</strong>, qui possède actuellement le rôle <strong className="font-mono">"{profile?.role || 'aucun'}"</strong>.
          </p>
          <p className="text-xs text-amber-800 mb-6">
            Pour accéder à la console d'administration, veuillez vous connecter avec un compte administrateur autorisé.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/login?redirect=/admin/suivi"
              className="inline-flex justify-center items-center rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-950 transition-colors"
            >
              Changer de compte
            </Link>
            <Link
              href="/"
              className="inline-flex justify-center items-center rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-900 hover:bg-amber-100/50 transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Compteur d'annonces en attente pour le badge "Validation".
  let pendingCount = 0
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (admin.from('biens') as any)
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'en_attente')
    pendingCount = count ?? 0
  } catch {
    /* badge best-effort */
  }

  return (
    <AdminShell email={user.email ?? ''} pendingCount={pendingCount}>
      <AutoRefreshOnFocus />
      {children}
    </AdminShell>
  )
}
