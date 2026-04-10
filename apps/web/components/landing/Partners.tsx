'use client'
import Image from 'next/image'
import { useRef } from 'react'
import { useInView } from '@/hooks/useInView'

const partners = [
  {
    name: 'Wave',
    tagline: 'Paiement mobile',
    logo: '/logos/wave.svg',
    bg: '#E6F9FF',
    border: '#99E5F7',
    logoSize: { w: 60, h: 60 },
  },
  {
    name: 'Orange Money',
    tagline: 'Mobile money',
    logo: '/logos/orange-money.svg',
    bg: '#FFF3EB',
    border: '#FFD0B0',
    logoSize: { w: 130, h: 40 },
  },
  {
    name: 'MTN Mobile Money',
    tagline: 'Mobile money',
    logo: '/logos/mtn.svg',
    bg: '#FFFBE0',
    border: '#FFE680',
    logoSize: { w: 130, h: 65 },
  },
  {
    name: 'Moov Money',
    tagline: 'Paiement mobile',
    logo: '/logos/moov-money.svg',
    bg: '#FFF0E6',
    border: '#FFD0A8',
    logoSize: { w: 65, h: 65 },
  },
  {
    name: 'CinetPay',
    tagline: 'Agrégateur CI',
    logo: null,
    bg: '#FFEBEE',
    border: '#FFB3BB',
    logoSize: { w: 110, h: 40 },
    customLogo: (
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-xl" style={{ background: 'linear-gradient(135deg,#E10F28,#FF4444)' }}>C</div>
        <span className="font-black text-lg" style={{ color: '#E10F28' }}>CinetPay</span>
      </div>
    ),
  },
  {
    name: 'Cloudinary',
    tagline: 'Stockage médias',
    logo: null,
    bg: '#ECEEFF',
    border: '#BBC5FF',
    logoSize: { w: 120, h: 40 },
    customLogo: (
      <div className="flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M6.5 19a4.5 4.5 0 010-9 .5.5 0 00.5-.5 6.5 6.5 0 0112.42-2A4.5 4.5 0 0118.5 19H6.5z" fill="#3448C5"/>
          <path d="M9 14l3-3 3 3M12 11v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-bold text-sm" style={{ color: '#3448C5' }}>Cloudinary</span>
      </div>
    ),
  },
]

export function Partners() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { ref, visible } = useInView(0.1)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' })
  }

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-16 bg-white border-t border-[#E2E7F3]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-10 sr sr-up ${visible ? 'visible' : ''}`}>
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
        <div
          className={`sr sr-up ${visible ? 'visible' : ''} relative`}
          style={{ transitionDelay: visible ? '120ms' : '0ms' }}
        >
          {/* Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

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
          <div ref={scrollRef} className="carousel-scroll px-10 py-2">
            {partners.map((p, i) => (
              <div
                key={p.name}
                className={`sr sr-scale ${visible ? 'visible' : ''} shrink-0 w-48 flex flex-col items-center justify-center gap-3 p-5 rounded-[16px] border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg cursor-default`}
                style={{
                  backgroundColor: p.bg,
                  borderColor: p.border,
                  minHeight: '110px',
                  transitionDelay: visible ? `${150 + i * 70}ms` : '0ms',
                }}
              >
                {p.logo ? (
                  <div className="flex items-center justify-center" style={{ height: '60px' }}>
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={p.logoSize.w}
                      height={p.logoSize.h}
                      className="object-contain"
                      style={{ maxHeight: '56px', width: 'auto' }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-14">
                    {p.customLogo}
                  </div>
                )}
                <p className="font-sans text-xs text-center text-muted">{p.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
