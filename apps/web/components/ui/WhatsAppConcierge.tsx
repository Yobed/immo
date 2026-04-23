"use client";

import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

/**
 * WhatsAppConcierge
 * Bouton flottant premium pour le support VIP et la conciergerie.
 */
export const WhatsAppConcierge = () => {
  const WHATSAPP_NUMBER = "2250102030405"; // À remplacer par le vrai numéro
  const MESSAGE = encodeURIComponent("Bonjour Élite Immo CI, je souhaiterais obtenir des informations sur une résidence de prestige.");

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
        <div className="bg-[var(--midnight)]/90 backdrop-blur-xl border border-emerald-500/20 px-4 py-2 rounded-2xl shadow-2xl text-xs font-bold text-emerald-400 whitespace-nowrap uppercase tracking-widest">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Sapphire WhatsApp
          </span>
        </div>
      </div>

      {/* Button */}
      <motion.a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
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
        
        <img 
          src="/whatsapp-icon.svg" 
          alt="WhatsApp" 
          className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-500" 
        />
      </motion.a>
      
      {/* Pulse effect */}
      <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-10 pointer-events-none" />
    </div>
  );
};
