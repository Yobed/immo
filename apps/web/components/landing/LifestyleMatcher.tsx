"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, MapPin, TreePine, Moon, Briefcase, Car, Building, GlassWater, Plane, Waves, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

const lifestyleTags = [
  { id: "calm", label: "Quartier Calme", icon: Moon, desc: "Tranquillité absolue et jardins" },
  { id: "nature", label: "Proche Nature", icon: TreePine, desc: "Espaces verts et parcs" },
  { id: "nightlife", label: "Vie Nocturne", icon: GlassWater, desc: "Restos, bars, ambiances" },
  { id: "business", label: "Affaires", icon: Briefcase, desc: "Proche bureaux & Plateau" },
  { id: "sea", label: "Vue Mer", icon: Waves, desc: "Bord de mer & lagune" },
  { id: "transport", label: "Accès Rapide", icon: Car, desc: "Proche grands axes" },
];

const matchResults = {
  calm: {
    title: "Villa Sereine - Riviera Palmeraie",
    price: "150,000,000 FCFA",
    desc: "Un havre de paix loin du tumulte urbain, entouré de verdure luxuriante.",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop",
    match: "98%",
  },
  nature: {
    title: "Résidence Botanique - Bingerville",
    price: "85,000,000 FCFA",
    desc: "L'équilibre parfait entre architecture moderne et sentiers boisés.",
    img: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=2045&auto=format&fit=crop",
    match: "95%",
  },
  nightlife: {
    title: "Loft Sky-Bar Zone 4",
    price: "200,000,000 FCFA",
    desc: "Vivez au rythme de la nuit abidjanaise. Penthouse avec vue panoramique.",
    img: "https://res.cloudinary.com/dkkdxzjcm/image/upload/v1775737534/biens/n7jhn2xepe7js0hobswh.png",
    match: "99%",
  },
  business: {
    title: "Executive Suites - Le Plateau",
    price: "180,000,000 FCFA",
    desc: "Dominez le centre des affaires. Un espace conçu pour la productivité.",
    img: "https://res.cloudinary.com/dkkdxzjcm/image/upload/v1775840707/biens/utmtpcumk8xxp7klizm3.jpg",
    match: "94%",
  },
  sea: {
    title: "Palm Bay Triplex - Assinie",
    price: "350,000,000 FCFA",
    desc: "Le luxe du sable blanc et de l'horizon infini à votre porte.",
    img: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000&auto=format&fit=crop",
    match: "97%",
  },
  transport: {
    title: "Urban Connect - Cocody",
    price: "125,000,000 FCFA",
    desc: "À 5 minutes du 3ème pont. Gagnez du temps, vivez plus.",
    img: "https://res.cloudinary.com/dkkdxzjcm/image/upload/v1775839851/biens/h6tedsbbdfxi3nnu7hdu.jpg",
    match: "92%",
  },
};

export const LifestyleMatcher = () => {
  const [activeTag, setActiveTag] = useState("calm");

  return (
    <section className="py-40 bg-white relative overflow-hidden">
      {/* Dynamic Background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-7xl relative">
        <div className="flex flex-col lg:flex-row gap-24 items-center">
          
          {/* Left: Text & Tags */}
          <div className="lg:w-[45%]">
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-8">
                <span className="w-12 h-px bg-primary/30" />
                <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px]">
                  Lifestyle Matcher ✨
                </span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black text-gray-950 tracking-tighter leading-[0.85] mb-10">
                L&apos;Harmonie <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">Retrouvée.</span>
              </h2>
              <p className="text-gray-400 text-xl font-medium max-w-lg leading-relaxed mb-10 border-l-4 border-primary/10 pl-8">
                Parce que choisir une adresse, c&apos;est d&apos;abord choisir une atmosphère. 
                Laissez notre algorithme curateur guider votre intuition.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {lifestyleTags.map((tag, i) => {
                const Icon = tag.icon;
                const isActive = activeTag === tag.id;
                return (
                  <motion.button
                    key={tag.id}
                    onClick={() => setActiveTag(tag.id)}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className={`
                      group p-8 rounded-[2.5rem] text-left transition-all duration-700 relative overflow-hidden border-2
                      ${isActive 
                        ? "bg-gray-950 text-white border-gray-950 shadow-2xl scale-[1.02]" 
                        : "bg-white text-gray-900 border-gray-50 hover:border-primary/20 hover:shadow-2xl hover:scale-[1.05]"
                      }
                    `}
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <div className="relative z-10">
                      <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-700 group-hover:rotate-[10deg] group-hover:scale-110
                        ${isActive ? "bg-primary text-white shadow-lg shadow-primary/40" : "bg-gray-50 text-gray-950 shadow-sm border border-gray-100"}
                      `}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="font-display font-black text-xl mb-2 tracking-tight group-hover:text-primary transition-colors">
                        {tag.label}
                      </h3>
                      <p className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? "text-white/40" : "text-gray-400"}`}>
                        {tag.desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right: Immersive Result View */}
          <div className="lg:w-[55%] w-full">
            <div className="relative aspect-[4/5] md:aspect-[4/5] w-full max-w-2xl mx-auto group/image">
              {/* Floating Accents */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTag}
                  initial={{ opacity: 0, x: 200, rotate: 5, scale: 0.8, filter: "blur(20px)" }}
                  whileInView={{ opacity: 1, x: 0, rotate: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -200, rotate: -5, scale: 0.9, filter: "blur(10px)" }}
                  viewport={{ once: false, amount: 0.3 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 w-full h-full rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] z-10 border-[1px] border-gray-100"
                >
                  <Image
                    src={matchResults[activeTag as keyof typeof matchResults].img}
                    alt={matchResults[activeTag as keyof typeof matchResults].title}
                    fill
                    className="object-cover transition-transform duration-[2000ms] group-hover/image:scale-110"
                    priority
                  />
                  
                  {/* Subtle Grain Overlay */}
                  <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                  
                  {/* Premium Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
                  
                  {/* Glass Content Overlay */}
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="absolute inset-x-8 bottom-8 p-10 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] text-white overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="bg-primary/90 backdrop-blur-md px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-primary/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Match {matchResults[activeTag as keyof typeof matchResults].match}
                        </div>
                        <p className="text-2xl font-display font-black tracking-tight text-white drop-shadow-lg">
                          {matchResults[activeTag as keyof typeof matchResults].price}
                        </p>
                      </div>
                      
                      <h3 className="text-4xl md:text-5xl font-display font-black mb-4 leading-[0.9] tracking-tighter">
                        {matchResults[activeTag as keyof typeof matchResults].title}
                      </h3>
                      
                      <p className="text-white/60 text-base font-medium leading-relaxed mb-10 line-clamp-2 max-w-md">
                        {matchResults[activeTag as keyof typeof matchResults].desc}
                      </p>
                      
                      <button className="w-full bg-white text-gray-950 py-5 rounded-2xl font-black text-xs tracking-[0.3em] uppercase hover:bg-primary hover:text-white transition-all duration-700 shadow-2xl flex items-center justify-center gap-4 group/btn">
                        Découvrir ce style
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform duration-500" />
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
