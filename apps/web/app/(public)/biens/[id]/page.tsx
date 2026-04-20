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
import { VirtualTourViewer } from '@/components/bien/VirtualTourViewer'
import { BienMap } from '@/components/bien/BienMap'
import { DeleteBienButton } from '@/components/bien/DeleteBienButton'
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
  ArrowRight
} from 'lucide-react'
import * as motion from 'framer-motion/client'
import { PropertyHeroOverlay } from '@/components/bien/PropertyHeroOverlay'
import { ShortsTrigger } from '@/components/bien/ShortsTrigger'

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
  const videoMedias = medias.filter((m: any) => m.type === 'video')
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
    <main className="bg-[var(--midnight)] min-h-screen selection:bg-secondary/20 font-sans text-[var(--off-white)] antialiased">
      
      <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-8 pointer-events-none">
        <div className="max-w-[1800px] mx-auto flex justify-between items-end">
          <motion.a 
            href="/biens"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto flex items-center gap-6 px-8 py-4 bg-midnight-muted/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-off-white/10 group text-off-white"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform duration-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] font-display">La Collection</span>
          </motion.a>
          
          <div className="flex gap-4 pointer-events-auto">
             <motion.button 
               initial={{ y: -20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.1 }}
               className="p-5 bg-midnight-muted/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-off-white/10 hover:scale-105 transition-all text-off-white"
             >
               <Share2 className="w-5 h-5" />
             </motion.button>
             <FavorisButton 
               bienId={bien.id} 
               userId={user?.id ?? null} 
               className="p-5 bg-midnight-muted/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-off-white/10 hover:scale-105 transition-all text-off-white" 
             />
          </div>
        </div>
      </nav>

      <section className="relative w-full h-[90vh] md:h-screen overflow-hidden">
        <motion.div 
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full relative"
        >
          {medias.length > 0 ? (
            <BienCarousel medias={medias.map((m: any) => ({
              id: m.id, type: m.type, url: m.url,
              embed_url: m.embed_url, titre: m.titre,
              hotspots: m.hotspots, duree_sec: m.duree_sec,
            }))} isHero={true} />
          ) : (
            <div className="w-full h-full bg-[var(--midnight-muted)] flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-off-white/10" />
            </div>
          )}
          
          <PropertyHeroOverlay urlVisite3d={bien.url_visite_3d} />

          {videoMedias.length > 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <ShortsTrigger videos={videoMedias} />
            </div>
          )}
        </motion.div>
      </section>

      <section className="bg-midnight pt-24 pb-12">
        <div className="max-w-[1800px] mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-off-white/5 pb-20">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <span className="px-4 py-1.5 rounded-full bg-accent-luxury/10 border border-accent-luxury/20 text-[10px] font-bold uppercase tracking-[0.3em] text-accent-luxury">
                    {TYPES_BIEN_LABELS[bien.type_bien] ?? bien.type_bien}
                  </span>
                </div>
                
                <h1 className="font-display text-5xl md:text-[6.5rem] font-bold text-off-white leading-[0.9] tracking-tight mb-8">
                  {bien.titre}
                </h1>

                <div className="flex items-center gap-3 text-off-white/60">
                  <div className="w-10 h-10 rounded-full bg-off-white/5 flex items-center justify-center border border-off-white/10">
                    <MapPin className="w-5 h-5 text-accent-luxury" />
                  </div>
                  <div>
                    <Badge variant="default" className="bg-white/5 text-[var(--accent-luxury)] border-none mb-4">L&apos;Analyse de l&apos;IA</Badge>
                    <h4 className="text-white font-display text-3xl font-bold tracking-tight">Narrative Signature</h4>
                  </div>
                  <span className="text-2xl font-display font-light tracking-tight">
                    {bien.commune}{bien.quartier ? ` • ${bien.quartier}` : ''}
                  </span>
                </div>
              </div>

              <div className="lg:text-right shrink-0">
                <div className="inline-block p-10 rounded-[2.5rem] bg-off-white/5 backdrop-blur-3xl border border-off-white/10 shadow-2xl relative overflow-hidden group">
                  <p className="text-5xl md:text-6xl font-display font-bold text-off-white tracking-tighter relative z-10">
                    {prix ? prix.value : 'Prix sur demande'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto px-8 pb-48">
        <div className="flex flex-col lg:flex-row gap-32">
          <div className="flex-1 max-w-5xl">
            {/* Descriptive Summary */}
            <section className="mb-24">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.5em] text-[var(--accent-luxury)] mb-8 font-display italic">— La Résidence</h2>
              <p className="text-2xl md:text-3xl text-off-white/70 font-light leading-relaxed mb-12">
                {bien.description}
              </p>
            </section>

            {/* Luxury Lifestyle Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-gradient-to-br from-[var(--midnight-muted)] to-[var(--midnight)] p-8 md:p-16 rounded-[3rem] border border-off-white/5 mb-24">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-[1px] bg-[var(--accent-luxury)]" />
                  <span className="text-[var(--accent-luxury)] font-bold uppercase tracking-[0.3em] text-[10px]">Lifestyle Premium</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-medium text-off-white mb-8 leading-tight">
                  Vivez l&apos;exceptionnel au quotidien.
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: Gem, label: "Matériaux Nobles", desc: "Marbre & Bois Précieux" },
                    { icon: ShieldCheck, label: "Sécurité Totale", desc: "Gardiennage 24/7" },
                    { icon: Waves, label: "Détente & Spa", desc: "Piscine à débordement" },
                    { icon: Sparkles, label: "Domotique", desc: "Contrôle Smart Home" }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <item.icon className="w-6 h-6 text-[var(--accent-luxury)] mb-1" />
                      <span className="text-off-white font-bold text-sm">{item.label}</span>
                      <span className="text-off-white/40 text-[11px] uppercase tracking-wider">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative aspect-square md:aspect-[4/5] rounded-[2.5rem] overflow-hidden group">
                <Image 
                  src={medias[0]?.url || "/assets/placeholders/luxury-interior.jpg"} 
                  alt="Luxury Lifestyle"
                  fill
                  className="object-cover scale-110 group-hover:scale-100 transition-transform duration-[20s]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--midnight)] via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-luxury)] flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-midnight" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm italic">Note de Rareté</div>
                      <div className="text-[var(--accent-luxury)] font-display text-xl">EXCEPTIONNEL · 98/100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Tour / 360 View */}
            {(bien.url_visite_3d || vue360Medias.length > 0) && (
              <section id="visite-3d" className="mb-24 scroll-mt-24">
                <div className="mb-12">
                  <h2 className="text-3xl font-display font-medium text-off-white mb-4">Visite Immersive</h2>
                  <p className="text-off-white/50">Explorez les moindres recoins de votre futur chez-vous.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  {bien.url_visite_3d && (
                    <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-off-white/5">
                      <VirtualTourViewer url={bien.url_visite_3d} title={bien.titre} />
                    </div>
                  )}
                  
                  {vue360Medias.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {vue360Medias.map((media: any, i: number) => (
                        <div key={media.id} className="group relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-off-white/5">
                          <Bien360 panoramaUrl={media.url} />
                          <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-midnight/80 backdrop-blur-md rounded-full border border-off-white/10 opacity-100 group-hover:opacity-0 transition-opacity">
                            <span className="text-[10px] font-bold text-off-white uppercase tracking-widest flex items-center gap-2">
                              <Eye className="w-3 h-3 text-[var(--accent-luxury)]" />
                              Vue 360° · {media.titre || `Point de vue ${i + 1}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Map Section */}
            <section className="mb-24">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.5em] text-off-white/40 mb-8 font-display italic">— Localisation</h3>
              <div className="aspect-video relative rounded-[2.5rem] overflow-hidden border border-off-white/10">
                <BienMap 
                  latitude={bien.latitude} 
                  longitude={bien.longitude} 
                  titre={bien.titre}
                  commune={bien.commune}
                  hauteur={600}
                />
              </div>
            </section>
            <section className="mt-32 mb-20 px-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <span className="text-[var(--accent-luxury)] font-bold uppercase tracking-[0.2em] text-[10px] mb-4 block">Recommandations IA</span>
                  <h2 className="text-3xl font-display font-medium text-off-white">Biens Similaires à {bien.commune}</h2>
                </div>
                <Link href={`/recherche?commune=${bien.commune}`} className="text-off-white/60 hover:text-[var(--accent-luxury)] transition-colors text-sm font-medium flex items-center gap-2 group">
                  Voir tout à {bien.commune}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {similarBiens && similarBiens.length > 0 ? (
                  similarBiens.map((sb) => (
                    <BienCard 
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
                      isVerified={true}
                      isExclusive={false}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center border border-white/5 rounded-[2rem] bg-white/[0.02]">
                    <p className="text-off-white/30 italic">Découvrez d'autres opportunités exceptionnelles très prochainement.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="w-full lg:w-[480px] shrink-0">
            <div className="sticky top-32">
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[var(--midnight-muted)]/80 backdrop-blur-3xl rounded-[3rem] p-12 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.5)] border border-off-white/10 relative overflow-hidden group/sidebar"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-16 border-b border-off-white/5 pb-8">
                    <div>
                      <div className="flex items-center gap-4 mb-6">
                        <span className="w-10 h-[1px] bg-[var(--accent-luxury)]" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--accent-luxury)] font-display">Prix de Présentation</p>
                      </div>
                      <div className="flex items-baseline gap-4">
                        <span className="text-5xl md:text-6xl font-display font-bold tracking-tight text-off-white">{formatFCFA(prixValue!)}</span>
                        <span className="text-off-white/20 font-bold uppercase text-[11px] tracking-[0.4em] font-display">{prixSuffix}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 mb-16">
                    <div className="flex items-center gap-6 p-8 bg-off-white/5 rounded-3xl border border-off-white/5 transition-colors hover:bg-off-white/10 hover:border-off-white/10">
                      <div className="w-14 h-14 rounded-2xl bg-off-white/5 flex items-center justify-center border border-off-white/10">
                        <Calendar className="w-6 h-6 text-off-white/50 group-hover/sidebar:text-[var(--accent-luxury)] transition-colors" />
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold tracking-[0.4em] text-off-white/50 mb-1 font-display">Disponibilité</p>
                        <p className="text-lg font-bold tracking-tight text-off-white">Disponibilité Immédiate</p>
                      </div>
                    </div>
                    
                    {bien.charges_mois_fcfa > 0 && (
                      <div className="flex items-center justify-between px-8 py-3 bg-secondary/5 rounded-2xl border border-secondary/10">
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-secondary/80">Services Inclus</span>
                        <span className="text-secondary font-display font-bold text-sm tracking-widest">{formatFCFA(bien.charges_mois_fcfa)}</span>
                      </div>
                    )}
                  </div>

                  {!isOwner ? (
                    <div className="space-y-6">
                      {isNuitee ? (
                        <a href={`/reservations/nouvelle?bienId=${bien.id}`} className="flex items-center justify-center w-full py-7 bg-off-white text-midnight rounded-2xl font-bold text-[11px] uppercase tracking-[0.5em] font-display hover:bg-secondary transition-all duration-700 shadow-2xl shadow-black/20 active:scale-95">
                          Réserver l&apos;Expérience
                        </a>
                      ) : (
                        <div className="bg-off-white/5 p-8 rounded-[2.5rem] border border-off-white/5">
                           <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id as string} isPremium={true} />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-4 pt-4">
                        <ContactProprietaireButton
                          bienId={bien.id}
                          proprietaireId={bien.proprietaire_id as string}
                          userId={user?.id ?? null}
                          className="w-full flex items-center justify-center gap-4 py-6 bg-transparent border border-off-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.4em] font-display hover:border-off-white/30 transition-all duration-500 hover:bg-off-white/5 text-off-white"
                        />
                        <ConciergerieLive 
                          propertyContext={`Bien : ${bien.titre}\nCommune : ${bien.commune}\nQuartier : ${bien.quartier}\nPrix : ${formatFCFA(prixValue!)}${prixSuffix}\nType : ${bien.type_bien}\nDescription : ${bien.description}\n\n[PHOTOS DU BIEN] :\n${medias.filter((m: any) => m.type === 'photo').map((m: any) => m.url).join('\n')}`}
                        />
                        
                        <VIPConciergeButton 
                          bienTitre={bien.titre}
                          bienLieu={`${bien.commune}${bien.quartier ? `, ${bien.quartier}` : ''}`}
                          bienPrix={`${formatFCFA(prixValue!)}${prixSuffix}`}
                          className="mt-4"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center mb-10 p-8 bg-secondary/5 rounded-[2.5rem] border border-secondary/10">
                        <ShieldCheck className="w-10 h-10 text-secondary mx-auto mb-4" />
                        <p className="text-[11px] uppercase font-bold text-secondary tracking-[0.5em] font-display">Commandes Administrateur</p>
                      </div>
                      <a href={`/mes-biens/${bien.id}/modifier`} className="flex items-center justify-center w-full py-6 bg-off-white text-midnight rounded-2xl font-bold text-[11px] uppercase tracking-[0.5em] font-display hover:bg-secondary transition-all duration-700">
                        Édition Diplomatique
                      </a>
                      <a href={`/mes-biens/${bien.id}/modifier?step=medias`} className="flex items-center justify-center w-full py-6 bg-off-white/5 border border-off-white/10 text-off-white rounded-2xl font-bold text-[11px] uppercase tracking-[0.5em] font-display hover:bg-off-white/10 hover:border-off-white transition-all duration-700">
                        Gestionnaire de Médias
                      </a>
                      <div className="pt-4 border-t border-off-white/5">
                        <DeleteBienButton bienId={bien.id} titre={bien.titre} />
                      </div>
                    </div>
                  )}
                  
                  {/* Curated Expert Card */}
                  <div className="mt-16 pt-16 border-t border-off-white/5">
                    <div className="flex items-center gap-8">
                      <div className="relative group/avatar">
                        <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-1000" />
                        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-off-white/10 border-4 border-midnight-muted flex-shrink-0 transition-transform duration-1000 group-hover/avatar:rotate-3 group-hover/avatar:scale-110 shadow-lg">
                          {proprio?.avatar_url ? (
                            <Image src={proprio.avatar_url} alt={proprio.full_name} width={80} height={80} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-off-white/5">
                              <Sparkles className="w-8 h-8 text-off-white/10" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase font-bold text-off-white/60 tracking-[0.5em] mb-2 font-display">Votre Curateur</p>
                        <p className="font-display font-bold text-2xl tracking-tighter text-off-white group-hover/sidebar:text-[var(--accent-luxury)] transition-colors duration-700 leading-none">
                          {proprio?.full_name || 'Élite Immo CI'}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.3em]">Conseiller Dédié en Ligne</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </aside>
        </div>
      </div>
      
      {/* Editorial Footer Detail */}
      <footer className="max-w-[1800px] mx-auto px-8 py-24 border-t border-off-white/5 flex flex-col md:flex-row justify-between items-center gap-12 text-off-white/40">
        <div className="flex flex-wrap items-center justify-center gap-12">
           <p className="text-[11px] font-bold uppercase tracking-[0.6em] font-display">© 2026 Immo CI Prestige</p>
           <span className="hidden md:block w-12 h-[1px] bg-off-white/5" />
           <p className="text-[11px] font-bold uppercase tracking-[0.6em] font-display">Archive Immobilière N°442</p>
        </div>
        <div className="flex items-center gap-8">
           <div className="w-12 h-[1px] bg-off-white/5" />
           <Sparkles className="w-6 h-6 opacity-20" />
        </div>
      </footer>
    </main>
  )
}
