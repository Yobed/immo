import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Globe, MapPin, BedDouble, Maximize, Info, MessageCircle } from 'lucide-react'
import { getConsolidatedBienById } from '@/lib/catalogue/consolidated'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SimilarBiensSection } from '@/components/catalogue/SimilarBiensSection'
import { SITE_URL } from '@/lib/env'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  // noindex systématique : ce sont des annonces republiées depuis des sites
  // tiers — les indexer nous exposerait au duplicate content.
  const robots = { index: false, follow: false }
  if (!/^\d+$/.test(id)) return { title: 'Annonce introuvable', robots }

  const bien = await getConsolidatedBienById('web', id)
  if (!bien) return { title: 'Annonce introuvable', robots }

  const lieu = [bien.quartier, bien.commune].filter(Boolean).join(', ')
  return {
    title: `${bien.type_bien} ${bien.commune} — ${bien.prix_label}`.trim().slice(0, 45),
    description:
      `${bien.type_bien} à ${lieu}, ${bien.prix_label}. Photos réelles. Validation conseiller avant visite.`.slice(0, 150),
    robots,
    alternates: { canonical: `${SITE_URL}/annonce/${bien.sourceId}` },
    openGraph: {
      title: bien.titre,
      description: `${bien.prix_label} — ${lieu}`,
      images: bien.photo_url ? [{ url: bien.photo_url }] : undefined,
      type: 'website',
    },
  }
}

export default async function AnnoncePage({ params }: PageProps) {
  const { id } = await params
  if (!/^\d+$/.test(id)) notFound()
  const bien = await getConsolidatedBienById('web', id)
  if (!bien) notFound()

  const lieu = [bien.quartier, bien.commune].filter(Boolean).join(', ')
  const galerie = bien.photos.length ? bien.photos : ([bien.photo_url].filter(Boolean) as string[])
  const [couverture, ...secondaires] = galerie

  return (
    <main className="bg-[var(--background)] min-h-screen pt-6 sm:pt-10 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumb
          items={[
            { label: 'Catalogue', href: '/catalogue' },
            { label: 'Annonces web', href: '/catalogue?source=web' },
            { label: bien.commune || 'Annonce' },
          ]}
          className="mb-6"
        />

        <Link
          href="/catalogue?source=web"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux annonces
        </Link>

        {/* Galerie : la couverture porte l'essentiel, les secondaires font la preuve */}
        {couverture && (
          <div className="grid gap-2 sm:grid-cols-3 mb-8">
            <div className="sm:col-span-3 relative aspect-[16/9] rounded-2xl overflow-hidden bg-[var(--surface-card)]">
              <Image
                src={couverture}
                alt={bien.titre}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 960px"
                className="object-cover"
              />
            </div>
            {secondaires.map((url, i) => (
              <div
                key={url}
                className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--surface-card)]"
              >
                <Image
                  src={url}
                  alt={`${bien.titre} — photo ${i + 2}`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 33vw, 320px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20 text-[11px] font-bold uppercase tracking-wider">
            <Globe className="w-3 h-3" />
            Annonce web
          </span>
          {bien.is_recent && (
            <span className="px-3 py-1 rounded-full bg-[var(--accent-luxury)]/10 text-[var(--accent-luxury)] border border-[var(--accent-luxury)]/20 text-[11px] font-bold uppercase tracking-wider">
              Nouveau
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-2">{bien.titre}</h1>

        {lieu && (
          <p className="flex items-center gap-1.5 text-[var(--text-muted)] mb-6">
            <MapPin className="w-4 h-4" />
            {lieu}
          </p>
        )}

        <p className="text-3xl font-bold text-[var(--accent-luxury)] mb-6">{bien.prix_label}</p>

        <div className="flex flex-wrap gap-4 mb-8 text-sm text-[var(--text-muted)]">
          {bien.surface_m2 && (
            <span className="inline-flex items-center gap-1.5">
              <Maximize className="w-4 h-4" />
              {bien.surface_m2} m²
            </span>
          )}
          {bien.nb_pieces && (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="w-4 h-4" />
              {bien.nb_pieces} pièce{bien.nb_pieces > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {bien.description && (
          <p className="text-[var(--text)] leading-relaxed whitespace-pre-line mb-8">
            {bien.description}
          </p>
        )}

        {/* Transparence : ne jamais laisser croire que l'offre est validée par nos soins. */}
        <div className="flex gap-3 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] mb-8">
          <Info className="w-5 h-5 shrink-0 text-[var(--text-muted)] mt-0.5" />
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Annonce repérée sur un site immobilier public. Les photos sont celles de
            l&apos;annonce d&apos;origine.{' '}
            <strong className="text-[var(--text)]">
              L&apos;offre n&apos;a pas encore été vérifiée par BOGBE&apos;S
            </strong>{' '}
            : un conseiller la contrôle avant toute visite pour vous éviter les mauvaises surprises.
          </p>
        </div>

        <a
          href={bien.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--accent-luxury)] text-[var(--on-accent)] font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          Faire vérifier ce bien par un conseiller
        </a>

        <div className="mt-16">
          <SimilarBiensSection
            excludeId={bien.sourceId}
            excludeSource="web"
            commune={bien.commune}
            type_bien={bien.type_bien}
            prix_value={bien.prix_value}
          />
        </div>
      </div>
    </main>
  )
}
