'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'
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
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-midnight/5 rounded-xl group-hover:bg-accent-luxury transition-colors duration-500">
              <Play className="w-4 h-4 fill-current group-hover:text-white" />
            </div>
            <span>Voir les vidéos</span>
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
