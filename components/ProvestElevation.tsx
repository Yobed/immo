'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/lib/types';
import { formatFCFA } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ShieldCheck, Scale, Award, ArrowUpRight } from 'lucide-react';

interface ProvestElevationProps {
  properties: Property[];
}

export default function ProvestElevation({ properties }: ProvestElevationProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const activeProp = properties[slideIndex] || properties[0];

  const handleNext = () => {
    setSlideIndex((prev) => (prev + 1) % properties.length);
  };

  const handlePrev = () => {
    setSlideIndex((prev) => (prev - 1 + properties.length) % properties.length);
  };

  return (
    <section className="relative w-full py-24 sm:py-32 bg-white text-[#161412] font-sans overflow-hidden border-b border-[#e8e4dc]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* ========================================================================= */}
        {/* 1. EN-TÊTE ÉDITORIAL & BADGE PROVEST                                      */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161412] text-[#F5F2EB] text-[10px] font-mono tracking-widest uppercase">
            <span>Investissement Patrimonial &amp; Rigueur Foncière</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-[#161412] tracking-tight leading-[1.08]">
            Bâtir l&apos;Excellence, <br />
            <span className="italic font-normal text-[#947346]">Une Propriété d&apos;Exception</span> à la Fois.
          </h2>

          <p className="text-xs sm:text-sm text-[#7a736a] max-w-xl mx-auto font-light leading-relaxed">
            Chaque transaction est protégée par un protocole juridique complet : réquisition de propriété au Livre Foncier, séquestre notarié et constat d&apos;huissier.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2. ÉCRIN ARCHITECTURAL ÉLÉVATION (Composition 3 Colonnes : Stats / Rendu / Nav) */}
        {/* ========================================================================= */}
        <div className="mt-14 sm:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Colonne Gauche : 3 Métriques de Confiance Absolue */}
          <div className="lg:col-span-3 space-y-8 order-2 lg:order-1 text-center lg:text-left">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#161412] tracking-tight block">
                100%
              </span>
              <span className="text-xs uppercase font-bold text-[#947346] tracking-wider block">
                Titre ACD &amp; CMP Vérifié
              </span>
              <p className="text-[11px] text-[#7a736a] font-light leading-tight">
                Zéro litige foncier, état au Guichet Unique MCLU certifié sous 48h.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#161412] tracking-tight block">
                4.8M
              </span>
              <span className="text-xs uppercase font-bold text-[#947346] tracking-wider block">
                FCFA Loyer Moyen Prime
              </span>
              <p className="text-[11px] text-[#7a736a] font-light leading-tight">
                Baux diplomatiques et multinationales garantis par le siège.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#161412] tracking-tight block">
                0 Litige
              </span>
              <span className="text-xs uppercase font-bold text-[#947346] tracking-wider block">
                Séquestre Notarié
              </span>
              <p className="text-[11px] text-[#7a736a] font-light leading-tight">
                Consignation intégrale du dépôt de garantie et états des lieux d&apos;huissier.
              </p>
            </div>
          </div>

          {/* Colonne Centrale : Rendu Architectural d'Exception */}
          <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col items-center">
            <div className="relative w-full aspect-[16/11] max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group">
              <Image
                src={activeProp.images[0]}
                alt={activeProp.title}
                fill
                priority
                className="object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
              />

              {/* Tag Flottant Haut Droite */}
              <div className="absolute top-4 right-4 z-10">
                <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-[#161412] shadow-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#9E7431]" />
                  <span>Mandat Exclusif {activeProp.legal_status}</span>
                </span>
              </div>

              {/* Cartouche Bas Translucide */}
              <div className="absolute bottom-4 inset-x-4 p-4 rounded-2xl bg-[#161412]/85 backdrop-blur-xl text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C8A97E]">
                    {activeProp.district} • Abidjan
                  </span>
                  <h3 className="font-bold text-sm sm:text-base truncate max-w-md">
                    {activeProp.title}
                  </h3>
                  <span className="text-xs text-white/80 font-mono">
                    {formatFCFA(activeProp.price)} / mois • {activeProp.surface} m²
                  </span>
                </div>

                <Link
                  href={`/biens/${activeProp.id}`}
                  className="px-4 py-2 rounded-xl bg-white text-[#161412] hover:bg-[#C8A97E] text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Détails</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Navigation Stylisée (Exact Provest 01 / 06) */}
          <div className="lg:col-span-2 order-3 flex lg:flex-col items-center justify-center gap-4 text-center">
            <button
              type="button"
              onClick={handlePrev}
              className="w-11 h-11 rounded-full border border-slate-300 hover:border-black flex items-center justify-center transition-all cursor-pointer group"
              aria-label="Mandat précédent"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700 group-hover:text-black" />
            </button>

            <div className="flex flex-col items-center font-mono">
              <span className="text-xl font-bold text-slate-900">
                0{slideIndex + 1}
              </span>
              <span className="text-xs text-slate-400 font-light">
                /
              </span>
              <span className="text-xs text-slate-500">
                0{properties.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-11 h-11 rounded-full border border-slate-300 hover:border-black flex items-center justify-center transition-all cursor-pointer group"
              aria-label="Mandat suivant"
            >
              <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-black" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
