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
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: typeof Home }> = {
  villa:             { bg: 'bg-indigo-500/15', text: 'text-indigo-300',  dot: 'bg-indigo-400',  icon: Home },
  appartement:       { bg: 'bg-blue-500/15',   text: 'text-blue-300',    dot: 'bg-blue-400',    icon: Building2 },
  studio:            { bg: 'bg-cyan-500/15',   text: 'text-cyan-300',    dot: 'bg-cyan-400',    icon: Warehouse },
  maison:            { bg: 'bg-orange-500/15', text: 'text-orange-300',  dot: 'bg-orange-400',  icon: Home },
  residence_meublee: { bg: 'bg-amber-500/15',  text: 'text-amber-300',   dot: 'bg-amber-400',   icon: Star },
  bureau:            { bg: 'bg-slate-500/15',  text: 'text-slate-300',   dot: 'bg-slate-400',   icon: Building2 },
  commerce:          { bg: 'bg-emerald-500/15',text: 'text-emerald-300', dot: 'bg-emerald-400', icon: Building2 },
  terrain:           { bg: 'bg-lime-500/15',   text: 'text-lime-300',    dot: 'bg-lime-500',    icon: Layers },
}

export function BienCard({
  id, titre, commune, quartier, type_bien,
  prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
  surface_m2, nb_pieces, photo_url, isExclusive = false,
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

  const typeConf = TYPE_CONFIG[type_bien] ?? { bg: 'bg-slate-500/15', text: 'text-slate-300', dot: 'bg-slate-400', icon: Home }

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
          className="bg-[#050510] rounded-[2rem] overflow-hidden border border-white/10 h-full flex flex-col
            transition-shadow duration-300 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
        >
          {/* ── Photo ── */}
          <div className="relative aspect-[4/3] bg-[var(--midnight-muted)] overflow-hidden m-2 rounded-[1.7rem]">

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
                bg-gradient-to-br from-[var(--midnight-muted)] to-[var(--midnight)]">
                <Home className="w-12 h-12 text-white/20" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[var(--accent-luxury)] uppercase tracking-widest italic">
                  Photo à venir
                </span>
              </div>
            )}

            {/* Overlay sombre — visible SEULEMENT au hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-250" />

            {/* Badge type — toujours visible, compact */}
            <div className="absolute top-3 left-3 z-10">
              <span className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                ${typeConf.bg} ${typeConf.text} backdrop-blur-md border border-white/20
              `}>
                <span className={`w-1 h-1 rounded-full ${typeConf.dot} shrink-0`} />
                {TYPES_BIEN_LABELS[type_bien] ?? type_bien}
              </span>
            </div>

            {/* Badge Exclusive — top right */}
            {isExclusive && (
              <div className="absolute top-3 right-12 z-10">
                <span className="bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full
                  text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 border border-white/10">
                  <Star className="w-2.5 h-2.5 text-[var(--accent-luxury)] fill-[var(--accent-luxury)]" />
                  Exclusif
                </span>
              </div>
            )}

            {/* CTA au hover — centre image */}
            <div className="absolute inset-0 flex items-center justify-center z-10
              opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none">
              <span className="bg-white/90 text-[#050510] px-5 py-2 rounded-full text-[10px] font-bold
                flex items-center gap-2 shadow-xl">
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
            <h3 className="font-display font-bold text-white text-base leading-snug mb-3
              group-hover:text-[var(--accent-luxury)] transition-colors duration-200 line-clamp-2">
              {titre}
            </h3>

            {/* Prix — dans le corps de la carte, jamais sur l'image */}
            {prix && (
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-lg font-bold text-white tabular-nums tracking-tight">
                  {prix.value}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent-luxury)]">
                  FCFA{prix.suffix}
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="mt-auto grid grid-cols-2 gap-2 pt-3 border-t border-white/8">
              {surface_m2 && (
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <Ruler className="w-3 h-3 text-[var(--accent-luxury)]/60 shrink-0" />
                  <span className="font-semibold text-white">{surface_m2} m²</span>
                </div>
              )}
              {nb_pieces && (
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <Layers className="w-3 h-3 text-[var(--accent-luxury)]/60 shrink-0" />
                  <span className="font-semibold text-white">{nb_pieces} pièce{nb_pieces > 1 ? 's' : ''}</span>
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
          absolute top-5 right-5 z-40 w-9 h-9 rounded-full flex items-center justify-center
          transition-all duration-200
          ${isFavorited
            ? 'bg-[var(--accent-luxury)] text-white shadow-lg scale-110'
            : 'bg-black/50 backdrop-blur-md border border-white/20 text-white hover:scale-110'
          }
        `}
      >
        <Star
          className={`w-4 h-4 transition-all duration-200 ${isFavorited ? 'fill-white' : ''}`}
          strokeWidth={isFavorited ? 0 : 1.5}
        />
      </button>
    </div>
  )
}
