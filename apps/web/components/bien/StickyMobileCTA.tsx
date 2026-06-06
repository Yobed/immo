'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, Calendar, CalendarCheck, MessageCircle, BedDouble, ArrowLeft } from 'lucide-react'
import { VisiteRequestForm } from './VisiteRequestForm'
import { useT } from '@/lib/i18n/client'
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
    <div className="pointer-events-auto flex items-center gap-2.5 h-[52px] pl-3.5 pr-4 bg-[var(--surface-card)] rounded-xl shadow-[var(--shadow-premium)] shrink-0 border border-[var(--border)]">
      <div className="w-[2px] h-6 rounded-full bg-[var(--accent-luxury)] shrink-0" />
      <div className="min-w-0">
        <p className="text-[7px] uppercase tracking-[0.25em] font-black text-[var(--text-muted)] leading-none mb-1 truncate max-w-[72px]">
          {lieu}
        </p>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[14px] font-display font-bold text-[var(--accent-luxury)] leading-none tracking-tight">
            {prix}
          </span>
          {prixSuffix && (
            <span className="text-[var(--text-muted)] text-[8px] font-bold opacity-60">/{prixSuffix}</span>
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
    <div className="flex items-center justify-center gap-2 px-5 h-full">
      <Icon className="w-4 h-4 text-white shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
      <span className="text-white font-display font-bold text-[10px] uppercase tracking-[0.18em] leading-none whitespace-nowrap">
        {label}
      </span>
    </div>
  )

  const baseClass = "pointer-events-auto group h-[52px] rounded-xl bg-gradient-to-r from-[var(--accent-luxury)] via-[#f59e0b] to-[#d97706] shadow-[0_8px_24px_rgba(249,115,22,0.35)] active:scale-95 transition-all duration-300 animate-cta border border-white/20 flex-1 flex items-center justify-center relative overflow-hidden"

  const shimmer = (
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
  )

  if (href) return <Link href={href} className={baseClass}>{shimmer}{content}</Link>
  return <button onClick={onClick} className={baseClass}>{shimmer}{content}</button>
}

function FloatingBackButton() {
  return (
    <Link
      href="/biens"
      className="fixed top-4 left-4 z-[110] flex items-center justify-center w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[var(--border)] text-[var(--text)] active:scale-90 transition-all"
      aria-label="Retour aux annonces"
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
  const t = useT()

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 100)
    window.addEventListener('scroll', handler, { passive: true })
    handler()

    // Auto-open if action in URL
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'visiter') {
      setSheetOpen(true)
      setActiveTab('visite')
    }

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

  const SITE_URL =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app')
  const bienUrl = bienId ? `${SITE_URL}/biens/${bienId}` : null
  const waText = encodeURIComponent(
    `Bonjour, je souhaite ${isNuitee ? 'réserver' : "plus d'infos sur"} *${bienTitre}* à ${bienLieu} (${prix}${prixSuffix})${bienUrl ? `\n\n🔗 ${bienUrl}` : ''}`
  )

  /* ─── Résidence meublée : Réserver + WhatsApp ─── */
  if (isNuitee && bienId) {
    return (
      <>
        <FloatingBackButton />
        <AnimatePresence>
          {(visible || isNuitee) && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-3 right-3 z-[110] lg:hidden flex items-center gap-2 pointer-events-none"
              style={{ bottom: barBottom }}
            >
              <style dangerouslySetInnerHTML={{ __html: STICKY_STYLES }} />
  
              {/* Prix */}
              <PrixBloc lieu={bienLieu} prix={prix} prixSuffix={prixSuffix} />
  
              {/* Bouton Réserver */}
              <ActionButton
                href={`/reservations/nouvelle?bienId=${bienId}`}
                icon={BedDouble}
                label={t.sticky.reserve}
              />
  
              {/* WhatsApp */}
              <a
                href={`https://wa.me/2250574243752?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto w-[52px] h-[52px] flex items-center justify-center rounded-xl bg-[#25D366] shadow-[0_6px_20px_rgba(37,211,102,0.3)] active:scale-95 transition-transform shrink-0 border border-white/20"
                aria-label="Contacter via WhatsApp"
              >
                <Image src="/whatsapp-icon.svg" alt="" width={26} height={26} className="w-[26px] h-[26px] object-contain" />
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

      {/* Barre sticky unifiée style "Dynamic Pill" — masquée quand la sheet est ouverte */}
      <AnimatePresence>
        {(visible || isNuitee) && !sheetOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-4 right-4 z-[105] lg:hidden pointer-events-none flex flex-col items-center gap-2"
            style={{ bottom: `calc(${barBottom} + 20px)` }}
          >
            {/* Reassurance microtext */}
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 text-[9px] font-bold uppercase tracking-wider pointer-events-auto">
              ⚡ {t.sticky.fastReply}
            </div>

            {/* Action Bar Unifiée */}
            <div className="w-full h-[58px] glass-pill rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.25)] border border-white/10 flex items-center p-2 pointer-events-auto">

              {/* Infos Prix - Très compact à gauche */}
              <div className="flex flex-col pl-3 pr-3 border-r border-white/10 justify-center h-full min-w-[90px]">
                <span className="text-[15px] font-display font-bold text-[var(--accent-luxury)] leading-none mb-0.5">
                  {prix}
                </span>
                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                  {prixSuffix ? `/${prixSuffix}` : t.sticky.total}
                </span>
              </div>

              {/* Le Bouton d'Action - Prend le reste de la place */}
              <div className="flex-1 pl-2">
                {isNuitee ? (
                  <ActionButton
                    href={`/reservations/nouvelle?bienId=${bienId}`}
                    icon={BedDouble}
                    label={t.sticky.reserve}
                  />
                ) : (
                  <ActionButton
                    onClick={() => openSheet('visite')}
                    icon={CalendarCheck}
                    label={t.sticky.visit}
                  />
                )}
              </div>

              {/* WhatsApp discret à l'intérieur de la pilule */}
              <a
                href={`https://wa.me/2250574243752?text=${waText}`}
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
              className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Panneau */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[121] bg-[var(--surface-card)] rounded-t-3xl lg:hidden shadow-2xl"
              style={{ maxHeight: '88vh' }}
            >
              {/* Handle — plus large et premium */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-14 h-1.5 rounded-full bg-surface-raised/80" />
              </div>

              {/* En-tête — Typographie plus forte */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-display font-bold text-[var(--text)] text-[16px] leading-tight line-clamp-1 uppercase tracking-tight">
                    {bienTitre}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                      {bienLieu}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[11px] font-black text-[var(--accent-luxury)]">
                      {prix}{prixSuffix}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => setSheetOpen(false)}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-[var(--surface-hover)] flex items-center justify-center active:bg-[var(--surface-hover)] shrink-0"
                >
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Onglets */}
              <div className="flex gap-1.5 mx-4 my-3 p-1 bg-[var(--surface-hover)] rounded-xl">
                <button
                  onClick={() => setActiveTab('visite')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === 'visite'
                      ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--text)] hover:text-[var(--text)]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Demander une visite
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === 'contact'
                      ? 'bg-[var(--surface-card)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--text)] hover:text-[var(--text)]'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Contacter
                </button>
              </div>

              {/* Contenu scrollable */}
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
                    <p className="text-[var(--text-muted)] text-sm font-medium mb-1">Connexion requise</p>
                    <p className="text-[var(--text-muted)] text-xs mb-4">Connectez-vous pour planifier une visite.</p>
                    <a href="/login" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold">
                      Se connecter
                    </a>
                  </div>
                ) : null}

                {activeTab === 'contact' && bienId ? (
                  <div className="py-2 space-y-4">
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Obtenez les coordonnées du propriétaire après validation par notre équipe.
                    </p>
                    <DemanderContactWhatsAppButton
                      bienId={bienId}
                      isAuthenticated={!!isAuthenticated}
                    />
                    <div className="pt-2 border-t border-[var(--border)]">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-3">Contacter directement</p>
                      <div className="flex flex-col gap-2">
                        <a
                          href={`https://wa.me/2250574243752?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl text-[#25D366] text-xs font-bold active:scale-95 transition-transform"
                        >
                          <Image src="/whatsapp-icon.svg" alt="" width={20} height={20} className="w-5 h-5" />
                          <span>Principal — +225 05 74 24 37 52</span>
                        </a>
                        <a
                          href={`https://wa.me/2250778311541?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl text-[#25D366] text-xs font-bold active:scale-95 transition-transform"
                        >
                          <Image src="/whatsapp-icon.svg" alt="" width={20} height={20} className="w-5 h-5" />
                          <span>Support — +225 07 78 31 15 41</span>
                        </a>
                      </div>
                    </div>
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
