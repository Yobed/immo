'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { SmartFilter } from './SmartFilter'

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

export function FeaturedProperties() {
  const [allBiens, setAllBiens] = useState<BienRow[]>([])
  const [filteredRows, setFilteredRows] = useState<BienRow[]>([])
  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      const { data: biens } = await supabase
        .from('biens')
        .select(`
          id, titre, commune, quartier, type_bien, 
          prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, 
          surface_m2, nb_pieces, est_disponible, 
          is_verifie, score_ia, url_visite_3d
        `)
        .eq('statut', 'publie')
        .order('created_at', { ascending: false })
        .limit(24)

      if (biens) {
        const validatedBiens: BienRow[] = (biens as any[]).map(b => ({
          id: b.id,
          titre: b.titre,
          commune: b.commune,
          quartier: b.quartier,
          type_bien: b.type_bien,
          prix_mois_fcfa: b.prix_mois_fcfa,
          prix_nuit_fcfa: b.prix_nuit_fcfa,
          prix_vente_fcfa: b.prix_vente_fcfa,
          surface_m2: b.surface_m2,
          nb_pieces: b.nb_pieces,
          est_disponible: b.est_disponible,
          is_verifie: b.is_verifie,
          score_ia: b.score_ia,
          url_visite_3d: b.url_visite_3d
        }))
        
        setAllBiens(validatedBiens)
        setFilteredRows(validatedBiens)

        const { data: medias } = await supabase
          .from('biens_medias')
          .select('bien_id, url, est_couverture')
          .in('bien_id', validatedBiens.map((b) => b.id))
          .eq('type', 'photo')
          .order('ordre', { ascending: true })

        if (medias) {
          const map: Record<string, string> = {}
          for (const m of medias) {
            if (!map[m.bien_id] || m.est_couverture) map[m.bien_id] = m.url
          }
          setCoverMap(map)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleFilter = (filters: { prixMax: string; commune: string; typeBien: string }) => {
    let result = [...allBiens]

    if (filters.prixMax) {
      const max = parseInt(filters.prixMax)
      result = result.filter(b => {
        const p = b.prix_mois_fcfa || b.prix_nuit_fcfa || b.prix_vente_fcfa || 0
        return p <= max
      })
    }

    if (filters.commune) {
      const search = filters.commune.toLowerCase()
      result = result.filter(b => 
        b.commune.toLowerCase().includes(search) || 
        (b.quartier && b.quartier.toLowerCase().includes(search))
      )
    }

    if (filters.typeBien) {
      result = result.filter(b => b.type_bien === filters.typeBien)
    }

    setFilteredRows(result)
  }

  if (!loading && allBiens.length === 0) return null

  return (
    <section className="relative py-[var(--section-py)] overflow-hidden bg-[var(--background)]">
      <div className="container relative z-10 mx-auto px-6 max-w-7xl">
        <ScrollReveal className="grid lg:grid-cols-2 gap-12 items-end mb-12">
          <div>
            <span className="text-[var(--accent-luxury)] font-sans tracking-[0.4em] uppercase text-[11px] mb-6 block font-bold transition-all hover:tracking-[0.6em] cursor-default">
              Collections Privées
            </span>
            <h2 className="font-display text-5xl md:text-8xl text-[var(--text)] leading-[1] tracking-tight">
              Dernières <br/>
              <span className="italic font-serif opacity-60">Annonces.</span>
            </h2>
          </div>
          
          <div className="flex flex-col items-start lg:items-end">
            <p className="font-sans text-xl text-[var(--text-muted)] mb-10 max-w-sm lg:text-right leading-relaxed font-light">
              Explorez nos nouvelles pépites immobilières, filtrées selon vos exigences de prestige.
            </p>
            <Link
              href="/biens"
              className="group flex items-center gap-6 text-[var(--text)] border-b border-[var(--border)] pb-4 transition-all hover:border-[var(--accent-luxury)] duration-500"
            >
              <span className="font-sans text-[12px] font-bold tracking-[0.3em] uppercase">Toute la collection</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:translate-x-4 transition-transform duration-500 text-[var(--accent-luxury)]">
                <path d="M5 12h14m-7-7 7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </ScrollReveal>

        {/* Smart Filter Bar */}
        <ScrollReveal delay={0.1}>
          <SmartFilter onFilterChange={handleFilter} />
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-5 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[var(--midnight-light)]/20 rounded-2xl" />
            ))}
          </div>
        ) : filteredRows.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5 transition-all duration-500">
            {filteredRows.map((bien, i) => (
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
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-[var(--border)] rounded-3xl bg-[var(--midnight-muted)]/10">
            <p className="font-serif italic text-2xl text-[var(--text-muted)] opacity-50 mb-4">Aucune perle rare ne correspond à ces critères...</p>
            <button 
                onClick={() => handleFilter({ prixMax: '', commune: '', typeBien: '' })}
                className="text-[var(--accent-luxury)] text-xs uppercase tracking-widest font-bold border-b border-[var(--accent-luxury)] pb-1"
            >
                Réinitialiser les filtres
            </button>
          </div>
        )}

        <ScrollReveal delay={0.3} className="mt-20 border-t border-[var(--border)] pt-12 text-center">
          <Link href="/biens" className="inline-block">
            <div className="group relative px-16 py-8 bg-[var(--text)] text-[var(--background)] font-sans text-sm font-bold tracking-[0.4em] uppercase transition-all hover:scale-105 duration-700 rounded-sm overflow-hidden">
              Découvrir toute la collection
              <div className="absolute inset-0 bg-[var(--accent-luxury)] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700 opacity-20" />
            </div>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
