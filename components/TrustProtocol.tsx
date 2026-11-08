'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileCheck, Compass, Lock, CheckCircle2, ArrowRight, Scale, Clock, AlertCircle } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

const AUDIT_STEPS = [
  {
    step: '01',
    title: 'Levée d\'État Foncier au Guichet Unique MCLU',
    description: 'Demande officielle de réquisition au Livre Foncier pour vérifier l\'authenticité de l\'ACD ou du Titre Foncier (TF) auprès de la Direction Générale du Logement et du Cadastre.',
    turnaround: 'Délai : 48 à 72h ouvrées',
    icon: FileCheck,
    tag: 'Contrôle Documentaire',
  },
  {
    step: '02',
    title: 'Bornage Contradictoire & Contrôle Géomètre',
    description: 'Vérification sur le terrain par un géomètre-expert agréé (OGE-CI) des limites parcellaires et des coordonnées GPS pour écarter tout risque de chevauchement ou d\'empiètement.',
    turnaround: 'Relevé GPS contradictoire',
    icon: Compass,
    tag: 'Conformité Cadastrale',
  },
  {
    step: '03',
    title: 'Contrôle des Charges & Antécédents Disponibles',
    description: 'Revue juridique des servitudes, hypothèques conventionnelles ou judiciaires inscrites et antécédents successoraux avec le concours des notaires conseils du cabinet.',
    turnaround: 'Examen de la chaîne des titres',
    icon: ShieldCheck,
    tag: 'Sécurité Juridique',
  },
  {
    step: '04',
    title: 'Consignation des Fonds sous Séquestre Notarié',
    description: 'Le prix de vente ne transite jamais par l\'agence. Les fonds sont obligatoirement consignés sur le compte séquestre de l\'étude notariale désignée jusqu\'à la signature de l\'acte authentique.',
    turnaround: 'Compte séquestre officiel',
    icon: Lock,
    tag: 'Sécurisation Financière',
  },
];

export default function TrustProtocol() {
  const whatsappAuditUrl = getWhatsAppLink(
    '2250788421920',
    'Bonjour Cabinet Immobilier Abidjan, je souhaite solliciter un audit documentaire pour un bien immobilier ou foncier (titre ACD/TF).'
  );

  return (
    <section className="relative w-full py-24 bg-white border-b border-[#e8e4dc]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-16">
        
        {/* En-tête */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f0f5f2] border border-[#d2e3d8] text-xs font-semibold text-[#1d382b]">
            <ShieldCheck className="w-4 h-4 text-[#1d382b]" />
            <span>Méthode & Rigueur Foncinière</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-[#161412] tracking-tight leading-tight">
            Le Protocole Foncier en 4 Phases.
          </h2>
          <p className="text-sm text-[#68625c] font-light leading-relaxed">
            À Abidjan, la sécurité d’une transaction dépend de la solidité de son titre. Nous effectuons un pré-contrôle rigoureux avant publication et orientons chaque vente vers une étude notariale assermentée.
          </p>
        </div>

        {/* Grille des 4 étapes réalistes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {AUDIT_STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#fbfaf7] rounded-3xl p-7 border border-[#e8e4dc] flex flex-col justify-between space-y-6 hover:border-[#947346] transition-colors duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#947346] tracking-wider">
                      PHASE {item.step}
                    </span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white border border-[#e8e4dc] text-[#161412]">
                      {item.tag}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#e8e4dc] flex items-center justify-center text-[#1d382b] shadow-warm-sm">
                    <Icon className="w-5 h-5 text-[#1d382b]" />
                  </div>

                  <h3 className="text-base font-semibold text-[#161412] leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#68625c] font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#f0ede6] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#1d382b]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.turnaround}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cadre institutionnel et études partenaires */}
        <div className="bg-[#f5f2eb] rounded-3xl p-8 sm:p-10 border border-[#e8e4dc] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#947346]">
              <Scale className="w-4 h-4 text-[#947346]" />
              <span>Chambre des Notaires & Géomètres Partenaires</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-display font-medium text-[#161412]">
              Cadre notarial ministériel & liberté de choix.
            </h3>
            
            <p className="text-xs sm:text-sm text-[#68625c] font-light leading-relaxed">
              Les avant-contrats et actes authentiques sont instrumentés par des études notariales assermentées avec lesquelles nous collaborons usuellement (Plateau et Cocody). Conformément à la déontologie, vous conservez la liberté totale de désigner votre propre notaire sans aucun surcoût. Les bornages parcellaires sont validés avec des géomètres-experts inscrits à l&apos;Ordre (OGE-CI).
            </p>

            <div className="flex items-center gap-2 text-xs text-[#7a736a] pt-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#947346]" />
              <span>Audit initial de recevabilité gratuit sous 48h ouvrées pour tout mandat confié.</span>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 shrink-0">
            <a
              href={whatsappAuditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-full bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
            >
              <span>Faire vérifier un dossier foncier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <Link
              href="/estimer"
              className="w-full text-center py-3.5 rounded-full bg-white hover:bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] text-xs font-semibold transition-all duration-300"
            >
              Demander l&apos;estimation d&apos;un bien
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
