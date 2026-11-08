'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TiltCard from '@/components/TiltCard';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { PropertyOperation, PropertyType } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { 
  Search, RotateCcw, MessageCircle, ShieldCheck, 
  Maximize2, Bed, Waves, ArrowRight, Sparkles 
} from 'lucide-react';

function CatalogContent() {
  const searchParams = useSearchParams();

  const initialOperation = searchParams.get('operation') as PropertyOperation | null;
  const initialType = searchParams.get('type') as PropertyType | null;
  const initialDistrict = searchParams.get('district') || '';

  const [type, setType] = useState<string>(initialType || 'all');
  const [district, setDistrict] = useState<string>(initialDistrict || 'all');
  const [filterPool, setFilterPool] = useState<boolean>(false);

  const { properties } = useLiveProperties();

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (type !== 'all' && prop.property_type !== type) return false;
      if (district !== 'all' && !prop.district.toLowerCase().includes(district.toLowerCase())) return false;
      if (filterPool && !prop.has_pool) return false;
      return true;
    });
  }, [properties, type, district, filterPool]);

  const handleReset = () => {
    setType('all');
    setDistrict('all');
    setFilterPool(false);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen dark:bg-[#0A0908] bg-[#FAF8F5] dark:text-[#F5F2EB] text-[#141210] font-sans selection:bg-[#C8A97E] selection:text-[#0A0908] pt-24 pb-28 transition-colors duration-300">
        
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-12">
          
          {/* En-tête Monographique */}
          <div className="space-y-4 max-w-3xl pt-4">
            <span className="text-[11px] font-mono tracking-widest uppercase dark:text-[#C8A97E] text-[#947346]">
              Portefeuille Immobilier • Abidjan
            </span>
            <h1 className="text-4xl sm:text-6xl font-display font-medium dark:text-white text-[#141210] tracking-tight leading-tight">
              Résidences d&apos;Exception
            </h1>
            <p className="text-sm sm:text-base dark:text-[#A39C92] text-[#6B655D] font-light leading-relaxed">
              Villas contemporaines, penthouses panoramiques et domaines balnéaires vérifiés au Livre Foncier.
            </p>
          </div>

          {/* Barre de Filtres Flottante en Verre Fumé */}
          <div className="p-4 sm:p-5 rounded-3xl dark:bg-[#121110] bg-white border dark:border-white/[0.08] border-black/[0.08] dark:shadow-[0_20px_60px_rgba(0,0,0,0.85)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Filtres de Type */}
              <button
                type="button"
                onClick={() => setType('all')}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  type === 'all'
                    ? 'dark:bg-[#C8A97E] dark:text-[#0A0908] bg-[#141210] text-white font-bold shadow-md'
                    : 'dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
                }`}
              >
                Toutes ({INITIAL_PROPERTIES.length})
              </button>

              <button
                type="button"
                onClick={() => setType('villa')}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  type === 'villa'
                    ? 'dark:bg-[#C8A97E] dark:text-[#0A0908] bg-[#141210] text-white font-bold shadow-md'
                    : 'dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
                }`}
              >
                Villas
              </button>

              <button
                type="button"
                onClick={() => setType('penthouse')}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                  type === 'penthouse'
                    ? 'dark:bg-[#C8A97E] dark:text-[#0A0908] bg-[#141210] text-white font-bold shadow-md'
                    : 'dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
                }`}
              >
                Penthouses
              </button>

              {/* Filtre Piscine */}
              <button
                type="button"
                onClick={() => setFilterPool(!filterPool)}
                className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterPool
                    ? 'dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40 bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-sm'
                    : 'dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white bg-black/5 text-black/70 hover:bg-black/10 hover:text-black'
                }`}
              >
                <Waves className="w-3 h-3" />
                <span>Piscine</span>
              </button>
            </div>

            {/* Compteur & Réinitialisation */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono dark:text-white/50 text-[#6B655D]">
                {filteredProperties.length} bien(s) disponible(s)
              </span>

              {(type !== 'all' || district !== 'all' || filterPool) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 rounded-full dark:hover:bg-white/10 dark:text-white/50 dark:hover:text-white hover:bg-black/10 text-black/50 hover:text-black transition-colors"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Grille Panoramique de Demeures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {filteredProperties.map((prop) => (
              <TiltCard key={prop.id} tiltStrength={5} className="rounded-3xl">
                <article className="group relative rounded-3xl overflow-hidden dark:bg-[#121110] bg-white border dark:border-white/[0.08] border-black/[0.08] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] shadow-[0_15px_40px_rgba(0,0,0,0.06)] flex flex-col justify-between h-full">
                  
                  {/* Photo Widescreen */}
                  <Link href={`/biens/${prop.id}`} className="block relative aspect-[16/10] overflow-hidden bg-black">
                    <Image
                      src={prop.images[0]}
                      alt={prop.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-100"
                    />

                    {/* Gradient doux */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-85" />

                    {/* Badges Flottants */}
                    <div className="absolute top-5 left-5 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-[11px] font-mono uppercase text-[#C8A97E]">
                        {prop.district}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 backdrop-blur-xl">
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

                  {/* Détails Épurés */}
                  <div className="p-6 space-y-4">
                    <Link href={`/biens/${prop.id}`} className="block">
                      <h3 className="text-xl font-display font-medium dark:text-white text-[#141210] group-hover:text-[#C8A97E] transition-colors leading-snug">
                        {prop.title}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-6 py-2.5 border-y dark:border-white/[0.08] border-black/[0.08] text-xs dark:text-white/80 text-[#141210]/80 font-mono">
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
                      <a
                        href={getWhatsAppLink(
                          '2250788421920',
                          `Bonjour Cabinet Immobilier Abidjan, je souhaite organiser une visite privée pour "${prop.title}" (${prop.reference}) à ${prop.district}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-xs font-bold text-white transition-all shadow-md"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>Visiter sur WhatsApp</span>
                      </a>

                      <Link
                        href={`/biens/${prop.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full dark:bg-white/10 dark:hover:bg-white dark:hover:text-[#0A0908] dark:text-white bg-black/5 hover:bg-black hover:text-white text-[#141210] text-xs font-semibold transition-all duration-300"
                      >
                        <span>Détails</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                  </div>

                </article>
              </TiltCard>
            ))}
          </div>

        </div>

      </main>

      <Footer />
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0908] flex items-center justify-center text-white font-mono text-xs">Chargement...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
