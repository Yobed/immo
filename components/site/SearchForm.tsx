'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import type { PropertyType } from '@/lib/types';
import { formatFCFA } from '@/lib/utils';
import { BUDGET_STEPS, TYPE_LABELS, type PropertyFilters, filtersToQuery } from '@/lib/property-search';

type Props = {
  districts: string[];
  types: PropertyType[];
  value: PropertyFilters;
  /** Si fourni, les changements sont appliqués immédiatement (page liste). Sinon, envoi vers /biens. */
  onChange?: (next: PropertyFilters) => void;
};

export default function SearchForm({ districts, types, value, onChange }: Props) {
  const router = useRouter();
  const [draft, setDraft] = React.useState(value);
  const current = onChange ? value : draft;

  const update = (patch: Partial<PropertyFilters>) => {
    const next = { ...current, ...patch };
    if (onChange) onChange(next);
    else setDraft(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = filtersToQuery(current);
    router.push(query ? `/biens?${query}` : '/biens');
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={`grid grid-cols-1 gap-px rounded-xl bg-line ring-1 ring-line overflow-hidden shadow-sm ${
        onChange ? 'sm:grid-cols-3' : 'sm:grid-cols-[1fr_1fr_1fr_auto]'
      }`}
    >
      <Field label="Quartier">
        <select value={current.district} onChange={(e) => update({ district: e.target.value })} className="field-select">
          <option value="">Tous les quartiers</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="Type de bien">
        <select value={current.type} onChange={(e) => update({ type: e.target.value as PropertyType | '' })} className="field-select">
          <option value="">Tous les types</option>
          {types.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </Field>
      <Field label="Loyer maximum">
        <select
          value={current.budgetMax ?? ''}
          onChange={(e) => update({ budgetMax: e.target.value ? Number(e.target.value) : null })}
          className="field-select"
        >
          <option value="">Sans limite</option>
          {BUDGET_STEPS.map((b) => <option key={b} value={b}>{formatFCFA(b)}</option>)}
        </select>
      </Field>
      {!onChange && (
        <div className="bg-white p-2 flex">
          <button type="submit" className="btn-primary w-full sm:w-auto px-6 justify-center">
            <Search className="w-4 h-4" />
            Rechercher
          </button>
        </div>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="bg-white px-4 py-2.5 flex flex-col gap-0.5 cursor-pointer hover:bg-paper transition-colors">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
