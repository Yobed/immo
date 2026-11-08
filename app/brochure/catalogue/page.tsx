'use client';

import React from 'react';
import Image from 'next/image';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { formatFCFA } from '@/lib/utils';
import { ShieldCheck, Award, FileText } from 'lucide-react';

export default function GlobalCataloguePrintPage() {
  const villa = INITIAL_PROPERTIES.find((p) => p.reference === 'VIL-RG-2026') || INITIAL_PROPERTIES[0];
  const penthouse = INITIAL_PROPERTIES.find((p) => p.reference === 'PNT-Z4-104') || INITIAL_PROPERTIES[1];
  const terrain = INITIAL_PROPERTIES.find((p) => p.reference === 'TER-BG-600') || INITIAL_PROPERTIES[2];
  const appart = INITIAL_PROPERTIES.find((p) => p.reference === 'APP-PL-04') || INITIAL_PROPERTIES[3];

  return (
    <div className="bg-[#fbfaf7] text-[#161412] font-sans antialiased print:bg-white">
      
      {/* Barre d'outils écran */}
      <div className="print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc] px-6 py-3.5 flex items-center justify-between shadow-warm-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#161412] text-white flex items-center justify-center font-display font-semibold text-xs">
            A
          </div>
          <div>
            <span className="text-xs font-semibold text-[#161412] block">
              Catalogue Général Prestige 2026 • Agence Immo Abidjan
            </span>
            <span className="text-[10px] text-[#7a736a] block">
              Document A4 Paysage Haute Résolution prêt pour impression vectorielle
            </span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-full bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Imprimer en PDF (A4)</span>
        </button>
      </div>

      {/* CONTENEUR DES PAGES A4 PAYSAGE */}
      <div className="max-w-[1120px] mx-auto py-8 print:py-0 print:max-w-none space-y-12 print:space-y-0">
        
        {/* PAGE 1 : COUVERTURE */}
        <section className="w-full h-[792px] bg-[#fbfaf7] p-12 flex flex-col justify-between border border-[#e8e4dc] print:border-0 rounded-3xl print:rounded-none relative overflow-hidden shadow-warm-md print:shadow-none break-after-page">
          <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-6">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#947346] font-semibold block">
                Édition Prestige Annuelle • Abidjan
              </span>
              <h1 className="text-2xl font-display font-bold text-[#161412]">
                AGENCE IMMO • PORTFOLIO 2026
              </h1>
            </div>
            <div className="w-12 h-12 rounded-full border border-[#947346]/40 flex items-center justify-center font-display font-bold text-sm text-[#947346]">
              2026
            </div>
          </div>

          <div className="relative flex-1 my-8 rounded-2xl overflow-hidden shadow-inner">
            <Image src={villa.images[0]} alt="Couverture Catalogue" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#d8c29d] font-semibold block">
                Catalogue de Référence
              </span>
              <h2 className="text-4xl font-display font-medium leading-tight">
                L&apos;Immobilier d&apos;Exception & le Foncier Sécurisé
              </h2>
              <p className="text-sm text-white/80 font-light max-w-xl">
                Résidences d&apos;architecte à Cocody, penthouses contemporains en Zone 4 et opportunités foncières titrées avec ACD vérifié.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#e8e4dc] pt-6 text-xs text-[#7a736a]">
            <span>Direction du Patrimoine & Transactions Notariées</span>
            <span className="font-semibold text-[#161412]">Titre ACD Garanti • Ministère de la Construction</span>
          </div>
        </section>

        {/* PAGE 2 : ÉDITORIAL & COLLECTION */}
        <section className="w-full h-[792px] bg-white p-12 flex flex-col justify-between border border-[#e8e4dc] print:border-0 rounded-3xl print:rounded-none relative overflow-hidden shadow-warm-md print:shadow-none break-after-page">
          <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-6">
            <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold">
              Collection Résidentielle
            </span>
            <span className="font-mono text-xs text-[#7a736a]">Page 02</span>
          </div>

          <div className="grid grid-cols-2 gap-8 my-6">
            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-sm">
                <Image src={villa.images[0]} alt={villa.title} fill className="object-cover" />
                <div className="absolute top-3 left-3 bg-[#1d382b] text-white text-[10px] font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ACD Vérifié
                </div>
              </div>
              <h3 className="text-xl font-display font-semibold text-[#161412]">{villa.title}</h3>
              <p className="text-xs text-[#68625c] leading-relaxed line-clamp-3">{villa.description}</p>
              <div className="flex justify-between items-center pt-2 border-t border-[#e8e4dc]">
                <span className="text-xs text-[#7a736a]">Cocody Riviera Golf</span>
                <strong className="text-sm text-[#947346] font-semibold">{formatFCFA(villa.price)}</strong>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-sm">
                <Image src={penthouse.images[0]} alt={penthouse.title} fill className="object-cover" />
                <div className="absolute top-3 left-3 bg-[#947346] text-white text-[10px] font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow">
                  <Award className="w-3.5 h-3.5" />
                  Rooftop Exclusif
                </div>
              </div>
              <h3 className="text-xl font-display font-semibold text-[#161412]">{penthouse.title}</h3>
              <p className="text-xs text-[#68625c] leading-relaxed line-clamp-3">{penthouse.description}</p>
              <div className="flex justify-between items-center pt-2 border-t border-[#e8e4dc]">
                <span className="text-xs text-[#7a736a]">Marcory Zone 4</span>
                <strong className="text-sm text-[#947346] font-semibold">{formatFCFA(penthouse.price)} / mois</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#e8e4dc] pt-6 text-xs text-[#7a736a]">
            <span>Agence Immo Abidjan</span>
            <span>Visites sur rendez-vous avec négociation notariée</span>
          </div>
        </section>

      </div>
    </div>
  );
}
