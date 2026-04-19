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
          className={`fixed bottom-36 right-6 z-50 w-16 h-16 rounded-full bg-[var(--accent-luxury)] text-[var(--midnight)] shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center group overflow-hidden ${className}`}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <MessageCircle className="w-7 h-7 relative z-10" />
          <Sparkles className="absolute top-2 right-2 w-3 h-3 text-[var(--midnight)] opacity-50 relative z-10" />
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
          className="w-full flex items-center justify-center gap-4 py-6 bg-transparent border border-[var(--off-white)]/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] font-display hover:border-[var(--off-white)]/30 transition-all duration-500 hover:bg-[var(--off-white)]/5 text-[var(--text)]"
        >
          <MessageCircle className="w-4 h-4 text-[var(--accent-luxury)]" />
          Conciergerie Live
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
