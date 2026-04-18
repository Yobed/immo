'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { MapPin, Ruler, Layers, Star, ArrowUpRight } from 'lucide-react'

interface PremiumBienCardProps {
  id: string
  titre: string
  commune: string
  quartier?: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_vente_fcfa: number | null
  surface_m2: number | null
  nb_pieces: number | null
  photo_url?: string | null
  index?: number
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n)
}

export function PremiumBienCard({
  id, titre, commune, quartier, type_bien,
  prix_mois_fcfa, prix_vente_fcfa,
  surface_m2, nb_pieces, photo_url,
  index = 0
}: PremiumBienCardProps) {
  
  const prix = prix_vente_fcfa
    ? { value: formatFCFA(prix_vente_fcfa), suffix: '' }
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
                <MapPin className="w-8 h-8 text-[var(--text)] opacity-10" />
              </div>
            )}
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent opacity-80" />
            
            {/* Top Label */}
            <div className="absolute top-4 left-4">
              <span className="px-4 py-2 rounded-full bg-[var(--glass-surface)] backdrop-blur-md border border-[var(--glass-border)] text-[11px] font-bold uppercase tracking-wider text-[var(--text)]">
                {TYPES_BIEN_LABELS[type_bien] ?? type_bien.replace('_', ' ')}
              </span>
            </div>

            {/* Price tag */}
            {prix && (
              <div className="absolute bottom-6 left-6">
                <p className="text-3xl font-display font-light text-[var(--text)] leading-none">
                  {prix.value} <span className="text-sm font-sans align-top text-[var(--text-muted)] ml-1">FCFA{prix.suffix}</span>
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-luxury)] uppercase tracking-[0.2em] mb-3">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{commune}{quartier ? ` • ${quartier}` : ''}</span>
                </div>
                <h3 className="font-display text-2xl font-light text-[var(--text)] group-hover:text-[var(--accent-luxury)] transition-colors line-clamp-1">
                  {titre}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center transition-all group-hover:bg-[var(--accent-luxury)] group-hover:border-[var(--accent-luxury)] group-hover:text-white shrink-0 ml-4">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-6 border-t border-[var(--border)]">
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
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
