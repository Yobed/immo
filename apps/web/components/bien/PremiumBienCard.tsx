'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { MapPin, Ruler, Layers, Star, ArrowUpRight, Maximize2 } from 'lucide-react'

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
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n)
}

export function PremiumBienCard({
  id, titre, commune, quartier, type_bien,
  prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
  surface_m2, nb_pieces, photo_url,
  est_disponible = true,
  is_verifie,
  score_ia,
  url_visite_3d,
  index = 0,
  onSelect,
  isSelected
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
        <div className={`relative flex flex-col h-full bg-[var(--surface-card)] rounded-[2rem] overflow-hidden border transition-all duration-700 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] hover:-translate-y-2 group-active:scale-[0.98] ${isSelected ? 'border-[var(--accent-luxury)] ring-1 ring-[var(--accent-luxury)]' : 'border-[var(--border)]'}`}>
          
          {/* 1. Image Architectural Section */}
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--midnight-muted)]">
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
          <div className="flex-1 flex flex-col p-6 pt-5 bg-inherit">
            
            {/* Context & Price Row */}
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-luxury)] uppercase tracking-[0.3em] opacity-80 mb-1">
                  <MapPin className="w-3 h-3" strokeWidth={2.5} />
                  <span className="truncate">{commune}</span>
                  {quartier && <span className="opacity-40">• {quartier}</span>}
                </div>
                <h3 className="font-display text-lg font-medium text-[var(--text)] tracking-tight leading-snug line-clamp-1">
                  {titre}
                </h3>
              </div>
              
              <div className="flex flex-col items-end shrink-0">
                {prix && (
                  <p className="text-xl font-display font-semibold text-[var(--text)] tracking-tighter">
                    {prix.value} 
                    <span className="text-[10px] font-sans text-[var(--text-muted)] uppercase tracking-widest ml-1 font-bold">
                      {prix.suffix.includes('nuit') ? 'nuit' : prix.suffix.includes('mois') ? 'mois' : 'fcf'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Separator / Metrics */}
            <div className="mt-auto pt-5 border-t border-[var(--border)]/50 flex items-center justify-between">
              <div className="flex items-center gap-5">
                {surface_m2 && (
                  <div className="flex items-center gap-2 group/stat">
                    <Ruler className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover/stat:text-[var(--accent-luxury)] transition-colors" />
                    <span className="text-sm text-[var(--text)] font-medium tabular-nums">{surface_m2}m²</span>
                  </div>
                )}
                {nb_pieces && (
                  <div className="flex items-center gap-2 group/stat">
                    <Layers className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover/stat:text-[var(--accent-luxury)] transition-colors" />
                    <span className="text-sm text-[var(--text)] font-medium tabular-nums">{nb_pieces} Ch.</span>
                  </div>
                )}
              </div>

              <div className="w-8 h-8 rounded-full bg-[var(--midnight-muted)] border border-[var(--border)] flex items-center justify-center transition-all duration-500 group-hover:bg-[var(--accent-luxury)] group-hover:text-[var(--on-accent)]">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Quality Indicator (Micro-Interaction) */}
            {score_ia && (
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
