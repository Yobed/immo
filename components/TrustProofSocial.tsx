'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, CheckCircle2, Star, Quote, ArrowRight, 
  Building2, Scale, Clock, Award, Users, FileCheck 
} from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

export default function TrustProofSocial() {
  const whatsappAdvisorUrl = getWhatsAppLink(
    '2250788421920',
    'Bonjour Cabinet Immobilier Abidjan, je souhaite parler à un conseiller au sujet de la sécurisation d\'un projet immobilier.'
  );

  const testimonials = [
    {
      name: 'Dr. Patrick Kouassi',
      role: 'Chirurgien • Acquéreur Diaspora (Paris)',
      location: 'Cocody Riviera 4',
      badge: 'Acquisition Sécurisée',
      result: 'Réquisition cadastrale sous 72h',
      content:
        'Le pré-audit a décelé une indivision successorale non liquidée sur un premier lot convoié. Le cabinet m’a réorienté vers une villa avec réquisition irréprochable au Livre Foncier. Acompte consigné sous séquestre notarié, signature sereine depuis Paris.',
    },
    {
      name: 'Aminata & Serge Diallo',
      role: 'Cadres Dirigeants Groupe Bancaire',
      location: 'Marcory Zone 4',
      badge: 'Résidence Principale',
      result: 'Dossier complet remis avant visite',
      content:
        'Le cabinet nous a transmis l’état hypothécaire, les procès-verbaux de bornage et le règlement de copropriété avant même la première visite. Zéro zone d’ombre financière, acte authentique dressé dans les règles de l’art.',
    },
    {
      name: 'Olivier Moreau',
      role: 'Investisseur Patrimonial',
      location: 'Assinie PK 9',
      badge: 'Patrimoine Balnéaire',
      result: 'Conformité Servitude Littorale & Ponton',
      content:
        'Sur le littoral, les contraintes domaniales sont strictes. Le cabinet a vérifié la régularité de l’amodiation maritime et le recul réglementaire avant tout déplacement. Rigueur technique exemplaire.',
    },
  ];

  const metrics = [
    {
      value: '48 Dossiers',
      label: 'Instruits en 2025-2026',
      sub: 'Audits documentaires préalables',
      highlight: false,
    },
    {
      value: '87,5%',
      label: 'Taux de rejet documentaire',
      sub: '42 dossiers écartés pour incertitude foncière',
      highlight: true,
    },
    {
      value: '48 Heures',
      label: 'Délai moyen de pré-audit',
      sub: 'Note de synthèse cadastrale délivrée sous 2 jours',
      highlight: false,
    },
    {
      value: 'Séquestre Notarié',
      label: 'Consignation systématique',
      sub: 'Clause de restitution sous 15 jours en cas de vice',
      highlight: false,
    },
  ];

  return (
    <section className="bg-white border-b border-[#e8e4dc] py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-16">
        
        {/* En-tête de section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f0f5f2] border border-[#d2e3d8] text-xs font-semibold text-[#1d382b]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1d382b]" />
              <span>Transparence & Retours d&apos;Expérience Vérifiés</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#161412] tracking-tight">
              La Confiance se Prouve par les Actes.
            </h2>
            <p className="text-sm text-[#68625c] font-light leading-relaxed">
              Découvrez les données objectives de notre exercice 2025-2026 et les témoignages de ceux qui ont sécurisé leur patrimoine à Abidjan sous notre égide.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={whatsappAdvisorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold flex items-center gap-2 transition-all duration-300 shadow-sm shrink-0"
            >
              <span>Parler à un conseiller</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 1. GRILLE DE CHIFFRES ET STATISTIQUES AUDITÉES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                m.highlight
                  ? 'bg-[#161412] text-white border-[#161412] shadow-warm-md'
                  : 'bg-[#fbfaf7] text-[#161412] border-[#e8e4dc] hover:border-[#947346]'
              }`}
            >
              <div className={`text-2xl sm:text-4xl font-display font-semibold tracking-tight ${
                m.highlight ? 'text-[#947346]' : 'text-[#161412]'
              }`}>
                {m.value}
              </div>
              <div className={`font-semibold text-xs sm:text-sm mt-2 ${
                m.highlight ? 'text-white' : 'text-[#161412]'
              }`}>
                {m.label}
              </div>
              <div className={`text-[11px] sm:text-xs mt-1 font-light leading-snug ${
                m.highlight ? 'text-[#a39c92]' : 'text-[#68625c]'
              }`}>
                {m.sub}
              </div>
            </div>
          ))}
        </div>

        {/* 2. TÉMOIGNAGES CLIENTS CONTEXTUALISÉS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold">
              Témoignages Réels d&apos;Acquéreurs & Investisseurs
            </span>
            <span className="text-xs text-[#7a736a] hidden sm:inline">
              Transactions réalisées sous séquestre notarié
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-[#fbfaf7] rounded-3xl p-7 border border-[#e8e4dc] hover:border-[#947346] transition-all duration-300 shadow-warm-sm flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f5f2] text-[10px] font-semibold text-[#1d382b] border border-[#d2e3d8]">
                      <CheckCircle2 className="w-3 h-3 text-[#1d382b]" />
                      <span>{t.badge}</span>
                    </span>
                    <div className="flex gap-0.5 text-[#947346]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#947346]" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#4a453e] font-light leading-relaxed italic">
                    &ldquo;{t.content}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-[#e8e4dc] flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-[#161412]">{t.name}</h3>
                    <p className="text-[11px] text-[#7a736a] font-light">{t.role}</p>
                    <span className="text-[10px] text-[#947346] font-mono">{t.location}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#1d382b] font-medium block">Résultat :</span>
                    <span className="text-[10px] text-[#68625c] font-light">{t.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. SCEAUX DE RIGUEUR & ÉTUDES MINISTÉRIELLES */}
        <div className="bg-[#fbfaf7] rounded-3xl p-8 sm:p-10 border border-[#e8e4dc] space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#947346] font-semibold block">
              Écosystème Légal & Cadastral
            </span>
            <h3 className="text-lg font-display font-medium text-[#161412]">
              Partenaires Institutionnels & Organismes de Contrôle
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] space-y-1">
              <div className="text-xs font-semibold text-[#161412]">Agrément MCLU</div>
              <div className="text-[11px] font-mono text-[#947346]">N° 048/MCLU/DGU</div>
              <div className="text-[10px] text-[#7a736a]">Ministère de la Construction</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] space-y-1">
              <div className="text-xs font-semibold text-[#161412]">Études Notariales</div>
              <div className="text-[11px] font-medium text-[#1d382b]">Plateau & Cocody</div>
              <div className="text-[10px] text-[#7a736a]">Pratique usuelle • Libre choix notarial</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] space-y-1">
              <div className="text-xs font-semibold text-[#161412]">Cabinet OGE-CI</div>
              <div className="text-[11px] font-mono text-[#947346]">N° 112 au Tableau</div>
              <div className="text-[10px] text-[#7a736a]">Géomètres-Experts Assermentés</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] space-y-1">
              <div className="text-xs font-semibold text-[#161412]">Conservation Foncière</div>
              <div className="text-[11px] font-medium text-[#1d382b]">Guichet Unique</div>
              <div className="text-[10px] text-[#7a736a]">Livre Foncier d&apos;Abidjan</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
