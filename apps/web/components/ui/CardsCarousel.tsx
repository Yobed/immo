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
    const amount = cardWidth * 3 + 48
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10
          w-10 h-10 rounded-full bg-white border border-[var(--border)] shadow-md
          flex items-center justify-center text-[var(--text-muted)]
          opacity-0 group-hover/carousel:opacity-100
          hover:border-[var(--primary)] hover:text-[var(--primary)]
          transition-all duration-200"
        aria-label="Précédent"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="carousel-scroll"
        style={{ paddingBottom: '8px' }}
      >
        {children}
      </div>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
          w-10 h-10 rounded-full bg-white border border-[var(--border)] shadow-md
          flex items-center justify-center text-[var(--text-muted)]
          opacity-0 group-hover/carousel:opacity-100
          hover:border-[var(--primary)] hover:text-[var(--primary)]
          transition-all duration-200"
        aria-label="Suivant"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  )
}
