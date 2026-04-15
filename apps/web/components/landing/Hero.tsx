'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'

const FALLBACK_BG = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687920-4e2a09be1587?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613490900233-08145a3b2b8b?q=80&w=2000&auto=format&fit=crop',
]

export function Hero({ bgImages }: { bgImages?: string[] }) {
  const images = (bgImages && bgImages.length >= 2) ? bgImages : FALLBACK_BG
  const [search, setSearch] = useState('')
  const [currentBg, setCurrentBg] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % images.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [images.length])

  const handleSearch = () => {
    const q = search.trim()
    router.push(q ? `/recherche?q=${encodeURIComponent(q)}` : '/biens')
  }

  const TYPES = [
    { label: '🏢 Appartements', href: '/recherche?type_bien=appartement' },
    { label: '🏡 Villas',       href: '/recherche?type_bien=villa' },
    { label: '🛋️ Meublés',      href: '/recherche?type_bien=residence_meublee' },
    { label: '🏨 Studios',      href: '/recherche?type_bien=studio' },
    { label: '📦 Bureaux',      href: '/recherche?type_bien=bureau' },
  ]

  return (
    <section className="relative overflow-hidden bg-primary" style={{ minHeight: '100svh' }}>

      {/* ── Background Slideshow (CSS approach — fiable) ─────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">

        {/* Slides: toutes rendues, seule la courante est visible */}
        {images.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-center bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === currentBg ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              animation: i === currentBg ? 'kenBurns 10s ease-out forwards' : 'none',
              transform: i === currentBg ? undefined : 'scale(1)',
              willChange: 'opacity, transform',
            }}
          />
        ))}

        {/* Overlay 1 — teinte bleue légère (réduite pour voir l'image) */}
        <div className="absolute inset-0" style={{ background: 'rgba(8, 20, 52, 0.38)' }} />

        {/* Overlay 2 — gradient seulement en bas pour lisibilité du texte */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #0C2D5E 0%, rgba(12,45,94,0.65) 25%, rgba(12,45,94,0.15) 55%, transparent 100%)' }}
        />
      </div>

      {/* ── Floating orbs ──────────────────────────────────────────── */}
      <div
        className="absolute anim-orb-1 pointer-events-none"
        style={{ top: '10%', right: '8%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }}
      />
      <div
        className="absolute anim-orb-2 pointer-events-none"
        style={{ bottom: '5%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(26,77,143,0.5) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ top: '50%', left: '30%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(50px)', transform: 'translateY(-50%)' }}
      />

      {/* ── Grid overlay ───────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 flex flex-col lg:flex-row items-center min-h-screen gap-12 py-24 lg:py-0">

        {/* ── LEFT CONTENT ─────────────────────────────────────────── */}
        <div className="flex-1 max-w-2xl">

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full bg-white/8 border border-white/15 backdrop-blur-sm"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
            </span>
            <span className="font-sans text-sm text-white/80 font-medium">
              Plateforme immobilière N°1 en Côte d&apos;Ivoire
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold leading-tight mb-6"
            style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}
          >
            <span className="text-white">Trouvez votre bien</span>
            <br />
            <span className="text-shimmer">en Côte d&apos;Ivoire</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans text-lg sm:text-xl text-white/70 mb-8 leading-relaxed max-w-lg"
          >
            Location, vente et résidences meublées à Abidjan.
            <br className="hidden sm:block" />
            Réservation et paiement sécurisé en quelques clics.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-2 mb-6"
          >
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Commune, quartier, type de bien…"
                className="w-full pl-11 pr-4 py-4 rounded-[14px] bg-white text-gray-800 font-sans text-base border-0 focus:outline-none focus:ring-2 focus:ring-secondary shadow-xl placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleSearch}
              className="shrink-0 px-7 py-4 rounded-[14px] bg-secondary text-white font-sans font-bold text-sm hover:bg-secondary/90 transition-all duration-200 shadow-xl anim-pulse-glow hover:scale-105 active:scale-95"
            >
              Rechercher
            </button>
          </motion.div>

          {/* Type pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {TYPES.map((t, i) => (
              <Link
                key={t.label}
                href={t.href}
                style={{ animationDelay: `${0.5 + i * 0.06}s` }}
                className="px-3.5 py-1.5 rounded-full bg-white/8 border border-white/15 hover:bg-white/18 hover:border-white/30 transition-all duration-200 text-xs font-sans text-white/80 hover:text-white backdrop-blur-sm"
              >
                {t.label}
              </Link>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center gap-8 pt-6 border-t border-white/10"
          >
            {[
              { value: '2 450+', label: 'Biens en ligne' },
              { value: '12',     label: 'Communes' },
              { value: '98%',    label: 'Satisfaction' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="font-mono text-xl font-bold text-secondary">{s.value}</span>
                <span className="font-sans text-xs text-white/50">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT — Floating property cards ───────────────────────── */}
        <div className="hidden lg:flex flex-col items-end gap-5 flex-1 max-w-sm relative py-8">

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 2 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="hero-float-1 w-full card-glass rounded-[24px] overflow-hidden shadow-2xl"
          >
            <div className="relative h-48 bg-primary-mid overflow-hidden">
              <Image src="/hero-bg.jpg" alt="Propriété à Abidjan" fill className="object-cover" sizes="380px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-secondary text-white text-[10px] font-sans font-bold px-2.5 py-1 rounded-full">
                Disponible
              </div>
            </div>
            <div className="p-4 bg-white/95 backdrop-blur-xl">
              <div className="flex items-start justify-between mb-1.5">
                <p className="font-sans font-semibold text-sm text-gray-900">Villa moderne — Cocody</p>
                <span className="text-xs font-mono font-bold text-primary bg-primary/8 px-2 py-0.5 rounded">Villa</span>
              </div>
              <p className="font-mono font-bold text-lg text-primary">2,5M <span className="text-xs font-sans font-normal text-gray-400">FCFA/mois</span></p>
              <div className="flex items-center gap-1 mt-1.5 text-gray-400">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                <span className="text-[11px] font-sans">Cocody Ambassades, Abidjan</span>
              </div>
            </div>
          </motion.div>

          {/* Secondary card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="hero-float-2 w-[88%] card-glass-light rounded-[20px] px-4 py-3.5 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
              </div>
              <div>
                <p className="font-sans text-xs text-gray-500">Nouvelle demande reçue</p>
                <p className="font-sans font-semibold text-sm text-gray-800">Studio à Marcory</p>
              </div>
              <span className="ml-auto text-[10px] text-gray-400 font-sans">à l&apos;instant</span>
            </div>
          </motion.div>

          {/* Badge satisfaction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="hero-float-3 flex items-center gap-3 card-glass-light rounded-[16px] px-4 py-3 shadow-md w-[75%]"
          >
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F97316"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ))}
            </div>
            <span className="font-sans text-xs text-gray-600 font-medium">4.8/5 · 98% satisfaits</span>
          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <span className="font-sans text-[10px] text-white/30 uppercase tracking-widest">Défiler</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </section>
  )
}
