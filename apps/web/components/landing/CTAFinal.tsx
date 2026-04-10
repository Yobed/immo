'use client'
import Link from 'next/link'
import { useInView } from '@/hooks/useInView'

export function CTAFinal() {
  const { ref, visible } = useInView(0.15)

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-24 relative overflow-hidden bg-[var(--primary)]">
      <div className="absolute inset-0 bg-gradient-animated opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[var(--secondary)]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-[var(--primary-mid)]/40 blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4 text-center">
        <div className={`sr sr-up ${visible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-pill px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)] animate-pulse" />
            <span className="font-sans text-sm font-medium text-white/80">Gratuit pour commencer</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            Prêt à trouver<br />
            <span style={{
              background: 'linear-gradient(135deg,#F97316,#FB923C,#F97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              votre bien idéal ?
            </span>
          </h2>

          <p className="font-sans text-white/65 text-base max-w-lg mx-auto mb-10 leading-relaxed">
            Rejoignez des milliers d&apos;ivoiriens qui font confiance à Immo CI pour leurs projets immobiliers.
          </p>
        </div>

        <div className={`sr sr-up ${visible ? 'visible' : ''} flex flex-col sm:flex-row gap-4 justify-center`}
          style={{ transitionDelay: visible ? '150ms' : '0ms' }}>
          <Link
            href="/biens"
            className="btn-secondary-glow inline-flex items-center justify-center gap-2.5 font-sans font-semibold rounded-btn bg-[var(--secondary)] text-white px-8 py-4 text-base hover:scale-105 transition-transform duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Chercher un bien
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2.5 font-sans font-semibold rounded-btn border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 hover:scale-105 transition-all duration-200 px-8 py-4 text-base"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Publier un bien
          </Link>
        </div>
      </div>
    </section>
  )
}
