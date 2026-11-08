'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Sun, Moon, RotateCw, Sparkles, Layers, Maximize2 } from 'lucide-react';

interface InteractiveVilla3DProps {
  className?: string;
}

export default function InteractiveVilla3D({ className = '' }: InteractiveVilla3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Mouse tilt tracking with smooth spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 140, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 140, damping: 20 });

  // 3D Isometric rotation mappings
  const rotateX = useTransform(springY, [-1, 1], [58, 48]);
  const rotateZ = useTransform(springX, [-1, 1], [-35, -55]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isAutoRotating) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    if (!isAutoRotating) {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#181614] via-[#0E0D0C] to-[#070707] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.85)] select-none ${className}`}
    >
      {/* Dynamic Background Lighting Gradient (Day vs Night) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
          isNightMode ? 'opacity-40' : 'opacity-70'
        }`}
        style={{
          background: isNightMode 
            ? 'radial-gradient(circle at 50% 40%, rgba(30, 50, 100, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 40%, rgba(200, 169, 126, 0.18) 0%, rgba(220, 140, 60, 0.06) 45%, transparent 70%)'
        }}
      />

      {/* Floating 3D Spatial HUD Header */}
      <div className="relative z-20 p-6 sm:p-8 flex items-start justify-between gap-4 pointer-events-auto">
        <div className="space-y-1 max-w-md">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 text-xs text-white shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#C8A97E]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#C8A97E]">Maquette 3D Spatiale</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight drop-shadow-md">
            Villa Contemporaine · Riviera Golf
          </h3>
          <p className="text-xs text-white/60 font-light hidden sm:block">
            Perspective isométrique 3D avec porte-à-faux, piscine miroir et éclairage architectural.
          </p>
        </div>

        {/* 3D Controls (Day/Night & Turntable) */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-2xl p-1.5 rounded-full border border-white/15 shadow-2xl">
          <button
            type="button"
            onClick={() => setIsNightMode(!isNightMode)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isNightMode ? 'bg-indigo-950 text-indigo-200 border border-indigo-500/40 shadow-inner' : 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
            }`}
            title="Basculer entre éclairage crépuscule et nocturne"
          >
            {isNightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span className="text-[11px]">Nuit 3000K</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Crépuscule</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isAutoRotating ? 'bg-white/20 text-[#C8A97E]' : 'text-white/60 hover:text-white'
            }`}
            title={isAutoRotating ? 'Désactiver rotation 3D' : 'Activer rotation 3D'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </button>
        </div>
      </div>

      {/* 3D PERSPECTIVE STAGE */}
      <div className="relative w-full h-[460px] sm:h-[520px] flex items-center justify-center overflow-hidden [perspective:1200px]">
        
        {/* Animated 3D Isometric Villa Container */}
        <motion.div
          animate={isAutoRotating ? {
            rotateZ: [-40, -50, -40],
            rotateX: [52, 56, 52],
            scale: [1, 1.02, 1]
          } : {
            scale: 1
          }}
          transition={isAutoRotating ? {
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          } : undefined}
          style={!isAutoRotating ? {
            rotateX,
            rotateZ,
            transformStyle: 'preserve-3d'
          } : {
            transformStyle: 'preserve-3d'
          }}
          className="relative w-[340px] sm:w-[420px] h-[300px] sm:h-[360px] cursor-grab active:cursor-grabbing transform-gpu will-change-transform"
        >
          
          {/* 1. Base Ground Podium / Terrace (Ombre portée au sol) */}
          <div 
            className="absolute inset-0 rounded-3xl transition-colors duration-700 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.95)]"
            style={{
              background: isNightMode ? '#131418' : '#221F1C',
              transform: 'translateZ(0px)',
              border: isNightMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(200,169,126,0.15)'
            }}
          >
            {/* Dalles de terrasse grand format gravées */}
            <div className="absolute inset-4 grid grid-cols-4 grid-rows-3 gap-2 opacity-25 border border-white/20 rounded-2xl" />
          </div>

          {/* 2. Bassin Miroir à Débordement (Piscine Turquoise 3D) */}
          <div 
            className="absolute top-10 right-8 w-44 sm:w-56 h-28 sm:h-36 rounded-2xl overflow-hidden transition-all duration-700 shadow-inner"
            style={{
              transform: 'translateZ(12px)',
              background: isNightMode 
                ? 'linear-gradient(135deg, #06384a 0%, #032030 100%)'
                : 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)',
              border: '2px solid rgba(255,255,255,0.25)',
              boxShadow: isNightMode 
                ? '0 0 40px rgba(32, 208, 255, 0.35), inset 0 0 25px rgba(32, 208, 255, 0.4)'
                : '0 10px 30px rgba(14, 116, 144, 0.4), inset 0 0 15px rgba(255,255,255,0.3)'
            }}
          >
            {/* Water Ripple Caustics Animation */}
            <motion.div 
              animate={{ x: [-20, 20, -20], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-radial from-white/30 via-transparent to-transparent blur-xs pointer-events-none"
            />
            
            {/* Lueur d'eau subaquatique */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[9px] font-mono text-cyan-200">
              14m • Miroir
            </div>
          </div>

          {/* 3. Rez-de-Chaussée (Pavillon Vitré & Salon Cathédrale) */}
          <div 
            className="absolute bottom-8 left-8 w-48 sm:w-60 h-36 sm:h-44 rounded-2xl transition-all duration-700"
            style={{
              transform: 'translateZ(28px)',
              background: isNightMode 
                ? 'linear-gradient(135deg, #1c1d24 0%, #111216 100%)'
                : 'linear-gradient(135deg, #2e2a26 0%, #1d1b19 100%)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Baies Vitrées Illuminées */}
            <div 
              className={`absolute inset-3 rounded-xl border border-white/20 transition-all duration-700 ${
                isNightMode ? 'bg-amber-400/20 shadow-[0_0_35px_rgba(251,191,36,0.35)]' : 'bg-white/10'
              }`}
            >
              {/* Montants Aluminium Noir Minimaliste */}
              <div className="absolute inset-0 grid grid-cols-3 divide-x divide-white/20" />
            </div>

            {/* Poteau Acier Noir de Soutien */}
            <div className="absolute -top-1 -right-1 w-2.5 h-full bg-[#0a0a0c] rounded-full shadow-md" />
          </div>

          {/* 4. Étage Supérieur en Porte-à-Faux (Suite Master 85 m²) */}
          <motion.div 
            whileHover={{ scale: 1.02, translateZ: 62 }}
            className="absolute top-12 left-16 w-52 sm:w-64 h-32 sm:h-40 rounded-2xl transition-all duration-700"
            style={{
              transform: 'translateZ(55px)',
              background: isNightMode 
                ? 'linear-gradient(135deg, #2a2c34 0%, #18191f 100%)'
                : 'linear-gradient(135deg, #e8e4dc 0%, #cfc9be 100%)',
              boxShadow: isNightMode 
                ? '0 30px 60px rgba(0,0,0,0.9), 0 0 25px rgba(200, 169, 126, 0.2)'
                : '0 35px 70px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.8)',
              border: isNightMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.6)'
            }}
          >
            {/* Brise-soleil en Iroko Massif (Claustra contemporain) */}
            <div className="absolute top-2 right-2 bottom-2 w-14 rounded-lg bg-[#8a5528]/85 border border-[#6b421e] flex flex-col justify-around py-1.5 px-1 shadow-md">
              <div className="w-full h-1 bg-[#4a2e15] rounded-full" />
              <div className="w-full h-1 bg-[#4a2e15] rounded-full" />
              <div className="w-full h-1 bg-[#4a2e15] rounded-full" />
              <div className="w-full h-1 bg-[#4a2e15] rounded-full" />
            </div>

            {/* Baie vitrée panoramique de la Suite */}
            <div 
              className={`absolute top-3 left-3 bottom-3 right-18 rounded-lg border border-black/10 transition-all duration-700 ${
                isNightMode ? 'bg-amber-300/25 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'bg-black/15'
              }`}
            />

            {/* Label Porte-à-Faux */}
            <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono tracking-widest text-[#C8A97E] uppercase border border-white/10">
              Porte-à-Faux +4,20m
            </div>
          </motion.div>

          {/* 5. Toiture Terrasse Fine & Ombres Portées Découpées */}
          <div 
            className="absolute top-8 left-12 w-56 sm:w-72 h-34 sm:h-44 rounded-2xl pointer-events-none transition-all duration-700"
            style={{
              transform: 'translateZ(75px)',
              background: isNightMode ? '#15161b' : '#1d1b19',
              boxShadow: '0 40px 80px rgba(0,0,0,0.85)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          />

          {/* 6. Pins 3D Flottants Interactifs (Surélevés à translateZ(95px)) */}
          <div 
            className="absolute top-1/2 left-1/4 cursor-pointer z-30"
            style={{ transform: 'translateZ(95px)' }}
            onClick={() => setActivePin('suite')}
          >
            <div className="relative group">
              <span className="w-4 h-4 rounded-full bg-[#C8A97E] flex items-center justify-center text-[10px] font-black text-black shadow-lg animate-bounce">
                1
              </span>
              <span className="absolute -bottom-7 -left-12 px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md border border-white/20 text-[10px] text-white whitespace-nowrap shadow-xl">
                Suite Master 85m²
              </span>
            </div>
          </div>

          <div 
            className="absolute top-1/4 right-1/4 cursor-pointer z-30"
            style={{ transform: 'translateZ(85px)' }}
            onClick={() => setActivePin('pool')}
          >
            <div className="relative group">
              <span className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-[10px] font-black text-black shadow-lg animate-bounce" style={{ animationDelay: '0.4s' }}>
                2
              </span>
              <span className="absolute -bottom-7 -left-12 px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md border border-white/20 text-[10px] text-white whitespace-nowrap shadow-xl">
                Bassin Miroir 14m
              </span>
            </div>
          </div>

        </motion.div>

      </div>

      {/* Interactive Spatial Feature Pills (Bottom Bar) */}
      <div className="relative z-20 p-6 sm:p-8 pt-0 flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
        
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'suite', label: '1. Suite Master en Porte-à-Faux', detail: '85 m² avec terrasse privative et vue sur le golf' },
            { id: 'pool', label: '2. Bassin Miroir 14m à Débordement', detail: 'Revêtement pierre de Bali & ambiance subaquatique' },
            { id: 'salon', label: '3. Salon Cathédrale 5,20m', detail: 'Baies vitrées toute hauteur sans montant central' },
          ].map((pin) => (
            <button
              key={pin.id}
              type="button"
              onClick={() => setActivePin(activePin === pin.id ? null : pin.id)}
              className={`px-3.5 py-2 rounded-2xl backdrop-blur-xl border text-xs font-medium transition-all text-left cursor-pointer shadow-lg ${
                activePin === pin.id
                  ? 'bg-[#C8A97E] text-black border-[#C8A97E] scale-103'
                  : 'bg-black/50 hover:bg-black/75 text-white/90 border-white/15'
              }`}
            >
              <div className="font-semibold text-[11px]">{pin.label}</div>
              {activePin === pin.id && (
                <div className="text-[10px] text-black/80 font-light mt-0.5">{pin.detail}</div>
              )}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono tracking-widest uppercase text-white/40 hidden md:block">
          650 m² Habitable • 5 Suites • Titre TF 4128
        </div>

      </div>

    </div>
  );
}
