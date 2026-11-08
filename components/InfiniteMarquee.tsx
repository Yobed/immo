'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Sparkles, Compass } from 'lucide-react';

interface MarqueeItem {
  id: string;
  title: string;
  location: string;
  tag: string;
  image: string;
  aspect?: string;
}

const ARCHITECTURAL_SHOWCASE: MarqueeItem[] = [
  {
    id: 'm1',
    title: 'Villa Riviera Golf',
    location: 'Cocody • Abidjan',
    tag: 'Béton Blanc & Travertin',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'm2',
    title: 'Penthouse Laguna',
    location: 'Marcory Zone 4',
    tag: 'Baies Vitrées Courbes',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'm3',
    title: 'Écrin d\'Assinie',
    location: 'Assinie-Mafia',
    tag: 'Bois d\'Iroko & Lagune',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'm4',
    title: 'Résidence Diplomatique',
    location: 'Cocody Ambassades',
    tag: 'Piscine Miroir & Marbre',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'm5',
    title: 'Manoir Contemporain',
    location: 'Bingerville Lagune',
    tag: 'Jardins Suspendus',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 'm6',
    title: 'Bureaux Haute Couture',
    location: 'Le Plateau',
    tag: 'Façade Moucharabieh',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
  },
];

const NOBLE_MATERIALS = [
  'Travertin d\'Italie Doré',
  'Bois d\'Iroko de Côte d\'Ivoire',
  'Béton Brut Architectonique',
  'Baies Coulissantes Minimalistes 4,20m',
  'Piscines Miroir en Quartz Gris',
  'Marbre Calacatta Vena Oro',
  'Moucharabiehs Contemporains Métallisés',
  'Jardins Botaniques Tropicaux',
];

export default function InfiniteMarquee() {
  return (
    <section className="relative w-full py-20 bg-[#161412] text-[#fbfaf7] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-[#947346]/10 blur-[100px]" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-[#1d382b]/15 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#dcd6cb] text-xs font-medium border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-[#947346]" />
            <span>Défilement Continu Haute Résolution</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-white tracking-tight">
            Galerie Cinématographique.
          </h2>
          <p className="text-sm text-[#a39c92] max-w-xl font-light">
            Survol des textures, perspectives architecturales et horizons lagunaires qui définissent le luxe contemporain ivoirien.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#a39c92]">
          <Compass className="w-4 h-4 text-[#947346] animate-spin-slow" />
          <span>Survolez une vue pour suspendre le défilement</span>
        </div>
      </div>

      {/* Row 1: High-Res Architecture Cards Marquee */}
      <div className="relative w-full overflow-hidden group">
        {/* Soft edge blur masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-[#161412] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-[#161412] to-transparent z-20 pointer-events-none" />

        <div className="flex gap-6 w-max animate-marquee-fast group-hover:[animation-play-state:paused] py-4">
          {/* Duplicate list 3 times for a flawless infinite loop */}
          {[...ARCHITECTURAL_SHOWCASE, ...ARCHITECTURAL_SHOWCASE, ...ARCHITECTURAL_SHOWCASE].map((item, idx) => (
            <motion.div
              key={`${item.id}-${idx}`}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-[320px] sm:w-[420px] h-[260px] sm:h-[300px] rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-2xl group/card cursor-pointer"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 320px, 420px"
                className="object-cover brightness-[0.85] contrast-[1.05] group-hover/card:scale-108 transition-transform duration-700 ease-out"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              {/* Tag Top */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-medium text-white border border-white/20">
                  {item.tag}
                </span>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-5 left-5 right-5 z-10 space-y-1">
                <div className="text-[11px] text-[#947346] font-semibold uppercase tracking-wider">
                  {item.location}
                </div>
                <div className="text-xl font-display font-medium text-white leading-tight">
                  {item.title}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Row 2: Noble Materials Ticker (Reverse scroll direction) */}
      <div className="mt-8 relative w-full overflow-hidden border-t border-white/10 pt-6">
        <div className="flex gap-8 w-max animate-marquee-reverse">
          {[...NOBLE_MATERIALS, ...NOBLE_MATERIALS, ...NOBLE_MATERIALS, ...NOBLE_MATERIALS].map((mat, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-3 text-xs tracking-wider uppercase text-[#dcd6cb]/70 whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#947346]" />
              <span className="font-medium hover:text-white transition-colors">{mat}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
