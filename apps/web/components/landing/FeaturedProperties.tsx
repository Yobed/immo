'use client'
import Link from 'next/link'
import { useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BienCard } from '@/components/bien/BienCard'
import { useEffect, useState } from 'react'

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
  photo_url?: string | null
}

export function FeaturedProperties() {
  const [biens, setBiens] = useState<BienRow[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase as any)
        .from('biens')
        .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces')
        .eq('statut', 'publie')
        .order('created_at', { ascending: false })
        .limit(8)

      const bienRows = (rows ?? []) as BienRow[]

      if (bienRows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: medias } = await (supabase as any)
          .from('biens_medias')
          .select('bien_id, url, est_couverture')
          .in('bien_id', bienRows.map((b: BienRow) => b.id))
          .eq('type', 'photo')
          .order('ordre', { ascending: true })

        const coverMap: Record<string, string> = {}
        if (medias) {
          for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
            if (!coverMap[m.bien_id] || m.est_couverture) coverMap[m.bien_id] = m.url
          }
        }

        setBiens(bienRows.map((b: BienRow) => ({ ...b, photo_url: coverMap[b.id] ?? null })))
      }
    }
    load()
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  if (biens.length === 0) return null

  return (
    <section className="py-20 bg-[#F4F7FF]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-sans text-sm font-semibold text-[var(--secondary)] uppercase tracking-widest mb-2">
              Sélection
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--primary)]">
              Dernières annonces
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Nav arrows */}
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
              aria-label="Précédent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
              aria-label="Suivant"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <Link
              href="/biens"
              className="hidden sm:inline-flex items-center gap-1.5 ml-2 font-sans text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-mid)] transition-colors"
            >
              Voir tout
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Carousel */}
        <div ref={scrollRef} className="carousel-scroll">
          {biens.map((bien) => (
            <div key={bien.id} className="w-72 sm:w-80 shrink-0">
              <BienCard
                id={bien.id}
                titre={bien.titre}
                commune={bien.commune}
                quartier={bien.quartier}
                type_bien={bien.type_bien}
                prix_mois_fcfa={bien.prix_nuit_fcfa ? null : bien.prix_mois_fcfa}
                prix_nuit_fcfa={bien.prix_nuit_fcfa}
                prix_vente_fcfa={bien.prix_vente_fcfa}
                surface_m2={bien.surface_m2}
                nb_pieces={bien.nb_pieces}
                photo_url={bien.photo_url ?? null}
              />
            </div>
          ))}
        </div>

        {/* CTA mobile */}
        <div className="text-center mt-8 sm:hidden">
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 font-sans font-medium text-sm text-[var(--primary)] border border-[var(--primary)]/30 px-5 py-2.5 rounded-btn hover:bg-[var(--primary-light)] transition-colors"
          >
            Voir toutes les annonces
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
