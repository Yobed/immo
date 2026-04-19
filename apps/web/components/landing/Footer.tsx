import Link from 'next/link'

const columns = [
  {
    title: 'À propos',
    links: [
      { label: 'Notre mission', href: '/a-propos' },
      { label: 'Équipe', href: '/equipe' },
      { label: 'Blog', href: '/blog' },
      { label: 'Presse', href: '/presse' },
    ],
  },
  {
    title: 'Biens',
    links: [
      { label: 'Location', href: '/biens?type=location' },
      { label: 'Vente', href: '/biens?type=vente' },
      { label: 'Résidences meublées', href: '/biens?type=meuble' },
      { label: 'Propriétaires', href: '/proprietaires' },
      { label: 'Publier une annonce', href: '/register' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { label: 'Connexion', href: '/login' },
      { label: 'Inscription', href: '/register' },
      { label: 'Espace Pro', href: '/pro' },
      { label: 'Espace Client', href: '/client' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'Support', href: '/support' },
      { label: 'WhatsApp', href: 'https://wa.me/2250700000000' },
      { label: 'Email', href: 'mailto:contact@immo-ci.com' },
      { label: 'Partenariats', href: '/partenariats' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-[var(--background)] text-[var(--text)] relative overflow-hidden pt-24 pb-12 border-t border-[var(--border)]">
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          
          {/* Brand Identity */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-8">
              <span className="font-display text-2xl font-semibold tracking-tighter text-[var(--text)]">
                Immo <span className="text-gradient-gold" style={{ 
                  background: 'linear-gradient(135deg,#F97316,#FB923C)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>CI</span>
              </span>
            </Link>
            <p className="font-sans text-sm text-[var(--text-muted)] max-w-xs leading-relaxed mb-10 font-light">
              L'excellence immobilière en Côte d'Ivoire. Nous redéfinissons les standards du prestige à travers une technologie de pointe et une rigueur absolue.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent-luxury)] transition-all cursor-pointer">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent-luxury)] transition-all cursor-pointer">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.012 3.823.06 1.062.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.365.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.365-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.823.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16.35a4.35 4.35 0 110-8.7 4.35 4.35 0 010 8.7zm6.404-10.37a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent-luxury)] transition-all cursor-pointer">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </div>
            </div>
          </div>

          {/* Columns */}
          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="font-display text-[10px] font-bold text-[var(--text)] uppercase tracking-[0.3em] mb-8">
                {col.title}
              </h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-all duration-500 block hover:translate-x-1"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] font-bold">
            © 2026 ImmoDash Global. Tous droits réservés.
          </p>
          <div className="flex gap-10">
            <Link href="/mentions-legales" className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              Legals
            </Link>
            <Link href="/confidentialite" className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              Privacy
            </Link>
            <Link href="/cgu" className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Background Signature Accent */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)', filter: 'blur(100px)' }} />
    </footer>
  )
}
