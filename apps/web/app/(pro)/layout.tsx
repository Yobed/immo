import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { UserMenu } from '@/components/auth/UserMenu'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { BackToHomeButton } from '@/components/layout/BackToHomeButton'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/recherche', label: 'Rechercher' },
  { href: '/mes-biens', label: 'Mes annonces' },
  { href: '/visites', label: 'Visites' },
  { href: '/quittances', label: 'Quittances' },
  { href: '/avis-recus', label: 'Avis reçus' },
  { href: '/agence', label: 'Mon agence' },
  { href: '/ambassadeur', label: 'Ambassadeur' },
  { href: '/profil', label: 'Profil & KYC' },
  { href: '/messages', label: 'Messages' },
]

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let unreadCount = 0
  let role: 'pro' | 'client' | 'public' = 'pro' // Par défaut pro pour ce layout
  let isAdmin = false

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
    if (profile?.role === 'proprietaire' || profile?.role === 'agence') role = 'pro'
    else if (profile?.role === 'locataire') role = 'client'
    else if (profile?.role === 'admin') { role = 'pro'; isAdmin = true }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="glass sticky top-0 z-40 border-b border-[var(--border)]"
        style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
            <Image
              src="/bogbes-logo.png"
              alt="BOGBE'S GROUPE"
              width={40}
              height={40}
              className="w-10 h-10 object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-display text-base font-bold text-[var(--text)] tracking-tight">BOGBE&apos;S GROUPE</span>
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

            <ThemeToggle />
            {user && <NotificationBell userId={user.id} initialUnreadCount={unreadCount} />}
            {user && <UserMenu email={user.email ?? ''} role={role} isAdmin={isAdmin} />}
            <MobileMenu links={navLinks} ctaLinks={[{ href: '/mes-biens/nouveau', label: '+ Nouvelle annonce', variant: 'primary' }]} user={user ? { email: user.email ?? '', role, isAdmin } : undefined} />
          </div>
        </div>
      </header>

      <BackToHomeButton />
      <main className="pb-20 lg:pb-0">{children}</main>
      <MobileTabBar />
    </div>
  )
}
