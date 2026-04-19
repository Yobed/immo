import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

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


export async function FeaturedProperties() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces, est_disponible, is_verifie, score_ia, url_visite_3d')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(16)

  const rows = (biens ?? []) as BienRow[]

  // Photos de couverture
  const coverMap: Record<string, string> = {}
  if (rows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: medias } = await (supabase as any)
      .from('biens_medias')
      .select('bien_id, url, est_couverture')
      .in('bien_id', rows.map((b) => b.id))
      .eq('type', 'photo')
      .order('ordre', { ascending: true })

    if (medias) {
      for (const m of medias as { bien_id: string; url: string; est_couverture: boolean }[]) {
        if (!coverMap[m.bien_id] || m.est_couverture) coverMap[m.bien_id] = m.url
      }
    }
  }

  if (rows.length === 0) return null

  return (
    <section
      className="relative py-[var(--section-py)] overflow-hidden bg-[var(--background)] animate-in fade-in duration-1000"
    >
      <div className="container relative z-10 mx-auto px-6 max-w-7xl">
        {/* Editorial Header */}
        <ScrollReveal className="grid lg:grid-cols-2 gap-12 items-end mb-12">
          <div>
            <span className="text-[var(--accent-luxury)] font-sans tracking-[0.4em] uppercase text-[11px] mb-6 block font-bold">
              Collections Privées
            </span>
            <h2 className="font-display text-5xl md:text-8xl text-[var(--text)] leading-[1] tracking-tight">
              Dernières <br/>
              <span className="italic font-serif opacity-60">Annonces.</span>
            </h2>
          </div>
          
          <div className="flex flex-col items-start lg:items-end">
            <p className="font-sans text-xl text-[var(--text-muted)] mb-10 max-w-sm lg:text-right leading-relaxed font-light">
              Une sélection rigoureuse de propriétés d'exception à travers les quartiers les plus prisés.
            </p>
            <Link
              href="/biens"
              className="group flex items-center gap-6 text-[var(--text)] border-b border-[var(--border)] pb-4 transition-all hover:border-[var(--accent-luxury)] duration-500"
            >
              <span className="font-sans text-[12px] font-bold tracking-[0.3em] uppercase">Voir toute la collection</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:translate-x-4 transition-transform duration-500 text-[var(--accent-luxury)]">
                <path d="M5 12h14m-7-7 7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </ScrollReveal>

        {/* Grille alignée — cartes sur la même ligne de base */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {rows.map((bien, i) => (
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

        {/* Cinematic Exit CTA */}
        <ScrollReveal delay={0.3} className="mt-20 border-t border-[var(--border)] pt-12 text-center">
          <Link
            href="/biens"
            className="inline-block"
          >
            <div className="group relative px-16 py-8 bg-[var(--text)] text-[var(--background)] font-sans text-sm font-bold tracking-[0.4em] uppercase transition-all hover:scale-105 duration-700 rounded-sm">
              Découvrir toute la collection
              <div className="absolute inset-0 bg-[var(--accent-luxury)] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700 opacity-20" />
            </div>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
