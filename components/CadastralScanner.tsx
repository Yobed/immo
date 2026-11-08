'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Scan, Compass, ShieldCheck, MapPin, Layers, 
  ArrowLeftRight, FileCheck, CheckCircle2 
} from 'lucide-react';

export default function CadastralScanner() {
  const [sliderPos, setSliderPos] = useState(52); // 52% default split
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <section className="bg-[#fbfaf7] text-[#161412] py-24 border-b border-[#e8e4dc] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-12">
        
        {/* En-tête du scanner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f0f5f2] border border-[#d2e3d8] text-xs font-semibold text-[#1d382b]">
              <Scan className="w-3.5 h-3.5 text-[#1d382b]" />
              <span>Scanner Interactif Foncier • Superposition Réalité / Cadastre</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#161412] tracking-tight leading-tight">
              Sous l’Architecture, la Rigueur du Titre.
            </h2>

            <p className="text-sm text-[#68625c] font-light leading-relaxed">
              Faites glisser le curseur pour scanner sous les finitions luxueuses de la Villa Riviera Golf. Chaque mur porteur correspond rigoureusement au plan de bornage certifié OGE-CI.
            </p>
          </div>

          <div className="text-xs text-[#7a736a] flex items-center gap-2 font-mono bg-white px-4 py-2.5 rounded-2xl border border-[#e8e4dc] shadow-warm-sm shrink-0">
            <ArrowLeftRight className="w-4 h-4 text-[#947346]" />
            <span>GLISSEZ POUR COMPARER LE PLAN & LA FAÇADE</span>
          </div>
        </div>

        {/* CADRE DU SCANNER INTERACTIF (BEFORE / AFTER SPLIT SLIDER) */}
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative aspect-[16/10] sm:aspect-[21/10] w-full rounded-3xl overflow-hidden border border-[#e8e4dc] bg-[#161412] select-none cursor-ew-resize shadow-warm-lg"
        >
          {/* COUCHE 1 : PLAN CADASTRAL & RELEVÉ GÉOMÈTRE (FOND) */}
          <div className="absolute inset-0 bg-[#0d1612] flex items-center justify-center p-8 sm:p-14">
            
            {/* Grille millimétrée géométrique */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Tracé vectoriel du plan architectural et bornage */}
            <div className="relative w-full h-full max-w-4xl border border-emerald-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between font-mono text-[11px] text-emerald-400">
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                    PLAN DE MASSE CADASTRAL • PARCELLE ILOT 48 LOT 12
                  </span>
                  <div className="text-xs text-white">RÉQUISITION N° 2024-0891/MCLU • LIVRE FONCIER BINGERVILLE</div>
                  <div className="text-[10px] text-emerald-500">COUPLE DE BORNES UTM : B1 (5°20&apos;42.1&quot;N) • B2 (3°58&apos;12.4&quot;W)</div>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-[10px] text-emerald-300 font-semibold">
                  SURFACE CERTIFIÉE : 650,40 M²
                </div>
              </div>

              {/* Représentation schématique des volumes bâtis */}
              <div className="my-auto grid grid-cols-3 gap-4 border border-dashed border-emerald-500/30 p-6 rounded-xl bg-emerald-950/20">
                <div className="border border-emerald-500/40 p-4 rounded-lg space-y-1">
                  <div className="text-[10px] text-emerald-300">RDC : GRAND SÉJOUR</div>
                  <div className="text-sm font-semibold text-white">142 m² net</div>
                  <div className="text-[9px] text-emerald-500">Hauteur ss plafond : 4,20 m</div>
                </div>
                <div className="border border-emerald-500/40 p-4 rounded-lg space-y-1">
                  <div className="text-[10px] text-emerald-300">AILE SUITES PARENTALES</div>
                  <div className="text-sm font-semibold text-white">4 Master Suites</div>
                  <div className="text-[9px] text-emerald-500">Sanitaires privatifs intégrés</div>
                </div>
                <div className="border border-emerald-500/40 p-4 rounded-lg space-y-1">
                  <div className="text-[10px] text-emerald-300">EMPRISE PISCINE</div>
                  <div className="text-sm font-semibold text-white">14 x 5 m</div>
                  <div className="text-[9px] text-emerald-500">Débordement miroir lagunaire</div>
                </div>
              </div>

              <div className="flex justify-between items-end text-[10px] text-emerald-500">
                <span>CONTRÔLEUR : CABINET GÉOMÈTRE OGE-CI N° 112</span>
                <span className="text-emerald-300">AUCUN EMPIÈTEMENT CONSTATÉ • BORNE CONTRADICTOIRE VÉRIFIÉE</span>
              </div>

            </div>

          </div>

          {/* COUCHE 2 : LA FAÇADE RÉELLE (MASQUÉE PAR CLIPPING) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <div 
              className="relative h-full"
              style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100vw' }}
            >
              <Image
                src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1800&q=95"
                alt="Villa Duplex Riviera Golf Façade Réelle"
                fill
                priority
                quality={95}
                className="object-cover object-left"
              />

              {/* Voile vignette subtil */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

              {/* Badge Couche Réalité */}
              <div className="absolute top-6 left-6 z-10">
                <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-[#161412] shadow-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1d382b]" />
                  <span>Réalité Construite (Finitions 2026)</span>
                </span>
              </div>

              <div className="absolute bottom-6 left-6 z-10 text-white space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#947346]">Cocody Riviera Golf</span>
                <div className="text-lg sm:text-xl font-display font-medium">Villa Contemporaine 650 m²</div>
              </div>

            </div>
          </div>

          {/* LIGNE DE SÉPARATION & CURSEUR BRASS / LAITON */}
          <div
            className="absolute top-0 bottom-0 z-30 w-1 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.7)]"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#161412] border-2 border-white text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-4 h-4 text-[#947346]" />
            </div>
          </div>

        </div>

        {/* Légende comparative sous le scanner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] space-y-1 text-xs">
            <span className="font-semibold text-[#161412] block">1. Réalité Physique</span>
            <p className="text-[#68625c] font-light">Volumes réels, béton armé hydrofuge, baies vitrées aluminium et piscine à débordement conforme au permis de construire N° 0192/MCLU.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] space-y-1 text-xs">
            <span className="font-semibold text-[#161412] block">2. Emprise Cadastrale</span>
            <p className="text-[#68625c] font-light">Superficie nette vérifiée au millimètre par géomètre assermenté OGE-CI sans aucun dépassement sur les parcelles voisines ni voirie publique.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] space-y-1 text-xs">
            <span className="font-semibold text-[#161412] block">3. Titre Juridique</span>
            <p className="text-[#68625c] font-light">Arrêté de Concession Définitive (ACD) délivré par le Ministère de la Construction et inscrit au Livre Foncier sans charge ni hypothèque.</p>
          </div>
        </div>

      </div>
    </section>
  );
}
