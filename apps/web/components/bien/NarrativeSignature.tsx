'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Trophy, Gem, ShieldCheck, Heart } from 'lucide-react'
import { Badge } from '@/components/ui'

interface NarrativeSignatureProps {
  description: string
  bienType: string
  commune: string
  rarityScore?: number
}

export function NarrativeSignature({ description, bienType, commune, rarityScore = 98 }: NarrativeSignatureProps) {
  // Logic to "narrativize" the description if it's too short or generic
  const narrativeText = description.length < 100 
    ? `Cette résidence d'exception, située au cœur de ${commune}, incarne l'apogée du raffinement ivoirien. ${description}. Chaque espace a été pensé pour offrir une expérience sensorielle unique, mêlant architecture audacieuse et confort absolu.`
    : description

  return (
    <section className="relative py-32 overflow-hidden border-y border-white/5 bg-[#020617]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-luxury/10 blur-[160px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1800px] mx-auto px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
        {/* Left Side: The Score */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-4 sticky top-32"
        >
          <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/20 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
            <div className="absolute -top-10 -right-10 opacity-10 group-hover:opacity-30 transition-all duration-1000 rotate-12">
              <Trophy className="w-48 h-48 text-accent-luxury" />
            </div>
            
            <div className="relative z-10">
              <Badge variant="luxury" className="mb-10 px-6 py-2 text-[10px] tracking-[0.4em]">Signature Élite</Badge>
              
              <div className="flex flex-col mb-10">
                <div className="flex items-baseline gap-3">
                  <span className="text-8xl font-display font-bold text-accent-luxury leading-none">{rarityScore}</span>
                  <span className="text-3xl font-display text-white/20">/100</span>
                </div>
                <div className="h-1 w-24 bg-gradient-to-r from-accent-luxury to-transparent mt-4" />
                <p className="text-xs font-bold uppercase tracking-[0.5em] text-accent-luxury mt-6">Score de Rareté</p>
              </div>
              
              <h3 className="text-2xl font-display font-medium text-white mb-10 leading-snug">Propriété d&apos;Exception<br/>& Patrimoine</h3>
              
              <div className="grid grid-cols-1 gap-6">
                {[
                  { icon: Gem, label: "Design Signature", desc: "Architecture unique" },
                  { icon: ShieldCheck, label: "Sécurité Totale", desc: "Quartier diplomatique" },
                  { icon: Heart, label: "Coup de Cœur", desc: "Expertise Sapphire" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="p-2 bg-accent-luxury/20 rounded-lg">
                      <item.icon className="w-5 h-5 text-accent-luxury" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white">{item.label}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: The Story */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="lg:col-span-8 pt-10"
        >
          <div className="flex items-center gap-6 mb-16">
            <div className="w-16 h-[1px] bg-accent-luxury/30" />
            <div className="flex items-center gap-4">
              <Sparkles className="w-6 h-6 text-accent-luxury animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-[0.8em] text-accent-luxury/60">Midnight Signature</h2>
            </div>
          </div>
          
          <div className="space-y-12">
            <div className="relative">
              <span className="absolute -left-16 -top-10 text-[12rem] font-display text-accent-luxury/10 select-none pointer-events-none">&ldquo;</span>
              <p className="text-3xl md:text-5xl text-white font-display font-light leading-[1.3] relative z-10 italic">
                {narrativeText}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-10 pt-16 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-midnight bg-midnight-light overflow-hidden shadow-2xl relative">
                      <img 
                        src={`https://i.pravatar.cc/150?u=expert${i}`} 
                        alt="Expert" 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 max-w-[200px] leading-relaxed">
                  Validé par notre comité de prestige
                </p>
              </div>

              <div className="md:ml-auto flex items-center gap-4 px-6 py-4 rounded-2xl bg-accent-luxury/5 border border-accent-luxury/10">
                <ShieldCheck className="w-5 h-5 text-accent-luxury" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-luxury">Authenticité Garantie</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
