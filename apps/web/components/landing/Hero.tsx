'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MagneticWrapper } from './MagneticWrapper'

const FALLBACK_BG = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687920-4e2a09be1587?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613490900233-08145a3b2b8b?q=80&w=2000&auto=format&fit=crop',
]

const TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement', maison: 'Maison', villa: 'Villa',
  studio: 'Studio', bureau: 'Bureau', commerce: 'Commerce',
  terrain: 'Terrain', residence_meublee: 'Rés. Meublée',
}

interface FeaturedBien {
  id: string
  titre: string
  commune: string
  quartier: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_nuit_fcfa: number | null
  prix_vente_fcfa: number | null
  photo_url?: string | null
}

function fmtPrice(b: FeaturedBien): { value: string; suffix: string } | null {
  const fmt = (n: number) => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    : `${Math.round(n / 1_000)}k`
  if (b.prix_nuit_fcfa)  return { value: fmt(b.prix_nuit_fcfa),  suffix: '/nuit' }
  if (b.prix_mois_fcfa)  return { value: fmt(b.prix_mois_fcfa),  suffix: '/mois' }
  if (b.prix_vente_fcfa) return { value: fmt(b.prix_vente_fcfa), suffix: '' }
  return null
}

export function Hero({ bgImages, featuredBien }: { bgImages?: string[]; featuredBien?: FeaturedBien | null }) {
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
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === currentBg ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              animation: i === currentBg ? 'kenBurns 10s ease-out forwards' : 'none',
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

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 lg:px-12 xl:px-16 flex flex-col lg:flex-row items-center justify-between min-h-[100svh] gap-20 pt-32 pb-20 lg:py-0">

        {/* ── LEFT CONTENT ─────────────────────────────────────────── */}
        <div className="flex-1 max-w-xl lg:max-w-[750px] z-10 shrink-0">

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 mb-8 p-1 pr-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl"
          >
            <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
            </div>
            <span className="font-sans text-sm text-white/90 font-medium tracking-wide uppercase text-[11px]">
              Plateforme immobilière N°1
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold leading-tight mb-6 drop-shadow-xl"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 6.5rem)' }}
          >
            <span className="text-white block whitespace-nowrap">Trouvez votre bien</span>
            <span className="text-white block whitespace-nowrap">en Côte d&apos;Ivoire</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans text-lg sm:text-xl text-white/90 mb-10 leading-relaxed max-w-lg drop-shadow-md"
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
            className="flex flex-col sm:flex-row gap-3 mb-8 p-2 rounded-[2rem] sm:rounded-[3rem] bg-white/10 border border-white/20 backdrop-blur-md shadow-2xl"
          >
            <div className="relative flex-1">
              <svg className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Commune, quartier, type de bien…"
                className="w-full pl-12 sm:pl-16 pr-6 py-4 rounded-full bg-transparent text-white font-sans text-base sm:text-lg border-0 focus:outline-none focus:ring-0 placeholder-white/60"
              />
            </div>
            <MagneticWrapper>
              <button
                onClick={handleSearch}
                className="group w-full sm:w-auto mt-2 sm:mt-0 flex justify-center sm:inline-flex items-center gap-3 pl-8 pr-3 py-3 rounded-full bg-white text-primary font-sans font-bold text-[15px] hover:bg-gray-50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-lg"
              >
                Rechercher
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>
            </MagneticWrapper>
          </motion.div>

          {/* Type pills */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-2 sm:gap-2.5 mb-12 justify-center sm:justify-start"
          >
            {TYPES.map((t, i) => (
              <Link
                key={t.label}
                href={t.href}
                style={{ animationDelay: `${0.5 + i * 0.06}s` }}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-200 text-xs font-sans text-white/90 hover:text-white backdrop-blur-sm shadow-md"
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
            className="flex flex-wrap items-center justify-center sm:justify-start gap-6 sm:gap-10 pt-8 border-t border-white/20 text-center sm:text-left"
          >
            {[
              { value: '2 450+', label: 'Biens en ligne' },
              { value: '12',     label: 'Communes' },
              { value: '98%',    label: 'Satisfaction' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="font-mono text-[22px] font-bold text-secondary drop-shadow-md">{s.value}</span>
                <span className="font-sans text-[13px] text-white/70 mt-1">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT — Floating property cards ───────────────────────── */}
        <div className="hidden lg:flex flex-col items-end gap-6 flex-1 max-w-[650px] relative py-8 ml-20 mr-[-4rem]">

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 2 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="hero-float-1 w-full card-glass rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="relative h-[400px] bg-primary-mid overflow-hidden">
              {images.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt="Propriété à Abidjan"
                  fill
                  className="object-cover transition-opacity duration-[1500ms] ease-in-out"
                  style={{ opacity: i === currentBg ? 1 : 0 }}
                  sizes="650px"
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-5 left-5 bg-secondary text-white text-xs font-sans font-bold px-3.5 py-2 rounded-full shadow-lg">
                Disponible
              </div>
            </div>
            <div className="p-6 bg-white/95 backdrop-blur-xl">
              <div className="flex items-start justify-between mb-3">
                <p className="font-sans font-semibold text-lg text-gray-900 line-clamp-1">
                  {featuredBien?.titre ?? 'Bien en vedette'}
                </p>
                <span className="shrink-0 text-xs font-mono font-bold text-primary bg-primary/8 px-3 py-1.5 rounded ml-2">
                  {featuredBien ? (TYPE_LABELS[featuredBien.type_bien] ?? featuredBien.type_bien) : 'Villa'}
                </span>
              </div>
              {featuredBien && fmtPrice(featuredBien) ? (
                <p className="font-mono font-bold text-2xl text-primary">
                  {fmtPrice(featuredBien)!.value}{' '}
                  <span className="text-xs font-sans font-normal text-gray-400">FCFA{fmtPrice(featuredBien)!.suffix}</span>
                </p>
              ) : (
                <p className="font-mono font-bold text-2xl text-primary">Prix sur demande</p>
              )}
              <div className="flex items-center gap-2 mt-3 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                <span className="text-sm font-sans">
                  {featuredBien
                    ? `${featuredBien.quartier ? featuredBien.quartier + ', ' : ''}${featuredBien.commune}, Abidjan`
                    : 'Cocody Ambassades, Abidjan'}
                </span>
              </div>
              {featuredBien && (
                <Link
                  href={`/biens/${featuredBien.id}`}
                  className="mt-4 flex items-center gap-2 text-xs font-sans font-semibold text-primary hover:text-secondary transition-colors"
                >
                  Voir la fiche →
                </Link>
              )}
            </div>
          </motion.div>

          {/* Secondary card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="hero-float-2 w-[85%] card-glass-light rounded-[24px] px-5 py-4 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
              </div>
              <div>
                <p className="font-sans text-xs text-gray-500 mb-0.5">Nouvelle demande reçue</p>
                <p className="font-sans font-semibold text-base text-gray-800">Studio à Marcory</p>
              </div>
              <span className="ml-auto text-[11px] text-gray-400 font-sans">à l&apos;instant</span>
            </div>
          </motion.div>

          {/* Badge satisfaction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="hero-float-3 flex items-center justify-center gap-3.5 card-glass-light rounded-[20px] px-5 py-4 shadow-lg w-[70%]"
          >
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#F97316"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ))}
            </div>
            <span className="font-sans text-[15px] text-gray-600 font-medium">4.8/5 · 98% satisfaits</span>
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
