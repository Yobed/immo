'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CatalogueShareModal from '@/components/CatalogueShareModal';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { Property } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { 
  ChevronLeft, ChevronRight, Download, Share2, 
  Maximize2, Minimize2, ShieldCheck, MapPin, 
  Bed, Bath, ArrowUpRight, Award, Volume2, VolumeX, Hand,
  Play, Video, ExternalLink, X, MessageCircle, Compass, FileText, CheckCircle2
} from 'lucide-react';

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

export default function CatalogueFlipbookPage() {
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const pageFlipInstance = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(8);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // État de la modal vidéo immersive
  const [activeVideoProperty, setActiveVideoProperty] = useState<any>(null);

  const { properties } = useLiveProperties();

  const villa = properties.find((p) => p.reference === 'VIL-RG-2026') || INITIAL_PROPERTIES[0];
  const penthouse = properties.find((p) => p.reference === 'PNT-Z4-104') || INITIAL_PROPERTIES[1];
  const terrain = properties.find((p) => p.reference === 'TER-BG-600') || INITIAL_PROPERTIES[2];
  const appart = properties.find((p) => p.reference === 'APP-PL-04') || INITIAL_PROPERTIES[3];

  const renderLiveBadge = (property: Property) => {
    if (property.status === 'cleaning' || property.concierge_status === 'cleaning') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#6E665B] border border-[#EAE5DC] text-[10px] font-medium shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431]" />
          <span>Préparation Hôtelière</span>
        </span>
      );
    }
    if (property.status === 'reserved' || property.concierge_status === 'reserved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#6E665B] border border-[#EAE5DC] text-[10px] font-medium shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#191715]" />
          <span>Réservé • Visite en cours</span>
        </span>
      );
    }
    if (property.status === 'under_offer') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#6E665B] border border-[#EAE5DC] text-[10px] font-medium shadow-2xs">
          <span>Sous Offre</span>
        </span>
      );
    }
    if (property.status === 'rented' || property.concierge_status === 'occupied') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#6E665B] border border-[#EAE5DC] text-[10px] font-medium shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#191715]" />
          <span>Occupé (Bail actif)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[#191715] border border-[#EAE5DC] text-[10px] font-medium shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431]" />
        <span>Disponible Immédiatement</span>
      </span>
    );
  };

  useEffect(() => {
    let flipInstance: any = null;

    async function initPageFlip() {
      if (!bookContainerRef.current) return;

      try {
        const { PageFlip } = await import('page-flip');

        flipInstance = new PageFlip(bookContainerRef.current, {
          width: 530,
          height: 720,
          size: 'stretch',
          minWidth: 320,
          maxWidth: 680,
          minHeight: 440,
          maxHeight: 900,
          maxShadowOpacity: 0.65,
          showCover: true,
          mobileScrollSupport: false,
          useMouseEvents: true,
          flippingTime: 850,
        });

        const pageElements = bookContainerRef.current.querySelectorAll('.book-page');
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
        console.error('Erreur initialisation StPageFlip:', err);
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
  }, []);

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

  const whatsappShareUrl = getWhatsAppLink(
    '2250788421920',
    `Bonjour Cabinet Immobilier Abidjan, je viens de feuilleter votre catalogue numérique. Je souhaite échanger sur une opportunité d'investissement.`
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#191715] flex flex-col font-sans antialiased selection:bg-[#C8A97E] selection:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 pt-24 pb-16 w-full flex flex-col space-y-6">
        
        {/* BARRE D'OUTILS SUPÉRIEURE DU CATALOGUE */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] px-6 py-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#191715] text-white flex items-center justify-center font-display font-bold text-sm shadow-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E7431] font-semibold">
                  Édition Annuelle 2026
                </span>
                <span className="text-[10px] bg-white text-[#191715] px-2.5 py-0.5 rounded-full font-mono border border-[#EAE5DC] flex items-center gap-1 font-medium shadow-2xs">
                  <Hand className="w-3 h-3 text-[#9E7431]" />
                  Feuilletage 3D &amp; Vidéos Intégrées
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-display font-medium text-[#191715]">
                Catalogue Numérique d&apos;Exception &amp; Foncier Sécurisé
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#7A746B] hidden md:inline-block font-mono mr-2">
              Page {currentPage + 1} / {totalPages}
            </span>

            {/* Son On/Off */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-[#FBF8F1] text-[#9E7431] border-[#E8DFD1]' 
                  : 'bg-white text-[#8C8275] border-[#EAE5DC] hover:bg-[#FAF8F5]'
              }`}
              title={soundEnabled ? 'Son de papier activé' : 'Son désactivé'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Télécharger PDF A4 */}
            <a
              href="/brochures/CATALOGUE-PRESTIGE-ABIDJAN-2026.pdf"
              download="Catalogue-Prestige-Abidjan-2026.pdf"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#191715] border border-[#DDD7CC] text-xs font-mono transition-colors shadow-xs"
              title="Télécharger la version PDF haute définition"
            >
              <Download className="w-3.5 h-3.5 text-[#9E7431]" />
              <span className="hidden sm:inline">Télécharger PDF</span>
            </a>

            {/* Partager le catalogue (Modal externe avec QR Code & WhatsApp) */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Partager le catalogue (QR Code, WhatsApp, Lien Mobile)"
            >
              <Share2 className="w-3.5 h-3.5 text-[#9E7431]" />
              <span className="hidden sm:inline">Partager</span>
            </button>

            {/* Plein écran */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#191715] border border-[#DDD7CC] transition-colors cursor-pointer shadow-xs"
              title="Plein écran"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* GUIDE INTERACTIF DES LIENS */}
        <div className="bg-white rounded-xl border border-[#EAE5DC] px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-[#6E665B] gap-2 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-[#191715]">
              <span className="w-2 h-2 rounded-full bg-[#9E7431]" />
              Hotspots interactifs dans les pages :
            </span>
            <span className="inline-flex items-center gap-1 text-[#9E7431]">
              <MapPin className="w-3 h-3" /> Localisation GPS
            </span>
            <span className="inline-flex items-center gap-1 text-[#9E7431]">
              <Video className="w-3 h-3" /> Visite Vidéo &amp; Drone 4K
            </span>
            <span className="inline-flex items-center gap-1 text-[#9E7431] font-medium">
              <ShieldCheck className="w-3 h-3 text-[#9E7431]" /> Certificat Foncier ACD
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[11px] text-[#8C8275]">
            Coin de page tactile • ◀ Flèche Gauche / Droite ▶
          </span>
        </div>

        {/* THÉÂTRE DE LECTURE 3D RÉALISTE */}
        <div className="relative bg-[#F4F1EA] rounded-3xl p-4 sm:p-8 lg:p-12 shadow-[0_15px_40px_rgba(0,0,0,0.05)] border border-[#E5E0D6] overflow-hidden flex items-center justify-center min-h-[660px] lg:min-h-[780px]">
          
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.6)_0%,_transparent_75%)] pointer-events-none" />

          {/* Indicateur de chargement du Flipbook 3D */}
          {!isReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-[#FAF8F5]/90 backdrop-blur-xs transition-opacity">
              <div className="w-10 h-10 rounded-full border-2 border-[#DDD7CC] border-t-[#9E7431] animate-spin mb-3" />
              <span className="text-xs font-mono text-[#9E7431] tracking-widest uppercase font-semibold">
                Ouverture du Catalogue 3D Prestige...
              </span>
            </div>
          )}

          {/* Bouton Précédent */}
          <button
            onClick={flipPrev}
            className="absolute left-3 sm:left-6 z-30 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#191715] border border-[#DDD7CC] shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            aria-label="Page précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Bouton Suivant */}
          <button
            onClick={flipNext}
            className="absolute right-3 sm:right-6 z-30 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#191715] border border-[#DDD7CC] shadow-md flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
            aria-label="Page suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* LIVRE INTERACTIF (StPageFlip) */}
          <div 
            ref={bookContainerRef} 
            className="flipbook-root relative mx-auto my-auto select-none"
            style={{ touchAction: 'none' }}
          >
            
            {/* ======================================================== */}
            {/* PAGE 1 : COUVERTURE RIGIDE DU LIVRE                      */}
            {/* ======================================================== */}
            <div className="book-page bg-[#FAF8F5] p-6 sm:p-7 flex flex-col justify-between border-r border-[#EAE5DC] shadow-2xl overflow-hidden" data-density="hard">
              <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[#9E7431] font-semibold block">
                    Édition Annuelle de Référence
                  </span>
                  <span className="font-display text-lg text-[#161412] font-semibold">
                    Agence Immo • Abidjan
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full border border-[#9E7431]/40 flex items-center justify-center font-display font-bold text-xs text-[#9E7431]">
                  2026
                </div>
              </div>

              {/* Photo avec Bouton Hotspot Visite Vidéo Intro */}
              <div className="relative flex-1 my-4 rounded-xl overflow-hidden shadow-inner group">
                <Image
                  src={villa.images[0]}
                  alt="Catalogue de Prestige Immobilier Abidjan"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
                
                {/* Hotspot Vidéo de Présentation sur la couverture */}
                <button
                  onClick={() => setActiveVideoProperty({
                    title: "L'Immobilier d'Exception à Abidjan : Film Institutionnel 2026",
                    district: "Abidjan Prestige",
                    reference: "CAT-PRESTIGE",
                    price: 450000000,
                    operation: "sale",
                    videoType: "drone_presentation",
                    image: villa.images[0]
                  })}
                  className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#161412] text-[10px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-transform hover:scale-105"
                >
                  <Play className="w-3 h-3 fill-[#9E7431] text-[#9E7431]" />
                  <span>Vidéo d&apos;ambiance 4K</span>
                </button>

                <div className="absolute bottom-5 left-5 right-5 text-white space-y-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-[#C8A97E] font-semibold block">
                    Portefeuille Exclusif
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-medium leading-tight">
                    L&apos;Immobilier d&apos;Exception & le Foncier Sécurisé
                  </h2>
                  <p className="text-[11px] text-white/80 font-light">
                    Cocody • Marcory Zone 4 • Assinie-Mafia • Bingerville
                  </p>

                  {/* Hotspots interactifs sur la couverture */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Cocody+Marcory+Bingerville+Abidjan"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/50 hover:bg-black/80 text-white text-[9px] font-medium backdrop-blur-sm border border-white/20 transition-colors"
                    >
                      <MapPin className="w-2.5 h-2.5 text-[#C8A97E]" />
                      <span>Carte Abidjan</span>
                      <ExternalLink className="w-2 h-2 opacity-70" />
                    </a>

                    <Link
                      href="/biens"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-[9px] font-medium backdrop-blur-sm border border-white/20 transition-colors"
                    >
                      <span>Voir les 4 mandats</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between pt-2.5 border-t border-[#EAE5DC]">
                <div>
                  <span className="text-[9px] text-[#8C8275] block uppercase tracking-wider">
                    Certifié 100% Notarié
                  </span>
                  <span className="text-[11px] font-semibold text-[#161412]">
                    Sécurité Juridique ACD Vérifiée
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#9E7431] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#EAE5DC]">
                  Tourner la page ➔
                </span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PAGE 2 : ÉDITORIAL & LIENS JURIDIQUES                    */}
            {/* ======================================================== */}
            <div className="book-page bg-[#FAF8F5] p-6 sm:p-7 flex flex-col justify-between border-r border-[#EAE5DC] shadow-inner overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#9E7431] font-semibold">
                    Éditorial
                  </span>
                  <span className="text-xs font-mono text-[#8C8275]">p. 02</span>
                </div>

                <h3 className="text-base sm:text-lg font-display font-medium text-[#161412] leading-snug">
                  « Redéfinir l&apos;investissement immobilier ivoirien par la transparence absolue. »
                </h3>

                <div className="space-y-2 text-xs text-[#524B43] font-light leading-relaxed">
                  <p>
                    Dans un marché abidjanais en pleine effervescence, la sécurité juridique n&apos;est pas une option : c&apos;est le fondement de la pérennité patrimoniale.
                  </p>
                  <p>
                    Chaque bien fait l&apos;objet d&apos;un audit préalable rigoureux auprès de la Conservation Foncière et du Ministère de la Construction. Nous ne négocions que des actifs dotés de l&apos;Arrêté de Concession Définitive (ACD) ou d&apos;un Titre Foncier inattaquable.
                  </p>
                </div>

                {/* Hotspot Rigueur Notariée Cliquable (Palette 3 Couleurs Pure) */}
                <div className="p-3 rounded-xl bg-white border border-[#EAE5DC] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#161412]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#9E7431]" />
                      <span>Rigueur Juridique Notariée</span>
                    </div>
                    <span className="text-[9px] bg-[#FAF8F5] text-[#9E7431] border border-[#EAE5DC] px-2 py-0.5 rounded-full font-bold tracking-wider">
                      100% ACD VÉRIFIÉ
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6E665B] leading-normal">
                    Transactions scellées par acte authentique avec comptes séquestres notariés agréés.
                  </p>
                  <div className="pt-0.5">
                    <Link
                      href="/estimer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9E7431] hover:underline"
                    >
                      <span>Faire auditer la régularité d&apos;un titre foncier</span>
                      <ArrowUpRight className="w-3 h-3 text-[#9E7431]" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#EAE5DC] flex items-center justify-between text-xs text-[#8C8275]">
                <span>Cabinet de Conseil Immobilier</span>
                <span className="font-display italic text-[#161412] font-medium">La Direction</span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PAGE 3 : CARTOGRAPHIE AVEC LIENS GOOGLE MAPS             */}
            {/* ======================================================== */}
            <div className="book-page bg-white p-6 sm:p-7 flex flex-col justify-between border-l border-[#EAE5DC] shadow-inner overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#9E7431] font-semibold">
                    Cartographie des Quartiers Clés
                  </span>
                  <span className="text-xs font-mono text-[#8C8275]">p. 03</span>
                </div>

                <div className="space-y-2">
                  {/* Cocody */}
                  <div className="p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:border-[#9E7431] transition-colors">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-xs text-[#161412]">Cocody (Ambassades, Riviera)</span>
                      <span className="text-[11px] font-mono font-semibold text-[#9E7431]">8.5% / an</span>
                    </div>
                    <p className="text-[10px] text-[#6E665B] leading-tight line-clamp-1">
                      Résidences de diplomates, cadres dirigeants et ambassades.
                    </p>
                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#EAE5DC]/80 text-[9px]">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Riviera+Golf+Cocody+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#9E7431] hover:underline"
                      >
                        <MapPin className="w-2.5 h-2.5 text-[#9E7431]" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-2 h-2 text-[#9E7431]" />
                      </a>
                      <span className="text-[#DDD7CC]">•</span>
                      <Link href="/biens?district=Cocody" className="text-[#161412] hover:text-[#9E7431]">
                        Voir biens Cocody (1)
                      </Link>
                    </div>
                  </div>

                  {/* Marcory Zone 4 */}
                  <div className="p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:border-[#9E7431] transition-colors">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-xs text-[#161412]">Marcory Zone 4 / Biétry</span>
                      <span className="text-[11px] font-mono font-semibold text-[#9E7431]">10.2% / an</span>
                    </div>
                    <p className="text-[10px] text-[#6E665B] leading-tight line-clamp-1">
                      Penthouses recherchés par les expatriés et banques d&apos;affaires.
                    </p>
                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#EAE5DC]/80 text-[9px]">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Zone+4+Marcory+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#9E7431] hover:underline"
                      >
                        <MapPin className="w-2.5 h-2.5 text-[#9E7431]" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-2 h-2 text-[#9E7431]" />
                      </a>
                      <span className="text-[#DDD7CC]">•</span>
                      <Link href="/biens?district=Marcory" className="text-[#161412] hover:text-[#9E7431]">
                        Voir biens Zone 4 (1)
                      </Link>
                    </div>
                  </div>

                  {/* Bingerville */}
                  <div className="p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:border-[#9E7431] transition-colors">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-xs text-[#161412]">Bingerville (Nouveau Goudron)</span>
                      <span className="text-[11px] font-mono font-semibold text-[#9E7431]">+18% plus-value</span>
                    </div>
                    <p className="text-[10px] text-[#6E665B] leading-tight line-clamp-1">
                      Parcelles foncières titrées en plein essor urbain.
                    </p>
                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#EAE5DC]/80 text-[9px]">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Bingerville+Nouveau+Goudron+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#9E7431] hover:underline"
                      >
                        <MapPin className="w-2.5 h-2.5 text-[#9E7431]" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-2 h-2 text-[#9E7431]" />
                      </a>
                      <span className="text-[#DDD7CC]">•</span>
                      <Link href="/biens?district=Bingerville" className="text-[#161412] hover:text-[#9E7431]">
                        Voir terrains Bingerville (1)
                      </Link>
                    </div>
                  </div>

                  {/* Assinie */}
                  <div className="p-2.5 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5] hover:border-[#9E7431] transition-colors">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-semibold text-xs text-[#161412]">Assinie-Mafia (Bord Lagune)</span>
                      <span className="text-[11px] font-mono font-semibold text-[#9E7431]">12.8% / an</span>
                    </div>
                    <p className="text-[10px] text-[#6E665B] leading-tight line-clamp-1">
                      Villas balnéaires de villégiature et rendements week-end.
                    </p>
                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#EAE5DC]/80 text-[9px]">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Assinie-Mafia+Cote+d'Ivoire"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#9E7431] hover:underline"
                      >
                        <MapPin className="w-2.5 h-2.5 text-[#9E7431]" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-2 h-2 text-[#9E7431]" />
                      </a>
                      <span className="text-[#DDD7CC]">•</span>
                      <Link href="/biens?district=Assinie" className="text-[#161412] hover:text-[#9E7431]">
                        Voir biens Assinie (1)
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#EAE5DC] flex items-center justify-between text-[11px] text-[#8C8275]">
                <span>Baromètre Foncier 2026</span>
                <span className="font-mono text-[#9E7431] font-semibold">Chambre Notariale</span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PAGE 4 : VILLA RIVIERA GOLF (MAP + VIDÉO + ACD)          */}
            {/* ======================================================== */}
            <div className="book-page bg-[#FAF8F5] p-6 sm:p-7 flex flex-col justify-between border-r border-[#EAE5DC] shadow-inner overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#9E7431] font-semibold">
                    Villa Contemporaine • Vente
                  </span>
                  <span className="text-xs font-mono text-[#8C8275]">p. 04</span>
                </div>

                {/* Photo avec HOTSPOTS VIDÉO & MAP CLIQUABLES */}
                <div className="relative h-44 rounded-xl overflow-hidden shadow-sm group">
                  <Image src={villa.images[0]} alt={villa.title} fill className="object-cover" />
                  
                  {/* Badge ACD */}
                  <div className="absolute top-2.5 left-2.5 bg-[#191715] text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow border border-white/20">
                    <ShieldCheck className="w-3 h-3 text-[#9E7431]" />
                    <span>ACD Ministère Vérifié</span>
                  </div>

                  {/* Hotspots interactifs sur la photo */}
                  <div className="absolute inset-0 bg-black/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveVideoProperty(villa)}
                      className="px-3 py-1.5 rounded-full bg-white text-[#161412] text-[10px] font-semibold flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform"
                    >
                      <Play className="w-3 h-3 fill-[#9E7431] text-[#9E7431]" />
                      <span>Visite Vidéo 4K</span>
                    </button>

                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Riviera+Golf+Cocody+Abidjan"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full bg-black/70 text-white text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-sm border border-white/30 hover:bg-black/90 transition-colors"
                    >
                      <MapPin className="w-3 h-3 text-[#C8A97E]" />
                      <span>Map GPS</span>
                    </a>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#8C8275]">Cocody Riviera Golf • Réf: {villa.reference}</span>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Riviera+Golf+Cocody+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[10px] text-[#9E7431] hover:underline"
                      >
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        <span>Localisation</span>
                      </a>
                    </div>
                    {renderLiveBadge(villa)}
                  </div>
                  <h4 className="text-lg font-display font-medium text-[#161412] leading-tight">
                    {villa.title}
                  </h4>
                </div>

                <p className="text-xs text-[#524B43] font-light leading-relaxed line-clamp-2">
                  {villa.description}
                </p>

                {/* Spécifications & Actions Rapides */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-xl border border-[#EAE5DC] text-center text-xs">
                  <div>
                    <span className="text-[9px] text-[#8C8275] block">Surface</span>
                    <strong className="text-[#161412] font-semibold">{villa.surface} m²</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8C8275] block">Chambres</span>
                    <strong className="text-[#161412] font-semibold">{villa.bedrooms} suites</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8C8275] block">Piscine</span>
                    <strong className="text-[#161412] font-semibold">Débordement</strong>
                  </div>
                </div>

                {/* Liens Hotspots du bas de page */}
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    onClick={() => setActiveVideoProperty(villa)}
                    className="inline-flex items-center gap-1 text-[#9E7431] font-semibold hover:underline"
                  >
                    <Video className="w-3 h-3" />
                    <span>Lancer la vidéo</span>
                  </button>
                  <span className="text-[#DDD7CC]">•</span>
                  <a
                    href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je souhaite visiter la Villa Riviera Golf (Réf: ${villa.reference}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#9E7431] font-semibold hover:underline"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Réserver visite WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#EAE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-[#8C8275] block uppercase">Prix de Vente</span>
                  <span className="text-sm font-semibold text-[#161412] font-display">
                    {formatFCFA(villa.price)}
                  </span>
                </div>
                <Link
                  href={`/biens/${villa.id}`}
                  className="px-3 py-1 rounded-full bg-[#161412] hover:bg-[#9E7431] text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Dossier Complet</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PAGE 5 : PENTHOUSE LAGUNA (MAP + VIDÉO + ACD)            */}
            {/* ======================================================== */}
            <div className="book-page bg-white p-6 sm:p-7 flex flex-col justify-between border-l border-[#EAE5DC] shadow-inner overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#9E7431] font-semibold">
                    Penthouse de Prestige • Location
                  </span>
                  <span className="text-xs font-mono text-[#8C8275]">p. 05</span>
                </div>

                <div className="relative h-44 rounded-xl overflow-hidden shadow-sm group">
                  <Image src={penthouse.images[0]} alt={penthouse.title} fill className="object-cover" />
                  
                  <div className="absolute top-2.5 left-2.5 bg-[#9E7431] text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Award className="w-3 h-3" />
                    Rooftop Privatif
                  </div>

                  <div className="absolute inset-0 bg-black/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveVideoProperty(penthouse)}
                      className="px-3 py-1.5 rounded-full bg-white text-[#161412] text-[10px] font-semibold flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform"
                    >
                      <Play className="w-3 h-3 fill-[#9E7431] text-[#9E7431]" />
                      <span>Visite Vidéo 4K</span>
                    </button>

                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Zone+4+Marcory+Abidjan"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full bg-black/70 text-white text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-sm border border-white/30 hover:bg-black/90 transition-colors"
                    >
                      <MapPin className="w-3 h-3 text-[#C8A97E]" />
                      <span>Map GPS</span>
                    </a>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#8C8275]">Marcory Zone 4 • Réf: {penthouse.reference}</span>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Zone+4+Marcory+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[10px] text-[#9E7431] hover:underline"
                      >
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        <span>Localisation</span>
                      </a>
                    </div>
                    {renderLiveBadge(penthouse)}
                  </div>
                  <h4 className="text-lg font-display font-medium text-[#161412] leading-tight">
                    {penthouse.title}
                  </h4>
                </div>

                <p className="text-xs text-[#524B43] font-light leading-relaxed line-clamp-2">
                  {penthouse.description}
                </p>

                <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] text-center text-xs">
                  <div>
                    <span className="text-[9px] text-[#8C8275] block">Surface</span>
                    <strong className="text-[#161412] font-semibold">{penthouse.surface} m²</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8C8275] block">Chambres</span>
                    <strong className="text-[#161412] font-semibold">{penthouse.bedrooms} pièces</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8C8275] block">Vue</span>
                    <strong className="text-[#161412] font-semibold">Lagune Ébrié</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    onClick={() => setActiveVideoProperty(penthouse)}
                    className="inline-flex items-center gap-1 text-[#9E7431] font-semibold hover:underline"
                  >
                    <Video className="w-3 h-3" />
                    <span>Lancer la vidéo</span>
                  </button>
                  <span className="text-[#DDD7CC]">•</span>
                  <a
                    href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je souhaite visiter le Penthouse Zone 4 (Réf: ${penthouse.reference}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#9E7431] font-semibold hover:underline"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Réserver visite WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#EAE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-[#8C8275] block uppercase">Loyer Mensuel</span>
                  <span className="text-sm font-semibold text-[#161412] font-display">
                    {formatFCFA(penthouse.price)} <span className="text-[10px] text-[#8C8275] font-normal">/ mois</span>
                  </span>
                </div>
                <Link
                  href={`/biens/${penthouse.id}`}
                  className="px-3 py-1 rounded-full bg-[#161412] hover:bg-[#9E7431] text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Dossier Complet</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PAGE 6 : TERRAIN BINGERVILLE (MAP + CADASTRE + ACD)      */}
            {/* ======================================================== */}
            <div className="book-page bg-[#FAF8F5] p-6 sm:p-7 flex flex-col justify-between border-r border-[#EAE5DC] shadow-inner overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#9E7431] font-semibold">
                    Foncier Titré Sécurisé • ACD
                  </span>
                  <span className="text-xs font-mono text-[#8C8275]">p. 06</span>
                </div>

                <div className="relative h-44 rounded-xl overflow-hidden shadow-sm group">
                  <Image src={terrain.images[0]} alt={terrain.title} fill className="object-cover" />
                  
                  <div className="absolute top-2.5 left-2.5 bg-[#191715] text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow border border-white/20">
                    <ShieldCheck className="w-3 h-3 text-[#9E7431]" />
                    <span>Borné & ACD Ministère</span>
                  </div>

                  <div className="absolute inset-0 bg-black/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Bingerville+Nouveau+Goudron+Abidjan"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full bg-white text-[#161412] text-[10px] font-semibold flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform"
                    >
                      <MapPin className="w-3 h-3 text-[#9E7431]" />
                      <span>Localisation Satellite</span>
                    </a>

                    <button
                      onClick={() => setActiveVideoProperty(terrain)}
                      className="px-3 py-1.5 rounded-full bg-black/70 text-white text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-sm border border-white/30 hover:bg-black/90 transition-colors"
                    >
                      <Video className="w-3 h-3 text-[#C8A97E]" />
                      <span>Vue Aérienne</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#8C8275]">Bingerville Nouveau Goudron • Réf: {terrain.reference}</span>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Bingerville+Nouveau+Goudron+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[10px] text-[#9E7431] hover:underline"
                      >
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        <span>Voir sur la carte</span>
                      </a>
                    </div>
                    {renderLiveBadge(terrain)}
                  </div>
                  <h4 className="text-lg font-display font-medium text-[#161412] leading-tight">
                    {terrain.title}
                  </h4>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-[#EAE5DC] space-y-1 text-xs">
                  <div className="flex justify-between text-[#161412]">
                    <span className="text-[#8C8275]">Superficie totale</span>
                    <strong className="font-semibold">{terrain.surface} m²</strong>
                  </div>
                  <div className="flex justify-between text-[#161412]">
                    <span className="text-[#8C8275]">Statut légal</span>
                    <strong className="text-[#9E7431] font-semibold">ACD délivré (Arrêté Ministériel)</strong>
                  </div>
                  <div className="flex justify-between text-[#161412]">
                    <span className="text-[#8C8275]">Prix au m²</span>
                    <strong className="font-semibold">{formatFCFA(Math.round(terrain.price / terrain.surface))} / m²</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Bingerville+Nouveau+Goudron+Abidjan"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#9E7431] font-semibold hover:underline"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Itinéraire Google Maps</span>
                  </a>
                  <span className="text-[#DDD7CC]">•</span>
                  <a
                    href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je souhaite visiter le Terrain Bingerville ACD (Réf: ${terrain.reference}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#9E7431] font-semibold hover:underline"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Visite terrain</span>
                  </a>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#EAE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-[#8C8275] block uppercase">Prix du Terrain</span>
                  <span className="text-sm font-semibold text-[#161412] font-display">
                    {formatFCFA(terrain.price)}
                  </span>
                </div>
                <Link
                  href={`/biens/${terrain.id}`}
                  className="px-3 py-1 rounded-full bg-[#161412] hover:bg-[#9E7431] text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Dossier Foncier</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PAGE 7 : IMMOBILIER D'AFFAIRES (MAP + VIDÉO + RENDEMENT)  */}
            {/* ======================================================== */}
            <div className="book-page bg-white p-6 sm:p-7 flex flex-col justify-between border-l border-[#EAE5DC] shadow-inner overflow-hidden">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#9E7431] font-semibold">
                    Immobilier d&apos;Affaires • Le Plateau
                  </span>
                  <span className="text-xs font-mono text-[#8C8275]">p. 07</span>
                </div>

                <div className="relative h-44 rounded-xl overflow-hidden shadow-sm group">
                  <Image src={appart.images[0]} alt={appart.title} fill className="object-cover" />
                  
                  <div className="absolute top-2.5 left-2.5 bg-[#161412] text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    Bureaux & Standing
                  </div>

                  <div className="absolute inset-0 bg-black/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveVideoProperty(appart)}
                      className="px-3 py-1.5 rounded-full bg-white text-[#161412] text-[10px] font-semibold flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform"
                    >
                      <Play className="w-3 h-3 fill-[#9E7431] text-[#9E7431]" />
                      <span>Visite Vidéo</span>
                    </button>

                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Le+Plateau+Abidjan"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full bg-black/70 text-white text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-sm border border-white/30 hover:bg-black/90 transition-colors"
                    >
                      <MapPin className="w-3 h-3 text-[#C8A97E]" />
                      <span>Map Plateau</span>
                    </a>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#8C8275]">Plateau Centre des Affaires • Réf: {appart.reference}</span>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Le+Plateau+Abidjan"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[10px] text-[#9E7431] hover:underline"
                      >
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        <span>Plan d&apos;accès</span>
                      </a>
                    </div>
                    {renderLiveBadge(appart)}
                  </div>
                  <h4 className="text-lg font-display font-medium text-[#161412] leading-tight">
                    {appart.title}
                  </h4>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] space-y-1.5 text-xs">
                  <span className="text-[10px] uppercase tracking-widest text-[#9E7431] font-bold block">
                    Synthèse de Rendement Locatif
                  </span>
                  <p className="text-[10px] text-[#524B43] font-light leading-relaxed">
                    Idéal pour siège social avec bail commercial sécurisé auprès de multinationales.
                  </p>
                  <div className="flex justify-between items-center pt-1 border-t border-[#EAE5DC]">
                    <span className="text-[#8C8275]">Rendement brut</span>
                    <strong className="text-[#9E7431] font-semibold">11.4% / an</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    onClick={() => setActiveVideoProperty(appart)}
                    className="inline-flex items-center gap-1 text-[#9E7431] font-semibold hover:underline"
                  >
                    <Video className="w-3 h-3" />
                    <span>Vidéo des espaces</span>
                  </button>
                  <span className="text-[#DDD7CC]">•</span>
                  <a
                    href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je souhaite visiter les Bureaux Plateau (Réf: ${appart.reference}).`)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#9E7431] font-semibold hover:underline"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Réserver visite</span>
                  </a>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#EAE5DC] flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-[#8C8275] block uppercase">Loyer Mensuel</span>
                  <span className="text-sm font-semibold text-[#161412] font-display">
                    {formatFCFA(appart.price)} <span className="text-[10px] text-[#8C8275] font-normal">/ mois</span>
                  </span>
                </div>
                <Link
                  href={`/biens/${appart.id}`}
                  className="px-3 py-1 rounded-full bg-[#161412] hover:bg-[#9E7431] text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Dossier Complet</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PAGE 8 : DOS DE COUVERTURE RIGIDE (HARD BACK COVER)     */}
            {/* ======================================================== */}
            <div className="book-page bg-[#FAF8F5] text-[#161412] p-6 sm:p-7 flex flex-col justify-between border-l border-[#EAE5DC] shadow-2xl overflow-hidden" data-density="hard">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-3">
                  <div className="w-8 h-8 rounded-full bg-[#9E7431] flex items-center justify-center font-display font-bold text-white text-xs">
                    A
                  </div>
                  <span className="text-[10px] tracking-widest uppercase text-[#9E7431] font-semibold">
                    Conciergerie Privée
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-medium text-[#161412] leading-tight">
                  Un accompagnement d&apos;exception pour vos acquisitions à Abidjan.
                </h3>

                <p className="text-xs text-[#6E665B] font-light leading-relaxed">
                  Notre équipe de conseillers et juristes spécialisés se tient à votre entière disposition pour organiser vos visites privées et vos audits cadastraux.
                </p>

                <div className="p-3.5 rounded-xl bg-white border border-[#EAE5DC] space-y-2.5 shadow-2xs">
                  <span className="text-[10px] uppercase tracking-wider text-[#9E7431] font-semibold block">
                    Contactez Notre Conseillère IA & Concierge :
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#191715] flex items-center justify-center text-white font-bold text-xs">
                      A
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-[#191715] block">Aya : Conseillère Immobilière 24/7</span>
                      <span className="text-[10px] text-[#8C8275]">Disponible immédiatement sur WhatsApp</span>
                    </div>
                  </div>
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full mt-1 py-2 rounded-xl bg-[#191715] hover:bg-[#9E7431] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Lancer la conversation WhatsApp</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Liens rapides du dos de couverture */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Cocody+Ambassades+Abidjan"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#9E7431] border border-[#EAE5DC] text-[10px] transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Nos bureaux Cocody Ambassades (GPS)</span>
                  </a>

                  <Link
                    href="/biens"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#161412] border border-[#EAE5DC] text-[10px] transition-colors"
                  >
                    <FileText className="w-3 h-3 text-[#9E7431]" />
                    <span>Tous les mandats disponibles</span>
                  </Link>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#EAE5DC] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#8C8275]">
                <span>Cocody Ambassades • Abidjan, Côte d&apos;Ivoire</span>
                <span>© 2026 Agence Immo</span>
              </div>
            </div>

          </div>
        </div>

        {/* CAROUSEL DE MINIATURES DES PAGES EN BAS */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] p-3 shadow-warm-xs flex items-center justify-center gap-2.5 overflow-x-auto">
          {[
            { page: 0, label: 'Couverture', desc: 'p. 1' },
            { page: 1, label: 'Éditorial', desc: 'p. 2' },
            { page: 2, label: 'Cartographie', desc: 'p. 3' },
            { page: 3, label: 'Villa Riviera', desc: 'p. 4' },
            { page: 4, label: 'Penthouse Zone 4', desc: 'p. 5' },
            { page: 5, label: 'Terrain Bingerville', desc: 'p. 6' },
            { page: 6, label: 'Bureaux Plateau', desc: 'p. 7' },
            { page: 7, label: 'Dos & Conciergerie', desc: 'p. 8' },
          ].map((item) => (
            <button
              key={item.page}
              onClick={() => jumpToPage(item.page)}
              className={`px-3 py-1.5 rounded-xl text-left transition-all shrink-0 cursor-pointer ${
                currentPage === item.page
                  ? 'bg-[#161412] text-white shadow-xs font-semibold'
                  : 'bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#161412] border border-[#EAE5DC]'
              }`}
            >
              <span className="text-[9px] opacity-70 block font-mono">{item.desc}</span>
              <span className="text-xs font-semibold block">{item.label}</span>
            </button>
          ))}
        </div>

      </main>

      {/* ========================================================================= */}
      {/* MODAL VIDÉO IMMERSIVE 4K & DRONE (ACTIVÉE PAR LES LIENS DU CATALOGUE)       */}
      {/* ========================================================================= */}
      {activeVideoProperty && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-[#161412] text-white rounded-3xl border border-[#302a24] max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-[#302a24] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#9E7431] flex items-center justify-center text-white text-xs">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-display font-medium text-white">
                    {activeVideoProperty.title}
                  </h3>
                  <span className="text-[11px] text-[#a09a90]">
                    {activeVideoProperty.district} • Réf : {activeVideoProperty.reference}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveVideoProperty(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lecteur Vidéo & Simulation Drone 4K */}
            <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center group">
              <Image
                src={activeVideoProperty.image || activeVideoProperty.images?.[0] || villa.images[0]}
                alt={activeVideoProperty.title}
                fill
                className="object-cover brightness-75 scale-105 group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

              {/* Effet Scanner & Repères Cadastraux Vidéo */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-[#C8A97E] bg-black/60 px-2.5 py-1 rounded border border-[#C8A97E]/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C8A97E]" />
                VUE DRONE 4K CADASTRE • ABIDJAN
              </div>

              <div className="absolute bottom-6 left-6 right-6 text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-white/90 hover:bg-white text-[#161412] mx-auto flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-[#947346] text-[#947346] ml-1" />
                </div>
                <p className="text-xs text-white/90 font-light max-w-md mx-auto">
                  Visite immersive des espaces intérieurs et survol drone des extérieurs et du voisinage.
                </p>
              </div>
            </div>

            {/* Footer Modal avec Actions Cliquables */}
            <div className="px-6 py-4 bg-[#1f1a16] border-t border-[#302a24] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeVideoProperty.district + ' Abidjan')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2a241e] hover:bg-[#383129] text-[#d8c29d] text-xs font-medium border border-[#40382e] transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ouvrir Localisation Google Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                {activeVideoProperty.id && (
                  <Link
                    href={`/biens/${activeVideoProperty.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2a241e] hover:bg-[#383129] text-white text-xs font-medium border border-[#40382e] transition-colors"
                  >
                    <span>Fiche complète</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <a
                href={getWhatsAppLink('2250788421920', `Bonjour Cabinet Immobilier Abidjan, je viens de regarder la vidéo de ${activeVideoProperty.title} (Réf: ${activeVideoProperty.reference}). Je souhaite convenir d'une visite privée sur place.`)}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#191715] hover:bg-[#9E7431] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Réserver une visite privée sur place</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE PARTAGE EXTERNE (QR CODE, LIEN MOBILE, WHATSAPP) */}
      <CatalogueShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
