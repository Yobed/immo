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
import { FavorisButton } from '@/components/bien/FavorisButton'
import { VisiteRequestForm } from '@/components/bien/VisiteRequestForm'
import { VIPConciergeButton } from '@/components/bien/VIPConciergeButton'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { VirtualTourViewer } from '@/components/bien/VirtualTourViewer'
import { BienMap } from '@/components/bien/BienMap'
import { DeleteBienButton } from '@/components/bien/DeleteBienButton'
import {
  MapPin,
  Sparkles,
  Eye,
  ArrowRight,
} from 'lucide-react'
import * as motion from 'framer-motion/client'
import { DiscoveryBar } from '@/components/bien/DiscoveryBar'
import { BroadcastButton } from '@/components/bien/BroadcastButton'
import { StickyMobileCTA } from '@/components/bien/StickyMobileCTA'
import { BienMediaGallery } from '@/components/bien/BienMediaGallery'
import { MediaNavBar } from '@/components/bien/MediaNavBar'
import { ScrollToTop } from '@/components/bien/ScrollToTop'

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

  if (!bien) return { title: 'Bien introuvable — Immo CI' }

  const photo = (bien.biens_medias as { url: string; est_couverture: boolean; ordre: number }[] | null)
    ?.sort((a, b) => (b.est_couverture ? 1 : 0) - (a.est_couverture ? 1 : 0))[0]?.url
  const lieu = [bien.quartier, bien.commune].filter(Boolean).join(', ')
  const prix = bien.prix_vente_fcfa
    ? formatFCFA(bien.prix_vente_fcfa)
    : bien.prix_mois_fcfa ? `${formatFCFA(bien.prix_mois_fcfa)}/mois` : ''
  const desc = `${bien.type_bien} à ${lieu}${prix ? ` — ${prix}` : ''}. Découvrez ce bien sur Immo CI, la plateforme immobilière N°1 en Côte d'Ivoire.`

  return {
    title: `${bien.titre} — ${lieu} | Immo CI Prestige`,
    description: desc,
    keywords: [`immobilier luxe Abidjan`, `location meublée ${bien.commune}`, `achat appartement ${bien.commune}`, `Immo CI prestige`, bien.titre],
    authors: [{ name: 'Immo CI Prestige' }],
    alternates: { canonical: `https://immo-ci.com/biens/${id}` },
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
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bien } = await (supabase as any)
    .from('biens')
    .select(`
      *,
      biens_medias(id, url, type, titre, ordre, est_couverture, hotspots, embed_url, duree_sec),
      profiles!biens_proprietaire_id_fkey(full_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (!bien) notFound()

  const isOwner = !!(user?.id && user.id === bien.proprietaire_id)
  if (bien.statut !== 'publie' && !isOwner) notFound()

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
  const proprio = bien['profiles!biens_proprietaire_id_fkey'] as { full_name: string; avatar_url: string | null } | null
  const isNuitee = bien.type_bien === 'residence_meublee'

  const prixValue = isNuitee && bien.prix_nuit_fcfa ? bien.prix_nuit_fcfa : bien.prix_mois_fcfa ? bien.prix_mois_fcfa : bien.prix_vente_fcfa
  const prixSuffix = isNuitee ? '/nuit' : bien.prix_mois_fcfa ? '/mois' : ''

  const stats = [
    { label: 'Superficie', value: bien.surface_m2 ? `${bien.surface_m2} m²` : null, key: 'surface' },
    { label: 'Pièces', value: bien.nb_pieces, key: 'pieces' },
    { label: 'Chambres', value: bien.nb_chambres, key: 'chambres' },
    { label: 'Bains', value: bien.nb_salles_bain, key: 'bains' },
  ].filter(s => s.value != null) as { label: string; value: string | number; key: string }[]

  const prix = prixValue ? { value: formatFCFA(prixValue), suffix: prixSuffix } : null

  const { data: similarBiensRaw } = await supabase
    .from('biens')
    .select('*, biens_medias(url, est_couverture)')
    .eq('commune', bien.commune)
    .neq('id', id)
    .eq('statut', 'publie')
    .limit(3)

  const similarBiens = similarBiensRaw?.map(b => ({
    ...b,
    photo_url: (b.biens_medias as any[])?.find((m: any) => m.est_couverture)?.url || (b.biens_medias as any[])?.[0]?.url
  }))

  return (
    <main className="bg-white min-h-screen selection:bg-accent-luxury/20 font-sans text-slate-800 antialiased overflow-x-hidden pb-20 lg:pb-0">
      <ScrollToTop />

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

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-14">

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

            {/* DESCRIPTION */}
            {bien.description && (
              <section className="mb-8 pl-4 border-l-2 border-accent-luxury/50">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-3">Description</h2>
                <p className="text-base md:text-lg font-light text-slate-700 leading-[1.7] break-words whitespace-pre-wrap">
                  {bien.description}
                </p>
              </section>
            )}

            {/* ÉQUIPEMENTS */}
            {bien.equipements?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mb-3">Équipements</h2>
                <div className="flex flex-wrap gap-2">
                  {bien.equipements.map((eq: string) => (
                    <span key={eq} className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
                      {EQUIPEMENTS_LABELS[eq] ?? eq}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* VISITE 3D */}
            {(bien.url_visite_3d || vue360Medias.length > 0) && (
              <section id="visite-3d" className="mb-8 scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-4 h-4 text-accent-luxury/60" />
                  <h2 className="text-base font-bold text-slate-800">Visite 3D / 360°</h2>
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
                <h3 className="text-base font-bold text-slate-800">Localisation</h3>
              </div>
              <div className="aspect-video relative rounded-2xl overflow-hidden border border-slate-200 hover:border-accent-luxury/40 transition-colors duration-500">
                <BienMap
                  latitude={bien.latitude}
                  longitude={bien.longitude}
                  titre={bien.titre}
                  commune={bien.commune}
                  hauteur={400}
                />
              </div>
            </section>

            {/* Owner management (desktop only — mobile shown above) */}
            {isOwner && (
              <section className="mb-8 space-y-2.5 hidden lg:block">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-3">Gestion de l&apos;annonce</p>
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
              </section>
            )}
          </div>

          {/* ─── SIDEBAR DESKTOP ─── */}
          <aside className="hidden lg:block w-[360px] xl:w-[400px] shrink-0">
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
                          Réserver maintenant
                        </Link>
                      ) : (
                        <>
                          <VIPConciergeButton
                            bienTitre={bien.titre}
                            bienLieu={`${bien.commune}${bien.quartier ? `, ${bien.quartier}` : ''}`}
                            bienPrix={`${formatFCFA(prixValue!)}${prixSuffix}`}
                          />
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-slate-100" />
                            <span className="text-[10px] text-slate-300 uppercase tracking-widest">ou</span>
                            <div className="flex-1 h-px bg-slate-100" />
                          </div>
                          <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id as string} isPremium={true} />
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
                        <p className="font-bold text-slate-800 text-sm">{proprio?.full_name || 'Immo CI'}</p>
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
                Similaires à <span className="text-accent-luxury">{bien.commune}</span>
              </h2>
              <Link href={`/recherche?commune=${bien.commune}`} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs font-medium transition-colors shrink-0">
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile: horizontal scroll — Desktop: grid */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:overflow-x-visible md:grid md:grid-cols-3 md:gap-5 md:mx-0 md:px-0">
              {similarBiens.map((sb, i) => (
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
      </div>

      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-xs">
        © 2026 Immo CI — Tous droits réservés
      </footer>

      {!isOwner && prixValue && (
        <StickyMobileCTA
          bienTitre={bien.titre}
          bienLieu={`${bien.commune}${bien.quartier ? `, ${bien.quartier}` : ''}`}
          prix={formatFCFA(prixValue)}
          prixSuffix={prixSuffix}
          bienId={bien.id}
          isNuitee={isNuitee}
        />
      )}
    </main>
  )
}
