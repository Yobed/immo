'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, MoveHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import SearchForm from '@/components/site/SearchForm';
import HeroGallery3D from '@/components/site/HeroGallery3D';
import HorizontalGallery from '@/components/site/HorizontalGallery';
import DistrictList from '@/components/site/DistrictList';
import { Reveal, ScrollHighlight, TextReveal } from '@/components/Motion';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import type { Property } from '@/lib/types';
import { AGENCY_PHONE, EMPTY_FILTERS, listDistricts, listTypes, priceSuffix } from '@/lib/property-search';

const PROMISES = [
  { title: 'Titre foncier affiché', text: 'Chaque annonce indique la nature du titre (ACD, TF, CMP) avant même la visite.' },
  { title: 'Visites accompagnées', text: 'Un conseiller vous reçoit sur place et répond à vos questions sur le bail.' },
  { title: 'Un seul interlocuteur', text: 'Demande, visite et signature suivies par la même personne, sur WhatsApp ou par téléphone.' },
];

export default function HomePage() {
  const { properties } = useLiveProperties();
  const districts = listDistricts(properties);
  const types = listTypes(properties);
  const [front, setFront] = useState<Property | null>(properties[0] ?? null);

  return (
    <>
      <SiteHeader />

      <main className="text-ink">
        {/* ---------- Hero 3D ---------- */}
        <section className="relative h-[calc(100svh-4rem)] min-h-[560px] overflow-hidden bg-ink text-white">
          <HeroGallery3D properties={properties} onFrontChange={setFront} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

          <div className="pointer-events-none relative h-full site-container flex flex-col justify-end pb-24 sm:pb-28">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.95]">
                <TextReveal text={'Vivre Abidjan,\nen grand.'} trigger="animate" delay={0.2} />
              </h1>

              <AnimatePresence mode="wait">
                {front && (
                  <motion.div
                    key={front.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="lg:text-right max-w-sm lg:ml-auto"
                  >
                    <p className="text-sm text-white/60">{front.district}</p>
                    <p className="text-lg font-medium leading-snug line-clamp-2">{front.title}</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatFCFA(front.price)} <span className="text-sm font-normal text-white/60">{priceSuffix(front)}</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.p
              className="mt-8 flex items-center gap-2 text-sm text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <MoveHorizontal className="w-4 h-4" /> Glissez ou défilez pour tourner, cliquez sur une photo pour l&apos;ouvrir
            </motion.p>
          </div>
        </section>

        {/* ---------- Recherche, à cheval sur le hero ---------- */}
        <div className="relative z-10 site-container -mt-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <SearchForm districts={districts} types={types} value={EMPTY_FILTERS} />
          </motion.div>
        </div>

        {/* ---------- Manifeste ---------- */}
        <section className="site-container py-28 sm:py-40">
          <ScrollHighlight
            className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] max-w-5xl"
            text={`${properties.length} adresses choisies une à une, de Cocody à Assinie. Titre foncier vérifié, visite accompagnée, un seul interlocuteur du premier message à la remise des clés.`}
          />
        </section>

        {/* ---------- Sélection (défilement horizontal épinglé) ---------- */}
        <HorizontalGallery properties={properties} />

        {/* ---------- Quartiers ---------- */}
        <section className="site-container py-24 sm:py-32">
          <div className="flex items-end justify-between gap-6 mb-10">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              <TextReveal text="Par quartier" />
            </h2>
            <Link href="/biens" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium hover:text-accent">
              Tous les biens <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <DistrictList properties={properties} districts={districts} />
        </section>

        {/* ---------- Engagements ---------- */}
        <section className="bg-paper border-t border-line">
          <div className="site-container py-20 sm:py-24 grid gap-12 sm:grid-cols-3">
            {PROMISES.map((item, idx) => (
              <Reveal key={item.title} delay={idx * 0.1} className="space-y-3">
                <p className="text-5xl font-semibold text-accent/80 tabular-nums">0{idx + 1}</p>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-ink-muted leading-relaxed">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Appel final ---------- */}
        <section className="bg-ink text-white">
          <div className="site-container py-24 sm:py-32 flex flex-col items-start gap-10">
            <h2 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-[0.95]">
              <TextReveal text={'Une visite ?\nOn s’en occupe.'} />
            </h2>
            <Reveal delay={0.3} className="flex flex-wrap gap-3">
              <a
                href={getWhatsAppLink(AGENCY_PHONE, 'Bonjour, je souhaite organiser une visite.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-white text-ink text-sm font-medium hover:bg-paper transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Écrire sur WhatsApp
              </a>
              <Link href="/biens" className="inline-flex items-center gap-2 h-12 px-6 rounded-lg ring-1 ring-white/25 text-sm font-medium hover:bg-white/10 transition-colors">
                Voir tous les biens <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
