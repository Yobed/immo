'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { Bien360 } from './Bien360'
import { cn } from '@/lib/utils'
import { Camera, Play, Landmark, Map as MapIcon, Maximize2, X, ChevronLeft, ChevronRight, Eye, LayoutGrid } from 'lucide-react'
import * as motion from 'framer-motion/client'

type MediaType = 'photo' | 'video' | 'vue_360' | 'plan'
type FilterType = 'all' | MediaType

interface BienMedia {
  id: string
  type: MediaType
  url: string
  embed_url?: string | null
  titre?: string | null
  hotspots?: Array<{ pitch: number; yaw: number; texte: string }> | null
  duree_sec?: number | null
}

interface BienCarouselProps {
  medias: BienMedia[]
  isHero?: boolean
  externalFilter?: FilterType
}

const FILTER_LABELS: Record<FilterType, string> = {
  all:     'Explorer Tout',
  photo:   'Photographies',
  video:   'Visite Vidéo',
  vue_360: 'Immersion 360°',
  plan:    'Plans & Dimensions',
}

const FILTER_ICONS: Record<FilterType, any> = {
  all:     LayoutGrid,
  photo:   Camera,
  video:   Play,
  vue_360: Eye,
  plan:    MapIcon,
}

const BADGE_CLASSES: Record<MediaType, string> = {
  photo:   'bg-accent-light text-accent',
  video:   'bg-secondary-light text-secondary',
  vue_360: 'bg-purple-100 text-purple-700',
  plan:    'bg-primary-light text-primary',
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function MediaSlide({ media, isHero }: { media: BienMedia, isHero?: boolean }) {
  if (media.type === 'vue_360') {
    return <Bien360 panoramaUrl={media.url} hotspots={media.hotspots ?? []} hauteur={isHero ? 1000 : 400} />
  }

  if (media.type === 'video') {
    // YouTube/Vimeo embed
    if (media.embed_url) {
      return (
        <div className={cn("relative w-full", isHero ? "h-full" : "aspect-video")}>
          <iframe
            src={media.embed_url}
            className={cn("w-full h-full", !isHero && "rounded-card")}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )
    }
    // Supabase Storage video
    return (
      <div className={cn("relative w-full bg-gray-900 overflow-hidden", isHero ? "h-full" : "aspect-video rounded-card")}>
        <video
          src={media.url}
          controls
          className="w-full h-full object-contain"
          preload="metadata"
        />
        {media.duree_sec && (
          <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-mono px-2 py-1 rounded-pill">
            {formatDuration(media.duree_sec)}
          </span>
        )}
      </div>
    )
  }

  if (media.type === 'plan') {
    // PDF ou image
    if (media.url.endsWith('.pdf')) {
      return (
        <div className={cn("w-full overflow-hidden border border-[var(--border)]", isHero ? "h-full" : "aspect-[4/3] rounded-card")}>
          <iframe src={media.url} className="w-full h-full" title="Plan du bien" />
        </div>
      )
    }
    return (
      <div className={cn("relative w-full bg-[var(--surface)] overflow-hidden", isHero ? "h-full" : "aspect-[4/3] rounded-card")}>
        <Image src={media.url} alt="Plan du bien" fill className="object-contain" sizes="100vw" />
      </div>
    )
  }

  // Photo (type='photo')
  return (
    <div className={cn("relative w-full bg-[var(--midnight-muted)] overflow-hidden", isHero ? "h-full" : "aspect-[4/3] rounded-card")}>
      <Image
        src={media.url}
        alt={media.titre ?? 'Photo du bien'}
        fill
        className="object-cover transition-transform duration-[20s] ease-linear group-hover:scale-110"
        sizes="100vw"
        priority
      />
    </div>
  )
}

export function BienCarousel({ medias, isHero = false, externalFilter }: BienCarouselProps) {
  const [internalFilter, setInternalFilter] = useState<FilterType>('all')
  const activeFilter: FilterType = externalFilter ?? internalFilter
  const setActiveFilter = (f: FilterType) => { if (!externalFilter) setInternalFilter(f) }
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })

  const filtered = activeFilter === 'all'
    ? medias
    : medias.filter((m) => m.type === activeFilter)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0)
    emblaApi?.scrollTo(0, true)
  }, [activeFilter, emblaApi])

  if (medias.length === 0) {
    return (
      <div className={cn("w-full bg-[var(--surface)] flex items-center justify-center", isHero ? "h-full" : "aspect-[4/3] rounded-card")}>
        <p className="text-muted font-sans text-sm">Aucun média disponible</p>
      </div>
    )
  }

  // Filtres disponibles (seulement les types présents)
  const availableTypes = Array.from(new Set(medias.map((m) => m.type)))
  const filters: FilterType[] = ['all', ...availableTypes]

  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <div className={cn("w-full relative", !isHero && "space-y-3", isHero && "h-full")}>
      {/* Filtres par type - Nouveau design Premium */}
      {availableTypes.length > 1 && (
        <div className={cn(
          "gap-3 scrollbar-hide z-40 transition-all duration-700",
          isHero
            ? "hidden md:flex absolute bottom-10 left-10 pt-4"
            : "flex overflow-x-auto pb-1"
        )}>
          {filters.map((filter) => {
            const Icon = FILTER_ICONS[filter]
            const count = medias.filter((m) => m.type === filter).length
            if (filter !== 'all' && count === 0) return null
            
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-bold font-display border transition-all duration-500 shadow-2xl backdrop-blur-3xl',
                  activeFilter === filter
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                    : 'bg-black/80 text-white border-white/20 hover:border-[#D4AF37]/50 hover:bg-black'
                )}
              >
                <Icon size={14} className={cn("transition-transform duration-500", activeFilter === filter ? "scale-110" : "")} />
                <span className="[text-shadow:_0_1px_2px_rgb(0_0_0_/_20%)]">{FILTER_LABELS[filter]}</span>
                {filter !== 'all' && (
                  <span className="opacity-60 font-mono text-[9px]">[{count}]</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Carousel principal */}
      <div className={cn("relative group", isHero && "h-full")}>
        <div className={cn("overflow-hidden", !isHero && "rounded-card", isHero && "h-full")} ref={emblaRef}>
          <div className={cn("flex", isHero && "h-full")}>
            {filtered.map((media) => (
              <div key={media.id} className={cn("flex-shrink-0 w-full", !isHero && "pr-2", isHero && "h-full pr-0")}>
                <div className={cn("relative", isHero && "h-full")}>
                  <MediaSlide media={media} isHero={isHero} />
                  {/* Badge type */}
                  {!isHero && (
                    <div className="absolute top-4 right-4 pointer-events-none">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#020617]/90 text-white border border-white/20 backdrop-blur-xl shadow-2xl">
                        {FILTER_LABELS[media.type] || media.type.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Titre du média */}
                  {media.titre && !isHero && (
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-medium tracking-wide bg-[#020617]/90 text-white border border-white/10 backdrop-blur-xl shadow-2xl">
                        {media.titre}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flèches navigation - Style Éditorial */}
        {filtered.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#020617]/40 hover:bg-[#020617]/80 backdrop-blur-xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-110 shadow-2xl z-40 pointer-events-auto"
              aria-label="Précédent"
            >
              <ChevronLeft size={24} className="text-white" strokeWidth={1.5} />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#020617]/40 hover:bg-[#020617]/80 backdrop-blur-xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-110 shadow-2xl z-40 pointer-events-auto"
              aria-label="Suivant"
            >
              <ChevronRight size={24} className="text-white" strokeWidth={1.5} />
            </button>
          </>
        )}

        {/* Compteur */}
        {filtered.length > 1 && (
          <div className={cn(
            "absolute font-display font-black tracking-tighter z-30",
            isHero ? "bottom-10 right-10 text-white text-4xl opacity-40" : "bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-pill"
          )}>
            {selectedIndex + 1} <span className="text-[0.6em] opacity-50">/</span> {filtered.length}
          </div>
        )}
      </div>

      {/* Miniatures - Cachées en Hero */}
      {!isHero && filtered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filtered.map((media, idx) => (
            <button
              key={media.id}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={cn(
                'flex-shrink-0 w-16 h-12 rounded-btn overflow-hidden border-2 transition-colors',
                idx === selectedIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-80'
              )}
            >
              {(media.type === 'photo' || media.type === 'vue_360') ? (
                <div className="relative w-full h-full">
                  <Image src={media.url} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ) : (
                <div className={cn('w-full h-full flex items-center justify-center text-xs font-sans', BADGE_CLASSES[media.type])}>
                  {FILTER_LABELS[media.type]}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Dots pour mobile */}
      {!isHero && filtered.length > 1 && filtered.length <= 10 && (
        <div className="flex justify-center gap-1.5 sm:hidden">
          {filtered.map((_, idx) => (
            <button
              key={idx}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                idx === selectedIndex ? 'bg-primary' : 'bg-[var(--border)]'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
