'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ArrowRight, MapPin, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchBar } from '@/components/search/SearchBar'

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

const HEADLINE_WORDS = [
  "d'exception",
  "de prestige",
  "exclusif",
  "sur-mesure"
]

export function HeroEditorial({ bgImage = DEFAULT_BG, featuredBiens = [] }: HeroEditorialProps) {
  const [headlineIdx, setHeadlineIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setHeadlineIdx(i => (i + 1) % HEADLINE_WORDS.length)
    }, 3500)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="relative w-full h-[100svh] min-h-[640px] max-h-[920px] bg-[#0a0e1a] overflow-hidden">
      {/* Single image — no rotation, calm */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt="Résidence de prestige Côte d'Ivoire"
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105"
        />
      </div>

      {/* Refined dark gradient — preserves image visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-[#020617]/40 to-transparent" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
      }} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top brand line */}
        <div className="px-6 md:px-12 pt-8 md:pt-10">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="h-px w-12 bg-[#C5A059]" />
            <p className="text-[10px] md:text-[11px] font-medium tracking-[0.5em] uppercase text-[#C5A059]">
              Immo CI · Sapphire Edition
            </p>
          </div>
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-12">
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-10 lg:gap-16 items-start lg:items-center">
            
            {/* Left Column: Text and Search */}
            <div className="flex-1 max-w-3xl">
              <h1 className="font-display text-[42px] sm:text-6xl md:text-7xl lg:text-[88px] xl:text-[104px] leading-[1.02] text-white tracking-tighter mb-6 md:mb-8">
                <span className="block uppercase">L&apos;immobilier</span>
                <span className="block font-editorial text-[#C5A059] lowercase text-[1.1em] -mt-2 -mb-2 h-[1.2em] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={headlineIdx}
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '-100%', opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="block"
                    >
                      {HEADLINE_WORDS[headlineIdx]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="block uppercase">en Côte d&apos;Ivoire</span>
              </h1>
              <p className="font-sans text-base md:text-lg text-white/80 max-w-xl leading-relaxed mb-10">
                Résidences vérifiées, conciergerie premium et veille de marché en direct. Toutes les voies vers votre prochain bien réunies en un seul lieu.
              </p>

              {/* Inline search — unifié avec animation */}
              <div className="max-w-2xl">
                <SearchBar 
                  placeholder="Cocody, villa avec piscine, 4 chambres..." 
                  className="shadow-2xl"
                />
              </div>
            </div>

            {/* Right Column: Animated Cards */}
            <div className="hidden lg:flex flex-col gap-4 w-[340px] xl:w-[380px] shrink-0">
              {featuredBiens && featuredBiens.length > 0 && (
                <FeaturedBienCards biens={featuredBiens.slice(0, 3)} />
              )}
            </div>

          </div>
        </div>

        {/* Bottom — chiffres clés */}
        <div className="px-6 md:px-12 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-6 md:gap-12 pt-6 border-t border-white/10">
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  450<span className="text-[#C5A059]">+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-2">
                  Transactions sécurisées
                </p>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  7<span className="text-[#C5A059]">k+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-2">
                  Annonces en direct
                </p>
              </div>
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              <div>
                <p className="font-display text-2xl md:text-4xl text-white leading-none">
                  18<span className="text-[#C5A059]">+</span>
                </p>
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-white/50 mt-2">
                  Communes couvertes
                </p>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] text-white/40 font-medium">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative rounded-full w-2 h-2 bg-emerald-400" />
                </span>
                Mis à jour en temps réel
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturedBienCards({ biens }: { biens: FeaturedBien[] }) {
  return (
    <>
      {biens.map((bien, i) => (
        <motion.div
          key={bien.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5 + i * 0.12 }}
        >
          <Link
            href={`/biens/${bien.id}`}
            className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-[#C5A059]/40 transition-all duration-300 group"
          >
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5">
              {bien.image && (
                <Image src={bien.image} alt={bien.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="64px" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-semibold truncate">{bien.title}</p>
              <p className="text-white/40 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{bien.location}</span>
              </p>
              <p className="text-[#C5A059] text-[12px] font-bold mt-1 truncate">
                {bien.price}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#C5A059] transition-colors shrink-0" />
          </Link>
        </motion.div>
      ))}
    </>
  )
}
