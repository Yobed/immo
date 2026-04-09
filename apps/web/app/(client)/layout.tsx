import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
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
          <Link href="/" className="font-display text-xl text-primary">
            Immo CI
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/recherche" className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors">
              Annonces
            </Link>
            <Link href="/favoris" className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors">
              Favoris
            </Link>
            <Link href="/messages" className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors">
              Messages
            </Link>
            <Link href="/mes-visites" className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors">
              Visites
            </Link>
            <Link href="/reservations" className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors">
              Réservations
            </Link>
            <Link href="/mes-avis" className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors">
              Mes avis
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
