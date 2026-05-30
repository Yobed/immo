'use client'
import { useState } from 'react'
import { SearchFilters } from './SearchFilters'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal, ChevronUp } from 'lucide-react'

export function MobileFiltersDrawer({ activeCount }: { activeCount: number }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger button — plus premium */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-between w-full px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--midnight-muted)] shadow-xl active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-luxury/10 text-[var(--accent-luxury)]">
            <SlidersHorizontal size={18} strokeWidth={2.5} />
          </div>
          <span className="font-black text-xs uppercase tracking-[0.2em] text-[var(--text)]">Filtres de recherche</span>
        </div>
        
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[var(--accent-luxury)] text-[var(--on-accent)] text-[10px] font-black shadow-lg shadow-accent-luxury/20">
              {activeCount}
            </span>
          )}
          <ChevronUp size={16} className="text-[var(--text-muted)]" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] lg:hidden"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[201] lg:hidden"
            >
              <div className="bg-[var(--surface-card)] rounded-t-[2.5rem] shadow-[0_-12px_40px_rgba(0,0,0,0.3)] border-t border-white/5 overflow-hidden flex flex-col max-h-[92vh]">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-12 h-1.5 rounded-full bg-[var(--border)] opacity-50" />
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal size={18} className="text-[var(--accent-luxury)]" />
                    <h2 className="font-black text-sm uppercase tracking-widest text-[var(--text)]">Affinage</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)] active:scale-90 transition-transform"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto">
                  <SearchFilters onApply={() => setOpen(false)} />
                </div>

                {/* Safe area spacer */}
                <div className="h-[env(safe-area-inset-bottom,2rem)] bg-[var(--surface-card)]" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
