import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Globe, MapPin, BedDouble, Maximize, Info, MessageCircle, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react'
import { getConsolidatedBienById } from '@/lib/catalogue/consolidated'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SimilarBiensSection } from '@/components/catalogue/SimilarBiensSection'
import { presentDescription } from '@/lib/catalogue/description-presentation'
import { SITE_URL } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { createAnnoncesClient } from '@/lib/supabase/annonces'

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    isAdmin = profile?.role === 'admin'
  }
  let adminContact: string | null = null
  let adminSourceUrl: string | null = null
  if (isAdmin) {
    // Contact is fetched only after the role check and never enters public catalogue data.
    const { data: privateRow } = await (createAnnoncesClient() as any)
      .from('annonces').select('contact, url').eq('id', Number(id)).maybeSingle()
    adminContact = privateRow?.contact ?? null
    adminSourceUrl = privateRow?.url ?? null
  }

  const lieu = [bien.quartier, bien.commune].filter(Boolean).join(', ')
  const galerie = bien.photos.length ? bien.photos : ([bien.photo_url].filter(Boolean) as string[])
  const [couverture, ...secondaires] = galerie
  const description = presentDescription(bien.description)

  return (
    <main className="bg-[var(--background)] min-h-screen pt-6 sm:pt-10 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
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
                unoptimized
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
                  unoptimized
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

        <p className="text-xs font-semibold tracking-wide text-[var(--text-muted)] mb-3">
          Référence : WEB-{bien.sourceId}
        </p>

        {lieu && (
          <p className="flex items-center gap-1.5 text-[var(--text-muted)] mb-6">
            <MapPin className="w-4 h-4" />
            {lieu}
          </p>
        )}

        <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-luxury)] mb-6 break-words">{bien.prix_label}</p>

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

        {description.text && (
          <section className="mb-8 rounded-3xl border border-[var(--border)] bg-[var(--surface-card)] p-5 sm:p-7 lg:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-hover)] text-[var(--accent-luxury)]">
                <BookOpen aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Description complète</p>
                <h2 className="mt-0.5 text-lg font-bold text-[var(--text)]">À propos de ce bien</h2>
              </div>
            </div>
            <div className="mt-5 max-w-[75ch] space-y-3 text-[15px] leading-7 text-[var(--text)] sm:text-base">
              {description.blocks.map((block, index) => (
                <p key={`${block}-${index}`} className="break-words">{block}</p>
              ))}
            </div>
          </section>
        )}

        {isAdmin && (
          <section className="mb-8 rounded-3xl border border-emerald-600/30 bg-emerald-600/10 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Accès réservé</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--text)]">Informations administrateur</h2>
              </div>
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-600/20 bg-[var(--surface-card)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Contact source</p>
                <p className="mt-2 break-words text-sm font-semibold text-[var(--text)]">{adminContact || 'Non renseigné'}</p>
              </div>
              {adminSourceUrl ? (
                <a className="group rounded-2xl border border-[var(--accent-luxury)]/60 bg-[var(--surface-card)] p-4 transition hover:border-[var(--accent-luxury)]" href={adminSourceUrl} target="_blank" rel="noreferrer">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Source d’origine</p>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-luxury)]">Ouvrir l’annonce source <ExternalLink className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                </a>
              ) : (
                <div className="rounded-2xl border border-emerald-600/20 bg-[var(--surface-card)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Source d’origine</p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Lien non renseigné</p>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">Ces informations servent au traitement interne. Le prospect passe toujours par un conseiller.</p>
          </section>
        )}

        {/* Transparence : ne jamais laisser croire que l'offre est validée par nos soins. */}
        {!isAdmin && <div className="flex gap-3 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] mb-8">
          <Info className="w-5 h-5 shrink-0 text-[var(--text-muted)] mt-0.5" />
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            <strong className="block text-[var(--text)] mb-1">Une opportunité à saisir ?</strong>
            Les disponibilités évoluent vite. Notre conseiller vérifie ce bien avec le propriétaire
            et vous accompagne pour obtenir un créneau de visite, en toute confiance.
          </p>
        </div>}

        {!isAdmin && <a
          href={bien.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--accent-luxury)] text-[var(--on-accent)] font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          Obtenir mon créneau de visite
        </a>}

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
