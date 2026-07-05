import Link from 'next/link'
import { ArrowRight, MapPin, MessageCircle } from 'lucide-react'
import { getConsolidatedCatalogue } from '@/lib/catalogue/consolidated'
import { UnifiedBienCard } from '@/components/catalogue/UnifiedBienCard'
import { UnifiedBienListCard } from '@/components/catalogue/UnifiedBienListCard'
import { SEO_COMMUNES, OFFRE_LABELS, type SeoCommune, type TypeOffre } from '@/lib/seo/communes'
import { SITE_URL } from '@/lib/env'

const MAX_ITEMS = 24

interface Props {
  offre: TypeOffre
  commune: SeoCommune
}

/**
 * Page d'atterrissage SEO « {location|vente} à {commune} ».
 * Rendue par app/(public)/location/[commune] et app/(public)/vente/[commune].
 */
export async function CommuneLanding({ offre, commune: c }: Props) {
  const { items } = await getConsolidatedCatalogue({
    commune: c.searchTerm,
    type_offre: offre,
    limitPerSource: MAX_ITEMS,
    sort: 'verified_first',
  })
  const shown = items.slice(0, MAX_ITEMS)
  const labels = OFFRE_LABELS[offre]
  const autreOffre: TypeOffre = offre === 'location' ? 'vente' : 'location'
  const catalogueHref = `/catalogue?commune=${encodeURIComponent(c.searchTerm)}&type_offre=${offre}`
  const introOffre =
    offre === 'location'
      ? `Découvrez ci-dessous les biens disponibles à la location à ${c.nom} : annonces vérifiées par notre équipe et offres flash captées en temps réel. Réservez votre visite en ligne et payez en toute sécurité par mobile money.`
      : `Découvrez ci-dessous les biens à vendre à ${c.nom} : annonces vérifiées par notre équipe et offres captées en temps réel. Nous vous accompagnons de la première visite jusqu'à la signature.`

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: labels.titre, item: `${SITE_URL}/catalogue?type_offre=${offre}` },
      { '@type': 'ListItem', position: 3, name: c.nom, item: `${SITE_URL}/${offre}/${c.slug}` },
    ],
  }

  return (
    <main className="bg-[var(--background)] min-h-screen pt-6 sm:pt-10 lg:pt-16 pb-16">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" className="mb-4 text-xs text-[var(--text-muted)]">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="hover:text-[var(--text)]">Accueil</Link></li>
            <li aria-hidden>›</li>
            <li><Link href={`/catalogue?type_offre=${offre}`} className="hover:text-[var(--text)]">{labels.titre}</Link></li>
            <li aria-hidden>›</li>
            <li className="text-[var(--text)] font-semibold">{c.nom}</li>
          </ol>
        </nav>

        {/* En-tête */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent-luxury)]" aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)]">
              Immobilier {c.isAbidjan ? 'à Abidjan' : 'en Côte d’Ivoire'}
            </p>
          </div>
          <h1 className="font-display text-2xl md:text-5xl font-bold text-[var(--text)] mb-4 tracking-tight">
            {labels.titre} à <span className="italic font-serif text-[var(--accent-luxury)]">{c.nom}</span>
          </h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed mb-3">{c.apropos}</p>
          <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed">{introOffre}</p>
          {c.quartiers.length > 0 && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Quartiers recherchés : {c.quartiers.join(' · ')}
            </p>
          )}
        </div>

        {/* Liste des biens */}
        {shown.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg md:text-2xl font-bold text-[var(--text)]">
                {shown.length} bien{shown.length > 1 ? 's' : ''} {offre === 'location' ? 'à louer' : 'à vendre'} à {c.nom}
              </h2>
              <Link
                href={catalogueHref}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-luxury)] hover:underline shrink-0"
              >
                Voir tout <ArrowRight className="w-4 h-4" aria-hidden />
              </Link>
            </div>
            <div className="flex flex-col gap-3 lg:hidden">
              {shown.map((b, i) => (
                <UnifiedBienListCard key={`m-${b.id}`} bien={b} index={i} />
              ))}
            </div>
            <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {shown.map((b, i) => (
                <UnifiedBienCard key={`d-${b.id}`} bien={b} index={i} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-8 text-center max-w-xl mx-auto">
            <p className="font-display text-lg font-bold text-[var(--text)] mb-2">
              Aucun bien {offre === 'location' ? 'à louer' : 'à vendre'} à {c.nom} pour le moment
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              De nouvelles annonces arrivent chaque jour. Dites-nous ce que vous cherchez et notre
              équipe vous alerte dès qu’un bien correspond.
            </p>
            <a
              href={`https://wa.me/2250544872051?text=${encodeURIComponent(
                `Bonjour, je cherche un bien en ${offre} à ${c.nom}. Pouvez-vous m'aider ?`,
              )}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-luxury)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              <MessageCircle className="w-4 h-4" aria-hidden /> Décrire ma recherche sur WhatsApp
            </a>
          </div>
        )}

        {/* Maillage interne — même commune autre offre + autres communes */}
        <section className="mt-14 border-t border-[var(--border)] pt-8">
          <div className="mb-6">
            <Link
              href={`/${autreOffre}/${c.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-luxury)] hover:underline"
            >
              Voir les biens {OFFRE_LABELS[autreOffre].nav.toLowerCase()} à {c.nom}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">
            {labels.titre} dans les autres communes
          </h2>
          <ul className="flex flex-wrap gap-2">
            {SEO_COMMUNES.filter((o) => o.slug !== c.slug).map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/${offre}/${o.slug}`}
                  className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface-card)] px-4 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent-luxury)] transition-colors"
                >
                  {o.nom}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
