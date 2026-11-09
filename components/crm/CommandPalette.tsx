'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CornerDownLeft, MessageCircle, Search, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCrmContacts } from '@/lib/useCrmContacts';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';

type PageItem = { name: string; href: string; icon: LucideIcon };

type Props = {
  pages: PageItem[];
  isOpen: boolean;
  onClose: () => void;
};

type Result = {
  id: string;
  group: 'Pages' | 'Contacts' | 'Biens';
  label: string;
  hint?: string;
  icon: LucideIcon;
  href: string;
  /** Lien externe secondaire (WhatsApp) proposé à droite. */
  quickLink?: string;
};

/** Normalise pour une recherche insensible aux accents et à la casse. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const MAX_PER_GROUP = 5;

export default function CommandPalette({ pages, isOpen, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { contacts } = useCrmContacts();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setCursor(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  const q = normalize(query.trim());
  const matches = (...fields: (string | undefined)[]) => !q || fields.some((f) => f && normalize(f).includes(q));

  // ponytail: biens de démonstration ; passer par useLiveProperties si la palette doit voir les biens ajoutés en direct
  const results: Result[] = [
    ...pages.filter((p) => matches(p.name)).map((p) => ({ id: p.href, group: 'Pages' as const, label: p.name, icon: p.icon, href: p.href })),
    ...contacts
      .filter((c) => q && matches(c.full_name, c.phone, c.profession, ...c.preferred_districts))
      .slice(0, MAX_PER_GROUP)
      .map((c) => ({
        id: c.id,
        group: 'Contacts' as const,
        label: c.full_name,
        hint: c.budget_max ? `jusqu'à ${formatFCFA(c.budget_max)}` : c.phone,
        icon: User,
        href: `/crm/contacts?id=${c.id}`,
        quickLink: getWhatsAppLink(c.phone, `Bonjour ${c.full_name},`),
      })),
    ...INITIAL_PROPERTIES
      .filter((p) => q && matches(p.title, p.district, p.reference))
      .slice(0, MAX_PER_GROUP)
      .map((p) => ({
        id: p.id,
        group: 'Biens' as const,
        label: p.title,
        hint: `${p.district} · ${formatFCFA(p.price)}`,
        icon: Building2,
        href: `/crm/biens?id=${p.id}`,
      })),
  ];

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && results[cursor]) go(results[cursor].href);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[3px] flex items-start justify-center pt-[12vh] px-4"
          onMouseDown={onClose}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Recherche et commandes"
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="w-full max-w-xl bg-white rounded-2xl ring-1 ring-line shadow-[0_30px_80px_-20px_rgba(25,23,21,0.35)] overflow-hidden"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 px-4 border-b border-line">
              <Search className="w-5 h-5 text-ink-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
                placeholder="Un nom, un quartier, un bien, une page…"
                className="flex-1 h-14 bg-transparent text-base text-ink placeholder:text-ink-light outline-none"
                aria-label="Rechercher"
              />
              <kbd className="text-[11px] text-ink-light">Échap</kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
              {results.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-ink-muted">Rien ne correspond à « {query} ».</p>
              )}
              {results.map((r, idx) => {
                const Icon = r.icon;
                const isSelected = idx === cursor;
                const isFirstOfGroup = idx === 0 || results[idx - 1].group !== r.group;
                return (
                  <React.Fragment key={`${r.group}-${r.id}`}>
                    {isFirstOfGroup && <p className="px-3 pt-3 pb-1 text-xs font-medium text-ink-light">{r.group}</p>}
                    <div
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setCursor(idx)}
                      className={`flex items-center gap-2 rounded-xl pr-1 transition-colors ${isSelected ? 'bg-ink text-white' : 'text-ink'}`}
                    >
                      <button type="button" onClick={() => go(r.href)} className="flex-1 min-w-0 min-h-[44px] flex items-center gap-3 px-3 text-left">
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-accent' : 'text-ink-muted'}`} />
                        <span className="truncate text-sm font-medium">{r.label}</span>
                        {r.hint && <span className={`truncate text-xs ${isSelected ? 'text-white/60' : 'text-ink-muted'}`}>{r.hint}</span>}
                      </button>
                      {r.quickLink && (
                        <a
                          href={r.quickLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`grid h-9 w-9 place-items-center rounded-lg ${isSelected ? 'hover:bg-white/10' : 'hover:bg-paper'}`}
                          aria-label={`WhatsApp ${r.label}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      {isSelected && !r.quickLink && <CornerDownLeft className="w-4 h-4 mr-2 text-accent" />}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
