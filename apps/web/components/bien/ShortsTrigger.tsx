'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Sparkles } from 'lucide-react'
import { PropertyVideoShorts } from '@/components/property/PropertyVideoShorts'

interface ShortsTriggerProps {
  videos: {
    id: string;
    url: string;
    title: string;
    price: string;
    location: string;
    propertyId: string;
  }[];
  className?: string;
  children?: React.ReactNode;
}

export function ShortsTrigger({ videos, className, children }: ShortsTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!videos || videos.length === 0) return null

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`group relative flex items-center gap-6 px-10 py-5 bg-white text-midnight rounded-[2rem] font-bold text-[12px] uppercase tracking-[0.4em] font-display overflow-hidden shadow-[0_20px_50px_rgba(212,175,55,0.4)] border-2 border-accent-luxury/20 ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent-luxury/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {children || (
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-midnight/5 rounded-xl group-hover:bg-accent-luxury transition-colors duration-500 shadow-inner">
              <Play className="w-5 h-5 fill-current group-hover:text-white" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] text-midnight/40 font-bold tracking-widest mb-1">Marketing 5.0</span>
              <span className="relative">
                Regarder les Shorts
                <motion.span 
                  className="absolute -top-3 -right-6"
                  animate={{ rotate: [0, 20, 0], scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="w-4 h-4 text-accent-luxury" />
                </motion.span>
              </span>
            </div>
          </div>
        )}
      </motion.button>

      <PropertyVideoShorts 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        initialVideos={videos} 
      />
    </>
  )
}
