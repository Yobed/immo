'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TiltCard from '@/components/TiltCard';
import FlipbookModal from '@/components/FlipbookModal';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { 
  ShieldCheck, Bed, Maximize2, Zap, Waves, MessageCircle, 
  X, ChevronLeft, ChevronRight, Grid, Download, BookOpen, 
  Check, ArrowLeft, ArrowRight, Lock, Scale, Key
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { properties } = useLiveProperties();
  const property = properties.find((p) => p.id === id) || INITIAL_PROPERTIES.find((p) => p.id === id);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFlipbookOpen, setIsFlipbookOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen || !property) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setActivePhotoIndex((prev) => (prev + 1) % property.images.length);
      if (e.key === 'ArrowLeft') setActivePhotoIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, property]);

  if (!property) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4 bg-[#FAF8F5] text-[#191715]">
          <h2 className="text-3xl font-display font-medium text-[#191715]">Mandat Introuvable</h2>
          <p className="text-[#6E665B] text-xs">Cette demeure n&apos;est plus en portefeuille ou la référence est archivée.</p>
          <Link href="/biens" className="px-6 py-3 rounded-full bg-[#191715] text-white font-semibold text-xs hover:bg-[#9E7431] transition-colors">
            Retour aux résidences
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const images = property.images && property.images.length >= 5 
    ? property.images 
    : [
        property.images[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85'
      ];

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await fetch('/api/brochure/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      });
      const data = await res.json();
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      } else {
        window.open(`/brochure/${property.id}`, '_blank');
      }
    } catch {
      window.open(`/brochure/${property.id}`, '_blank');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const whatsappDirectUrl = getWhatsAppLink(
    '2250788421920',
    `Bonjour Cabinet Immobilier Abidjan, je souhaite organiser une visite privée pour "${property.title}" (${property.reference}) à ${property.district} (${formatFCFA(property.price)} / mois).`
  );

  const similarProperties = INITIAL_PROPERTIES
    .filter((p) => p.id !== property.id)
    .slice(0, 2);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#FAF8F5] text-[#191715] font-sans selection:bg-[#9E7431] selection:text-white pt-24 pb-28">
        
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 space-y-10">
          
          {/* Fil d'Ariane & Retour */}
          <div className="flex items-center justify-between text-xs font-mono text-[#6E665B]">
            <Link href="/biens" className="inline-flex items-center gap-2 hover:text-[#9E7431] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la Sélection</span>
            </Link>

            <span className="text-[#9E7431] uppercase font-semibold">
              RÉF. {property.reference}
            </span>
          </div>

          {/* En-tête Monographique */}
          <div className="space-y-4 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-white border border-[#EAE5DC] text-xs font-mono uppercase text-[#9E7431] shadow-xs">
                {property.district}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Titre {property.legal_status} Audité</span>
              </span>
              <span className={`px-3 py-1 rounded-full border text-xs font-mono flex items-center gap-1.5 shadow-xs ${
                property.status === 'cleaning' || property.concierge_status === 'cleaning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : property.status === 'reserved' || property.concierge_status === 'reserved'
                  ? 'bg-purple-50 border-purple-200 text-purple-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>
                  {property.status === 'cleaning' ? 'Nettoyage Conciergerie en cours' :
                   property.status === 'reserved' ? 'Réservé VIP' :
                   'Disponible & Conforme Conciergerie 100%'}
                </span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-[#191715] tracking-tight leading-[1.08]">
              {property.title}
            </h1>
          </div>

          {/* Galerie Photo Bento Monumentale */}
          <div className="relative rounded-3xl overflow-hidden bg-white border border-[#EAE5DC] shadow-[0_15px_50px_rgba(25,23,21,0.06)]">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[380px] sm:h-[480px] lg:h-[560px]">
              
              {/* Photo Principale Widescreen */}
              <div 
                onClick={() => { setActivePhotoIndex(0); setIsLightboxOpen(true); }}
                className="md:col-span-2 md:row-span-2 relative overflow-hidden cursor-pointer bg-black group"
              >
                <Image
                  src={images[0]}
                  alt={property.title}
                  fill
                  priority
                  unoptimized
                  className="object-cover group-hover:scale-104 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-100"
                />
              </div>

              {/* 4 Photos Secondaires */}
              {images.slice(1, 5).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => { setActivePhotoIndex(idx + 1); setIsLightboxOpen(true); }}
                  className="relative overflow-hidden cursor-pointer hidden md:block bg-black group"
                >
                  <Image
                    src={img}
                    alt={`${property.title} vue ${idx + 2}`}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out brightness-90 group-hover:brightness-100"
                  />
                </div>
              ))}
            </div>

            {/* Bouton Afficher Toutes les Photos */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-5 right-5 bg-black/75 hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider flex items-center gap-2 border border-white/20 backdrop-blur-xl shadow-xl transition-all cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-[#C8A97E]" />
              <span>Voir les {images.length} Photographies</span>
            </button>
          </div>

          {/* Grille Principale : Descriptif Architectural (Gauche) + Dock VIP (Droite) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start pt-6">
            
            {/* Colonne Gauche : Monographie & Spécifications (8 cols) */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Spécifications Minimalistes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-3xl bg-white border border-[#EAE5DC] shadow-[0_4px_20px_rgba(25,23,21,0.04)]">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase text-[#6E665B]">Surface Habitable</span>
                  <p className="text-xl sm:text-2xl font-display font-medium text-[#191715]">{property.surface} m²</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase text-[#6E665B]">Suites Privatives</span>
                  <p className="text-xl sm:text-2xl font-display font-medium text-[#191715]">{property.bedrooms}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase text-[#6E665B]">Salles de Bains</span>
                  <p className="text-xl sm:text-2xl font-display font-medium text-[#191715]">{property.bathrooms}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase text-[#6E665B]">Piscine</span>
                  <p className="text-xl sm:text-2xl font-display font-medium text-[#9E7431]">
                    {property.has_pool ? 'Miroir 14m' : 'Non'}
                  </p>
                </div>
              </div>

              {/* Texte Monographique Épuré */}
              <div className="space-y-4">
                <h3 className="text-2xl font-display font-medium text-[#191715]">
                  L&apos;Esprit du Lieu
                </h3>
                <p className="text-sm sm:text-base text-[#33302C] font-light leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Les 4 Piliers Techniques d'Excellence */}
              <div className="space-y-4 pt-4 border-t border-[#EAE5DC]">
                <h3 className="text-2xl font-display font-medium text-[#191715]">
                  Spécifications &amp; Autonomie
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white border border-[#EAE5DC] shadow-[0_4px_20px_rgba(25,23,21,0.03)] space-y-2">
                    <div className="flex items-center gap-2 text-[#191715] font-medium text-sm">
                      <Zap className="w-4 h-4 text-[#9E7431]" />
                      <span>Autonomie Énergétique</span>
                    </div>
                    <p className="text-xs text-[#6E665B] font-light leading-relaxed">
                      Groupe électrogène insonorisé automatique 40 kVA avec bascule instantanée en cas de coupure réseau.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#EAE5DC] shadow-[0_4px_20px_rgba(25,23,21,0.03)] space-y-2">
                    <div className="flex items-center gap-2 text-[#191715] font-medium text-sm">
                      <Waves className="w-4 h-4 text-[#9E7431]" />
                      <span>Réserve d&apos;Eau SODECI</span>
                    </div>
                    <p className="text-xs text-[#6E665B] font-light leading-relaxed">
                      Cuve tampon de 5 000 litres avec surpresseur automatique garantissant une pression constante.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#EAE5DC] shadow-[0_4px_20px_rgba(25,23,21,0.03)] space-y-2">
                    <div className="flex items-center gap-2 text-[#191715] font-medium text-sm">
                      <Lock className="w-4 h-4 text-[#9E7431]" />
                      <span>Séquestre Notarié Systématique</span>
                    </div>
                    <p className="text-xs text-[#6E665B] font-light leading-relaxed">
                      Dépôt de garantie consigné sous compte notarié. Restitution garantie sur constat d&apos;huissier.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-[#EAE5DC] shadow-[0_4px_20px_rgba(25,23,21,0.03)] space-y-2">
                    <div className="flex items-center gap-2 text-[#191715] font-medium text-sm">
                      <Scale className="w-4 h-4 text-[#9E7431]" />
                      <span>Baux Diplomatiques &amp; OHADA</span>
                    </div>
                    <p className="text-xs text-[#6E665B] font-light leading-relaxed">
                      Conventions adaptées aux exigences des chancelleries, ambassades et groupes multinationaux.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Colonne Droite : Dock Flottant VIP & Réservation (4 cols) */}
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <div className="p-8 rounded-3xl bg-white border border-[#EAE5DC] shadow-[0_20px_60px_rgba(25,23,21,0.08)] space-y-6">
                
                {/* Loyer */}
                <div className="space-y-1 pb-4 border-b border-[#EAE5DC]">
                  <span className="text-[11px] font-mono uppercase text-[#6E665B]">Loyer Mensuel</span>
                  <div className="text-3xl sm:text-4xl font-display font-medium text-[#9E7431]">
                    {formatFCFA(property.price)}
                    <span className="text-xs text-[#6E665B] font-sans font-light"> / mois</span>
                  </div>
                </div>

                {/* Bouton WhatsApp VIP */}
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_15px_35px_rgba(37,211,102,0.25)] transition-all transform hover:scale-102 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Planifier une Visite Privée</span>
                </a>

                {/* Bouton Brochure PDF & Flipbook */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="w-full py-3.5 rounded-full bg-[#F5F2EB] hover:bg-[#EAE5DC] text-[#191715] border border-[#EAE5DC] text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#9E7431]" />
                    <span>{isGeneratingPdf ? 'Génération...' : 'Télécharger le Dossier PDF'}</span>
                  </button>

                  {property.flipbook_url && (
                    <button
                      type="button"
                      onClick={() => setIsFlipbookOpen(true)}
                      className="w-full py-3 rounded-full text-xs font-mono text-[#9E7431] hover:text-[#191715] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Feuilleter la Brochure Virtuelle</span>
                    </button>
                  )}
                </div>

                {/* Ligne Directe Direction */}
                <div className="pt-4 border-t border-[#EAE5DC] text-center space-y-1">
                  <p className="text-[11px] text-[#6E665B] font-mono">Direction &amp; Clientèle Privée</p>
                  <p className="text-xs font-mono text-[#191715] font-medium">+225 07 88 42 19 20</p>
                </div>

              </div>
            </div>

          </div>

          {/* Résidences Similaires */}
          {similarProperties.length > 0 && (
            <div className="pt-16 border-t border-[#EAE5DC] space-y-8">
              <h3 className="text-3xl font-display font-medium text-[#191715]">
                Autres Demeures du Portefeuille
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {similarProperties.map((prop) => (
                  <TiltCard key={prop.id} tiltStrength={4} className="rounded-3xl">
                    <article className="group rounded-3xl overflow-hidden bg-white border border-[#EAE5DC] shadow-[0_15px_40px_rgba(25,23,21,0.06)] flex flex-col justify-between h-full">
                      <Link href={`/biens/${prop.id}`} className="block relative aspect-[16/10] overflow-hidden bg-black">
                        <Image
                          src={prop.images[0]}
                          alt={prop.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-95 group-hover:brightness-100"
                        />
                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-xs font-mono uppercase text-[#C8A97E]">
                          {prop.district}
                        </div>
                        <div className="absolute bottom-4 left-4 text-xl font-display font-medium text-white">
                          {formatFCFA(prop.price)}
                          <span className="text-xs text-white/60 font-sans font-light"> / mois</span>
                        </div>
                      </Link>
                      <div className="p-6 space-y-3">
                        <Link href={`/biens/${prop.id}`}>
                          <h4 className="text-lg font-display font-medium text-[#191715] group-hover:text-[#9E7431] transition-colors">
                            {prop.title}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-4 text-xs font-mono text-[#6E665B]">
                          <span>{prop.surface} m²</span>
                          <span>•</span>
                          <span>{prop.bedrooms} suites</span>
                        </div>
                      </div>
                    </article>
                  </TiltCard>
                ))}
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Lightbox Plein Écran pour Photographies */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10 cursor-pointer z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => setActivePhotoIndex((prev) => (prev - 1 + images.length) % images.length)}
            className="absolute left-6 text-white/70 hover:text-white p-3 rounded-full bg-white/10 cursor-pointer z-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="relative w-full max-w-5xl h-[75vh]">
            <Image
              src={images[activePhotoIndex]}
              alt={property.title}
              fill
              unoptimized
              className="object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono text-white/70 bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md">
              {activePhotoIndex + 1} / {images.length}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePhotoIndex((prev) => (prev + 1) % images.length)}
            className="absolute right-6 text-white/70 hover:text-white p-3 rounded-full bg-white/10 cursor-pointer z-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Flipbook Modal */}
      {property.flipbook_url && (
        <FlipbookModal
          isOpen={isFlipbookOpen}
          onClose={() => setIsFlipbookOpen(false)}
          flipbookUrl={property.flipbook_url}
          title={property.title}
          reference={property.reference}
        />
      )}

      <Footer />
    </>
  );
}
