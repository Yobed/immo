'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/lib/types';
import { formatFCFA } from '@/lib/utils';
import { ArrowUpRight, ShieldCheck, CheckCircle2, MapPin, Users } from 'lucide-react';

interface HomeviaShowcaseProps {
  property: Property;
}

export default function HomeviaShowcase({ property }: HomeviaShowcaseProps) {
  return (
    <section className="relative w-full py-20 sm:py-28 bg-[#fbfaf7] overflow-hidden font-sans border-b border-[#e8e4dc]">
      
      {/* ========================================================================= */}
      {/* 1. TYPOGRAPHIE MONUMENTALE EN FILIGRANE (Watermark géant façon Homevia)  */}
      {/* ========================================================================= */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none select-none z-0 w-full text-center">
        <span className="text-[12vw] sm:text-[14vw] font-black tracking-tighter text-[#161412]/[0.035] leading-none uppercase block">
          Cabinet Immo
        </span>
      </div>

      <div className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* En-tête de section discret */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#947346] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#947346]" />
              <span>Architecture Monumentale &amp; Rigueur Foncière</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display font-medium text-[#161412] mt-1 tracking-tight">
              L&apos;Élégance Contemporaine, Éprouvée au Livre Foncier.
            </h2>
          </div>

          <Link
            href="/biens?operation=rent"
            className="text-xs uppercase tracking-wider font-bold text-[#161412] hover:text-[#947346] flex items-center gap-1.5 transition-colors"
          >
            <span>Voir les baux de prestige</span>
            <ArrowUpRight className="w-4 h-4 text-[#947346]" />
          </Link>
        </div>

        {/* ======================================================================= */}
        {/* 2. GRAND CADRE ARCHITECTURAL AVEC CARTOUCHE BENTO FLOTTANT (Homevia)    */}
        {/* ======================================================================= */}
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-black/10 aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/10] min-h-[480px]">
          
          {/* Photographie architecturale monumentale à l'heure dorée */}
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            quality={92}
            className="object-cover brightness-[0.92] contrast-[1.03]"
          />

          {/* Voile d'ombrage atmosphérique pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

          {/* Zone Inférieure Gauche : Philosophie & Preuve Sociale (Diplomates / Cadres) */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 z-20 max-w-md space-y-4">
            <p className="text-sm sm:text-base text-white/95 font-light leading-relaxed drop-shadow">
              Des demeures d&apos;exception sélectionnées pour leur pureté architecturale, leur indépendance énergétique et leur conformité notariée absolue.
            </p>

            {/* Avatars de confiance façon Homevia */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-800">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Locataire diplomatique"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-800">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Directeur Général"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white overflow-hidden bg-slate-800">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                    alt="Gestionnaire Superhôte"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col text-white">
                <span className="text-xs font-bold leading-none">120+ Résidences Auditées</span>
                <span className="text-[10px] text-white/70 mt-0.5">Baux Diplomatiques &amp; Corporate Abidjan</span>
              </div>
            </div>
          </div>

          {/* Zone Inférieure Droite : Carte Bento Flottante Dédiée au Bien (Exact Homevia) */}
          <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 z-20 w-72 sm:w-80 bg-white/95 backdrop-blur-2xl rounded-2xl p-3.5 shadow-2xl border border-white/60 space-y-3">
            
            {/* 2 Miniatures empilées des vues clés */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative h-20 rounded-xl overflow-hidden">
                <Image
                  src={property.images[1] || property.images[0]}
                  alt="Vue salon"
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                />
              </div>
              <div className="relative h-20 rounded-xl overflow-hidden">
                <Image
                  src={property.images[2] || property.images[0]}
                  alt="Vue piscine"
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                />
              </div>
            </div>

            {/* Titre & Adresse */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#947346] font-bold">
                  {property.reference}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                  Titre {property.legal_status}
                </span>
              </div>
              <h3 className="font-bold text-xs text-slate-900 truncate">
                {property.title}
              </h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#947346]" />
                <span className="truncate">{property.address}, {property.district}</span>
              </p>
            </div>

            {/* Bouton Noir Pill "Explore Property" */}
            <Link
              href={`/biens/${property.id}`}
              className="w-full py-2.5 rounded-xl bg-[#161412] hover:bg-[#947346] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Explorer la Résidence</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}
