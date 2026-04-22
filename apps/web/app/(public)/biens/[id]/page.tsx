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
  Maximize,
  BedDouble,
  Bath,
  Layers,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Sparkles,
  Eye,
  ArrowRight,
  Play
} from 'lucide-react'
import * as motion from 'framer-motion/client'
import { PropertyHeroOverlay } from '@/components/bien/PropertyHeroOverlay'
import { ShortsTrigger } from '@/components/bien/ShortsTrigger'
import { DiscoveryBar } from '@/components/bien/DiscoveryBar'
import { BroadcastButton } from '@/components/bien/BroadcastButton'
import { StickyMobileCTA } from '@/components/bien/StickyMobileCTA'

// Helper to get formatted ID
const formatPropertyId = (id: string) => {
  return `ID-${id.slice(0, 4).toUpperCase()}`
}

// generateMetadata — SEO dynamique par bien
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

  // Fetch similar properties
  const { data: similarBiens } = await supabase
    .from('biens')
    .select('*')
    .eq('commune', bien?.commune)
    .neq('id', id)
    .limit(3)

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
    alternates: {
      canonical: `https://immo-ci.com/biens/${id}`,
    },
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
  
  // FALLBACK MARKETING 5.0 - For Demo Purposes if no video is uploaded
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
    { label: 'Superficie', value: bien.surface_m2 ? `${bien.surface_m2} m²` : null, icon: Maximize },
    { label: 'Pièces', value: bien.nb_pieces, icon: Layers },
    { label: 'Chambres', value: bien.nb_chambres, icon: BedDouble },
    { label: 'Bains', value: bien.nb_salles_bain, icon: Bath },
  ].filter(s => s.value != null)

  const prix = prixValue ? {
    value: formatFCFA(prixValue),
    suffix: prixSuffix
  } : null

  // Fetch similar properties
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
    <main className="bg-[#020617] min-h-screen selection:bg-accent-luxury/20 font-sans text-slate-200 antialiased overflow-x-hidden pb-20 lg:pb-0">
      
      {/* MARKETING 5.0 - DISCOVERY BAR (Premium Sticky) */}
      <DiscoveryBar 
        bien={bien} 
        prix={prix} 
        userId={user?.id ?? null} 
      />

      {/* HERO SECTION */}
      <section className="relative h-[55vh] md:h-[85vh] overflow-hidden group">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="w-full h-full relative"
        >
          {medias.length > 0 ? (
            <BienCarousel medias={medias.map((m: any) => ({
              id: m.id, type: m.type, url: m.url,
              embed_url: m.embed_url, titre: m.titre,
              hotspots: m.hotspots, duree_sec: m.duree_sec,
            }))} isHero={true} />
          ) : (
            <div className="w-full h-full bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-accent-luxury/20" />
            </div>
          )}
          
          <PropertyHeroOverlay urlVisite3d={bien.url_visite_3d} videoMedias={videoMedias} />

          {/* Scroll indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex">
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="w-px h-10 bg-gradient-to-b from-transparent via-white/40 to-transparent"
            />
          </div>
        </motion.div>
      </section>

      {/* HEADER SECTION */}
      <section className="relative pt-8 pb-10 md:pt-24 md:pb-20 bg-[#020617] overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-luxury/5 blur-[120px] pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-16 lg:gap-24">
            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
               className="flex-1"
            >
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-10">
                {bien.titre}
              </h1>

              <div className="flex flex-wrap items-center gap-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-accent-luxury/30 flex items-center justify-center bg-accent-luxury/5">
                    <MapPin className="w-5 h-5 text-accent-luxury" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent-luxury/60">Localisation</span>
                    <span className="text-2xl font-display font-light text-white/90">
                      {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''}
                    </span>
                  </div>
                </div>

                <div className="h-10 w-px bg-white/10 hidden md:block" />

                <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">{TYPES_BIEN_LABELS[bien.type_bien] || bien.type_bien}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="lg:w-[450px]"
            >
              <div className="relative p-12 rounded-[3.5rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 shadow-2xl overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-accent-luxury/10 blur-[80px] group-hover:bg-accent-luxury/20 transition-colors duration-1000" />
                <p className="text-5xl md:text-6xl font-display font-bold text-white tracking-tighter leading-none mb-2">
                  {prix ? prix.value : (prixValue ? formatFCFA(prixValue) : 'Sur Demande')}
                </p>
                {prixSuffix && (
                  <p className="text-white/30 text-sm font-medium mb-8">{prixSuffix}</p>
                )}
                <div className="flex items-center gap-3 border-t border-white/5 pt-6">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-white/40">Bien vérifié · Paiement sécurisé</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SHORTS & VIDEO SECTION */}
      <div id="signature" className="relative border-t border-white/5 bg-[#020617]">
        {/* IMMERSIVE SHORTS SECTION - REFINED */}
        {videoMedias.length > 0 && (
          <section id="shorts" className="py-32 bg-slate-950 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-accent-luxury/5 to-transparent" />
            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-3">
                    Vidéos du bien
                  </h2>
                  <p className="text-white/40 text-sm">Explorez ce bien en vidéo avant de visiter.</p>
                </div>
                <ShortsTrigger
                  videos={videoMedias.map(v => ({
                    id: v.id, url: v.url, title: bien.titre,
                    price: formatFCFA(prixValue!), location: bien.commune, propertyId: bien.id
                  }))}
                  className="!px-8 !py-4 !rounded-xl !bg-white !text-slate-950 !shadow-md shrink-0"
                />
              </div>

              {/* Shorts Carousel */}
              <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6">
                {videoMedias.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="relative aspect-[9/16] group cursor-pointer overflow-hidden rounded-3xl border border-white/10 min-w-[260px] md:min-w-[300px] transition-all duration-500 hover:border-accent-luxury/40 hover:scale-[1.02] shrink-0"
                  >
                    <video 
                      src={v.url} 
                      className="w-full h-full object-cover transition-transform duration-[12s] group-hover:scale-110"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-16 h-16 rounded-full bg-accent-luxury/90 backdrop-blur flex items-center justify-center">
                        <Play className="w-7 h-7 text-slate-950 fill-slate-950 ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-5 right-5">
                      <span className="text-accent-luxury text-[9px] font-black uppercase tracking-[0.4em] mb-2 block">#{i+1}</span>
                      <p className="text-white font-display font-bold text-xl tracking-tight leading-tight">{bien.titre}</p>
                    </div>
                    
                    <div className="absolute inset-0 z-20">
                      <ShortsTrigger 
                        videos={videoMedias.map(v => ({
                          id: v.id, url: v.url, title: bien.titre,
                          price: formatFCFA(prixValue!), location: bien.commune, propertyId: bien.id
                        }))}
                        className="!absolute !inset-0 !opacity-0 !w-full !h-full !p-0 !rounded-none"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>


      {/* MAIN GRID CONTENT - AIRY & ELEGANT */}
      <div className="max-w-[1400px] mx-auto px-6 py-24">
        <div className="flex flex-col lg:flex-row gap-20 xl:gap-32">
          <div className="flex-1 min-w-0">
            
            {/* Specs Grid - Balanced for Readability */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col gap-6 p-10 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-accent-luxury/20 transition-all duration-500 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-accent-luxury/10 transition-colors">
                    <stat.icon className="w-5 h-5 text-white/30 group-hover:text-accent-luxury transition-colors" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20 mb-2 font-sans">{stat.label}</p>
                    <p className="text-3xl font-display font-medium text-white tracking-tight">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* DESCRIPTION */}
            <section className="mb-24 pl-8 border-l-2 border-accent-luxury/40">
              <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-white/30 mb-6">Description</h2>
              <p className="text-xl md:text-2xl font-light text-white/70 leading-[1.7]">
                {bien.description}
              </p>
            </section>

            {/* VISITE 3D / 360 */}
            {(bien.url_visite_3d || vue360Medias.length > 0) && (
              <section id="visite-3d" className="mb-24 scroll-mt-32">
                <div className="flex items-center gap-4 mb-10">
                  <Eye className="w-4 h-4 text-accent-luxury/60" />
                  <h2 className="text-xl font-bold text-white">Visite 3D / 360°</h2>
                </div>
                
                <div className="space-y-10">
                  {bien.url_visite_3d && (
                    <div className="rounded-3xl overflow-hidden border border-white/10 bg-slate-950">
                      <VirtualTourViewer url={bien.url_visite_3d} title={bien.titre} />
                    </div>
                  )}
                  
                  {vue360Medias.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {vue360Medias.map((media: any, i: number) => (
                        <div key={media.id} className="group relative aspect-[16/10] bg-black rounded-2xl overflow-hidden border border-white/5">
                          <Bien360 panoramaUrl={media.url} />
                          <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-2xl transition-colors group-hover:border-accent-luxury/20" />
                          <div className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-slate-950/80 backdrop-blur-md rounded-full border border-white/10">
                            <span className="text-[9px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2">
                              <Sparkles className="w-3 h-3 text-accent-luxury" />
                              Vue {i + 1} · {media.titre || "Vue 360°"}
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
            <section className="mb-24">
              <div className="flex items-center gap-4 mb-6">
                <MapPin className="w-4 h-4 text-accent-luxury/60" />
                <h3 className="text-xl font-bold text-white">Localisation</h3>
              </div>
              <div className="aspect-video relative rounded-3xl overflow-hidden border border-white/10 hover:border-accent-luxury/20 transition-all duration-700">
                <BienMap 
                  latitude={bien.latitude} 
                  longitude={bien.longitude} 
                  titre={bien.titre}
                  commune={bien.commune}
                  hauteur={600}
                />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-3xl" />
              </div>
            </section>
          </div>

          {/* SIDEBAR CONCIERGE - REFINED FOR AIRBNB-STYLE FOCUS */}
          <aside className="w-full lg:w-[450px] xl:w-[500px] shrink-0">
            <div className="sticky top-40">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] p-10 xl:p-12 shadow-3xl border border-white/10 relative overflow-hidden group/sidebar"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-luxury/5 blur-[100px] pointer-events-none" />
                
                <div className="relative z-10">
                  {/* PRIX */}
                  <div className="mb-8 pb-8 border-b border-white/5">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-4xl xl:text-5xl font-display font-bold tracking-tighter text-white">{formatFCFA(prixValue!)}</span>
                      {prixSuffix && <span className="text-white/30 text-sm font-medium">{prixSuffix}</span>}
                    </div>
                    {bien.charges_mois_fcfa > 0 && (
                      <p className="text-white/30 text-xs mt-1">+ {formatFCFA(bien.charges_mois_fcfa)} charges/mois</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-emerald-400 text-xs font-medium">Disponible</span>
                    </div>
                  </div>

                  {!isOwner ? (
                    <div className="space-y-4">
                      {isNuitee ? (
                        <Link
                          href={`/reservations/nouvelle?bienId=${bien.id}`}
                          className="flex items-center justify-center w-full py-5 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-accent-luxury transition-all duration-300 shadow-lg active:scale-[0.98]"
                        >
                          Réserver maintenant
                        </Link>
                      ) : (
                        <>
                          {/* CTA 1 — WhatsApp (primaire) */}
                          <VIPConciergeButton
                            bienTitre={bien.titre}
                            bienLieu={`${bien.commune}${bien.quartier ? `, ${bien.quartier}` : ''}`}
                            bienPrix={`${formatFCFA(prixValue!)}${prixSuffix}`}
                          />

                          {/* Séparateur */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] text-white/20 uppercase tracking-widest">ou</span>
                            <div className="flex-1 h-px bg-white/5" />
                          </div>

                          {/* CTA 2 — Demande de visite (secondaire) */}
                          <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id as string} isPremium={true} />
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-4">Gestion de l&apos;annonce</p>
                      <Link href={`/mes-biens/${bien.id}/modifier`} className="flex items-center justify-center w-full py-4 bg-white text-slate-950 rounded-2xl font-bold text-sm hover:bg-accent-luxury transition-all duration-300">
                        Modifier l&apos;annonce
                      </Link>
                      <Link href={`/mes-biens/${bien.id}/modifier?step=medias`} className="flex items-center justify-center w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all duration-300">
                        Gérer les médias
                      </Link>
                      <BroadcastButton bienId={bien.id} statut={bien.statut} />
                      <div className="pt-4 border-t border-white/5">
                        <DeleteBienButton bienId={bien.id} titre={bien.titre} />
                      </div>
                    </div>
                  )}
                  
                  {/* PROPRIÉTAIRE */}
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                        {proprio?.avatar_url ? (
                          <Image src={proprio.avatar_url} alt={proprio.full_name || ''} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white/10" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Propriétaire</p>
                        <p className="font-bold text-white">{proprio?.full_name || 'Immo CI'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] text-emerald-400">Disponible</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </aside>
        </div>

        {/* BIENS SIMILAIRES */}
        <section className="mt-20 border-t border-white/5 pt-16">
          <div className="flex items-center justify-between gap-8 mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Biens similaires à <span className="text-accent-luxury">{bien.commune}</span>
            </h2>
            <Link href={`/recherche?commune=${bien.commune}`} className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm font-medium shrink-0">
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {similarBiens && similarBiens.length > 0 ? (
              similarBiens.map((sb, i) => (
                <PremiumBienCard 
                  key={sb.id}
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
                  score_ia={95 - i * 2}
                  index={i}
                />
              ))
            ) : (
              <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]">
                <p className="text-white/20 italic text-xl">Recherche de propriétés exclusives en cours...</p>
              </div>
            )}
          </div>
        </section>
      </div>
      
      <footer className="border-t border-white/5 py-12 text-center text-white/20 text-xs">
        © 2026 Immo CI — Tous droits réservés
      </footer>

      <Link
        href="/biens"
        className="fixed bottom-8 left-8 z-[100] lg:flex hidden items-center gap-2 px-4 py-3 bg-slate-900/90 border border-white/10 rounded-xl hover:bg-slate-800 transition-all backdrop-blur-xl text-white/50 hover:text-white text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux annonces
      </Link>

      {!isOwner && prixValue && (
        <StickyMobileCTA
          bienTitre={bien.titre}
          bienLieu={`${bien.commune}${bien.quartier ? `, ${bien.quartier}` : ''}`}
          prix={formatFCFA(prixValue)}
          prixSuffix={prixSuffix}
        />
      )}
    </main>
  )
}
