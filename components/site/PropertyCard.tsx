import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Property } from '@/lib/types';
import { formatFCFA } from '@/lib/utils';
import { STATUS_LABELS, TYPE_LABELS, priceSuffix } from '@/lib/property-search';
import { ImageReveal, Tilt } from '@/components/Motion';

type Props = {
  property: Property;
  isPriority?: boolean;
};

export default function PropertyCard({ property, isPriority = false }: Props) {
  const status = STATUS_LABELS[property.status];
  const specs = [
    `${property.surface} m²`,
    property.bedrooms > 0 ? `${property.bedrooms} ch.` : null,
    property.has_pool ? 'Piscine' : null,
  ].filter(Boolean);

  return (
    <Link href={`/biens/${property.id}`} className="group block focus-visible:outline-none">
      <Tilt className="rounded-xl" max={5}>
        <ImageReveal className="relative aspect-[4/3] rounded-xl bg-paper ring-1 ring-line group-focus-visible:ring-2 group-focus-visible:ring-accent">
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            unoptimized
            priority={isPriority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {status && (
            <span className="absolute top-3 left-3 rounded-md bg-white px-2 py-1 text-xs font-medium text-ink">
              {status}
            </span>
          )}
        </ImageReveal>
      </Tilt>

      <div className="pt-3 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink-muted truncate">
            {TYPE_LABELS[property.property_type]} · {property.district}
          </p>
          <p className="text-xs text-ink-muted shrink-0 tabular-nums">{specs.join(' · ')}</p>
        </div>
        <h3 className="text-base font-medium text-ink leading-snug line-clamp-1 group-hover:underline underline-offset-4 decoration-line">
          {property.title}
        </h3>
        <p className="text-base font-semibold text-ink tabular-nums">
          {formatFCFA(property.price)} <span className="font-normal text-ink-muted text-sm">{priceSuffix(property)}</span>
        </p>
      </div>
    </Link>
  );
}
