'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'

interface StickyMobileCTAProps {
  bienTitre: string
  bienLieu: string
  prix: string
  prixSuffix: string
  bienId?: string
  isNuitee?: boolean
}

const WHATSAPP_NUMBER = '2250574243752'

export function StickyMobileCTA({ bienTitre, bienLieu, prix, prixSuffix, bienId, isNuitee }: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false)
  const { scrollY } = useScroll()

  // Légère translation verticale au scroll — donne l'impression que le bouton flotte
  const floatY = useTransform(scrollY, [400, 3000], [0, -24])

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight - 120
      setVisible(y > 400 && y < max)
    }
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const waText = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par ce bien :\n\n🏠 *${bienTitre}*\n📍 ${bienLieu}\n💰 ${prix}${prixSuffix}\n\nPouvez-vous me donner plus d'informations ?`
  )

  /* ── Résidence meublée : bouton Réserver centré flottant ── */
  if (isNuitee && bienId) {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            style={{ y: floatY }}
            initial={{ y: 60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[95] lg:hidden flex items-center gap-3 pointer-events-none"
          >
            {/* Bouton principal Réserver */}
            <div className="relative pointer-events-auto">
              {/* Anneau pulsant pour attirer l'attention */}
              <span className="absolute inset-0 rounded-full bg-accent-luxury animate-ping opacity-30" />
              <span className="absolute inset-0 rounded-full bg-accent-luxury animate-ping opacity-20 [animation-delay:0.4s]" />

              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Link
                  href={`/reservations/nouvelle?bienId=${bienId}`}
                  className="relative flex items-center gap-2.5 px-8 py-4 bg-accent-luxury text-slate-900 rounded-full font-black text-[15px] shadow-[0_8px_32px_rgba(212,175,55,0.45)] active:scale-95 transition-transform"
                >
                  <span>Réserver · {prix}</span>
                  {prixSuffix && <span className="text-slate-700 text-xs font-semibold">{prixSuffix}</span>}
                </Link>
              </motion.div>
            </div>

            {/* Icône WhatsApp secondaire */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-emerald-600 shadow-lg active:scale-95 transition-transform shrink-0"
              aria-label="Contacter via WhatsApp"
            >
              <img src="/whatsapp-3d.png" alt="" className="w-6 h-6 object-contain" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  /* ── Autres types : barre sticky basse classique ── */
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[95] lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-[10px] font-medium truncate">{bienLieu}</p>
              <p className="text-slate-900 font-bold text-base leading-tight">
                {prix}
                {prixSuffix && <span className="text-slate-400 text-xs font-normal ml-1">{prixSuffix}</span>}
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] rounded-xl transition-all shadow-lg shadow-emerald-900/20 shrink-0"
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
