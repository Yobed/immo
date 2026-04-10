'use client'
import { useRef } from 'react'

interface CardsCarouselProps {
  children: React.ReactNode
  cardWidth?: number
}

export function CardsCarousel({ children, cardWidth = 300 }: CardsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = cardWidth + 16
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <div className="relative -mx-4 sm:mx-0">
      {/* Flèche gauche — masquée sur mobile (swipe natif) */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-8 z-20
          w-9 h-9 rounded-full bg-white border border-[var(--border)] shadow-lg
          items-center justify-center text-[var(--text-muted)]
          hover:border-[var(--primary)] hover:text-[var(--primary)]
          transition-all duration-200 active:scale-95"
        aria-label="Précédent"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="carousel-scroll px-4 sm:px-2"
        style={{ paddingBottom: '12px' }}
      >
        {children}
      </div>

      {/* Flèche droite */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-8 z-20
          w-9 h-9 rounded-full bg-white border border-[var(--border)] shadow-lg
          items-center justify-center text-[var(--text-muted)]
          hover:border-[var(--primary)] hover:text-[var(--primary)]
          transition-all duration-200 active:scale-95"
        aria-label="Suivant"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  )
}
