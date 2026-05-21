'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { containerVariants, itemVariants } from './Features'

const testimonials = [
  {
    id: 1,
    name: 'Kouassi Yao',
    role: 'Investisseur',
    location: 'Cocody Riviera',
    text: "Une fluidité transactionnelle sans précédent. L'intégration des baux OHADA et la rapidité des flux financiers via Wave ont transformé ma gestion locative.",
  },
  {
    id: 2,
    name: 'Aminata Koné',
    role: 'Résidente',
    location: 'Plateau Business District',
    text: "L'immersion 360° n'est pas un gadget, c'est un outil de décision. J'ai acquis ma résidence sans la moindre friction géographique.",
  },
  {
    id: 3,
    name: 'Jean-Marc D.',
    role: 'Directeur d\'Agence',
    location: 'Marcory Zone 4',
    text: "Bien plus qu'une plateforme, c'est un écosystème de confiance. Les leads qualifiés et les données analytiques nous offrent une vision stratégique du marché.",
  },
]

export function Testimonials() {
  const ref = useRef(null)

  return (
    <section
      ref={ref}
      className="py-[var(--section-py)] bg-[var(--background)] relative overflow-hidden -mt-10 rounded-t-[3rem] z-[60] border-t border-[var(--border)]"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] pointer-events-none opacity-10" style={{ background: 'radial-gradient(circle, var(--accent-gold) 0%, transparent 70%)', filter: 'blur(100px)' }}/>
      
      <div className="relative container mx-auto px-6 max-w-7xl">
        {/* Editorial Header */}
        <div className="max-w-3xl mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[var(--text-muted)] font-sans tracking-[0.4em] uppercase text-[10px] mb-6 block">
              Voix de l&apos;Excellence
            </span>
            <h2 className="font-display text-5xl md:text-7xl font-light text-[var(--text)] leading-[1.1] tracking-tighter">
              Une Confiance <br/>
              <span className="italic font-serif opacity-70">Sans Frontières.</span>
            </h2>
          </motion.div>
        </div>

        {/* Editorial Grids */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative"
        >
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              variants={itemVariants}
              className="group relative"
            >
              <div className="relative z-10">
                {/* Large Serif Quote Mark */}
                <span className="absolute -top-12 -left-4 font-serif text-[120px] text-[var(--border)] opacity-20 pointer-events-none">
                  &ldquo;
                </span>
                
                <p className="font-sans text-xl text-[var(--text-muted)] leading-relaxed mb-12 relative z-10 min-h-[5em] italic">
                  {t.text}
                </p>

                <div className="flex items-center gap-6 pt-10 border-t border-[var(--border)]">
                  <div className="flex-1">
                    <h4 className="font-display text-[var(--text)] text-base font-light tracking-tight mb-1">
                      {t.name}
                    </h4>
                    <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] italic font-medium">
                      {t.role} · {t.location}
                    </p>
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>

        {/* Brand Sign-off */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 1.2, delay: 0.8 }}
           className="mt-24 pt-16 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-8"
        >
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] font-bold italic">
            Reconnu par +2 450 leaders en Côte d&apos;Ivoire
          </p>
          <div className="flex gap-4 opacity-50 contrast-125 dark:invert-0 invert transition-all">
             <span className="font-display text-sm text-[var(--text)] font-medium italic">Signature Estate</span>
             <span className="font-display text-sm text-[var(--text)] font-medium italic">Elite Real Estate</span>
             <span className="font-display text-sm text-[var(--text)] font-medium italic">Heritage Lux</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
