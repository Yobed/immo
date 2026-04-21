'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { Wifi, Wind, Tv, Coffee, ShieldCheck, Star } from 'lucide-react'

type BienRow = {
  id: string
  titre: string
  commune: string
  quartier: string | null
  type_bien: string
  prix_mois_fcfa: number | null
  prix_nuit_fcfa: number | null
  prix_vente_fcfa: number | null
  surface_m2: number | null
  nb_pieces: number | null
  est_disponible: boolean
  is_verifie?: boolean
  score_ia?: number
  url_visite_3d?: string | null
}

export function FurnishedRentalsSection() {
  const [biens, setBiens] = useState<BienRow[]>([])
  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const { data, error } = await (supabase as any)
        .from('biens')
        .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, est_disponible, is_verifie, score_ia, url_visite_3d')
        .eq('statut', 'publie')
        .eq('type_bien', 'residence_meublee')
        .order('score_ia', { ascending: false })
        .limit(6)

      if (data && !error) {
        setBiens(data as unknown as BienRow[])
        
        // Fetch covers
        const { data: medias } = await (supabase as any)
          .from('biens_medias')
          .select('bien_id, url, est_couverture')
          .in('bien_id', data.map((b: any) => b.id))
          .eq('type', 'photo')
          .order('ordre', { ascending: true })

        if (medias) {
          const mmap: Record<string, string> = {}
          for (const m of medias) {
            if (!mmap[m.bien_id] || m.est_couverture) mmap[m.bien_id] = m.url
          }
          setCoverMap(mmap)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  if (!loading && biens.length === 0) return null

  const AMENITIES = [
    { icon: <Wifi className="w-5 h-5" />, label: "Wi-Fi Haut Débit" },
    { icon: <Wind className="w-5 h-5" />, label: "Climatisation" },
    { icon: <Tv className="w-5 h-5" />, label: "Smart TV & Canal+" },
    { icon: <Coffee className="w-5 h-5" />, label: "Cuisine Équipée" },
    { icon: <ShieldCheck className="w-5 h-5" />, label: "Sécurité 24/7" },
  ]

  return (
    <section className="relative py-24 bg-[var(--midnight-muted)] overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-luxury)]/5 blur-[120px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--accent-luxury)]/5 blur-[120px] rounded-full -ml-64 -mb-64" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Column: Context & Amenities */}
          <div className="lg:col-span-4 sticky top-24">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-luxury)]/10 border border-[var(--accent-luxury)]/20 text-[var(--accent-luxury)] text-[10px] font-bold tracking-[0.2em] uppercase mb-8">
                <Star className="w-3 h-3 fill-current" />
                Séjours Premium
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-light text-[var(--text)] mb-8 leading-tight">
                L&apos;expérience <br/>
                <span className="italic font-serif text-[var(--accent-luxury)]">Résidence Meublée.</span>
              </h2>
              <p className="text-[var(--text-muted)] text-lg mb-12 font-light leading-relaxed">
                Nos résidences meublées sont sélectionnées pour leur confort absolu, leur emplacement stratégique et l'accompagnement Sapphire Intelligence.
              </p>

              <div className="space-y-6">
                <p className="text-[11px] font-bold text-[var(--text)] uppercase tracking-[0.3em] mb-4">Équipements Standards</p>
                {AMENITIES.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-luxury)] group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-16">
                <Link 
                  href="/recherche?type_bien=residence_meublee"
                  className="inline-flex items-center gap-4 text-[var(--accent-luxury)] font-bold text-xs uppercase tracking-[0.2em] group border-b border-[var(--accent-luxury)]/30 pb-2 hover:border-[var(--accent-luxury)] transition-all"
                >
                  Découvrir toutes les résidences
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Properties Grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-[var(--background)]/50 animate-pulse rounded-lg border border-[var(--border)]" />
                ))
              ) : (
                biens.map((bien, i) => (
                  <PremiumBienCard
                    key={bien.id}
                    id={bien.id}
                    titre={bien.titre}
                    commune={bien.commune}
                    quartier={bien.quartier}
                    type_bien={bien.type_bien}
                    prix_mois_fcfa={bien.prix_mois_fcfa}
                    prix_nuit_fcfa={bien.prix_nuit_fcfa}
                    prix_vente_fcfa={bien.prix_vente_fcfa}
                    surface_m2={bien.surface_m2}
                    nb_pieces={bien.nb_pieces}
                    photo_url={coverMap[bien.id] ?? null}
                    est_disponible={bien.est_disponible}
                    is_verifie={bien.is_verifie}
                    score_ia={bien.score_ia}
                    url_visite_3d={bien.url_visite_3d}
                    index={i}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
