'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, X } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

const STORAGE_KEY = 'comparator-hint-dismissed-v1'

/**
 * Petit pop-up d'onboarding pour expliquer le comparateur de biens.
 * Apparaît une fois par utilisateur, dismissable.
 */
export function ComparatorHint() {
  const [visible, setVisible] = useState(false)
  const t = useT()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 4000)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* quota ignored */
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-28 lg:bottom-8 right-4 z-[150] max-w-[280px] hidden lg:block"
        >
          <div className="relative bg-[var(--midnight)] border border-[var(--accent-luxury)]/40 rounded-2xl shadow-md p-4 pr-10">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--accent-luxury)]/15 flex items-center justify-center">
                <GitCompare className="w-4 h-4 text-[var(--accent-luxury)]" />
              </div>
              <div className="text-white/85 text-[12px] leading-relaxed">
                <p className="font-bold text-white mb-1">{t.comparator.hintTitle}</p>
                <p className="text-white/60 text-[11px]">{t.comparator.hintBody}</p>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Fermer"
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
