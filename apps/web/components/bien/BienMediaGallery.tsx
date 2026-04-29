'use client'

import { useState, useEffect, type ComponentType } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BienCarousel } from './BienCarousel'
import { ShortsTrigger } from './ShortsTrigger'
import { FavorisButton } from './FavorisButton'
import {
  MapPin, ArrowLeft, ShieldCheck, Sparkles,
  Camera, Play, RotateCcw, Map as MapIcon, LayoutGrid,
  Maximize, Layers, BedDouble, Bath, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const photos = medias.filter(m => m.type === 'photo')

  // Fermeture au clavier
  useEffect(() => {
    if (!showAllPhotos && lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowAllPhotos(false); setLightboxIndex(null) }
      if (lightboxIndex !== null) {
        if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, photos.length - 1) : 0)
        if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : 0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showAllPhotos, lightboxIndex, photos.length])

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
          onClick={() => photos.length > 0 && setShowAllPhotos(true)}
          style={{ cursor: photos.length > 0 ? 'pointer' : 'default' }}
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
            onClick={e => e.stopPropagation()}
            className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-white/70 text-xs font-medium hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Retour</span>
          </Link>

          {/* Favorites */}
          <div className="absolute top-4 right-4 z-30" onClick={e => e.stopPropagation()}>
            <FavorisButton bienId={bien.id} userId={userId ?? null} />
          </div>

          {/* Bouton Toutes les photos */}
          {photos.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setShowAllPhotos(true) }}
              className="absolute bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-lg hover:bg-slate-100 active:scale-95 transition-all"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Voir les {photos.length} photos
            </button>
          )}
        </motion.div>
      </section>

      {/* ── GALERIE PLEIN ÉCRAN ── */}
      <AnimatePresence>
        {showAllPhotos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-white overflow-y-auto"
          >
            {/* Header sticky */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3.5 flex items-center gap-4 z-10">
              <button
                onClick={() => setShowAllPhotos(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h2 className="font-bold text-slate-900 text-sm leading-none">{bien.titre}</h2>
                <p className="text-slate-400 text-xs mt-0.5">{photos.length} photos</p>
              </div>
            </div>

            {/* Grille 2 colonnes */}
            <div className="columns-2 gap-1.5 p-1.5 pb-8">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="relative w-full mb-1.5 rounded-xl overflow-hidden block focus:outline-none"
                >
                  <img
                    src={photo.url}
                    alt={photo.titre ?? `Photo ${idx + 1}`}
                    className="w-full h-auto object-cover"
                    loading={idx < 4 ? 'eager' : 'lazy'}
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[210] bg-black flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Image */}
            <img
              src={photos[lightboxIndex]?.url}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={e => e.stopPropagation()}
            />

            {/* Fermer */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Précédent */}
            {lightboxIndex > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i - 1 : 0) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Suivant */}
            {lightboxIndex < photos.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i + 1 : 0) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Compteur */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 rounded-full text-white text-xs font-bold">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  {Icon && <Icon className="w-3.5 h-3.5 text-accent-luxury" />}
                  <span className="font-semibold text-white">{stat.value}</span>
                  <span className="text-white/60 text-xs">{stat.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
