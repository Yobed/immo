import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { SearchBar } from '@/components/search/SearchBar'
import { UserMenu } from '@/components/auth/UserMenu'
import { MagneticWrapper } from '@/components/landing/MagneticWrapper'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const navLinks = [
    { href: '/biens', label: 'Annonces' },
    { href: '/recherche', label: 'Rechercher' },
    { href: '/recherche?type_bien=residence_meublee', label: 'Résidences meublées' },
  ]

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
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-display font-bold text-sm shadow-sm transition-transform duration-200 group-hover:scale-105"
                style={{ boxShadow: 'var(--shadow-primary-glow)' }}>
                IC
              </div>
              <span className="font-display text-xl font-semibold text-[var(--text)] hidden sm:block tracking-tight">
                Immo <span className="text-gradient-gold" style={{
                  background: 'linear-gradient(135deg,#F97316,#FB923C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>CI</span>
              </span>
            </Link>
          </MagneticWrapper>

          {/* Search bar — desktop */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar placeholder="Commune, quartier, type de bien..." />
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-0.5">
            <MagneticWrapper>
              <Link href="/biens"
                className="nav-link px-3 py-2 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 rounded-btn hover:bg-[var(--surface)]">
                Annonces
              </Link>
            </MagneticWrapper>
            <MagneticWrapper>
              <Link href="/recherche?type_bien=residence_meublee"
                className="nav-link px-3 py-2 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-200 rounded-btn hover:bg-[var(--surface)]">
                Résidences
              </Link>
            </MagneticWrapper>

            <div className="w-px h-5 bg-[var(--border)] mx-2" />

            <ThemeToggle />

            <div className="w-px h-5 bg-[var(--border)] mx-2" />

            {user ? (
              <UserMenu email={user.email ?? ''} role="public" />
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
                    className="px-4 py-2 font-sans text-sm font-semibold bg-[var(--secondary)] text-white rounded-btn hover:opacity-90 transition-opacity">
                    S&apos;inscrire
                  </Link>
                </MagneticWrapper>
              </div>
            )}
          </nav>

          {/* Mobile menu */}
          <MobileMenu links={navLinks} ctaLinks={ctaLinks} />
        </div>
      </header>

      {children}

    </>
  )
}
