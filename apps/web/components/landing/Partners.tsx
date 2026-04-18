'use client'
import Image from 'next/image'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { containerVariants, itemVariants } from './Features'

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
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-100px" })

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'right' ? 240 : -240, behavior: 'smooth' })
  }

  return (
    <section ref={containerRef} className="py-[var(--section-py)] bg-[var(--background)] relative z-[80] border-y border-[var(--border)]">
      <div className="container mx-auto px-4">

        {/* Header */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="text-center mb-16"
        >
          <p className="font-sans text-xs font-semibold text-[var(--accent-luxury)] uppercase tracking-[0.3em] mb-4">
            Écosystème
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-light text-[var(--text)] mb-6 tracking-tight">
            Partenaires de Confiance
          </h2>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--accent-luxury)] to-transparent mx-auto mb-8 opacity-30" />
          <p className="font-sans text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed font-light">
            Une synergie parfaite avec les leaders technologiques et financiers de la région pour une expérience sans compromis.
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Boutons... (same logic as before but with theme vars) */}
          <button 
            type="button" 
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[var(--surface-card)] backdrop-blur-md border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent-luxury)] transition-all active:scale-95 group hidden md:flex"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <button 
            type="button" 
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[var(--surface-card)] backdrop-blur-md border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent-luxury)] transition-all active:scale-95 group hidden md:flex"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Piste de défilement */}
          <div ref={scrollRef} className="carousel-scroll px-4 flex gap-6 overflow-x-auto pb-8 scrollbar-hide pt-4" style={{ scrollSnapType: 'x mandatory' }}>
            {partners.map((p) => (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, borderColor: 'var(--accent-luxury)', backgroundColor: 'var(--primary-light)' }}
                key={p.name}
                className="shrink-0 w-32 sm:w-44 lg:w-48 flex flex-col items-center justify-center gap-2 p-3 md:p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] cursor-default transition-all duration-500"
                style={{
                  minHeight: '70px',
                  scrollSnapAlign: 'center',
                }}
              >
                {/* Logo */}
                {p.logo ? (
                  <div className="flex items-center justify-center transition-all duration-700 opacity-85 hover:opacity-100" style={{ height: '40px' }}>
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={p.logoSize.w}
                      height={p.logoSize.h}
                      className="object-contain dark:brightness-100 brightness-0 dark:invert-0 invert"
                      style={{
                        maxHeight: '35px',
                        width: 'auto',
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[50px] opacity-85 hover:opacity-100">
                    <div className="scale-[0.65] md:scale-75 origin-center dark:invert-0 invert">{p.customLogo}</div>
                  </div>
                )}

                {/* Info */}
                <div className="text-center">
                  <h3 className="font-sans text-[8px] md:text-[9px] font-bold text-[var(--text)] uppercase tracking-widest mb-1">{p.name}</h3>
                   <p className="font-sans text-[7px] md:text-[8px] text-[var(--text-muted)] uppercase tracking-widest">{p.tagline}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
