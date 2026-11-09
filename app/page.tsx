'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import PropertyCard from '@/components/site/PropertyCard';
import SearchForm from '@/components/site/SearchForm';
import { Reveal } from '@/components/Motion';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { EMPTY_FILTERS, listDistricts, listTypes } from '@/lib/property-search';

const PROMISES = [
  { title: 'Titre foncier affiché', text: 'Chaque annonce indique la nature du titre (ACD, TF, CMP) avant même la visite.' },
  { title: 'Visites accompagnées', text: 'Un conseiller vous reçoit sur place et répond à vos questions sur le bail.' },
  { title: 'Un seul interlocuteur', text: 'Demande, visite et signature suivies par la même personne, sur WhatsApp ou par téléphone.' },
];

export default function HomePage() {
  const { properties } = useLiveProperties();
  const districts = listDistricts(properties);
  const types = listTypes(properties);
  const cover = properties[0];
  const countByDistrict = (d: string) => properties.filter((p) => p.district === d).length;

  return (
    <>
      <SiteHeader />

      <main className="bg-white text-ink">
        {/* Accroche + recherche */}
        <section className="site-container pt-10 sm:pt-16 pb-12">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
                Trouvez votre bien
                <br />
                à Abidjan.
              </h1>
              <p className="text-lg text-ink-muted max-w-md">
                Villas, appartements et bureaux à louer, de Cocody à Assinie. Titre foncier indiqué sur chaque annonce.
              </p>
              <dl className="flex gap-8 pt-2">
                <div>
                  <dt className="text-sm text-ink-muted">Biens disponibles</dt>
                  <dd className="text-2xl font-semibold tabular-nums">{properties.length}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ink-muted">Quartiers</dt>
                  <dd className="text-2xl font-semibold tabular-nums">{districts.length}</dd>
                </div>
              </dl>
            </div>

            {cover && (
              <Link href={`/biens/${cover.id}`} className="group relative block aspect-[4/3] lg:aspect-[5/4] overflow-hidden rounded-2xl bg-paper">
                <Image
                  src={cover.images[0]}
                  alt={cover.title}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
                <span className="absolute bottom-4 left-4 rounded-md bg-white px-3 py-1.5 text-sm font-medium">
                  {cover.district}
                </span>
              </Link>
            )}
          </div>

          <div className="mt-10">
            <SearchForm districts={districts} types={types} value={EMPTY_FILTERS} />
          </div>
        </section>

        {/* Sélection */}
        <section className="site-container py-12 sm:py-16 border-t border-line">
          <Reveal className="flex items-end justify-between gap-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Biens disponibles</h2>
            <Link href="/biens" className="text-sm font-medium text-ink hover:text-accent inline-flex items-center gap-1.5 shrink-0">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((p, idx) => (
              <Reveal key={p.id} delay={(idx % 3) * 0.06}>
                <PropertyCard property={p} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Quartiers */}
        <section className="site-container py-12 sm:py-16 border-t border-line">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">Chercher par quartier</h2>
          </Reveal>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-line">
            {districts.map((d) => (
              <li key={d} className="border-b border-line">
                <Link
                  href={`/biens?quartier=${encodeURIComponent(d)}`}
                  className="group flex items-center justify-between py-4 pr-2 hover:bg-paper transition-colors sm:px-2"
                >
                  <span className="font-medium">{d}</span>
                  <span className="flex items-center gap-3 text-sm text-ink-muted">
                    <span className="tabular-nums">{countByDistrict(d)} bien{countByDistrict(d) > 1 ? 's' : ''}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Engagements */}
        <section className="bg-paper border-t border-line">
          <div className="site-container py-12 sm:py-16 grid gap-8 sm:grid-cols-3">
            {PROMISES.map((item, idx) => (
              <Reveal key={item.title} delay={idx * 0.06} className="space-y-2">
                <p className="text-sm font-medium text-accent tabular-nums">0{idx + 1}</p>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-ink-muted">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}
