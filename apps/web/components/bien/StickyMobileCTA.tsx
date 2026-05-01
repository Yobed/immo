'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, Calendar, CalendarCheck, MessageCircle, BedDouble, ArrowLeft } from 'lucide-react'
import { VisiteRequestForm } from './VisiteRequestForm'
import { DemanderContactWhatsAppButton } from './DemanderContactWhatsAppButton'

/* ── Animations CSS injectées une seule fois ── */
const STICKY_STYLES = `
  @keyframes cta-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 8px 32px -8px var(--accent-glow); }
    50% { transform: scale(1.02); box-shadow: 0 12px 48px -4px var(--accent-glow); }
  }
  .animate-cta { animation: cta-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }

  .glass-pill {
    background: var(--glass-surface);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--border);
  }
`

interface StickyMobileCTAProps {
  bienTitre: string
  bienLieu: string
  prix: string
  prixSuffix: string
  bienId?: string
  isNuitee?: boolean
  proprietaireId?: string
  isAuthenticated?: boolean
}

type Tab = 'visite' | 'contact'

/* ── Bloc prix compact partagé ── */
function PrixBloc({ lieu, prix, prixSuffix }: { lieu: string; prix: string; prixSuffix: string }) {
  return (
    <div className="pointer-events-auto flex items-center gap-3 h-[72px] pl-4 pr-5 bg-[var(--surface-card)] rounded-2xl shadow-[var(--shadow-premium)] shrink-0 border border-[var(--border)]">
      <div className="w-[3px] h-8 rounded-full bg-[var(--accent-luxury)] shrink-0 shadow-[0_0_12px_var(--accent-glow)]" />
      <div className="min-w-0">
        <p className="text-[7px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)] leading-none mb-1.5 truncate max-w-[70px]">
          {lieu}
        </p>
        <div className="flex flex-col">
          <span className="text-[15px] font-black text-[var(--accent-luxury)] leading-tight tracking-tight">
            {prix}
          </span>
          {prixSuffix && (
            <span className="text-[var(--text-muted)] text-[8px] font-bold tracking-tight opacity-70">/{prixSuffix}</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Bouton CTA ambré pulsant ── */
function ActionButton({
  onClick,
  href,
  icon: Icon,
  label,
}: {
  onClick?: () => void
  href?: string
  icon: React.ElementType
  label: string
}) {
  const content = (
    <div className="flex items-center justify-center gap-2.5 px-6 h-full">
      <Icon className="w-5 h-5 text-white shrink-0" strokeWidth={3} />
      <span className="text-white font-black text-[13px] uppercase tracking-[0.1em] leading-none whitespace-nowrap">
        {label}
      </span>
    </div>
  )

  const baseClass = "h-[56px] rounded-2xl bg-gradient-to-r from-[var(--accent-luxury)] to-[#d97706] shadow-lg shadow-[var(--accent-glow)]/40 active:scale-95 transition-all duration-200 animate-cta border border-white/20 flex-1 flex items-center justify-center"

  if (href) return <Link href={href} className={baseClass}>{content}</Link>
  return <button onClick={onClick} className={baseClass}>{content}</button>
}

function FloatingBackButton() {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 z-[110] flex items-center justify-center w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 text-slate-900 active:scale-90 transition-all lg:hidden"
    >
      <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
    </Link>
  )
}

export function StickyMobileCTA({
  bienTitre,
  bienLieu,
  prix,
  prixSuffix,
  bienId,
  isNuitee,
  proprietaireId,
  isAuthenticated,
}: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('visite')

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  const openSheet = (tab: Tab) => {
    setActiveTab(tab)
    setSheetOpen(true)
  }

  /* ─── Layout partagé ─── */
  const barBottom = 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'

  /* ─── Résidence meublée : Réserver + WhatsApp ─── */
  if (isNuitee && bienId) {
    const waText = encodeURIComponent(
      `Bonjour, je souhaite réserver *${bienTitre}* à ${bienLieu} (${prix}${prixSuffix})`
    )
    return (
      <>
        <FloatingBackButton />
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-3 right-3 z-[95] lg:hidden flex items-center gap-2 pointer-events-none"
              style={{ bottom: barBottom }}
            >
              <style dangerouslySetInnerHTML={{ __html: STICKY_STYLES }} />
  
              {/* Prix */}
              <PrixBloc lieu={bienLieu} prix={prix} prixSuffix={prixSuffix} />
  
              {/* Bouton Réserver */}
              <AmberCTAButton
                href={`/reservations/nouvelle?bienId=${bienId}`}
                icon={BedDouble}
                label="Réserver"
              />
  
              {/* WhatsApp */}
              <a
                href={`https://wa.me/2250789263373?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto w-[68px] h-[68px] flex items-center justify-center rounded-2xl bg-[#25D366] shadow-[0_12px_32px_rgba(37,211,102,0.3)] active:scale-95 transition-transform shrink-0 border border-white/20"
                aria-label="Contacter via WhatsApp"
              >
                <Image src="/whatsapp-icon.svg" alt="" width={32} height={32} className="w-8 h-8 object-contain" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  /* ─── Autres biens : Planifier visite + Contact ─── */
  return (
    <>
      <FloatingBackButton />
      <style dangerouslySetInnerHTML={{ __html: STICKY_STYLES }} />

      {/* Barre sticky unifiée style "Dynamic Pill" */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-4 right-4 z-[95] lg:hidden pointer-events-none flex flex-col items-center gap-4"
            style={{ bottom: `calc(${barBottom} + 20px)` }}
          >
            {/* Action Bar Unifiée */}
            <div className="w-full h-[76px] glass-pill rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center p-2.5 pointer-events-auto">
              
              {/* Infos Prix - Très compact à gauche */}
              <div className="flex flex-col pl-4 pr-3 border-r border-white/5 justify-center h-full min-w-[90px]">
                <span className="text-[14px] font-black text-[var(--accent-luxury)] leading-none mb-1">
                  {prix}
                </span>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                  {prixSuffix ? `/${prixSuffix}` : 'Total'}
                </span>
              </div>

              {/* Le Bouton d'Action - Prend le reste de la place */}
              <div className="flex-1 pl-2">
                {isNuitee ? (
                  <ActionButton
                    href={`/reservations/nouvelle?bienId=${bienId}`}
                    icon={BedDouble}
                    label="Réserver"
                  />
                ) : (
                  <ActionButton
                    onClick={() => openSheet('visite')}
                    icon={CalendarCheck}
                    label="Visiter"
                  />
                )}
              </div>

              {/* WhatsApp discret à l'intérieur de la pilule */}
              <a
                href={`https://wa.me/2250789263373?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[56px] h-[56px] flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-colors ml-2"
              >
                <Image src="/whatsapp-icon.svg" alt="WhatsApp" width={24} height={24} className="opacity-80 group-hover:opacity-100" />
              </a>
            </div>

            {/* Hint text contextuel (optionnel mais incite au clic) */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 drop-shadow-md"
            >
              Plus de 12 personnes intéressées cette semaine
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Panneau */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl lg:hidden shadow-2xl"
              style={{ maxHeight: '88vh' }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-200" />
              </div>

              {/* En-tête */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{bienTitre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {bienLieu} ·{' '}
                    <span className="font-semibold text-amber-600">
                      {prix}{prixSuffix}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200 shrink-0"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Onglets */}
              <div className="flex gap-1.5 mx-4 my-3 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('visite')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === 'visite'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Demander une visite
                </button>
                {/* CTA Button — Amber Luxury */}
            <motion.button
              onClick={handleAction}
              whileTap={{ scale: 0.94 }}
              className="relative flex-1 flex items-center justify-center gap-3 bg-[var(--accent-luxury)] text-[var(--on-accent)] py-4 px-6 rounded-2xl shadow-[0_12px_40px_-8px_var(--accent-luxury-glow)] animate-[amber-glow-premium_3s_infinite_ease-in-out]"
            >
              <div className="flex items-center gap-2.5">
                <Icon size={20} strokeWidth={3} className="shrink-0" />
                <span className="font-black text-[13px] uppercase tracking-[0.2em] whitespace-nowrap">
                  {label}
                </span>
              </div>
              
              {/* Subtle light streak */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
            </motion.button>
u scrollable */}
              <div
                className="overflow-y-auto px-4 pb-8"
                style={{ maxHeight: 'calc(88vh - 170px)' }}
              >
                {activeTab === 'visite' && bienId && proprietaireId ? (
                  <VisiteRequestForm
                    bienId={bienId}
                    proprietaireId={proprietaireId}
                    isPremium={false}
                    onSuccess={() => {}}
                  />
                ) : activeTab === 'visite' ? (
                  <div className="py-8 text-center">
                    <CalendarCheck className="w-10 h-10 mx-auto mb-3 text-amber-500" />
                    <p className="text-slate-600 text-sm font-medium mb-1">Connexion requise</p>
                    <p className="text-slate-400 text-xs mb-4">Connectez-vous pour planifier une visite.</p>
                    <a href="/login" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold">
                      Se connecter
                    </a>
                  </div>
                ) : null}

                {activeTab === 'contact' && bienId ? (
                  <div className="py-2">
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Obtenez les coordonnées du propriétaire après validation par notre équipe.
                    </p>
                    <DemanderContactWhatsAppButton
                      bienId={bienId}
                      isAuthenticated={!!isAuthenticated}
                    />
                  </div>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
