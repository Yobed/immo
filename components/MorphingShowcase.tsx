'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Layers, Maximize2, Compass, Eye, Sparkles } from 'lucide-react';

interface Morphology {
  id: string;
  name: string;
  style: string;
  district: string;
  architectNote: string;
  image: string;
  surface: string;
  orientation: string;
  materials: string[];
  // SVG clip path coordinates for fluid morphing
  clipPath: string;
  borderRadius: string;
  specs: {
    luminosity: number;
    thermalInertia: number;
    ceilingHeight: string;
  };
}

const MORPHOLOGIES: Morphology[] = [
  {
    id: 'arche-ovale',
    name: 'L\'Arche Organique',
    style: 'Courbes Méditerranéennes & Biophilie',
    district: 'Cocody Riviera Golf',
    architectNote: 'Courbures paraboliques brisant la chaleur équatoriale tout en canalisant la brise lagunaire vers le patio central.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=85',
    surface: '750 m²',
    orientation: 'Sud - Sud-Ouest (Lagune)',
    materials: ['Travertin Doré', 'Enduit à la Chaux', 'Iroko Massif'],
    clipPath: 'polygon(5% 0%, 95% 0%, 100% 85%, 85% 100%, 15% 100%, 0% 85%)',
    borderRadius: '48px 48px 24px 24px',
    specs: {
      luminosity: 94,
      thermalInertia: 88,
      ceilingHeight: '4,60 m',
    },
  },
  {
    id: 'cantilever-brutaliste',
    name: 'Le Cantilever Minéral',
    style: 'Modernisme Brutaliste Tropical',
    district: 'Cocody Ambassades',
    architectNote: 'Porte-à-faux monumental en béton blanc banché offrant une ombre portée protectrice sur la piscine miroir.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    surface: '920 m²',
    orientation: 'Plein Ouest (Soleil Couchant)',
    materials: ['Béton Banché Blanc', 'Acier Corten', 'Verre Extra-Clair'],
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 90%, 90% 100%, 0% 100%)',
    borderRadius: '24px 72px 24px 24px',
    specs: {
      luminosity: 98,
      thermalInertia: 95,
      ceilingHeight: '5,20 m',
    },
  },
  {
    id: 'ogive-lagunaire',
    name: 'Le Belvédère Suspendu',
    style: 'Penthouse Aérien & Lignes Pures',
    district: 'Marcory Zone 4',
    architectNote: 'Continuité absolue intérieur-extérieur avec baies vitrées toute hauteur sans poteau d\'angle face aux lumières du Plateau.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
    surface: '480 m²',
    orientation: 'Nord-Est (Skyline du Plateau)',
    materials: ['Marbre Calacatta', 'Menuiseries Minimal', 'Teck de Plantation'],
    clipPath: 'polygon(10% 0%, 100% 0%, 95% 95%, 0% 100%)',
    borderRadius: '32px 32px 64px 32px',
    specs: {
      luminosity: 99,
      thermalInertia: 82,
      ceilingHeight: '3,80 m',
    },
  },
  {
    id: 'pavillon-balneaire',
    name: 'Le Pavillon Balnéaire',
    style: 'Luxe Pieds dans l\'Eau',
    district: 'Assinie-Mafia',
    architectNote: 'Structure sur pilotis invisibles permettant la respiration naturelle sous toiture végétalisée entre lagune et océan.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85',
    surface: '620 m²',
    orientation: 'Façade Océanique & Ponton Lagune',
    materials: ['Bois Imputrescible', 'Pierre Volcanique', 'Toile Micro-perforée'],
    clipPath: 'polygon(0% 10%, 90% 0%, 100% 90%, 10% 100%)',
    borderRadius: '40px 16px 48px 16px',
    specs: {
      luminosity: 92,
      thermalInertia: 89,
      ceilingHeight: '4,40 m',
    },
  },
];

export default function MorphingShowcase() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const current = MORPHOLOGIES[activeIdx];

  return (
    <section className="relative w-full py-28 bg-[#f5f2eb] border-y border-[#e8e4dc] overflow-hidden">
      {/* Background architectural grid blueprint */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#947346 0.75px, transparent 0.75px), radial-gradient(#161412 0.75px, #f5f2eb 0.75px)`,
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 space-y-14">
        {/* En-tête éditorial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e8e4dc] text-xs font-semibold text-[#947346] shadow-warm-sm">
              <Layers className="w-3.5 h-3.5" />
              <span>Effet Morphose & Motion Design</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#161412] tracking-tight">
              Morphologie des Espaces.
            </h2>
            <p className="text-sm text-[#68625c] font-light leading-relaxed">
              Explorez la métamorphose des géométries architecturales d&apos;Abidjan. Observez comment la matière, l&apos;ombrage et les ouvertures s&apos;adaptent au climat tropical ivoirien.
            </p>
          </div>

          {/* Morph Selector Tabs with Framer Motion layoutId */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-[#e8e4dc] shadow-warm-sm">
            {MORPHOLOGIES.map((morph, index) => {
              const isActive = index === activeIdx;
              return (
                <button
                  key={morph.id}
                  onClick={() => setActiveIdx(index)}
                  className={`relative px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-[#68625c] hover:text-[#161412]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMorphPill"
                      className="absolute inset-0 bg-[#161412] rounded-xl shadow-warm-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#947346]" />
                    {morph.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Central Morphing Stage (Split Screen) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Morphing Image & Frame (7 cols) */}
          <div className="lg:col-span-7 relative">
            
            {/* Morphing ambient glow behind */}
            <motion.div
              animate={{
                borderRadius: current.borderRadius,
                scale: [1, 1.03, 1],
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -inset-2 bg-gradient-to-tr from-[#947346]/20 via-[#1d382b]/10 to-transparent blur-xl pointer-events-none"
            />

            {/* The Morphing Canvas Frame */}
            <motion.div
              layout
              animate={{
                borderRadius: current.borderRadius,
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              className="relative aspect-[16/11] overflow-hidden bg-[#161412] border-2 border-white/80 shadow-2xl"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, scale: 1.1, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current.image}
                    alt={current.name}
                    fill
                    priority
                    quality={92}
                    className="object-cover"
                  />
                  {/* Subtle architectural vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                </motion.div>
              </AnimatePresence>

              {/* Blueprint coordinate overlay (animated) */}
              <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-[#161412] shadow-sm">
                  {current.district}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-[#161412]/80 backdrop-blur-md text-[11px] font-mono text-[#dcd6cb] border border-white/10">
                  {current.style}
                </span>
              </div>

              {/* Bottom live metrics strip */}
              <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/50 text-xs shadow-warm-md">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-[#947346]" />
                  <span className="font-semibold text-[#161412]">{current.surface}</span>
                </div>
                <div className="w-px h-4 bg-[#e8e4dc]" />
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-[#947346]" />
                  <span className="text-[#68625c] truncate max-w-[160px] sm:max-w-none">{current.orientation}</span>
                </div>
                <div className="w-px h-4 bg-[#e8e4dc]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[#947346] font-bold">HSP</span>
                  <span className="font-semibold text-[#161412]">{current.specs.ceilingHeight}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Architectural Note & Morphing Specs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold block">
                    Morphologie Active #{activeIdx + 1}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-display font-medium text-[#161412]">
                    {current.name}
                  </h3>
                  <p className="text-sm text-[#68625c] font-light leading-relaxed">
                    {current.architectNote}
                  </p>
                </div>

                {/* Performance & Climate Gauges */}
                <div className="p-5 rounded-2xl bg-white border border-[#e8e4dc] shadow-warm-sm space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#68625c] font-medium">Lumière Naturelle Traversante</span>
                      <span className="font-semibold text-[#161412]">{current.specs.luminosity}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#f0ede6] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${current.specs.luminosity}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-[#947346]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#68625c] font-medium">Inertie Thermique & Aération</span>
                      <span className="font-semibold text-[#161412]">{current.specs.thermalInertia}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#f0ede6] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${current.specs.thermalInertia}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-[#1d382b]"
                      />
                    </div>
                  </div>
                </div>

                {/* Matériaux nobles */}
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#a39c92] font-semibold block">
                    Matériaux Principaux
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {current.materials.map((mat, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg bg-white border border-[#e8e4dc] text-xs font-medium text-[#161412]"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Call to action */}
                <div className="pt-2 flex items-center gap-4">
                  <Link
                    href={`/biens?district=${encodeURIComponent(current.district.split(' ')[0])}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold transition-all duration-300 shadow-warm-sm"
                  >
                    <span>Explorer ces réalisations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/catalogue"
                    className="inline-flex items-center gap-1.5 text-xs text-[#947346] hover:text-[#161412] font-semibold transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Dans notre catalogue</span>
                  </Link>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
