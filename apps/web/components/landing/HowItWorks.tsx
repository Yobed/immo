'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { containerVariants, itemVariants } from './Features'

const steps = [
  {
    number: '01',
    title: 'Publiez votre bien',
    description: 'Créez votre annonce en quelques minutes. Photos, description, prix en FCFA — votre bien est visible immédiatement sur notre plateforme.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
    color: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
  },
  {
    number: '02',
    title: 'Recevez des demandes',
    description: 'Les locataires et acheteurs vous contactent directement. Planifiez des visites en un clic, suivez chaque opportunité.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: '#0D9F6E',
    bg: 'rgba(13,159,110,0.12)',
  },
  {
    number: '03',
    title: 'Payez en toute sécurité',
    description: 'Paiement sécurisé via Wave, Orange Money, MTN ou CinetPay. Contrats OHADA générés automatiquement.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    color: '#1A4D8F',
    bg: 'rgba(26,77,143,0.12)',
  },
]

export function HowItWorks() {
  const containerRef = useRef<HTMLElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section
      ref={containerRef}
      className="py-20 sm:py-28 relative overflow-hidden bg-white -mt-10 rounded-t-[3rem] z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)' }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Accent orb */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)', borderRadius: '50%' }}
      />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
           className="text-center mb-16 sm:mb-20"
        >
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-sans font-bold uppercase tracking-wider border border-secondary/20">
            Simple &amp; rapide
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-5 leading-tight">
            Comment ça marche
          </h2>
          <p className="font-sans text-lg text-muted max-w-lg mx-auto leading-relaxed">
            Trouver ou louer un bien immobilier en Côte d&apos;Ivoire n&apos;a jamais été aussi simple.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {/* Connector line (desktop) */}
          <div
            className="hidden md:block absolute top-16 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, #F97316, #0D9F6E, #1A4D8F)', opacity: 0.3 }}
          >
            <div
              className="h-full origin-left"
              style={{
                background: 'inherit',
                transition: 'transform 1.2s cubic-bezier(0.22,1,0.36,1) 0.4s',
                transform: inView ? 'scaleX(1)' : 'scaleX(0)',
              }}
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              custom={i}
              className="group rounded-[2rem] p-2 bg-black/[0.02] border border-black/[0.04] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-2 hover:shadow-xl active:scale-[0.98]"
            >
              <div className="relative h-full rounded-[calc(2rem-0.5rem)] p-8 text-center bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                {/* Big number background */}
                <span
                  className="absolute top-4 right-5 font-mono font-black text-7xl leading-none select-none pointer-events-none"
                  style={{ color: step.color, opacity: 0.06 }}
                >
                  {step.number}
                </span>

                {/* Icon container — gradient border spin */}
                <div className="relative inline-flex items-center justify-center mb-6 mx-auto">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center relative z-10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.15] group-hover:-translate-y-1"
                    style={{ background: step.bg, color: step.color }}
                  >
                    {step.icon}
                  </div>
                  {/* Spinning gradient ring */}
                  <div
                    className="absolute inset-[-3px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `conic-gradient(from 0deg, ${step.color}, transparent, ${step.color})`, animation: 'spinBorder 3s linear infinite', zIndex: 0 }}
                  />
                  <div className="absolute inset-[1px] rounded-[16px] bg-white z-[1]" />
                </div>

                {/* Step number badge */}
                <div
                  className="absolute top-5 left-5 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold text-white shadow-md relative z-10"
                  style={{ background: step.color }}
                >
                  {parseInt(step.number, 10)}
                </div>

                <h3 className="font-display text-2xl font-bold text-primary mb-3">{step.title}</h3>
                <p className="font-sans text-base text-muted leading-relaxed">{step.description}</p>

                {/* Bottom accent line */}
                <div
                  className="mt-6 mx-auto h-0.5 rounded-full w-10 group-hover:w-20 transition-all duration-500"
                  style={{ background: `linear-gradient(90deg, ${step.color}, transparent)` }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
