'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { MapPin, Maximize2, BedDouble, CalendarCheck, ChevronLeft, ChevronRight, GitCompare, Check } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

interface PremiumBienCardProps {
  id: string
  titre: string
  commune: string
  quartier?: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_nuit_fcfa?: number | null
  prix_vente_fcfa: number | null
  surface_m2: number | null
  nb_pieces: number | null
  nb_salles_bain?: number
  isMeublee?: boolean
  is_verifie?: boolean
  score_ia?: number
  photo_url?: string | null
  photos?: string[]
  est_disponible?: boolean
  url_visite_3d?: string | null
  index?: number
  onSelect?: (id: string) => void
  isSelected?: boolean
  isCompact?: boolean
  isUltraCompact?: boolean
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n)
}

export function PremiumBienCard({
  id, titre, commune, quartier, type_bien,
  prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
  surface_m2, nb_pieces, photo_url, photos,
  nb_salles_bain,
  est_disponible = true,
  is_verifie,
  score_ia,
  url_visite_3d,
  index = 0,
  onSelect,
  isSelected,
  isCompact = false,
  isUltraCompact = false
}: PremiumBienCardProps) {

  const [imageLoaded, setImageLoaded] = useState(false)
  const prefersReduced = useReducedMotion()
  const t = useT()

  // Galerie : agrège photo_url + photos[] et déduplique
  const gallery = (() => {
    const list: string[] = []
    if (photo_url) list.push(photo_url)
    if (Array.isArray(photos)) for (const u of photos) if (u && !list.includes(u)) list.push(u)
    return list.slice(0, 5)
  })()
  const [photoIdx, setPhotoIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || gallery.length <= 1) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) {
      e.preventDefault()
      e.stopPropagation()
      setPhotoIdx((i) => {
        if (dx < 0) return Math.min(gallery.length - 1, i + 1)
        return Math.max(0, i - 1)
      })
    }
    touchStartX.current = null
  }
  function nextPhoto(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIdx((i) => Math.min(gallery.length - 1, i + 1))
  }
  function prevPhoto(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIdx((i) => Math.max(0, i - 1))
  }
  const currentPhoto = gallery[photoIdx] ?? null

  const prix = prix_vente_fcfa
    ? { value: formatFCFA(prix_vente_fcfa), suffix: '' }
    : prix_nuit_fcfa
    ? { value: formatFCFA(prix_nuit_fcfa), suffix: '/nuit' }
    : prix_mois_fcfa
    ? { value: formatFCFA(prix_mois_fcfa), suffix: '/mois' }
    : null

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 30 }}
      whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
      whileHover={prefersReduced ? undefined : { y: -8, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      viewport={{ once: true, margin: '-50px' }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: (index % 4) * 0.1 }}
      className="group relative flex flex-col h-full"
    >
      <div className="flex flex-col h-full">
        <Link
          href={`/biens/${id}`}
          className="flex flex-col h-full no-underline"
        >
        {/* Master Container */}
        <div className={`relative flex flex-col h-full bg-[var(--surface-card)] rounded-[2rem] overflow-hidden transition-all duration-700 ${!isCompact ? 'border hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)]' : ''} group-active:scale-[0.98] ${isSelected ? 'border-[var(--accent-luxury)] ring-1 ring-[var(--accent-luxury)]' : 'border-[var(--border)]'}`}>

          {/* 1. Image Section */}
          <div
            className={`relative ${isUltraCompact ? 'aspect-[2.4/1]' : isCompact ? 'aspect-video' : 'aspect-[4/5]'} overflow-hidden bg-[var(--midnight-muted)]`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {currentPhoto && !imageLoaded && (
              <div className="absolute inset-0 animate-shimmer z-10" aria-hidden="true" />
            )}
            {currentPhoto ? (
              <Image
                key={currentPhoto}
                src={currentPhoto}
                alt={`${titre} - photo ${photoIdx + 1}`}
                fill
                onLoad={() => setImageLoaded(true)}
                className={`object-cover transition-all duration-500 ease-out group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <MapPin className="w-12 h-12 text-[var(--text-muted)]" />
              </div>
            )}

            {/* Carrousel : flèches desktop + dots mobile */}
            {gallery.length > 1 && (
              <>
                {photoIdx > 0 && (
                  <button
                    onClick={prevPhoto}
                    aria-label="Photo précédente"
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
                  </button>
                )}
                {photoIdx < gallery.length - 1 && (
                  <button
                    onClick={nextPhoto}
                    aria-label="Photo suivante"
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
                  </button>
                )}
                {/* Dots indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex gap-1 pointer-events-none">
                  {gallery.map((_, i) => (
                    <span
                      key={i}
                      className={`block rounded-full transition-all ${
                        i === photoIdx ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Compare button — visible quand onSelect est fourni */}
            {onSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelect(id)
                }}
                aria-pressed={!!isSelected}
                aria-label={isSelected ? 'Retirer de la comparaison' : 'Ajouter à la comparaison'}
                className={`absolute bottom-2 right-2 z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border transition-all active:scale-90 ${
                  isSelected
                    ? 'bg-[var(--accent-luxury)] text-black border-[var(--accent-luxury)] shadow-lg'
                    : 'bg-black/55 text-white border-white/20 hover:bg-black/75'
                }`}
              >
                {isSelected ? <Check className="w-3 h-3" strokeWidth={3} /> : <GitCompare className="w-3 h-3" strokeWidth={2.5} />}
                {isSelected ? 'Sélectionné' : 'Comparer'}
              </button>
            )}

            {/* Hype Indicator — FOMO effect */}
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-wider text-white">
                <span className="relative flex w-1.5 h-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
                </span>
                {t.card.available}
              </span>
              {index < 3 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/20">
                  {t.card.rare}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-xl border border-white/12 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                {TYPES_BIEN_LABELS[type_bien] ?? type_bien.replace('_', ' ')}
              </span>
              {is_verifie && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (index % 4) * 0.1 + 0.3, duration: 0.4 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-black uppercase tracking-[0.12em] border border-white/30 shadow-[0_4px_12px_rgba(59,130,246,0.5)]"
                  title="Bien visité physiquement par l'équipe BOGBE'S"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  {t.card.verified}
                </motion.span>
              )}
            </div>
          </div>

          {/* 2. Content Section */}
          <div className={`flex flex-col ${(isCompact || isUltraCompact) ? 'p-2.5 pt-2' : 'p-4 pt-3.5'} bg-inherit flex-1`}>
            {/* Commune + Prix */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--accent-luxury)]" strokeWidth={2.5} />
                <span className="text-xs font-black text-[var(--accent-luxury)] uppercase tracking-[0.12em] truncate">
                  {commune}
                </span>
              </div>
              {prix && (
                <span className="text-base sm:text-[18px] font-display font-bold text-[var(--accent-luxury)] tracking-tight shrink-0 whitespace-nowrap">
                  {prix.value}
                  {prix.suffix && (
                    <span className="text-[10px] sm:text-[11px] font-sans font-semibold opacity-65 ml-0.5">{prix.suffix}</span>
                  )}
                </span>
              )}
            </div>

            {/* Titre */}
            <h3 className={`font-display ${(isCompact || isUltraCompact) ? 'text-[13px]' : 'text-[16px]'} font-bold text-[var(--text)] tracking-tight leading-[1.3] line-clamp-2 mb-3`}>
              {titre}
            </h3>

            {/* Stats */}
            {(nb_pieces || surface_m2) ? (
              <div className="flex items-center gap-4 mb-4">
                {nb_pieces ? (
                  <div className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-xs font-bold text-[var(--text)]">{nb_pieces} {t.card.rooms}</span>
                  </div>
                ) : null}
                {surface_m2 ? (
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-xs font-bold text-[var(--text)]">{surface_m2} m²</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="md:hidden mt-auto pt-2.5 border-t border-[var(--border)]/30">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const lowerType = type_bien.toLowerCase();
                  const isMeublee = lowerType.includes('meublee') || lowerType.includes('meublé') || lowerType.includes('nuit') || lowerType.includes('residence');
                  if (isMeublee) {
                    window.location.href = `/reservations/nouvelle?bienId=${id}`;
                  } else {
                    window.location.href = `/biens/${id}?action=visiter`;
                  }
                }}
                className="w-full min-h-[44px] h-11 rounded-[var(--radius-md)] bg-[var(--accent-luxury)] text-[var(--on-accent)] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all hover:bg-[var(--accent-luxury)]/90"
              >
                {type_bien.toLowerCase().includes('meublee') || type_bien.toLowerCase().includes('nuit') ? (
                  <>
                    <BedDouble className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">{t.card.book}</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">{t.card.visit}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        </Link>
      </div>
    </motion.div>
  )
}
