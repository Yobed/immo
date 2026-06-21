import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Key, 
  Search, 
  Clock, 
  Gem, 
  ArrowRight,
  Sparkles,
  Waves,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: "Services premium — Gestion locative, estimation, conciergerie à Abidjan",
  description: "Au-delà des annonces : gestion locative complète, estimation gratuite, conciergerie VIP et marketing immobilier de luxe pour vos biens à Abidjan et en Côte d'Ivoire.",
  keywords: ['gestion locative abidjan', 'estimation immobilière côte d\'ivoire', 'conciergerie immobilière luxe', 'agence immobilière premium abidjan'],
  alternates: { canonical: '/services' },
  openGraph: {
    title: "Services premium BOGBE'S GROUPE — Gestion, estimation, conciergerie",
    description: "Gestion locative complète, estimation gratuite et conciergerie de luxe pour propriétaires en Côte d'Ivoire.",
    type: 'website' as const,
  },
};

const ServicesPage = () => {
  const services = [
    {
      title: "Gestion Locative Élite",
      description: "Libérez-vous des contraintes. Nous gérons vos actifs avec une rigueur absolue : sélection de locataires, maintenance préventive et rapports mensuels détaillés.",
      icon: <Building2 className="w-8 h-8" />,
      tag: "Tranquillité",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"
    },
    {
      title: "Vente & Acquisition Heritage",
      description: "Un accompagnement sur mesure pour vos transactions les plus précieuses. Accès au 'Off-Market', estimation par IA et stratégie de marketing confidentielle.",
      icon: <Gem className="w-8 h-8" />,
      tag: "Exclusivité",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop"
    },
    {
      title: "Expertise & Conseil Patrimonial",
      description: "Optimisez votre portefeuille immobilier en Côte d'Ivoire. Analyses de rendement, audits fiscaux et projections à 10 ans.",
      icon: <ShieldCheck className="w-8 h-8" />,
      tag: "Stratégie",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--midnight)] text-white pt-8 sm:pt-14 lg:pt-20 pb-16">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-20 mb-16 lg:mb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-luxury/10 blur-[150px] rounded-full -z-10 animate-pulse" />
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[var(--accent-luxury)]" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--accent-luxury)]">L'Art de Vivre Sapphire</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-display font-medium leading-[1.1] mb-8">
            Des services façonnés pour <span className="text-[var(--accent-luxury)] italic font-serif">l'Exception.</span>
          </h1>
          <p className="text-xl text-white/60 leading-relaxed max-w-2xl font-light">
            De la gestion de patrimoine à la Sapphire Intelligence, nous redéfinissons les standards de l'immobilier premium en Côte d'Ivoire.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-6 lg:px-20 mb-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="group relative h-[600px] rounded-[40px] overflow-hidden border border-white/10 hover:border-accent-luxury/30 transition-all duration-700 hover:-translate-y-4 shadow-2xl"
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--midnight)] via-background/50 to-transparent" />
              </div>

              <div className="absolute inset-0 z-10 p-10 flex flex-col justify-end">
                <div className="w-16 h-16 rounded-2xl bg-accent-luxury/20 border border-accent-luxury/30 flex items-center justify-center mb-8 backdrop-blur-xl group-hover:bg-[var(--accent-luxury)] group-hover:text-[var(--midnight)] transition-all duration-500">
                  {service.icon}
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-luxury)] mb-4">{service.tag}</span>
                <h3 className="text-3xl font-display font-medium mb-4">{service.title}</h3>
                <p className="text-white/50 leading-relaxed mb-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                  {service.description}
                </p>
                <div className="flex items-center gap-3 text-sm font-bold tracking-widest uppercase text-white/80 hover:text-[var(--accent-luxury)] transition-colors cursor-pointer">
                  En savoir plus <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sapphire Intelligence Highlight Section */}
      <section className="px-6 lg:px-20 mb-40">
        <div className="relative rounded-[60px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 overflow-hidden p-12 lg:p-24 flex flex-col lg:flex-row items-center gap-16">
          <div className="absolute top-0 left-0 w-full h-full -z-10 mix-blend-overlay opacity-20 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[var(--accent-luxury)] blur-[200px]" />
          </div>

          <div className="flex-1 space-y-10">
            <div className="w-20 h-20 rounded-full bg-[var(--midnight)] border-2 border-accent-luxury/50 flex items-center justify-center animate-bounce duration-[3000ms]">
              <Sparkles className="w-10 h-10 text-[var(--accent-luxury)]" />
            </div>
            <div>
              <h2 className="text-4xl lg:text-6xl font-display font-medium mb-6">Sapphire <br/><span className="text-[var(--accent-luxury)] underline decoration-1 underline-offset-8">Intelligence 24/7</span></h2>
              <p className="text-xl text-white/50 leading-relaxed font-light">
                <span className="text-white font-medium">Sapphire</span> est notre assistante intelligente sur WhatsApp : elle comprend ce que vous cherchez et vous propose des biens en quelques secondes, à toute heure.
                Dès que vous voulez visiter, <span className="text-white font-medium">un conseiller humain BOGBE’S prend le relais</span> et vous accompagne jusqu’à la signature.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <Clock className="w-5 h-5 text-[var(--accent-luxury)]" />
                <span className="text-sm font-medium">Disponibilité Immédiate</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                <Waves className="w-5 h-5 text-[var(--accent-luxury)]" />
                <span className="text-sm font-medium">Recherche en temps réel</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full lg:max-w-md relative">
            <div className="aspect-[4/5] rounded-[40px] bg-[var(--midnight)] border border-white/10 p-8 shadow-2xl relative overflow-hidden group">
               {/* Mockup Chat UI */}
               <div className="space-y-6">
                 <div className="flex justify-end">
                   <div className="bg-accent-luxury/10 text-[var(--accent-luxury)] p-4 rounded-2xl rounded-tr-none text-sm font-medium max-w-[80%] border border-accent-luxury/20">
                     Je cherche une villa avec piscine à Marcory Zone 4.
                   </div>
                 </div>
                 <div className="flex justify-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-[var(--accent-luxury)] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(var(--accent-luxury-rgb),0.4)]">
                     <Sparkles className="w-5 h-5 text-[var(--midnight)]" />
                   </div>
                   <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed text-white/70 max-w-[85%]">
                     Certainement, Excellence. J'ai identifié 3 propriétés répondant à vos exigences de standing. <br/><br/>
                     <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group/item">
                       <div className="w-12 h-12 rounded-lg bg-gray-500/20 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&auto=format" alt="" aria-hidden="true" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                         <div className="text-[10px] font-bold text-[var(--accent-luxury)]">DISPONIBLE</div>
                         <div className="text-xs font-medium">Villa Blue Sapphire - Zone 4</div>
                       </div>
                       <ArrowRight className="w-4 h-4 text-white/30 group-hover/item:translate-x-1 transition-transform" />
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="absolute inset-0 bg-gradient-to-t from-[var(--midnight)] via-transparent to-transparent pointer-events-none" />
            </div>
            
            {/* Visual element floating */}
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-accent-luxury/10 blur-3xl rounded-full" />
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="text-center px-6 mb-20">
        <h2 className="text-3xl font-display mb-12 italic text-white/80">L'immobilier, <span className="text-white font-medium not-italic">totalement repensé.</span></h2>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <Link href="/recherche" className="px-10 py-5 rounded-full bg-[var(--accent-luxury)] text-[var(--midnight)] font-bold uppercase tracking-widest hover:scale-105 transition-transform">
            Explorer les biens
          </Link>
          <Link
            href="/proprietaires"
            className="px-10 py-5 rounded-full bg-white/5 border border-white/10 font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Prendre Rendez-vous
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
