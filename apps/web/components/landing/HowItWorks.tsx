'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const steps = [
  {
    number: '01',
    title: 'Présentation Curatée',
    description: 'Votre bien mérite une mise en scène olympienne. Nous sublimons chaque annonce avec une direction artistique dédiée pour capter l\'attention de l\'élite.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none">
        <path d="M4 4h16v16H4V4z M4 8h16 M8 4v16"/>
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Connexions Discrètes',
    description: 'La confidentialité est notre pierre angulaire. Nous filtrons chaque demande pour ne retenir que les profils qualifiés correspondant à vos exigences.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Acquisition Intuitive',
    description: 'Déléguez la complexité. De la contractualisation OHADA aux transactions sécurisées, nous orchestrons chaque étape pour une sérénité absolue.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" fill="none">
        <path d="M20 7h-9 M14 2l-3 3 3 3 M4 17h9 M10 22l3-3-3-3"/>
      </svg>
    ),
  },
]

export function HowItWorks() {
  const containerRef = useRef<HTMLElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section
      ref={containerRef}
      className="py-[var(--section-py)] relative overflow-hidden bg-[var(--background)] -mt-10 rounded-t-[3rem] z-20"
    >
       {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] pointer-events-none opacity-5" style={{ background: 'radial-gradient(circle, var(--accent-luxury) 0%, transparent 70%)', filter: 'blur(100px)' }}/>

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Editorial Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-end mb-12">
          <motion.div
             initial={{ opacity: 0, x: -30 }}
             animate={inView ? { opacity: 1, x: 0 } : {}}
             transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[var(--text-subtle)] font-sans tracking-[0.4em] uppercase text-[11px] mb-6 block font-medium">
              Notre Méthodologie
            </span>
            <h2 className="font-display text-5xl md:text-7xl font-light text-[var(--text)] leading-[1.1] tracking-tighter">
              L'Art de la <br/>
              <span className="italic font-serif opacity-70">Sérénité.</span>
            </h2>
          </motion.div>
          
            <p className="font-sans text-lg text-[var(--text-muted)] max-w-md leading-relaxed" >
              Chaque étape est une orchestration minutieuse dédiée à la perfection spatiale et légale.
            </p>
        </div>

        {/* Steps Grid with Architectural Styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-l border-[var(--border)]">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.2 }}
              className="group relative p-12 md:p-16 border-r border-b border-[var(--border)] flex flex-col items-start transition-all duration-700 hover:bg-[var(--primary-light)]"
            >
              <span className="text-4xl font-display font-light text-[var(--text)] opacity-25 mb-12 group-hover:opacity-50 transition-opacity">
                {step.number}
              </span>

              <div className="mb-8 text-[var(--text-muted)] opacity-75 group-hover:opacity-100 group-hover:text-[var(--accent-luxury)] transition-all duration-500">
                {step.icon}
              </div>

              <h3 className="font-display text-2xl font-light text-[var(--text)] mb-6 tracking-tight relative z-10">
                {step.title}
              </h3>

              <p className="font-sans text-base text-[var(--text-muted)] leading-loose relative z-10">
                {step.description}
              </p>

              <div className="mt-12 h-[1px] w-0 bg-[var(--accent-luxury)] opacity-20 group-hover:w-full transition-all duration-1000 ease-expo" />
            </motion.div>
          ))}
        </div>

        {/* Dynamic Footnote */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 2, delay: 1 }}
          className="mt-24 text-center"
        >
          <span className="text-[11px] tracking-[0.4em] uppercase text-[var(--text-subtle)] opacity-50">
            Standard d&apos;Excellence — Immo CI
          </span>
        </motion.div>
      </div>
    </section>
  )
}
