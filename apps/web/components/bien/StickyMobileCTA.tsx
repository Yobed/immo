'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const waText = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par ce bien :\n\n🏠 *${bienTitre}*\n📍 ${bienLieu}\n💰 ${prix}${prixSuffix}\n\nPouvez-vous me donner plus d'informations ?`
  )

  /* ── Résidence meublée : barre flottante centrée ── */
  if (isNuitee && bienId) {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-4 right-4 z-[95] lg:hidden flex items-center gap-3 pointer-events-none"
            style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Bouton Réserver — carte sombre premium */}
            <Link
              href={`/reservations/nouvelle?bienId=${bienId}`}
              className="pointer-events-auto flex-1 flex items-center gap-4 h-[62px] pl-5 pr-4 bg-slate-900 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] active:scale-[0.97] transition-transform overflow-hidden"
            >
              {/* Barre dorée gauche */}
              <div className="w-[3px] h-8 rounded-full bg-accent-luxury shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-white/40 leading-none mb-1">
                  Réserver maintenant
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[18px] font-black text-accent-luxury leading-none tracking-tight">
                    {prix}
                  </span>
                  {prixSuffix && (
                    <span className="text-white/35 text-[10px] font-medium">{prixSuffix}</span>
                  )}
                </div>
              </div>

              {/* Flèche */}
              <div className="w-9 h-9 rounded-xl bg-accent-luxury/15 flex items-center justify-center shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-luxury">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>

            {/* Bouton WhatsApp */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto w-[62px] h-[62px] flex items-center justify-center rounded-2xl bg-[#25D366] shadow-[0_8px_24px_rgba(37,211,102,0.35)] active:scale-95 transition-transform shrink-0"
              aria-label="Contacter via WhatsApp"
            >
              <img src="/whatsapp-3d.png" alt="" className="w-7 h-7 object-contain" />
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
          className="fixed bottom-0 left-0 right-0 z-[95] lg:hidden bg-white border-t border-slate-200 px-4 pt-3 shadow-2xl"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
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
