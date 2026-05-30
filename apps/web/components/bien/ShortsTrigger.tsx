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
        className={`group relative flex items-center gap-6 px-10 py-5 bg-[var(--surface-card)] text-[var(--text)] rounded-[var(--radius-2xl)] font-bold text-[12px] uppercase tracking-[0.4em] font-display overflow-hidden shadow-md border border-accent-luxury/30 hover:border-accent-luxury/60 transition-colors ${className}`}
      >
        {children || (
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-[var(--accent-luxury-muted)] rounded-xl group-hover:bg-[var(--accent-luxury)] group-hover:text-[var(--on-accent)] transition-colors duration-500">
              <Play className="w-4 h-4 fill-current" />
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
