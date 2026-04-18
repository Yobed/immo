'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { TYPES_BIEN_LABELS } from '@immo-ci/shared/constants/biens'
import { useState } from 'react'
import { Home, Building2, Warehouse, MapPin, Ruler, Layers, Star, Plus } from 'lucide-react'

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

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n)
}

const TYPE_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: any }> = {
  villa:             { bg: 'bg-indigo-500/20',   text: 'text-indigo-300',  dot: 'bg-indigo-400',  icon: Home },
  appartement:       { bg: 'bg-blue-500/20',     text: 'text-blue-300',    dot: 'bg-blue-400',    icon: Building2 },
  studio:            { bg: 'bg-cyan-500/20',     text: 'text-cyan-300',    dot: 'bg-cyan-400',    icon: Warehouse },
  maison:            { bg: 'bg-orange-500/20',   text: 'text-orange-300',  dot: 'bg-orange-400',  icon: Home },
  residence_meublee: { bg: 'bg-amber-500/20',    text: 'text-amber-300',   dot: 'bg-amber-400',   icon: Star },
  bureau:            { bg: 'bg-slate-500/20',    text: 'text-slate-300',   dot: 'bg-slate-400',   icon: Building2 },
  commerce:          { bg: 'bg-emerald-500/20',  text: 'text-emerald-300', dot: 'bg-emerald-400',  icon: Building2 },
  terrain:           { bg: 'bg-lime-500/20',     text: 'text-lime-300',    dot: 'bg-lime-500',    icon: Layers },
}

export function BienCard({
  id, titre, commune, quartier, type_bien,
  prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
  surface_m2, nb_pieces, photo_url, isExclusive = false,
}: BienCardProps) {
  const isNuitee = !!prix_nuit_fcfa
  const [isFavorited, setIsFavorited] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const prix = isNuitee
    ? { value: formatFCFA(prix_nuit_fcfa!), suffix: '/nuit' }
    : prix_mois_fcfa
    ? { value: formatFCFA(prix_mois_fcfa), suffix: '/mois' }
    : prix_vente_fcfa
    ? { value: formatFCFA(prix_vente_fcfa), suffix: '' }
    : null

  const typeConf = TYPE_CONFIG[type_bien] ?? { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', icon: Home }

  // 3D Tilt & Shine Logic
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], ["8deg", "-8deg"]), { stiffness: 400, damping: 40 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-8deg", "8deg"]), { stiffness: 400, damping: 40 })
  
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], ["-20%", "120%"]), { stiffness: 400, damping: 40 })
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], ["-20%", "120%"]), { stiffness: 400, damping: 40 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  return (
    <div 
      className="relative group perspective-1000" 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
    >
      <Link href={`/biens/${id}`} className="block h-full">
        <motion.article
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="bg-[#050510] rounded-[2rem] overflow-hidden border border-white/10 h-full flex flex-col relative transition-all duration-700 hover:shadow-[0_45px_80px_-20px_rgba(0,0,0,0.5)] bg-clip-padding backdrop-blur-sm"
        >
          {/* Glare Effect */}
          <motion.div 
            className="absolute inset-0 z-30 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-500"
            style={{ 
              background: `radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 60%)`,
              left: glareX,
              top: glareY,
              width: '100%',
              height: '100%',
              filter: 'blur(100px)'
            }}
          />

          {/* ── Photo Section ── */}
          <div className="relative aspect-[4/3] bg-[var(--midnight-muted)] border-b border-[var(--border)] overflow-hidden m-2 rounded-[1.7rem]">
            <AnimatePresence>
              {photo_url ? (
                <Image
                  src={photo_url}
                  alt={titre}
                  fill
                  className="object-cover transition-transform duration-[6000ms] ease-out group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[var(--midnight-muted)] to-[var(--midnight)]">
                  <Home className="w-12 h-12 text-white/20" />
                  <span className="text-[10px] font-bold text-[var(--accent-luxury)] uppercase tracking-widest italic">Clichage en cours...</span>
                </div>
              )}
            </AnimatePresence>

            {/* Premium Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
              <span className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider
                ${typeConf.bg} ${typeConf.text} shadow-lg backdrop-blur-xl border border-white/40
              `}>
                <span className={`w-1.5 h-1.5 rounded-full ${typeConf.dot} shadow-[0_0_8px_${typeConf.dot.split('-')[1]}]`} />
                {TYPES_BIEN_LABELS[type_bien] ?? type_bien}
              </span>

              {isExclusive && (
                <span className="bg-gray-950 text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-2xl border border-white/10">
                  <Star className="w-3 h-3 text-secondary fill-secondary" />
                  Édition Limitée
                </span>
              )}
            </div>

            {/* Price Tag - Glassmorphism */}
            {prix && (
              <div className="absolute bottom-4 left-4 transform translate-z-30">
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-baseline gap-1.5 px-5 py-2.5 rounded-2xl bg-[var(--midnight-muted)]/90 backdrop-blur-2xl shadow-[0_15px_30px_rgba(0,0,0,0.3)] border border-white/20"
                >
                  <span className="font-display text-xl font-bold text-white tabular-nums tracking-tight">
                    {prix.value}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-luxury)]">
                    FCFA{prix.suffix}
                  </span>
                </motion.div>
              </div>
            )}
            
            {/* Hover Action Tooltip */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 pointer-events-none">
              <span className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20">
                Consulter l&apos;offre
                <Plus className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* ── Content Section ── */}
          <div className="p-7 flex flex-col flex-1 relative z-10 h-full">
            {/* Location Line */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--accent-luxury)] uppercase tracking-[0.2em] mb-3">
              <MapPin className="w-3 h-3 mb-0.5" />
              <span>{commune}{quartier ? ` • ${quartier}` : ''}</span>
            </div>

            <h3 className="font-display font-bold text-white text-xl leading-[1.2] mb-5 group-hover:text-[var(--accent-luxury)] transition-colors duration-300 line-clamp-2">
              {titre}
            </h3>

            {/* Stats Grid */}
            <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-white/10">
              {surface_m2 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Surface</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Ruler className="w-4 h-4 text-[var(--accent-luxury)]/80" />
                    {surface_m2} m²
                  </div>
                </div>
              )}
              {nb_pieces && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Pièces</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Layers className="w-4 h-4 text-[var(--accent-luxury)]/80" />
                    <span className="text-sm font-bold text-white">
                      {nb_pieces} {nb_pieces > 1 ? 'Chambres' : 'Chambre'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.article>
      </Link>

      {/* Persistent Action Bar (Favorite) */}
      <div className="absolute top-6 right-6 z-40">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorited(!isFavorited); }}
          className={`
            w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 z-50
            ${isFavorited 
              ? 'bg-[var(--accent-luxury)] text-white shadow-lg shadow-[var(--accent-luxury)]/30 scale-110' 
              : 'bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 hover:text-[var(--accent-luxury)] hover:shadow-xl hover:scale-110'
            }
          `}
        >
          <Star 
            className={`w-5 h-5 transition-all duration-300 ${isFavorited ? 'fill-white' : ''}`} 
            strokeWidth={isFavorited ? 0 : 2}
          />
        </button>
      </div>
    </div>
  )
}
