"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Moon, TreePine, GlassWater, Briefcase, Car, Waves, ArrowRight } from "lucide-react";
import Image from "next/image";

const lifestyleTags = [
  { id: "calm", label: "Atmosphère Calme", icon: Moon, desc: "Sérénité et jardins secrets" },
  { id: "nature", label: "Horizon Organique", icon: TreePine, desc: "Espaces verts préservés" },
  { id: "nightlife", label: "Lumières Urbaines", icon: GlassWater, desc: "L'effervescence de la ville" },
  { id: "business", label: "Cœur des Affaires", icon: Briefcase, desc: "Le Plateau & centre-ville" },
  { id: "sea", label: "Reflets Marins", icon: Waves, desc: "Bord de mer & lagune" },
  { id: "transport", label: "Mobilité Fluide", icon: Car, desc: "Connectivité stratégique" },
];

const matchResults = {
  calm: {
    title: "La Villa Sereine",
    location: "Riviéra Palmeraie",
    price: "150,000,000 FCFA",
    desc: "Une architecture qui respire. Un havre confidentiel où le temps semble s'être arrêté pour laisser place à la quiétude.",
    img: "/images/lifestyle/lifestyle_calm_villa_1776370822601.png",
    match: "98%",
  },
  nature: {
    title: "L'Écrin Botanique",
    location: "Bingerville",
    price: "85,000,000 FCFA",
    desc: "Vivre en symbiose avec les éléments. Une résidence conçue comme un prolongement de la nature environnante.",
    img: "/images/lifestyle/lifestyle_nature_residence_1776370841683.png",
    match: "95%",
  },
  nightlife: {
    title: "Le Loft Nocturne",
    location: "Zone 4",
    price: "200,000,000 FCFA",
    desc: "Un panorama vibrant sur les lumières d'Abidjan. Pour ceux qui font de la ville leur terrain d'expression.",
    img: "https://images.unsplash.com/photo-1549497538-30122aaade39?q=80&w=2000&auto=format&fit=crop",
    match: "99%",
  },
  business: {
    title: "L'Empire Suites",
    location: "Le Plateau",
    price: "180,000,000 FCFA",
    desc: "Au centre de l'influence. Un espace sculpté pour les esprits visionnaires et les ambitions sans limites.",
    img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2000&auto=format&fit=crop",
    match: "94%",
  },
  sea: {
    title: "L'Infini Assinie",
    location: "Assinie Mafia",
    price: "350,000,000 FCFA",
    desc: "Le luxe du sable blanc. Une expérience sensorielle où chaque réveil est une invitation au voyage.",
    img: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000&auto=format&fit=crop",
    match: "97%",
  },
  transport: {
    title: "L'Urban Connect",
    location: "Cocody Ambassades",
    price: "125,000,000 FCFA",
    desc: "Le privilège de la proximité. Une adresse qui valorise votre temps dans un cadre d'exception.",
    img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop",
    match: "92%",
  },
};

export const LifestyleMatcher = () => {
  const [activeTag, setActiveTag] = useState("calm");
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  // Scroll-driven parallax: gated by prefers-reduced-motion AND scoped to sectionRef
  // (framer-motion only subscribes when target intersects viewport)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageTranslateX = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    prefersReduced ? ["0%", "0%", "0%"] : ["20%", "0%", "-20%"],
  );
  const textTranslateY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    prefersReduced ? ["0px", "0px", "0px"] : ["30px", "0px", "-30px"],
  );

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-[var(--background)] relative overflow-hidden">
      {/* Editorial Grid Lines */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-[var(--border)] hidden lg:block" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-[var(--border)] hidden lg:block" />
      
      <div className="container mx-auto px-6 max-w-[1400px] relative">
        <div className="flex flex-col lg:flex-row gap-20 xl:gap-32 items-start">
          
          {/* Left: Text & Selection */}
          <div className="lg:w-[40%] xl:w-[35%] sticky top-24">
            <motion.div
              style={{ y: textTranslateY }}
              className="mb-10 md:mb-16"
            >
              <div className="flex items-center gap-6 mb-10">
                <span className="w-12 h-px bg-[var(--border)]" />
                <span className="text-[var(--accent-luxury)] font-bold tracking-[0.6em] uppercase text-[10px]">
                  Lifestyle Matcher
                </span>
              </div>
              <h2 className="text-4xl md:text-6xl xl:text-7xl font-display font-light text-[var(--text)] tracking-tighter leading-[0.95] mb-10">
                Définissez votre <br />
                <span className="font-serif italic pl-4 lg:pl-10 text-[var(--accent-luxury)]">Signature.</span>
              </h2>
              <p className="text-[var(--text-muted)] text-lg font-light max-w-sm leading-relaxed mb-10 pl-4 border-l-2 border-[var(--border)] italic">
                Une sélection guidée par votre intuition. 
                Trouvez le cadre qui s&apos;aligne avec votre vision du monde.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4">
              {lifestyleTags.map((tag, i) => {
                const Icon = tag.icon;
                const isActive = activeTag === tag.id;
                return (
                  <motion.button
                    key={tag.id}
                    onClick={() => setActiveTag(tag.id)}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.8 }}
                    className={`
                      group flex items-center gap-8 p-5 transition-all duration-700 relative text-left rounded-sm
                      ${isActive
                        ? "bg-[var(--primary-light)] text-[var(--text)] shadow-xl border border-[var(--border-hover)]"
                        : "bg-transparent text-[var(--text-muted)] border-b border-[var(--border)] hover:bg-[var(--primary-light)]"
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? "scale-110 text-[var(--accent-luxury)]" : "opacity-60"}`} />
                    <div className="flex-1">
                      <h3 className="font-sans font-bold text-[10px] uppercase tracking-[0.3em] mb-1 text-[var(--text)]">
                        {tag.label}
                      </h3>
                      <p className={`text-[10px] font-light text-[var(--text-muted)]`}>
                        {tag.desc}
                      </p>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-all duration-500 text-[var(--accent-luxury)] ${isActive ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`} />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right: Immersive Visual Dossier */}
          <div className="lg:w-[60%] xl:w-[65%] w-full h-full pt-10">
            <motion.div 
              style={{ x: imageTranslateX }}
              className="relative aspect-[4/5] lg:aspect-[3/2.2] w-full group/image"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTag}
                  initial={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full h-full rounded-sm overflow-hidden z-10 shadow-[0_60px_120px_rgba(0,0,0,0.4)] border border-white/10"
                >
                  <Image
                    src={matchResults[activeTag as keyof typeof matchResults].img}
                    alt={matchResults[activeTag as keyof typeof matchResults].title}
                    fill
                    className="object-cover transition-transform duration-[8000ms] ease-out group-hover/image:scale-110"
                    priority
                  />
                  
                  {/* Cinematic Overlays */}
                  <div className="absolute inset-0 bg-[#000]/30 group-hover/image:bg-[#000]/10 transition-colors duration-1000" />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#000] via-[#000]/40 to-transparent" />
                  
                  {/* Result Details */}
                  <div className="absolute inset-0 p-12 lg:p-20 flex flex-col justify-end text-white">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 1.2 }}
                      className="max-w-xl"
                    >
                      <div className="flex items-center gap-6 mb-8 text-[10px] font-bold uppercase tracking-[0.5em]">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                          Compatibilité {matchResults[activeTag as keyof typeof matchResults].match}
                        </span>
                        <span className="text-white/30 w-px h-3 bg-white/30" />
                        <span className="text-white/90">{matchResults[activeTag as keyof typeof matchResults].location}</span>
                      </div>
                      
                      <h3 className="text-5xl lg:text-7xl font-display font-light mb-8 tracking-tighter leading-[0.9]">
                        {matchResults[activeTag as keyof typeof matchResults].title}
                      </h3>
                      
                      <p className="text-white/80 text-xl font-light leading-relaxed mb-12 max-w-md line-clamp-3 italic font-serif">
                        &quot;{matchResults[activeTag as keyof typeof matchResults].desc}&quot;
                      </p>
                      
                      <div className="flex items-center justify-between border-t border-white/10 pt-10">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-[0.3em] text-white/60 mb-1">Prix Estimé</span>
                          <p className="text-3xl font-display font-light tracking-tight text-white">
                            {matchResults[activeTag as keyof typeof matchResults].price}
                          </p>
                        </div>
                        <button 
                          onClick={() => router.push('/biens')}
                          className="flex items-center gap-6 text-[10px] font-bold tracking-[0.5em] uppercase border-b border-white/20 pb-2 text-white hover:border-[var(--accent-luxury)] hover:text-[var(--accent-luxury)] transition-all group/btn"
                        >
                          Consulter l&apos;exclusivité
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-3 transition-transform duration-700" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
            
            {/* Meta decoration */}
            <div className="mt-10 flex items-center justify-end gap-12 opacity-70">
              <span className="w-12 h-px bg-[var(--border)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-[var(--text-muted)]">Volume 01 · Édition Limitée</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

