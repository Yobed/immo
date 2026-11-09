'use client';

import React, { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Building2, FolderOpen, Home, Search, Users } from 'lucide-react';
import CommandPalette from '@/components/crm/CommandPalette';
import { OPEN_PALETTE_EVENT } from '@/components/crm/ui';

const NAV = [
  { name: "Aujourd'hui", href: '/crm', icon: Home },
  { name: 'Contacts', href: '/crm/contacts', icon: Users },
  { name: 'Biens', href: '/crm/biens', icon: Building2 },
  { name: 'Dossiers', href: '/crm/dossiers', icon: FolderOpen },
];

function isActiveRoute(pathname: string, href: string): boolean {
  return href === '/crm' ? pathname === '/crm' : pathname.startsWith(href);
}

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((open) => !open);
      }
    };
    const onOpen = () => setIsPaletteOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => setIsPaletteOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-paper text-ink md:flex">
      {/* Barre latérale (ordinateur) */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col gap-6 border-r border-line bg-white px-4 py-5 sticky top-0 h-screen">
        <NextLink href="/crm" className="flex items-center gap-2.5 px-1 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-xs text-white">A</span>
          Agence Immo
        </NextLink>

        <button
          type="button"
          onClick={() => setIsPaletteOpen(true)}
          className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl bg-paper ring-1 ring-line text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Rechercher</span>
          <kbd className="text-[11px] text-ink-light">Ctrl K</kbd>
        </button>

        <nav aria-label="CRM" className="flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(pathname, item.href);
            return (
              <NextLink
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 h-10 px-3 rounded-xl text-sm transition-colors ${
                  isActive ? 'bg-ink text-white font-medium' : 'text-ink-soft hover:bg-paper hover:text-ink'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : ''}`} />
                {item.name}
              </NextLink>
            );
          })}
        </nav>

        <NextLink href="/" target="_blank" className="mt-auto flex items-center gap-2 px-3 text-sm text-ink-muted hover:text-ink">
          Voir le site <ArrowUpRight className="w-4 h-4" />
        </NextLink>
      </aside>

      {/* En-tête (mobile) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/90 backdrop-blur px-4 h-14">
        <NextLink href="/crm" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-xs text-white">A</span>
          Agence Immo
        </NextLink>
        <button type="button" onClick={() => setIsPaletteOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-paper" aria-label="Rechercher">
          <Search className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>

      {/* Onglets (mobile) */}
      <nav aria-label="CRM mobile" className="md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(pathname, item.href);
          return (
            <NextLink
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 h-16 text-[11px] ${isActive ? 'text-ink font-medium' : 'text-ink-muted'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : ''}`} />
              {item.name}
            </NextLink>
          );
        })}
      </nav>

      <CommandPalette pages={NAV} isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
}
