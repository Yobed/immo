"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { MagneticWrapper } from "./MagneticWrapper";

interface Property {
  id: string | number;
  title: string;
  location: string;
  price: string;
  tags: string[];
  image: string;
}

const elitePropertiesFallback: Property[] = [
  {
    id: 1,
    title: "La Villa Riviera",
    location: "Riviera Golf",
    price: "850,000,000 FCFA",
    tags: ["Piscine à débordement", "Vue Lagune", "Cinéma Privé"],
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Penthouse Céleste",
    location: "Plateau",
    price: "1,200,000,000 FCFA",
    tags: ["Dernier étage", "Vue 360°", "Domotique intégrée"],
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Domaine des Arts",
    location: "Zone 4",
    price: "950,000,000 FCFA",
    tags: ["Jardin paysager", "Architecture d'auteur", "Spa intérieur"],
    image: "https://images.unsplash.com/photo-1613490900233-08145a3b2b8b?q=80&w=2000&auto=format&fit=crop"
  }
];

export const PremiumShowcase = ({ properties }: { properties?: Property[] }) => {
  const displayProperties = properties && properties.length > 0 ? properties : elitePropertiesFallback;
  const router = useRouter();

  return (
    <section className="relative bg-[var(--background)] z-30 overflow-hidden pb-12 md:pb-24">
      {/* Editorial Intro */}
      <div className="min-h-[70vh] flex flex-col items-center justify-center relative px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.1 }}
          className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 dark:invert-0 invert"
        />
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
           className="flex flex-col items-center text-center relative z-10"
        >
          <span className="text-[var(--accent-luxury)] font-sans tracking-[0.4em] uppercase text-[10px] mb-6 font-bold">
            The Heritage Collection
          </span>
          
          <h2 className="text-4xl md:text-[8rem] font-serif font-light text-[var(--text)] leading-[0.9] tracking-tighter mb-8">
            L&apos;Excellence<br/>
            <span className="italic opacity-60">Architecturale</span>
          </h2>

          <p className="text-[var(--text-muted)] font-sans text-sm md:text-base font-light tracking-wide max-w-sm mb-10 leading-relaxed">
            Une sélection exclusive de propriétés d&apos;exception pour une clientèle de prestige.
          </p>

          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="flex flex-col items-center gap-4 text-[var(--text-muted)] opacity-20"
          >
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold">Explorer</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-[var(--text-muted)] to-transparent" />
          </motion.div>
        </motion.div>
      </div>

      {/* Cinematic Property Showcase */}
      <div className="flex flex-col gap-16 md:gap-32 lg:gap-48 px-4 md:px-12 lg:px-24 max-w-[1800px] mx-auto">
        {displayProperties.map((property, idx) => {
          const isEven = idx % 2 === 0;

          return (
            <div key={property.id} className="relative group">
              <div className={`grid lg:grid-cols-12 gap-12 lg:gap-24 items-center`}>
                
                {/* Visual Side */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? -150 : 150 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`lg:col-span-7 relative aspect-[4/5] md:aspect-video lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-md ${isEven ? 'lg:order-1' : 'lg:order-2'}`}
                >
                  <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    priority={idx === 0}
                    className="object-cover scale-105 group-hover:scale-110 transition-transform duration-[4s] cubic-bezier(0.16, 1, 0.3, 1)"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                  <div className="absolute inset-0 bg-midnight/20 group-hover:bg-transparent transition-colors duration-1000" />
                </motion.div>

                {/* Narrative Side */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? 100 : -100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  className={`lg:col-span-5 flex flex-col ${isEven ? 'lg:order-2' : 'lg:order-1 lg:text-right lg:items-end'}`}
                >
                  <div className={`flex items-center gap-4 mb-8 ${!isEven && 'lg:flex-row-reverse'}`}>
                    <span className="w-12 h-[1px] bg-[var(--accent-luxury)]"></span>
                    <span className="text-[var(--accent-luxury)] uppercase tracking-[0.3em] text-[10px] font-bold">
                      {property.location}
                    </span>
                  </div>

                  <h3 className="text-3xl md:text-7xl font-display font-light text-[var(--text)] mb-6 leading-[1] tracking-tight">
                    {property.title}
                  </h3>
                  
                  <div className={`flex flex-wrap gap-2 mb-8 ${!isEven && 'lg:justify-end'}`}>
                    {property.tags.map((tag, i) => (
                      <span key={i} className="px-4 py-1.5 border border-[var(--border)] bg-[var(--surface-card)] rounded-full text-[var(--text-muted)] text-[9px] font-sans tracking-widest uppercase font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className={`mb-10 flex flex-col ${!isEven && 'lg:items-end'}`}>
                    <span className="text-[10px] text-[var(--text-muted)] font-sans tracking-[0.3em] mb-4 uppercase font-bold">Investissement</span>
                    <span className="text-2xl md:text-5xl font-serif text-[var(--text)]">
                      {property.price}
                    </span>
                  </div>

                  <MagneticWrapper>
                    <button 
                      onClick={() => router.push(`/biens/${property.id}`)}
                      className="group relative overflow-hidden flex items-center gap-8 bg-[var(--text)] text-[var(--background)] px-10 py-5 rounded-sm font-sans text-[10px] font-bold tracking-[0.3em] uppercase transition-all hover:bg-[var(--accent-luxury)] hover:text-white"
                    >
                      <span>Demander une immersion</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-2 transition-transform">
                        <path d="M5 12h14m-7-7 7 7-7 7"/>
                      </svg>
                    </button>
                  </MagneticWrapper>
                </motion.div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Editorial Final Call */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-12 md:mt-32 w-[95%] mx-auto relative flex items-center justify-center py-16 md:py-24 overflow-hidden max-w-7xl"
      >
        <div className="absolute inset-0 bg-[var(--surface-card)] border border-[var(--border)] rounded-[2rem] md:rounded-[4rem]" />
        
        <div className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center px-4">
          <div className="mb-8 md:mb-12">
            <Star className="w-8 h-8 md:w-12 md:h-12 text-[var(--accent-luxury)] fill-[var(--accent-luxury)] opacity-60" />
          </div>
          
          <h2 className="text-3xl md:text-7xl font-display font-light text-[var(--text)] mb-8 md:mb-12 leading-[1.1] tracking-tight">
            L&apos;Exceptionnel n&apos;appartient <br/>qu&apos;à ceux qui le <span className="italic opacity-70">convoitent.</span>
          </h2>
          
          <p className="text-base md:text-lg text-[var(--text-muted)] font-sans font-light mb-12 md:mb-16 max-w-xl leading-relaxed tracking-wide">
            Accédez à notre portefeuille confidentiel de biens &quot;off-market&quot; et bénéficiez d&apos;un accompagnement sur mesure pour vos acquisitions les plus ambitieuses.
          </p>

          <button 
            onClick={() => router.push('/contact')}
            className="group relative flex items-center gap-10 text-[var(--text)] border-b border-[var(--border)] pb-6 transition-all hover:border-[var(--accent-luxury)] hover:px-6 duration-500"
          >
            <span className="font-sans text-[10px] font-bold tracking-[0.4em] uppercase">Rejoindre le Cercle Privé</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:translate-x-4 transition-transform duration-500 text-[var(--accent-luxury)]">
              <path d="M5 12h14m-7-7 7 7-7 7"/>
            </svg>
          </button>
        </div>
      </motion.div>
    </section>
  );
};

