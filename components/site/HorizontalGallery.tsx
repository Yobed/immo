'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import type { Property } from '@/lib/types';
import { formatFCFA } from '@/lib/utils';
import { TYPE_LABELS, STATUS_LABELS, priceSuffix } from '@/lib/property-search';
import { Tilt } from '@/components/Motion';

function GalleryCard({ property, index }: { property: Property; index: number }) {
  const status = STATUS_LABELS[property.status];
  return (
    <Tilt className="h-full rounded-2xl" max={6}>
      <Link href={`/biens/${property.id}`} className="group relative block h-full overflow-hidden rounded-2xl bg-ink text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.images[0]}
          alt={property.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <span className="absolute top-5 left-5 text-sm font-medium tabular-nums text-white/80">
          {String(index + 1).padStart(2, '0')}
        </span>
        {status && <span className="absolute top-5 right-5 rounded-md bg-white px-2 py-1 text-xs font-medium text-ink">{status}</span>}
        <div className="absolute inset-x-0 bottom-0 p-6 space-y-2 [transform:translateZ(40px)]">
          <p className="text-sm text-white/70">{TYPE_LABELS[property.property_type]} · {property.district}</p>
          <h3 className="text-2xl font-semibold leading-tight">{property.title}</h3>
          <p className="text-lg font-semibold tabular-nums">
            {formatFCFA(property.price)} <span className="text-sm font-normal text-white/70">{priceSuffix(property)}</span>
          </p>
        </div>
      </Link>
    </Tilt>
  );
}

/**
 * Desktop : la section s'épingle et les biens défilent horizontalement pendant le scroll vertical.
 * Mobile : simple carrousel natif avec aimantation (pas de défilement détourné au doigt).
 */
export default function HorizontalGallery({ properties }: { properties: Property[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  // Chaque carte fait 42vw + 2vw d'espace ; on fait défiler la piste moins un écran
  const x = useTransform(scrollYProgress, [0, 1], ['0vw', `-${Math.max(0, properties.length * 44 - 70)}vw`]);
  const progress = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative hidden md:block bg-ink text-white"
        style={{ height: `${Math.max(2, properties.length * 0.6) * 100}vh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center gap-10">
          <div className="site-container flex items-end justify-between">
            <h2 className="text-5xl lg:text-6xl font-semibold tracking-tight">La sélection</h2>
            <div className="w-48 h-px bg-white/15 relative">
              <motion.div className="absolute inset-y-0 left-0 bg-white" style={{ width: progress }} />
            </div>
          </div>
          <motion.div className="flex gap-[2vw] pl-[max(2rem,calc((100vw-72rem)/2+2rem))]" style={{ x: isReduced ? 0 : x }}>
            {properties.map((p, i) => (
              <div key={p.id} className="w-[42vw] h-[58vh] shrink-0">
                <GalleryCard property={p} index={i} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="md:hidden bg-ink text-white py-14">
        <h2 className="site-container text-4xl font-semibold tracking-tight mb-6">La sélection</h2>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-2 [scrollbar-width:none]">
          {properties.map((p, i) => (
            <div key={p.id} className="w-[82vw] h-[64vh] shrink-0 snap-center">
              <GalleryCard property={p} index={i} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
