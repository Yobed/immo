'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AGENCY_NAME, AGENCY_PHONE } from '@/lib/property-search';
import { getWhatsAppLink } from '@/lib/utils';

const NAV = [
  { href: '/biens', label: 'Biens à louer' },
  { href: '/catalogue', label: 'Catalogue' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => setIsOpen(false), [pathname]);

  const contactUrl = getWhatsAppLink(AGENCY_PHONE, 'Bonjour, je cherche un bien à Abidjan.');

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-line">
      <div className="site-container h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-ink">
          <span className="w-7 h-7 rounded-md bg-ink text-white grid place-items-center text-xs">A</span>
          {AGENCY_NAME}
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-8 text-sm">
          {NAV.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors ${isActive ? 'text-ink font-medium' : 'text-ink-muted hover:text-ink'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="btn-primary hidden sm:inline-flex">
            Nous contacter
          </a>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="md:hidden w-11 h-11 grid place-items-center rounded-lg hover:bg-paper"
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav aria-label="Navigation mobile" className="md:hidden border-t border-line bg-white">
          <div className="site-container py-3 flex flex-col">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="py-3 text-base text-ink border-b border-line last:border-0">
                {item.label}
              </Link>
            ))}
            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 justify-center">
              Nous contacter sur WhatsApp
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
