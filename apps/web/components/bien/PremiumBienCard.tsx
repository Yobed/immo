'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { MapPin, Maximize2, BedDouble } from 'lucide-react'

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
      viewport={{ once: true, margin: "-50px" }}
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
        {/* Master Container: Pure White/Zinc card with diffusion shadow */}
        <div className={`relative flex flex-col h-full bg-[var(--surface-card)] rounded-xl md:rounded-[1.5rem] overflow-hidden transition-all duration-700 ${!isCompact ? 'border hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] hover:-translate-y-2' : ''} group-active:scale-[0.98] ${isSelected ? 'border-[var(--accent-luxury)] ring-1 ring-[var(--accent-luxury)]' : 'border-[var(--border)]'}`}>
          
          {/* 1. Image Architectural Section */}
          <div className={`relative ${isUltraCompact ? 'aspect-[2.4/1]' : isCompact ? 'aspect-video' : 'aspect-[4/3]'} overflow-hidden bg-[var(--midnight-muted)]`}>
            {photo_url ? (
              <Image
                src={photo_url}
                alt={titre}
                fill
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <MapPin className="w-12 h-12 text-[var(--text-muted)]" />
              </div>
            )}
            
            {/* Subtle Vignette - Purely for readability of floating badges if needed, but very thin */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Floating Status Badges */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-[8px] font-bold uppercase tracking-[0.15em] text-white">
                {TYPES_BIEN_LABELS[type_bien] ?? type_bien.replace('_', ' ')}
              </span>
              {is_verifie && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/80 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest border border-white/20">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Certifié
                </span>
              )}
            </div>

            {/* Bottom Floating Info (Visible on hover) */}
            {url_visite_3d && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 px-4 py-2 rounded-full whitespace-nowrap">
                   <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white flex items-center gap-2">
                     <Maximize2 className="w-3 h-3" />
                     Explorer en 3D
                   </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Content Section */}
          <div className={`flex flex-col ${(isCompact || isUltraCompact) ? 'p-2 pt-1.5' : 'p-3 pt-2.5'} bg-inherit`}>

            {/* Commune + Prix sur une seule ligne */}
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-2.5 h-2.5 shrink-0 text-[var(--accent-luxury)]" strokeWidth={3} />
                <span className="text-[10px] font-bold text-[var(--accent-luxury)] uppercase tracking-[0.12em] truncate">
                  {commune}
                </span>
              </div>
              {prix && (
                <span className="text-[12px] font-extrabold text-[var(--accent-luxury)] tracking-tight shrink-0 whitespace-nowrap">
                  {prix.value}
                  {prix.suffix && (
                    <span className="text-[9px] font-bold opacity-60">{prix.suffix}</span>
                  )}
                </span>
              )}
            </div>

            {/* Titre */}
            <h3 className={`font-display ${(isCompact || isUltraCompact) ? 'text-[11px]' : 'text-[13px]'} font-semibold text-[var(--text)] tracking-tight leading-snug line-clamp-2 mb-2`}>
              {titre}
            </h3>

            {/* Stats — masquées si valeur nulle */}
            {(nb_pieces || surface_m2) ? (
              <div className="flex items-center gap-2.5 mt-auto">
                {nb_pieces ? (
                  <div className="flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-[10px] font-semibold text-[var(--text)]">{nb_pieces} Ch.</span>
                  </div>
                ) : null}
                {surface_m2 ? (
                  <div className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-[10px] font-semibold text-[var(--text)]">{surface_m2}m²</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        </Link>
      </div>
    </motion.div>
  )
}
