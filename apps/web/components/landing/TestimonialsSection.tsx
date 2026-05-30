'use client'
import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

export function TestimonialsSection() {
  const t = useT()
  const TESTIMONIALS = [
    { name: 'Aïssata K.', role: t.testimonials.t1Role, text: t.testimonials.t1Text, rating: 5 },
    { name: 'Eric M.', role: t.testimonials.t2Role, text: t.testimonials.t2Text, rating: 5 },
    { name: 'Sandrine D.', role: t.testimonials.t3Role, text: t.testimonials.t3Text, rating: 5 },
  ]
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-[var(--background)]">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-accent-luxury/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
        <div className="text-center mb-14">
          <span className="text-[var(--accent-luxury)] font-sans tracking-[0.4em] uppercase text-[11px] font-bold mb-4 block">
            {t.testimonials.kicker}
          </span>
          <h2 className="font-display text-3xl md:text-5xl text-[var(--text)] leading-tight tracking-tight">
            {t.testimonials.title} <span className="italic font-serif text-[var(--accent-luxury)]">{t.testimonials.titleAccent}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-[var(--surface-card)] border border-[var(--border)] rounded-3xl p-6 md:p-7"
            >
              <Quote className="absolute top-5 right-5 w-6 h-6 text-accent-luxury/20" strokeWidth={1.5} />

              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-[var(--accent-luxury)] text-[var(--accent-luxury)]" />
                ))}
              </div>

              <p className="text-[var(--text)] text-[14px] leading-[1.7] mb-6 font-sans">
                « {t.text} »
              </p>

              <div className="pt-4 border-t border-[var(--border)]">
                <p className="font-display font-bold text-[var(--text)] text-sm leading-tight">
                  {t.name}
                </p>
                <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest mt-1 font-bold">
                  {t.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
