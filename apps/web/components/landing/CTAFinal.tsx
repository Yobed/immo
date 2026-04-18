'use client'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { containerVariants, itemVariants } from './Features'
import { MagneticWrapper } from './MagneticWrapper'

export function CTAFinal() {
  const containerRef = useRef<HTMLElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section
      ref={containerRef}
      className="py-[var(--section-py)] relative overflow-hidden -mt-10 rounded-t-[3em] z-[90] bg-[var(--background)] border-t border-[var(--border)]"
    >
      {/* Sophisticated Mesh */}
      <div
        className="absolute inset-0 opacity-10 mix-blend-soft-light"
        style={{ 
          background: 'radial-gradient(circle at 20% 30%, var(--accent-luxury) 0%, transparent 50%), radial-gradient(circle at 80% 70%, var(--primary) 0%, transparent 50%)',
          filter: 'blur(120px)'
        }}
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative container mx-auto px-6 max-w-5xl text-center"
      >
        <motion.div variants={itemVariants} className="mb-12">
           <span className="text-[var(--text-muted)] font-sans tracking-[0.4em] uppercase text-[10px] mb-8 block font-bold">
            Executive Access
          </span>
          <h2 className="font-display text-5xl md:text-8xl font-light text-[var(--text)] leading-[1.1] tracking-tighter mb-12">
            Inscrivez votre <br/>
            <span className="italic font-serif opacity-70">Légende.</span>
          </h2>
          <p className="font-sans text-lg text-[var(--text-muted)] max-w-xl mx-auto mb-16 leading-relaxed font-light">
            Qu'il s'agisse d'acquérir un joyau architectural ou de proposer un bien d'exception, notre plateforme est le point de rencontre de l'élite immobilière.
          </p>
        </motion.div>

        {/* Professional Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-24"
        >
          <MagneticWrapper>
            <Link
              href="/biens"
              className="group relative px-12 py-6 bg-[var(--text)] text-[var(--background)] font-sans text-xs font-bold tracking-[0.3em] uppercase transition-all hover:bg-[var(--accent-luxury)] hover:text-white hover:scale-105 duration-700 rounded-sm"
            >
              Explorer la Collection
            </Link>
          </MagneticWrapper>

          <MagneticWrapper>
            <Link
              href="/register"
              className="group relative px-12 py-6 border border-[var(--border)] text-[var(--text)] font-sans text-xs font-bold tracking-[0.3em] uppercase transition-all hover:border-[var(--accent-luxury)] hover:bg-[var(--accent-luxury)] hover:text-white duration-700 rounded-sm"
            >
              Signaler un Bien
            </Link>
          </MagneticWrapper>
        </motion.div>

        {/* Editorial Trust Row */}
        <motion.div
           variants={itemVariants}
           className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 border-t border-white/[0.05] pt-16"
        >
          {[
            { 
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M12 2L3 7v9c0 5 9 6 9 6s9-1 9-6V7l-9-5z"/>
                </svg>
              ), 
              text: 'Sécurité Transactionnelle' 
            },
            { 
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              ), 
              text: 'Baux OHADA' 
            },
            { 
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M12 2L15 9h7l-5.5 4.5 2 7.5L12 16l-6.5 5 2-7.5L2 9h7l3-7z"/>
                </svg>
              ), 
              text: 'Excellence 4.8/5' 
            },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 text-[#fafbfc]/60 group hover:text-[#fafbfc]/90 transition-colors duration-500">
              {item.icon}
              <span className="font-sans text-[10px] tracking-[0.2em] uppercase font-bold italic">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
