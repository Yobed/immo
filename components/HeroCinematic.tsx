'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Property } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { ArrowRight, MessageCircle, ChevronLeft, ChevronRight, ShieldCheck, MapPin } from 'lucide-react';

interface HeroCinematicProps {
  properties: Property[];
  onOpenVisitModal?: (property: Property) => void;
}

export default function HeroCinematic({ properties, onOpenVisitModal }: HeroCinematicProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const featured = properties.slice(0, 4);
  const activeProp = featured[activeIndex] || featured[0];

  // Mouse Parallax Physics for tactile 3D depth
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 45, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 45, damping: 25 });

  const bgX = useTransform(springX, [-0.5, 0.5], [-18, 18]);
  const bgY = useTransform(springY, [-0.5, 0.5], [-14, 14]);
  const textX = useTransform(springX, [-0.5, 0.5], [8, -8]);
  const textY = useTransform(springY, [-0.5, 0.5], [6, -6]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientWidth, clientHeight } = document.documentElement;
    mouseX.set(e.clientX / clientWidth - 0.5);
    mouseY.set(e.clientY / clientHeight - 0.5);
  };

  // Auto progression with interval
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featured.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const whatsappUrl = getWhatsAppLink(
    '2250788421920',
    `Bonjour Cabinet Immobilier Abidjan, je souhaite organiser une visite privée pour "${activeProp.title}" à ${activeProp.district} (${formatFCFA(activeProp.price)}/mois).`
  );

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative w-full h-[96vh] min-h-[680px] max-h-[1100px] bg-[#0A0908] text-[#F5F2EB] overflow-hidden flex flex-col justify-between select-none pt-20"
    >
      
      {/* ========================================================================= */}
      {/* 1. ARRIÈRE-PLAN PLEIN ÉCRAN : PHOTOGRAPHIE AVEC PARALLAXE 3D              */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeProp.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <motion.div
            style={{ x: bgX, y: bgY }}
            className="w-full h-full relative scale-105"
          >
            <Image
              src={activeProp.images[0]}
              alt={activeProp.title}
              fill
              priority
              unoptimized
              className="object-cover brightness-[0.70] contrast-[1.08]"
            />
          </motion.div>

          {/* Dégradés cinématiques veloutés */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0908] via-[#0A0908]/25 to-black/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0908]/80 via-transparent to-black/35 pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Repères géométriques fins d'architecte */}
      <div className="pointer-events-none absolute inset-x-10 top-24 bottom-28 border border-white/[0.05] hidden lg:block z-10" />

      {/* ========================================================================= */}
      {/* 2. CENTRE DU VIEWPORT : ACCROCHE MAJESTUEUSE & MICRO-DONNÉES               */}
      {/* ========================================================================= */}
      <div className="relative z-20 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-14 my-auto">
        <motion.div 
          style={{ x: textX, y: textY }}
          className="max-w-4xl space-y-6"
        >
          
          {/* Badge Quartier & Titre Foncier */}
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs font-mono uppercase tracking-wider text-[#C8A97E] flex items-center gap-2 shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span>{activeProp.district}</span>
            </span>

            <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs font-mono uppercase tracking-wider text-white/90 flex items-center gap-2 shadow-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span>Titre {activeProp.legal_status} Audité</span>
            </span>
          </div>

          {/* Titre Monumental */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-medium text-white tracking-tight leading-[1.03] drop-shadow-2xl">
            {activeProp.title}
          </h1>

          {/* Micro-données : Loyer, Surface, Suites */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-base sm:text-lg font-light text-white/90">
            <span className="text-2xl sm:text-3xl font-display font-medium text-[#C8A97E]">
              {formatFCFA(activeProp.price)}
              <span className="text-xs text-white/60 font-sans font-light"> / mois</span>
            </span>
            <span className="text-white/30">•</span>
            <span className="font-mono text-sm">{activeProp.surface} m²</span>
            {activeProp.bedrooms > 0 && (
              <>
                <span className="text-white/30">•</span>
                <span className="font-mono text-sm">{activeProp.bedrooms} Suites</span>
              </>
            )}
            {activeProp.has_pool && (
              <>
                <span className="text-white/30">•</span>
                <span className="font-mono text-sm text-[#C8A97E]">Piscine Miroir</span>
              </>
            )}
          </div>

          {/* Boutons d'Action VIP */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full bg-white hover:bg-[#C8A97E] text-[#191715] hover:text-white text-xs font-bold flex items-center gap-2.5 shadow-2xl transition-all transform hover:scale-102 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Organiser une Visite Privée</span>
            </a>

            <Link
              href={`/biens/${activeProp.id}`}
              className="px-7 py-4 rounded-full bg-white/10 hover:bg-white hover:text-[#0A0908] backdrop-blur-2xl border border-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-all duration-300 shadow-xl"
            >
              <span>Explorer la Demeure</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRE INFÉRIEURE : VIGNETTES INTERACTIVES AVEC TIMELINE GOLD           */}
      {/* ========================================================================= */}
      <div className="relative z-20 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-14 pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-5">
          
          {/* Flèches de Défilement & Compteur */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev - 1 + featured.length) % featured.length)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer"
              title="Demeure précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev + 1) % featured.length)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer"
              title="Demeure suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono text-white/50 ml-2">
              0{activeIndex + 1} / 0{featured.length}
            </span>
          </div>

          {/* Vignettes Rapides avec Barre de Progression */}
          <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {featured.map((prop, idx) => (
              <button
                key={prop.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative flex items-center gap-3.5 px-3.5 py-2 rounded-2xl transition-all cursor-pointer text-left overflow-hidden ${
                  idx === activeIndex
                    ? 'bg-white/20 border border-[#C8A97E] shadow-[0_15px_35px_rgba(200,169,126,0.25)]'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="relative w-12 h-9 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={prop.images[0]}
                    alt={prop.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-medium text-white truncate max-w-[140px]">
                    {prop.district}
                  </p>
                  <p className="text-[11px] font-mono text-[#C8A97E]">
                    {formatFCFA(prop.price)}
                  </p>
                </div>

                {/* Golden Animated Progress Bar under active card */}
                {idx === activeIndex && (
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 9, ease: 'linear' }}
                    className="absolute bottom-0 left-0 h-[2px] bg-[#C8A97E]"
                  />
                )}
              </button>
            ))}
          </div>

        </div>
      </div>

    </section>
  );
}
