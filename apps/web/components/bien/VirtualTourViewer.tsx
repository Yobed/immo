"use client";

import { motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { useState } from "react";

interface VirtualTourViewerProps {
  url: string;
  title: string;
}

export const VirtualTourViewer = ({ url, title }: VirtualTourViewerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Détection du type de lien pour optimiser l'affichage
  const isMatterport = url.includes("matterport.com");
  const isKuula = url.includes("kuula.co");
  
  // Nettoyage de l'URL si nécessaire (ajout de flags autoplay/share etc.)
  let finalUrl = url;
  if (isMatterport && !url.includes("play=1")) {
    finalUrl += (url.includes("?") ? "&" : "?") + "play=1&qs=1&brand=0&background=020617";
  }

  return (
    <div className="relative">
      {/* Trigger Button / Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/10 bg-[var(--midnight-muted)] aspect-video"
        onClick={() => setIsOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-luxury/20 to-transparent z-10 opacity-60 group-hover:opacity-100 transition-opacity" />
        
        {/* Background Animation */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 1, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40 grayscale"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200')" }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-8">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--accent-luxury)] group-hover:text-[var(--midnight)] transition-all duration-700">
            <Maximize2 className="w-8 h-8" />
          </div>
          <h4 className="font-display text-4xl font-bold text-white mb-2 tracking-tight">Immersion 3D</h4>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/50">Explorer chaque détail en haute définition</p>
        </div>
        
        {/* Decorative corner tag */}
        <div className="absolute top-8 right-8 z-20 px-4 py-2 bg-secondary text-[var(--midnight)] rounded-full text-[9px] font-bold uppercase tracking-widest shadow-xl">
            Live 3D
        </div>
      </motion.div>

      {/* Modal Iframe */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/95 backdrop-blur-2xl p-4 md:p-12"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full h-full max-w-7xl bg-black rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(var(--accent-luxury-rgb),0.2)] border border-white/10"
          >
            <div className="absolute top-8 right-8 z-[1010] flex gap-4">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
            </div>

            <div className="absolute top-8 left-10 z-[1010] hidden md:block">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 mb-2">Visite Virtuelle</p>
                <h3 className="font-display text-2xl font-bold text-white tracking-tight">{title}</h3>
            </div>

            <iframe
              src={finalUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="xr-spatial-tracking; gyroscope; accelerometer"
            />
          </motion.div>
          
          <div 
            className="absolute inset-0 -z-10 cursor-pointer" 
            onClick={() => setIsOpen(false)} 
          />
        </motion.div>
      )}
    </div>
  );
};
