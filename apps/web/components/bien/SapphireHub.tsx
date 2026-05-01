'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Play, Sparkles, X, ChevronRight, Zap } from 'lucide-react'
import Image from 'next/image'
import { ShortsTrigger } from './ShortsTrigger'

interface SapphireHubProps {
  bien: any;
  videoMedias: any[];
}

export function SapphireHub({ bien, videoMedias }: SapphireHubProps) {
  const [isOpen, setIsOpen] = useState(false)
  const WHATSAPP_NUMBER = '2250574243752'

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Bonjour Sapphire Intelligence,\n\nJe souhaiterais obtenir des informations exclusives sur le bien suivant :\n\n💎 *${bien.titre}*\n📍 ${bien.commune}\n💰 ${bien.prix_vente_fcfa || bien.prix_mois_fcfa}\n\nCan you please provide more details and high-resolution visuals?\n\nMerci.`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank')
  }

  return (
    <div className="fixed bottom-12 right-12 z-[200] flex flex-col items-end gap-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, rotateX: 20 }}
            className="mb-4 p-8 bg-slate-950/95 backdrop-blur-3xl rounded-[3rem] border border-accent-luxury/40 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] w-[380px] overflow-hidden relative perspective-1000"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] -mr-20 -mt-20 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-luxury/10 blur-[60px] -ml-10 -mb-10" />
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-xl border border-emerald-500/20">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                   <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Marketing 5.0</span>
                   <span className="block text-[8px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Sapphire Connect</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors group"
              >
                <X className="w-4 h-4 text-white/40 group-hover:text-white" />
              </button>
            </div>

            <div className="mb-8">
               <h3 className="text-2xl font-display font-bold text-white mb-2">Sapphire WhatsApp</h3>
               <p className="text-xs text-white/60 leading-relaxed">
                 L'IA Sapphire Intelligence est prête à vous guider dans votre acquisition immobilière.
               </p>
            </div>

            <div className="space-y-4">
              {/* WhatsApp Action - PRIMARY */}
              <button
                onClick={handleWhatsApp}
                className="w-full group flex items-center gap-5 p-5 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Image src="/whatsapp-icon.svg" alt="WhatsApp" width={36} height={36} className="w-9 h-9 object-contain brightness-110" />
                </div>
                <div className="flex-1 text-left relative z-10">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">Direct Access</p>
                  <p className="text-base font-bold text-white font-display">Chat with Sapphire</p>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-500/50 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                 {/* Shorts Action */}
                 {videoMedias.length > 0 && (
                    <ShortsTrigger 
                      videos={videoMedias.map(v => ({
                        id: v.id, url: v.url, title: bien.titre,
                        price: bien.prix_vente_fcfa ? `${bien.prix_vente_fcfa} FCFA` : 'P.O.A',
                        location: bien.commune, propertyId: bien.id
                      }))}
                      className="!bg-white/5 !text-white !p-4 !rounded-2xl !border !border-white/10 !w-full !shadow-none hover:!bg-white/10 hover:!border-white/30 !flex-col !items-start !gap-3 !text-left"
                    >
                       <div className="p-2 bg-white/10 rounded-lg">
                          <Play className="w-4 h-4 text-white" />
                       </div>
                       <div>
                          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Immersif</p>
                          <p className="text-[11px] font-bold text-white">Shorts Vidéo</p>
                       </div>
                    </ShortsTrigger>
                  )}

                  {/* 3D Action */}
                  <a
                    href="#visite-3d"
                    onClick={() => setIsOpen(false)}
                    className="group flex flex-col items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent-luxury/50 hover:bg-accent-luxury/5 transition-all duration-500"
                  >
                    <div className="p-2 bg-accent-luxury/20 rounded-lg group-hover:scale-110 transition-transform">
                      <Zap className="w-4 h-4 text-accent-luxury" />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-accent-luxury/60 uppercase tracking-widest mb-1">3D View</p>
                      <p className="text-[11px] font-bold text-white">Digital Twin</p>
                    </div>
                  </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-accent-luxury animate-pulse" />
                <span className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/40">Powered by Sapphire AI</span>
              </div>
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center overflow-hidden">
                       <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent" />
                    </div>
                 ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layoutId="sapphire-hub-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group p-4 bg-[#075E54] rounded-full shadow-[0_20px_50px_rgba(37,211,102,0.3)] flex items-center justify-center overflow-visible border border-white/10"
      >
        <div className="relative">
          {isOpen ? <X className="w-6 h-6 text-white" /> : (
            <div className="relative">
              <Image src="/whatsapp-icon.svg" alt="WA" width={32} height={32} className="w-8 h-8 relative z-10" />
            </div>
          )}
        </div>
        
        {/* Simple Sonar Pulse */}
        {!isOpen && (
          <div className="absolute inset-0 -z-10 rounded-full bg-[#25D366] animate-ping opacity-20 scale-125" />
        )}
      </motion.button>
    </div>

  )
}
