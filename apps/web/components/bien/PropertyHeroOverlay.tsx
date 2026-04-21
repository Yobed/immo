'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, ChevronDown, View, Play, Sparkles } from 'lucide-react'
import { ShortsTrigger } from './ShortsTrigger'

interface PropertyHeroOverlayProps {
  urlVisite3d?: string | null;
  videoMedias?: any[];
}

export function PropertyHeroOverlay({ urlVisite3d, videoMedias = [] }: PropertyHeroOverlayProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 pointer-events-none">
      {/* Top controls */}
      <div className="flex justify-between items-start pointer-events-auto w-full">
        <div className="flex flex-wrap gap-4">
          {urlVisite3d && (
            <motion.a
              href="#visite-3d"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-5 bg-accent-luxury text-slate-950 rounded-2xl border-4 border-[#020617] shadow-[0_20px_50px_rgba(212,175,55,0.3)] transition-all hover:bg-white"
            >
              <View size={20} className="text-slate-950" />
              <span className="text-[11px] uppercase font-black tracking-[0.2em]">Visite Virtuelle 3D</span>
            </motion.a>
          )}

          {videoMedias.length > 0 && (
            <div className="flex">
              <ShortsTrigger 
                videos={videoMedias.map(v => ({
                  id: v.id, url: v.url, title: "Expérience Immersive",
                  price: "", location: "", propertyId: ""
                }))}
                className="!bg-white/10 !backdrop-blur-3xl !border-white/20 !text-white hover:!bg-white/20 !shadow-none !h-full !px-4 md:!px-10"
              />
            </div>
          )}
        </div>

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

      {/* Bottom indicator & Marketing 5.0 */}
      {!isFocused && (
        <div className="flex flex-col items-center gap-12">
          {/* Middle: Floating Marketing Badge if videos exist */}
          {videoMedias.length > 0 && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="pointer-events-auto"
            >
              {/* This will be handled in page.tsx for now or we can pass it here */}
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              opacity: { delay: 2, duration: 1 },
              y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
            }}
            className="flex justify-center"
          >
            <ChevronDown className="text-white/20 w-8 h-8" strokeWidth={1} />
          </motion.div>
        </div>
      )}
    </div>
  )
}
