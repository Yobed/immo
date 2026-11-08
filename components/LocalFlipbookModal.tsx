'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  X, ChevronLeft, ChevronRight, Download, Share2, 
  BookOpen, ExternalLink, ShieldCheck, CheckCircle2, MapPin, Phone, Mail
} from 'lucide-react';
import { Property } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';

interface LocalFlipbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  pdfUrl?: string;
}

export default function LocalFlipbookModal({
  isOpen,
  onClose,
  property,
  pdfUrl = `/brochures/${property.reference}.pdf`,
}: LocalFlipbookModalProps) {
  // Mode spread : 0 = Couverture, 1 = Pages 2-3 (Double page), 2 = Page 4 (Dernière page)
  const [currentSpread, setCurrentSpread] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const totalSpreads = 3;

  const handleNext = () => {
    if (currentSpread < totalSpreads - 1) setCurrentSpread(currentSpread + 1);
  };

  const handlePrev = () => {
    if (currentSpread > 0) setCurrentSpread(currentSpread - 1);
  };

  const whatsappMessage = `Bonjour, voici la plaquette officielle de la ${property.title} (${formatFCFA(property.price)}) à ${property.district} : http://localhost:3000/brochure/${property.id}`;
  const whatsappUrl = getWhatsAppLink('2250788421920', whatsappMessage);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-[#fbfaf7] border border-[#e8e4dc] rounded-3xl max-w-5xl w-full flex flex-col max-h-[94vh] shadow-warm-lg overflow-hidden">
        
        {/* Header de la Liseuse Auto-hébergée */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#e8e4dc] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#161412] text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#947346]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#947346] font-semibold block">
                Plaquette Numérique Interactive • Réf. {property.reference}
              </span>
              <h3 className="text-sm sm:text-base font-display font-medium text-[#161412] truncate max-w-md">
                {property.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/brochure/${property.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fbfaf7] border border-[#e8e4dc] text-xs font-semibold text-[#161412] hover:bg-[#f5f2eb] transition-colors"
            >
              <span>Version Imprimable A4</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#947346]" />
            </a>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f5f2eb] hover:bg-[#e8e4dc] text-[#161412] flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CŒUR DU FLIPBOOK 3D VISUEL (SPREADS) */}
        <div className="flex-1 p-4 sm:p-8 bg-[#eae6dc] overflow-y-auto flex items-center justify-center relative select-none">
          
          {/* SPREAD 0 : COUVERTURE SEULE */}
          {currentSpread === 0 && (
            <div className="relative w-full max-w-xl aspect-[297/210] bg-[#161412] text-white rounded-2xl overflow-hidden shadow-2xl p-8 sm:p-10 flex flex-col justify-between border-l-4 border-[#947346] transition-transform duration-500 animate-fadeIn">
              <div className="absolute inset-0 z-0">
                <Image src={property.images[0]} alt={property.title} fill className="object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-[#161412]/30 to-black/50" />
              </div>

              <div className="relative z-10 flex justify-between items-center border-b border-white/20 pb-4">
                <span className="text-sm font-display font-semibold">Agence <span className="italic text-[#dcd6cb]">Immo</span></span>
                <span className="text-[10px] text-[#947346] font-semibold uppercase tracking-widest">Mandat Exclusif</span>
              </div>

              <div className="relative z-10 space-y-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md font-semibold">
                  {property.district} • {property.legal_status}
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-medium text-white leading-tight">
                  {property.title}
                </h2>
                <div className="text-xl font-display font-semibold text-[#b59363]">
                  {formatFCFA(property.price)}
                </div>
              </div>

              <div className="relative z-10 border-t border-white/20 pt-3 flex justify-between text-[10px] text-white/70">
                <span>Dossier Confidentiel d&apos;Acquisition</span>
                <span>Page 1 / 4 • Cliquez sur &gt; pour feuilleter</span>
              </div>
            </div>
          )}

          {/* SPREAD 1 : DOUBLE PAGE CENTRALE (PAGE 2 & 3) */}
          {currentSpread === 1 && (
            <div className="relative w-full max-w-4xl aspect-[594/210] bg-white rounded-2xl overflow-hidden shadow-2xl grid grid-cols-2 divide-x divide-[#e8e4dc] border border-[#dcd6cb] transition-transform duration-500 animate-fadeIn">
              
              {/* Page Gauche (Page 2 : Architecture) */}
              <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#fbfaf7]">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-semibold text-[#947346] tracking-wider block">01 • Architecture & Confort</span>
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-[#e8e4dc]">
                    <Image src={property.images[0]} alt="Vue intérieure" fill className="object-cover" />
                  </div>
                  <h4 className="text-base font-display font-medium text-[#161412]">{property.title}</h4>
                  <p className="text-[11px] text-[#68625c] line-clamp-3 leading-relaxed font-light">{property.description}</p>
                </div>

                <div className="pt-3 border-t border-[#f0ede6] flex justify-between text-[10px] text-[#a39c92]">
                  <span>{property.surface} m² • {property.bedrooms} chambres</span>
                  <span>Page 2 / 4</span>
                </div>
              </div>

              {/* Page Droite (Page 3 : Foncier ACD) */}
              <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#f5f2eb]">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-semibold text-[#1d382b] tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>02 • Rigueur Foncier ACD</span>
                  </span>
                  <div className="p-4 rounded-xl bg-white border border-[#d2e3d8] space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#1d382b] font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-[#1d382b]" />
                      <span>Titre Foncier Purifié ({property.legal_status})</span>
                    </div>
                    <p className="text-[11px] text-[#68625c] font-light leading-relaxed">
                      Levée d&apos;état foncier au Guichet Unique MCLU sans prénotation. Bornage contradictoire certifié par géomètre expert.
                    </p>
                  </div>
                  <div className="text-xs space-y-1 text-[#4a453e]">
                    <div className="flex justify-between"><span>Secteur :</span><strong>{property.district}</strong></div>
                    <div className="flex justify-between"><span>Séquestre :</span><strong className="text-[#1d382b]">Notaire Agréé</strong></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e8e4dc] flex justify-between text-[10px] text-[#a39c92]">
                  <span>Garantie Notariée Zéro Litige</span>
                  <span>Page 3 / 4</span>
                </div>
              </div>

            </div>
          )}

          {/* SPREAD 2 : PAGE 4 (DERNIÈRE PAGE / CONTACT) */}
          {currentSpread === 2 && (
            <div className="relative w-full max-w-xl aspect-[297/210] bg-[#161412] text-white rounded-2xl overflow-hidden shadow-2xl p-8 sm:p-10 flex flex-col justify-between border-r-4 border-[#947346] transition-transform duration-500 animate-fadeIn">
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-semibold text-[#947346] tracking-wider block">03 • Visite Privée & Mandat</span>
                <h3 className="text-2xl font-display font-medium text-white">Agence Immo Abidjan</h3>
                <p className="text-xs text-white/70 font-light leading-relaxed">
                  Dossier technique complet, plans cadastraux et visite privée sur rendez-vous confidentiel.
                </p>
              </div>

              <div className="space-y-2 text-xs text-white/90 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#947346]" />
                  <span>Boulevard Hassan II, Cocody Riviera Golf, Abidjan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#947346]" />
                  <span>+225 07 00 00 00 00 (WhatsApp 24/7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#947346]" />
                  <span>conciergerie@agence-immo.ci</span>
                </div>
              </div>

              <div className="border-t border-white/20 pt-3 flex justify-between text-[10px] text-white/70">
                <span>Réf. {property.reference}</span>
                <span>Page 4 / 4 • Fin du dossier</span>
              </div>
            </div>
          )}

          {/* Boutons Flèches Précédent / Suivant */}
          <button
            onClick={handlePrev}
            disabled={currentSpread === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#161412] shadow-warm-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Page précédente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentSpread === totalSpreads - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#161412] shadow-warm-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Page suivante"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

        {/* Barre d'outils inférieure */}
        <div className="p-4 bg-white border-t border-[#e8e4dc] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Pagination dots */}
          <div className="flex items-center gap-2">
            <span className="text-[#7a736a] text-xs">Feuilleter :</span>
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSpread(idx)}
                className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                  currentSpread === idx ? 'bg-[#161412] text-white' : 'bg-[#f5f2eb] text-[#68625c] hover:bg-[#e8e4dc]'
                }`}
              >
                {idx === 0 ? '1' : idx === 1 ? '2-3' : '4'}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full bg-[#fbfaf7] hover:bg-[#f5f2eb] border border-[#e8e4dc] text-[#161412] font-semibold flex items-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-[#1d382b]" />
              <span>Partager sur WhatsApp</span>
            </a>

            <a
              href={`/brochures/${property.reference}.pdf`}
              download
              className="px-4 py-2 rounded-full bg-[#161412] hover:bg-[#947346] text-white font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger PDF (A4)</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
