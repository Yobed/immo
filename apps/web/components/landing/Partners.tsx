'use client'
import { useRef } from 'react'

const partners = [
  {
    name: 'Wave',
    tagline: 'Paiement mobile',
    color: '#1A6BF5',
    bg: '#EBF2FF',
    border: '#C3D8FF',
    logo: (
      <svg viewBox="0 0 60 24" fill="none" className="h-7 w-auto">
        {/* Wave stylized W */}
        <path d="M4 18 L10 6 L16 14 L22 6 L28 18" stroke="#1A6BF5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <text x="33" y="18" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="13" fill="#1A6BF5">Wave</text>
      </svg>
    ),
  },
  {
    name: 'Orange Money',
    tagline: 'Mobile money',
    color: '#FF6600',
    bg: '#FFF3EB',
    border: '#FFD0B0',
    logo: (
      <svg viewBox="0 0 80 24" fill="none" className="h-7 w-auto">
        <circle cx="12" cy="12" r="10" fill="#FF6600"/>
        <circle cx="12" cy="12" r="6" fill="white" opacity="0.9"/>
        <circle cx="12" cy="12" r="3" fill="#FF6600"/>
        <text x="27" y="17" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="11" fill="#FF6600">Orange</text>
        <text x="27" y="29" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="11" fill="#FF6600">Money</text>
      </svg>
    ),
  },
  {
    name: 'MTN',
    tagline: 'Mobile money',
    color: '#FFCC00',
    bg: '#FFFBE0',
    border: '#FFE680',
    logo: (
      <svg viewBox="0 0 56 24" fill="none" className="h-7 w-auto">
        <rect x="0" y="4" width="56" height="16" rx="4" fill="#FFCC00"/>
        <text x="6" y="17" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="13" fill="#000" letterSpacing="1">MTN</text>
      </svg>
    ),
  },
  {
    name: 'Moov Money',
    tagline: 'Paiement mobile',
    color: '#0066CC',
    bg: '#EBF0FF',
    border: '#B3CCFF',
    logo: (
      <svg viewBox="0 0 84 24" fill="none" className="h-7 w-auto">
        <circle cx="12" cy="12" r="10" fill="#0066CC"/>
        <path d="M7 12 L10 8 L12 12 L14 8 L17 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <text x="27" y="17" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="11" fill="#0066CC">Moov</text>
        <text x="27" y="29" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="11" fill="#0066CC">Money</text>
      </svg>
    ),
  },
  {
    name: 'CinetPay',
    tagline: 'Agrégateur CI',
    color: '#E10F28',
    bg: '#FFEBEE',
    border: '#FFB3BB',
    logo: (
      <svg viewBox="0 0 76 24" fill="none" className="h-7 w-auto">
        <rect x="0" y="2" width="22" height="20" rx="4" fill="#E10F28"/>
        <text x="3" y="17" fontFamily="system-ui,sans-serif" fontWeight="900" fontSize="12" fill="white">C</text>
        <text x="27" y="17" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="13" fill="#E10F28">CinetPay</text>
      </svg>
    ),
  },
  {
    name: 'Cloudinary',
    tagline: 'Stockage médias',
    color: '#3448C5',
    bg: '#ECEEFF',
    border: '#BBC5FF',
    logo: (
      <svg viewBox="0 0 92 24" fill="none" className="h-7 w-auto">
        {/* Cloud icon */}
        <path d="M5 16a4 4 0 01-.5-8 5.5 5.5 0 0110.6-1.5A3 3 0 0118 13a3 3 0 01-3 3H5z" fill="#3448C5" opacity="0.9"/>
        <text x="22" y="17" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="12" fill="#3448C5">Cloudinary</text>
      </svg>
    ),
  },
]

export function Partners() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  return (
    <section className="py-16 bg-white border-t border-[var(--border)]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-2">
            Intégrations
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--primary)] mb-2">
            Nos partenaires
          </h2>
          <p className="font-sans text-muted text-sm max-w-md mx-auto">
            Les solutions de paiement et services les plus utilisés en Côte d&apos;Ivoire.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Arrows */}
          <button type="button" onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[var(--border)] shadow-md flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button type="button" onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[var(--border)] shadow-md flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Scroll track */}
          <div ref={scrollRef} className="carousel-scroll px-8">
            {partners.map((p) => (
              <div key={p.name}
                className="shrink-0 w-44 flex flex-col items-center gap-3 p-5 rounded-[16px] border transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default"
                style={{ backgroundColor: p.bg, borderColor: p.border }}
              >
                {/* Logo */}
                <div className="flex items-center justify-center h-10">
                  {p.logo}
                </div>
                {/* Name */}
                <div className="text-center">
                  <p className="font-sans font-bold text-sm" style={{ color: p.color }}>{p.name}</p>
                  <p className="font-sans text-xs text-muted mt-0.5">{p.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
