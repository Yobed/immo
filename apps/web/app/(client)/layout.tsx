import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { UserMenu } from '@/components/auth/UserMenu'

const navLinks = [
  { href: '/biens', label: 'Annonces', icon: '🏠' },
  { href: '/favoris', label: 'Favoris', icon: '❤️' },
  { href: '/mes-visites', label: 'Mes visites', icon: '📅' },
  { href: '/reservations', label: 'Réservations', icon: '🗓️' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/mes-avis', label: 'Mes avis', icon: '⭐' },
]

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
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/biens" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-sm">IC</div>
            <span className="font-display text-lg text-primary hidden sm:block">Immo CI</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 font-sans text-sm text-muted hover:text-primary hover:bg-primary/5 transition-colors rounded-btn"
              >
                <span className="text-base">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user && <NotificationBell userId={user.id} initialUnreadCount={unreadCount} />}

            {user && <UserMenu email={user.email ?? ''} role="client" />}

            <MobileMenu links={navLinks} />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
