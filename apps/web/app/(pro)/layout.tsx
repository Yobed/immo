import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { UserMenu } from '@/components/auth/UserMenu'

const navLinks = [
  { href: '/mes-biens', label: 'Mes annonces', icon: '🏠' },
  { href: '/visites', label: 'Visites', icon: '📅' },
  { href: '/quittances', label: 'Quittances', icon: '📄' },
  { href: '/avis-recus', label: 'Avis reçus', icon: '⭐' },
  { href: '/profil', label: 'Profil & KYC', icon: '👤' },
  { href: '/messages', label: 'Messages', icon: '💬' },
]

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
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-sm">IC</div>
            <div className="hidden sm:block">
              <span className="font-display text-lg text-primary">Immo CI</span>
              <span className="ml-1.5 text-xs font-sans text-white bg-secondary px-1.5 py-0.5 rounded-pill">PRO</span>
            </div>
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
            {/* Nouvelle annonce */}
            <Link
              href="/mes-biens/nouveau"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white text-sm font-sans font-medium rounded-btn hover:bg-secondary/90 transition-colors"
            >
              <span>+</span> Annonce
            </Link>

            {user && <NotificationBell userId={user.id} initialUnreadCount={unreadCount} />}

            {user && <UserMenu email={user.email ?? ''} role="pro" />}

            <MobileMenu links={navLinks} ctaLinks={[{ href: '/mes-biens/nouveau', label: '+ Nouvelle annonce', variant: 'primary' }]} />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
