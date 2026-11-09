'use client';

import React, { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import PropertyCard from '@/components/site/PropertyCard';
import SearchForm from '@/components/site/SearchForm';
import { useLiveProperties } from '@/lib/useLiveProperties';
import {
  EMPTY_FILTERS,
  type PropertyFilters,
  type SortOrder,
  filterProperties,
  filtersToQuery,
  listDistricts,
  listTypes,
  parseFilters,
} from '@/lib/property-search';

const SORT_LABELS: Record<SortOrder, string> = {
  recent: 'Plus récents',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant',
};

function PropertyList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { properties } = useLiveProperties();

  const filters = parseFilters(new URLSearchParams(searchParams.toString()));
  const results = filterProperties(properties, filters);
  const hasFilters = filtersToQuery({ ...filters, sort: 'recent' }) !== '';

  const applyFilters = (next: PropertyFilters) => {
    const query = filtersToQuery(next);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <main className="bg-white text-ink">
      <section className="site-container pt-10 pb-6 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Biens à louer</h1>
        <SearchForm
          districts={listDistricts(properties)}
          types={listTypes(properties)}
          value={filters}
          onChange={applyFilters}
        />
      </section>

      <section className="site-container pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-line mb-8">
          <p className="text-sm text-ink-muted" aria-live="polite">
            <span className="font-medium text-ink tabular-nums">{results.length}</span> bien{results.length > 1 ? 's' : ''}
            {hasFilters && (
              <button
                type="button"
                onClick={() => applyFilters(EMPTY_FILTERS)}
                className="ml-3 underline underline-offset-4 hover:text-ink"
              >
                Effacer les filtres
              </button>
            )}
          </p>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            Trier par
            <select
              value={filters.sort}
              onChange={(e) => applyFilters({ ...filters, sort: e.target.value as SortOrder })}
              className="h-9 rounded-lg ring-1 ring-line bg-white px-3 text-ink font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {(Object.keys(SORT_LABELS) as SortOrder[]).map((s) => (
                <option key={s} value={s}>{SORT_LABELS[s]}</option>
              ))}
            </select>
          </label>
        </div>

        {results.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p, idx) => (
              <PropertyCard key={p.id} property={p} isPriority={idx < 3} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-3">
            <p className="text-lg font-medium">Aucun bien ne correspond à ces critères.</p>
            <p className="text-ink-muted">Élargissez le budget ou choisissez un autre quartier.</p>
            <button type="button" onClick={() => applyFilters(EMPTY_FILTERS)} className="btn-secondary mt-2">
              Voir tous les biens
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function BiensPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<main className="site-container py-16 text-ink-muted">Chargement des biens…</main>}>
        <PropertyList />
      </Suspense>
      <SiteFooter />
    </>
  );
}
