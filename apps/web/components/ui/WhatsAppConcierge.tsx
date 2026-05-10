"use client";

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Image from 'next/image';

/**
 * WhatsAppConcierge
 * Bouton flottant premium pour le support VIP et la conciergerie.
 * Intègre un comportement "smart scroll" et une animation de flottaison.
 */
export const WhatsAppConcierge = () => {
  const WHATSAPP_NUMBER = "2250544872051";
  const MESSAGE = encodeURIComponent("Bonjour BOGBE'S GROUPE, je souhaiterais obtenir des informations sur un bien immobilier.");

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    // On cache le bouton si on descend (lecture) et qu'on a dépassé 150px
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.div 
      variants={{
        visible: { y: 0, opacity: 1, scale: 1 },
        hidden: { y: 80, opacity: 0, scale: 0.8 } // S'efface vers le bas
      }}
      initial="visible"
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed bottom-[6.5rem] right-4 md:bottom-8 md:right-8 z-[110] group"
    >
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
        <div className="bg-[var(--midnight)]/90 backdrop-blur-xl border border-emerald-500/20 px-4 py-2 rounded-2xl shadow-2xl text-xs font-bold text-emerald-400 whitespace-nowrap uppercase tracking-widest">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Sapphire WhatsApp
          </span>
        </div>
      </div>

      {/* Button avec effet de flottaison continu */}
      <motion.a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        animate={{ y: [0, -8, 0] }}
        transition={{ 
          y: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
        }}
        whileHover={{ 
          scale: 1.1, 
          rotate: [0, -5, 5, 0],
          boxShadow: '0 20px 40px -12px rgba(16, 185, 129, 0.4)'
        }}
        whileTap={{ scale: 0.9 }}
        className="flex items-center justify-center w-16 h-16 bg-transparent border-0 rounded-2xl shadow-2xl relative overflow-hidden group/btn"
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
        
        <Image 
          src="/whatsapp-icon.svg" 
          alt="WhatsApp" 
          width={48}
          height={48}
          className="object-contain group-hover:scale-110 transition-transform duration-500" 
        />
      </motion.a>
      
      {/* Pulse effect */}
      <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-10 pointer-events-none" />
    </motion.div>
  );
};
