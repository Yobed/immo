import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { SearchBar } from '@/components/search/SearchBar'
import { UserMenu } from '@/components/auth/UserMenu'

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
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-display font-bold text-sm shadow-sm transition-transform duration-200 group-hover:scale-105"
              style={{ boxShadow: 'var(--shadow-primary-glow)' }}>
              IC
            </div>
            <span className="font-display text-xl font-semibold text-[var(--primary)] hidden sm:block tracking-tight">
              Immo <span className="text-gradient-gold" style={{
                background: 'linear-gradient(135deg,#BF8C2C,#E8B84B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>CI</span>
            </span>
          </Link>

          {/* Search bar — desktop */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar placeholder="Commune, quartier, type de bien..." />
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-0.5">
            <Link href="/biens"
              className="nav-link px-3 py-2 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors duration-200 rounded-btn hover:bg-[var(--primary-light)]">
              Annonces
            </Link>
            <Link href="/recherche?type_bien=residence_meublee"
              className="nav-link px-3 py-2 font-sans text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors duration-200 rounded-btn hover:bg-[var(--primary-light)]">
              Résidences
            </Link>

            <div className="w-px h-5 bg-[var(--border)] mx-2" />

            {user ? (
              <UserMenu email={user.email ?? ''} role="public" />
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"
                  className="px-3 py-2 font-sans text-sm text-[var(--text)] hover:text-[var(--primary)] transition-colors duration-200 rounded-btn hover:bg-[var(--surface)]">
                  Se connecter
                </Link>
                <Link href="/register"
                  className="btn-primary-glow px-4 py-2 font-sans text-sm font-medium bg-[var(--primary)] text-white rounded-btn">
                  S&apos;inscrire
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu */}
          <MobileMenu links={navLinks} ctaLinks={ctaLinks} />
        </div>
      </header>

      {children}

      {/* ── Footer ── */}
      <footer className="bg-[var(--primary)] mt-16 relative overflow-hidden">
        {/* Pattern de fond */}
        <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

            {/* Logo blanc */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="font-display font-bold text-sm text-white">IC</span>
              </div>
              <span className="font-display text-xl font-semibold text-white tracking-tight">
                Immo CI
              </span>
            </div>

            {/* Liens */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/60 font-sans">
              {[
                { href: '/biens', label: 'Annonces' },
                { href: '/recherche', label: 'Recherche' },
                { href: '/register', label: 'Publier un bien' },
                { href: '/login', label: 'Connexion' },
              ].map(({ href, label }) => (
                <Link key={href} href={href}
                  className="hover:text-white transition-colors duration-200">
                  {label}
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-xs text-white/40 font-sans">
              © 2025 Immo CI · Abidjan
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
