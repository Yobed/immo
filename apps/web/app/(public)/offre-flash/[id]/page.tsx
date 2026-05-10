import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Flame, MapPin, BedDouble, Maximize,
  MessageCircle, Calendar, User, Tag, AlertTriangle,
} from 'lucide-react'
import { createLocauxClient } from '@/lib/supabase/locaux'
import { mapLocauxRow, type LocauxRow } from '@/lib/locaux/mapper'
import { formatFCFA } from '@/lib/format'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { getDictionary } from '@/lib/i18n/server'

export const revalidate = 60
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

function priceDisplay(prix_value: number | null, prix_unit: string | null, prix_label: string | null): string {
  if (prix_value == null) return prix_label || 'Prix sur demande'
  const formatted = formatFCFA(prix_value)
  if (prix_unit === 'fcfa_par_m2') return `${formatted} /m²`
  if (prix_unit === 'fcfa_par_mois') return `${formatted} /mois`
  return formatted
}

/**
 * Numéro du conseiller BOGBE'S — toutes les prises de contact sur les offres flash
 * passent par lui pour préserver la confidentialité du propriétaire scrapé.
 */
const ADVISOR_PHONE = '2250544872051'

function buildAdvisorWhatsAppUrl(id: number, ref: string, titre: string, commune: string, prix: string | null): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bogbes-groupe.vercel.app'
  const link = `${siteUrl}/offre-flash/${id}`
  const msg = encodeURIComponent(
    `Bonjour BOGBE'S, je suis intéressé(e) par cette offre flash :\n\n*${titre}*\n📍 ${commune}${prix ? `\n💰 ${prix}` : ''}\nRéf : ${ref}\n\n🔗 ${link}\n\nPouvez-vous me confirmer la disponibilité et organiser une visite ?`
  )
  return `https://wa.me/${ADVISOR_PHONE}?text=${msg}`
}

export default async function OffreFlashDetailPage({ params }: PageProps) {
  const t = await getDictionary()
  const { id } = await params
  const numId = parseInt(id, 10)
  if (isNaN(numId)) notFound()

  const locaux = createLocauxClient()
  // SECURITY: whitelist explicite, JAMAIS de select('*') ici.
  // Les colonnes telephone/telephone_bien sont volontairement omises.
  const { data: row } = await locaux
    .from('locaux')
    .select('id,ref_bien,type_de_bien,type_offre,zone_geographique,commune,quartier,prix,prix_normalise,caracteristiques,publie_par,meubles,chambre,disponible,surface,groupe_whatsapp_origine,date_publication,lien_image,message_initial,status,is_duplicate,date_expiration,created_at')
    .eq('id', numId)
    .single()

  if (!row) notFound()

  const bien = mapLocauxRow(row as LocauxRow)
  const dateFormatted = new Date(bien.date_publication).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <main className="bg-slate-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/offre-flash" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium">
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
            {/* Image principale */}
            <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl overflow-hidden border border-slate-200">
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
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Flame className="w-20 h-20" />
                </div>
              )}
              {bien.is_recent && (
                <span className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                  <Flame className="w-3.5 h-3.5" /> Nouveau
                </span>
              )}
            </div>

            {/* Titre + meta */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                  {bien.type_offre === 'location' ? 'À louer' : bien.type_offre === 'vente' ? 'À vendre' : 'Offre'}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wide rounded-full capitalize">
                  {bien.type_bien}
                </span>
                {bien.meuble && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wide rounded-full">
                    Meublé
                  </span>
                )}
              </div>

              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2 capitalize leading-tight">
                {bien.type_bien} · {bien.commune}
              </h1>

              <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>{[bien.quartier, bien.commune, bien.zone].filter(Boolean).join(', ')}</span>
              </div>

              <div className="text-3xl md:text-4xl font-display font-bold text-orange-600 mb-2">
                {priceDisplay(bien.prix_value, bien.prix_unit, bien.prix_label)}
              </div>
              {bien.prix_label && bien.prix_value != null && bien.prix_label !== priceDisplay(bien.prix_value, bien.prix_unit, null) && (
                <p className="text-xs text-slate-400 italic">{t.flash.source}: {bien.prix_label}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-slate-100">
                {bien.nb_chambres != null && bien.nb_chambres > 0 && (
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-base leading-none">{bien.nb_chambres}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{bien.nb_chambres > 1 ? t.flash.bedrooms : t.flash.bedroom}</div>
                    </div>
                  </div>
                )}
                {bien.surface_m2 && (
                  <div className="flex items-center gap-2">
                    <Maximize className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-base leading-none">{bien.surface_m2.toLocaleString('fr-FR')} m²</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{t.flash.surface}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-xs leading-none">{bien.ref}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{t.flash.reference}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {bien.description && (
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-3">{t.bien.description}</h2>
                <p className="text-slate-700 text-sm leading-[1.7] whitespace-pre-wrap break-words">
                  {bien.description}
                </p>
              </div>
            )}

            {/* Caractéristiques */}
            {bien.caracteristiques && bien.caracteristiques !== bien.description && (
              <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-3">{t.flash.characteristics}</h2>
                <p className="text-slate-700 text-sm leading-[1.7] whitespace-pre-wrap">
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
            <div className="bg-white rounded-2xl p-5 border border-slate-200 sticky top-20">
              <h3 className="font-bold text-slate-900 text-sm mb-1">{t.flash.contactSeller}</h3>
              <p className="text-slate-400 text-xs mb-4">{t.flash.broadcastedOn}</p>

              {bien.publie_par && (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t.flash.publishedBy}</div>
                    <div className="font-bold text-slate-800 text-sm leading-none mt-0.5">{bien.publie_par}</div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <a
                  href={buildAdvisorWhatsAppUrl(bien.id, bien.ref, bien.titre, bien.commune, bien.prix_label)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center justify-center gap-2 w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors overflow-hidden group"
                >
                  <span className="absolute left-5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white/80" />
                  </span>
                  <MessageCircle className="w-4 h-4 ml-4" />
                  {t.flash.contactBtn}
                </a>
                <p className="text-[10px] text-slate-400 text-center px-2 leading-relaxed">
                  🔒 {t.flash.contactBtnHint}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Calendar className="w-3 h-3" />
                {t.flash.publishedOn} {new Date(bien.date_publication).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-[11px] text-slate-400">
                {dateFormatted}
              </div>
            </div>

            {/* Cross-promo — Biens vérifiés */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">{t.flash.verifiedSearch}</p>
              <Link
                href="/biens"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {t.nav.biens} →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
