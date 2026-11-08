'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

export default function ParallaxBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Multi-layer parallax transforms
  const bgY = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);
  const fgFloatY = useTransform(scrollYProgress, [0, 1], ['40px', '-40px']);
  const stampRotate = useTransform(scrollYProgress, [0, 1], [-12, 12]);
  const textY = useTransform(scrollYProgress, [0, 1], ['20px', '-20px']);

  return (
    <section
      ref={containerRef}
      className="relative h-[650px] sm:h-[720px] w-full overflow-hidden flex items-center justify-center bg-[#161412] text-white"
    >
      {/* Background Parallax Image */}
      <motion.div
        style={{ y: bgY, scale: bgScale }}
        className="absolute inset-0 w-full h-[130%] -top-[15%] z-0"
      >
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85"
          alt="Demeure contemporaine Cocody Golf"
          fill
          priority={false}
          className="object-cover brightness-[0.55] contrast-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-transparent to-[#161412]/80" />
      </motion.div>

      {/* Floating Decorative Stamp (Parallax Layer 2) */}
      <motion.div
        style={{ y: fgFloatY, rotate: stampRotate }}
        className="absolute top-16 right-8 sm:right-20 z-10 hidden md:flex flex-col items-center justify-center w-36 h-36 rounded-full border border-white/25 bg-white/10 backdrop-blur-md p-4 text-center shadow-2xl"
      >
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#947346] font-bold">
          Cadastre MCLU
        </span>
        <span className="text-xl font-display font-medium text-white my-0.5">
          100% ACD
        </span>
        <span className="text-[9px] uppercase tracking-wider text-[#dcd6cb]">
          Titre Foncier Purifié
        </span>
      </motion.div>

      {/* Floating District Coordinates Badge (Parallax Layer 3) */}
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], ['-30px', '30px']) }}
        className="absolute bottom-16 left-8 sm:left-20 z-10 hidden lg:flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white shadow-xl"
      >
        <div className="w-8 h-8 rounded-xl bg-[#947346]/20 flex items-center justify-center text-[#947346]">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-white">5°20&apos;42&quot;N 3°58&apos;14&quot;O</div>
          <div className="text-[11px] text-[#dcd6cb]">Cocody Riviera Golf • Abidjan</div>
        </div>
      </motion.div>

      {/* Central Editorial Content (Parallax Layer 4) */}
      <motion.div
        style={{ y: textY }}
        className="relative z-20 max-w-4xl mx-auto px-6 text-center space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#fbfaf7]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#947346]" />
          <span>L&apos;Excellence Immobilière Ivoirienne</span>
        </motion.div>

        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-display font-medium text-white tracking-tight leading-[1.05]">
          Quand la Matière Noble <br />
          <span className="italic font-normal text-[#dcd6cb]">Rencontre la Sécurité Juridique.</span>
        </h2>

        <p className="text-base sm:text-lg text-white/80 font-light max-w-2xl mx-auto leading-relaxed">
          Chaque demeure signée par notre cabinet allie audace architecturale, isolation bioclimatique et rigueur notariale sous séquestre.
        </p>

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#161412] hover:bg-[#947346] hover:text-white text-xs font-semibold transition-all duration-300 shadow-2xl hover:scale-105"
          >
            <span>Feuilleter notre catalogue numérique</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all duration-300"
          >
            <span>Voir les 42 propriétés privées</span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
