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
  const WHATSAPP_NUMBER = '2250700000000' // Numéro conciergerie VIP fictif pour la démo
  
  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Bonjour Conciergerie ImmoDash PRO,\n\nJe suis intéressé par le bien VIP suivant :\n\n🏠 *${bienTitre}*\n📍 ${bienLieu}\n💰 ${bienPrix}\n\nPourriez-vous m'organiser une visite privée ou me donner plus de détails prestigieux ?\n\nMerci.`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank')
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleWhatsApp}
      className={`relative group overflow-hidden flex items-center justify-center gap-4 py-8 px-6 bg-gradient-to-r from-indigo-900 via-indigo-950 to-black border border-indigo-500/30 rounded-3xl shadow-2xl transition-all duration-500 hover:shadow-indigo-500/20 ${className}`}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent w-full -skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
      
      <div className="relative z-10 p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 transition-colors">
        <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
      </div>

      <div className="relative z-10 text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-indigo-400 group-hover:text-white transition-colors">Service VIP</p>
        <p className="text-xl font-display font-bold text-white tracking-tight">Conciergerie Privée</p>
      </div>

      <MessageCircle className="relative z-10 ml-auto w-6 h-6 text-white group-hover:scale-125 transition-transform duration-500" />
      
      {/* Premium Badge Overlay */}
      <div className="absolute top-0 right-0 p-1">
        <div className="w-12 h-12 bg-white/5 backdrop-blur-3xl rounded-bl-3xl border-l border-b border-white/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
        </div>
      </div>
    </motion.button>
  )
}
