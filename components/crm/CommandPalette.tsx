'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type PaletteItem = { name: string; href: string; icon: LucideIcon };

type Props = {
  items: PaletteItem[];
  isOpen: boolean;
  onClose: () => void;
};

/** Normalise pour une recherche insensible aux accents et à la casse. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function CommandPalette({ items, isOpen, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  const results = items.filter((item) => normalize(item.name).includes(normalize(query)));

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setCursor(0);
    inputRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-[60] bg-[#191715]/30 backdrop-blur-[2px] flex items-start justify-center pt-[15vh] px-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation rapide"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md bg-white rounded-2xl border border-[#EAE5DC] shadow-[0_30px_80px_-20px_rgba(25,23,21,0.35)] overflow-hidden font-sans"
      >
        <div className="flex items-center gap-3 px-4 border-b border-[#F0EDE6]">
          <Search className="w-4 h-4 text-[#6E665B] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            placeholder="Aller à une page du CRM"
            className="flex-1 h-12 bg-transparent text-sm text-[#191715] placeholder:text-[#a39c92] outline-none"
            aria-label="Rechercher une page"
          />
          <kbd className="font-mono text-[10px] text-[#a39c92]">Échap</kbd>
        </div>

        <ul className="p-2 max-h-80 overflow-y-auto" role="listbox">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-[#6E665B]">Aucune page ne correspond.</li>
          )}
          {results.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = idx === cursor;
            return (
              <li key={item.href} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(idx)}
                  onClick={() => go(item.href)}
                  className={`w-full min-h-[44px] flex items-center justify-between gap-3 px-3 rounded-xl text-sm transition-colors ${
                    isSelected ? 'bg-[#191715] text-white' : 'text-[#191715] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#C8A97E]' : 'text-[#6E665B]'}`} />
                    {item.name}
                  </span>
                  {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-[#C8A97E]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
