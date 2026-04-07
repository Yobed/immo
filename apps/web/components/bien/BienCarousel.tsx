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

function MediaSlide({ media }: { media: BienMedia }) {
  if (media.type === 'vue_360') {
    return <Bien360 panoramaUrl={media.url} hotspots={media.hotspots ?? []} hauteur={400} />
  }

  if (media.type === 'video') {
    // YouTube/Vimeo embed
    if (media.embed_url) {
      return (
        <div className="relative w-full aspect-video">
          <iframe
            src={media.embed_url}
            className="w-full h-full rounded-card"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )
    }
    // Supabase Storage video
    return (
      <div className="relative w-full aspect-video bg-gray-900 rounded-card overflow-hidden">
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
        <div className="w-full aspect-[4/3] rounded-card overflow-hidden border border-[var(--border)]">
          <iframe src={media.url} className="w-full h-full" title="Plan du bien" />
        </div>
      )
    }
    return (
      <div className="relative w-full aspect-[4/3] bg-[var(--surface)] rounded-card overflow-hidden">
        <Image src={media.url} alt="Plan du bien" fill className="object-contain" sizes="100vw" />
      </div>
    )
  }

  // Photo (type='photo')
  return (
    <div className="relative w-full aspect-[4/3] bg-[var(--surface)] rounded-card overflow-hidden">
      <Image
        src={media.url}
        alt={media.titre ?? 'Photo du bien'}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 800px"
        priority
      />
    </div>
  )
}

export function BienCarousel({ medias }: BienCarouselProps) {
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

  // Filtres disponibles (seulement les types présents)
  const availableTypes = Array.from(new Set(medias.map((m) => m.type)))
  const filters: FilterType[] = ['all', ...availableTypes]

  if (medias.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-[var(--surface)] rounded-card flex items-center justify-center">
        <p className="text-muted font-sans text-sm">Aucun média disponible</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      {/* Filtres par type */}
      {availableTypes.length > 1 && (
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
      <div className="relative group">
        <div className="overflow-hidden rounded-card" ref={emblaRef}>
          <div className="flex">
            {filtered.map((media) => (
              <div key={media.id} className="flex-shrink-0 w-full pr-2 last:pr-0">
                <div className="relative">
                  <MediaSlide media={media} />
                  {/* Badge type */}
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-pill text-xs font-sans font-medium shadow-sm',
                      BADGE_CLASSES[media.type]
                    )}>
                      {FILTER_LABELS[media.type]}
                    </span>
                  </div>
                  {/* Titre du média */}
                  {media.titre && (
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Précédent"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11 2L5 8l6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Suivant"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}

        {/* Compteur */}
        {filtered.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded-pill">
            {selectedIndex + 1} / {filtered.length}
          </div>
        )}
      </div>

      {/* Miniatures */}
      {filtered.length > 1 && (
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
      {filtered.length > 1 && filtered.length <= 10 && (
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
