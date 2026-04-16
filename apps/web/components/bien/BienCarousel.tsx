'use client'
import { useState, useCallback, useEffect } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { Bien360 } from './Bien360'
import { cn } from '@/lib/utils'

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
}

const FILTER_LABELS: Record<FilterType, string> = {
  all:     'Tout',
  photo:   'Photos',
  video:   'Vidéos',
  vue_360: 'Vue 360°',
  plan:    'Plans',
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
    <div className={cn("relative w-full bg-[var(--surface)] overflow-hidden", isHero ? "h-full" : "aspect-[4/3] rounded-card")}>
      <Image
        src={media.url}
        alt={media.titre ?? 'Photo du bien'}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
    </div>
  )
}

export function BienCarousel({ medias, isHero = false }: BienCarouselProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
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

  return (
    <div className={cn("w-full", !isHero && "space-y-3", isHero && "h-full")}>
      {/* Filtres par type - Cachés en Hero */}
      {!isHero && availableTypes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-pill text-sm font-sans border transition-colors',
                activeFilter === filter
                  ? 'bg-primary text-white border-primary'
                  : 'border-[var(--border)] text-muted hover:border-primary/40'
              )}
            >
              {FILTER_LABELS[filter]}
              {filter !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({medias.filter((m) => m.type === filter).length})
                </span>
              )}
            </button>
          ))}
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
                    <div className="absolute top-3 right-3 pointer-events-none">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-pill text-xs font-sans font-medium shadow-sm',
                        BADGE_CLASSES[media.type]
                      )}>
                        {FILTER_LABELS[media.type]}
                      </span>
                    </div>
                  )}
                  {/* Titre du média */}
                  {media.titre && !isHero && (
                    <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                      <span className="bg-black/50 text-white text-xs font-sans px-2 py-1 rounded-pill backdrop-blur-sm">
                        {media.titre}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flèches navigation */}
        {filtered.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-2xl z-30"
              aria-label="Précédent"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-2xl z-30"
              aria-label="Suivant"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
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
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt="" className="w-full h-full object-cover" />
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
