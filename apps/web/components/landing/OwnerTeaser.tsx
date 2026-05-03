'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Layout, TrendingUp, Calculator, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function OwnerTeaser() {
  return (
    <section className="py-32 bg-[var(--surface-card)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--accent-luxury)]/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <span className="text-[var(--accent-luxury)] font-sans tracking-[0.5em] uppercase text-[10px] font-bold mb-8 block">Espace Propriétaires</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-[var(--text)] mb-8 leading-[1.1] tracking-tight">
              Votre patrimoine mérite une <span className="italic font-serif opacity-60">Gestion d'Excellence.</span>
            </h2>
            <p className="text-xl text-[var(--text-muted)] font-light leading-relaxed mb-12 max-w-xl">
              BOGBE'S GROUPE transforme votre bien en actif hautement rentable. Qu'il s'agisse de gestion meublée ou de vente confidentielle, nous maximisons chaque mètre carré.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-luxury)]">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--text)]">Simulateur Yield</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Calculez votre rendement potentiel en location meublée VIP.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-luxury)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--text)]">Gestion OHADA</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Sécurité juridique totale et filtrage rigoureux des locataires.
                </p>
              </div>
            </div>

            <Link href="/proprietaires" className="inline-flex items-center gap-4 px-10 py-5 bg-[var(--text)] text-[var(--background)] rounded-sm font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-[var(--accent-luxury)] hover:text-white transition-all group">
              Découvrir nos services
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="relative">
            <div className="relative z-10 aspect-square rounded-[3rem] overflow-hidden border border-[var(--border)] group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1500')] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-[2s]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent opacity-60" />
              
              <div className="absolute bottom-12 left-12 right-12 p-8 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--accent-luxury)] mb-4">Rendement Moyen constaté</p>
                <div className="flex items-end gap-3 text-[var(--text)]">
                   <p className="text-5xl font-display font-bold">+45%</p>
                   <p className="text-xs mb-2 opacity-60">vs location nue</p>
                </div>
              </div>
            </div>
            
            {/* Floating decorative elements */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[var(--accent-luxury)]/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[var(--accent-luxury)]/20 rounded-full blur-2xl animate-bounce duration-[5s]" />
          </div>
        </div>
      </div>
    </section>
  );
}
