'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Property } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { ArrowRight, MessageCircle, ChevronLeft, ChevronRight, Eye, ShieldCheck, Sparkles } from 'lucide-react';

interface CalaMiraHeroProps {
  properties: Property[];
  onOpenVisitModal?: (property: Property) => void;
}

export default function CalaMiraHero({ properties, onOpenVisitModal }: CalaMiraHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Focus on top 4 iconic properties
  const featuredProperties = properties.slice(0, 4);
  const activeProp = featuredProperties[activeIndex] || featuredProperties[0];

  // Mouse Parallax Effect for depth
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const bgTranslateX = useTransform(springX, [-0.5, 0.5], [-12, 12]);
  const bgTranslateY = useTransform(springY, [-0.5, 0.5], [-8, 8]);
  const bgScale = useTransform(springY, [-0.5, 0.5], [1.04, 1.07]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientWidth, clientHeight } = document.documentElement;
    const x = e.clientX / clientWidth - 0.5;
    const y = e.clientY / clientHeight - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % featuredProperties.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + featuredProperties.length) % featuredProperties.length);
  };

  // Auto advance every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredProperties.length);
    }, 8500);
    return () => clearInterval(timer);
  }, [featuredProperties.length]);

  const whatsappDirectUrl = getWhatsAppLink(
    '2250788421920',
    `Bonjour Cabinet Immobilier Abidjan, je souhaite organiser une visite privée pour "${activeProp.title}" à ${activeProp.district} (${formatFCFA(activeProp.price)}/mois).`
  );

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative w-full h-[94vh] min-h-[640px] max-h-[1050px] bg-[#0E0D0C] text-[#F5F2EB] overflow-hidden flex flex-col justify-between font-sans select-none pt-16"
    >
      
      {/* ========================================================================= */}
      {/* 1. PLEIN ÉCRAN : GRANDE PHOTOGRAPHIE ARCHITECTURALE & MOTION ZOOM          */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeProp.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <motion.div
            style={{
              x: bgTranslateX,
              y: bgTranslateY,
              scale: bgScale,
            }}
            className="w-full h-full relative"
          >
            <Image
              src={activeProp.images[0]}
              alt={activeProp.title}
              fill
              priority
              unoptimized
              className="object-cover brightness-[0.72] contrast-[1.08]"
            />
          </motion.div>

          {/* Dégradés d'ambiance voluptueux (Profondeur & Lisibilité naturelle) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0D0C] via-[#0E0D0C]/30 to-black/50 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0D0C]/80 via-transparent to-black/40 pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Repères géométriques fins et discrets */}
      <div className="pointer-events-none absolute inset-x-8 top-20 bottom-24 border border-white/[0.06] hidden lg:block z-10">
        <span className="absolute -top-1.5 -left-1.5 text-white/30 text-xs font-mono">+</span>
        <span className="absolute -top-1.5 -right-1.5 text-white/30 text-xs font-mono">+</span>
        <span className="absolute -bottom-1.5 -left-1.5 text-white/30 text-xs font-mono">+</span>
        <span className="absolute -bottom-1.5 -right-1.5 text-white/30 text-xs font-mono">+</span>
      </div>

      {/* ========================================================================= */}
      {/* 2. ZONE CENTRALE : TYPOGRAPHIE PURE, ÉPURÉE & IMMERSIVE                   */}
      {/* ========================================================================= */}
      <div className="relative z-20 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-14 my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProp.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl space-y-5"
          >
            {/* Badge de Quartier & Statut Foncier */}
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[11px] font-mono uppercase tracking-widest text-[#C8A97E] flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-[#C8A97E]" />
                <span>{activeProp.district}</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-emerald-950/60 backdrop-blur-xl border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Titre {activeProp.legal_status} Audité</span>
              </span>
            </div>

            {/* Titre Principal : Majestueux et Sobre */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-medium text-white tracking-tight leading-[1.05] drop-shadow-2xl">
              {activeProp.title}
            </h1>

            {/* Micro-spécifications : 1 seule ligne ultra-lisible */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base font-light text-white/90">
              <span className="text-xl sm:text-2xl font-display font-medium text-[#C8A97E]">
                {formatFCFA(activeProp.price)}
                <span className="text-xs text-white/60 font-sans font-light"> / mois</span>
              </span>
              <span className="text-white/30">•</span>
              <span className="font-mono text-xs sm:text-sm">{activeProp.surface} m² Habitables</span>
              {activeProp.bedrooms > 0 && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="font-mono text-xs sm:text-sm">{activeProp.bedrooms} Suites Privatives</span>
                </>
              )}
              {activeProp.has_pool && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="font-mono text-xs sm:text-sm text-cyan-300">Piscine Miroir</span>
                </>
              )}
            </div>

            {/* Boutons d'Action VIP : Zéro Friction */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-2 shadow-[0_15px_30px_rgba(37,211,102,0.35)] transition-all transform hover:scale-102 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Réserver une Visite Privée</span>
              </a>

              <Link
                href={`/biens/${activeProp.id}`}
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white hover:text-[#0E0D0C] backdrop-blur-xl border border-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-all duration-300 shadow-xl"
              >
                <span>Explorer les Détails</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRE INFÉRIEURE : SÉLECTEUR DE DEMEURES AVEC PROGRESSION               */}
      {/* ========================================================================= */}
      <div className="relative z-20 max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-14 pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-5">
          
          {/* Navigation Flèches */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
              title="Bien précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
              title="Bien suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono text-white/50 ml-2">
              0{activeIndex + 1} / 0{featuredProperties.length}
            </span>
          </div>

          {/* Vignettes Rapides des 4 Résidences */}
          <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {featuredProperties.map((prop, idx) => (
              <button
                key={prop.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-2xl transition-all cursor-pointer text-left ${
                  idx === activeIndex
                    ? 'bg-white/15 border border-[#C8A97E] shadow-[0_10px_30px_rgba(200,169,126,0.2)]'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="relative w-10 h-8 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={prop.images[0]}
                    alt={prop.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="hidden md:block">
                  <p className="text-[11px] font-medium text-white truncate max-w-[130px]">
                    {prop.district}
                  </p>
                  <p className="text-[10px] font-mono text-[#C8A97E]">
                    {formatFCFA(prop.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>

    </section>
  );
}
