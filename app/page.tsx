'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCinematic from '@/components/HeroCinematic';
import PanoramicGallery from '@/components/PanoramicGallery';
import LuxuryVilla3D from '@/components/LuxuryVilla3D';
import CatalogueShowcaseSection from '@/components/CatalogueShowcaseSection';
import CinematicVideoSection from '@/components/CinematicVideoSection';
import PrivateConcierge from '@/components/PrivateConcierge';
import DossierRequestModal from '@/components/DossierRequestModal';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { Reveal } from '@/components/Motion';

export default function HomePage() {
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [activeDossierProp, setActiveDossierProp] = useState<{ reference: string; title: string }>({
    reference: 'VIL-RG-2026',
    title: 'Villa Duplex Contemporaine Cocody Riviera Golf',
  });

  const handleOpenDossier = (ref: string, title: string) => {
    setActiveDossierProp({ reference: ref, title });
    setIsDossierModalOpen(true);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#FAF8F5] text-[#191715] font-sans selection:bg-[#9E7431] selection:text-white overflow-x-hidden">
        
        {/* ========================================================================= */}
        {/* 1. HERO CINÉMATIQUE 100VH : PLEIN ÉCRAN, PARALLAXE 3D & IMMERSION TOTALE */}
        {/* ========================================================================= */}
        <HeroCinematic 
          properties={INITIAL_PROPERTIES} 
          onOpenVisitModal={(prop) => handleOpenDossier(prop.reference, prop.title)} 
        />

        {/* ========================================================================= */}
        {/* 2. LA SÉLECTION PRIVÉE : GALERIE PANORAMIQUE & PERSPECTIVE 3D             */}
        {/* ========================================================================= */}
        <PanoramicGallery 
          properties={INITIAL_PROPERTIES}
          onOpenDossier={handleOpenDossier}
        />

        {/* ========================================================================= */}
        {/* 3. L'ÉLÉVATION 3D SPATIALE : MAQUETTE THREE.JS WEBGL EN TEMPS RÉEL        */}
        {/* ========================================================================= */}
        <section id="maquette3d" className="py-24 sm:py-32 px-6 sm:px-10 lg:px-14 max-w-[1440px] mx-auto border-t dark:border-white/[0.08] border-black/[0.08] select-none">
          <div className="space-y-10">
            
            <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b dark:border-white/[0.08] border-black/[0.08]">
              <div className="space-y-2">
                <h2 className="text-4xl sm:text-6xl font-display font-medium dark:text-white text-[#141210] tracking-tight">
                  La Villa sous Toutes ses Ombres
                </h2>
                <p className="text-sm sm:text-base dark:text-[#A39C92] text-[#6B655D] font-light max-w-xl">
                  Faites pivoter la maquette en 3D temps réel, explorez les volumes suspendus et observez les ombres équatoriales de 12h à la nuit.
                </p>
              </div>

              <span className="text-xs font-mono uppercase tracking-wider dark:text-[#C8A97E] text-[#947346]">
                Glisser pour pivoter
              </span>
            </Reveal>

            {/* Maquette 3D WebGL */}
            <Reveal delay={0.1}>
              <LuxuryVilla3D />
            </Reveal>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. LE CATALOGUE NUMÉRIQUE 3D : LE FLIPBOOK D'EXCEPTION 2026              */}
        {/* ========================================================================= */}
        <Reveal>
          <CatalogueShowcaseSection />
        </Reveal>

        {/* ========================================================================= */}
        {/* 5. LE FILM CINÉMATIQUE : SURVOL DRONE 4K & VISITES EN MOUVEMENT           */}
        {/* ========================================================================= */}
        <div id="cinema">
          <CinematicVideoSection />
        </div>

        {/* ========================================================================= */}
        {/* 6. CONCIERGERIE PRIVÉE & LIGNE DIRECTE AVEC LA DIRECTION (ZÉRO FRICTION)  */}
        {/* ========================================================================= */}
        <Reveal>
          <PrivateConcierge />
        </Reveal>

      </main>

      {/* MODAL DE DEMANDE DE DOSSIER FONCIER AUDITÉ */}
      <DossierRequestModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        propertyReference={activeDossierProp.reference}
        propertyTitle={activeDossierProp.title}
      />

      <Footer />
    </>
  );
}
