'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ChevronRight, Wand2 } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { SearchBar } from '@/components/search/SearchBar'
import { useT } from '@/lib/i18n/client'
import { GuidedSearchWizard } from './GuidedSearchWizard'

interface FeaturedBien {
  id: string
  title: string
  location: string
  price: string
  tags: string[]
  image: string
}

interface HeroEditorialProps {
  bgImage?: string
  featuredBiens?: FeaturedBien[]
}

const DEFAULT_BG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop'

export function HeroEditorial({ bgImage = DEFAULT_BG, featuredBiens = [] }: HeroEditorialProps) {
  const tx = useT()
  const HEADLINE_WORDS = [
    tx.hero.wordsExceptional,
    tx.hero.wordsPrestige,
    tx.hero.wordsExclusive,
    tx.hero.wordsCustom,
  ]
  const [headlineIdx, setHeadlineIdx] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Parallax scroll : le fond bouge subtilement moins vite que la page → effet cinéma
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18])

  useEffect(() => {
    const t = setInterval(() => {
      setHeadlineIdx(i => (i + 1) % HEADLINE_WORDS.length)
    }, 3500)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section ref={sectionRef} className="relative w-full bg-[#0b1530] overflow-hidden">
      {/* Image de fond avec parallax + zoom subtil au scroll — rendu identique d'origine */}
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={prefersReducedMotion ? undefined : { y: bgY, scale: bgScale }}
      >
        <Image
          src={bgImage}
          alt="Résidence de prestige Côte d'Ivoire"
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105 opacity-30 md:opacity-100"
        />
      </motion.div>

      {/* Overlays d'origine : dark sur mobile, dégradé raffiné sur desktop */}
      <div className="absolute inset-0 bg-[#020617]/70 md:hidden" />
      <div className="absolute inset-0 hidden md:block bg-gradient-to-b from-black/40 via-black/30 to-black/75 pointer-events-none" />
      <div className="absolute inset-0 hidden md:block bg-gradient-to-t from-[#020617]/90 via-[#020617]/40 to-transparent pointer-events-none" />

      {/* Subtle vignette — desktop only */}
      <div className="absolute inset-0 hidden md:block pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between pt-3 md:pt-4 pb-2 md:pb-3">
        {/* Top brand line */}
        <div className="px-5 md:px-12 mb-2 md:mb-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="h-px w-8 md:w-12 bg-[#C5A059]" />
            <p className="text-[9px] md:text-[11px] font-semibold tracking-[0.35em] md:tracking-[0.45em] uppercase text-[#C5A059]">
              {tx.hero.edition}
            </p>
          </div>
        </div>

        {/* Centered content */}
        <div className="px-5 md:px-12 my-auto pb-1">
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6 lg:gap-12 items-start lg:items-center">

            {/* Left Column: Text and Search */}
            <div className="flex-1 max-w-3xl">
              <h1 className="font-display text-[32px] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[88px] leading-[1.04] text-white tracking-tighter mb-2 md:mb-3">
                <StaggeredWords
                  text={tx.hero.lineOne}
                  className="block uppercase"
                  delay={0.1}
                />
                <span className="block font-editorial text-[#C5A059] lowercase text-[1.1em] -mt-2 -mb-2 h-[1.2em] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={headlineIdx}
                      initial={{ y: '100%', opacity: 0, rotate: 2 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: '-100%', opacity: 0, rotate: -2 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="block"
                    >
                      {HEADLINE_WORDS[headlineIdx]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <StaggeredWords
                  text={tx.hero.lineTwo}
                  className="block uppercase"
                  delay={0.5}
                />
              </h1>
              <p className="hidden md:block font-sans text-sm md:text-base text-white/80 max-w-xl leading-relaxed mb-3.5 md:mb-4">
                {tx.hero.intro}
              </p>

              {/* Inline search — aéré & calibré pour tenir dans l'écran sans couper le CTA */}
              <div className="max-w-2xl mt-2 md:mt-0">
                <SearchBar
                  placeholder={tx.hero.searchExample}
                  className="shadow-md"
                />

                {/* Guided wizard CTA — bannière aérée et proportionnée, parfaitement visible */}
                <motion.button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group mt-3 md:mt-3.5 w-full sm:w-auto flex items-center gap-3.5 px-4.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#C5A059]/15 via-[#C5A059]/10 to-transparent border border-[#C5A059]/35 hover:border-[#C5A059]/65 hover:bg-[#C5A059]/20 backdrop-blur-sm shadow-[0_4px_20px_rgba(197,160,89,0.12)] hover:shadow-[0_6px_28px_rgba(197,160,89,0.22)] transition-all min-h-[50px]"
                  aria-label="Ouvrir l'assistant de recherche guidée en 4 étapes"
                >
                  {/* Icon with attention pulse */}
                  <span className="relative inline-flex shrink-0">
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#C5A059]/50 animate-ping opacity-60" />
                    <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#C5A059] text-[#020617] shadow-sm">
                      <Wand2 className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                  </span>

                  {/* Copy */}
                  <span className="flex-1 text-left min-w-0">
                    <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059]/90 leading-none mb-0.5">
                      Première visite ?
                    </span>
                    <span className="block text-xs sm:text-sm md:text-base font-bold text-white leading-tight">
                      Trouvez votre bien en 30 secondes
                    </span>
                  </span>

                  {/* Timer chip + arrow */}
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#020617]/40 border border-white/10 text-[10px] font-bold text-white/80 uppercase tracking-wider shrink-0">
                    4 étapes
                  </span>
                  <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                </motion.button>
              </div>
            </div>

            {/* Right Column: Animated Cards */}
            <div className="hidden lg:flex flex-col gap-3.5 w-[340px] xl:w-[380px] shrink-0">
              {featuredBiens && featuredBiens.length > 0 && (
                <FeaturedBienCards biens={featuredBiens.slice(0, 3)} />
              )}
            </div>

          </div>
        </div>

        {/* Bottom — chiffres clés (desktop only — mobile is too dense) */}
        <div className="hidden md:block px-6 md:px-12 pt-3 pb-1 md:pb-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-6 md:gap-12 pt-3 border-t border-white/10">
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  450<span className="text-[#C5A059]">+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-1.5">
                  {tx.hero.stat1}
                </p>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  7<span className="text-[#C5A059]">k+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-1.5">
                  {tx.hero.stat2}
                </p>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  18<span className="text-[#C5A059]">+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-1.5">
                  {tx.hero.stat3}
                </p>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] text-white/40 font-medium">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative rounded-full w-2 h-2 bg-emerald-400" />
                </span>
                {tx.hero.liveUpdate}
              </div>
            </div>
          </div>
        </div>
      </div>

      <GuidedSearchWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </section>
  )
}

/**
 * Animation cinématique d'un titre : chaque MOT entre par le bas avec stagger.
 * Utilise un overflow-hidden parent pour effet "rideau qui se lève".
 */
interface StaggeredWordsProps {
  text: string
  className?: string
  delay?: number
}

function StaggeredWords({ text, className = '', delay = 0 }: StaggeredWordsProps) {
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.85,
              delay: delay + i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

function FeaturedBienCards({ biens }: { biens: FeaturedBien[] }) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <>
      {biens.map((bien, i) => (
        <motion.div
          key={bien.id}
          initial={{ opacity: 0, x: 30 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1, x: 0 }
              : {
                  opacity: 1,
                  x: 0,
                  // Bobbing infini subtil : ±3px verticalement, désynchronisé par index
                  y: [0, -3, 0],
                }
          }
          transition={{
            opacity: { duration: 0.7, delay: 0.5 + i * 0.12 },
            x: { duration: 0.7, delay: 0.5 + i * 0.12 },
            y: prefersReducedMotion
              ? undefined
              : {
                  duration: 4 + i * 0.3,
                  delay: 1 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
          }}
        >
          <Link
            href={`/biens/${bien.id}`}
            className="flex items-center gap-3 p-3 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 hover:border-[#C5A059]/40 hover:bg-black/60 transition-all duration-300 group shadow-lg"
          >
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5">
              {bien.image && (
                <Image
                  src={bien.image}
                  alt={bien.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="64px"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-semibold truncate group-hover:text-[#C5A059] transition-colors">
                {bien.title}
              </p>
              <p className="text-white/50 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-2.5 h-2.5 shrink-0 text-[#C5A059]" />
                <span className="truncate">{bien.location}</span>
              </p>
              <p className="text-[#C5A059] font-display font-bold text-[12px] mt-0.5 truncate">
                {bien.price}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#C5A059] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </motion.div>
      ))}
    </>
  )
}
