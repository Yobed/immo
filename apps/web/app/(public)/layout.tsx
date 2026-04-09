import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { SearchBar } from '@/components/search/SearchBar'
import { UserMenu } from '@/components/auth/UserMenu'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const navLinks = [
    { href: '/biens', label: 'Annonces', icon: '🏠' },
    { href: '/recherche', label: 'Rechercher', icon: '🔍' },
    { href: '/recherche?type_bien=residence_meublee', label: 'Résidences meublées', icon: '🛋️' },
  ]

  const ctaLinks = user
    ? [{ href: '/dashboard', label: 'Mon espace', variant: 'primary' as const }]
    : [
        { href: '/login', label: 'Se connecter', variant: 'outline' as const },
        { href: '/register', label: "S'inscrire", variant: 'primary' as const },
      ]

  return (
    <>
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-sm">
              IC
            </div>
            <span className="font-display text-xl text-primary hidden sm:block">Immo CI</span>
          </Link>

          {/* Search bar avec autocomplete — desktop */}
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar placeholder="Commune, quartier, type de bien..." />
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/biens" className="px-3 py-1.5 font-sans text-sm text-muted hover:text-primary transition-colors rounded-btn hover:bg-[var(--surface)]">
              Annonces
            </Link>
            <Link href="/recherche?type_bien=residence_meublee" className="px-3 py-1.5 font-sans text-sm text-muted hover:text-primary transition-colors rounded-btn hover:bg-[var(--surface)]">
              Résidences
            </Link>

            <div className="w-px h-5 bg-[var(--border)] mx-1" />

            {user ? (
              <UserMenu email={user.email ?? ''} role="public" />
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors rounded-btn hover:bg-[var(--surface)]">
                  Se connecter
                </Link>
                <Link href="/register" className="px-3 py-1.5 font-sans text-sm bg-primary text-white rounded-btn hover:bg-primary/90 transition-colors">
                  S&apos;inscrire
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu */}
          <MobileMenu links={navLinks} ctaLinks={ctaLinks} />
        </div>
      </header>

      {children}

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--border)] mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold text-xs">IC</div>
              <span className="font-display text-lg text-primary">Immo CI</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted font-sans">
              <Link href="/biens" className="hover:text-primary transition-colors">Annonces</Link>
              <Link href="/recherche" className="hover:text-primary transition-colors">Recherche</Link>
              <Link href="/register" className="hover:text-primary transition-colors">Publier un bien</Link>
              <Link href="/login" className="hover:text-primary transition-colors">Connexion</Link>
            </div>
            <p className="text-xs text-muted font-sans">© 2025 Immo CI · Abidjan, Côte d&apos;Ivoire</p>
          </div>
        </div>
      </footer>
    </>
  )
}
