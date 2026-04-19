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
  index = 0
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
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
      className="group relative"
    >
      <Link href={`/biens/${id}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] transition-all duration-500 hover:border-[var(--border-hover)]">
          {/* Image Container */}
          <div className="relative aspect-[4/5] overflow-hidden">
            {photo_url ? (
              <Image
                src={photo_url}
                alt={titre}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-[var(--midnight-light)] flex items-center justify-center">
                <MapPin className="w-8 h-8 text-[var(--text-muted)] opacity-40" />
              </div>
            )}
            
            {/* Overlay Gradient - Darker and more elegant */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/10 to-transparent opacity-90 z-10" />
            
            {/* Top Labels - Fades on hover for better image viewing */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 transition-opacity duration-500 group-hover:opacity-10 z-20">
              <span className="px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-widest text-white shadow-2xl">
                {TYPES_BIEN_LABELS[type_bien] ?? type_bien.replace('_', ' ')}
              </span>
              {type_bien === 'residence_meublee' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C5A059] text-black text-[9px] font-bold uppercase tracking-[0.2em] shadow-2xl border border-white/10">
                  <Star className="w-2.5 h-2.5 fill-black stroke-black" />
                  Prestige
                </span>
              )}
              {url_visite_3d && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/90 backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-widest text-white shadow-2xl">
                  <Maximize2 className="w-2.5 h-2.5" />
                  Visite 3D
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 bg-[var(--surface-card)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-0.5 mb-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--accent-luxury)] uppercase tracking-[0.2em]">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate">{commune}{quartier ? ` • ${quartier}` : ''}</span>
                  </div>
                  {prix && (
                    <p className="text-xl font-display font-bold text-[var(--text)] tracking-tight">
                      {prix.value} <span className="text-[9px] font-sans text-[var(--text-muted)] uppercase tracking-widest ml-1">{prix.suffix === '/nuit' ? 'nuit' : prix.suffix === '/mois' ? 'mois' : 'fcf'}</span>
                    </p>
                  )}
                </div>
                {type_bien === 'residence_meublee' && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#D4AF37] text-[#020617] shadow-lg">
                      <span className="mr-1.5">💎</span> Prestige
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#F97316] text-[#020617] shadow-lg">
                      <span className="mr-1.5">🔥</span> Populaire
                    </span>
                  </div>
                )}
                <h3 className="font-display text-lg font-light text-[var(--text)] group-hover:text-[var(--accent-luxury)] transition-colors line-clamp-1 flex items-center gap-2">
                  {titre}
                  {is_verifie && (
                    <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full p-0.5" title="Bien vérifié par nos équipes">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                        <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center transition-all group-hover:bg-[var(--accent-luxury)] group-hover:border-[var(--accent-luxury)] group-hover:text-[var(--on-accent)] shrink-0 ml-3">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-5 border-t border-[var(--border)]">
              {surface_m2 && (
                <div className="flex items-center gap-2.5">
                  <Ruler className="w-4 h-4 text-[var(--accent-luxury)] opacity-60" />
                  <span className="text-base text-[var(--text-muted)] font-medium">{surface_m2}m²</span>
                </div>
              )}
              {nb_pieces && (
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[var(--accent-luxury)] opacity-60" />
                  <span className="text-base text-[var(--text-muted)] font-medium">{nb_pieces} Ch.</span>
                </div>
              )}
            </div>
            {/* Footnote Quality */}
            {score_ia ? (
              <div className="mt-3 pt-3 border-t border-[var(--border)]/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Score Qualité IA</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-500">{score_ia}%</span>
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
