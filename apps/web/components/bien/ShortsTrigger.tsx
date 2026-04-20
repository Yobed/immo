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
}

export function ShortsTrigger({ videos, className }: ShortsTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!videos || videos.length === 0) return null

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`group relative flex items-center gap-4 px-8 py-4 bg-white text-midnight rounded-2xl font-bold text-[11px] uppercase tracking-[0.5em] font-display overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent-luxury/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-midnight/5 rounded-lg group-hover:bg-accent-luxury transition-colors duration-500">
            <Play className="w-4 h-4 fill-current group-hover:text-white" />
          </div>
          <span className="relative">
            Regarder les Shorts
            <motion.span 
              className="absolute -top-4 -right-4"
              animate={{ rotate: [0, 15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Sparkles className="w-3 h-3 text-accent-luxury" />
            </motion.span>
          </span>
        </div>
      </motion.button>

      <PropertyVideoShorts 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        initialVideos={videos} 
      />
    </>
  )
}
