'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, MessageCircle, Copy, Check, QrCode, Download, 
  Share2, ExternalLink, Smartphone, BookOpen, Sparkles
} from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

interface CatalogueShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  directUrl?: string;
}

export default function CatalogueShareModal({
  isOpen,
  onClose,
  directUrl,
}: CatalogueShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      setHasNativeShare(!!navigator.share);
    }
  }, []);

  if (!isOpen) return null;

  // Lien direct du Flipbook 3D pour smartphone
  const flipbookMobileUrl = directUrl || (origin ? `${origin}/c` : '/c');

  // QR Code haute résolution scannable directement par les téléphones
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
    flipbookMobileUrl
  )}&color=16-20-18&bgcolor=250-248-245&margin=10`;

  // Message WhatsApp axé sur le FLIPBOOK 3D INTERACTIF
  const whatsappShareText = `*Catalogue Virtuel 3D | Agence Immo Abidjan*\n\nFeuilletez notre sélection confidentielle en 3D directement sur votre smartphone (tournez les pages au doigt comme un livre physique) :\n\n${flipbookMobileUrl}\n\nVillas d'architecte Riviera Golf • Penthouses Zone 4 • Domaines Assinie`;

  const whatsappDirectShareUrl = getWhatsAppLink('', whatsappShareText);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(flipbookMobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Livre Numérique 3D Prestige Abidjan 2026',
          text: "Feuilletez notre livre d'art immobilier en 3D directement sur votre smartphone.",
          url: flipbookMobileUrl,
        });
      } catch (err) {
        // Annulation par l'utilisateur
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAE5DC] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-[#191715] select-none">
        
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8C8275] hover:text-[#191715] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          aria-label="Fermer la fenêtre"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#9E7431] font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Livre Virtuel Feuilletable sur Mobile</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-medium text-[#191715]">
            Partager le Flipbook 3D
          </h3>
          <p className="text-xs text-[#6E665B] font-light leading-relaxed">
            Vos clients et investisseurs peuvent feuilleter l&apos;ouvrage tactile directement sur leur téléphone, avec le toucher de papier et les vidéos 4K intégrées.
          </p>
        </div>

        {/* 1. SECTION QR CODE : SCAN DIRECT SUR SMARTPHONE */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC] flex flex-col sm:flex-row items-center gap-5">
          <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-white p-2 border border-[#DDD7CC] shrink-0 shadow-xs">
            <img
              src={qrCodeImageUrl}
              alt="QR Code Flipbook 3D Abidjan 2026"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-[#191715]">
              <QrCode className="w-4 h-4 text-[#9E7431]" />
              <span>QR Code Immédiat</span>
            </div>
            <p className="text-[11px] text-[#6B655D] dark:text-[#A39C92] font-light leading-relaxed">
              Visez ce QR code avec l&apos;appareil photo d&apos;un smartphone : le flipbook s&apos;ouvre instantanément en plein écran.
            </p>
            <a
              href={qrCodeImageUrl}
              download="QR-Code-Flipbook-Abidjan-2026.png"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#947346] dark:text-[#C8A97E] hover:underline pt-1"
            >
              <Download className="w-3 h-3" />
              <span>Télécharger le QR Code PNG</span>
            </a>
          </div>
        </div>

        {/* 2. ACTIONS DE PARTAGE DIRECT DU FLIPBOOK */}
        <div className="space-y-3">
          
          {/* Bouton Principal : Partager le Flipbook sur WhatsApp */}
          <a
            href={whatsappDirectShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-5 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold flex items-center justify-center gap-2.5 shadow-[0_10px_25px_rgba(25,23,21,0.15)] transition-all transform hover:scale-102 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#9E7431]" />
            <span>Envoyer le Flipbook par WhatsApp à un Client</span>
          </a>

          {/* Partage Natif Smartphone (AirDrop, SMS, Télégramme, etc.) */}
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-3 px-5 rounded-full bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#191715] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#DDD7CC]"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager le Flipbook (AirDrop, Messages, Mail)</span>
            </button>
          )}

          {/* Lien Direct du Flipbook Copiable */}
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD7CC] text-xs font-mono text-[#6E665B] truncate">
              {flipbookMobileUrl}
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0 font-semibold ${
                copied
                  ? 'bg-[#9E7431] text-white'
                  : 'bg-[#191715] text-white hover:bg-[#9E7431]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le Lien</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* 3. TEST DIRECT DU FLIPBOOK MOBILE */}
        <div className="pt-4 border-t border-[#EAE5DC] flex items-center justify-between text-xs font-mono">
          <span className="text-[#7A746B]">
            Ouvrir la liseuse plein écran :
          </span>

          <a
            href={flipbookMobileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#9E7431] hover:underline font-semibold"
          >
            <span>Tester la Liseuse Mobile 3D</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}