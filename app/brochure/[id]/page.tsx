'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { INITIAL_PROPERTIES } from '@/lib/mock-data';
import { formatFCFA } from '@/lib/utils';
import { 
  ShieldCheck, MapPin, Maximize2, Bed, Bath, 
  CheckCircle2, Building2, Phone, Mail, Award, Compass, FileText
} from 'lucide-react';

export default function BrochurePrintPage() {
  const params = useParams();
  const id = params?.id as string;
  const property = INITIAL_PROPERTIES.find((p) => p.id === id) || INITIAL_PROPERTIES[0];

  return (
    <div className="bg-[#fbfaf7] text-[#161412] font-sans antialiased print:bg-white">
      
      {/* Barre d'outils écran (invisible à l'impression) */}
      <div className="print:hidden sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc] px-6 py-3.5 flex items-center justify-between shadow-warm-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#161412] text-white flex items-center justify-center font-display font-semibold text-xs">
            A
          </div>
          <div>
            <span className="text-xs font-semibold text-[#161412] block">
              Plaquette de Vente Haute Définition • {property.title}
            </span>
            <span className="text-[10px] text-[#7a736a] block">
              Format A4 Paysage standardisé (4 pages) • Prêt pour génération PDF
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-full bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Imprimer / Télécharger en PDF</span>
          </button>
        </div>
      </div>

      {/* CONTENEUR DES 4 PAGES A4 PAYSAGE */}
      <div className="max-w-[1120px] mx-auto py-8 print:py-0 print:max-w-none space-y-12 print:space-y-0">
        
        {/* ========================================================================= */}
        {/* PAGE 1 : COUVERTURE ÉDITORIALE DE PRESTIGE                                */}
        {/* ========================================================================= */}
        <section className="page-sheet relative w-full aspect-[297/210] bg-[#161412] text-white overflow-hidden flex flex-col justify-between p-12 sm:p-16 print:p-14 print:aspect-auto print:h-[100vh] print:break-after-page">
          {/* Background Photo */}
          <div className="absolute inset-0 z-0">
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              priority
              quality={95}
              className="object-cover opacity-55 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-[#161412]/40 to-black/60" />
          </div>

          {/* Top Brand Monogram */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#947346] flex items-center justify-center text-white font-display text-base font-semibold">
                A
              </div>
              <div>
                <span className="text-lg font-display tracking-tight font-semibold text-white block">
                  Agence <span className="font-normal italic text-[#dcd6cb]">Immo</span>
                </span>
                <span className="text-[10px] tracking-widest uppercase text-white/70 block -mt-0.5">
                  Abidjan • Côte d&apos;Ivoire
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-[#947346] uppercase tracking-widest block">
                Édition Confidentielle
              </span>
              <span className="text-xs text-white/80 font-mono">
                Mandat N° {property.reference}
              </span>
            </div>
          </div>

          {/* Main Title & District */}
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#f5f2eb]">
              <span>{property.operation === 'sale' ? 'Vente Exclusive' : 'Location de Standing'}</span>
              <span>•</span>
              <span>{property.district}</span>
              <span>•</span>
              <span className="text-[#C8A97E]">{property.legal_status} Certifié</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-display font-medium text-white tracking-tight leading-[1.05]">
              {property.title}
            </h1>

            <div className="text-3xl font-display font-semibold text-[#b59363]">
              {formatFCFA(property.price)}
              {property.operation === 'rent' && <span className="text-sm font-sans font-normal text-white/70 ml-2">/ mois</span>}
            </div>
          </div>

          {/* Footer Cover Strip */}
          <div className="relative z-10 border-t border-white/20 pt-6 flex items-center justify-between text-xs text-white/80 font-light">
            <span>Dossier de Présentation & d&apos;Investissement Foncier</span>
            <span>Séquestre Notarié & Levée d&apos;État Foncier MCLU</span>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* PAGE 2 : ARCHITECTURE, AMÉNAGEMENT & SPÉCIFICATIONS                       */}
        {/* ========================================================================= */}
        <section className="page-sheet relative w-full aspect-[297/210] bg-[#fbfaf7] border border-[#e8e4dc] p-12 sm:p-16 print:p-14 print:border-none print:aspect-auto print:h-[100vh] print:break-after-page flex flex-col justify-between">
          
          {/* Header Page */}
          <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-4">
            <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold">
              01 • Fiche Technique & Prestations
            </span>
            <span className="text-xs text-[#7a736a] font-mono">
              Réf. {property.reference}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-8 items-center my-auto">
            {/* Gallery Left (6 cols) */}
            <div className="col-span-6 grid grid-cols-2 gap-3.5">
              <div className="col-span-2 relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#e8e4dc]">
                <Image src={property.images[0]} alt="Vue principale" fill className="object-cover" />
              </div>
              {property.images[1] && (
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#e8e4dc]">
                  <Image src={property.images[1]} alt="Intérieur" fill className="object-cover" />
                </div>
              )}
              {property.images[2] && (
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#e8e4dc]">
                  <Image src={property.images[2]} alt="Détail" fill className="object-cover" />
                </div>
              )}
            </div>

            {/* Description & Specs Right (6 cols) */}
            <div className="col-span-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#161412] leading-tight">
                  L&apos;Élégance Contemporaine au Cœur d&apos;Abidjan
                </h2>
                <p className="text-xs text-[#68625c] leading-relaxed font-light">
                  {property.description}
                </p>
              </div>

              {/* Specs Table */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white border border-[#e8e4dc] text-xs">
                <div>
                  <span className="text-[#a39c92] block text-[10px]">Superficie totale</span>
                  <span className="font-semibold text-sm text-[#161412]">{property.surface} m²</span>
                </div>
                <div>
                  <span className="text-[#a39c92] block text-[10px]">Chambres / Suites</span>
                  <span className="font-semibold text-sm text-[#161412]">{property.bedrooms || 'NC'}</span>
                </div>
                <div>
                  <span className="text-[#a39c92] block text-[10px]">Salles d&apos;eau</span>
                  <span className="font-semibold text-sm text-[#161412]">{property.bathrooms || 'NC'}</span>
                </div>
                <div>
                  <span className="text-[#a39c92] block text-[10px]">Emplacement</span>
                  <span className="font-semibold text-sm text-[#161412]">{property.district}</span>
                </div>
              </div>

              {/* Equipments list */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-[#161412] block">Prestations intégrées :</span>
                <div className="grid grid-cols-2 gap-2 text-[#4a453e]">
                  {property.has_pool && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1d382b]" />
                      <span>Piscine à débordement</span>
                    </div>
                  )}
                  {property.has_generator && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1d382b]" />
                      <span>Groupe électrogène automatique</span>
                    </div>
                  )}
                  {property.has_security && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1d382b]" />
                      <span>Sécurité 24/7 & vidéosurveillance</span>
                    </div>
                  )}
                  {property.has_parking && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1d382b]" />
                      <span>Parking intérieur sécurisé</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Footer Page */}
          <div className="border-t border-[#e8e4dc] pt-4 flex justify-between text-[11px] text-[#7a736a]">
            <span>Agence Immo • Plaquette de vente exclusive</span>
            <span>Page 2 / 4</span>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* PAGE 3 : RIGUEUR JURIDIQUE, CADASTRE & SÉCURITÉ FONCIÈRE                   */}
        {/* ========================================================================= */}
        <section className="page-sheet relative w-full aspect-[297/210] bg-[#f5f2eb] border border-[#e8e4dc] p-12 sm:p-16 print:p-14 print:border-none print:aspect-auto print:h-[100vh] print:break-after-page flex flex-col justify-between">
          
          {/* Header Page */}
          <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-4">
            <span className="text-xs uppercase tracking-widest text-[#1d382b] font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1d382b]" />
              <span>02 • Protocole Zéro Litige Foncier en Côte d&apos;Ivoire</span>
            </span>
            <span className="text-xs text-[#7a736a] font-mono">
              Certification Notariée
            </span>
          </div>

          <div className="grid grid-cols-12 gap-8 items-center my-auto">
            {/* Left : Explanatory legal framework (7 cols) */}
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-[#947346] font-semibold block">
                  Audit du Ministère de la Construction
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#161412]">
                  Un Titre de Propriété Régulier et Purifié
                </h2>
                <p className="text-xs text-[#68625c] leading-relaxed font-light">
                  En Côte d&apos;Ivoire, la sécurité patrimoniale repose sur la rigueur absolue du titre foncier. Cette propriété fait l&apos;objet d&apos;un dossier juridique scrupuleusement audité avant toute mise sur le marché.
                </p>
              </div>

              {/* 3 Steps Guarantee */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-white border border-[#e8e4dc] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#f0f5f2] text-[#1d382b] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs space-y-0.5">
                    <span className="font-semibold text-[#161412] block">Levée d&apos;État Foncier au Guichet Unique MCLU</span>
                    <p className="text-[#68625c] font-light">Confirmation de l&apos;antériorité de la chaîne des propriétaires et absence totale d&apos;hypothèque occulte ou de prénotation judiciaire.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#e8e4dc] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#f0f5f2] text-[#1d382b] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs space-y-0.5">
                    <span className="font-semibold text-[#161412] block">Bornage Contradictoire et Conformité Urbanistique</span>
                    <p className="text-[#68625c] font-light">Vérification de l&apos;emprise physique de la parcelle par géomètre expert agréé. Respect scrupuleux des alignements et servitudes de voirie.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#e8e4dc] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#f0f5f2] text-[#1d382b] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs space-y-0.5">
                    <span className="font-semibold text-[#161412] block">Acte Authentique sous Séquestre Notarié</span>
                    <p className="text-[#68625c] font-light">Toutes les transactions sont conclues sous ministère de notaire agréé. Les fonds sont sécurisés sous compte de consignation notarié.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right : Certificate badge & Stamp (5 cols) */}
            <div className="col-span-5 bg-white rounded-3xl p-8 border border-[#d2e3d8] shadow-warm-sm space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f0f5f2] border border-[#d2e3d8] flex items-center justify-center text-[#1d382b] mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#1d382b] font-semibold block">
                  Statut du Titre Juridique
                </span>
                <div className="text-3xl font-display font-semibold text-[#161412] mt-1">
                  {property.legal_status} Certifié
                </div>
                <span className="text-xs text-[#7a736a] block mt-1">
                  Arrêté de Concession Définitive enregistré
                </span>
              </div>

              <div className="pt-4 border-t border-[#f0ede6] text-xs text-[#68625c] space-y-2 text-left font-light">
                <div className="flex justify-between">
                  <span>Nature :</span>
                  <strong className="text-[#161412] font-semibold">{property.property_type.toUpperCase()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Commune :</span>
                  <strong className="text-[#161412] font-semibold">{property.district}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Séquestre :</span>
                  <strong className="text-[#1d382b] font-semibold">Étude Notariée Partenaire</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Page */}
          <div className="border-t border-[#e8e4dc] pt-4 flex justify-between text-[11px] text-[#7a736a]">
            <span>Agence Immo • Garantie conformité foncière MCLU</span>
            <span>Page 3 / 4</span>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* PAGE 4 : VALORISATION PATRIMONIALE & CONTACT DIRECT                        */}
        {/* ========================================================================= */}
        <section className="page-sheet relative w-full aspect-[297/210] bg-[#fbfaf7] border border-[#e8e4dc] p-12 sm:p-16 print:p-14 print:border-none print:aspect-auto print:h-[100vh] flex flex-col justify-between">
          
          {/* Header Page */}
          <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-4">
            <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold">
              03 • Accompagnement & Conciergerie Privée
            </span>
            <span className="text-xs text-[#7a736a] font-mono">
              Abidjan, Côte d&apos;Ivoire
            </span>
          </div>

          <div className="grid grid-cols-12 gap-8 items-center my-auto">
            {/* Left Financial Projection (6 cols) */}
            <div className="col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-[#947346] font-semibold block">
                  Perspective d&apos;Investissement
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#161412]">
                  Valorisation Patrimoniale
                </h2>
                <p className="text-xs text-[#68625c] leading-relaxed font-light">
                  Le marché immobilier haut de gamme à {property.district} présente un taux d&apos;occupation soutenu par les cadres dirigeants, délégations diplomatiques et investisseurs de la diaspora.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e8e4dc] space-y-3 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-[#68625c]">Prix de présentation :</span>
                  <span className="text-lg font-display font-semibold text-[#161412]">{formatFCFA(property.price)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#f0ede6]">
                  <span className="text-[#68625c]">Rendement locatif brut estimé :</span>
                  <span className="font-semibold text-[#1d382b]">~8.5% à 11% / an</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[#68625c]">Frais de notaire & enregistrement :</span>
                  <span className="font-semibold text-[#7a736a]">~7.5% de la valeur d&apos;acquisition</span>
                </div>
              </div>
            </div>

            {/* Right Contact Card (6 cols) */}
            <div className="col-span-6 bg-[#161412] text-white rounded-3xl p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs text-[#947346] uppercase tracking-wider font-semibold block">
                  Visite Privée & Mandat
                </span>
                <h3 className="text-2xl font-display font-medium text-white">
                  Agence Immo Abidjan
                </h3>
                <p className="text-xs text-white/70 font-light leading-relaxed">
                  Notre équipe de conseillers dédiés et notre conciergerie privée Aya sont à votre disposition pour organiser une visite sur mesure.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-white/90">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#947346] shrink-0" />
                  <span>Boulevard Hassan II, Cocody Riviera Golf, Abidjan</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#947346] shrink-0" />
                  <span>+225 07 00 00 00 00 / WhatsApp 24/7</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#947346] shrink-0" />
                  <span>conciergerie@agence-immo.ci</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-white/60">
                <span>Réf. Mandat : {property.reference}</span>
                <span>www.agence-immo.ci</span>
              </div>
            </div>

          </div>

          {/* Footer Page */}
          <div className="border-t border-[#e8e4dc] pt-4 flex justify-between text-[11px] text-[#7a736a]">
            <span>Agence Immo • Fin du dossier de présentation</span>
            <span>Page 4 / 4</span>
          </div>
        </section>

      </div>

    </div>
  );
}
