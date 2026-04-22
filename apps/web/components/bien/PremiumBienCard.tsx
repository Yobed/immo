'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { MapPin, Ruler, Layers, Star, ArrowUpRight, Maximize2, BedDouble, ShowerHead, Square } from 'lucide-react'

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
        <div className={`relative flex flex-col h-full bg-[var(--surface-card)] rounded-[1.5rem] overflow-hidden transition-all duration-700 ${!isCompact ? 'border hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] hover:-translate-y-2' : ''} group-active:scale-[0.98] ${isSelected ? 'border-[var(--accent-luxury)] ring-1 ring-[var(--accent-luxury)]' : 'border-[var(--border)]'}`}>
          
          {/* 1. Image Architectural Section */}
          <div className={`relative ${isUltraCompact ? 'aspect-[2.4/1]' : isCompact ? 'aspect-video' : 'aspect-[4/5]'} overflow-hidden bg-[var(--midnight-muted)]`}>
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
            
            {/* Floating Status Badges - Repositioned and Minimalist */}
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
              <div className="flex flex-col gap-2">
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                  {TYPES_BIEN_LABELS[type_bien] ?? type_bien.replace('_', ' ')}
                </span>
                {is_verifie && (
                  <span className="w-fit flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/80 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest border border-white/20">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    Certifié
                  </span>
                )}
              </div>
              
              {score_ia && score_ia > 90 && (
                <div className="bg-[var(--accent-luxury)]/90 backdrop-blur-md px-2 py-2 rounded-full border border-white/20 shadow-xl">
                  <Star className="w-3 h-3 fill-black stroke-black" />
                </div>
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

          {/* 2. Content Section - Gallery Style */}
          <div className={`flex flex-col ${(isCompact || isUltraCompact) ? 'p-3 pt-1.5' : 'p-4 pt-3'} bg-inherit`}>
            
            {/* Context & Price Row - Stacked for better readability */}
            <div className="flex flex-col gap-2.5 mb-3">
              {/* Location - Bigger and clearer */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-luxury)] uppercase tracking-[0.15em]">
                <MapPin className="w-2.5 h-2.5 shrink-0" strokeWidth={3} />
                <span className="truncate">{commune}</span>
                {quartier && <span className="opacity-60 truncate"> <span className="mx-1">•</span> {quartier}</span>}
              </div>
              
              {/* Title & Price - Clear distinction */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-start gap-2">
                  <h3 className={`font-display ${(isCompact || isUltraCompact) ? 'text-[14px]' : 'text-[16px]'} font-semibold text-[var(--text)] tracking-tight leading-snug line-clamp-2 flex-1`}>
                    {titre}
                  </h3>
                  {prix && (
                    <div className="bg-[var(--accent-luxury)]/10 px-3 py-1.5 rounded-xl border border-[var(--accent-luxury)]/20 shrink-0 shadow-sm backdrop-blur-sm">
                      <span className="text-[15px] font-sans font-extrabold text-[var(--accent-luxury)] tracking-tight">
                        {prix.value}
                      </span>
                    </div>
                  )}
                </div>
                
                {prix && !(isCompact || isUltraCompact) && (
                  <span className="text-[9px] font-sans text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold mt-0.5">
                    {prix.suffix ? `Prix ${prix.suffix}` : 'Prix Total (FCFA)'}
                  </span>
                )}
              </div>
            </div>

            {/* Icons & Features - Optimized for small size */}
            <div className="grid grid-cols-2 gap-y-2.5 mt-auto">
              <div className="flex items-center gap-2.5 group-hover:translate-x-0.5 transition-transform duration-300">
                <BedDouble className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-luxury)] transition-colors" />
                <span className="text-[11px] font-semibold text-[var(--text)] tracking-wide">
                  {nb_pieces || 0} Ch.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShowerHead className="w-4 h-4 text-[var(--text-muted)] mt-[-1px]" />
                <span className="text-[11px] font-semibold text-[var(--text)]">
                  {nb_salles_bain || 0} Sdb
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Maximize2 className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-[11px] font-semibold text-[var(--text)] uppercase">
                  {surface_m2 ? `${surface_m2}m²` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Square className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-[11px] font-semibold text-[var(--text)] uppercase tracking-tighter">
                  {type_bien}
                </span>
              </div>
            </div>

            {!isCompact && !isUltraCompact && (
              <div className="mt-4 pt-3 border-t border-[var(--border)]/50 flex items-center justify-end">
                <div className="w-7 h-7 rounded-full bg-[var(--midnight-muted)] border border-[var(--border)] flex items-center justify-center transition-all duration-500 group-hover:bg-[var(--accent-luxury)] group-hover:text-[var(--on-accent)]">
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* Quality Indicator (Micro-Interaction) */}
            {score_ia && !isCompact && !isUltraCompact && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-[2px] bg-[var(--border)] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${score_ia}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
                    className="h-full bg-emerald-500/60"
                  />
                </div>
                <span className="text-[9px] font-mono text-[var(--text-muted)] font-bold tracking-tighter uppercase">High Rating</span>
              </div>
            )}
          </div>
        </div>
        </Link>
      </div>
    </motion.div>
  )
}
