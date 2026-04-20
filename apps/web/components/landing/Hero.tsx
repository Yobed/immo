'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const FALLBACK_BG = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687920-4e2a09be1587?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613490900233-08145a3b2b8b?q=80&w=2000&auto=format&fit=crop',
]

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

export function Hero({ bgImages, featuredBiens }: { bgImages?: string[]; featuredBiens?: FeaturedBien[] }) {
  const images = (bgImages && bgImages.length >= 2) ? bgImages : FALLBACK_BG
  const showcaseBiens = featuredBiens && featuredBiens.length > 0 ? featuredBiens : []
  const [search, setSearch] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceSearch()
  const router = useRouter()
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const activeShowcase = (showcaseBiens && showcaseBiens.length > 0) ? showcaseBiens : null;

  const carouselData = useMemo(() => {
    if (activeShowcase && activeShowcase.length > 0) {
      return activeShowcase.map((b: FeaturedBien, i: number) => ({
        id: b.id,
        titre: b.titre,
        photo_url: b.photo_url || images[i % images.length],
        prix: fmtPrice(b)
      }))
    }
    return images.map((url, i) => ({
      id: `bk-${i}`,
      titre: 'Panorama Signature',
      photo_url: url,
      prix: null
    }))
  }, [activeShowcase, images])

  const slideCount = carouselData.length
  const currentItem = carouselData[currentIdx % slideCount]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slideCount)
    }, 8000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideCount])

  useEffect(() => {
    if (transcript) {
      setSearch(transcript)
      const timer = setTimeout(() => {
        router.push(`/recherche?q=${encodeURIComponent(transcript)}`)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [transcript, router])

  const handleSearch = () => {
    const q = search.trim()
    router.push(q ? `/recherche?q=${encodeURIComponent(q)}` : '/biens')
  }

  const TYPES = [
    { label: 'Appartements', href: '/recherche?type_bien=appartement' },
    { label: 'Villas',       href: '/recherche?type_bien=villa' },
    { label: 'Meublés',      href: '/recherche?type_bien=residence_meublee' },
    { label: 'Studios',      href: '/recherche?type_bien=studio' },
    { label: 'Bureaux',      href: '/recherche?type_bien=bureau' },
  ]

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[var(--background)]" style={{ minHeight: '90svh' }}>

      {/* ── Background Slideshow ─────────────────────────────────────────── */}
      {/* Toutes les images empilées + transition CSS opacity pure = zéro CLS */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {carouselData.map((item, idx) => {
          const isActive = idx === currentIdx
          return (
            <div
              key={item.photo_url}
              className="absolute inset-0 overflow-hidden"
              style={{
                opacity: isActive ? 1 : 0,
                transition: 'opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Ken Burns : zoom synchronisé avec l'intervalle de 8s */}
              <div className={isActive ? 'kb-active' : 'kb-idle'} style={{ width: '100%', height: '100%' }}>
                <Image
                  src={item.photo_url!}
                  alt=""
                  fill
                  className="object-cover object-center"
                  priority={idx === 0}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  sizes="100vw"
                  quality={85}
                />
              </div>
            </div>
          )
        })}

        {/* Overlays cinématiques — stables, jamais rechargés */}
        <div className="absolute inset-0 bg-black/50" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/50 to-transparent"
        />
        <div
          className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-[var(--background)]/80 via-[var(--background)]/40 to-transparent"
        />
      </motion.div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between min-h-[90svh] gap-12 pt-12 pb-16">

        {/* ── LEFT CONTENT ─────────────────────────────────────────── */}
        <div className="flex-1 max-w-2xl z-20">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-[var(--accent-luxury)]/30 bg-[var(--accent-luxury)]/8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-luxury)]" />
            <span className="font-sans text-[11px] text-[var(--accent-luxury)] font-semibold tracking-[0.3em] uppercase">
              Plateforme immobilière N°1 en Côte d&apos;Ivoire
            </span>
          </motion.div>

          {/* Titre principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold leading-tight mb-6 text-white"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 5.5rem)' }}
          >
            Résidences Meublées<br />
            <span style={{ color: 'var(--accent-luxury)' }}>D&apos;Exception</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-lg text-zinc-300 mb-10 leading-relaxed max-w-md"
          >
            Découvrez notre sélection exclusive de résidences meublées et appartements de luxe à Abidjan.<br />
            Vivez l&apos;expérience du haut standing avec service premium inclus.
          </motion.p>

          {/* Barre de recherche unifiée */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 md:mb-10"
          >
            <SearchBar 
              initialQuery={search} 
              placeholder="Commune, quartier, type de bien..." 
            />
          </motion.div>

          {/* Quick Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="flex flex-wrap gap-x-10 gap-y-3"
          >
            {TYPES.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="text-[10px] font-sans font-bold text-zinc-300 hover:text-[var(--accent-luxury)] uppercase tracking-[0.3em] transition-all duration-500 hover:tracking-[0.4em]"
              >
                {t.label}
              </Link>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT — Cinematic Side ───────────────────────────── */}
        <div className="hidden lg:block relative flex-1 max-w-md xl:max-w-lg z-20">
          {/* Conteneur taille fixe : évite que AnimatePresence double la hauteur = zéro saut */}
          <div className="relative aspect-[3/4] rounded-sm overflow-hidden border border-[var(--border)] shadow-[0_40px_80px_rgba(0,0,0,0.3)] bg-[var(--midnight-muted)]">
          <AnimatePresence>
            <motion.div
              key={currentItem.photo_url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 overflow-hidden"
            >
              <Image
                src={currentItem.photo_url}
                alt={currentItem.titre}
                fill
                className="object-cover transition-all duration-[3000ms] ease-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-10 left-10 right-10">
                <span className="block text-[9px] font-bold text-[var(--accent-luxury)] uppercase tracking-[0.4em] mb-3">
                  La Collection du jour
                </span>
                <h3 className="text-3xl font-display font-light text-white mb-2 tracking-tighter leading-tight">
                  {currentItem.titre}
                </h3>
                <p className="text-[11px] font-sans text-zinc-300 mb-8 uppercase tracking-[0.2em] font-medium border-l border-[var(--accent-luxury)]/30 pl-4">
                  {currentItem.prix ? (
                    <>{currentItem.prix.value} FCFA{currentItem.prix.suffix}</>
                  ) : 'Prix Privé'}
                </p>
                <Link 
                  href={activeShowcase ? `/biens/${currentItem.id}` : '/biens'}
                  className="inline-flex items-center gap-5 text-[10px] font-bold text-white border-b border-zinc-700 pb-2 hover:border-[var(--accent-luxury)] transition-all uppercase tracking-[0.3em] group"
                >
                  Visionner le dossier
                  <motion.span 
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >→</motion.span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
          </div>{/* fin conteneur fixe aspect-[3/4] */}

          {/* Floating Detail Overlay */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -right-8 top-16 p-10 bg-white text-black shadow-[0_25px_50px_rgba(0,0,0,0.2)] hidden xl:block"
          >
            <p className="font-serif italic text-3xl mb-2 leading-none">Elite</p>
            <p className="font-sans font-bold text-[9px] uppercase tracking-[0.4em] opacity-50">
              Curated Excellence
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-10 left-10 flex items-center gap-8"
      >
        <div className="w-16 h-px bg-zinc-700" />
        <span className="font-sans text-[9px] text-zinc-400 uppercase tracking-[0.6em] font-bold">Défiler</span>
      </motion.div>
    </section>
  )
}
