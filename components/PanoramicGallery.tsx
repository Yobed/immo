'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Property } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { ArrowRight, MessageCircle, FileText, Maximize2, Bed, Waves, ShieldCheck } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import { Parallax, Reveal } from '@/components/Motion';

interface PanoramicGalleryProps {
  properties: Property[];
  onOpenDossier: (ref: string, title: string) => void;
}

export default function PanoramicGallery({ properties, onOpenDossier }: PanoramicGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'villa' | 'penthouse'>('all');

  const filtered = properties.filter((p) => {
    if (filter === 'all') return true;
    return p.property_type === filter;
  });

  const spotlight = filtered[0] || properties[0];
  const others = filtered.slice(1, 5);

  return (
    <section id="collection" className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto select-none">
      
      {/* En-tête Éditorial Pur */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b dark:border-white/[0.08] border-black/[0.08]">
        <div className="space-y-3">
          <h2 className="text-4xl sm:text-6xl font-display font-medium dark:text-white text-[#141210] tracking-tight">
            La Sélection Privée
          </h2>
          <p className="text-sm sm:text-base dark:text-[#A39C92] text-[#6B655D] font-light max-w-xl">
            Chaque demeure est vérifiée au Livre Foncier, disponible sous bail de prestige ou diplomatique.
          </p>
        </div>

        {/* Filtres Discrets */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'dark:bg-white dark:text-[#0A0908] bg-[#141210] text-white font-bold shadow-lg'
                : 'dark:bg-white/5 dark:text-white/70 bg-black/5 text-black/70 hover:bg-black/10'
            }`}
          >
            Toutes ({properties.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('villa')}
            className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === 'villa'
                ? 'dark:bg-white dark:text-[#0A0908] bg-[#141210] text-white font-bold shadow-lg'
                : 'dark:bg-white/5 dark:text-white/70 bg-black/5 text-black/70 hover:bg-black/10'
            }`}
          >
            Villas Piscine
          </button>
          <button
            type="button"
            onClick={() => setFilter('penthouse')}
            className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filter === 'penthouse'
                ? 'dark:bg-white dark:text-[#0A0908] bg-[#141210] text-white font-bold shadow-lg'
                : 'dark:bg-white/5 dark:text-white/70 bg-black/5 text-black/70 hover:bg-black/10'
            }`}
          >
            Penthouses
          </button>
        </div>
      </div>

      {/* Grille Éditoriale Asymétrique */}
      <div className="pt-12 space-y-12">
        
        {/* 1. LA DEMEURE SPOTLIGHT (Grand Format Panoramique 21:9) */}
        {spotlight && (
          <TiltCard tiltStrength={4} className="rounded-3xl">
            <article className="group relative rounded-3xl overflow-hidden dark:bg-[#121110] bg-white border dark:border-white/[0.08] border-black/[0.08] dark:shadow-[0_30px_90px_rgba(0,0,0,0.85)] shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
              
              <Link href={`/biens/${spotlight.id}`} className="block relative aspect-[16/9] lg:aspect-[21/9] overflow-hidden bg-black">
                <Parallax strength={12}>
                  <Image
                    src={spotlight.images[0]}
                    alt={spotlight.title}
                    fill
                    unoptimized
                    priority
                    className="object-cover group-hover:scale-104 transition-transform duration-1000 ease-out brightness-90 group-hover:brightness-100"
                  />
                </Parallax>

                {/* Dégradés d'ambiance */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Badge Flottant District */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-xs font-mono uppercase text-[#C8A97E]">
                    {spotlight.district}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-xs font-mono text-white/90 flex items-center gap-1.5 backdrop-blur-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C8A97E]" />
                    <span>Titre {spotlight.legal_status}</span>
                  </span>
                </div>

                {/* Overlay Inférieur : Titre & Loyer en Pleine Image */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <h3 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight group-hover:text-[#C8A97E] transition-colors">
                      {spotlight.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs sm:text-sm text-white/80 font-mono">
                      <span>{spotlight.surface} m²</span>
                      <span>•</span>
                      <span>{spotlight.bedrooms} Suites</span>
                      {spotlight.has_pool && (
                        <>
                          <span>•</span>
                          <span className="text-[#C8A97E]">Piscine Débordement</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <div className="text-2xl sm:text-3xl font-display font-medium text-white">
                      {formatFCFA(spotlight.price)}
                      <span className="text-xs text-white/60 font-sans font-light"> / mois</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Barre d'Action Inférieure */}
              <div className="p-6 dark:bg-[#121110] bg-white border-t dark:border-white/[0.06] border-black/[0.06] flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => onOpenDossier(spotlight.reference, spotlight.title)}
                  className="text-xs font-mono uppercase tracking-wider text-[#C8A97E] dark:hover:text-white hover:text-black flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Dossier Foncier &amp; Plans</span>
                </button>

                <div className="flex items-center gap-3">
                  <a
                    href={getWhatsAppLink(
                      '2250788421920',
                      `Bonjour Cabinet Immobilier Abidjan, je souhaite convenir d'une visite privée pour "${spotlight.title}" (${spotlight.reference}) à ${spotlight.district}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md transform hover:scale-102"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#9E7431]" />
                    <span>Visiter</span>
                  </a>

                  <Link
                    href={`/biens/${spotlight.id}`}
                    className="px-5 py-2.5 rounded-full dark:bg-white/10 dark:hover:bg-white dark:hover:text-[#0A0908] bg-black/5 hover:bg-black hover:text-white dark:text-white text-black text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span>Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </article>
          </TiltCard>
        )}

        {/* 2. LES AUTRES DEMEURES (2 Colonnes Aérées) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {others.map((prop, idx) => (
            <Reveal key={prop.id} delay={(idx % 2) * 0.12}>
            <TiltCard tiltStrength={5} className="rounded-3xl">
              <article className="group relative rounded-3xl overflow-hidden dark:bg-[#121110] bg-white border dark:border-white/[0.08] border-black/[0.08] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] shadow-[0_15px_40px_rgba(0,0,0,0.06)] flex flex-col justify-between h-full">
                
                {/* Photographie Panoramique */}
                <Link href={`/biens/${prop.id}`} className="block relative aspect-[16/10] overflow-hidden bg-black">
                  <Parallax strength={8}>
                    <Image
                      src={prop.images[0]}
                      alt={prop.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-100"
                    />
                  </Parallax>

                  {/* Gradient en pied d'image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-85" />

                  {/* Badges Flottants */}
                  <div className="absolute top-5 left-5 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-[11px] font-mono uppercase text-[#C8A97E]">
                      {prop.district}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/20 text-[10px] font-mono text-white/90 backdrop-blur-xl">
                      Titre {prop.legal_status}
                    </span>
                  </div>

                  {/* Loyer en Surimpression */}
                  <div className="absolute bottom-4 left-5 text-white">
                    <div className="text-xl sm:text-2xl font-display font-medium text-white">
                      {formatFCFA(prop.price)}
                      <span className="text-xs text-white/60 font-sans font-light"> / mois</span>
                    </div>
                  </div>
                </Link>

                {/* Contenu Sobre & Spécifications */}
                <div className="p-6 space-y-4">
                  <Link href={`/biens/${prop.id}`} className="block">
                    <h3 className="text-xl font-display font-medium dark:text-white text-[#141210] group-hover:text-[#C8A97E] transition-colors leading-snug">
                      {prop.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-6 py-2.5 border-y dark:border-white/[0.08] border-black/[0.08] text-xs dark:text-white/80 text-black/80 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#C8A97E]" />
                      <span>{prop.surface} m²</span>
                    </div>
                    {prop.bedrooms > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-[#C8A97E]" />
                        <span>{prop.bedrooms} suites</span>
                      </div>
                    )}
                    {prop.has_pool && (
                      <div className="flex items-center gap-1.5">
                        <Waves className="w-3.5 h-3.5 text-[#C8A97E]" />
                        <span>Piscine</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Rapides */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenDossier(prop.reference, prop.title)}
                      className="text-xs font-mono uppercase tracking-wider text-[#C8A97E] dark:hover:text-white hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Dossier Technique</span>
                    </button>

                    <a
                      href={getWhatsAppLink(
                        '2250788421920',
                        `Bonjour, je souhaite convenir d'une visite privée pour "${prop.title}" (${prop.reference}) à ${prop.district}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF8F5] hover:bg-[#191715] hover:text-white text-[#191715] border border-[#EAE5DC] text-xs font-semibold transition-all duration-300"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Visiter</span>
                    </a>
                  </div>
                </div>

              </article>
            </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* Bouton vers toutes les résidences */}
        <div className="text-center pt-8">
          <Link
            href="/biens"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full border dark:border-white/20 dark:hover:border-white border-black/20 hover:border-black text-xs uppercase tracking-wider font-mono dark:text-white text-black transition-all hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span>Accéder aux {properties.length} Mandats du Portefeuille</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

    </section>
  );
}
