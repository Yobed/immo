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
import { BackToHomeButton } from '@/components/layout/BackToHomeButton'
import { HeaderScrollDetector } from '@/components/layout/HeaderScrollDetector'
import { ActivityFeed } from '@/components/ui/ActivityFeed'

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

  // Navigation desktop — concise pour éviter le wrap.
  // "Rechercher" est déjà couvert par la SearchBar du header.
  // "Résidences meublées" est accessible via le filtre sur /catalogue.
  let navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/catalogue', label: 'Annonces' },
    { href: '/offre-flash', label: 'Offres flash' },
    { href: '/services', label: 'Services' },
  ]

  // Pour le propriétaire : nav TOP minimal (4 items) pour éviter le wrap sur 2 lignes.
  // Tous les autres (Visites, Messages, Quittances, Profil & KYC, Vue publique)
  // sont accessibles via le UserMenu dropdown (avatar) à droite.
  if (role === 'pro') {
    navLinks = [
      { href: '/', label: 'Accueil' },
      { href: '/recherche', label: 'Rechercher' },
      { href: '/dashboard', label: 'Tableau de bord' },
      { href: '/mes-biens', label: 'Mes annonces' },
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
      {/* Détecteur de scroll qui active le mode "header compact glassmorphism".
          Voir globals.css → règles `html[data-header-scrolled]`. */}
      <HeaderScrollDetector />
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--border)] anim-fade-down"
        style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <MagneticWrapper>
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              <Image
                src="/bogbes-logo.png"
                alt="BOGBE'S GROUPE"
                width={36}
                height={36}
                className="w-9 h-9 object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-display text-sm xl:text-base font-bold text-[var(--text)] hidden lg:inline whitespace-nowrap tracking-tight">
                BOGBE&apos;S <span className="text-[var(--secondary)]">GROUPE</span>
              </span>
            </Link>
          </MagneticWrapper>

          {/* Search bar — desktop only, plus compacte pour libérer de l'espace nav */}
          <div className="flex-1 max-w-xs xl:max-w-sm hidden md:block">
            <SearchBar placeholder="Commune, quartier, type..." />
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <MagneticWrapper key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link px-2.5 py-2 font-sans text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 rounded-btn hover:bg-[var(--surface)] whitespace-nowrap"
                >
                  {link.label}
                </Link>
              </MagneticWrapper>
            ))}

            <div className="w-px h-5 bg-[var(--border)] mx-1.5" />

            <ThemeToggle />
            <LanguageSwitcher variant="compact" />

            <div className="w-px h-5 bg-[var(--border)] mx-1.5" />

            {user ? (
              <div className="flex items-center gap-2">
                {role === 'pro' && (
                  <Link
                    href="/mes-biens/nouveau"
                    className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--secondary)] text-white text-[11px] font-sans font-bold uppercase tracking-wider rounded-btn hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none"><path d="M12 5v14M5 12h14"/></svg>
                    Annonce
                  </Link>
                )}
                <UserMenu email={user.email ?? ''} role={role} isAdmin={isAdmin} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <MagneticWrapper>
                  <Link
                    href="/login"
                    className="px-2.5 py-2 font-sans text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 rounded-btn hover:bg-[var(--surface)] whitespace-nowrap"
                  >
                    Se connecter
                  </Link>
                </MagneticWrapper>
                <MagneticWrapper>
                  <Link
                    href="/register"
                    className="px-3 py-2 font-sans text-[13px] font-semibold bg-[var(--secondary)] text-[var(--on-accent)] rounded-btn hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
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

      <BackToHomeButton />

      <PageTransition>
        {children}
      </PageTransition>

      <MobileTabBar />
      <OnboardingModal />
      <ActivityFeed />
    </>
  )
}
