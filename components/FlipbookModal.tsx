'use client';

import React from 'react';
import { X, ExternalLink, Share2, BookOpen, MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

interface FlipbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reference: string;
  flipbookUrl: string;
}

export default function FlipbookModal({
  isOpen,
  onClose,
  title,
  reference,
  flipbookUrl,
}: FlipbookModalProps) {
  if (!isOpen) return null;

  const shareText = `Bonjour, voici notre plaquette numérique interactive pour le bien [${reference}] "${title}" : ${flipbookUrl}`;
  const whatsappUrl = getWhatsAppLink('2250788421920', shareText);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="dark:bg-[#121110] bg-[#fbfaf7] border dark:border-white/10 border-[#e8e4dc] rounded-3xl max-w-5xl w-full flex flex-col max-h-[92vh] dark:shadow-[0_25px_70px_rgba(0,0,0,0.95)] shadow-warm-lg overflow-hidden">
        
        {/* Header de la liseuse */}
        <div className="p-4 sm:p-5 dark:bg-[#161412] bg-white border-b dark:border-white/10 border-[#e8e4dc] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full dark:bg-white dark:text-[#0A0908] bg-[#161412] text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4 dark:text-[#C8A97E] text-[#947346]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider dark:text-[#C8A97E] text-[#947346] font-semibold block">
                Notre Plaquette Numérique Interactive • Réf. {reference}
              </span>
              <h3 className="text-sm sm:text-base font-display font-medium dark:text-white text-[#161412] truncate max-w-md">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full dark:bg-white/10 dark:hover:bg-white/20 dark:text-white bg-[#f5f2eb] hover:bg-[#e8e4dc] text-[#161412] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer la liseuse"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visionneuse Heyzine interactive (Iframe) */}
        <div className="flex-1 p-2 sm:p-4 dark:bg-[#0A0908] bg-[#f0ede6] overflow-hidden flex items-center justify-center">
          <div className="w-full h-[60vh] sm:h-[68vh] rounded-2xl overflow-hidden shadow-warm-md border dark:border-white/10 border-[#e8e4dc] bg-white relative">
            <iframe
              src={flipbookUrl}
              title={`Plaquette feuilletable ${title}`}
              className="w-full h-full border-0"
              allow="fullscreen"
              loading="lazy"
            />
          </div>
        </div>

        {/* Barre d'outils inférieure */}
        <div className="p-4 dark:bg-[#161412] bg-white border-t dark:border-white/10 border-[#e8e4dc] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="dark:text-[#A39C92] text-[#68625c] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#9E7431]" />
            <span className="hidden sm:inline">Tournez les pages avec les flèches ou la souris. Effet papier et son interactif.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white bg-[#fbfaf7] hover:bg-[#f5f2eb] border border-[#e8e4dc] text-[#161412] font-semibold flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#9E7431]" />
              <span>Transmettre par WhatsApp</span>
            </a>

            <a
              href={flipbookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full dark:bg-white dark:hover:bg-[#C8A97E] dark:text-[#0A0908] bg-[#161412] hover:bg-[#947346] text-white font-semibold flex items-center gap-2 transition-colors"
            >
              <span>Plein Écran Heyzine</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
