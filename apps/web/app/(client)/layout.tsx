import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { UserMenu } from '@/components/auth/UserMenu'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { BackToHomeButton } from '@/components/layout/BackToHomeButton'

const navLinks = [
  { href: '/recherche', label: 'Rechercher' },
  { href: '/biens', label: 'Annonces' },
  { href: '/favoris', label: 'Favoris' },
  { href: '/mes-visites', label: 'Mes visites' },
  { href: '/reservations', label: 'Réservations' },
  { href: '/messages', label: 'Messages' },
  { href: '/mes-avis', label: 'Mes avis' },
]

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let unreadCount = 0
  let role: 'pro' | 'client' | 'public' = 'client'
  let isAdmin = false

  if (user) {
    const [{ count }, { data: profile }] = await Promise.all([
      (supabase as any)
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('lu', false),
      supabase.from('profiles').select('role').eq('id', user.id).single()
    ])

    unreadCount = count ?? 0
    if (profile?.role === 'proprietaire') role = 'pro'
    else if (profile?.role === 'locataire') role = 'client'
    else if (profile?.role === 'admin') { role = 'pro'; isAdmin = true }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="glass sticky top-0 z-40 border-b border-[var(--border)]"
        style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <Image
              src="/bogbes-logo.png"
              alt="BOGBE'S GROUPE"
              width={40}
              height={40}
              className="w-10 h-10 object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-display text-base font-bold hidden sm:block tracking-tight text-[var(--text)]">
              BOGBE&apos;S GROUPE
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-2 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all duration-200 rounded-btn"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user && <NotificationBell userId={user.id} initialUnreadCount={unreadCount} />}
            {user && <UserMenu email={user.email ?? ''} role={role} isAdmin={isAdmin} />}
            <MobileMenu links={navLinks} user={user ? { email: user.email ?? '', role, isAdmin } : undefined} />
          </div>
        </div>
      </header>

      <BackToHomeButton />
      <main className="pb-20 lg:pb-0">{children}</main>
      <MobileTabBar />
    </div>
  )
}
