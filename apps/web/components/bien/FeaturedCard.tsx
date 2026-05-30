'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { MapPin, ArrowRight } from 'lucide-react'

interface FeaturedCardProps {
  id: string
  titre: string
  commune: string
  quartier?: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_nuit_fcfa?: number | null
  prix_vente_fcfa: number | null
  photo_url?: string | null
  is_verifie?: boolean
}

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n)
}

export function FeaturedCard({
  id, titre, commune, quartier, type_bien,
  prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
  photo_url, is_verifie,
}: FeaturedCardProps) {
  const prix = prix_vente_fcfa
    ? { value: formatFCFA(prix_vente_fcfa), suffix: '' }
    : prix_nuit_fcfa
    ? { value: formatFCFA(prix_nuit_fcfa), suffix: '/nuit' }
    : prix_mois_fcfa
    ? { value: formatFCFA(prix_mois_fcfa), suffix: '/mois' }
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="col-span-2 mb-1"
    >
      <Link href={`/biens/${id}`} className="block relative rounded-2xl overflow-hidden group active:scale-[0.99] transition-transform">

        {/* Image */}
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          {photo_url ? (
            <Image
              src={photo_url}
              alt={titre}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="w-full h-full bg-[var(--midnight-muted)]" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
              {TYPES_BIEN_LABELS[type_bien] ?? type_bien.replace('_', ' ')}
            </span>
            {is_verifie && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/70 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                Certifié
              </span>
            )}
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <p className="text-[9px] font-bold text-[var(--accent-luxury)] uppercase tracking-[0.35em] mb-1.5">
              Sélection du moment
            </p>
            <h2 className="font-display text-[20px] md:text-[26px] font-bold text-white leading-tight tracking-tight line-clamp-2 mb-2">
              {titre}
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 text-[11px] text-white/65 font-sans">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{commune}{quartier ? ` · ${quartier}` : ''}</span>
              </div>
              {prix && (
                <span className="text-[14px] font-extrabold text-[var(--accent-luxury)] tracking-tight shrink-0 ml-3">
                  {prix.value}
                  {prix.suffix && <span className="text-[10px] font-semibold opacity-70">{prix.suffix}</span>}
                </span>
              )}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-luxury)] rounded-full text-[11px] font-bold text-[var(--text)] uppercase tracking-[0.2em] shadow-lg">
              Voir ce bien
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
