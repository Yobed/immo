export const revalidate = 3600 // ISR: revalide toutes les 1h

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { formatFCFA } from '@/lib/format'
import { Badge } from '@/components/ui'
import { TYPES_BIEN_LABELS, EQUIPEMENTS_LABELS } from '@immo-ci/shared/constants/biens'
import { BienCarousel } from '@/components/bien/BienCarousel'
import { FavorisButton } from '@/components/bien/FavorisButton'
import { VisiteRequestForm } from '@/components/bien/VisiteRequestForm'
import { ContactProprietaireButton } from '@/components/bien/ContactProprietaireButton'
import { ConciergerieLive } from '@/components/chat/ConciergerieLive'
import { VIPConciergeButton } from '@/components/bien/VIPConciergeButton'
import { VirtualTourViewer } from '@/components/bien/VirtualTourViewer'
import { BienMap } from '@/components/bien/BienMap'
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
  Building2
} from 'lucide-react'
import * as motion from 'framer-motion/client'
import { PropertyHeroOverlay } from '@/components/bien/PropertyHeroOverlay'

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

const EQUIPEMENTS_ICONS: Record<string, any> = {
  climatisation: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 9v12M9 12l3-3 3 3M12 3v2M4.22 10.22l1.42 1.42M1 18h2M21 18h2M19.78 10.22l-1.42 1.42M12 3a7 7 0 0 0 0 14"/></svg>,
  wifi: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  parking: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>,
  gardien: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  eau_chaude: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/><circle cx="12" cy="12" r="5"/></svg>,
  ascenseur: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 9l3-3 3 3M9 15l3 3 3-3"/></svg>,
  piscine: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h20M2 12c2 0 2 3 4 3s2-3 4-3 2 3 4 3 2-3 4-3"/><path d="M4 7l4-4 4 4 4-4 4 4"/></svg>,
  meuble: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2m16 0a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2m16 0H4"/><path d="M4 16v3m16-3v3"/></svg>,
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
  const proprio = bien['profiles!biens_proprietaire_id_fkey'] as { full_name: string; avatar_url: string | null } | null
  const isNuitee = bien.type_bien === 'residence_meublee'

  const prixValue = isNuitee && bien.prix_nuit_fcfa ? bien.prix_nuit_fcfa : bien.prix_mois_fcfa ? bien.prix_mois_fcfa : bien.prix_vente_fcfa
  const prixSuffix = isNuitee ? '/nuit' : bien.prix_mois_fcfa ? '/mois' : ''

  const stats = [
    { label: 'Superficie', value: bien.surface_m2 ? `${bien.surface_m2} m²` : null, icon: Maximize },
    { label: 'Pièces', value: bien.nb_pieces, icon: LayoutGrid },
    { label: 'Chambres', value: bien.nb_chambres, icon: BedDouble },
    { label: 'Bains', value: bien.nb_salles_bain, icon: Bath },
    { label: 'Niveau', value: bien.etage != null ? (bien.etage === 0 ? 'RDC' : `Étage ${bien.etage}`) : null, icon: Layers },
  ].filter(s => s.value != null)

  const prix = prixValue ? {
    value: formatFCFA(prixValue),
    suffix: prixSuffix
  } : null

  return (
    <main className="bg-[var(--midnight)] min-h-screen selection:bg-secondary/20 font-sans text-[var(--off-white)] antialiased">
      
      {/* Editorial Navigation */}
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

      {/* Luxury Immersive Hero Section */}
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
          
          <PropertyHeroOverlay />
        </motion.div>
      </section>

      {/* Property Identity Section - Clean & High Contrast */}
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
                  <div className="h-px w-12 bg-off-white/10" />
                  <span className="text-off-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
                    Ref. {bien.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                
                <h1 className="font-display text-5xl md:text-[6.5rem] font-bold text-off-white leading-[0.9] tracking-tight mb-8">
                  {bien.titre}
                </h1>

                <div className="flex items-center gap-3 text-off-white/60">
                  <div className="w-10 h-10 rounded-full bg-off-white/5 flex items-center justify-center border border-off-white/10">
                    <MapPin className="w-5 h-5 text-accent-luxury" />
                  </div>
                  <span className="text-2xl font-display font-light tracking-tight">
                    {bien.commune}{bien.quartier ? ` • ${bien.quartier}` : ''}
                  </span>
                </div>
              </div>

              <div className="lg:text-right shrink-0">
                <div className="inline-block p-10 rounded-[2.5rem] bg-off-white/5 backdrop-blur-3xl border border-off-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-luxury/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-off-white/30 mb-4 relative z-10">Investissement</p>
                  <p className="text-5xl md:text-6xl font-display font-bold text-off-white tracking-tighter relative z-10">
                    {prix ? prix.value : 'Prix sur demande'}
                    {prix?.suffix && (
                      <span className="text-xl font-sans font-light text-off-white/40 ml-4 uppercase tracking-[0.2em]">
                        {prix.suffix.replace('/', '')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Detail Content Section */}
      <div className="max-w-[1800px] mx-auto px-8 pb-48">
        <div className="flex flex-col lg:flex-row gap-32">
          
          {/* Main Content Column */}
          <div className="flex-1 max-w-5xl">
            
            {/* Editorial Specs Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap gap-x-20 gap-y-12 pb-24 border-b border-off-white/5 mb-32"
            >
              {stats.map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-3 min-w-[140px]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-off-white/70 font-display italic">— {stat.label}</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-display font-bold text-off-white tracking-tighter">{stat.value}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* The Manifest - Story Section */}
            <section className="mb-48">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-20 items-start">
                <div className="md:col-span-4">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5 }}
                  >
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.6em] text-[var(--accent-luxury)] mb-10 font-display">Narrative du Lieu</h2>
                    <h3 className="font-display text-5xl font-bold text-off-white leading-[0.95] tracking-tight">
                      Une Vision <br /> de la <span className="italic font-light">Sérénité.</span>
                    </h3>
                  </motion.div>
                </div>
                <div className="md:col-span-8">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className="font-sans text-2xl md:text-3xl text-off-white/70 font-light leading-relaxed first-letter:text-8xl first-letter:float-left first-letter:mr-6 first-letter:text-off-white first-letter:font-display first-letter:leading-[0.8]"
                  >
                    {bien.description}
                  </motion.p>
                </div>
              </div>
            </section>

            {/* Lifestyle Image Narrative - Cinematic Reveal */}
            {medias.length > 1 && (
              <section className="mb-48 space-y-64 overflow-hidden">
                {/* Section 1: Image Left, Text Right */}
                <div className="flex flex-col md:flex-row items-center gap-16 md:gap-32 relative">
                  <motion.div 
                    initial={{ opacity: 0, x: -150, rotate: -2 }}
                    whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="md:w-[60%] rounded-[2.5rem] overflow-hidden shadow-2xl z-20 aspect-video md:aspect-square lg:aspect-[4/3] border border-white/10"
                  >
                    <Image 
                      src={medias[1]?.url || '/images/lifestyle/lifestyle_calm_villa_1776370822601.png'}
                      alt="Lifestyle Detail 1" 
                      width={1200} 
                      height={900} 
                      className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-[3s] scale-105 hover:scale-100"
                    />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: 150 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="md:w-[40%] z-30 bg-[#020617]/90 backdrop-blur-3xl p-12 md:p-16 rounded-[3rem] shadow-2xl border border-white/10"
                  >
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/50 mb-8 font-display">Confort Absolu</h4>
                    <p className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight leading-[0.95] mb-8">
                      La clarté <span className="italic font-light text-[#C5A059]">comme horizon.</span>
                    </p>
                    <p className="text-xl text-white/70 font-light leading-relaxed italic border-l-2 border-[#C5A059]/40 pl-8">
                      L&apos;architecture s&apos;efface devant la lumière, créant une fluidité entre intérieur et extérieur.
                    </p>
                  </motion.div>
                </div>

                {/* Section 2: Image Right, Text Left */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-16 md:gap-32 relative">
                  <motion.div 
                    initial={{ opacity: 0, x: 150, rotate: 2 }}
                    whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="md:w-[60%] rounded-[2.5rem] overflow-hidden shadow-2xl z-20 aspect-video md:aspect-square lg:aspect-[4/3] border border-white/10"
                  >
                    <Image 
                      src={medias[2]?.url || '/images/lifestyle/lifestyle_nature_residence_1776370841683.png'}
                      alt="Lifestyle Detail 2" 
                      width={1200} 
                      height={900} 
                      className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-[3s] scale-105 hover:scale-100"
                    />
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -150 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="md:w-[40%] z-30 bg-[#020617]/90 backdrop-blur-3xl p-12 md:p-16 rounded-[3rem] shadow-2xl border border-white/10"
                  >
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/50 mb-8 font-display">Matières Nobles</h4>
                    <p className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight leading-[0.95] mb-8">
                      Le luxe <span className="italic font-light text-[#C5A059]">silencieux.</span>
                    </p>
                    <p className="text-xl text-white/70 font-light leading-relaxed italic border-l-2 border-[#C5A059]/40 pl-8">
                      Une sélection de textures qui sollicitent les sens et célèbrent le vrai confort.
                    </p>
                  </motion.div>
                </div>
              </section>
            )}

            {/* Visual Specs Grid */}
            <section className="mb-48">
              <div className="flex flex-col gap-6 mb-24 items-center">
                 <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-off-white/40 font-display">Équipements Signatures</h3>
                 <div className="w-20 h-[2px] bg-[var(--accent-luxury)]/50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                {(bien.equipements as string[] ?? []).map((eq, i) => (
                  <motion.div 
                    key={eq} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 1 }}
                    className="group"
                  >
                    <div className="flex items-center gap-8 p-8 border border-off-white/10 rounded-2xl bg-off-white/[0.04] hover:bg-off-white/[0.08] transition-all duration-700">
                      <div className="flex-shrink-0 text-off-white/60 group-hover:text-[var(--accent-luxury)] transition-colors">
                        {EQUIPEMENTS_ICONS[eq] || <Sparkles className="w-8 h-8" />}
                      </div>
                      <div>
                        <h4 className="font-display font-medium text-lg text-off-white leading-tight">{EQUIPEMENTS_LABELS[eq] ?? eq}</h4>
                        <p className="text-[10px] font-bold text-off-white/20 uppercase tracking-widest mt-1 italic">Élite Standard</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 3D Immersive Tour Reveal */}
            {bien.url_visite_3d && (
              <section className="mb-48">
                <div className="flex flex-col gap-6 mb-16 items-center">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-off-white/40 font-display">Expérience Immersive</h3>
                  <div className="w-20 h-[2px] bg-secondary/50" />
                </div>
                <VirtualTourViewer url={bien.url_visite_3d} title={bien.titre} />
              </section>
            )}

            {/* Geographical Context */}
            <section className="mb-24">
              <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-10">
                <div className="max-w-2xl">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.6em] text-[var(--accent-luxury)] mb-8 font-display">Situation Géographique</h3>
                  <h4 className="font-display text-5xl font-bold text-off-white tracking-tight leading-[1] mb-6">{bien.adresse_complete}</h4>
                  <p className="text-off-white/60 text-xl font-light italic leading-relaxed">Une adresse de prestige, nichée au cœur des quartiers les plus exclusifs de {bien.commune}.</p>
                </div>
                <div className="px-8 py-4 bg-midnight-muted border border-off-white/10 rounded-full flex items-center gap-4 shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-off-white">Sécurité Maximale</span>
                </div>
              </div>
              
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-off-white/10 p-2 bg-off-white/5">
                <div className="w-full grayscale contrast-[1.1] hover:grayscale-0 transition-all duration-[2000ms] rounded-[2.5rem] overflow-hidden">
                   <BienMap
                    latitude={bien.latitude as number | null}
                    longitude={bien.longitude as number | null}
                    titre={bien.titre}
                    commune={bien.commune}
                    hauteur={650}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Luxury Sidebar - The Concierge */}
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
