'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { useState } from 'react'
import { Home, Building2, Warehouse, MapPin, Ruler, Layers, Star, ArrowRight } from 'lucide-react'
import { formatFCFA } from '@/lib/format'

interface BienCardProps {
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
  photo_url?: string | null
  statut?: string
  isExclusive?: boolean
  isVerified?: boolean
  aiScore?: number
  url_visite_3d?: string | null
}

// Unified type badge palette — no Tailwind colour wheel salad.
// Type is conveyed by the icon and label; the chip uses the surface token.
const TYPE_CONFIG: Record<string, { icon: typeof Home }> = {
  villa:             { icon: Home },
  appartement:       { icon: Building2 },
  studio:            { icon: Warehouse },
  maison:            { icon: Home },
  residence_meublee: { icon: Star },
  bureau:            { icon: Building2 },
  commerce:          { icon: Building2 },
  terrain:           { icon: Layers },
}

export function BienCard({
  id, titre, commune, quartier, type_bien,
  prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
  surface_m2, nb_pieces, photo_url, isExclusive = false, isVerified = false, aiScore,
  url_visite_3d,
}: BienCardProps) {
  const isNuitee = !!prix_nuit_fcfa
  const [isFavorited, setIsFavorited] = useState(false)

  const prix = isNuitee
    ? { value: formatFCFA(prix_nuit_fcfa!, false), suffix: '/nuit' }
    : prix_mois_fcfa
    ? { value: formatFCFA(prix_mois_fcfa, false), suffix: '/mois' }
    : prix_vente_fcfa
    ? { value: formatFCFA(prix_vente_fcfa, false), suffix: '' }
    : null

  const typeConf = TYPE_CONFIG[type_bien] ?? { icon: Home }

  // 3D tilt — useReducedMotion() = hook Framer Motion, safe SSR + hydration
  const prefersReduced = useReducedMotion()
  const TILT = prefersReduced ? 0 : 5

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [`${TILT}deg`, `-${TILT}deg`]), { stiffness: 500, damping: 50 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [`-${TILT}deg`, `${TILT}deg`]), { stiffness: 500, damping: 50 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div
      className="relative group perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/biens/${id}`} className="block h-full">
        <motion.article
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="bg-[var(--surface-card)] rounded-[var(--radius-2xl)] overflow-hidden border border-[var(--border)] h-full flex flex-col
            transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]"
        >
          {/* ── Photo ── */}
          <div className="relative aspect-[3/2] md:aspect-[4/3] bg-[var(--surface-hover)] overflow-hidden m-2 rounded-[var(--radius-xl)]">

            {photo_url ? (
              <Image
                src={photo_url}
                alt={titre}
                fill
                className="object-cover transition-transform duration-[5000ms] ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3
                bg-[var(--surface-hover)]">
                <Home className="w-12 h-12 text-[var(--text-muted)]/40" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[var(--accent-luxury)] uppercase tracking-widest italic">
                  Photo à venir
                </span>
              </div>
            )}

            {/* Overlay sombre — visible SEULEMENT au hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-250" />

            {/* Badges — Fades on hover for clean image viewing */}
            <div className="transition-opacity duration-500 group-hover:opacity-10">
              {/* Badge type — uniform chip, icon carries the type meaning */}
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-black/55 text-white border border-white/15">
                  <typeConf.icon className="w-2.5 h-2.5" />
                  {TYPES_BIEN_LABELS[type_bien] ?? type_bien}
                </span>
              </div>

              {/* Badges de confiance */}
              <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                {isVerified && (
                  <div className="bg-[var(--success-soft)] text-[var(--success)] px-2.5 py-1 rounded-full
                    text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 border border-[var(--success)]/30">
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Vérifié
                  </div>
                )}
                {isExclusive && (
                  <div className="bg-[var(--surface-card)]/70 backdrop-blur-md text-[var(--text)] px-2.5 py-1 rounded-full
                    text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 border border-[var(--border)]">
                    <Star className="w-2.5 h-2.5 text-[var(--accent-luxury)] fill-[var(--accent-luxury)]" />
                    Exclusif
                  </div>
                )}
                {url_visite_3d && (
                  <div className="bg-[var(--accent-luxury)]/90 backdrop-blur-md text-[var(--on-accent)] px-2.5 py-1 rounded-full
                    text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                    </span>
                    Visite 3D
                  </div>
                )}
              </div>
            </div>

            {/* CTA au hover — centre image */}
            <div className="absolute inset-0 flex items-center justify-center z-10
              opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none">
              <span className="bg-white/90 text-slate-900 px-5 py-2 rounded-full text-[10px] font-bold
                flex items-center gap-2 shadow-md">
                Voir le bien
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* ── Contenu — en dehors de l'image ── */}
          <div className="px-5 pb-5 pt-4 flex flex-col flex-1 relative z-10">

            {/* Localisation */}
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--accent-luxury)]
              uppercase tracking-[0.2em] mb-2">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              {commune}{quartier ? ` · ${quartier}` : ''}
            </div>

            {/* Titre */}
            <h3 className="font-display font-bold text-off-white text-base leading-snug mb-3
              group-hover:text-[var(--accent-luxury)] transition-colors duration-200 line-clamp-2">
              {titre}
            </h3>

            {/* Prix et Score IA */}
            <div className="flex items-center justify-between mb-4">
              {prix && (
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-lg font-bold text-off-white tabular-nums tracking-tight">
                    {prix.value}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent-luxury)]">
                    FCFA{prix.suffix}
                  </span>
                </div>
              )}
              
              {aiScore !== undefined && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-off-white/5 border border-off-white/10" title="BOGBE'S GROUPE Quality Score">
                  <div className="text-[10px] font-bold text-off-white/50 uppercase tracking-tighter">IA</div>
                  <div className="text-[11px] font-bold text-[var(--accent-luxury)]">{aiScore}%</div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t border-off-white/8">
              {surface_m2 && (
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <Ruler className="w-3 h-3 text-[var(--accent-luxury)]/60 shrink-0" />
                  <span className="font-semibold text-off-white">{surface_m2} m²</span>
                </div>
              )}
              {nb_pieces && (
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <Layers className="w-3 h-3 text-[var(--accent-luxury)]/60 shrink-0" />
                  <span className="font-semibold text-off-white">{nb_pieces} pièce{nb_pieces > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </motion.article>
      </Link>

      {/* Bouton Favori */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorited(f => !f) }}
        aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        aria-pressed={isFavorited}
        className={`
          absolute top-3 right-3 z-40 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center
          transition-all duration-200
          ${isFavorited
            ? 'bg-[var(--accent-luxury)] text-[var(--on-accent)] shadow-lg scale-110'
            : 'bg-black/40 backdrop-blur-md border border-white/20 text-white hover:scale-110'
          }
        `}
      >
        <Star
          className={`w-[18px] h-[18px] transition-all duration-200 ${isFavorited ? 'fill-current' : ''}`}
          strokeWidth={isFavorited ? 0 : 1.5}
        />
      </button>
    </div>
  )
}
