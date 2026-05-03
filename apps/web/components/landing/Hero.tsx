'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { Sparkles, TrendingUp, MapPin, Clock, ChevronRight } from 'lucide-react'

const FALLBACK_BG = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687920-4e2a09be1587?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613490900233-08145a3b2b8b?q=80&w=2000&auto=format&fit=crop',
]

// Phrases qui rotent dans le titre
const HEADLINE_WORDS = [
  { top: 'Trouvez votre', accent: 'appartement idéal' },
  { top: 'Villas, studios,', accent: 'meublés premium' },
  { top: 'Abidjan comme', accent: 'vous le méritez' },
]

// Activité récente simulée (social proof)
const RECENT_ACTIVITY = [
  { icon: '🏠', text: 'Kofi vient de visiter une villa à Cocody', time: '2 min' },
  { icon: '🔑', text: 'Nouveau studio disponible à Plateau', time: '5 min' },
  { icon: '⭐', text: 'Ama a loué un appartement à Marcory', time: '8 min' },
  { icon: '🏢', text: 'Bureau moderne disponible à Zone 4', time: '12 min' },
]

const CATEGORIES = [
  { label: 'Appartements', href: '/biens?type_bien=appartement', color: 'from-blue-500/20' },
  { label: 'Villas',       href: '/biens?type_bien=villa',       color: 'from-amber-500/20' },
  { label: 'Meublés',      href: '/biens?type_bien=residence_meublee', color: 'from-emerald-500/20' },
  { label: 'Studios',      href: '/biens?type_bien=studio',      color: 'from-purple-500/20' },
  { label: 'Bureaux',      href: '/biens?type_bien=bureau',      color: 'from-rose-500/20' },
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

export function Hero({ bgImages, featuredBiens }: { bgImages?: string[]; featuredBiens?: FeaturedBien[] }) {
  const images = (bgImages && bgImages.length >= 2) ? bgImages : FALLBACK_BG
  const [bgIdx, setBgIdx] = useState(0)
  const [headlineIdx, setHeadlineIdx] = useState(0)
  const [activityIdx, setActivityIdx] = useState(0)
  const [showActivity, setShowActivity] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Rotation du background toutes les 6s
  useEffect(() => {
    const t = setInterval(() => setBgIdx(i => (i + 1) % images.length), 6000)
    return () => clearInterval(t)
  }, [images.length])

  // Rotation du titre toutes les 3s
  useEffect(() => {
    const t = setInterval(() => {
      setHeadlineIdx(i => (i + 1) % HEADLINE_WORDS.length)
    }, 3500)
    return () => clearInterval(t)
  }, [])

  // Activité sociale : apparaît après 2s, tourne toutes les 4s
  useEffect(() => {
    const t1 = setTimeout(() => setShowActivity(true), 2000)
    const t2 = setInterval(() => setActivityIdx(i => (i + 1) % RECENT_ACTIVITY.length), 4000)
    return () => { clearTimeout(t1); clearInterval(t2) }
  }, [])

  const current = HEADLINE_WORDS[headlineIdx]
  const activity = RECENT_ACTIVITY[activityIdx]

  // Stats dynamiques basées sur les biens réels
  const totalBiens = featuredBiens?.length ?? 0
  const communes = featuredBiens
    ? Array.from(new Set(featuredBiens.map(b => b.commune))).length
    : 0

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#020617]"
      style={{ minHeight: 'clamp(560px, 88svh, 95svh)' }}
    >
      {/* ── BACKGROUND SLIDESHOW ─────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {images.map((src, idx) => (
          <div
            key={src}
            className="absolute inset-0"
            style={{
              opacity: idx === bgIdx ? 1 : 0,
              transition: 'opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover object-center scale-105"
              priority={idx === 0}
              loading={idx === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
              quality={85}
            />
          </div>
        ))}
        {/* Overlay plus léger — laisse les images respirer */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/30 to-transparent" />
      </div>

      {/* ── CONTENU ─────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col justify-between px-4 md:px-12 max-w-[1400px] mx-auto"
        style={{ minHeight: 'clamp(560px, 88svh, 95svh)', paddingTop: 'clamp(4rem, 10svh, 7rem)', paddingBottom: '2rem' }}
      >
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start lg:items-center">

          {/* ── COLONNE GAUCHE ─── */}
          <div className="flex-1 max-w-xl">

            {/* Badge live */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[12px] font-bold text-white/90 tracking-wider uppercase">
                {totalBiens > 0 ? `${totalBiens} biens disponibles maintenant` : 'Biens disponibles maintenant'}
              </span>
            </motion.div>

            {/* Titre animé */}
            <div className="mb-5 overflow-hidden">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-display font-bold text-white leading-tight"
                style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}
              >
                {current.top}
              </motion.p>
              <div className="h-[1.2em] overflow-hidden" style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={headlineIdx}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '-100%', opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="block font-display font-bold"
                    style={{ color: 'var(--accent-luxury)' }}
                  >
                    {current.accent}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Stats rapides */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-4 mb-7 flex-wrap"
            >
              <div className="flex items-center gap-2 text-white/75">
                <MapPin className="w-4 h-4 text-[var(--accent-luxury)] shrink-0" />
                <span className="text-sm font-semibold">{communes > 0 ? `${communes} communes` : 'Abidjan'}</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-white/75">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold">Réponse en 5 min</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-white/75">
                <Sparkles className="w-4 h-4 text-[var(--accent-luxury)] shrink-0" />
                <span className="text-sm font-semibold">100% gratuit</span>
              </div>
            </motion.div>

            {/* Barre de recherche */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mb-6"
            >
              <SearchBar
                initialQuery=""
                placeholder="Commune, quartier, type de bien..."
              />
            </motion.div>

            {/* Catégories — pill buttons bien visibles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap gap-2"
            >
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/12 hover:bg-white/22 backdrop-blur-md border border-white/20 text-white text-[13px] font-semibold transition-all duration-200 active:scale-95 min-h-[44px]"
                >
                  {cat.label}
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              ))}
            </motion.div>

            {/* Routing rapide — Flash + Pro */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Link
                href="/offre-flash"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--accent-luxury)]/40 text-[var(--accent-luxury)] text-[13px] font-bold hover:bg-[var(--accent-luxury)]/12 transition-colors min-h-[44px]"
              >
                <span className="relative flex w-2 h-2 shrink-0">
                  <span className="animate-ping absolute w-full h-full rounded-full bg-[var(--accent-luxury)] opacity-75" />
                  <span className="relative w-2 h-2 rounded-full bg-[var(--accent-luxury)]" />
                </span>
                Offres flash du réseau
              </Link>
              <Link
                href="/register?role=pro"
                className="text-[13px] text-white/65 hover:text-white/90 transition-colors underline-offset-2 hover:underline py-2.5 min-h-[44px] flex items-center"
              >
                Publier un bien →
              </Link>
            </div>
          </div>

          {/* ── COLONNE DROITE — Card biens (desktop) ─── */}
          <div className="hidden lg:flex flex-col gap-4 w-[340px] xl:w-[380px] shrink-0">
            {featuredBiens && featuredBiens.length > 0 && (
              <FeaturedBienCards biens={featuredBiens.slice(0, 3)} />
            )}
          </div>
        </div>

        {/* ── SOCIAL PROOF TICKER (bottom) ─── */}
        <div className="mt-auto pt-6">
          <AnimatePresence mode="wait">
            {showActivity && (
              <motion.div
                key={activityIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10"
              >
                <span className="text-base leading-none">{activity.icon}</span>
                <span className="text-[12px] text-white/70 font-medium">{activity.text}</span>
                <div className="flex items-center gap-1 text-white/30 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px]">{activity.time}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

// Cartes compactes sur desktop
function FeaturedBienCards({ biens }: { biens: FeaturedBien[] }) {
  return (
    <>
      {biens.map((bien, i) => {
        const prix = bien.prix_nuit_fcfa ?? bien.prix_mois_fcfa ?? bien.prix_vente_fcfa
        const suffix = bien.prix_nuit_fcfa ? '/nuit' : bien.prix_mois_fcfa ? '/mois' : ''
        const fmtPrix = prix
          ? prix >= 1_000_000
            ? `${(prix / 1_000_000).toFixed(1)}M FCFA`
            : `${Math.round(prix / 1_000)}k FCFA`
          : null

        return (
          <motion.div
            key={bien.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 + i * 0.12 }}
          >
            <Link
              href={`/biens/${bien.id}`}
              className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-[var(--accent-luxury)]/40 transition-all duration-300 group"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5">
                {bien.photo_url && (
                  <Image src={bien.photo_url} alt={bien.titre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="64px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-semibold truncate">{bien.titre}</p>
                <p className="text-white/40 text-[11px] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {bien.commune}{bien.quartier ? `, ${bien.quartier}` : ''}
                </p>
                {fmtPrix && (
                  <p className="text-[var(--accent-luxury)] font-display font-bold text-[12px] mt-1">
                    {fmtPrix}<span className="text-white/30 font-normal">{suffix}</span>
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[var(--accent-luxury)] transition-colors shrink-0" />
            </Link>
          </motion.div>
        )
      })}
    </>
  )
}
