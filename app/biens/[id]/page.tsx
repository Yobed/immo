'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, MessageCircle, Phone } from 'lucide-react';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import PropertyCard from '@/components/site/PropertyCard';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import type { Property } from '@/lib/types';
import {
  AGENCY_PHONE,
  AGENCY_PHONE_DISPLAY,
  STATUS_LABELS,
  TYPE_LABELS,
  priceSuffix,
  similarProperties,
} from '@/lib/property-search';

function amenities(p: Property): string[] {
  return [
    p.has_pool && 'Piscine',
    p.has_generator && 'Groupe électrogène',
    p.has_security && 'Gardiennage / sécurité',
    p.has_parking && 'Parking',
  ].filter((x): x is string => Boolean(x));
}

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const { properties } = useLiveProperties();
  const property = properties.find((p) => p.id === params.id);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!property) {
    return (
      <>
        <SiteHeader />
        <main className="site-container py-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Ce bien n&apos;est plus disponible.</h1>
          <Link href="/biens" className="btn-secondary">Voir les autres biens</Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const status = STATUS_LABELS[property.status];
  const visitUrl = getWhatsAppLink(
    AGENCY_PHONE,
    `Bonjour, je souhaite visiter « ${property.title} » (réf. ${property.reference}) à ${property.district}.`,
  );
  const specs = [
    { label: 'Surface', value: `${property.surface} m²` },
    { label: 'Chambres', value: property.bedrooms > 0 ? String(property.bedrooms) : 'n/a' },
    { label: 'Salles de bain', value: property.bathrooms > 0 ? String(property.bathrooms) : 'n/a' },
    { label: 'Titre foncier', value: property.legal_status },
  ];
  const features = amenities(property);
  const similar = similarProperties(properties, property);
  const photos = property.images;

  return (
    <>
      <SiteHeader />

      <main className="bg-white text-ink">
        <div className="site-container pt-6">
          <Link href="/biens" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft className="w-4 h-4" /> Tous les biens
          </Link>
        </div>

        {/* Galerie */}
        <section className="site-container pt-4">
          <div className="relative aspect-[16/10] sm:aspect-[16/8] overflow-hidden rounded-2xl bg-paper">
            <Image
              key={photos[photoIndex]}
              src={photos[photoIndex]}
              alt={`${property.title}, photo ${photoIndex + 1} sur ${photos.length}`}
              fill
              priority
              unoptimized
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover animate-fade-in"
            />
            <span className="absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-1 text-xs font-medium tabular-nums">
              {photoIndex + 1} / {photos.length}
            </span>
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {photos.map((src, idx) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setPhotoIndex(idx)}
                  aria-label={`Afficher la photo ${idx + 1}`}
                  aria-current={idx === photoIndex}
                  className={`relative w-24 h-16 shrink-0 overflow-hidden rounded-lg transition-opacity ${
                    idx === photoIndex ? 'ring-2 ring-ink' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={src} alt="" fill unoptimized sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Contenu + carte de contact */}
        <section className="site-container py-10 grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10 min-w-0">
            <header className="space-y-3">
              <p className="text-sm text-ink-muted">
                {TYPE_LABELS[property.property_type]} · {property.district}, {property.city}
                {status && <span className="ml-2 rounded-md bg-paper px-2 py-0.5 text-ink font-medium">{status}</span>}
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">{property.title}</h1>
            </header>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl bg-line ring-1 ring-line overflow-hidden">
              {specs.map((s) => (
                <div key={s.label} className="bg-white p-4">
                  <dt className="text-xs text-ink-muted">{s.label}</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Description</h2>
              <p className="text-ink-muted leading-relaxed max-w-prose">{property.description}</p>
            </div>

            {features.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Équipements</h2>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {features.map((a) => (
                    <li key={a} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 self-start rounded-2xl ring-1 ring-line p-6 space-y-5 shadow-sm">
            <div>
              <p className="text-3xl font-semibold tabular-nums">{formatFCFA(property.price)}</p>
              <p className="text-sm text-ink-muted">{priceSuffix(property) ? 'par mois' : 'prix de vente'}</p>
            </div>
            <div className="space-y-2">
              <a href={visitUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full justify-center">
                <MessageCircle className="w-4 h-4" /> Demander une visite
              </a>
              <a href={`tel:+${AGENCY_PHONE}`} className="btn-secondary w-full justify-center">
                <Phone className="w-4 h-4" /> {AGENCY_PHONE_DISPLAY}
              </a>
            </div>
            <p className="text-xs text-ink-muted border-t border-line pt-4">
              Référence <span className="font-mono text-ink">{property.reference}</span>
            </p>
          </aside>
        </section>

        {similar.length > 0 && (
          <section className="site-container py-12 border-t border-line">
            <h2 className="text-2xl font-semibold tracking-tight mb-8">Biens similaires</h2>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
