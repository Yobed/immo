'use client'
import Image from 'next/image'
import { useRef } from 'react'
import { useInView } from '@/hooks/useInView'

const partners = [
  {
    name: 'Wave',
    tagline: 'Paiement mobile',
    logo: '/logos/wave.svg',
    logoSize: { w: 90, h: 90 },
  },
  {
    name: 'Orange Money',
    tagline: 'Mobile money',
    logo: '/logos/orange-money.svg',
    logoSize: { w: 160, h: 50 },
  },
  {
    name: 'MTN Mobile Money',
    tagline: 'Mobile money',
    logo: '/logos/mtn.svg',
    logoSize: { w: 160, h: 80 },
  },
  {
    name: 'Moov Money',
    tagline: 'Paiement mobile',
    logo: '/logos/moov-money.svg',
    logoSize: { w: 160, h: 60 },
  },
  {
    name: 'CinetPay',
    tagline: 'Agrégateur CI',
    logo: null,
    logoSize: { w: 130, h: 50 },
    customLogo: (
      <div className="flex items-center gap-2.5" style={{ filter: 'drop-shadow(0 4px 10px rgba(225,15,40,0.35))' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-2xl" style={{ background: 'linear-gradient(135deg,#E10F28,#FF4444)' }}>C</div>
        <span className="font-black text-xl" style={{ color: '#E10F28' }}>CinetPay</span>
      </div>
    ),
  },
  {
    name: 'Cloudinary',
    tagline: 'Stockage médias',
    logo: null,
    logoSize: { w: 140, h: 50 },
    customLogo: (
      <div className="flex items-center gap-2.5" style={{ filter: 'drop-shadow(0 4px 10px rgba(52,72,197,0.30))' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M6.5 19a4.5 4.5 0 010-9 .5.5 0 00.5-.5 6.5 6.5 0 0112.42-2A4.5 4.5 0 0118.5 19H6.5z" fill="#3448C5"/>
          <path d="M9 14l3-3 3 3M12 11v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-bold text-base" style={{ color: '#3448C5' }}>Cloudinary</span>
      </div>
    ),
  },
]

export function Partners() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { ref, visible } = useInView(0.1)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 240 : -240, behavior: 'smooth' })
  }

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-16 bg-white border-t border-[#E2E7F3]">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className={`text-center mb-12 sr sr-up ${visible ? 'visible' : ''}`}>
          <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-2">
            Intégrations
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--primary)] mb-2">
            Nos partenaires
          </h2>
          <p className="font-sans text-[var(--text-muted)] text-sm max-w-md mx-auto">
            Les solutions de paiement et services les plus utilisés en Côte d&apos;Ivoire.
          </p>
        </div>

        {/* Carousel */}
        <div
          className={`sr sr-up ${visible ? 'visible' : ''} relative`}
          style={{ transitionDelay: visible ? '120ms' : '0ms' }}
        >
          {/* Fades latéraux */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Bouton gauche */}
          <button type="button" onClick={() => scroll('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[var(--border)] shadow-lg flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* Bouton droit */}
          <button type="button" onClick={() => scroll('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[var(--border)] shadow-lg flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Piste de défilement */}
          <div ref={scrollRef} className="carousel-scroll px-12 py-4">
            {partners.map((p, i) => (
              <div
                key={p.name}
                className={`sr sr-scale ${visible ? 'visible' : ''} shrink-0 w-52 flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-white cursor-default transition-all duration-300 hover:-translate-y-2`}
                style={{
                  minHeight: '130px',
                  transitionDelay: visible ? `${150 + i * 70}ms` : '0ms',
                  boxShadow: '0 4px 20px rgba(12,45,94,0.08), 0 1px 4px rgba(12,45,94,0.06)',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 36px rgba(12,45,94,0.14), 0 2px 8px rgba(12,45,94,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(12,45,94,0.08), 0 1px 4px rgba(12,45,94,0.06)')}
              >
                {/* Logo */}
                {p.logo ? (
                  <div className="flex items-center justify-center" style={{ height: '76px' }}>
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={p.logoSize.w}
                      height={p.logoSize.h}
                      className="object-contain"
                      style={{
                        maxHeight: '72px',
                        width: 'auto',
                        filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[76px]">
                    {p.customLogo}
                  </div>
                )}

                {/* Séparateur */}
                <div className="w-8 h-px bg-[var(--border)]" />

                {/* Tagline */}
                <p className="font-sans text-xs text-center text-[var(--text-muted)] leading-snug">{p.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
