import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { UserMenu } from '@/components/auth/UserMenu'

const navLinks = [
  { href: '/mes-biens', label: 'Mes annonces' },
  { href: '/visites', label: 'Visites' },
  { href: '/quittances', label: 'Quittances' },
  { href: '/avis-recus', label: 'Avis reçus' },
  { href: '/ambassadeur', label: 'Ambassadeur' },
  { href: '/profil', label: 'Profil & KYC' },
  { href: '/messages', label: 'Messages' },
]

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let unreadCount = 0
  let role: 'pro' | 'client' | 'public' = 'pro' // Par défaut pro pour ce layout

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="glass sticky top-0 z-40 border-b border-[var(--border)]"
        style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-mid)] flex items-center justify-center text-white font-display font-bold text-sm shadow-sm transition-transform duration-200 group-hover:scale-105">
              IC
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-display text-lg font-semibold text-[var(--primary)] tracking-tight">Immo CI</span>
              <span className="text-xs font-sans font-semibold text-white bg-[var(--secondary)] px-2 py-0.5 rounded-pill tracking-wider">PRO</span>
            </div>
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
            <Link
              href="/mes-biens/nouveau"
              className="btn-secondary-glow hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[var(--secondary)] text-white text-sm font-sans font-medium rounded-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M12 5v14M5 12h14"/></svg>
              Annonce
            </Link>

            {user && <NotificationBell userId={user.id} initialUnreadCount={unreadCount} />}
            {user && <UserMenu email={user.email ?? ''} role={role} />}
            <MobileMenu links={navLinks} ctaLinks={[{ href: '/mes-biens/nouveau', label: '+ Nouvelle annonce', variant: 'primary' }]} />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
