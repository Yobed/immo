'use client'
import { useRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface CardsCarouselProps {
  children: React.ReactNode
  cardWidth?: number
}

export function CardsCarousel({ children, cardWidth = 300 }: CardsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Cursor Custom (Editorial Vibe)
  const [isHovered, setIsHovered] = useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 }
  const cursorXSpring = useSpring(cursorX, springConfig)
  const cursorYSpring = useSpring(cursorY, springConfig)

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      // Centre le curseur personnalisé sur la souris
      cursorX.set(e.clientX - 32)
      cursorY.set(e.clientY - 32)
    }
    window.addEventListener('mousemove', moveCursor)
    return () => window.removeEventListener('mousemove', moveCursor)
  }, [cursorX, cursorY])

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = cardWidth + 16
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <div 
      className="relative -mx-4 sm:mx-0 group cursor-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glisseur Customisé sur le Carousel (Masqué sur mobile) */}
      <motion.div
        className="hidden md:flex fixed top-0 left-0 w-16 h-16 rounded-full bg-secondary/95 text-white items-center justify-center pointer-events-none z-50 backdrop-blur-md shadow-2xl border border-white/20"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.4,
        }}
        transition={{ opacity: { duration: 0.2 }, scale: { duration: 0.2 } }}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase">Glisser</span>
      </motion.div>

      {/* Flèche gauche — masquée sur mobile (swipe natif) */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-8 z-20
          w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-[var(--border)] shadow-xl
          items-center justify-center text-[var(--text-muted)]
          hover:border-secondary hover:text-secondary hover:bg-[var(--surface-card)]
          transition-all duration-300 active:scale-90"
        aria-label="Précédent"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="carousel-scroll px-4 sm:px-2 pb-6"
      >
        {children}
      </div>

      {/* Flèche droite */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-8 z-20
          w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-[var(--border)] shadow-xl
          items-center justify-center text-[var(--text-muted)]
          hover:border-secondary hover:text-secondary hover:bg-[var(--surface-card)]
          transition-all duration-300 active:scale-90"
        aria-label="Suivant"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  )
}
