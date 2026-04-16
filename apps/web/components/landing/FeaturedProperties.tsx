import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BienCard } from '@/components/bien/BienCard'
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

const OFFSETS = [0, 16, 8, 24, 12, 4, 20, 8, 16, 0, 24, 12, 8, 20, 4, 16]

export async function FeaturedProperties() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select('id, titre, commune, quartier, type_bien, prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa, surface_m2, nb_pieces')
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
      className="relative py-20 sm:py-24 overflow-hidden -mt-10 rounded-t-[3rem] z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
      style={{ background: 'linear-gradient(180deg, #05132E 0%, #0C2D5E 60%, #081E48 100%)' }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none" />
      <div
        className="absolute top-0 left-0 w-[700px] h-[700px] anim-orb-1 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(80px)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] anim-orb-2 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(26,77,143,0.5) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}
      />

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
          <div>
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-sm font-sans font-bold uppercase tracking-wider">
              Sélection d&apos;exception
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Dernières annonces
            </h2>
            <p className="font-sans text-white/55 text-lg mt-3 max-w-md">
              {rows.length} biens disponibles, mis à jour en temps réel.
            </p>
          </div>
          <Link
            href="/biens"
            className="group shrink-0 inline-flex items-center gap-3 font-sans text-sm font-semibold text-white border border-white/20 rounded-full pl-6 pr-2 py-2 hover:bg-white/5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-xl active:scale-[0.98] self-start sm:self-auto"
          >
            <span>Voir tout ({rows.length}+)</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </Link>
        </ScrollReveal>

        {/* Floating grid with ScrollReveal stagger effect built-in our custom structure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rows.map((bien, i) => (
            <ScrollReveal
              key={bien.id}
              delay={0.1 + (i % 4) * 0.15} /* Stagger based on column index */
              className="h-full"
            >
              <div
                className="h-full xl:mt-[var(--card-offset)]"
                style={{
                  '--card-offset': i % 4 !== 0 ? `${OFFSETS[i % OFFSETS.length]}px` : '0',
                } as React.CSSProperties}
              >
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
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <ScrollReveal delay={0.3} className="text-center mt-24">
          <Link
            href="/biens"
            className="group inline-flex items-center gap-4 font-sans font-bold text-base bg-secondary text-white pl-8 pr-2 py-2 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.4)] hover:-translate-y-1 active:scale-[0.98] mx-auto overflow-hidden"
          >
            Explorer tous les biens
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
