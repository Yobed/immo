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
import { ContactProprietaireButton } from '@/components/bien/ContactProprietaireButton'
import { ConciergerieLive } from '@/components/chat/ConciergerieLive'
import { VIPConciergeButton } from '@/components/bien/VIPConciergeButton'
import { PremiumBienCard } from '@/components/bien/PremiumBienCard'
import { VirtualTourViewer } from '@/components/bien/VirtualTourViewer'
import { BienMap } from '@/components/bien/BienMap'
import { DeleteBienButton } from '@/components/bien/DeleteBienButton'
import { NarrativeSignature } from '@/components/bien/NarrativeSignature'
import { 
  MapPin, 
  Maximize, 
  BedDouble, 
  Bath, 
  Layers, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  ChevronRight,
  Share2,
  Heart,
  MessageCircle,
  Phone,
  Clock,
  LayoutGrid,
  ArrowLeft,
  Sparkles,
  Award,
  Minimize2,
  Maximize2,
  Square,
  Hash,
  Building2,
  Gem,
  Waves,
  Trophy,
  Eye,
  ArrowRight,
  Play
} from 'lucide-react'
import * as motion from 'framer-motion/client'
import { PropertyHeroOverlay } from '@/components/bien/PropertyHeroOverlay'
import { ShortsTrigger } from '@/components/bien/ShortsTrigger'
import { SapphireHub } from '@/components/bien/SapphireHub'
import { DiscoveryBar } from '@/components/bien/DiscoveryBar'

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
    <main className="bg-[#020617] min-h-screen selection:bg-accent-luxury/20 font-sans text-slate-200 antialiased overflow-x-hidden">
      
      {/* MARKETING 5.0 - DISCOVERY BAR (Premium Sticky) */}
      <DiscoveryBar 
        bien={bien} 
        prix={prix} 
        userId={user?.id ?? null} 
      />

      {/* HERO SECTION - REFINED FOR IMPACT */}
      <section className="relative h-[110vh] overflow-hidden group">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
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
              <Sparkles className="w-16 h-16 text-accent-luxury/20" />
            </div>
          )}
          
          <PropertyHeroOverlay urlVisite3d={bien.url_visite_3d} videoMedias={videoMedias} />

          {/* Editorial Scroll Indicator */}
          <div className="absolute bottom-12 left-12 flex flex-col items-center gap-8 z-50">
             <motion.div 
               animate={{ height: [0, 80, 0], opacity: [0, 1, 0] }}
               transition={{ repeat: Infinity, duration: 3 }}
               className="w-[1px] bg-accent-luxury" 
             />
             <span className="text-[9px] uppercase font-bold tracking-[0.8em] text-accent-luxury opacity-60 rotate-90 origin-left ml-2 whitespace-nowrap font-display">Scroll to explore</span>
          </div>
        </motion.div>
      </section>

      {/* HEADER SECTION - EDITORIAL IMPACT */}
      <section className="relative pt-60 pb-60 bg-[#020617] border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-accent-luxury/5 blur-[200px] pointer-events-none" />
        <div className="max-w-[1800px] mx-auto px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-32">
            <motion.div
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
               className="flex-1"
            >
              <div className="flex items-center gap-12 mb-20">
                <div className="px-10 py-3 rounded-full bg-accent-luxury/20 border border-accent-luxury/40 backdrop-blur-2xl">
                  <span className="text-[10px] font-black uppercase tracking-[0.6em] text-accent-luxury">The Sapphire Collection</span>
                </div>
                <div className="h-[1px] w-32 bg-white/10" />
                <span className="text-[11px] font-bold uppercase tracking-[0.6em] text-white/20 font-mono">
                  REF. {bien.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              
              <h1 className="font-display text-[12vw] lg:text-[14rem] font-bold text-white leading-[0.7] tracking-tighter mb-24 italic mix-blend-exclusion">
                {bien.titre}
              </h1>

              <div className="flex flex-wrap items-center gap-20">
                <div className="flex items-center gap-10">
                  <div className="w-24 h-24 rounded-full border border-accent-luxury/30 flex items-center justify-center bg-accent-luxury/5 shadow-3xl group">
                    <MapPin className="w-10 h-10 text-accent-luxury group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-luxury mb-1">Localisation Initiale</span>
                    <span className="text-7xl font-display font-light text-white/90">
                      {bien.commune}{bien.quartier ? ` · ${bien.quartier}` : ''}
                    </span>
                  </div>
                </div>

                <div className="hidden xl:block w-[1px] h-20 bg-white/10 mx-10" />

                <div className="flex items-center gap-6 py-6 px-12 rounded-[2.5rem] bg-slate-900 border border-white/10 backdrop-blur-3xl">
                  <Badge variant="luxury" className="bg-accent-luxury text-slate-950 px-6 py-2 border-none">Expertise Sapphire</Badge>
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">{TYPES_BIEN_LABELS[bien.type_bien] || bien.type_bien}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="lg:w-[600px]"
            >
              <div className="relative p-20 md:p-24 rounded-[6rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 shadow-[0_100px_150px_-50px_rgba(0,0,0,0.8)] overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-luxury/20 blur-[80px] group-hover:bg-accent-luxury/30 transition-colors duration-1000" />
                <span className="text-[12px] font-black uppercase tracking-[0.8em] text-accent-luxury mb-10 block opacity-60">Estimation Exclusive</span>
                <p className="text-8xl md:text-[10rem] font-display font-bold text-white tracking-tighter leading-none mb-12">
                  {prix ? prix.value : (prixValue ? formatFCFA(prixValue) : 'Sur Demande')}
                </p>
                <div className="flex items-center justify-between border-t border-white/5 pt-10">
                   <div className="flex items-center gap-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Certifié Deep Estate</span>
                   </div>
                   <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-accent-luxury group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MARKETING 5.0 CONTENT: MOVED UP FOR VISIBILITY */}
      <div id="signature" className="relative border-t border-white/5 bg-[#020617]">
         {/* THE NARRATIVE SIGNATURE */}
        <div className="bg-gradient-to-b from-[#020617] to-slate-950">
          <NarrativeSignature 
            description={bien.description}
            bienType={TYPES_BIEN_LABELS[bien.type_bien] ?? bien.type_bien}
            commune={bien.commune}
            rarityScore={Math.floor(85 + (bien.surface_m2 ? bien.surface_m2 / 100 : 5) + (bien.nb_pieces ? bien.nb_pieces : 2))}
          />
        </div>

        {/* IMMERSIVE SHORTS SECTION */}
        {videoMedias.length > 0 && (
          <section id="shorts" className="py-60 bg-slate-950 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent-luxury/5 to-transparent" />
            <div className="max-w-[1800px] mx-auto px-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-40">
                <div className="max-w-4xl">
                  <div className="flex items-center gap-8 mb-12">
                    <div className="w-20 h-[1px] bg-accent-luxury" />
                    <span className="text-[12px] font-black uppercase tracking-[0.8em] text-accent-luxury">Marketing 5.0</span>
                  </div>
                  <h2 className="text-7xl md:text-[8rem] lg:text-[10rem] font-display font-bold text-white tracking-tighter leading-[0.85] italic mb-12">
                    Le Luxe en <span className="text-accent-luxury">Mouvement.</span>
                  </h2>
                  <p className="text-white/40 text-xl font-light max-w-2xl leading-relaxed">
                    Découvrez une immersion cinématographique sans précédent. Nos shorts Marketing 5.0 capturent l'âme de chaque propriété Deep Estate.
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-10">
                  <ShortsTrigger 
                    videos={videoMedias.map(v => ({
                      id: v.id, url: v.url, title: bien.titre,
                      price: formatFCFA(prixValue!), location: bien.commune, propertyId: bien.id
                    }))}
                    className="!px-20 !py-8 !rounded-[3rem] !bg-white !text-slate-950 !shadow-[0_40px_100px_-20px_rgba(212,175,55,0.5)]"
                  />
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-accent-luxury/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-luxury animate-pulse" />
                    Disponible en Full 4K
                  </div>
                </div>
              </div>

              {/* The Carousel Grid */}
              <div className="flex gap-12 overflow-x-auto pb-24 no-scrollbar px-4 -mx-4 group/shorts">
                {videoMedias.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: 100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="relative aspect-[9/16] group cursor-pointer overflow-hidden rounded-[4rem] border-2 border-white/10 shadow-3xl min-w-[320px] transition-all duration-700 hover:border-accent-luxury/50 hover:scale-[1.02]"
                  >
                    <video 
                      src={v.url} 
                      className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-125"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="w-24 h-24 rounded-full bg-accent-luxury/90 backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.4)]">
                        <Play className="w-10 h-10 text-slate-950 fill-slate-950 ml-1" />
                      </div>
                    </div>

                    <div className="absolute bottom-10 left-8 right-8">
                      <span className="text-accent-luxury text-[10px] font-black uppercase tracking-[0.6em] mb-4 block">Sequence #{i+1}</span>
                      <p className="text-white font-display font-bold text-3xl tracking-tighter leading-none">{bien.titre}</p>
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


      {/* MAIN GRID CONTENT */}
      <div className="max-w-[1800px] mx-auto px-8 py-40">
        <div className="flex flex-col lg:flex-row gap-40">
          <div className="flex-1">
            
            {/* Specs Grid - Enhanced Visibility */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-48">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex flex-col gap-10 p-12 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-accent-luxury/30 transition-all duration-700 group hover:shadow-[0_20px_80px_-20px_rgba(212,175,55,0.15)]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-accent-luxury/10 group-hover:border-accent-luxury/20 transition-all">
                    <stat.icon className="w-7 h-7 text-white/20 group-hover:text-accent-luxury group-hover:scale-110 transition-all duration-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/30 mb-3 font-display">{stat.label}</p>
                    <p className="text-4xl font-display font-bold text-white tracking-tighter">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* TECHNICAL NOTES SECTION */}
            <section className="mb-48 pl-12 border-l-2 border-accent-luxury/20">
              <div className="flex items-center gap-4 mb-12">
                <Sparkles className="w-5 h-5 text-accent-luxury/40" />
                <h2 className="text-[12px] font-bold uppercase tracking-[0.6em] text-white/40 font-display">Détails de l&apos;Édifice</h2>
              </div>
              <div className="max-w-5xl">
                <p className="text-3xl font-light text-white/70 leading-[1.6] tracking-tight">
                  {bien.description}
                </p>
              </div>
            </section>

            {/* LIFESTYLE PREMIUM SECTION */}
            <section className="mb-48 relative rounded-[4rem] overflow-hidden group">
              <div className="grid grid-cols-1 lg:grid-cols-2 bg-slate-900/40 border border-white/5">
                <div className="p-16 lg:p-24 flex flex-col justify-center">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-12 h-12 rounded-full bg-accent-luxury/10 flex items-center justify-center">
                       <Trophy size={20} className="text-accent-luxury" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-accent-luxury">Expérience 5.0</span>
                  </div>
                  
                  <h2 className="text-5xl md:text-6xl font-display font-bold text-white mb-12 leading-tight">
                    L&apos;Art de Vivre <br/><span className="text-accent-luxury italic">Redéfini.</span>
                  </h2>

                  <div className="grid grid-cols-2 gap-12">
                    {[
                      { icon: Gem, title: "Prestige", desc: "Matériaux d'exception" },
                      { icon: ShieldCheck, title: "Sérénité", desc: "Service de veille 24/7" },
                      { icon: Waves, title: "Loisir", desc: "Espaces aquatiques" },
                      { icon: LayoutGrid, title: "Smart", desc: "Connectivité avancée" }
                    ].map((item, i) => (
                      <div key={i} className="space-y-3">
                        <item.icon className="w-6 h-6 text-accent-luxury/40" />
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest">{item.title}</h4>
                        <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative aspect-square lg:aspect-auto min-h-[600px] overflow-hidden">
                   <Image 
                     src={medias[0]?.url || "/assets/placeholders/luxury.jpg"} 
                     alt="Lifestyle"
                     fill
                     className="object-cover transition-transform duration-[30s] group-hover:scale-125"
                   />
                   <div className="absolute inset-0 bg-gradient-to-l from-slate-950/80 via-transparent to-transparent hidden lg:block" />
                   <div className="absolute bottom-16 left-16 right-16 p-10 bg-slate-950/60 backdrop-blur-2xl rounded-3xl border border-white/10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-accent-luxury flex items-center justify-center shadow-2xl">
                           <Sparkles className="text-slate-950 w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-luxury mb-1">Status Report</p>
                          <p className="text-xl font-display font-bold text-white tracking-tight">Vérifié Sapphire Intelligence</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </section>

            {/* IMMERSIVE MEDIA SECTION (Visite 3D / 360) */}
            {(bien.url_visite_3d || vue360Medias.length > 0) && (
              <section id="visite-3d" className="mb-48 scroll-mt-32">
                <div className="flex items-center justify-between mb-16">
                  <div>
                    <h2 className="text-5xl font-display font-bold text-white mb-4 italic">Le Jumeau Numérique</h2>
                    <p className="text-white/40 text-sm uppercase tracking-[0.4em] font-bold">Exploration Immersive 3D & 360°</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                        <Eye className="text-accent-luxury w-5 h-5 animate-pulse" />
                     </div>
                  </div>
                </div>
                
                <div className="space-y-16">
                  {bien.url_visite_3d && (
                    <div className="rounded-[4rem] overflow-hidden border border-white/10 shadow-3xl bg-slate-950">
                      <VirtualTourViewer url={bien.url_visite_3d} title={bien.titre} />
                    </div>
                  )}
                  
                  {vue360Medias.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {vue360Medias.map((media: any, i: number) => (
                        <div key={media.id} className="group relative aspect-[16/10] bg-black rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
                          <Bien360 panoramaUrl={media.url} />
                          <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-[3rem] transition-colors group-hover:border-accent-luxury/20" />
                          <div className="absolute bottom-8 left-8 z-10 px-6 py-3 bg-slate-950/80 backdrop-blur-md rounded-full border border-white/10">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                              <Sparkles className="w-3 h-3 text-accent-luxury" />
                              Point de Vue {i + 1} · {media.titre || "Vue 360°"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* LOCATION FOOTPRINT */}
            <section className="mb-48">
              <div className="flex items-center gap-6 mb-16">
                <div className="h-[1px] w-12 bg-white/10" />
                <h3 className="text-[12px] font-bold uppercase tracking-[0.6em] text-white/40 font-display italic">Géographie du Bien</h3>
              </div>
              <div className="aspect-video relative rounded-[4rem] overflow-hidden border border-white/10 shadow-3xl grayscale-[0.5] hover:grayscale-0 transition-all duration-1000">
                <BienMap 
                  latitude={bien.latitude} 
                  longitude={bien.longitude} 
                  titre={bien.titre}
                  commune={bien.commune}
                  hauteur={800}
                />
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[4rem]" />
              </div>
            </section>
          </div>

          {/* SIDEBAR CONCIERGE */}
          <aside className="w-full lg:w-[500px] shrink-0">
            <div className="sticky top-40">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-slate-900/60 backdrop-blur-3xl rounded-[4rem] p-16 shadow-3xl border border-white/10 relative overflow-hidden group/sidebar"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-luxury/10 blur-[100px] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-1000" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-20 border-b border-white/5 pb-10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-accent-luxury mb-6">Investissement</p>
                      <div className="flex items-baseline gap-5">
                        <span className="text-6xl md:text-7xl font-display font-bold tracking-tighter text-white">{formatFCFA(prixValue!)}</span>
                        <span className="text-white/20 font-black uppercase text-[12px] tracking-[0.4em]">{prixSuffix}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 mb-20">
                    <div className="flex items-center gap-8 p-10 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-accent-luxury/20 transition-all group/card">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/card:scale-110 transition-transform">
                        <Clock className="w-7 h-7 text-white/20 group-hover/card:text-accent-luxury" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/30 mb-2">Disponibilité</p>
                        <p className="text-xl font-bold tracking-tight text-white whitespace-nowrap">Immédiate Sapphire</p>
                      </div>
                    </div>
                    
                    {bien.charges_mois_fcfa > 0 && (
                      <div className="flex items-center justify-between px-10 py-6 bg-accent-luxury/5 rounded-3xl border border-accent-luxury/10">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-luxury">Services VIP</span>
                        <span className="text-white font-display font-bold text-lg tracking-widest">{formatFCFA(bien.charges_mois_fcfa)}</span>
                      </div>
                    )}
                  </div>

                  {!isOwner ? (
                    <div className="space-y-8">
                      {isNuitee ? (
                        <Link href={`/reservations/nouvelle?bienId=${bien.id}`} className="flex items-center justify-center w-full py-8 bg-white text-[#020617] rounded-[2rem] font-black text-[12px] uppercase tracking-[0.5em] font-display hover:bg-accent-luxury transition-all duration-700 shadow-2xl shadow-accent-luxury/20 active:scale-95 group/btn">
                          Réserver l&apos;Expérience
                        </Link>
                      ) : (
                        <div className="bg-white/5 p-2 rounded-[3.5rem] border border-white/5">
                           <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id as string} isPremium={true} />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-6 pt-6">
                        <ContactProprietaireButton
                          bienId={bien.id}
                          proprietaireId={bien.proprietaire_id as string}
                          userId={user?.id ?? null}
                          className="w-full h-24 flex items-center justify-center gap-6 bg-transparent border border-white/10 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] font-display hover:border-white/40 transition-all duration-700 hover:bg-white/5 text-white"
                        />
                        
                         <VIPConciergeButton 
                          bienTitre={bien.titre}
                          bienLieu={`${bien.commune}${bien.quartier ? `, ${bien.quartier}` : ''}`}
                          bienPrix={`${formatFCFA(prixValue!)}${prixSuffix}`}
                          className="w-full"
                        />

                        {/* Hidden context for SapphireHub but available for background systems */}
                        <div className="hidden">
                           <ConciergerieLive 
                             propertyContext={`Bien : ${bien.titre}\nCommune : ${bien.commune}\nQuartier : ${bien.quartier}\nPrix : ${formatFCFA(prixValue!)}${prixSuffix}\nType : ${bien.type_bien}\nDescription : ${bien.description}\n\n[PHOTOS DU BIEN] :\n${medias.filter((m: any) => m.type === 'photo').map((m: any) => m.url).join('\n')}`}
                           />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                       <div className="text-center mb-12 p-12 bg-accent-luxury/5 rounded-[3rem] border border-accent-luxury/10">
                        <ShieldCheck className="w-12 h-12 text-accent-luxury mx-auto mb-6" />
                        <p className="text-[12px] uppercase font-black text-accent-luxury tracking-[0.5em] font-display">Commandes Privilège</p>
                      </div>
                      <Link href={`/mes-biens/${bien.id}/modifier`} className="flex items-center justify-center w-full py-7 bg-white text-slate-950 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.5em] font-display hover:bg-accent-luxury transition-all duration-700">
                        Édition Diplomatique
                      </Link>
                      <Link href={`/mes-biens/${bien.id}/modifier?step=medias`} className="flex items-center justify-center w-full py-7 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.5em] font-display hover:bg-white/10 transition-all duration-700">
                        Médiathèque Sapphire
                      </Link>
                      <div className="pt-8 border-t border-white/5">
                        <DeleteBienButton bienId={bien.id} titre={bien.titre} />
                      </div>
                    </div>
                  )}
                  
                  {/* CURATOR CARD */}
                  <div className="mt-20 pt-20 border-t border-white/10">
                    <div className="flex items-center gap-10">
                      <div className="relative group/avatar">
                        <div className="absolute inset-0 bg-accent-luxury/20 rounded-full blur-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-1000" />
                        <div className="relative w-24 h-24 rounded-[1.5rem] overflow-hidden bg-slate-800 border-2 border-white/10 flex-shrink-0 transition-all duration-700 group-hover/avatar:scale-110 group-hover/avatar:rotate-3 shadow-2xl">
                          {proprio?.avatar_url ? (
                            <Image src={proprio.avatar_url || ''} alt={proprio.full_name || ''} fill className="object-cover grayscale group-hover/avatar:grayscale-0" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                              <Sparkles className="w-10 h-10 text-white/10" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.6em] mb-2">Curateur Assigné</p>
                        <p className="font-display font-bold text-3xl tracking-tighter text-white leading-none">
                          {proprio?.full_name || 'Élite Immo CI'}
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Conseiller Disponible</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </aside>
        </div>

        {/* RECOMMENDATIONS (Moved out of narrow column for full width) */}
        <section className="mt-20 border-t border-white/5 pt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-accent-luxury/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent-luxury" />
                </div>
                <span className="text-accent-luxury font-black uppercase tracking-[0.4em] text-[10px]">Sapphire Intelligence</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-display font-medium text-white tracking-tighter leading-tight">
                Biens de <span className="text-accent-luxury italic">Prestige</span> Similaires
              </h2>
            </div>
            <Link href={`/recherche?commune=${bien.commune}`} className="group flex items-center gap-6 px-12 py-6 bg-white/5 rounded-2xl border border-white/10 text-white transition-all hover:bg-white/10 hover:border-accent-luxury/40 backdrop-blur-3xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.5em]">La Collection {bien.commune}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500 text-accent-luxury" />
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
      
      {/* FINAL EDITORIAL FOOTER */}
      <footer className="max-w-[1800px] mx-auto px-8 py-32 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-16 text-white/20">
        <div className="flex flex-wrap items-center justify-center gap-16">
           <p className="text-[11px] font-bold uppercase tracking-[0.8em] font-display">© MMXXVI Immo CI Sapphire</p>
           <span className="hidden md:block w-16 h-[1px] bg-white/5" />
           <p className="text-[11px] font-bold uppercase tracking-[0.8em] font-display italic">L&apos;Héritage de l&apos;Immobilier</p>
        </div>
        <div className="flex items-center gap-10">
           <div className="w-20 h-[1px] bg-white/5" />
           <Sparkles className="w-8 h-8 opacity-10" />
        </div>
      </footer>

      {/* MARKETING 5.0 HUB: Persistent Access */}
      {/* SAPPHIRE HUB - ENHANCED VISIBILITY */}
      <div className="relative group">
        <SapphireHub bien={bien} videoMedias={videoMedias} />
      </div>

      <Link 
        href="/"
        className="fixed bottom-12 left-12 z-[100] p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all backdrop-blur-xl group"
      >
        <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
      </Link>
    </main>
  )
}
