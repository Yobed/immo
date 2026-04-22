'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Share2 } from 'lucide-react'
import { FavorisButton } from './FavorisButton'
import { formatFCFA } from '@/lib/format'

interface DiscoveryBarProps {
  bien: any
  prix: { value: string; suffix: string } | null
  userId: string | null
}

export function DiscoveryBar({ bien, prix, userId }: DiscoveryBarProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#020617]/80 backdrop-blur-3xl border-b border-accent-luxury/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="max-w-[1920px] mx-auto px-6 h-20 md:h-24 flex items-center justify-between gap-6">
            
            <div className="flex items-center gap-6 overflow-hidden">
               {/* Back Button */}
               <motion.a 
                  href="/biens"
                  className="flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group shrink-0"
               >
                  <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
               </motion.a>

               <div className="hidden md:block w-px h-8 bg-white/10 shrink-0" />

               {/* Property Title & Context */}
               <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-widest text-white/30">{bien.commune}</p>
                  <h2 className="text-base font-display font-bold text-white truncate max-w-[200px] lg:max-w-[400px]">{bien.titre}</h2>
               </div>
            </div>

            {/* Quick Actions & Navigation */}
            <div className="flex items-center gap-4 lg:gap-8">
               
               {/* Pricing Context - Desktop Only */}
               <div className="hidden xl:flex items-center gap-6 pl-6 border-l border-white/10">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Investissement</span>
                     <span className="text-lg font-display font-bold text-accent-luxury">{prix?.value}</span>
                  </div>
                  
                  <div className="flex flex-col">
                     <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Localisation</span>
                     <span className="text-sm font-medium text-white/60">{bien.commune}</span>
                  </div>
               </div>

               {/* Navigation Links - Desktop Only */}
               <nav className="hidden lg:flex items-center gap-6 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full">
                  <a href="#signature" className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">Narration</a>
                  <a href="#shorts" className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">Shorts</a>
                  <a href="#visite-3d" className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">3D View</a>
               </nav>

               {/* Primary CTA */}
               <div className="flex items-center gap-3">
                  <a
                    href={`https://wa.me/2250574243752?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par ce bien : *${bien.titre}* — ${bien.commune}. Pouvez-vous me donner plus d'informations ?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 lg:px-8 py-3 bg-emerald-600 rounded-full hover:bg-emerald-500 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] shrink-0"
                  >
                    <img src="/whatsapp-3d.png" alt="WA" className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white hidden sm:inline">Contacter</span>
                  </a>

                  <div className="flex items-center gap-2">
                     <motion.button 
                       whileTap={{ scale: 0.9 }}
                       className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white shrink-0"
                     >
                       <Share2 className="w-4 h-4 lg:w-5 lg:h-5" />
                     </motion.button>
                     <FavorisButton 
                       bienId={bien.id} 
                       userId={userId} 
                       className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white shrink-0" 
                     />
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
