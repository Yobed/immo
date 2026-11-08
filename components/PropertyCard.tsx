'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bed, Bath, Maximize2, ShieldCheck, MapPin, ArrowUpRight, 
  Star, Heart, ChevronLeft, ChevronRight, Zap, Sparkles 
} from 'lucide-react';
import { Property } from '@/lib/types';
import { formatFCFA } from '@/lib/utils';
import TiltCard from './TiltCard';

interface PropertyCardProps {
  property: Property;
  compact?: boolean;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'];

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <TiltCard tiltStrength={4} className="h-full">
      <article className="group h-full bg-white rounded-3xl overflow-hidden border border-[#e8e4dc] hover:border-slate-900 shadow-warm-xs hover:shadow-warm-md transition-all duration-500 flex flex-col justify-between font-sans">

        {/* Cadre Photographique avec Slider Airbnb */}
        <div className="relative aspect-[16/11] overflow-hidden bg-slate-900">
          <Link href={`/biens/${property.id}`} className="block w-full h-full">
            <Image
              src={images[photoIndex]}
              alt={property.title}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-103 transition-transform duration-700 ease-out brightness-95 group-hover:brightness-100"
            />
          </Link>

          {/* Slider Chevrons (Appear on hover) */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 cursor-pointer"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextPhoto}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 cursor-pointer"
                aria-label="Photo suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Top Badges (Airbnb Style + Live Concierge) */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 shadow-2xs">
              {property.operation === 'rent' ? 'Location' : 'Vente'}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50/95 backdrop-blur-md text-emerald-800 border border-emerald-200/60 shadow-2xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{property.legal_status}</span>
            </span>
            {property.status === 'cleaning' || property.concierge_status === 'cleaning' ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-md text-white border border-amber-300 shadow-2xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Nettoyage</span>
              </span>
            ) : property.status === 'reserved' || property.concierge_status === 'reserved' ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-700/90 backdrop-blur-md text-white border border-purple-300 shadow-2xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Réservé</span>
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-700/90 backdrop-blur-md text-white border border-emerald-300 shadow-2xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Disponible</span>
              </span>
            )}
          </div>

          {/* Heart Button */}
          <button
            onClick={handleLike}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all z-10 cursor-pointer"
            aria-label="Enregistrer dans les favoris"
          >
            <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white'}`} />
          </button>

          {/* Slider Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 z-10">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    photoIndex === idx ? 'bg-white w-3' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Contenu Éditorial Inspiré Airbnb */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
          <div className="space-y-1.5">
            
            {/* Location & Rating Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 truncate">
                {property.district}, Abidjan
              </span>
              <div className="flex items-center gap-1 shrink-0 font-bold text-slate-900">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>4.98</span>
              </div>
            </div>

            {/* Titre */}
            <Link href={`/biens/${property.id}`} className="block group-hover:text-[#947346] transition-colors">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 leading-snug">
                {property.title}
              </h3>
            </Link>

            {/* Key highlights line */}
            <p className="text-[11px] text-slate-500 truncate font-normal">
              {property.has_generator ? 'Groupe auto insonorisé' : 'Résidence sécurisée'} • {property.surface} m² • {property.bedrooms} ch. • {property.has_pool ? 'Piscine privée' : 'Standing'}
            </p>

            {/* Prix Mensuel (Airbnb format) */}
            <div className="pt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-sans font-bold text-slate-900">
                {formatFCFA(property.price)}
              </span>
              <span className="text-xs font-normal text-slate-500">
                {property.operation === 'rent' ? '/ mois' : ''}
              </span>
            </div>

          </div>

          {/* Footer Card Actions */}
          <div className="pt-3 border-t border-[#f0ede6] flex items-center justify-between text-xs">
            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              Visite possible cette semaine
            </span>

            <Link
              href={`/biens/${property.id}`}
              className="inline-flex items-center gap-1 text-slate-900 hover:text-[#947346] font-bold text-xs transition-colors"
            >
              <span>Fiche</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </article>
    </TiltCard>
  );
}
