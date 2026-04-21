'use client'
import { motion } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'

interface VIPConciergeButtonProps {
  bienTitre: string
  bienLieu: string
  bienPrix: string
  className?: string
}

export function VIPConciergeButton({ bienTitre, bienLieu, bienPrix, className }: VIPConciergeButtonProps) {
  const WHATSAPP_NUMBER = '2250574243752' // Numéro SAPPHIRE WHATSAPP
  
  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Bonjour Sapphire Intelligence,\n\nJe souhaiterais obtenir des informations exclusives sur le bien suivant :\n\n💎 *${bienTitre}*\n📍 ${bienLieu}\n💰 ${bienPrix}\n\nCan you please provide more details and high-resolution visuals?\n\nMerci.`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank')
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleWhatsApp}
      className={`relative group overflow-hidden flex items-center justify-center gap-6 py-8 px-8 bg-gradient-to-br from-[#0c0a09] via-[#1c1917] to-black border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-700 hover:border-accent-luxury/30 ${className}`}
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-accent-luxury/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="relative z-10 flex items-center gap-6 w-full">
        <div className="relative">
          <div className="absolute inset-0 bg-accent-luxury/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative w-16 h-16 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
            <img src="/whatsapp-3d.png" alt="WhatsApp" className="w-10 h-10 object-contain drop-shadow-2xl" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-midnight flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </div>
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3 h-3 text-accent-luxury" />
            <p className="text-[10px] text-accent-luxury font-bold uppercase tracking-[0.4em] font-display">Intelligence 5.0</p>
          </div>
          <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-none mb-2">Sapphire WhatsApp</h3>
          <p className="text-[11px] text-white/40 font-medium tracking-wide">
            Assistance Immobilière 5.0 · 24/7
          </p>
        </div>

        <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center group-hover:border-accent-luxury/20 group-hover:bg-accent-luxury/5 transition-all">
          <MessageCircle className="w-5 h-5 text-white/20 group-hover:text-accent-luxury group-hover:scale-110 transition-all duration-500" />
        </div>
      </div>
      
      {/* Decorative Shimmer */}
      <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1500ms] ease-in-out bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
    </motion.button>
  )
}
