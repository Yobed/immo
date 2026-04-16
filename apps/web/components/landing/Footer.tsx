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
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Logo + Tagline */}
        <div className="mb-12">
          <p className="font-display text-2xl font-bold text-white mb-2">
            Immo CI
          </p>
          <p className="font-sans text-white/60 text-sm max-w-xs">
            La plateforme immobilière premium de Côte d&apos;Ivoire. Location, vente et gestion de biens à Abidjan et partout en CI.
          </p>
        </div>

        {/* Colonnes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-white/90 uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-sans text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Séparateur */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-sans text-sm text-white/50">
            © 2026 Immo CI. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link href="/mentions-legales" className="font-sans text-xs text-white/50 hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="font-sans text-xs text-white/50 hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link href="/cgu" className="font-sans text-xs text-white/50 hover:text-white transition-colors">
              CGU
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
