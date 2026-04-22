'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StickyMobileCTAProps {
  bienTitre: string
  bienLieu: string
  prix: string
  prixSuffix: string
}

const WHATSAPP_NUMBER = '2250574243752'

export function StickyMobileCTA({ bienTitre, bienLieu, prix, prixSuffix }: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const text = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par ce bien :\n\n🏠 *${bienTitre}*\n📍 ${bienLieu}\n💰 ${prix}${prixSuffix}\n\nPouvez-vous me donner plus d'informations ?`
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white/40 text-[10px] font-medium truncate">{bienLieu}</p>
              <p className="text-white font-bold text-base leading-tight">
                {prix}
                {prixSuffix && (
                  <span className="text-white/40 text-xs font-normal ml-1">{prixSuffix}</span>
                )}
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] rounded-xl transition-all shadow-lg shadow-emerald-900/40 shrink-0"
            >
              <img src="/whatsapp-3d.png" alt="" className="w-5 h-5 object-contain" />
              <span className="text-white font-bold text-sm">Contacter</span>
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
