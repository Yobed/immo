"use client";

import { motion } from "framer-motion";
import Image from "next/image";
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
  return (
    <section className="relative bg-gray-950 -mt-10 rounded-t-[3rem] z-30 shadow-[0_-30px_50px_rgba(0,0,0,0.5)] overflow-hidden pb-32">
      {/* Intro section */}
      <div className="min-h-[80vh] flex flex-col items-center justify-center relative px-4">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <motion.div 
          className="absolute w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.span 
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          className="text-primary font-bold tracking-[0.2em] uppercase text-sm mb-4 relative z-10"
        >
          Collection Héritage
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-display font-bold text-white text-center relative z-10 leading-tight"
        >
          L'Excellence<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-300">Immobilière</span>
        </motion.h2>

        <motion.div 
          animate={{ y: [0, 15, 0] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="mt-16 text-white/50 flex flex-col items-center gap-3 font-sans tracking-wide relative z-10"
        >
          <span>Faites défiler vers le bas</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7 7 7 7-7"/></svg>
        </motion.div>
      </div>

      {/* Properties Sections */}
      <div className="flex flex-col gap-32 px-4 md:px-12 lg:px-24">
        {displayProperties.map((property, idx) => {
          // L'alternance des côtés : pair = image à gauche, impair = image à droite
          const isEven = idx % 2 === 0;

          return (
            <div key={property.id} className="relative min-h-[60vh] flex items-center overflow-hidden">
              
              <div className={`w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center ${isEven ? "" : "lg:mt-0"}`}>
                
                {/* Image side - Vient d'un côté */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? -250 : 250 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-150px" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative w-full h-[60vh] md:h-[70vh] rounded-[2rem] overflow-hidden shadow-2xl ${isEven ? 'order-1' : 'order-1 lg:order-2'}`}
                >
                  <Image
                    src={property.image}
                    alt={property.title}
                    fill
                    priority={idx === 0}
                    className="object-cover hover:scale-105 transition-transform duration-1000"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
                </motion.div>

                {/* Text side - Vient du côté opposé */}
                <motion.div 
                  initial={{ opacity: 0, x: isEven ? 250 : -250 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-150px" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                  className={`relative z-10 flex flex-col justify-center ${isEven ? 'order-2' : 'order-2 lg:order-1'}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-12 h-[1px] bg-primary"></span>
                    <span className="text-primary uppercase tracking-widest text-sm font-semibold">
                      {property.location}
                    </span>
                  </div>
                  <h3 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
                    {property.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-3 mb-10">
                    {property.tags.map((tag, i) => (
                      <span key={i} className="px-5 py-2 border border-white/10 rounded-full text-white/70 text-sm backdrop-blur-xl bg-white/5 font-sans whitespace-nowrap">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-3xl md:text-4xl font-display font-bold text-white mb-12 flex flex-col">
                    <span className="text-sm text-white/40 font-sans tracking-wider mb-2 uppercase">Prix de prestige</span>
                    {property.price}
                  </div>

                  <MagneticWrapper>
                    <button className="w-fit group relative overflow-hidden flex items-center gap-4 bg-white text-gray-950 px-8 py-5 rounded-full font-bold transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(249,115,22,0.4)]">
                      <span className="relative z-10">Organiser une visite privée</span>
                      <span className="relative z-10 group-hover:translate-x-2 transition-transform">→</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </MagneticWrapper>
                </motion.div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Outro */}
      <motion.div 
        initial={{ opacity: 0, y: 150 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-100px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="mt-32 w-[90%] mx-auto relative flex items-center justify-center p-8 overflow-hidden rounded-[3rem] max-w-7xl min-h-[60vh] border border-white/5 shadow-2xl"
      >
        <div className="absolute inset-0 w-full h-full opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=2000&q=80"
            alt="Luxury Lifestyle"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gray-950 mix-blend-multiply" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border border-primary/30 flex items-center justify-center mb-8 backdrop-blur-xl bg-white/5 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
            <span className="text-4xl text-primary">⚜️</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-8 leading-tight">
            L'Exceptionnel <br/> n'attend que <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Vous.</span>
          </h2>
          
          <p className="text-xl text-white/60 font-sans mb-12 max-w-2xl">
            Accédez à notre cercle privé et découvrez des biens off-market réservés à une clientèle exigeante.
          </p>

          <MagneticWrapper>
            <button className="group relative w-auto flex justify-center items-center gap-4 bg-primary text-white border border-primary/50 px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-[0_0_60px_rgba(249,115,22,0.5)]">
              Rejoindre le Cercle Privilège
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-2 transition-transform"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </button>
          </MagneticWrapper>
        </div>
      </motion.div>

    </section>
  );
};

