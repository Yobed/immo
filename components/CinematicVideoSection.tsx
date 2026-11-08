'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Pause, Compass, Video, MessageCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

interface VideoChapter {
  id: string;
  title: string;
  district: string;
  duration: string;
  thumbnail: string;
  videoEmbedUrl?: string;
}

const VIDEO_CHAPTERS: VideoChapter[] = [
  {
    id: 'chap-1',
    title: 'Survol Drone Baie & Villa Riviera 4',
    district: 'Cocody Riviera Golf',
    duration: '01:45',
    thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=90',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/L_LUpnjgPso?autoplay=1&mute=1&loop=1&playlist=L_LUpnjgPso&controls=0&modestbranding=1&rel=0',
  },
  {
    id: 'chap-2',
    title: 'Échappée Balnéaire & Ponton Privé',
    district: 'Assinie-Mafia PK 9',
    duration: '02:10',
    thumbnail: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=90',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/Xn7KWR9EOGQ?autoplay=1&mute=1&loop=1&playlist=Xn7KWR9EOGQ&controls=0&modestbranding=1&rel=0',
  },
  {
    id: 'chap-3',
    title: 'Travelling Intérieur & Volumes Panoramiques',
    district: 'Marcory Zone 4',
    duration: '01:30',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=90',
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/K4TOrB7at0Y?autoplay=1&mute=1&loop=1&playlist=K4TOrB7at0Y&controls=0&modestbranding=1&rel=0',
  },
];

export default function CinematicVideoSection() {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const activeChapter = VIDEO_CHAPTERS[activeChapterIndex];

  const whatsappPrivateTourUrl = getWhatsAppLink(
    '2250788421920',
    `Bonjour Cabinet Immobilier Abidjan, je viens de visionner le film drone [${activeChapter.title} - ${activeChapter.district}]. Je souhaite convenir d'une visite privée.`
  );

  return (
    <section className="dark:bg-[#0B0A09] bg-[#FAF8F5] dark:text-white text-[#141210] py-20 sm:py-28 relative overflow-hidden border-b dark:border-white/10 border-black/[0.08] select-none transition-colors duration-300">
      
      {/* Halo d'ambiance doré subtil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#C8A97E]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-8 relative z-10">
        
        {/* En-tête Épuré (Zéro blabla) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest dark:text-[#C8A97E] text-[#947346]">
              <Video className="w-3.5 h-3.5" />
              <span>Immersion Vidéo 4K Drone</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium dark:text-white text-[#141210] tracking-tight">
              Les Demeures en Mouvement.
            </h2>
          </div>

          {/* Sélecteur de Chapitres Fluide */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {VIDEO_CHAPTERS.map((chap, idx) => (
              <button
                key={chap.id}
                type="button"
                onClick={() => setActiveChapterIndex(idx)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeChapterIndex === idx
                    ? 'bg-[#C8A97E] text-[#0E0D0C] font-bold border-[#C8A97E] shadow-lg'
                    : 'dark:bg-white/5 dark:text-white/70 dark:border-white/10 dark:hover:bg-white/10 bg-black/5 text-black/70 border-black/10 hover:bg-black/10'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">0{idx + 1}</span>
                <span>{chap.district.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CADRE CINÉMASCOPE DU LECTEUR VIDÉO */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden border border-white/15 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.85)] group">
          
          {/* Iframe vidéo en boucle ou image de couverture */}
          {isPlaying && activeChapter.videoEmbedUrl ? (
            <iframe
              src={activeChapter.videoEmbedUrl}
              title={activeChapter.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-105"
            />
          ) : (
            <Image
              src={activeChapter.thumbnail}
              alt={activeChapter.title}
              fill
              unoptimized
              className="object-cover brightness-75 scale-102 transition-transform duration-700"
            />
          )}

          {/* Dégradé doux en pied de lecteur */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

          {/* Indicateur d'enregistrement 4K minimaliste */}
          <div className="absolute top-5 left-6 flex items-center gap-2 pointer-events-none z-20 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold text-white tracking-wider">4K CINEMA • 60 FPS</span>
          </div>

          {/* Barre de contrôle inférieure */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 z-20">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#C8A97E]">
                {activeChapter.district} • {activeChapter.duration}
              </span>
              <h3 className="text-lg sm:text-2xl font-display font-medium text-white tracking-tight">
                {activeChapter.title}
              </h3>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-white text-[#0E0D0C] hover:bg-[#C8A97E] text-xs font-bold flex items-center justify-center transition-all shadow-md cursor-pointer"
                title={isPlaying ? 'Mettre en pause' : 'Lire la vidéo'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <a
                href={whatsappPrivateTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold transition-all shadow-md"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>Planifier la Visite</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
