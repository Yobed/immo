'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MessageCircle, Share2, Maximize2, Minimize2, 
  ExternalLink, Phone, ArrowLeft, BookOpen, Sparkles,
  ChevronLeft, ChevronRight, Sun, Moon, Volume2, VolumeX,
  Play, Video, MapPin, ShieldCheck, Award, ArrowUpRight,
  Compass, FileText, CheckCircle2, X, Eye
} from 'lucide-react';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { Property } from '@/lib/types';
import CatalogueShareModal from '@/components/CatalogueShareModal';

/**
 * Synthétiseur de bruitage réaliste de page qui tourne (Web Audio API - 0 dépendance)
 */
function playPageTurnSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const bufferSize = ctx.sampleRate * 0.18; // 180ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.17);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (err) {
    // Audio context non autorisé avant interaction utilisateur
  }
}

export default function StandaloneMobileFlipbookPage() {
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const pageFlipInstance = useRef<any>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(8);
  const [isReady, setIsReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'scroll'>('3d');
  const [activeVideoProperty, setActiveVideoProperty] = useState<any>(null);

  const { properties, lastSyncTime } = useLiveProperties();

  const villa = properties.find((p) => p.reference === 'VIL-RG-2026') || INITIAL_PROPERTIES[0];
  const penthouse = properties.find((p) => p.reference === 'PNT-Z4-104') || INITIAL_PROPERTIES[1];
  const terrain = properties.find((p) => p.reference === 'TER-BG-600') || INITIAL_PROPERTIES[2];
  const appart = properties.find((p) => p.reference === 'APP-PL-04') || INITIAL_PROPERTIES[3];

  const renderLiveBadge = (property: Property) => {
    if (property.status === 'cleaning' || property.concierge_status === 'cleaning') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-[#6E665B] border border-[#EAE5DC] text-[9px] font-medium shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431]" />
          <span>Préparation Hôtelière</span>
        </span>
      );
    }
    if (property.status === 'reserved' || property.concierge_status === 'reserved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-[#6E665B] border border-[#EAE5DC] text-[9px] font-medium shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#191715]" />
          <span>Réservé : Visite</span>
        </span>
      );
    }
    if (property.status === 'under_offer') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-[#6E665B] border border-[#EAE5DC] text-[9px] font-medium shadow-2xs">
          <span>Sous Offre</span>
        </span>
      );
    }
    if (property.status === 'rented' || property.concierge_status === 'occupied') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-[#6E665B] border border-[#EAE5DC] text-[9px] font-medium shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#191715]" />
          <span>Occupé (Bail actif)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white text-[#191715] border border-[#EAE5DC] text-[9px] font-medium shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431]" />
        <span>Disponible</span>
      </span>
    );
  };

  const whatsappGeneralUrl = getWhatsAppLink(
    '2250788421920',
    `Bonjour Cabinet Immobilier Abidjan, je consulte votre Catalogue Flipbook 3D 2026 sur mon téléphone. Je souhaite échanger avec la direction au sujet d'une résidence d'exception.`
  );

  // Initialisation du Flipbook 3D
  useEffect(() => {
    if (viewMode !== '3d') return;

    let flipInstance: any = null;

    async function initPageFlip() {
      if (!bookContainerRef.current) return;

      try {
        const { PageFlip } = await import('page-flip');

        flipInstance = new PageFlip(bookContainerRef.current, {
          width: 390,
          height: 600,
          size: 'stretch',
          minWidth: 280,
          maxWidth: 640,
          minHeight: 420,
          maxHeight: 900,
          maxShadowOpacity: 0.6,
          showCover: true,
          usePortrait: true,
          mobileScrollSupport: false,
          useMouseEvents: true,
          flippingTime: 750,
        });

        const pageElements = bookContainerRef.current.querySelectorAll('.mobile-book-page');
        if (pageElements.length > 0) {
          flipInstance.loadFromHTML(pageElements);
          setTotalPages(pageElements.length);
          setIsReady(true);
        }

        flipInstance.on('flip', (e: any) => {
          setCurrentPage(e.data);
          if (soundEnabled) {
            playPageTurnSound();
          }
        });

        pageFlipInstance.current = flipInstance;
      } catch (err) {
        console.error('Erreur initialisation StPageFlip Mobile:', err);
        // Basculer en mode défilement si le canvas n'est pas supporté
        setViewMode('scroll');
      }
    }

    const timer = setTimeout(() => {
      initPageFlip();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (flipInstance) {
        try {
          flipInstance.destroy();
        } catch (e) {}
      }
    };
  }, [viewMode]);

  const flipNext = () => {
    if (pageFlipInstance.current) {
      pageFlipInstance.current.flipNext();
    }
  };

  const flipPrev = () => {
    if (pageFlipInstance.current) {
      pageFlipInstance.current.flipPrev();
    }
  };

  const jumpToPage = (pageNum: number) => {
    if (pageFlipInstance.current) {
      pageFlipInstance.current.flip(pageNum);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col justify-between overflow-hidden select-none z-50 bg-[#FAF8F5] text-[#191715]">
      
      {/* ========================================================================= */}
      {/* 1. HEADER MINIMALISTE DE LA LISEUSE MOBILE                                */}
      {/* ========================================================================= */}
      <header className="h-14 px-3 sm:px-4 bg-white/95 backdrop-blur-xl border-b border-[#EAE5DC] flex items-center justify-between z-30 shrink-0 text-[#191715]">
        
        {/* Identité Prestige */}
        <div className="flex items-center gap-2.5">
          <Link 
            href="/"
            className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-bold text-sm bg-[#191715] text-white shadow-xs"
            title="Retour au site"
          >
            A
          </Link>
          <div className="flex flex-col">
            <span className="text-xs font-display font-semibold tracking-tight leading-none text-[#191715]">
              Catalogue Prestige 2026
            </span>
            <span className="text-[10px] font-mono mt-0.5 text-[#9E7431] font-semibold">
              <span>{viewMode === '3d' ? 'Livre 3D Tactile' : 'Défilement HD'}</span>
            </span>
          </div>
        </div>

        {/* Actions Droite */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Bascule Mode 3D / Scroll */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === '3d' ? 'scroll' : '3d')}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium border border-[#DDD7CC] bg-[#FAF8F5] text-[#191715] hover:bg-[#F2EFE9] transition-colors flex items-center gap-1 cursor-pointer"
            title="Changer de vue"
          >
            <BookOpen className="w-3 h-3 text-[#9E7431]" />
            <span className="hidden xs:inline">{viewMode === '3d' ? 'Vue 3D' : 'Défilement'}</span>
          </button>

          {/* Son On/Off */}
          {viewMode === '3d' && (
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border border-[#DDD7CC] transition-colors cursor-pointer ${
                soundEnabled ? 'bg-[#FBF8F1] text-[#9E7431]' : 'bg-[#FAF8F5] text-[#8C8275]'
              }`}
              title={soundEnabled ? 'Son activé' : 'Son coupé'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Bouton Partager (QR Code & WhatsApp) */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[#191715] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#9E7431] transition-colors cursor-pointer"
            title="Partager le Flipbook 3D"
          >
            <Share2 className="w-3.5 h-3.5 text-[#9E7431]" />
            <span className="hidden sm:inline">Partager</span>
          </button>

          {/* Plein Écran */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-[#DDD7CC] bg-[#FAF8F5] text-[#191715] hover:bg-[#F2EFE9] transition-colors hidden sm:flex cursor-pointer"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. LE FLIPBOOK 3D INTERACTIF EN PLEIN ÉCRAN POUR SMARTPHONE                */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-[#F5F2EB]">
        
        {viewMode === '3d' ? (
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Loader d'initialisation */}
            {!isReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-[#FAF8F5]/90 backdrop-blur-xs">
                <div className="w-10 h-10 rounded-full border-2 border-[#DDD7CC] border-t-[#9E7431] animate-spin mb-3" />
                <span className="text-xs font-mono uppercase tracking-widest font-semibold text-[#9E7431]">
                  Chargement du Flipbook 3D...
                </span>
              </div>
            )}

            {/* Boutons de navigation latéraux pour pouces */}
            <button
              onClick={flipPrev}
              className="absolute left-2 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#191715] border border-[#DDD7CC] shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={flipNext}
              className="absolute right-2 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#191715] border border-[#DDD7CC] shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Conteneur StPageFlip */}
            <div 
              ref={bookContainerRef} 
              className="flipbook-root relative mx-auto my-auto select-none max-w-full max-h-full"
              style={{ touchAction: 'none' }}
            >
              {/* PAGE 1 : COUVERTURE RIGIDE */}
              <div className="mobile-book-page book-page bg-[#fbfaf7] text-[#161412] p-6 sm:p-8 flex flex-col justify-between border-r border-[#e8e4dc] shadow-2xl overflow-hidden" data-density="hard">
                <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-3">
                  <div>
                    <span className="text-[9px] tracking-[0.2em] uppercase text-[#947346] font-semibold block">
                      Recueil Annuel 2026
                    </span>
                    <span className="font-display text-base font-semibold text-[#161412]">
                      Agence Immo • Abidjan
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[#947346]/40 flex items-center justify-center font-display font-bold text-xs text-[#947346]">
                    2026
                  </div>
                </div>

                <div className="relative flex-1 my-3 rounded-xl overflow-hidden shadow-inner group">
                  <Image
                    src={villa.images[0]}
                    alt="Catalogue Prestige Abidjan"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

                  {/* Bouton Vidéo Hotspot */}
                  <button
                    onClick={() => setActiveVideoProperty({
                      title: "L'Immobilier d'Exception à Abidjan : Film Institutionnel 2026",
                      district: "Abidjan Prestige",
                      reference: "CAT-PRESTIGE",
                      price: 450000000,
                      operation: "sale",
                      image: villa.images[0]
                    })}
                    className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-white/95 text-[#161412] text-[9px] font-semibold flex items-center gap-1 shadow"
                  >
                    <Play className="w-2.5 h-2.5 fill-[#947346] text-[#947346]" />
                    <span>Vidéo 4K</span>
                  </button>

                  <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-[#d8c29d] font-semibold block">
                      Portefeuille Exclusif
                    </span>
                    <h2 className="text-base sm:text-lg font-display font-medium leading-tight">
                      L&apos;Immobilier d&apos;Exception & le Foncier Sécurisé
                    </h2>
                    <p className="text-[10px] text-white/80 font-light">
                      Cocody • Marcory Zone 4 • Assinie • Bingerville
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#e8e4dc]">
                  <div>
                    <span className="text-[9px] text-[#7a736a] block uppercase">100% Notarié</span>
                    <span className="text-[10px] font-semibold text-[#161412]">Titre ACD Vérifié</span>
                  </div>
                  <span className="text-[9px] font-semibold text-[#947346] bg-[#f5f2eb] px-2 py-0.5 rounded-full border border-[#e8e4dc]">
                    Glisser au doigt ➔
                  </span>
                </div>
              </div>

              {/* PAGE 2 : ÉDITORIAL & ACD */}
              <div className="mobile-book-page book-page bg-[#fbfaf7] text-[#161412] p-6 sm:p-8 flex flex-col justify-between border-r border-[#e8e4dc] shadow-inner overflow-hidden">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-2">
                    <span className="text-[9px] uppercase tracking-widest text-[#947346] font-semibold">
                      Éditorial
                    </span>
                    <span className="text-xs font-mono text-[#7a736a]">p. 02</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-display font-medium text-[#161412] leading-tight">
                    « Redéfinir l&apos;investissement immobilier ivoirien par la transparence absolue. »
                  </h3>

                  <p className="text-xs text-[#4a453e] font-light leading-relaxed">
                    Chaque bien présenté au sein de ce catalogue fait l&apos;objet d&apos;un audit préalable rigoureux auprès de la Conservation Foncière et du Ministère de la Construction. Nous ne négocions que des actifs dotés de l&apos;Arrêté de Concession Définitive (ACD).
                  </p>

                  <div className="p-3 rounded-xl bg-[#f5f2eb] border border-[#e8e4dc] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1d382b]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1d382b]" />
                        <span>Sécurité Notariée</span>
                      </div>
                      <span className="text-[9px] bg-[#d2e3d8] text-[#1d382b] px-1.5 py-0.5 rounded-full font-bold">
                        100% ACD
                      </span>
                    </div>
                    <p className="text-[10px] text-[#68625c]">
                      Transactions scellées par acte authentique avec comptes séquestres notariés agréés.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e8e4dc] flex items-center justify-between text-[11px] text-[#7a736a]">
                  <span>Cabinet Immobilier</span>
                  <span className="font-display italic text-[#161412] font-medium">La Direction</span>
                </div>
              </div>

              {/* PAGE 3 : CARTOGRAPHIE */}
              <div className="mobile-book-page book-page bg-white text-[#161412] p-6 sm:p-8 flex flex-col justify-between border-l border-[#e8e4dc] shadow-inner overflow-hidden">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-2">
                    <span className="text-[9px] uppercase tracking-widest text-[#947346] font-semibold">
                      Quartiers Clés d&apos;Abidjan
                    </span>
                    <span className="text-xs font-mono text-[#7a736a]">p. 03</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl border border-[#e8e4dc] bg-[#fbfaf7]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold text-xs text-[#161412]">Cocody Riviera Golf</span>
                        <span className="text-[11px] font-mono font-semibold text-[#947346]">8.5% / an</span>
                      </div>
                      <p className="text-[10px] text-[#68625c]">Résidences d&apos;ambassadeurs et cadres dirigeants.</p>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Riviera+Golf+Cocody+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#947346] hover:underline mt-1"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Ouvrir sur Google Maps</span>
                      </a>
                    </div>

                    <div className="p-2.5 rounded-xl border border-[#e8e4dc] bg-[#fbfaf7]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold text-xs text-[#161412]">Marcory Zone 4</span>
                        <span className="text-[11px] font-mono font-semibold text-[#947346]">10.2% / an</span>
                      </div>
                      <p className="text-[10px] text-[#68625c]">Penthouses prisés par les banques d&apos;affaires.</p>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Zone+4+Marcory+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#947346] hover:underline mt-1"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Ouvrir sur Google Maps</span>
                      </a>
                    </div>

                    <div className="p-2.5 rounded-xl border border-[#e8e4dc] bg-[#fbfaf7]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold text-xs text-[#161412]">Bingerville Nouveau Goudron</span>
                        <span className="text-[11px] font-mono font-semibold text-[#947346]">+18% plus-value</span>
                      </div>
                      <p className="text-[10px] text-[#68625c]">Parcelles foncières titrées en plein essor.</p>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Bingerville+Nouveau+Goudron+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#947346] hover:underline mt-1"
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>Ouvrir sur Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e8e4dc] flex items-center justify-between text-[10px] text-[#7a736a]">
                  <span>Baromètre Foncier 2026</span>
                  <span className="font-mono text-[#947346]">Chambre Notariale</span>
                </div>
              </div>

              {/* PAGE 4 : VILLA RIVIERA GOLF */}
              <div className="mobile-book-page book-page bg-[#fbfaf7] text-[#161412] p-6 sm:p-8 flex flex-col justify-between border-r border-[#e8e4dc] shadow-inner overflow-hidden">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-2">
                    <span className="text-[9px] uppercase tracking-widest text-[#947346] font-semibold">
                      Villa Contemporaine • Vente
                    </span>
                    <span className="text-xs font-mono text-[#7a736a]">p. 04</span>
                  </div>

                  <div className="relative h-36 rounded-xl overflow-hidden shadow-sm group">
                    <Image src={villa.images[0]} alt={villa.title} fill className="object-cover" />
                    <div className="absolute top-2 left-2 bg-[#1d382b] text-white text-[8px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ACD Vérifié
                    </div>
                    <button
                      onClick={() => setActiveVideoProperty(villa)}
                      className="absolute inset-0 bg-black/30 flex items-center justify-center gap-1.5 text-white text-[10px] font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#947346] text-[#947346]" />
                      <span>Visite Vidéo 4K</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-[#7a736a] block">Cocody Riviera Golf • Réf: {villa.reference}</span>
                      {renderLiveBadge(villa)}
                    </div>
                    <h4 className="text-base font-display font-medium text-[#161412] leading-tight">
                      {villa.title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-1 p-2 bg-white rounded-xl border border-[#e8e4dc] text-center text-xs">
                    <div>
                      <span className="text-[8px] text-[#7a736a] block">Surface</span>
                      <strong className="text-[#161412] text-[11px] font-semibold">{villa.surface} m²</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#7a736a] block">Chambres</span>
                      <strong className="text-[#161412] text-[11px] font-semibold">{villa.bedrooms} suites</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#7a736a] block">Piscine</span>
                      <strong className="text-[#161412] text-[11px] font-semibold">Débordement</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e8e4dc] flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-[#7a736a] block uppercase">Prix de Vente</span>
                    <span className="text-xs font-semibold text-[#161412] font-display">
                      {formatFCFA(villa.price)}
                    </span>
                  </div>
                  <a
                    href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je souhaite visiter la Villa Riviera Golf (Réf: ${villa.reference}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-[10px] font-semibold flex items-center gap-1 shadow transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Visite WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* PAGE 5 : PENTHOUSE ZONE 4 */}
              <div className="mobile-book-page book-page bg-white text-[#161412] p-6 sm:p-8 flex flex-col justify-between border-l border-[#e8e4dc] shadow-inner overflow-hidden">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-2">
                    <span className="text-[9px] uppercase tracking-widest text-[#947346] font-semibold">
                      Penthouse de Prestige • Location
                    </span>
                    <span className="text-xs font-mono text-[#7a736a]">p. 05</span>
                  </div>

                  <div className="relative h-36 rounded-xl overflow-hidden shadow-sm group">
                    <Image src={penthouse.images[0]} alt={penthouse.title} fill className="object-cover" />
                    <div className="absolute top-2 left-2 bg-[#947346] text-white text-[8px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Award className="w-2.5 h-2.5" />
                      Rooftop Privatif
                    </div>
                    <button
                      onClick={() => setActiveVideoProperty(penthouse)}
                      className="absolute inset-0 bg-black/30 flex items-center justify-center gap-1.5 text-white text-[10px] font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#947346] text-[#947346]" />
                      <span>Visite Vidéo 4K</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-[#7a736a] block">Marcory Zone 4 • Réf: {penthouse.reference}</span>
                      {renderLiveBadge(penthouse)}
                    </div>
                    <h4 className="text-base font-display font-medium text-[#161412] leading-tight">
                      {penthouse.title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-1 p-2 bg-[#fbfaf7] rounded-xl border border-[#e8e4dc] text-center text-xs">
                    <div>
                      <span className="text-[8px] text-[#7a736a] block">Surface</span>
                      <strong className="text-[#161412] text-[11px] font-semibold">{penthouse.surface} m²</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#7a736a] block">Pièces</span>
                      <strong className="text-[#161412] text-[11px] font-semibold">{penthouse.bedrooms}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#7a736a] block">Vue</span>
                      <strong className="text-[#161412] text-[11px] font-semibold">Lagune</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e8e4dc] flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-[#7a736a] block uppercase">Loyer Mensuel</span>
                    <span className="text-xs font-semibold text-[#161412] font-display">
                      {formatFCFA(penthouse.price)} <span className="text-[9px] font-normal">/ mois</span>
                    </span>
                  </div>
                  <a
                    href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je souhaite louer le Penthouse Marcory Zone 4 (Réf: ${penthouse.reference}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-[10px] font-semibold flex items-center gap-1 shadow transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Visite WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* PAGE 6 : TERRAIN BINGERVILLE ACD */}
              <div className="mobile-book-page book-page bg-[#fbfaf7] text-[#161412] p-6 sm:p-8 flex flex-col justify-between border-r border-[#e8e4dc] shadow-inner overflow-hidden">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-2">
                    <span className="text-[9px] uppercase tracking-widest text-[#1d382b] font-semibold">
                      Foncier Titré • ACD
                    </span>
                    <span className="text-xs font-mono text-[#7a736a]">p. 06</span>
                  </div>

                  <div className="relative h-36 rounded-xl overflow-hidden shadow-sm group">
                    <Image src={terrain.images[0]} alt={terrain.title} fill className="object-cover" />
                    <div className="absolute top-2 left-2 bg-[#1d382b] text-white text-[8px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ACD Ministère
                    </div>
                    <button
                      onClick={() => setActiveVideoProperty(terrain)}
                      className="absolute inset-0 bg-black/30 flex items-center justify-center gap-1.5 text-white text-[10px] font-semibold"
                    >
                      <Video className="w-3.5 h-3.5 fill-[#947346] text-[#947346]" />
                      <span>Vue Aérienne Drone</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-[#7a736a] block">Bingerville • Réf: {terrain.reference}</span>
                      {renderLiveBadge(terrain)}
                    </div>
                    <h4 className="text-base font-display font-medium text-[#161412] leading-tight">
                      {terrain.title}
                    </h4>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-[#e8e4dc] space-y-1 text-xs">
                    <div className="flex justify-between text-[#161412]">
                      <span className="text-[#7a736a] text-[10px]">Superficie</span>
                      <strong className="font-semibold text-[11px]">{terrain.surface} m²</strong>
                    </div>
                    <div className="flex justify-between text-[#161412]">
                      <span className="text-[#7a736a] text-[10px]">Statut</span>
                      <strong className="text-[#1d382b] font-semibold text-[11px]">ACD Délivré</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e8e4dc] flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-[#7a736a] block uppercase">Prix Foncier</span>
                    <span className="text-xs font-semibold text-[#161412] font-display">
                      {formatFCFA(terrain.price)}
                    </span>
                  </div>
                  <a
                    href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je souhaite visiter le Terrain Bingerville (Réf: ${terrain.reference}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-[10px] font-semibold flex items-center gap-1 shadow transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Visite Terrain</span>
                  </a>
                </div>
              </div>

              {/* PAGE 7 : BUREAUX PLATEAU */}
              <div className="mobile-book-page book-page bg-white text-[#161412] p-6 sm:p-8 flex flex-col justify-between border-l border-[#e8e4dc] shadow-inner overflow-hidden">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-2">
                    <span className="text-[9px] uppercase tracking-widest text-[#947346] font-semibold">
                      Immobilier d&apos;Affaires • Plateau
                    </span>
                    <span className="text-xs font-mono text-[#7a736a]">p. 07</span>
                  </div>

                  <div className="relative h-36 rounded-xl overflow-hidden shadow-sm group">
                    <Image src={appart.images[0]} alt={appart.title} fill className="object-cover" />
                    <button
                      onClick={() => setActiveVideoProperty(appart)}
                      className="absolute inset-0 bg-black/30 flex items-center justify-center gap-1.5 text-white text-[10px] font-semibold"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#947346] text-[#947346]" />
                      <span>Visite Vidéo Bureaux</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] text-[#7a736a] block">Le Plateau • Réf: {appart.reference}</span>
                      {renderLiveBadge(appart)}
                    </div>
                    <h4 className="text-base font-display font-medium text-[#161412] leading-tight">
                      {appart.title}
                    </h4>
                  </div>

                  <div className="p-2.5 bg-[#fbfaf7] rounded-xl border border-[#e8e4dc] space-y-1 text-xs">
                    <span className="text-[9px] uppercase tracking-wider text-[#947346] font-bold block">
                      Rendement Locatif Brut
                    </span>
                    <div className="flex justify-between items-center text-[#161412]">
                      <span className="text-[#7a736a] text-[10px]">Bail commercial multinationale</span>
                      <strong className="text-[#1d382b] font-semibold text-xs">11.4% / an</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e8e4dc] flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-[#7a736a] block uppercase">Loyer Mensuel</span>
                    <span className="text-xs font-semibold text-[#161412] font-display">
                      {formatFCFA(appart.price)} <span className="text-[9px] font-normal">/ mois</span>
                    </span>
                  </div>
                  <a
                    href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je souhaite louer les Bureaux Plateau (Réf: ${appart.reference}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-[10px] font-semibold flex items-center gap-1 shadow transition-colors"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Réserver Visite</span>
                  </a>
                </div>
              </div>

              {/* PAGE 8 : DOS DE COUVERTURE RIGIDE */}
              <div className="mobile-book-page book-page bg-[#fbfaf7] text-[#161412] p-6 sm:p-8 flex flex-col justify-between border-l border-[#e8e4dc] shadow-2xl overflow-hidden" data-density="hard">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-2">
                    <div className="w-7 h-7 rounded-full bg-[#947346] flex items-center justify-center font-display font-bold text-white text-xs">
                      A
                    </div>
                    <span className="text-[9px] tracking-widest uppercase text-[#947346] font-semibold">
                      Conciergerie Privée
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-display font-medium text-[#161412] leading-tight">
                    Un accompagnement d&apos;exception pour vos acquisitions à Abidjan.
                  </h3>

                  <p className="text-[11px] text-[#68625c] font-light leading-relaxed">
                    Nos conseillers et juristes spécialisés sont à votre disposition pour organiser vos visites privées et vos audits cadastraux.
                  </p>

                  <div className="p-3 rounded-xl bg-[#f5f2eb] border border-[#e8e4dc] space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1d382b] flex items-center justify-center text-white font-bold text-xs">
                        A
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-[#161412] block">Aya : Conseillère Immobilière 24/7</span>
                        <span className="text-[9px] text-[#7a736a]">WhatsApp Direct Direction</span>
                      </div>
                    </div>
                    <a
                      href={whatsappGeneralUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 rounded-xl bg-[#191715] hover:bg-[#9E7431] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Échanger sur WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#e8e4dc] flex items-center justify-between text-[10px] text-[#7a736a]">
                  <span>Cocody Ambassades • Abidjan</span>
                  <span>© 2026 Agence Immo</span>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* MODE DÉFILEMENT CONTINU ULTRA-FLUIDE                                       */
          /* ========================================================================= */
          <div className="w-full h-full overflow-y-auto px-2 py-4 space-y-4 max-w-lg mx-auto">
            
            {/* Page 1 */}
            <div className="rounded-2xl p-5 border shadow-sm bg-white border-black/10 text-[#141210] space-y-3">
              <div className="flex justify-between items-center border-b pb-2 border-black/10">
                <span className="text-[10px] font-mono text-[#947346] uppercase tracking-wider font-semibold">Page 1 / 8 • Couverture</span>
                <span className="text-xs font-display font-bold">Édition 2026</span>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <Image src={villa.images[0]} alt={villa.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4 text-white">
                  <div>
                    <h3 className="font-display text-base font-semibold">L&apos;Immobilier d&apos;Exception & le Foncier Sécurisé</h3>
                    <p className="text-xs text-white/80">Cocody Riviera Golf • Marcory Zone 4 • Assinie</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 */}
            <div className="rounded-2xl p-5 border shadow-sm bg-white border-black/10 text-[#141210] space-y-3">
              <div className="flex justify-between items-center border-b pb-2 border-black/10">
                <span className="text-[10px] font-mono text-[#947346] uppercase tracking-wider font-semibold">Page 2 / 8 • Éditorial & Sécurité</span>
                <ShieldCheck className="w-4 h-4 text-[#9E7431]" />
              </div>
              <h4 className="font-display font-medium text-sm">Rigueur Juridique Notariée & Titres ACD</h4>
              <p className="text-xs text-[#4a453e] leading-relaxed">
                Toutes nos propriétés sont contrôlées auprès de la Conservation Foncière et du Ministère de la Construction. Zéro litige, 100% notarié.
              </p>
            </div>

            {/* Page 4 : Villa */}
            <div className="rounded-2xl p-5 border shadow-sm bg-white border-black/10 text-[#141210] space-y-3">
              <div className="flex justify-between items-center border-b pb-2 border-black/10">
                <span className="text-[10px] font-mono text-[#947346] uppercase tracking-wider font-semibold">Page 4 / 8 • Vente</span>
                <span className="text-xs font-mono font-bold text-[#1d382b]">ACD Vérifié</span>
              </div>
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <Image src={villa.images[0]} alt={villa.title} fill className="object-cover" />
                <button
                  onClick={() => setActiveVideoProperty(villa)}
                  className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/95 text-black text-xs font-semibold flex items-center gap-1 shadow"
                >
                  <Play className="w-3 h-3 fill-[#947346] text-[#947346]" />
                  <span>Vidéo 4K</span>
                </button>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display font-medium text-base">{villa.title}</h4>
                  <span className="text-xs text-[#7a736a]">Cocody Riviera Golf</span>
                </div>
                <strong className="text-sm font-display text-[#161412]">{formatFCFA(villa.price)}</strong>
              </div>
              <a
                href={getWhatsAppLink('2250788421920', `Bonjour, je souhaite visiter la Villa Riviera Golf (Réf: ${villa.reference}).`)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Demander Visite WhatsApp</span>
              </a>
            </div>

            {/* Page 5 : Penthouse */}
            <div className="rounded-2xl p-5 border shadow-sm bg-white border-black/10 text-[#141210] space-y-3">
              <div className="flex justify-between items-center border-b pb-2 border-black/10">
                <span className="text-[10px] font-mono text-[#947346] uppercase tracking-wider font-semibold">Page 5 / 8 • Location</span>
                <span className="text-xs font-mono font-bold text-[#947346]">Rooftop Privatif</span>
              </div>
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <Image src={penthouse.images[0]} alt={penthouse.title} fill className="object-cover" />
                <button
                  onClick={() => setActiveVideoProperty(penthouse)}
                  className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/95 text-black text-xs font-semibold flex items-center gap-1 shadow"
                >
                  <Play className="w-3 h-3 fill-[#947346] text-[#947346]" />
                  <span>Vidéo 4K</span>
                </button>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display font-medium text-base">{penthouse.title}</h4>
                  <span className="text-xs text-[#7a736a]">Marcory Zone 4</span>
                </div>
                <strong className="text-sm font-display text-[#161412]">{formatFCFA(penthouse.price)}/mois</strong>
              </div>
              <a
                href={getWhatsAppLink('2250788421920', `Bonjour, je souhaite louer le Penthouse Marcory Zone 4 (Réf: ${penthouse.reference}).`)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Demander Visite WhatsApp</span>
              </a>
            </div>

            {/* Page 6 : Terrain Bingerville */}
            <div className="rounded-2xl p-5 border shadow-sm bg-white border-black/10 text-[#141210] space-y-3">
              <div className="flex justify-between items-center border-b pb-2 border-black/10">
                <span className="text-[10px] font-mono text-[#947346] uppercase tracking-wider font-semibold">Page 6 / 8 • Foncier</span>
                <span className="text-xs font-mono font-bold text-[#1d382b]">ACD Délivré</span>
              </div>
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <Image src={terrain.images[0]} alt={terrain.title} fill className="object-cover" />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display font-medium text-base">{terrain.title}</h4>
                  <span className="text-xs text-[#7a736a]">Bingerville Nouveau Goudron • {terrain.surface} m²</span>
                </div>
                <strong className="text-sm font-display text-[#161412]">{formatFCFA(terrain.price)}</strong>
              </div>
              <a
                href={getWhatsAppLink('2250788421920', `Bonjour, je souhaite visiter le Terrain Bingerville (Réf: ${terrain.reference}).`)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Réserver Visite Terrain</span>
              </a>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 3. DOCK VIP INFÉRIEUR : PRISE DE CONTACT RAPIDE SANS SORTIR DU FLIPBOOK    */}
      {/* ========================================================================= */}
      <footer className="h-16 px-3 sm:px-4 bg-white/95 backdrop-blur-xl border-t border-[#EAE5DC] flex items-center justify-between z-30 shrink-0">
        
        {/* Contact WhatsApp Direction 1-Clic */}
        <a
          href={whatsappGeneralUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 mr-2 py-2.5 px-3.5 rounded-full bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer truncate"
        >
          <MessageCircle className="w-4 h-4 text-[#9E7431] shrink-0" />
          <span className="truncate">Visiter une Demeure (WhatsApp)</span>
        </a>

        {/* Appel Téléphonique */}
        <a
          href="tel:+2250788421920"
          className="p-2.5 rounded-full bg-[#FAF8F5] hover:bg-[#F2EFE9] text-[#191715] border border-[#DDD7CC] transition-colors shrink-0 shadow-xs"
          title="Appeler la direction"
        >
          <Phone className="w-4 h-4 text-[#9E7431]" />
        </a>

      </footer>

      {/* ========================================================================= */}
      {/* MODAL VIDÉO IMMERSIVE 4K & DRONE SUR MOBILE                                */}
      {/* ========================================================================= */}
      {activeVideoProperty && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#161412] text-white rounded-3xl border border-[#302a24] max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-4 py-3 border-b border-[#302a24] flex items-center justify-between">
              <span className="text-xs font-display font-medium text-white truncate pr-2">
                {activeVideoProperty.title}
              </span>
              <button
                onClick={() => setActiveVideoProperty(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <Image
                src={activeVideoProperty.image || activeVideoProperty.images?.[0] || villa.images[0]}
                alt={activeVideoProperty.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 fill-[#947346] text-[#947346] ml-0.5" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-white/80 font-light">
                Survol drone et visite guidée des espaces de vie à Abidjan.
              </p>
              <a
                href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je viens de voir la vidéo 4K de ${activeVideoProperty.title}. Je souhaite visiter.`)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#191715] hover:bg-[#9E7431] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contacter la direction sur WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PARTAGE DU FLIPBOOK (QR CODE, LIEN DIRECT, WHATSAPP) */}
      <CatalogueShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

    </div>
  );
}
