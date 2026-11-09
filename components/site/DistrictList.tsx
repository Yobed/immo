'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import type { Property } from '@/lib/types';

type Props = { properties: Property[]; districts: string[] };

const PREVIEW_W = 288;
const PREVIEW_H = 192;

/** Grande liste typographique ; au survol, la photo du quartier suit le curseur. */
export default function DistrictList({ properties, districts }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 24 });
  const y = useSpring(my, { stiffness: 220, damping: 24 });

  const photoOf = (d: string) => properties.find((p) => p.district === d)?.images[0];
  const countOf = (d: string) => properties.filter((p) => p.district === d).length;
  const preview = hovered ? photoOf(hovered) : undefined;

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // centre l'aperçu sur le curseur (motion gère le transform, donc pas de translate CSS)
        mx.set(e.clientX - rect.left - PREVIEW_W / 2);
        my.set(e.clientY - rect.top - PREVIEW_H / 2);
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <ul className="border-t border-line">
        {districts.map((d) => (
          <li key={d} className="border-b border-line">
            <Link
              href={`/biens?quartier=${encodeURIComponent(d)}`}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(d)}
              className="group flex items-center justify-between gap-6 py-6 sm:py-8"
            >
              <span className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight transition-all duration-500 group-hover:translate-x-4 group-hover:text-accent">
                {d}
              </span>
              <span className="flex items-center gap-4 text-ink-muted shrink-0">
                <span className="tabular-nums text-sm">{countOf(d)} bien{countOf(d) > 1 ? 's' : ''}</span>
                <ArrowUpRight className="w-6 h-6 transition-transform duration-500 group-hover:rotate-45 group-hover:text-ink" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {preview && (
          <motion.div
            key="preview"
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-10 hidden md:block overflow-hidden rounded-xl shadow-2xl"
            style={{ x, y, width: PREVIEW_W, height: PREVIEW_H }}
            initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <AnimatePresence mode="popLayout">
              <motion.img
                key={preview}
                src={preview}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
