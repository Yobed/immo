'use client'
import { useState } from 'react'
import Link from 'next/link'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { SmartFilter } from './SmartFilter'
import { ArrowRight } from 'lucide-react'

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
  const [filteredRows, setFilteredRows] = useState<BienRow[]>(initialBiens)

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

  // Groupement par catégorie (mobile)
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    items: filteredRows.filter(b => b.type_bien === cat.key),
  })).filter(cat => cat.items.length > 0)

  return (
    <section className="relative py-10 md:py-20 overflow-hidden bg-[var(--background)]">
      <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">

        {/* En-tête */}
        <div className="flex items-end justify-between mb-6 gap-4">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-[var(--text)] leading-tight tracking-tight">
            Dernières annonces
          </h2>
          <Link
            href="/biens"
            className="shrink-0 text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--accent-luxury)] border-b border-[var(--accent-luxury)]/40 pb-0.5 hover:border-[var(--accent-luxury)] transition-colors"
          >
            Voir tout →
          </Link>
        </div>

        {/* Filtres */}
        <div className="mb-6">
          <SmartFilter onFilterChange={handleFilter} />
        </div>

        {filteredRows.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-3xl">
            <p className="text-[var(--text-muted)] mb-4">Aucun bien ne correspond à ces critères.</p>
            <button
              onClick={() => handleFilter({ prixMax: '', commune: '', typeBien: '' })}
              className="text-[var(--accent-luxury)] text-xs uppercase tracking-widest font-bold border-b border-[var(--accent-luxury)] pb-1"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          <>
            {/* ── MOBILE : rangées par catégorie avec scroll horizontal ── */}
            <div className="md:hidden space-y-8">
              {byCategory.map(cat => (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-7 rounded-full bg-[var(--accent-luxury)]" />
                      <div>
                        <h3 className="font-display font-bold text-xl text-[var(--text)] leading-tight tracking-tight">
                          {cat.label}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-luxury)]/70 leading-none mt-0.5">
                          {cat.items.length} bien{cat.items.length > 1 ? 's' : ''} disponible{cat.items.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/biens?type_bien=${cat.key}`}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-luxury)] border-b border-[var(--accent-luxury)]/40 pb-0.5"
                    >
                      Voir tout <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {/* Scroll horizontal — déborde du padding parent sur les bords */}
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
                    {cat.items.map((bien, i) => (
                      <div key={bien.id} className="w-[168px] shrink-0">
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
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── DESKTOP : grille plate ── */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
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
                  photo_url={bien.photo_url ?? null}
                  est_disponible={bien.est_disponible}
                  is_verifie={bien.is_verifie}
                  score_ia={bien.score_ia}
                  url_visite_3d={bien.url_visite_3d}
                  index={i}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
