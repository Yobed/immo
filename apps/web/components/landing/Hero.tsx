'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } },
}

export function Hero() {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const q = search.trim()
    router.push(q ? `/recherche?q=${encodeURIComponent(q)}` : '/biens')
  }

  return (
    <section
      className="relative bg-primary overflow-hidden flex flex-col lg:flex-row"
      style={{ minHeight: '92svh' }}
    >
      {/* ══════════════════════════════════
          PANNEAU GAUCHE — image (desktop)
      ══════════════════════════════════ */}
      <div className="hidden lg:block relative w-[52%] shrink-0 self-stretch">
        <Image
          src="/hero-bg.jpg"
          alt="Belle résidence à Abidjan"
          fill
          className="object-cover object-center"
          priority
          sizes="52vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-primary/20 to-primary" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-primary/10" />

        {/* Badge vivant — en haut à gauche */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
          className="absolute top-8 left-6 flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl z-10"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
          </span>
          <div>
            <p className="font-mono text-xs font-bold text-primary leading-none">247 biens</p>
            <p className="font-sans text-[10px] text-gray-400 leading-none mt-0.5">disponibles</p>
          </div>
        </motion.div>

        {/* Card satisfaction — en bas à gauche */}
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, -2, 0] }}
          transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity, delay: 1.5 }}
          className="absolute bottom-12 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-xl z-10"
          style={{ maxWidth: 200 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-secondary">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="font-mono text-xs font-bold text-primary">4.8/5</span>
          </div>
          <p className="font-sans text-[11px] text-gray-500 leading-snug">98% de clients satisfaits</p>
          <div className="mt-2 flex -space-x-1.5">
            {['KY', 'AK', 'PI', 'MB'].map((ini, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white font-mono text-[8px] font-bold shrink-0"
                style={{ background: ['#0C2D5E', '#F97316', '#0D9F6E', '#1A4D8F'][i] }}
              >
                {ini}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════
          PANNEAU DROIT — contenu
      ══════════════════════════════════ */}
      <div className="relative flex-1 flex items-center overflow-hidden">
        {/* Fond navy + déco */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#0d3a5c]" />
        <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity, delay: 3 }}
          className="absolute top-[8%] right-[4%] w-56 h-56 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)' }}
        />

        {/* Image mobile */}
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <Image src="/hero-bg.jpg" alt="" fill className="object-cover object-center opacity-[0.07]" priority sizes="100vw" />
        </div>

        {/* Contenu */}
        <div className="relative z-10 w-full px-5 sm:px-10 lg:px-12 xl:px-16 py-16 sm:py-20">
          <motion.div
            className="max-w-lg mx-auto lg:mx-0"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {/* Badge */}
            <motion.span
              variants={fadeUp}
              className="inline-block mb-4 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary text-xs sm:text-sm font-semibold border border-secondary/30"
            >
              Plateforme immobilière N°1 en Côte d&apos;Ivoire
            </motion.span>

            {/* Titre */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold leading-tight mb-4"
            >
              <span className="text-white">Trouvez votre bien</span><br />
              <span className="text-secondary">en Côte d&apos;Ivoire</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="font-sans text-sm sm:text-base text-white/90 mb-6 leading-relaxed max-w-md"
            >
              Location, vente et résidences meublées à Abidjan.
              Réservation et paiement en ligne en quelques clics.
            </motion.p>

            {/* Barre de recherche */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
              <label htmlFor="hero-search" className="sr-only">
                Rechercher une commune ou un quartier
              </label>
              <input
                id="hero-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Commune, quartier..."
                aria-label="Recherche par lieu"
                className="flex-1 min-w-0 rounded-xl px-4 py-3 text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-secondary text-sm shadow-lg"
              />
              <Button size="lg" variant="secondary" className="shrink-0 shadow-lg text-sm" onClick={handleSearch}>
                Rechercher
              </Button>
            </motion.div>

            {/* Raccourcis */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-8">
              {[
                { label: 'Appartements', href: '/recherche?type_bien=appartement' },
                { label: 'Villas', href: '/recherche?type_bien=villa' },
                { label: 'Résidences', href: '/recherche?type_bien=residence_meublee' },
                { label: 'Studios', href: '/recherche?type_bien=studio' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 text-xs sm:text-sm font-sans text-white/90 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="flex gap-6 sm:gap-10 pt-4 border-t border-white/10">
              {[
                { value: '2 450+', label: 'Biens' },
                { value: '12', label: 'Communes' },
                { value: '98%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5">
                  <span className="font-mono text-lg sm:text-xl font-bold text-secondary">{s.value}</span>
                  <span className="font-sans text-[10px] sm:text-xs text-white/60">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
