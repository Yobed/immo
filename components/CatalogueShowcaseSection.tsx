'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Download, Sparkles, ArrowRight, Hand, FileText, Share2 } from 'lucide-react';
import TiltCard from '@/components/TiltCard';
import CatalogueShareModal from '@/components/CatalogueShareModal';

export default function CatalogueShowcaseSection() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <section className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto border-t dark:border-white/[0.08] border-black/[0.08] select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Colonne Gauche : Argumentaire Éditorial Ciselé */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest uppercase dark:text-[#C8A97E] text-[#947346] flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Édition Reliée &amp; Numérique 2026</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-medium dark:text-white text-[#141210] tracking-tight leading-tight">
              Le Catalogue d&apos;Exception.
            </h2>
          </div>

          <p className="text-sm sm:text-base dark:text-[#A39C92] text-[#6B655D] font-light leading-relaxed">
            Feuilletez notre ouvrage annuel comme un livre d&apos;art physique. Pages tactiles avec bruitage réaliste de papier de soie, plans d&apos;architecte CAD et certifications foncières ACD.
          </p>

          {/* Micro-atouts */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-y dark:border-white/[0.08] border-black/[0.08] py-4 text-xs font-mono dark:text-white/80 text-[#141210]/80">
            <div className="space-y-1">
              <span className="dark:text-[#C8A97E] text-[#947346] font-semibold">Feuilletage 3D</span>
              <p className="text-[11px] dark:text-white/50 text-[#6B655D] font-sans">Effet de pliure et toucher réaliste</p>
            </div>
            <div className="space-y-1">
              <span className="dark:text-[#C8A97E] text-[#947346] font-semibold">Hotspots Vidéo</span>
              <p className="text-[11px] dark:text-white/50 text-[#6B655D] font-sans">Survols drone intégrés dans le papier</p>
            </div>
          </div>

          {/* Boutons d'Action */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/catalogue"
              className="px-7 py-4 rounded-full dark:bg-white dark:hover:bg-[#C8A97E] dark:text-[#0A0908] bg-[#141210] hover:bg-[#947346] text-white text-xs font-bold flex items-center gap-2.5 shadow-[0_15px_35px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_35px_rgba(200,169,126,0.35)] transition-all transform hover:scale-102 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Ouvrir le Catalogue Virtuel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="px-6 py-4 rounded-full dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/20 bg-black/5 hover:bg-black/10 text-[#141210] border border-black/10 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              title="Partager le catalogue (QR Code, WhatsApp, Mobile)"
            >
              <Share2 className="w-4 h-4 dark:text-[#C8A97E] text-[#947346]" />
              <span>Partager sur Mobile / QR</span>
            </button>

            <a
              href="/brochures/CATALOGUE-PRESTIGE-ABIDJAN-2026.pdf"
              download="Catalogue-Prestige-Abidjan-2026.pdf"
              className="px-6 py-4 rounded-full dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10 bg-black/5 hover:bg-black/10 text-[#141210] border-black/10 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 dark:text-[#C8A97E] text-[#947346]" />
              <span>Télécharger PDF</span>
            </a>
          </div>
        </div>

        {/* Colonne Droite : Le Livre 3D en Vedette avec TiltCard */}
        <div className="lg:col-span-7 flex justify-center">
          <TiltCard tiltStrength={8} className="max-w-md w-full">
            <Link 
              href="/catalogue"
              className="group block relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-[#1C1A17] via-[#121110] to-[#0A0908] border border-[#C8A97E]/30 dark:shadow-[0_40px_100px_rgba(0,0,0,0.95)] shadow-[0_30px_70px_rgba(20,18,16,0.18)] p-8 sm:p-10 flex flex-col justify-between"
            >
              {/* Reflet Spéculaire & Reliure Dorée */}
              <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-black/80 via-white/5 to-transparent border-r border-[#C8A97E]/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(200,169,126,0.12)_0%,_transparent_65%)] pointer-events-none" />

              {/* Haut de Couverture */}
              <div className="space-y-4 pl-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#0A0908] flex items-center justify-center font-display font-bold text-base shadow-lg">
                    A
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C8A97E]">
                    Édition 2026
                  </span>
                </div>

                <div className="pt-8 space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-white/50 block">
                    Portefeuille Privé
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight leading-tight group-hover:text-[#C8A97E] transition-colors">
                    Catalogue Prestige Abidjan
                  </h3>
                </div>
              </div>

              {/* Centre : Image Monographique Intégrée */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl my-4 ml-4">
                <Image
                  src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=85"
                  alt="Catalogue Couverture"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 text-[11px] font-mono text-white/80">
                  Cocody • Zone 4 • Assinie
                </div>
              </div>

              {/* Bas de Couverture */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 pl-4 relative z-10">
                <div className="flex items-center gap-2 text-xs font-mono text-white/60">
                  <Hand className="w-3.5 h-3.5 text-[#C8A97E]" />
                  <span>Feuilleter en ligne</span>
                </div>

                <span className="text-xs font-mono text-[#C8A97E] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                  <span>Explorer</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>

            </Link>
          </TiltCard>
        </div>

      </div>

      {/* MODAL DE PARTAGE EXTERNE (QR CODE, LIEN MOBILE, WHATSAPP) */}
      <CatalogueShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

    </section>
  );
}
