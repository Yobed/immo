'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles, X, MessageSquare, Headset } from 'lucide-react'
import { ChatBot } from './ChatBot'

interface ConciergerieLiveProps {
  propertyContext?: string
  isFloatingTrigger?: boolean
  className?: string
}

export function ConciergerieLive({ propertyContext, isFloatingTrigger = false, className }: ConciergerieLiveProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (isFloatingTrigger) {
    return (
      <>
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ 
            scale: 1.05, 
            y: -5,
            boxShadow: '0 25px 50px -12px rgba(212, 175, 55, 0.4)'
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-8 right-8 z-50 w-20 h-20 rounded-[2.2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-accent-luxury/30 text-accent-luxury shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex items-center justify-center group overflow-hidden ${className}`}
        >
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-luxury/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10 flex flex-col items-center">
            <Sparkles className="w-8 h-8 text-accent-luxury mb-1 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute -bottom-2 w-1.5 h-1.5 bg-accent-luxury rounded-full animate-pulse shadow-[0_0_10px_rgba(212,175,55,1)]" />
          </div>

          {/* Border Animation */}
          <div className="absolute inset-0 border-2 border-accent-luxury/0 group-hover:border-accent-luxury/20 transition-all duration-700 rounded-[2rem]" />
        </motion.button>
        <AnimatePresence>
          {isOpen && (
             <ConciergeModal 
               isOpen={isOpen} 
               setIsOpen={setIsOpen} 
               propertyContext={propertyContext} 
             />
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <>
      <div className={className || "flex flex-col gap-4"}>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-2 py-10 bg-gradient-to-br from-slate-900 to-black border border-accent-luxury/20 rounded-[2.5rem] hover:border-accent-luxury/50 transition-all duration-500 hover:bg-accent-luxury/5 text-white group shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-luxury/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-accent-luxury/10 transition-colors" />
          <div className="p-3 bg-accent-luxury/10 rounded-2xl mb-2 group-hover:scale-110 group-hover:bg-accent-luxury/20 transition-all duration-500">
            <Sparkles className="w-6 h-6 text-accent-luxury" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] font-display group-hover:text-accent-luxury transition-colors">Sapphire Interne 5.0</span>
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">Assistant Privé de Luxe</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <ConciergeModal 
            isOpen={isOpen} 
            setIsOpen={setIsOpen} 
            propertyContext={propertyContext} 
          />
        )}
      </AnimatePresence>
    </>
  )
}

function ConciergeModal({ isOpen, setIsOpen, propertyContext }: { isOpen: boolean, setIsOpen: (v: boolean) => void, propertyContext?: string }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-4 md:inset-auto md:right-8 md:bottom-8 md:w-[450px] md:h-[700px] z-[201] pointer-events-auto"
      >
        <ChatBot 
          context={propertyContext} 
          onClose={() => setIsOpen(false)} 
          isFloating={true} 
        />
      </motion.div>
    </>
  )
}
