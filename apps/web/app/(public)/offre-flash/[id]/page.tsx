import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  ArrowLeft, Flame, MapPin, BedDouble, Maximize,
  Calendar, Tag, AlertTriangle, ShieldCheck, Phone, MessageCircle,
} from 'lucide-react'
import { locauxClientForId } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow } from '@/lib/locaux/mapper'
import { formatFCFA } from '@/lib/format'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getDictionary } from '@/lib/i18n/server'
import { SimilarBiensSection } from '@/components/catalogue/SimilarBiensSection'
import { FlashContactModal } from '@/components/offre-flash/FlashContactModal'
import { FlashPlaceholder } from '@/components/offre-flash/FlashPlaceholder'
import { ViewCount } from '@/components/bien/ViewCount'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/env'

export const revalidate = 60
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Metadata Open Graph pour preview WhatsApp / réseaux sociaux.
 * Sans ça, le lien partagé affiche le preview générique du site.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const numId = parseInt(id, 10)
  // noindex : offre supprimée/expirée = page « introuvable » servie en HTTP 200
  // (streaming loading.tsx) → sans cette directive, les moteurs indexent ces
  // coquilles vides (soft 404).
  if (isNaN(numId)) return { title: 'Offre flash introuvable', robots: { index: false, follow: false } }

  const locaux = locauxClientForId(numId)
  const { data: row } = await locaux
    .from('locaux')
    .select('id,ref_bien,type_de_bien,type_offre,commune,quartier,prix,prix_normalise,caracteristiques,meubles,chambre,disponible,surface,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at,zone_geographique')
    .eq('id', numId)
    .single()

  if (!row) return { title: 'Offre flash introuvable', robots: { index: false, follow: false } }

  const bien = mapLocauxRow(row as LocauxRow)
  const lieu = [bien.quartier, bien.commune].filter(Boolean).join(', ')
  const prix = bien.prix_value
    ? formatFCFA(bien.prix_value) + (bien.prix_unit === 'fcfa_par_mois' ? '/mois' : bien.prix_unit === 'fcfa_par_m2' ? '/m²' : '')
    : bien.prix_label ?? 'Prix sur demande'

  // Title : ~45 chars max pour rester sous 60 chars avec le suffix
  // " | BOGBE'S GROUPE" ajouté par le template du layout.
  const title = `${bien.type_bien} ${bien.commune ?? ''} — ${prix}`.trim().slice(0, 45)
  // Description : ~150 chars max pour ne pas être tronquée mobile/Google.
  const description =
    `🔥 ${bien.type_bien} à ${lieu}, ${prix}. ` +
    `${bien.nb_chambres ? `${bien.nb_chambres} ch. ` : ''}` +
    // « Zéro arnaque » sans apostrophe : le générateur d'aperçu WhatsApp
    // affiche l'entité HTML brute (d&#x27;arnaque) au lieu de la décoder.
    `Validation conseiller avant visite. Zéro arnaque.`.slice(0, 150)

  const canonical = `${SITE_URL}/offre-flash/${bien.id}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      siteName: "BOGBE'S GROUPE",
      // images: auto-detected via app/(public)/offre-flash/[id]/opengraph-image.tsx
      // qui génère un visuel branded (map du quartier + overlay prix + badge
      // "à valider"), beaucoup plus impactant qu'une image générique pour
      // les previews WhatsApp.
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

function priceDisplay(prix_value: number | null, prix_unit: string | null, prix_label: string | null): string {
  if (prix_value == null) return prix_label || 'Prix sur demande'
  const formatted = formatFCFA(prix_value)
  if (prix_unit === 'fcfa_par_m2') return `${formatted} /m²`
  if (prix_unit === 'fcfa_par_mois') return `${formatted} /mois`
  return formatted
}

// Anciennement `buildAdvisorWhatsAppUrl` ouvrait wa.me direct vers le conseiller.
// Désormais remplacé par <FlashContactModal /> qui enregistre la demande server-side
// dans contact_requests et notifie l'admin via Wasender — l'admin contacte ensuite
// le propriétaire manuellement depuis flash_owner_phone.

export default async function OffreFlashDetailPage({ params }: PageProps) {
  const t = await getDictionary()
  const { id } = await params
  const numId = parseInt(id, 10)
  if (isNaN(numId)) notFound()

  const locaux = locauxClientForId(numId)
  // SECURITY: whitelist explicite, JAMAIS de select('*') ici.
  // Les colonnes telephone/telephone_bien sont volontairement omises.
  const { data: row } = await locaux
    .from('locaux')
    // SECURITY: publie_par, telephone, telephone_bien et groupe_whatsapp_origine
    // sont volontairement exclus — données identifiantes du propriétaire/source.
    .select('id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,caracteristiques,meubles,chambre,disponible,surface,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at')
    .eq('id', numId)
    .single()

  if (!row) notFound()

  const bien = mapLocauxRow(row as LocauxRow)
  const dateFormatted = new Date(bien.date_publication).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  // Pré-remplir le formulaire si l'utilisateur est connecté
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  let prefill: { name: string; phone: string; email: string } = { name: '', phone: '', email: '' }
  let isAdminUser = false
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .single()
    if (profile) {
      prefill = {
        name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || user.email || '',
      }
      isAdminUser = profile.role === 'admin'
    }
  }

  // Admin : contact DIRECT de la source (colonnes normalement masquées pour le
  // public). On ne fetch les colonnes sensibles QUE si l'utilisateur est admin.
  let flashOwnerPhone: string | null = null
  let flashOwnerName: string | null = null
  if (isAdminUser) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contactRow } = await (locaux as any)
      .from('locaux')
      .select('telephone_bien, telephone_expediteur, publie_par, expediteur')
      .eq('id', numId)
      .single()
    if (contactRow) {
      flashOwnerPhone = contactRow.telephone_bien || contactRow.telephone_expediteur || null
      flashOwnerName = contactRow.publie_par || contactRow.expediteur || null
    }
  }
  const flashAdminContact = isAdminUser ? (
    <div className="mb-3 p-3.5 rounded-xl bg-red-500/5 border border-red-500/25">
      <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 inline-flex items-center gap-1 mb-1.5">
        <ShieldCheck className="w-3 h-3" /> Contact source · admin
      </p>
      {flashOwnerName && <p className="text-sm font-bold text-[var(--text)]">{flashOwnerName}</p>}
      {flashOwnerPhone ? (
        <>
          <p className="text-sm font-mono text-[var(--text)] mt-0.5 select-all">{flashOwnerPhone}</p>
          <div className="flex gap-2 mt-2.5">
            <a
              href={`https://wa.me/${flashOwnerPhone.replace(/[^0-9]/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a
              href={`tel:${flashOwnerPhone}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Appeler
            </a>
          </div>
        </>
      ) : (
        <p className="text-xs text-[var(--text-muted)] mt-1">Aucun numéro dans l’annonce scrapée.</p>
      )}
    </div>
  ) : null

  return (
    <main className="bg-[var(--surface-hover)] min-h-screen pb-12">
      {/* Header */}
      <div className="bg-[var(--surface-card)] border-b border-[var(--border)] sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/offre-flash" className="flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text)] text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.flash.backToList}</span>
          </Link>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Flame className="w-3 h-3" /> {t.flash.tag}
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <Breadcrumb
          items={[
            { label: 'Offres flash', href: '/offre-flash' },
            { label: bien.commune, href: `/offre-flash?commune=${encodeURIComponent(bien.commune)}` },
            { label: bien.titre },
          ]}
          className="mb-4"
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
          {/* Colonne gauche */}
          <div className="space-y-5">
            {/* Image principale — placeholder honnête si pas de photo.
                viewTransitionName : reçoit le morph venant de la card cliquée sur /catalogue. */}
            <div
              className="relative aspect-[4/3] sm:aspect-[16/10] bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl overflow-hidden border border-[var(--border)]"
              style={{ viewTransitionName: 'bien-hero' }}
            >
              {bien.image_url ? (
                <Image
                  src={bien.image_url}
                  alt={bien.titre}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <FlashPlaceholder
                  typeBien={bien.type_bien}
                  commune={bien.commune}
                  quartier={bien.quartier}
                  variant="hero"
                />
              )}
              {bien.is_recent && (
                <span className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                  <Flame className="w-3.5 h-3.5" /> Nouveau
                </span>
              )}
            </div>

            {/* Titre + meta */}
            <div className="bg-[var(--surface-card)] rounded-2xl p-5 md:p-6 border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                  {bien.type_offre === 'location' ? 'À louer' : bien.type_offre === 'vente' ? 'À vendre' : 'Offre'}
                </span>
                <span className="px-2 py-0.5 bg-[var(--surface-hover)] text-[var(--text)] text-[10px] font-bold uppercase tracking-wide rounded-full capitalize">
                  {bien.type_bien}
                </span>
                {bien.meuble && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wide rounded-full">
                    Meublé
                  </span>
                )}
                <ViewCount bienId={String(bien.id)} source="flash" />
              </div>

              <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--text)] mb-2 capitalize leading-tight">
                {bien.type_bien} · {bien.commune}
              </h1>

              <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-sm mb-4">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>{[bien.quartier, bien.commune, bien.zone].filter(Boolean).join(', ')}</span>
              </div>

              <div className="text-3xl md:text-4xl font-display font-bold text-orange-600 mb-2">
                {priceDisplay(bien.prix_value, bien.prix_unit, bien.prix_label)}
              </div>
              {bien.prix_label && bien.prix_value != null && bien.prix_label !== priceDisplay(bien.prix_value, bien.prix_unit, null) && (
                <p className="text-xs text-[var(--text-subtle)] italic">{t.flash.source}: {bien.prix_label}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-[var(--border)]">
                {bien.nb_chambres != null && bien.nb_chambres > 0 && (
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-bold text-[var(--text)] text-base leading-none">{bien.nb_chambres}</div>
                      <div className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wide mt-0.5">{bien.nb_chambres > 1 ? t.flash.bedrooms : t.flash.bedroom}</div>
                    </div>
                  </div>
                )}
                {bien.surface_m2 && (
                  <div className="flex items-center gap-2">
                    <Maximize className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-bold text-[var(--text)] text-base leading-none">{bien.surface_m2.toLocaleString('fr-FR')} m²</div>
                      <div className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wide mt-0.5">{t.flash.surface}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-mono font-bold text-[var(--text)] text-xs leading-none">{bien.ref}</div>
                    <div className="text-[10px] text-[var(--text-subtle)] uppercase tracking-wide mt-0.5">{t.flash.reference}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {bien.description && (
              <div className="bg-[var(--surface-card)] rounded-2xl p-5 md:p-6 border border-[var(--border)]">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-subtle)] mb-3">{t.bien.description}</h2>
                <p className="text-[var(--text)] text-sm leading-[1.7] whitespace-pre-wrap break-words">
                  {bien.description}
                </p>
              </div>
            )}

            {/* Caractéristiques */}
            {bien.caracteristiques && bien.caracteristiques !== bien.description && (
              <div className="bg-[var(--surface-card)] rounded-2xl p-5 md:p-6 border border-[var(--border)]">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-subtle)] mb-3">{t.flash.characteristics}</h2>
                <p className="text-[var(--text)] text-sm leading-[1.7] whitespace-pre-wrap">
                  {bien.caracteristiques}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Avertissement EN HAUT — visible avant les CTAs */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="block mb-1">⚡ {t.flash.warning}</strong>
                  {t.flash.warningBody}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-[var(--surface-card)] rounded-2xl p-5 border border-[var(--border)] sticky top-20">
              <h3 className="font-bold text-[var(--text)] text-sm mb-1">{t.flash.contactSeller}</h3>
              <p className="text-[var(--text-subtle)] text-xs mb-4">{t.flash.broadcastedOn}</p>

              <div className="space-y-2">
                {flashAdminContact}
                <FlashContactModal
                  locauxId={bien.id}
                  bienTitre={bien.titre}
                  initialName={prefill.name}
                  initialPhone={prefill.phone}
                  initialEmail={prefill.email}
                />
                <p className="text-[10px] text-[var(--text-subtle)] text-center px-2 leading-relaxed">
                  🔒 {t.flash.contactBtnHint}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {t.flash.publishedOn} <strong className="text-[var(--text)]">{new Date(bien.date_publication).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-subtle)] pl-4.5">
                  {dateFormatted}
                </div>
                {bien.date_scraping && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <span className="relative flex w-2 h-2">
                      <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-60" />
                      <span className="relative rounded-full w-2 h-2 bg-emerald-500" />
                    </span>
                    <span>
                      Mise à jour <strong>{new Date(bien.date_scraping).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cross-promo — Biens vérifiés */}
            <div className="bg-[var(--surface-card)] rounded-2xl p-4 border border-[var(--border)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-subtle)] mb-2">{t.flash.verifiedSearch}</p>
              <Link
                href="/biens"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {t.nav.biens} →
              </Link>
            </div>
          </aside>
        </div>

        {/* Biens similaires (même type, même commune, ±25% prix) */}
        <SimilarBiensSection
          excludeId={String(bien.id)}
          excludeSource="flash"
          commune={bien.commune}
          type_bien={bien.type_bien}
          prix_value={bien.prix_value}
        />
      </div>

      {/* Mobile-only — Sticky CTA en bas pour atteindre la demande de visite
          depuis n'importe où dans le scroll */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-[var(--border)] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <FlashContactModal
          locauxId={bien.id}
          bienTitre={bien.titre}
          initialName={prefill.name}
          initialPhone={prefill.phone}
          initialEmail={prefill.email}
        />
      </div>
    </main>
  )
}
