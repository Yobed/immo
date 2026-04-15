'use client'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { containerVariants, itemVariants } from './Features'

export function CTAFinal() {
  const containerRef = useRef<HTMLElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section
      ref={containerRef}
      className="py-28 relative overflow-hidden"
    >
      {/* Animated mesh gradient background */}
      <div
        className="absolute inset-0 anim-mesh"
        style={{ background: 'linear-gradient(135deg, #0a1f40, #0C2D5E, #1a4585, #F97316, #0C2D5E, #0a1f40)' }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 bg-dots opacity-15 pointer-events-none" />

      {/* Morphing blobs */}
      <div
        className="absolute -top-20 -right-20 w-[600px] h-[600px] anim-blob pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 60%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(26,77,143,0.5) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'orbFloat2 20s ease-in-out infinite' }}
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="relative container mx-auto px-4 text-center"
      >
        {/* Pill badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="font-sans text-sm font-medium text-white/80">Gratuit pour commencer</span>
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants}>
          <h2
            className="font-display font-bold text-white leading-tight mb-6"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            Prêt à trouver
            <br />
            <span className="text-shimmer">votre bien idéal ?</span>
          </h2>

          <p className="font-sans text-white/60 text-base max-w-lg mx-auto mb-12 leading-relaxed">
            Rejoignez des milliers d&apos;ivoiriens qui font confiance à Immo CI pour leurs projets immobiliers.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/biens"
            className="group relative inline-flex items-center justify-center gap-3 font-sans font-bold rounded-[14px] bg-secondary text-white px-9 py-4 text-base shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 overflow-hidden anim-pulse-glow"
          >
            {/* Shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Chercher un bien
          </Link>

          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-3 font-sans font-bold rounded-[14px] border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/60 transition-all duration-300 px-9 py-4 text-base hover:scale-105 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 5v14M5 12h14"/></svg>
            Publier un bien
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div
           variants={itemVariants}
           className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          {[
            { icon: '🔒', text: 'Paiement sécurisé' },
            { icon: '📄', text: 'Contrats OHADA' },
            { icon: '⭐', text: '4.8/5 satisfaction' },
            { icon: '🏆', text: 'N°1 en Côte d\'Ivoire' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-white/50">
              <span>{item.icon}</span>
              <span className="font-sans text-sm">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
