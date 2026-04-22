'use client'

import { useState, type ComponentType } from 'react'
import Link from 'next/link'
import { BienCarousel } from './BienCarousel'
import { ShortsTrigger } from './ShortsTrigger'
import { FavorisButton } from './FavorisButton'
import {
  MapPin, ArrowLeft, ShieldCheck, Sparkles,
  Camera, Play, RotateCcw, Map as MapIcon, LayoutGrid,
  Maximize, Layers, BedDouble, Bath,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type FilterType = 'all' | 'photo' | 'video' | 'vue_360' | 'plan'

interface BienMedia {
  id: string; type: string; url: string
  embed_url?: string | null; titre?: string | null
  hotspots?: { pitch: number; yaw: number; texte: string }[] | null
  duree_sec?: number | null
}

interface Stat {
  label: string
  value: string | number
  key: string
}

const STAT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  surface: Maximize,
  pieces: Layers,
  chambres: BedDouble,
  bains: Bath,
}

interface BienMediaGalleryProps {
  medias: BienMedia[]
  bien: {
    id: string; titre: string; commune: string
    quartier?: string | null; type_bien: string
    is_verifie?: boolean; url_visite_3d?: string | null
  }
  prix: { value: string; suffix: string } | null
  stats: Stat[]
  typeLabel: string
  userId?: string | null
}

const TAB_LABELS: Partial<Record<FilterType, string>> = {
  all: 'Tout', photo: 'Photos', video: 'Vidéos', vue_360: '360°', plan: 'Plan',
}
const TAB_ICONS: Partial<Record<FilterType, React.ComponentType<{ className?: string }>>> = {
  all: LayoutGrid, photo: Camera, video: Play, vue_360: RotateCcw, plan: MapIcon,
}

export function BienMediaGallery({
  medias, bien, prix, stats, typeLabel, userId,
}: BienMediaGalleryProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const availableTypes = Array.from(new Set(medias.map(m => m.type))) as FilterType[]
  const hasMultipleTypes = availableTypes.length > 1

  const tabKeys: FilterType[] = hasMultipleTypes ? ['all', ...availableTypes] : []

  const videoMedias = medias.filter(m => m.type === 'video')

  const tabCount = (key: FilterType) =>
    key === 'all' ? medias.length : medias.filter(m => m.type === key).length

  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative h-[50vh] md:h-[75vh] overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="w-full h-full relative"
        >
          {medias.length > 0 ? (
            <BienCarousel
              medias={medias.map(m => ({
                id: m.id, type: m.type as any, url: m.url,
                embed_url: m.embed_url, titre: m.titre,
                hotspots: m.hotspots, duree_sec: m.duree_sec,
              }))}
              isHero={true}
              externalFilter={filter}
            />
          ) : (
            <div className="w-full h-full bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-accent-luxury/20" />
            </div>
          )}

          {/* Gradient bottom */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#020617] via-[#020617]/55 to-transparent pointer-events-none z-10" />

          {/* Titre + prix overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 md:px-8 md:pb-7 z-20 pointer-events-none">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin className="w-3 h-3 text-accent-luxury" />
                {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur border border-white/10 text-[8px] font-bold uppercase tracking-widest text-white/60">
                {typeLabel}
              </span>
              {bien.is_verifie && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/70 backdrop-blur text-white text-[8px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-2.5 h-2.5" /> Certifié
                </span>
              )}
            </div>
            <h1 className="font-display text-xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-1.5 drop-shadow-lg line-clamp-2">
              {bien.titre}
            </h1>
            {prix && (
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg md:text-3xl font-display font-bold text-accent-luxury tracking-tight">
                  {prix.value}
                </span>
                {prix.suffix && <span className="text-white/50 text-sm">{prix.suffix}</span>}
              </div>
            )}
          </div>

          {/* Back button */}
          <Link
            href="/biens"
            className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white/70 text-xs font-medium hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Retour</span>
          </Link>

          {/* Favorites */}
          <div className="absolute top-4 right-4 z-30">
            <FavorisButton bienId={bien.id} userId={userId ?? null} />
          </div>
        </motion.div>
      </section>

      {/* ─── ONGLETS MÉDIAS ─── */}
      {tabKeys.length > 0 && (
        <div className="bg-[#020617] border-b border-white/5 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[1400px] mx-auto">
            {tabKeys.map(key => {
              const Icon = TAB_ICONS[key]!
              const count = tabCount(key)
              const isActive = filter === key
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold shrink-0 transition-all',
                    isActive
                      ? 'bg-accent-luxury text-black'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {TAB_LABELS[key]}
                  <span className={cn('text-[9px]', isActive ? 'opacity-60' : 'opacity-40')}>{count}</span>
                </button>
              )
            })}

            {/* Shortcut to full-screen shorts player for videos */}
            {videoMedias.length > 0 && (
              <ShortsTrigger
                videos={videoMedias.map(v => ({
                  id: v.id, url: v.url, title: bien.titre,
                  price: prix ? prix.value + prix.suffix : '',
                  location: bien.commune, propertyId: bien.id,
                }))}
                className="!p-0 !bg-transparent !border-0 !shadow-none !rounded-none"
              >
                <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0">
                  <Play className="w-3 h-3 fill-accent-luxury text-accent-luxury" />
                  Plein écran
                </span>
              </ShortsTrigger>
            )}

            {/* 3D / 360° shortcut */}
            {bien.url_visite_3d && (
              <a
                href="#visite-3d"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
              >
                <RotateCcw className="w-3 h-3 text-accent-luxury" />
                Visite 3D
              </a>
            )}
          </div>
        </div>
      )}

      {/* ─── STATS INLINE ─── */}
      {stats.length > 0 && (
        <div className="bg-[#020617] px-4 py-4 md:px-6 border-b border-white/5">
          <div className="flex flex-wrap gap-x-5 gap-y-2 max-w-[1400px] mx-auto">
            {stats.map((stat, i) => {
              const Icon = STAT_ICONS[stat.key]
              return (
                <div key={i} className="flex items-center gap-1.5 text-sm">
                  {Icon && <Icon className="w-3.5 h-3.5 text-accent-luxury/70" />}
                  <span className="font-semibold text-white/80">{stat.value}</span>
                  <span className="text-white/30 text-xs">{stat.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
