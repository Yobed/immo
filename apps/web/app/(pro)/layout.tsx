import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let unreadCount = 0

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lu', false)

    unreadCount = count ?? 0
  }

  return (
    <>
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl text-primary">
            Immo CI Pro
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/biens"
              className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors"
            >
              Mes annonces
            </Link>
            <Link
              href="/visites"
              className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors"
            >
              Visites
            </Link>
            <Link
              href="/quittances"
              className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors"
            >
              Quittances
            </Link>
            <Link
              href="/profil"
              className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors"
            >
              Profil
            </Link>
            {user && (
              <NotificationBell userId={user.id} initialUnreadCount={unreadCount} />
            )}
          </div>
        </div>
      </nav>
      {children}
    </>
  )
}
