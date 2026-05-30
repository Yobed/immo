import { createClient } from '@/lib/supabase/server'
import { STATUTS_PUBLICS } from '@/lib/catalogue/statuts'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BienCard } from '@/components/bien/BienCard'
import type { Agence } from '@/lib/agences/types'

export const revalidate = 60 // ISR : revalide toutes les 60s

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agence } = await (supabase as any)
    .from('agences')
    .select('nom_commercial, description, logo_url, kyc_statut')
    .eq('slug', slug)
    .eq('kyc_statut', 'verifie')
    .single()

  if (!agence) {
    return { title: 'Agence introuvable — BOGBE\'S GROUPE' }
  }

  return {
    title: `${agence.nom_commercial} — Agence partenaire BOGBE'S`,
    description: agence.description?.slice(0, 160) ?? `Découvrez les biens publiés par ${agence.nom_commercial} sur BOGBE'S GROUPE.`,
    openGraph: {
      images: agence.logo_url ? [agence.logo_url] : [],
    },
  }
}

export default async function AgencePublicPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agence } = await (supabase as any)
    .from('agences')
    .select('*')
    .eq('slug', slug)
    .eq('kyc_statut', 'verifie')
    .single()

  if (!agence) {
    notFound()
  }

  const a = agence as Agence

  // Biens publiés par l'agence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: biens } = await (supabase as any)
    .from('biens')
    .select(`
      id, titre, commune, quartier, type_bien,
      prix_mois_fcfa, prix_nuit_fcfa, prix_vente_fcfa,
      surface_m2, nb_pieces, is_verifie, score_ia,
      biens_medias(url, est_couverture, ordre)
    `)
    .eq('agence_id', a.id)
    .in('statut', [...STATUTS_PUBLICS])
    .order('created_at', { ascending: false })
    .limit(24)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const biensList = ((biens as any[]) ?? []).map((b) => {
    const medias = (b.biens_medias ?? []).slice().sort((m1: { est_couverture?: boolean; ordre?: number }, m2: { est_couverture?: boolean; ordre?: number }) => {
      if (m1.est_couverture) return -1
      if (m2.est_couverture) return 1
      return (m1.ordre ?? 0) - (m2.ordre ?? 0)
    })
    const photo_url = medias[0]?.url ?? null
    return { ...b, photo_url }
  })

  const total = biensList.length

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      {/* HERO */}
      <section className="bg-[var(--surface-card)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-start gap-5 sm:gap-7 flex-wrap">
            {a.logo_url ? (
              <Image
                src={a.logo_url}
                alt={a.nom_commercial}
                width={96}
                height={96}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-card object-cover border border-[var(--border)] shrink-0"
              />
            ) : (
              <div
                aria-hidden
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-card bg-accent-luxury/15 text-[var(--accent-luxury)] flex items-center justify-center font-display text-3xl sm:text-4xl font-semibold shrink-0"
              >
                {a.nom_commercial.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
                  {a.nom_commercial}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-accent-luxury/10 text-[var(--accent-luxury)] text-xs font-sans font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Vérifiée
                </span>
              </div>

              {a.description && (
                <p className="mt-3 text-[var(--text-muted)] font-sans text-base leading-relaxed max-w-2xl">
                  {a.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-4 flex-wrap text-sm font-sans">
                {a.telephone_public && (
                  <a
                    href={`tel:${a.telephone_public}`}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-luxury)] transition-colors"
                  >
                    📞 {a.telephone_public}
                  </a>
                )}
                {a.email_public && (
                  <a
                    href={`mailto:${a.email_public}`}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-luxury)] transition-colors"
                  >
                    ✉️ {a.email_public}
                  </a>
                )}
                <span className="text-xs text-muted">
                  Agence partenaire BOGBE&apos;S GROUPE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BIENS */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-[var(--text)]">
            Biens publiés
            <span className="ml-2 text-base text-muted font-sans">({total})</span>
          </h2>
          <Link
            href={`/catalogue?agence_slug=${a.slug}`}
            className="text-sm font-sans text-[var(--accent-luxury)] hover:underline"
          >
            Voir dans le catalogue →
          </Link>
        </div>

        {total === 0 ? (
          <div className="bg-[var(--surface-card)] rounded-card border border-[var(--border)] p-10 text-center">
            <p className="font-sans text-muted">
              Aucun bien publié pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {biensList.map((b) => (
              <BienCard
                key={b.id}
                id={b.id}
                titre={b.titre}
                commune={b.commune}
                quartier={b.quartier}
                type_bien={b.type_bien}
                prix_mois_fcfa={b.prix_mois_fcfa}
                prix_nuit_fcfa={b.prix_nuit_fcfa}
                prix_vente_fcfa={b.prix_vente_fcfa}
                surface_m2={b.surface_m2}
                nb_pieces={b.nb_pieces}
                photo_url={b.photo_url}
                isVerified={b.is_verifie}
                aiScore={b.score_ia ?? undefined}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
