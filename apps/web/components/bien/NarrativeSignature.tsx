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
    <section className="relative py-20 overflow-hidden border-y border-white/5 bg-[#020617]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-luxury/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Left Side: The Score */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-4 sticky top-32"
        >
          <div className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-xl relative overflow-hidden group shadow-xl">
            <div className="absolute -top-8 -right-8 opacity-10 group-hover:opacity-20 transition-all duration-1000 rotate-12">
              <Trophy className="w-36 h-36 text-accent-luxury" />
            </div>
            
            <div className="relative z-10">
              <Badge variant="luxury" className="mb-6 px-4 py-1.5 text-[9px] tracking-[0.3em]">Signature Élite</Badge>
              
              <div className="flex flex-col mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-display font-bold text-accent-luxury leading-none">{rarityScore}</span>
                  <span className="text-xl font-display text-white/20">/100</span>
                </div>
                <div className="h-px w-16 bg-gradient-to-r from-accent-luxury to-transparent mt-3" />
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-accent-luxury mt-4">Score de Rareté</p>
              </div>
              
              <h3 className="text-lg font-display font-medium text-white mb-6 leading-snug">Propriété d&apos;Exception<br/>&amp; Patrimoine</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: Gem, label: "Design Signature", desc: "Architecture unique" },
                  { icon: ShieldCheck, label: "Sécurité Totale", desc: "Quartier diplomatique" },
                  { icon: Heart, label: "Coup de Cœur", desc: "Expertise Sapphire" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="p-1.5 bg-accent-luxury/20 rounded-lg">
                      <item.icon className="w-4 h-4 text-accent-luxury" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white">{item.label}</p>
                      <p className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">{item.desc}</p>
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
          transition={{ duration: 0.8 }}
          className="lg:col-span-8 pt-4"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-px bg-accent-luxury/30" />
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-accent-luxury animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-[0.6em] text-accent-luxury/60">Midnight Signature</h2>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="relative">
              <span className="absolute -left-8 -top-6 text-7xl font-display text-accent-luxury/10 select-none pointer-events-none">&ldquo;</span>
              <p className="text-xl md:text-2xl text-white/70 font-display font-light leading-[1.7] relative z-10">
                {narrativeText}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-6 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-midnight bg-midnight-light overflow-hidden shadow-lg relative">
                      <img 
                        src={`https://i.pravatar.cc/150?u=expert${i}`} 
                        alt="Expert" 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="h-6 w-px bg-white/10" />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 max-w-[160px] leading-relaxed">
                  Validé par notre comité de prestige
                </p>
              </div>

              <div className="md:ml-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-luxury/5 border border-accent-luxury/10">
                <ShieldCheck className="w-4 h-4 text-accent-luxury" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-accent-luxury">Authenticité Garantie</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
