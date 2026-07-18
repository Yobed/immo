'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { SmartFilter } from './SmartFilter'
import { ArrowRight } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

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
  photo_url?: string | null
}

interface FeaturedPropertiesProps {
  initialBiens?: BienRow[]
}

const CATEGORIES = [
  { key: 'villa',             label: 'Villas de Luxe' },
  { key: 'appartement',       label: 'Appartements' },
  { key: 'residence_meublee', label: 'Résidences meublées' },
  { key: 'studio',            label: 'Studios' },
  { key: 'maison',            label: 'Maisons' },
  { key: 'bureau',            label: 'Bureaux' },
  { key: 'terrain',           label: 'Terrains' },
]

export function FeaturedProperties({ initialBiens = [] }: FeaturedPropertiesProps) {
  const t = useT()
  const [filteredRows, setFilteredRows] = useState<BienRow[]>(initialBiens)
  const trackRef = useRef<HTMLDivElement>(null)

  // Défilement auto en boucle : la liste est rendue 2x, on avance scrollLeft
  // en continu et on soustrait la moitié quand on la dépasse → boucle sans
  // couture. Pause au survol/toucher, le scroll manuel reste fonctionnel.
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let paused = false
    let raf = 0
    const onEnter = () => { paused = true }
    const onLeave = () => { paused = false }
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('touchstart', onEnter, { passive: true })
    el.addEventListener('touchend', onLeave, { passive: true })

    const step = () => {
      if (!paused) {
        el.scrollLeft += 0.6
        const half = el.scrollWidth / 2
        if (el.scrollLeft >= half) el.scrollLeft -= half
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('touchstart', onEnter)
      el.removeEventListener('touchend', onLeave)
    }
  }, [filteredRows])

  const handleFilter = (filters: { prixMax: string; commune: string; typeBien: string }) => {
    let result = [...initialBiens]
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

  if (initialBiens.length === 0) return null

  // Les 15 plus récents (ou simplement la liste filtrée)
  const latestProperties = filteredRows.slice(0, 15)

  return (
    <section className="relative py-10 md:py-20 overflow-hidden bg-[var(--background)]">
      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">

        {/* En-tête */}
        <div className="flex items-end justify-between mb-6 gap-4">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-[var(--text)] leading-tight tracking-tight">
            {t.featured.latest}
          </h2>
          <Link
            href="/biens"
            className="shrink-0 text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-luxury)] border-b border-accent-luxury/40 pb-0.5 hover:border-[var(--accent-luxury)] transition-colors"
          >
            {t.featured.viewAll} →
          </Link>
        </div>

        {/* Filtres */}
        <div className="mb-6">
          <SmartFilter onFilterChange={handleFilter} />
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-3xl">
            <p className="text-[var(--text-muted)] mb-4">{t.featured.noMatch}</p>
            <button
              onClick={() => handleFilter({ prixMax: '', commune: '', typeBien: '' })}
              className="text-[var(--accent-luxury)] text-xs uppercase tracking-widest font-bold border-b border-[var(--accent-luxury)] pb-1"
            >
              {t.featured.reset}
            </button>
          </div>
        ) : (
          <>
            {/* ── SINGLE ROW FOR LATEST PROPERTIES ── */}
            <div className="space-y-8">
              <div>
                {/* Scroll horizontal auto-défilant en boucle — liste rendue 2x
                    pour une boucle sans couture. Clones en aria-hidden. */}
                <div className="overflow-hidden">
                <div ref={trackRef} className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:-mx-6 md:px-6">
                  {[false, true].map((isClone) =>
                    latestProperties.map((bien, i) => (
                      <div
                        key={`${isClone ? 'clone-' : ''}${bien.id}`}
                        className="w-[192px] md:w-[240px] shrink-0"
                        aria-hidden={isClone || undefined}
                      >
                        <PremiumBienCard
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
                          photo_url={bien.photo_url ?? null}
                          est_disponible={bien.est_disponible}
                          is_verifie={bien.is_verifie}
                          score_ia={bien.score_ia}
                          url_visite_3d={bien.url_visite_3d}
                          index={i}
                        />
                      </div>
                    ))
                  )}
                </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── CROSS-PROMO — persona "Recherche large" ── */}
        {initialBiens.length > 0 && (
          <div className="mt-10 pt-8 border-t border-[var(--border)] flex items-center justify-between gap-4 flex-wrap">
            <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-md">
              {t.featured.promoLine}
            </p>
            <Link
              href="/offre-flash"
              className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--accent-luxury)] border-b border-accent-luxury/40 pb-0.5 hover:border-[var(--accent-luxury)] transition-colors"
            >
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute w-full h-full rounded-full bg-[var(--accent-luxury)] opacity-75" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-[var(--accent-luxury)]" />
              </span>
              {t.featured.promoCta}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
