import Link from 'next/link'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="bg-white border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-primary">
            Immo CI
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/recherche"
              className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors"
            >
              Rechercher
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 font-sans text-sm text-[var(--text)] hover:text-primary transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 font-sans text-sm bg-primary text-white rounded-btn hover:bg-primary/90 transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </>
  )
}
