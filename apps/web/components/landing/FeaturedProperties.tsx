import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BienCard } from '@/components/bien/BienCard'
import { CardsCarousel } from '@/components/ui/CardsCarousel'
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
}

export async function FeaturedProperties() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
    .limit(10)

  const rows = (biens ?? []) as BienRow[]

  // Photos de couverture
  let coverMap: Record<string, string> = {}
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
    <section className="relative py-28 bg-[#F4F7FF] overflow-hidden">
      {/* Background Topography / Noise Editorial Texture */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-multiply" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />
      
      <div className="container relative z-10 mx-auto px-4">
        {/* Header with Scroll Reveal */}
        <ScrollReveal className="flex items-end justify-between mb-12">
          <div>
            <p className="font-sans text-xs font-bold text-[var(--secondary)] uppercase tracking-[0.2em] mb-3">
              Sélection d&apos;exception
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--primary)] leading-tight">
              Dernières annonces
            </h2>
          </div>
          <Link
            href="/biens"
            className="hidden sm:inline-flex items-center gap-2 font-sans text-sm font-semibold text-[var(--primary)] border-b-2 border-transparent hover:border-[var(--secondary)] pb-1 transition-all group"
          >
            <span>Voir tout</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </ScrollReveal>

        {/* Carousel wrapped in Scroll Reveal with a slight delay */}
        <ScrollReveal delay={0.15}>
          <CardsCarousel>
            {rows.map((bien) => (
              <div key={bien.id} className="w-[280px] sm:w-[320px] lg:w-[340px] shrink-0 py-4">
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
                  photo_url={coverMap[bien.id] ?? null}
                />
              </div>
            ))}
          </CardsCarousel>
        </ScrollReveal>

        {/* CTA mobile */}
        <ScrollReveal delay={0.2} className="text-center mt-12 sm:hidden">
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 font-sans font-bold text-sm text-[var(--primary)] border-2 border-[var(--primary)] px-6 py-3 rounded-full hover:bg-[var(--primary)] hover:text-white transition-all shadow-lg active:scale-95"
          >
            Explorer les propriétés
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
