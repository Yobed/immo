'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Shield, Compass, Check } from 'lucide-react';

const MATERIALS = [
  {
    title: 'Travertin Romain Adouci',
    category: 'Sols & Plages de Piscine',
    description: 'Pierre naturelle athermique taillée en grand format, assurant confort pieds nus et durabilité sous le climat d\'Abidjan.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85',
    span: 'col-span-1 md:col-span-2 row-span-2',
    aspect: 'h-80 sm:h-96',
  },
  {
    title: 'Iroko Massif Huilé & Bruni',
    category: 'Menuiseries & Bardages',
    description: 'Essence ivoirienne noble imputrescible travaillée par des maîtres ébénistes certifiés.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=85',
    span: 'col-span-1',
    aspect: 'h-44 sm:h-48',
  },
  {
    title: 'Marbre Blanc de Carrare Veiné',
    category: 'Îlots de Cuisine & Salles de Bains',
    description: 'Tranches monolithiques sélectionnées en carrière pour les pièces d\'eau et plans de travail.',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=85',
    span: 'col-span-1',
    aspect: 'h-44 sm:h-48',
  },
  {
    title: 'Baies Vitrées Thermo-Acoustiques',
    category: 'Enveloppe & Confort Climatique',
    description: 'Double vitrage feuilleté à rupture de pont thermique pour une isolation phonique absolue et une maîtrise thermique optimale.',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=85',
    span: 'col-span-1 md:col-span-2',
    aspect: 'h-52 sm:h-56',
  },
  {
    title: 'Laiton Champagne Brossé',
    category: 'Quincaillerie & Robinetterie',
    description: 'Accents métalliques sur-mesure résistant à l\'oxydation marine pour un rendu tactile raffiné.',
    image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=85',
    span: 'col-span-1',
    aspect: 'h-52 sm:h-56',
  },
  {
    title: 'Végétalisation Endémique & Patios',
    category: 'Aménagement Paysager',
    description: 'Palmiers royaux, strelitzias et essences tropicales créant une intimité naturelle sans vis-à-vis.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=85',
    span: 'col-span-1',
    aspect: 'h-52 sm:h-56',
  },
];

export default function ArtisanalMaterialsGrid() {
  return (
    <section className="relative w-full py-24 sm:py-32 bg-[#14110F] text-[#F5F2EB] font-sans overflow-hidden border-b border-white/10">
      
      {/* Halo lumineux bronze discret */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#947346]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 space-y-14">
        
        {/* En-tête de section éditorial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C8A97E] block">
              Standards de Finition • Noblesse des Matériaux
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-white tracking-tight leading-[1.08]">
              L&apos;Alliance de la Matière <br />
              <span className="italic font-normal text-[#C8A97E]">et du Savoir-Faire Architectural.</span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-white/70 max-w-md font-light leading-relaxed">
            Chaque résidence fait l&apos;objet d&apos;un audit technique exhaustif : résistance des matériaux au climat côtier d&apos;Abidjan, équipements électromécaniques et acoustique.
          </p>
        </div>

        {/* Grille Masonry Éditoriale des Matériaux (Exact Image 4) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          {MATERIALS.map((mat, idx) => (
            <div
              key={idx}
              className={`group relative rounded-3xl overflow-hidden border border-white/10 bg-[#1c1815] shadow-xl ${mat.span} ${mat.aspect} flex flex-col justify-end p-5 sm:p-6 transition-all duration-500 hover:border-[#C8A97E]/60`}
            >
              <Image
                src={mat.image}
                alt={mat.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover brightness-[0.75] group-hover:scale-105 group-hover:brightness-[0.85] transition-all duration-700 ease-out"
              />

              {/* Voile d'ombrage progressif */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#14110F] via-black/30 to-transparent pointer-events-none" />

              {/* Contenu textuel incrusté */}
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C8A97E]">
                  {mat.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#C8A97E] transition-colors">
                  {mat.title}
                </h3>
                <p className="text-xs text-white/80 font-light line-clamp-2 leading-relaxed">
                  {mat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bandeau d'Assurance Technique & Conformité */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[#C8A97E]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Audit d&apos;Huissier Contradictoire</span>
              <span className="text-white/60 font-light text-[11px]">État des lieux d&apos;entrée et de sortie sur support numérique horodaté.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[#C8A97E]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Groupe Électrogène Insonorisé</span>
              <span className="text-white/60 font-light text-[11px]">Capacité 40 à 250 kVA avec inverseur automatique sur chaque résidence.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[#C8A97E]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Séquestre Notarié Garanti</span>
              <span className="text-white/60 font-light text-[11px]">Cautionnement bloqué en étude notariale partenaire avec restitution sous 15 jours.</span>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}
