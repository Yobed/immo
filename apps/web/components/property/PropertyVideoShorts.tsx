"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Heart, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Share2,
  ExternalLink,
  Gem,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui';

interface PropertyVideo {
  id: string;
  url: string;
  title: string;
  price: string;
  location: string;
  propertyId: string;
}

interface PropertyVideoShortsProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideos?: PropertyVideo[];
}

// Vidéos de démonstration premium (au format vertical)
const FALLBACK_VIDEOS: PropertyVideo[] = [
  {
    id: '1',
    url: 'https://cdn.pixabay.com/vimeo/345591343/house-23743.mp4?width=1280&hash=8504f7a552e6d6342a3cf784d12b1d3d6e5a6a3b',
    title: 'Villa Sapphire Excellence',
    price: '2.5M FCFA / mois',
    location: 'Marcory Zone 4, Abidjan',
    propertyId: '1'
  },
  {
    id: '2',
    url: 'https://cdn.pixabay.com/video/2017/11/02/12716-241517411_tiny.mp4',
    title: 'Penthouse Skyline Vista',
    price: '3.8M FCFA / mois',
    location: 'Cocody Ambassades',
    propertyId: '2'
  }
];

export const PropertyVideoShorts: React.FC<PropertyVideoShortsProps> = ({ 
  isOpen, 
  onClose,
  initialVideos = FALLBACK_VIDEOS
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showStory, setShowStory] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Social proof généré dynamiquement
  const [stats] = useState({
    likes: Math.floor(Math.random() * 5000) + 1200,
    comments: Math.floor(Math.random() * 500) + 40,
    shares: Math.floor(Math.random() * 200) + 12
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset progress when opening
      setProgress(0);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const p = (video.currentTime / video.duration) * 100;
      setProgress(p);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [currentIndex, isOpen]);

  const handleNext = () => {
    if (currentIndex < initialVideos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const currentVideo = initialVideos[currentIndex];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      >
        {/* Mobile-centric Video Player (TikTok Style) */}
        <div className="relative w-full max-w-[430px] h-[100dvh] sm:h-[90vh] sm:rounded-[30px] overflow-hidden bg-[var(--midnight)] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
          
          {/* Main Video */}
          <video
            ref={videoRef}
            src={currentVideo.url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
          />

          {/* Overlays - Top Bar */}
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-luxury)] bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Gem className="w-5 h-5 text-[var(--accent-luxury)]" />
              </div>
              <div className="text-white">
                <p className="text-[10px] uppercase tracking-widest font-bold">Deep Estate</p>
                <p className="text-xs font-medium text-[var(--accent-luxury)]">Visite Privée</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Overlays - Side Actions */}
          <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-20">
            <div className="flex flex-col items-center gap-1 group">
               <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xl mb-2">
                  <Image src="https://i.pravatar.cc/100?u=proprietaire" alt="L'Agent" fill className="object-cover" sizes="40px" />
               </div>
               <div className="w-5 h-5 rounded-full bg-[var(--accent-luxury)] flex items-center justify-center -mt-5 z-10">
                  <span className="text-[10px] text-white font-bold">+</span>
               </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.8 }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center text-white group-hover:text-red-500 transition-colors">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <span className="text-[10px] font-bold text-white shadow-sm">{stats.likes > 1000 ? (stats.likes / 1000).toFixed(1) + 'k' : stats.likes}</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.8 }}
              onClick={() => setShowStory(!showStory)}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`w-12 h-12 rounded-full backdrop-blur-lg flex items-center justify-center text-white transition-all ${showStory ? 'bg-[var(--accent-luxury)] text-black' : 'bg-white/10'}`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-white shadow-sm">IA Story</span>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.8 }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center text-white group-hover:text-blue-400 transition-colors">
                <Share2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-white shadow-sm">{stats.shares}</span>
            </motion.button>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center text-white"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>

          {/* Overlays - Bottom Info */}
          <div className="absolute bottom-0 left-0 w-full p-8 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
             <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--accent-luxury)]">
                   <MapPin className="w-4 h-4" />
                   <span className="text-sm font-medium tracking-wide font-sans">{currentVideo.location}</span>
                </div>
                <div>
                   <h3 className="text-2xl font-display font-medium text-white mb-1">{currentVideo.title}</h3>
                   <p className="text-xl font-display font-bold text-[var(--accent-luxury)]">{currentVideo.price}</p>
                </div>
                
                <Link 
                  href={`/biens/${currentVideo.propertyId}`}
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[var(--midnight)] rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[var(--accent-luxury)] transition-all group"
                >
                  Voir les détails <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
             </div>
          </div>

          {/* Navigation Controls Overlay */}
          <div className="absolute inset-0 flex flex-col pointer-events-none">
            <div className={`flex-1 flex items-center justify-center transition-opacity duration-300 ${!isPlaying ? 'opacity-100' : 'opacity-0'}`}>
               <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl">
                 <Play className="w-10 h-10 text-white fill-current" />
               </div>
            </div>
            
            <div className="h-full w-full absolute inset-0 flex flex-col justify-between p-4">
               {currentIndex > 0 && (
                 <button 
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="pointer-events-auto self-center w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/50 hover:text-white transition-all transform -translate-y-4 group"
                 >
                   <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                 </button>
               )}
               {currentIndex < initialVideos.length - 1 && (
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="pointer-events-auto self-center w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/50 hover:text-white transition-all transform translate-y-4 group"
                 >
                   <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                 </button>
               )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-30">
            <motion.div 
               className="h-full bg-[var(--accent-luxury)]"
               initial={{ width: "0%" }}
               animate={{ width: `${progress}%` }}
               transition={{ duration: 0.1 }}
            />
          </div>

          <AnimatePresence>
            {showStory && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-x-0 bottom-0 h-[60%] z-50 bg-[#020617]/95 backdrop-blur-2xl rounded-t-[3rem] p-10 border-t border-white/10"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <Badge variant="luxury" className="mb-4">L&apos;Analyse de l&apos;IA</Badge>
                    <h4 className="text-white font-display text-3xl font-bold tracking-tight">Narrative Signature</h4>
                  </div>
                  <button onClick={() => setShowStory(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6 text-white/80 font-sans text-lg leading-relaxed italic">
                  <p>
                    &quot;Un chef-d&apos;œuvre architectural situé à {currentVideo.location}. Cette propriété redéfinit le concept de luxe moderne, fusionnant des lignes épurées avec une chaleur organique inimitable.&quot;
                  </p>
                  <p>
                    &quot;Les espaces de vie baignés de lumière offrent une transition fluide vers des terrasses privées, créant un sanctuaire de sérénité au cœur de la ville.&quot;
                  </p>
                </div>

                <div className="mt-12 flex gap-4">
                  <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Potentiel locatif</p>
                    <p className="text-xl font-bold text-[var(--accent-luxury)]">Exceptionnel</p>
                  </div>
                  <div className="flex-1 p-5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Score de Rareté</p>
                    <p className="text-xl font-bold text-[var(--accent-luxury)]">9.8/10</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
