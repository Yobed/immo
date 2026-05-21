export const revalidate = 3600 // ISR: revalide toutes les 1h

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { formatFCFA } from '@/lib/format'
import { Badge } from '@/components/ui'
import { TYPES_BIEN_LABELS, EQUIPEMENTS_LABELS } from '@immo-ci/shared/constants/biens'
import { BienCarousel } from '@/components/bien/BienCarousel'
import { BienCard } from '@/components/bien/BienCard'
import { Bien360 } from '@/components/bien/Bien360'
import { FavorisWithNote } from '@/components/bien/FavorisWithNote'
import { VisiteRequestForm } from '@/components/bien/VisiteRequestForm'
import { VIPConciergeButton } from '@/components/bien/VIPConciergeButton'
import { DemanderContactWhatsAppButton } from '@/components/bien/DemanderContactWhatsAppButton'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { VirtualTourViewer } from '@/components/bien/VirtualTourViewer'
import { BienMap } from '@/components/bien/BienMap'
import { DeleteBienButton } from '@/components/bien/DeleteBienButton'
import {
  MapPin,
  Sparkles,
  Eye,
  ArrowRight,
  Flame,
} from 'lucide-react'
import * as motion from 'framer-motion/client'
import { DiscoveryBar } from '@/components/bien/DiscoveryBar'
import { BroadcastButton } from '@/components/bien/BroadcastButton'
import { StickyMobileCTA } from '@/components/bien/StickyMobileCTA'
import { BienMediaGallery } from '@/components/bien/BienMediaGallery'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ViewCount } from '@/components/bien/ViewCount'
import { getDictionary } from '@/lib/i18n/server'
import { MediaNavBar } from '@/components/bien/MediaNavBar'
import { ExpandableText } from '@/components/bien/ExpandableText'
import { ScrollToTop } from '@/components/bien/ScrollToTop'
import { TrackView } from '@/components/bien/TrackView'
import { ShareButton } from '@/components/bien/ShareButton'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bien } = await (supabase as any)
    .from('biens')
    .select('titre, commune, quartier, type_bien, prix_mois_fcfa, prix_vente_fcfa, biens_medias(url, est_couverture, ordre)')
    .eq('id', id)
    .eq('statut', 'publie')
    .limit(1)
    .single()

  if (!bien) return { title: "Bien introuvable — BOGBE'S GROUPE" }

  const photo = (bien.biens_medias as { url: string; est_couverture: boolean; ordre: number }[] | null)
    ?.sort((a, b) => (b.est_couverture ? 1 : 0) - (a.est_couverture ? 1 : 0))[0]?.url
  const lieu = [bien.quartier, bien.commune].filter(Boolean).join(', ')
  const prix = bien.prix_vente_fcfa
    ? formatFCFA(bien.prix_vente_fcfa)
    : bien.prix_mois_fcfa ? `${formatFCFA(bien.prix_mois_fcfa)}/mois` : ''
  const desc = `${bien.type_bien} à ${lieu}${prix ? ` — ${prix}` : ''}. Découvrez ce bien sur BOGBE'S GROUPE, la plateforme immobilière N°1 en Côte d'Ivoire.`

  return {
    title: `${bien.titre} — ${lieu} | BOGBE'S GROUPE`,
    description: desc,
    keywords: [`immobilier luxe Abidjan`, `location meublée ${bien.commune}`, `achat appartement ${bien.commune}`, `BOGBE'S GROUPE prestige`, bien.titre],
    authors: [{ name: "BOGBE'S GROUPE" }],
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bogbes-groupe.vercel.app'}/biens/${id}` },
    openGraph: {
      title: bien.titre,
      description: desc,
      images: photo ? [{ url: photo, width: 1200, height: 800, alt: bien.titre }] : [],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title: bien.titre, description: desc },
  }
}

export default async function FicheBienPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getDictionary()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bien, error: bienError } = await (supabase as any)
    .from('biens')
    .select(`
      *,
      biens_medias(id, url, type, titre, ordre, est_couverture, hotspots, embed_url, duree_sec)
    `)
    .eq('id', id)
    .maybeSingle()

  if (bienError) console.error('[FicheBien] query error:', bienError)
  if (!bien) notFound()

  const isOwner = !!(user?.id && user.id === bien.proprietaire_id)
  if (bien.statut !== 'publie' && !isOwner) notFound()

  // Fetch owner profile separately to avoid RLS conflicts on the join
  const { data: proprio } = await (supabase as any)
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', bien.proprietaire_id)
    .maybeSingle()

  const [{ data: favoriRow }] = await Promise.all([
    user?.id
      ? supabase.from('favoris').select('id').eq('user_id', user.id).eq('bien_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  const initialIsFavori = !!favoriRow

  const medias = ((bien.biens_medias as any[]) ?? []).sort((a: any, b: any) => a.ordre - b.ordre)
  let videoMedias = medias.filter((m: any) => m.type === 'video')

  if (videoMedias.length === 0) {
    videoMedias = [{
      id: 'demo-marketing-5.0',
      url: 'https://cdn.pixabay.com/vimeo/843799894/luxury-hotel-resort-swimming-pool-holiday-171120.mp4?width=1280&hash=53f4e8e6b185b9b8b0e6e8e6b185b9b8b0e6e8e6',
      titre: 'Sapphire Experience 5.0',
      type: 'video'
    }]
  }

  const vue360Medias = medias.filter((m: any) => m.type === '360')
  const isNuitee = bien.type_bien?.toLowerCase().includes('meublee') || 
                   bien.type_bien?.toLowerCase().includes('meublé') || 
                   bien.type_bien?.toLowerCase().includes('nuit') || 
                   bien.type_bien === 'residence_meublee'

  const prixValue = isNuitee && bien.prix_nuit_fcfa ? bien.prix_nuit_fcfa : bien.prix_mois_fcfa ? bien.prix_mois_fcfa : bien.prix_vente_fcfa
  const prixSuffix = isNuitee ? '/nuit' : bien.prix_mois_fcfa ? '/mois' : ''

  const stats = [
    { label: 'Superficie', value: bien.surface_m2 ? `${bien.surface_m2} m²` : null, key: 'surface' },
    { label: 'Pièces', value: bien.nb_pieces, key: 'pieces' },
    { label: 'Chambres', value: bien.nb_chambres, key: 'chambres' },
    { label: 'Bains', value: bien.nb_salles_bain, key: 'bains' },
  ].filter(s => s.value != null) as { label: string; value: string | number; key: string }[]

  const prix = prixValue ? { value: formatFCFA(prixValue), suffix: prixSuffix } : null

  // Recommandations : commune + type + plage prix ±30%, fallback progressif
  const refPrice = bien.prix_vente_fcfa ?? bien.prix_mois_fcfa ?? bien.prix_nuit_fcfa ?? null
  const priceField: 'prix_vente_fcfa' | 'prix_mois_fcfa' | 'prix_nuit_fcfa' | null =
    bien.prix_vente_fcfa ? 'prix_vente_fcfa'
      : bien.prix_mois_fcfa ? 'prix_mois_fcfa'
      : bien.prix_nuit_fcfa ? 'prix_nuit_fcfa'
      : null

  const baseQuery = () => (supabase as any)
    .from('biens')
    .select('*, biens_medias(url, est_couverture)')
    .neq('id', id)
    .eq('statut', 'publie')
    .order('score_ia', { ascending: false, nullsFirst: false })
    .order('is_verifie', { ascending: false })

  // Strict: même commune + même type + plage prix
  let strict = baseQuery()
    .eq('commune', bien.commune)
    .eq('type_bien', bien.type_bien)
    .limit(6)
  if (refPrice && priceField) {
    strict = strict
      .gte(priceField, Math.round(refPrice * 0.7))
      .lte(priceField, Math.round(refPrice * 1.3))
  }
  let { data: similarBiensRaw } = await strict

  // Fallback 1: même commune + même type (sans plage prix)
  if (!similarBiensRaw || similarBiensRaw.length < 3) {
    const { data } = await baseQuery()
      .eq('commune', bien.commune)
      .eq('type_bien', bien.type_bien)
      .limit(6)
    similarBiensRaw = data
  }

  // Fallback 2: même commune (n'importe quel type)
  if (!similarBiensRaw || similarBiensRaw.length < 3) {
    const { data } = await baseQuery()
      .eq('commune', bien.commune)
      .limit(6)
    similarBiensRaw = data
  }

  // Fallback 3: même type, hors commune
  if (!similarBiensRaw || similarBiensRaw.length === 0) {
    const { data } = await baseQuery()
      .eq('type_bien', bien.type_bien)
      .limit(6)
    similarBiensRaw = data
  }

  // Avis sur le propriétaire
  const { data: avisData } = bien.proprietaire_id
    ? await (supabase as any)
        .from('avis')
        .select('note, commentaire, created_at, profiles!avis_auteur_id_fkey(full_name, avatar_url)')
        .eq('cible_id', bien.proprietaire_id)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const avis = (avisData ?? []) as { note: number; commentaire: string | null; created_at: string; profiles: { full_name: string; avatar_url: string | null } | null }[]
  const avgNote = avis.length > 0 ? Math.round(avis.reduce((s, a) => s + a.note, 0) / avis.length * 10) / 10 : null

  const similarBiens = (similarBiensRaw ?? []).map((b: any) => ({
    ...b,
    photo_url: (b.biens_medias as any[])?.find((m: any) => m.est_couverture)?.url || (b.biens_medias as any[])?.[0]?.url
  }))

  const prixLabel = prix ? `${prix.value}${prix.suffix}` : ''

  return (
    <main className="bg-white min-h-screen selection:bg-accent-luxury/20 font-sans text-slate-800 antialiased overflow-x-hidden pb-20 lg:pb-0">
      <ScrollToTop />
      <TrackView
        id={bien.id}
        titre={bien.titre}
        commune={bien.commune}
        type_bien={bien.type_bien}
        prix={prixLabel}
        photo_url={medias.find((m: any) => m.est_couverture)?.url ?? medias[0]?.url ?? null}
      />


      {/* Discovery Bar — desktop only */}
      <div className="hidden md:block">
        <DiscoveryBar bien={bien} prix={prix} userId={user?.id ?? null} />
      </div>

      {/* ─── HERO + ONGLETS MÉDIAS + STATS ─── */}
      <BienMediaGallery
        medias={medias.map((m: any) => ({
          id: m.id, type: m.type, url: m.url,
          embed_url: m.embed_url, titre: m.titre,
          hotspots: m.hotspots, duree_sec: m.duree_sec,
        }))}
        bien={{
          id: bien.id, titre: bien.titre, commune: bien.commune,
          quartier: bien.quartier, type_bien: bien.type_bien,
          is_verifie: bien.is_verifie, url_visite_3d: bien.url_visite_3d,
        }}
        prix={prix}
        stats={stats}
        typeLabel={TYPES_BIEN_LABELS[bien.type_bien] || bien.type_bien}
        userId={user?.id ?? null}
      />

      {/* ─── MAIN CONTENT — carte blanche arrondie style Airbnb ─── */}
      <div className="bg-white rounded-t-[28px] -mt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] relative z-10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-14">

        {/* Breadcrumb + proof social */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <Breadcrumb
            items={[
              { label: 'Catalogue', href: '/catalogue' },
              { label: bien.commune, href: `/catalogue?commune=${encodeURIComponent(bien.commune)}` },
              ...(bien.quartier ? [{ label: bien.quartier }] : []),
              { label: bien.titre },
            ]}
          />
          <ViewCount bienId={bien.id} />
        </div>

        {/* Media quick nav */}
        <div className="mb-8">
          <MediaNavBar
            photoCount={medias.filter((m: any) => m.type === 'photo').length}
            videoMedias={videoMedias.map((v: any) => ({ id: v.id, url: v.url, titre: v.titre }))}
            has360={vue360Medias.length > 0}
            has3D={!!bien.url_visite_3d}
            bienTitre={bien.titre}
            bienCommune={bien.commune}
            prixFormatted={prix ? prix.value + prix.suffix : ''}
            bienId={bien.id}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-14">

          {/* Left column */}
          <div className="flex-1 min-w-0">

            {/* ACTIONS rapides */}
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              <ShareButton titre={bien.titre} />
              {user?.id && (
                <FavorisWithNote bienId={bien.id} userId={user.id} initialIsFavori={initialIsFavori} />
              )}
            </div>

            {/* DESCRIPTION */}
            {bien.description && (
              <section className="mb-8 pl-4 border-l-2 border-accent-luxury/50">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-3">{t.bien.description}</h2>
                <ExpandableText text={bien.description} />
              </section>
            )}

            {/* ÉQUIPEMENTS */}
            {bien.equipements?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-3">{t.bien.equipments}</h2>
                <div className="flex flex-wrap gap-2">
                  {bien.equipements.map((eq: string) => (
                    <span key={eq} className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
                      {EQUIPEMENTS_LABELS[eq] ?? eq}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* AVIS PROPRIÉTAIRE */}
            {avis.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                    {t.bien.ownerReviews}
                  </h2>
                  {avgNote && (
                    <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {'★'.repeat(Math.round(avgNote))}{'☆'.repeat(5 - Math.round(avgNote))} {avgNote}/5
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {avis.map((a, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 text-sm">{a.profiles?.full_name ?? 'Locataire vérifié'}</span>
                        <span className="text-amber-500 text-sm">{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</span>
                      </div>
                      {a.commentaire && (
                        <p className="text-slate-600 text-sm leading-relaxed">{a.commentaire}</p>
                      )}
                      <p className="text-slate-400 text-[10px] mt-2">
                        {new Date(a.created_at).toLocaleDateString('fr-CI', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* VISITE 3D */}
            {(bien.url_visite_3d || vue360Medias.length > 0) && (
              <section id="visite-3d" className="mb-8 scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-4 h-4 text-accent-luxury/60" />
                  <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                    {t.bien.virtualTour}
                  </h2>
                </div>
                <div className="space-y-4">
                  {bien.url_visite_3d && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200">
                      <VirtualTourViewer url={bien.url_visite_3d} title={bien.titre} />
                    </div>
                  )}
                  {vue360Medias.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vue360Medias.map((media: any, i: number) => (
                        <div key={media.id} className="relative aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200">
                          <Bien360 panoramaUrl={media.url} />
                          <div className="absolute bottom-3 left-3 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full">
                            <span className="text-[8px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-1.5">
                              <Sparkles className="w-2.5 h-2.5 text-accent-luxury" />
                              {media.titre || `Vue ${i + 1}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* LOCALISATION */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-4 h-4 text-accent-luxury/60" />
                <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  {t.bien.location}
                </h3>
              </div>
              <BienMap
                latitude={bien.latitude}
                longitude={bien.longitude}
                titre={bien.titre}
                commune={bien.commune}
                hauteur={400}
              />
            </section>

            {/* Owner management (desktop only — mobile shown above) */}
            {isOwner && (
              <section className="mb-8 space-y-2.5 hidden lg:block">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">{t.bien.ownerManagement}</p>
                <Link href={`/mes-biens/${bien.id}/modifier`} className="flex items-center justify-center w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-accent-luxury transition-all">
                  {t.bien.editAd}
                </Link>
                <Link href={`/mes-biens/${bien.id}/modifier?step=medias`} className="flex items-center justify-center w-full py-3.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                  {t.bien.manageMedia}
                </Link>
                <BroadcastButton bienId={bien.id} statut={bien.statut} />
                <div className="pt-3 border-t border-slate-100">
                  <DeleteBienButton bienId={bien.id} titre={bien.titre} />
                </div>
              </section>
            )}
          </div>

          {/* ─── SIDEBAR DESKTOP ─── */}
          <aside id="reserver" className="hidden lg:block w-[360px] xl:w-[400px] shrink-0 scroll-mt-24">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 relative overflow-hidden"
              >
                <div className="relative z-10">

                  {/* PRIX */}
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-display font-bold tracking-tighter text-slate-900">
                        {prixValue ? formatFCFA(prixValue) : 'Sur Demande'}
                      </span>
                      {prixSuffix && <span className="text-slate-400 text-sm">{prixSuffix}</span>}
                    </div>
                    {bien.charges_mois_fcfa > 0 && (
                      <p className="text-slate-400 text-xs mt-1">+ {formatFCFA(bien.charges_mois_fcfa)} charges/mois</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-600 text-xs font-medium">Disponible</span>
                    </div>
                  </div>

                  {!isOwner ? (
                    <div className="space-y-3">
                      {isNuitee ? (
                        <Link
                          href={`/reservations/nouvelle?bienId=${bien.id}`}
                          className="flex items-center justify-center w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-accent-luxury transition-all duration-300 active:scale-[0.98]"
                        >
                          Demander une visite
                        </Link>
                      ) : (
                        <>
                          <VIPConciergeButton
                            bienTitre={bien.titre}
                            bienLieu={`${bien.commune}${bien.quartier ? `, ${bien.quartier}` : ''}`}
                            bienPrix={`${formatFCFA(prixValue!)}${prixSuffix}`}
                            bienId={bien.id}
                          />
                          {/* Trust strip */}
                          <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="text-[11px] text-slate-600 leading-tight">
                              Un conseiller vous rappelle{' '}
                              <strong className="text-slate-900">dans l&apos;heure</strong> — service gratuit
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[10px] text-slate-300 uppercase tracking-widest">ou</span>
                            <div className="flex-1 h-px bg-slate-100" />
                          </div>
                          <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id as string} isPremium={true} />
                          <div className="flex items-center gap-3 pt-1">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[10px] text-slate-300 uppercase tracking-widest">ou</span>
                            <div className="flex-1 h-px bg-slate-100" />
                          </div>
                          <DemanderContactWhatsAppButton bienId={bien.id} isAuthenticated={!!user} />
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">Gestion</p>
                      <Link href={`/mes-biens/${bien.id}/modifier`} className="flex items-center justify-center w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-accent-luxury transition-all">
                        Modifier l&apos;annonce
                      </Link>
                      <Link href={`/mes-biens/${bien.id}/modifier?step=medias`} className="flex items-center justify-center w-full py-3.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                        Gérer les médias
                      </Link>
                      <BroadcastButton bienId={bien.id} statut={bien.statut} />
                      <div className="pt-3 border-t border-slate-100">
                        <DeleteBienButton bienId={bien.id} titre={bien.titre} />
                      </div>
                    </div>
                  )}

                  {/* PROPRIÉTAIRE */}
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {proprio?.avatar_url ? (
                          <Image src={proprio.avatar_url} alt={proprio.full_name || ''} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Propriétaire</p>
                        <p className="font-bold text-slate-800 text-sm">{proprio?.full_name || "BOGBE'S GROUPE"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] text-emerald-600">Disponible</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </aside>
        </div>

        {/* ─── BIENS SIMILAIRES ─── */}
        {similarBiens && similarBiens.length > 0 && (
          <section className="mt-10 border-t border-slate-100 pt-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-xl md:text-2xl font-display font-bold text-slate-800">
                {t.bien.similarIn} <span className="text-accent-luxury">{bien.commune}</span>
              </h2>
              <Link href={`/recherche?commune=${bien.commune}`} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs font-medium transition-colors shrink-0">
                {t.bien.viewAll} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile: horizontal scroll — Desktop: grid */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:overflow-x-visible md:grid md:grid-cols-3 md:gap-5 md:mx-0 md:px-0">
              {similarBiens.map((sb: any, i: number) => (
                <div key={sb.id} className="min-w-[200px] md:min-w-0">
                  <PremiumBienCard
                    id={sb.id}
                    titre={sb.titre}
                    commune={sb.commune}
                    quartier={sb.quartier}
                    type_bien={sb.type_bien}
                    prix_mois_fcfa={sb.prix_mois_fcfa}
                    prix_nuit_fcfa={sb.prix_nuit_fcfa}
                    prix_vente_fcfa={sb.prix_vente_fcfa}
                    surface_m2={sb.surface_m2}
                    nb_pieces={sb.nb_pieces}
                    photo_url={sb.photo_url}
                    is_verifie={true}
                    index={i}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CROSS-PROMO Flash — persona Recherche large ── */}
        <div className="mt-12 py-6 px-6 rounded-3xl bg-[var(--accent-luxury)]/[0.03] border border-[var(--accent-luxury)]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm overflow-hidden relative group">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-luxury)]/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          
          <div className="relative">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent-luxury)] mb-2">{t.bien.alsoAvailable}</p>
            <p className="text-sm md:text-base text-[var(--text)] leading-relaxed">
              {t.bien.promoLine}
            </p>
          </div>
          <Link
            href="/offre-flash"
            className="relative shrink-0 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[var(--accent-luxury)] hover:bg-[var(--accent-luxury)]/90 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-[var(--accent-glow)]/20 active:scale-95"
          >
            <Flame className="w-4 h-4" />
            {t.bien.promoCta}
          </Link>
        </div>
      </div>

      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-xs">
        © 2026 BOGBE&apos;S GROUPE Multi Services — Tous droits réservés
      </footer>
      </div>{/* /white-card */}

      {!isOwner && prixValue && (
        <StickyMobileCTA
          bienTitre={bien.titre}
          bienLieu={`${bien.commune}${bien.quartier ? `, ${bien.quartier}` : ''}`}
          prix={formatFCFA(prixValue)}
          prixSuffix={prixSuffix}
          bienId={bien.id}
          isNuitee={isNuitee}
          proprietaireId={bien.proprietaire_id as string}
          isAuthenticated={!!user}
        />
      )}
    </main>
  )
}
