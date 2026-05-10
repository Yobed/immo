import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { SearchBar } from '@/components/search/SearchBar'
import { UserMenu } from '@/components/auth/UserMenu'
import { MagneticWrapper } from '@/components/landing/MagneticWrapper'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import { PageTransition } from '@/components/layout/PageTransition'
import { OnboardingModal } from '@/components/ui/OnboardingModal'

// Cache-bust: 2026-04-20T13:42:00Z

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Récupérer le rôle réel depuis le profil pour le menu utilisateur
  let role: 'pro' | 'client' | 'public' = 'public'
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'proprietaire') role = 'pro'
    else if (profile?.role === 'locataire') role = 'client'
    else if (profile?.role === 'admin') { role = 'pro'; isAdmin = true }
  }

  // Navigation de base
  let navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/biens', label: 'Annonces' },
    { href: '/offre-flash', label: '🔥 Offres flash' },
    { href: '/services', label: 'Services' },
    { href: '/recherche', label: 'Rechercher' },
    { href: '/recherche?type_bien=residence_meublee', label: 'Résidences meublées' },
  ]

  // Si c'est un propriétaire, on lui affiche son menu complet pour ne pas qu'il soit "perdu"
  if (role === 'pro') {
    navLinks = [
      { href: '/', label: 'Accueil' },
      { href: '/recherche', label: 'Rechercher' },
      { href: '/dashboard', label: 'Tableau de bord' },
      { href: '/mes-biens', label: 'Mes annonces' },
      { href: '/visites', label: 'Visites' },
      { href: '/messages', label: 'Messages' },
      { href: '/quittances', label: 'Quittances' },
      { href: '/profil', label: 'Profil & KYC' },
      { href: '/biens', label: 'Vue publique' },
    ]
  }

  const ctaLinks = user
    ? [{ href: '/dashboard', label: 'Mon espace', variant: 'primary' as const }]
    : [
        { href: '/login', label: 'Se connecter', variant: 'outline' as const },
        { href: '/register', label: "S'inscrire", variant: 'primary' as const },
      ]

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--border)] anim-fade-down"
        style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <MagneticWrapper>
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <Image
                src="/bogbes-logo.png"
                alt="BOGBE'S GROUPE"
                width={40}
                height={40}
                className="w-10 h-10 object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-display text-base font-bold text-[var(--text)] hidden sm:block tracking-tight leading-tight">
                BOGBE&apos;S <span style={{
                  background: 'linear-gradient(135deg,#F97316,#FB923C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>GROUPE</span>
              </span>
            </Link>
          </MagneticWrapper>

          {/* Search bar — always visible */}
          <div className="flex-1 max-w-md">
            <SearchBar placeholder="Commune, quartier, type de bien..." />
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <MagneticWrapper key={link.href}>
                <Link 
                  href={link.href}
                  className="nav-link px-3 py-2 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 rounded-btn hover:bg-[var(--surface)]"
                >
                  {link.label}
                </Link>
              </MagneticWrapper>
            ))}

            <div className="w-px h-5 bg-[var(--border)] mx-2" />

            <ThemeToggle />

            <div className="w-px h-5 bg-[var(--border)] mx-1" />

            <LanguageSwitcher variant="compact" />

            <div className="w-px h-5 bg-[var(--border)] mx-2" />

            {user ? (
              <div className="flex items-center gap-3">
                {role === 'pro' && (
                  <Link
                    href="/mes-biens/nouveau"
                    className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-[var(--secondary)] text-white text-[11px] font-sans font-bold uppercase tracking-wider rounded-btn hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none"><path d="M12 5v14M5 12h14"/></svg>
                    Annonce
                  </Link>
                )}
                <UserMenu email={user.email ?? ''} role={role} isAdmin={isAdmin} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MagneticWrapper>
                  <Link href="/login"
                    className="px-3 py-2 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 rounded-btn hover:bg-[var(--surface)]">
                    Se connecter
                  </Link>
                </MagneticWrapper>
                <MagneticWrapper>
                  <Link href="/register"
                    className="px-4 py-2 font-sans text-sm font-semibold bg-[var(--secondary)] text-[var(--on-accent)] rounded-btn hover:opacity-90 transition-opacity">
                    S&apos;inscrire
                  </Link>
                </MagneticWrapper>
              </div>
            )}
          </nav>

          {/* Mobile menu */}
          <div className="md:hidden">
            <MobileMenu links={navLinks} ctaLinks={ctaLinks} user={user ? { email: user.email ?? '', role, isAdmin } : undefined} />
          </div>
        </div>
      </header>

      <PageTransition>
        {children}
      </PageTransition>
      
      <MobileTabBar />
      <OnboardingModal />
    </>
  )
}
