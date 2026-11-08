'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, ZoomIn, Sparkles, CheckCircle2, Layers, Compass, ArrowRight } from 'lucide-react';

interface MacroDetail {
  id: string;
  name: string;
  material: string;
  property: string;
  district: string;
  image: string;
  zoomLevel: string;
  provenance: string;
  specs: string[];
  description: string;
}

const MACRO_DETAILS: MacroDetail[] = [
  {
    id: 'marbre',
    name: 'Marbre de Carrare & Travertin Veiné',
    material: 'Pierre Naturelle & Finition Adoucie',
    property: 'Villa Duplex Contemporaine',
    district: 'Cocody Riviera Golf',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=90',
    zoomLevel: 'Macro 2.5x',
    provenance: 'Italie (Toscane) • Sélection Premier Choix',
    specs: [
      'Veinage continu livre ouvert (Bookmatch)',
      'Traitement oléofuge & anti-taches 4 couches',
      'Finition mate soyeuse non réfléchissante',
      'Résistance thermique climat tropical',
    ],
    description:
      'Chaque dalle de travertin et de marbre a été sélectionnée en carrière pour la continuité de son veinage minéral. L’absence de brillance artificielle préserve l’élégance brute de la pierre sous la lumière naturelle zénithale.',
  },
  {
    id: 'bois',
    name: 'Boiseries Teck Massif & Iroko Fluvial',
    material: 'Essences Nobles de Forêt Gérée',
    property: 'Villa Balnéaire Pieds dans l\'Eau',
    district: 'Assinie PK 9',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=90',
    zoomLevel: 'Macro 3.0x',
    provenance: 'Côte d\'Ivoire & Birmanie • Teck de Marine Certifié',
    specs: [
      'Lames de terrasse 140 mm sans fixation apparente',
      'Huile végétale naturelle anti-dessèchement',
      'Insensible à l’air salin et au marnage lagunaire',
      'Assemblages traditionnels à mi-bois',
    ],
    description:
      'Le teck et l’iroko massif assurent une transition tactile chaleureuse entre le sable blanc et les intérieurs climatisés. Le grain serré du bois a été saturé d’huiles protectrices pour résister aux embruns marins d’Assinie.',
  },
  {
    id: 'metal',
    name: 'Laiton Brossé & Menuiseries Minimalistes',
    material: 'Ferronnerie Fine & Quincaillerie d\'Art',
    property: 'Penthouse avec Terrasse Panoramique',
    district: 'Marcory Zone 4',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=90',
    zoomLevel: 'Macro 4.0x',
    provenance: 'Ateliers d\'Art Métallique • Profilés Schuco Slim',
    specs: [
      'Profilés aluminium extra-fins à rupture de pont thermique',
      'Poignées usinées dans la masse en laiton brossé',
      'Patine dorée vivante s’adoucissant avec le temps',
      'Double vitrage feuilleté acoustique 44.2',
    ],
    description:
      'Les menuiseries coulissantes disparaissent totalement dans les galandages pour fusionner le séjour avec la lagune. Les détails de quincaillerie en laiton massif apportent une sensation de densité et de précision mécanique sous la main.',
  },
  {
    id: 'eau',
    name: 'Eau Miroir & Pierre Balinaise Émeraude',
    material: 'Bassin de Nage & Plage Immergée',
    property: 'Villa Diplomatique Cocody Ambassades',
    district: 'Cocody Ambassades',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1600&q=90',
    zoomLevel: 'Macro 2.0x',
    provenance: 'Pierre de Sukabumi • Eau Traitée au Sel',
    specs: [
      'Revêtement pierre naturelle aux nuances vert profond',
      'Débordement périphérique à fleur de dallage',
      'Filtration silencieuse et traitement écologique au sel',
      'Éclairage subaquatique chaud 2700K',
    ],
    description:
      'L’eau de la piscine se fond dans la végétation tropicale grâce aux reflets vert émeraude de la pierre naturelle de Sukabumi. Le débordement à l’infini crée une sensation de calme absolu et une régulation thermique naturelle des terrasses.',
  },
];

export default function CinematicMacroInspector() {
  const [selectedId, setSelectedId] = useState<string>('marbre');
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const activeDetail = MACRO_DETAILS.find((d) => d.id === selectedId) || MACRO_DETAILS[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLensPos({ x, y });
  };

  return (
    <section className="bg-[#161412] text-[#fbfaf7] py-28 relative overflow-hidden border-b border-white/10">
      {/* Halo lumineux d'ambiance */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#947346]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[#1d382b]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-16 relative z-10">
        
        {/* En-tête de la Galerie Macro */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-[#dcd6cb]">
              <Sparkles className="w-3.5 h-3.5 text-[#947346]" />
              <span>Inspection Haute Définition • Texture & Finitions Nobles</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-medium text-white tracking-tight leading-[1.06]">
              L’Émotion se Joue dans <br />
              <span className="italic font-normal text-[#947346]">la Matière et le Millimètre.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#a39c92] font-light leading-relaxed">
              Une demeure d’exception ne se juge pas uniquement à ses volumes, mais au toucher d’un travertin adouci, à la précision d’un laiton massif et à la noblesse d’un bois insensible au climat d’Abidjan.
            </p>
          </div>

          {/* Sélecteur d'échantillons en onglets luxueux */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {MACRO_DETAILS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-medium border transition-all duration-300 flex items-center gap-2 ${
                  selectedId === item.id
                    ? 'bg-white text-[#161412] border-white shadow-warm-md'
                    : 'bg-white/5 text-[#dcd6cb] border-white/10 hover:border-[#947346] hover:bg-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${selectedId === item.id ? 'bg-[#947346]' : 'bg-white/40'}`} />
                <span>{item.name.split('&')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CADRE CINÉMATIQUE PRINCIPAL : IMAGE MACRO AVEC LOUPE INTERACTIVE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-stretch">
          
          {/* Colonne Gauche : L'Image Haute Résolution & Loupe Virtuelle (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div
              ref={containerRef}
              onMouseEnter={() => setIsMagnifying(true)}
              onMouseLeave={() => setIsMagnifying(false)}
              onMouseMove={handleMouseMove}
              className="relative aspect-[16/11] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-white/15 bg-black cursor-crosshair group shadow-2xl"
            >
              <Image
                src={activeDetail.image}
                alt={activeDetail.name}
                fill
                priority
                quality={95}
                className="object-cover transition-transform duration-700 group-hover:scale-102"
              />

              {/* Voile vignette cinématique */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Badge d'indication interactif */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-semibold text-white border border-white/20 flex items-center gap-1.5 shadow-sm">
                  <ZoomIn className="w-3.5 h-3.5 text-[#947346]" />
                  <span>Survolez pour activer la loupe macro</span>
                </span>
                <span className="px-3 py-1.5 rounded-full bg-[#1d382b]/90 backdrop-blur-md text-[11px] font-mono text-[#d2e3d8] border border-[#d2e3d8]/30">
                  {activeDetail.zoomLevel}
                </span>
              </div>

              {/* Informations du bien en bas de l'image */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#947346] block">
                    {activeDetail.district}
                  </span>
                  <div className="text-base font-display font-medium text-white">
                    {activeDetail.property}
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-[#a39c92] bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md">
                  RÉSOL. 4K OPTIQUE
                </div>
              </div>

              {/* LA LOUPE VIRTUELLE FLOTTANTE (MACRO LENS) */}
              {isMagnifying && (
                <div
                  className="absolute pointer-events-none z-30 w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-[#947346] shadow-2xl overflow-hidden -translate-x-1/2 -translate-y-1/2 ring-4 ring-black/40"
                  style={{
                    left: `${lensPos.x}%`,
                    top: `${lensPos.y}%`,
                    backgroundImage: `url(${activeDetail.image})`,
                    backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                    backgroundSize: '350%',
                  }}
                >
                  {/* Réticule de visée optique */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border border-white/60 rounded-full" />
                    <div className="absolute w-full h-[1px] bg-white/20" />
                    <div className="absolute h-full w-[1px] bg-white/20" />
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded text-[#947346]">
                    ZOOM 3.5X
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#a39c92] px-2 font-light">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#947346]" />
                <span>Matériaux photographiés sur site en lumière naturelle</span>
              </span>
              <span className="font-mono text-[11px] text-[#947346]">4 ÉCHANTILLONS AUDITÉS</span>
            </div>
          </div>

          {/* Colonne Droite : Fiche Technique & Provenance (5 cols) */}
          <div className="lg:col-span-5 bg-white/5 rounded-3xl p-8 border border-white/10 flex flex-col justify-between space-y-8 backdrop-blur-md">
            <div className="space-y-6">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#947346] font-semibold block">
                  {activeDetail.material}
                </span>
                <h3 className="text-2xl font-display font-medium text-white mt-1">
                  {activeDetail.name}
                </h3>
                <p className="text-xs text-[#dcd6cb] font-light mt-3 leading-relaxed">
                  {activeDetail.description}
                </p>
              </div>

              {/* Provenance & Origine */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#947346] block">
                  Provenance & Traçabilité
                </span>
                <div className="text-xs font-medium text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#947346]" />
                  <span>{activeDetail.provenance}</span>
                </div>
              </div>

              {/* Grille des Spécifications Techniques */}
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#dcd6cb] block">
                  Critères de Sélection Déontologique
                </span>
                <div className="space-y-2.5">
                  {activeDetail.specs.map((spec, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#a39c92] font-light">
                      <CheckCircle2 className="w-4 h-4 text-[#1d382b] shrink-0 mt-0.5" />
                      <span className="leading-snug">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Vers la Fiche Détaillée */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-[#a39c92] font-light">
                Mandat contrôlé par le cabinet
              </span>
              <a
                href="#selection"
                className="px-5 py-2.5 rounded-full bg-white hover:bg-[#947346] text-[#161412] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 shadow-sm"
              >
                <span>Voir le bien associé</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
