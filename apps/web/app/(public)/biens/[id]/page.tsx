import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui'
import { TYPES_BIEN_LABELS, EQUIPEMENTS_LABELS } from '@immo-ci/shared/constants/biens'
import { BienCarousel } from '@/components/bien/BienCarousel'
import { FavorisButton } from '@/components/bien/FavorisButton'
import { VisiteRequestForm } from '@/components/bien/VisiteRequestForm'
import { ContactProprietaireButton } from '@/components/bien/ContactProprietaireButton'
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
  Award
} from 'lucide-react'
import * as motion from 'framer-motion/client'

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' FCFA'
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

  return (
    <main className="bg-white min-h-screen selection:bg-primary/10 font-sans">
      
      {/* Editorial Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-8 py-6 pointer-events-none">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <motion.a 
            href="/biens"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="pointer-events-auto flex items-center gap-4 px-6 py-3 bg-white/90 backdrop-blur-3xl rounded-full shadow-2xl border border-gray-100/50 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retour à la collection</span>
          </motion.a>
          
          <div className="flex gap-4 pointer-events-auto">
             <motion.button 
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="p-4 bg-white/90 backdrop-blur-3xl rounded-full shadow-2xl border border-gray-100/50 hover:scale-110 transition-transform"
             >
               <Share2 className="w-5 h-5" />
             </motion.button>
             <FavorisButton 
               bienId={bien.id} 
               userId={user?.id ?? null} 
               className="p-4 bg-white/90 backdrop-blur-3xl rounded-full shadow-2xl border border-gray-100/50 hover:scale-110 transition-transform" 
             />
          </div>
        </div>
      </nav>

      {/* Luxury Immersive Hero Section */}
      <section className="relative w-full h-[85vh] md:h-screen overflow-hidden">
        {/* Parallax Image Content */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full relative"
        >
          {medias.length > 0 ? (
            <BienCarousel medias={medias.map((m: any) => ({
              id: m.id, type: m.type, url: m.url,
              embed_url: m.embed_url, titre: m.titre,
              hotspots: m.hotspots, duree_sec: m.duree_sec,
            }))} isHero={true} />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-gray-200 animate-pulse" />
            </div>
          )}
          
          {/* Magazine-style Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />
          
          {/* Hero Content */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end pb-32 px-8 pointer-events-none">
            <div className="max-w-[1800px] mx-auto w-full">
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1.2 }}
                className="max-w-5xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <Badge className="bg-primary hover:bg-primary/90 text-white border-none py-1.5 px-6 text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/40">
                    {TYPES_BIEN_LABELS[bien.type_bien] ?? bien.type_bien}
                  </Badge>
                  <span className="w-12 h-px bg-white/30" />
                  <span className="text-white font-bold tracking-[0.4em] uppercase text-[9px]">Annonce Premium</span>
                </div>
                
                <h1 className="font-display text-7xl md:text-[10rem] font-bold text-white mb-10 tracking-tighter leading-[0.8] mix-blend-lighten drop-shadow-2xl">
                  {bien.titre}
                </h1>
                
                <div className="flex flex-wrap items-center gap-10 text-white/70">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Situation</p>
                      <p className="text-lg font-bold text-white tracking-tight">
                        {bien.commune}{bien.quartier ? ` • ${bien.quartier}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Prestige</p>
                      <p className="text-lg font-bold text-white tracking-tight">Édition Limitée</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <div className="w-px h-16 bg-gradient-to-t from-white to-transparent" />
        </motion.div>
      </section>

      {/* Detail Content Section */}
      <div className="max-w-[1800px] mx-auto px-8 py-40">
        <div className="flex flex-col lg:flex-row gap-24">
          
          {/* Main Content Column */}
          <div className="flex-1 max-w-5xl">
            
            {/* Museum-style Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-5 gap-1 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] rounded-[3rem] overflow-hidden border border-gray-100 bg-gray-50 mb-32"
            >
              {stats.map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center py-10 px-6 bg-white border-r border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-500">
                  <stat.icon className="w-7 h-7 text-primary/30 mb-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span className="text-2xl font-display font-black text-gray-950 tracking-tighter leading-none">{stat.value}</span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-2">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* The Manifest - Story Section */}
            <section className="mb-40">
              <div className="flex flex-col md:flex-row gap-16 items-start">
                <div className="md:w-1/3">
                  <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6">Manifeste du Bien</h2>
                    <h3 className="font-display text-4xl font-black text-gray-950 leading-[0.9] tracking-tighter">
                      L&apos;Expression du <br /> <span className="italic">Luxe Authentique.</span>
                    </h3>
                  </motion.div>
                </div>
                <div className="md:w-2/3">
                  <motion.p 
                    initial={{ opacity: 0, x: 100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="font-sans text-2xl md:text-3xl text-gray-600 font-light leading-relaxed first-letter:text-7xl first-letter:float-left first-letter:mr-4 first-letter:text-primary first-letter:font-black"
                  >
                    {bien.description}
                  </motion.p>
                </div>
              </div>
            </section>

            {/* Lifestyle Image Narrative - Slide & Reveal */}
            {medias.length > 1 && (
              <section className="mb-40 space-y-32">
                <div className="flex flex-col md:flex-row items-center gap-20">
                  <motion.div 
                    initial={{ opacity: 0, x: -150 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="md:w-3/5 rounded-[4rem] overflow-hidden shadow-2xl"
                  >
                    <Image 
                      src={medias[1].url} 
                      alt="Lifestyle Detail 1" 
                      width={1200} 
                      height={800} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-[3s]"
                    />
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 150 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                    className="md:w-2/5"
                  >
                    <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-400 mb-6">Perspective & Lumière</h4>
                    <p className="font-display text-5xl font-black text-gray-950 tracking-tighter leading-[0.9] mb-8">
                      Des volumes <span className="italic text-primary">sculptés par le jour.</span>
                    </p>
                    <p className="text-xl text-gray-500 font-light leading-relaxed">
                      Chaque espace a été pensé pour capturer l&apos;essence de la lumière tropicale, créant une atmosphère de sérénité absolue.
                    </p>
                  </motion.div>
                </div>

                <div className="flex flex-col md:flex-row-reverse items-center gap-20">
                  <motion.div 
                    initial={{ opacity: 0, x: 150 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="md:w-3/5 rounded-[4rem] overflow-hidden shadow-2xl"
                  >
                    <Image 
                      src={medias[medias.length > 2 ? 2 : 0].url} 
                      alt="Lifestyle Detail 2" 
                      width={1200} 
                      height={800} 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-[3s]"
                    />
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: -150 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                    className="md:w-2/5"
                  >
                    <h4 className="text-[11px] font-black uppercase tracking-[0.6em] text-gray-400 mb-6">Matières & Émotion</h4>
                    <p className="font-display text-5xl font-black text-gray-950 tracking-tighter leading-[0.9] mb-8">
                      Le raffinement <br /><span className="italic text-secondary">dans le détail.</span>
                    </p>
                    <p className="text-xl text-gray-500 font-light leading-relaxed">
                      Une sélection rigoureuse de matériaux nobles, alliant esthétique contemporaine et confort intemporel.
                    </p>
                  </motion.div>
                </div>
              </section>
            )}

            {/* Visual Specs Grid */}
            <section className="mb-40">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-center text-gray-400 mb-20">Art & Prestations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {(bien.equipements as string[] ?? []).map((eq, i) => (
                  <motion.div 
                    key={eq} 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-6 p-10 bg-gray-50 rounded-[3rem] border border-gray-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-700 group"
                  >
                    <div className="w-16 h-16 rounded-[2rem] bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/10 transition-all duration-700 shadow-sm group-hover:shadow-lg">
                      {EQUIPEMENTS_ICONS[eq] || <Sparkles className="w-8 h-8" />}
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xl text-gray-950 mb-1 leading-none">{EQUIPEMENTS_LABELS[eq] ?? eq}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Équipement Signature</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Geographical Context */}
            <section className="mb-20">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6">Emplacement</h3>
                  <h4 className="font-display text-5xl font-black text-gray-950 tracking-tighter leading-none mb-4">{bien.adresse_complete}</h4>
                  <p className="text-gray-400 text-lg font-medium">Une adresse prisée au cœur de {bien.commune}.</p>
                </div>
                <div className="px-10 py-5 bg-green-50 rounded-full border border-green-100 flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-900">Sérénité & Sécurité</span>
                </div>
              </div>
              
              <div className="relative group rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border-8 border-white">
                <div className="absolute inset-0 bg-primary/5 backdrop-blur-3xl z-0 transition-opacity duration-1000 opacity-0 group-hover:opacity-100" />
                <div className="relative z-10 w-full grayscale-[100%] contrast-[1.2] hover:grayscale-0 transition-all duration-[2000ms]">
                   <BienMap
                    latitude={bien.latitude as number | null}
                    longitude={bien.longitude as number | null}
                    titre={bien.titre}
                    commune={bien.commune}
                    hauteur={600}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Luxury Sidebar - The Concierge */}
          <aside className="w-full lg:w-[480px] shrink-0">
            <div className="sticky top-28">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="bg-gray-950 rounded-[4rem] p-12 text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden group/sidebar"
              >
                {/* Background Textures */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-40 group-hover/sidebar:opacity-60 transition-opacity duration-1000" />
                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-px bg-primary/50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Opportunité Rare</p>
                      </div>
                      <div className="flex items-baseline gap-4">
                        <span className="text-5xl md:text-6xl font-display font-black tracking-tighter">{formatFCFA(prixValue!)}</span>
                        <span className="text-white/30 font-bold uppercase text-[10px] tracking-[0.2em]">{prixSuffix}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 mb-16">
                    <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/10 transition-colors hover:bg-white/10">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-1">Disponibilité</p>
                        <p className="text-lg font-bold tracking-tight">Immédiate</p>
                      </div>
                    </div>
                    
                    {bien.charges_mois_fcfa > 0 && (
                      <div className="flex items-center justify-between px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                        <span>Charges mensuelles</span>
                        <span className="text-white tracking-widest">{formatFCFA(bien.charges_mois_fcfa)}</span>
                      </div>
                    )}
                  </div>

                  {!isOwner ? (
                    <div className="space-y-6">
                      {isNuitee ? (
                        <a href={`/reservations/nouvelle?bienId=${bien.id}`} className="flex items-center justify-center w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-white hover:text-gray-950 transition-all duration-[800ms] shadow-2xl shadow-primary/40 hover:scale-[1.02]">
                          Procéder à la Réservation
                        </a>
                      ) : (
                        <div className="group/form">
                           <VisiteRequestForm bienId={bien.id} proprietaireId={bien.proprietaire_id as string} isPremium={true} />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <ContactProprietaireButton
                          bienId={bien.id}
                          proprietaireId={bien.proprietaire_id as string}
                          userId={user?.id ?? null}
                          className="w-full flex items-center justify-center gap-3 py-5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-500"
                        />
                        <button className="w-full flex items-center justify-center gap-3 py-5 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-500">
                          <MessageCircle className="w-4 h-4 text-primary" />
                          Chat Privé
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                          <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-[10px] uppercase font-black text-primary tracking-[0.3em]">Gestion Propriétaire</p>
                      </div>
                      <a href={`/mes-biens/${bien.id}/modifier`} className="flex items-center justify-center w-full py-5 bg-white text-gray-950 rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all duration-700">
                        Édition Structurelle
                      </a>
                      <a href={`/mes-biens/${bien.id}/modifier?step=medias`} className="flex items-center justify-center w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-white/10 transition-all duration-700">
                        Curateur de Médias
                      </a>
                    </div>
                  )}
                  
                  {/* Curated Expert Card */}
                  <div className="mt-16 pt-12 border-t border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="relative group/avatar">
                        <div className="absolute inset-0 bg-primary/40 rounded-full blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-900 border-2 border-white/10 flex-shrink-0 transition-transform duration-700 group-hover/avatar:scale-110">
                          {proprio?.avatar_url ? (
                            <Image src={proprio.avatar_url} alt={proprio.full_name} width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-primary/30" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] uppercase font-black text-gray-600 tracking-[0.4em] mb-1">Votre Curateur Dédié</p>
                        <p className="font-display font-black text-xl tracking-tight leading-none group-hover/sidebar:text-primary transition-colors duration-700">
                          {proprio?.full_name || 'Le Cercle Immo CI'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Disponible maintenant</span>
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
      <footer className="max-w-[1800px] mx-auto px-8 py-20 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-10">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">© 2026 Immo CI Prestige</p>
           <span className="w-10 h-px bg-gray-100" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">SÉLECTION EXCLUSIVE</p>
        </div>
        <div className="flex items-center gap-4">
           <Sparkles className="w-5 h-5 text-primary/20" />
        </div>
      </footer>
    </main>
  )
}
