'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { MapPin, Maximize2, BedDouble, CalendarCheck } from 'lucide-react'

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
  surface_m2, nb_pieces, photo_url,
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

  const prix = prix_vente_fcfa
    ? { value: formatFCFA(prix_vente_fcfa), suffix: '' }
    : prix_nuit_fcfa
    ? { value: formatFCFA(prix_nuit_fcfa), suffix: '/nuit' }
    : prix_mois_fcfa
    ? { value: formatFCFA(prix_mois_fcfa), suffix: '/mois' }
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: (index % 4) * 0.1 }}
      className="group relative flex flex-col h-full"
    >
      <div
        className="flex flex-col h-full cursor-pointer"
        onClick={(e) => {
          if (onSelect) {
            e.preventDefault();
            onSelect(id);
          }
        }}
      >
        <Link
          href={`/biens/${id}`}
          className="flex flex-col h-full no-underline"
          onClick={(e) => {
            if (onSelect) {
              e.preventDefault();
            }
          }}
        >
        {/* Master Container */}
        <div className={`relative flex flex-col h-full bg-[var(--surface-card)] rounded-[2rem] overflow-hidden transition-all duration-700 ${!isCompact ? 'border hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)]' : ''} group-active:scale-[0.98] ${isSelected ? 'border-[var(--accent-luxury)] ring-1 ring-[var(--accent-luxury)]' : 'border-[var(--border)]'}`}>

          {/* 1. Image Section */}
          <div className={`relative ${isUltraCompact ? 'aspect-[2.4/1]' : isCompact ? 'aspect-video' : 'aspect-[4/5]'} overflow-hidden bg-[var(--midnight-muted)]`}>
            {photo_url && !imageLoaded && (
              <div className="absolute inset-0 animate-shimmer z-10" aria-hidden="true" />
            )}
            {photo_url ? (
              <Image
                src={photo_url}
                alt={titre}
                fill
                onLoad={() => setImageLoaded(true)}
                className={`object-cover transition-all duration-[1200ms] ease-out group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <MapPin className="w-12 h-12 text-[var(--text-muted)]" />
              </div>
            )}

            {/* Hype Indicator — FOMO effect */}
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-wider text-white">
                <span className="relative flex w-1.5 h-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
                </span>
                Disponible
              </span>
              {index < 3 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-amber-500/20">
                  Rare
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
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/85 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Certifié
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
                    <span className="text-xs font-bold text-[var(--text)]">{nb_pieces} Ch.</span>
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

            <div className="md:hidden mt-auto pt-4 border-t border-[var(--border)]/30">
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
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[var(--accent-luxury)] to-[#d97706] text-white flex items-center justify-center gap-2.5 shadow-xl shadow-[var(--accent-glow)]/30 active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {type_bien.toLowerCase().includes('meublee') || type_bien.toLowerCase().includes('nuit') ? (
                  <>
                    <BedDouble className="w-5 h-5" strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-[0.12em]">Réserver</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-5 h-5" strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-[0.12em]">Visiter maintenant</span>
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
