'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowRight, Eye, Maximize2, Compass, FileText, CheckCircle2 } from 'lucide-react';
import { formatFCFA } from '@/lib/utils';

interface ArchitecturalView {
  id: 'facade' | 'plan' | 'interior';
  label: string;
  subtitle: string;
  image: string;
  isBlueprint?: boolean;
  caption: string;
  highlights: string[];
}

const VIEWS: ArchitecturalView[] = [
  {
    id: 'facade',
    label: '1. Architecture & Extérieurs',
    subtitle: 'Façade Bioclimatique & Bassin Miroir',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=88',
    caption: 'Volumétrie contemporaine en porte-à-faux créant une protection solaire naturelle pour les réceptions extérieures.',
    highlights: ['Piscine miroir 14m à débordement', 'Orientation Sud-Sud-Ouest face à la brise lagunaire', 'Jardin tropical paysager clos'],
  },
  {
    id: 'plan',
    label: '2. Plan & Distribution',
    subtitle: 'Distribution des 650 m² sur 2 Niveaux',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=88',
    caption: 'Organisation fluide séparant l\'espace de réception du rez-de-chaussée des 5 suites privatives de l\'étage.',
    highlights: ['Double hauteur sous plafond 5,20m', 'Suite parentale de 85 m² avec terrasse privée', 'Accès de service indépendant et loge gardien'],
  },
  {
    id: 'interior',
    label: '3. Salon & Finitions Nobles',
    subtitle: 'Matériaux Importés & Confort Tropical',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=88',
    caption: 'Marbre italien poli, menuiseries aluminium minimalistes à rupture de pont thermique et climatisation gainée inverter.',
    highlights: ['Sol marbre travertin grand format', 'Baies vitrées coulissantes 4,20m sans montants centraux', 'Domotique éclairage et sécurité intégrée'],
  },
];

export default function ArchitecturalMorph() {
  const [activeTab, setActiveTab] = useState<'facade' | 'plan' | 'interior'>('facade');
  const currentView = VIEWS.find((v) => v.id === activeTab) || VIEWS[0];

  return (
    <section className="relative w-full py-24 bg-[#f5f2eb] border-y border-[#e8e4dc]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-12">
        
        {/* En-tête sobre de la section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#e8e4dc] pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e8e4dc] text-xs font-semibold text-[#1d382b]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1d382b]" />
              <span>Étude de Cas • Mandat Exclusif</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#161412] tracking-tight">
              Anatomie d&apos;une Demeure d&apos;Exception.
            </h2>
            <p className="text-sm text-[#68625c] font-light leading-relaxed">
              Passez de la façade extérieure à la distribution des plans et aux finitions intérieures. Une transparence totale sur chaque détail avant toute visite.
            </p>
          </div>

          {/* Morph Selector Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-white rounded-2xl border border-[#e8e4dc] shadow-warm-sm shrink-0">
            {VIEWS.map((view) => {
              const isActive = view.id === activeTab;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveTab(view.id)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-medium transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-[#68625c] hover:text-[#161412]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMorphPerspective"
                      className="absolute inset-0 bg-[#161412] rounded-xl shadow-sm"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Central Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Visual Container (8 cols) */}
          <div className="lg:col-span-8 relative aspect-[16/10] rounded-3xl overflow-hidden bg-[#161412] border border-[#e8e4dc] shadow-warm-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={currentView.image}
                  alt={currentView.subtitle}
                  fill
                  priority
                  quality={90}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
              </motion.div>
            </AnimatePresence>

            {/* Badges de certification sur l'image */}
            <div className="absolute top-5 left-5 z-10 flex flex-wrap gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-semibold text-[#161412] shadow-sm">
                Cocody Riviera Golf 4
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#f0f5f2]/95 backdrop-blur-md text-xs font-semibold text-[#1d382b] border border-[#d2e3d8] shadow-sm flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1d382b]" />
                <span>ACD Ministériel Vérifié</span>
              </span>
            </div>

            {/* Légende basse */}
            <div className="absolute bottom-5 left-5 right-5 z-10 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 text-xs shadow-warm-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-[#161412] text-sm">
                  {currentView.subtitle}
                </div>
                <div className="text-[#68625c] font-light text-xs">
                  {currentView.caption}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-[#7a736a] block">Prix de présentation</span>
                <span className="text-base font-display font-semibold text-[#161412]">
                  {formatFCFA(450000000)}
                </span>
              </div>
            </div>
          </div>

          {/* Fiche Technique & Preuves (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-8 border border-[#e8e4dc] shadow-warm-sm space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold block">
                Fiche d&apos;Audit Notarié • Réf. VIL-RG-2026
              </span>
              <h3 className="text-2xl font-display font-medium text-[#161412] leading-tight">
                Villa Duplex d&apos;Architecte
              </h3>
              <p className="text-xs text-[#68625c] font-light leading-relaxed">
                Mandat exclusif • Dossier complet vérifié : titre ACD, bornage contradictoire OGE-CI et certificat de conformité.
              </p>
            </div>

            {/* Caractéristiques vérifiées */}
            <div className="space-y-3 py-4 border-y border-[#f0ede6] text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#68625c]">Superficie parcelle</span>
                <span className="font-semibold text-[#161412]">650 m² titrés</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#68625c]">Chambres & Suites</span>
                <span className="font-semibold text-[#161412]">5 suites indépendantes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#68625c]">Sécurisation énergétique</span>
                <span className="font-semibold text-[#161412]">Groupe 40 kVA + Cuve 3000L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#68625c]">Statut juridique</span>
                <span className="font-semibold text-[#1d382b] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1d382b]" />
                  ACD disponible pour mutation
                </span>
              </div>
            </div>

            {/* Points forts de la perspective active */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-[#7a736a] font-semibold block">
                Points clés observés
              </span>
              <ul className="space-y-1.5 text-xs text-[#4a453e]">
                {currentView.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#947346] mt-1.5 shrink-0" />
                    <span className="font-light">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Call to action clair et unique */}
            <div className="pt-2">
              <Link
                href="/biens/prop-001"
                className="w-full py-3.5 rounded-full bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
              >
                <span>Consulter le dossier &amp; plans (PDF)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
