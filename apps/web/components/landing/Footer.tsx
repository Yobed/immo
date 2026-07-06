'use client'
import Link from 'next/link'
import Image from 'next/image'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useT } from '@/lib/i18n/client'
import { SEO_COMMUNES } from '@/lib/seo/communes'

export function Footer() {
  const t = useT()
  const columns = [
    {
      title: t.footer.about,
      links: [
        { label: t.footer.mission, href: '/a-propos' },
        { label: t.footer.team, href: '/equipe' },
        { label: t.footer.blog, href: '/blog' },
        { label: t.footer.press, href: '/presse' },
      ],
    },
    {
      title: t.footer.biens,
      links: [
        { label: t.catalogue.title, href: '/catalogue' },
        { label: t.footer.rentals, href: '/catalogue?type=location' },
        { label: t.footer.sales, href: '/catalogue?type=vente' },
        { label: t.footer.furnished, href: '/catalogue?type_bien=residence_meublee' },
        { label: 'Offres flash', href: '/offre-flash' },
        { label: 'Comment ça marche', href: '/comment-ca-marche' },
        { label: t.footer.publishAd, href: '/register' },
      ],
    },
    {
      title: t.footer.account,
      links: [
        { label: t.footer.loginShort, href: '/login' },
        { label: t.footer.registerShort, href: '/register' },
        { label: t.footer.proSpace, href: '/pro' },
        { label: t.footer.clientSpace, href: '/client' },
      ],
    },
    {
      title: t.footer.contact,
      links: [
        { label: t.footer.support, href: '/support' },
        { label: 'WhatsApp', href: 'https://wa.me/2250544872051' },
        { label: 'Email', href: 'mailto:commercial@bogbesgroup.com' },
        { label: t.footer.partners, href: '/partenariats' },
      ],
    },
  ]
  return (
    <footer className="bg-[var(--background)] text-[var(--text)] relative overflow-hidden pt-16 lg:pt-24 pb-12 border-t border-[var(--border)]">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10">

        {/* Mémo 3 étapes — visible avant les colonnes pour rappeler le parcours */}
        <div className="mb-12 lg:mb-16 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          <FooterStep num="1" emoji="🔍" title="Tu cherches" desc="Catalogue ou Sapphire WhatsApp" />
          <FooterStep num="2" emoji="💬" title="BOGBE'S coordonne" desc="Conseiller valide & organise" />
          <FooterStep num="3" emoji="🏠" title="Tu visites" desc="Adresse + horaire confirmés" />
        </div>
        <div className="text-center mb-12 lg:mb-16">
          <Link
            href="/comment-ca-marche"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-luxury)] hover:underline"
          >
            En savoir plus sur notre parcours →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-12 lg:mb-20">
          
          {/* Brand Identity */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
              <Image
                src="/bogbes-logo.png"
                alt="BOGBE'S GROUPE"
                width={52}
                height={52}
                className="w-13 h-13 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-display text-2xl font-black tracking-tight text-[var(--text)] uppercase leading-tight">
                BOGBE&apos;S <span className="text-[var(--secondary)]">GROUPE</span>
              </span>
            </Link>
            <p className="font-sans text-sm text-[var(--text-muted)] max-w-xs leading-relaxed mb-4 font-light">
              {t.footer.tagline}
            </p>
            <p className="font-sans text-xs text-[var(--text-muted)] max-w-xs leading-relaxed mb-10">
              {t.footer.address}
            </p>
            <div className="flex gap-5">
              {[
                { icon: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z', href: 'https://www.facebook.com/edenbogbe.97', label: 'Facebook' },
                { icon: 'M12.315 2c2.43 0 2.784.012 3.823.06 1.062.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.365.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.365-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.823.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16.35a4.35 4.35 0 110-8.7 4.35 4.35 0 010 8.7zm6.404-10.37a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z', href: 'https://www.instagram.com/bogbesgroupe', label: 'Instagram' },
              ].map((item, idx) => (
                <a key={idx} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-[var(--accent-luxury)] hover:border-[var(--accent-luxury)] transition-all duration-300 group/icon">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="group-hover/icon:scale-110 transition-transform">
                    <path d={item.icon}/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Columns — accordion sur mobile (<details>), grille sur desktop */}
          {columns.map((col) => (
            <details key={col.title} className="lg:col-span-2 lg:open lg:[&[open]_summary]:cursor-default group lg:!block border-b border-white/5 lg:border-0 pb-3 lg:pb-0" open>
              <summary className="font-display text-[10px] font-bold text-[var(--text)] uppercase tracking-[0.3em] mb-3 lg:mb-8 cursor-pointer lg:cursor-default flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
                {col.title}
                <svg className="w-3 h-3 transition-transform group-open:rotate-180 lg:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <ul className="space-y-3 lg:space-y-4">
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
            </details>
          ))}
        </div>

        {/* Maillage SEO — liens directs vers les pages d'atterrissage par commune.
            Signal interne fort pour Google (ces pages ne seraient sinon
            découvrables que via le sitemap) + accès rapide pour les visiteurs. */}
        <div className="pt-10 border-t border-[var(--border)] mb-12">
          <p className="font-display text-[10px] font-bold text-[var(--text)] uppercase tracking-[0.3em] mb-4">
            Immobilier par commune
          </p>
          <div className="space-y-2.5">
            {(['location', 'vente'] as const).map((offre) => (
              <p key={offre} className="font-sans text-xs leading-relaxed text-[var(--text-muted)]">
                <span className="font-bold text-[var(--text)]">
                  {offre === 'location' ? 'Location' : 'Vente'} :{' '}
                </span>
                {SEO_COMMUNES.map((c, i) => (
                  <span key={c.slug}>
                    {i > 0 && <span aria-hidden> · </span>}
                    <Link
                      href={`/${offre}/${c.slug}`}
                      className="hover:text-[var(--accent-luxury)] transition-colors"
                    >
                      {c.nom}
                    </Link>
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] font-bold">
            © 2026 BOGBE&apos;S GROUPE Multi Services. {t.footer.rights}.
          </p>
          <div className="flex items-center gap-6 md:gap-10 flex-wrap justify-center">
            <LanguageSwitcher />
            <Link href="/mentions-legales" className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              {t.footer.legal}
            </Link>
            <Link href="/confidentialite" className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              {t.footer.privacy}
            </Link>
            <Link href="/cgu" className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              {t.footer.terms}
            </Link>
          </div>
        </div>
      </div>

      {/* Background Signature Accent */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)', filter: 'blur(100px)' }} />
    </footer>
  )
}

interface FooterStepProps {
  num: string
  emoji: string
  title: string
  desc: string
}

function FooterStep({ num, emoji, title, desc }: FooterStepProps) {
  return (
    <div className="relative flex items-start gap-3 p-4 rounded-2xl bg-surface-card/50 border border-[var(--border)]">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--accent-luxury)] text-[var(--on-accent)] flex items-center justify-center font-display font-black text-sm shadow-sm">
        {num}
      </div>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold text-[var(--text)] mb-1">
          <span aria-hidden className="mr-1">{emoji}</span>
          {title}
        </p>
        <p className="text-xs text-[var(--text-muted)] leading-snug">{desc}</p>
      </div>
    </div>
  )
}
