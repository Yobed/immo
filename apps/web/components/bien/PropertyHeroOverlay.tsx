'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, ChevronDown } from 'lucide-react'

export function PropertyHeroOverlay() {
  const [isFocused, setIsFocused] = useState(false)

  // Inject focus state into body or a global state could be better, 
  // but for now we'll just handle local visibility of this component's parent's siblings if needed.
  // Actually, we'll just expose isFocused if we were using it elsewhere, but the user wants 
  // 'permanent text' GONE from images. 
  
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 pointer-events-none">
      {/* Top controls */}
      <div className="flex justify-end pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsFocused(!isFocused)
            // Event to notify parent if needed
            window.dispatchEvent(new CustomEvent('hero-focus-toggle', { detail: !isFocused }))
          }}
          className="flex items-center gap-3 px-6 py-4 bg-[#020617]/60 backdrop-blur-3xl rounded-2xl border border-white/20 text-[#f8fafc] shadow-2xl transition-all hover:bg-[#020617]/80"
          title={isFocused ? "Afficher les détails" : "Mode Immersion (Masquer texte)"}
        >
          {isFocused ? (
            <>
              <Maximize2 size={18} className="text-white" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">Afficher UI</span>
            </>
          ) : (
            <>
              <Minimize2 size={18} className="text-white" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/90">Immersion</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Bottom indicator */}
      {!isFocused && (
        <motion.div 
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ 
            opacity: { delay: 2, duration: 1 },
            y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
          }}
          className="flex justify-center"
        >
          <ChevronDown className="text-off-white/20 w-8 h-8" strokeWidth={1} />
        </motion.div>
      )}
    </div>
  )
}
