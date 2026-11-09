'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, FileCheck, Scale, Lock, AlertTriangle, CheckCircle2, 
  HelpCircle, ArrowRight, Download, Clock, ExternalLink, UserCheck, Building
} from 'lucide-react';
import { getWhatsAppLink } from '@/lib/utils';

export default function ProtocolePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const whatsappAuditUrl = getWhatsAppLink(
    '2250788421920',
    'Bonjour Cabinet Immobilier Abidjan, je souhaite solliciter un pré-audit documentaire pour une parcelle ou un bien immobilier.'
  );

  return (
    <>
      <Navbar />

      <main className="flex-1 w-full bg-[#fbfaf7] text-[#161412] pt-28 pb-24">
        
        {/* ========================================================================= */}
        {/* 1. EN-TÊTE INSTITUTIONNEL : POSITIONNEMENT & LIMITES LÉGALES               */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#EAE5DC] text-xs font-semibold text-[#161412] shadow-warm-xs">
            <Scale className="w-3.5 h-3.5 text-[#9E7431]" />
            <span>Cadre Déontologique & Délimitation des Responsabilités</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-medium text-[#161412] tracking-tight leading-[1.05]">
            Notre Protocole de Contrôle Foncier.
          </h1>

          <p className="text-base sm:text-lg text-[#68625c] font-light max-w-3xl mx-auto leading-relaxed">
            À Abidjan, la sécurité d&apos;une acquisition ne tolère aucun flou. Voici exactement ce que notre cabinet contrôle en amont, ce que le notaire instrumentaire certifie légalement, et pourquoi nous refusons 87% des dossiers soumis.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e8e4dc]">
              <span className="font-semibold text-[#161412]">Agrément Agent Immobilier :</span>
              <span className="font-mono text-[#947346]">N° 048/MCLU/DGU/SDH</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e8e4dc]">
              <span className="font-semibold text-[#161412]">RCCM Abidjan :</span>
              <span className="font-mono text-[#947346]">CI-ABJ-03-2021-B12-08412</span>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 2. LA SÉLECTIVITÉ : POURQUOI SEULEMENT 6 MANDATS ACTIFS                    */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 mt-16">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e8e4dc] shadow-warm-sm space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold block">
                Transparence d&apos;Inventaire • Exercice 2025-2026
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#161412]">
                Pourquoi notre portefeuille ne compte que 6 mandats publiés ?
              </h2>
              <p className="text-xs sm:text-sm text-[#68625c] font-light leading-relaxed">
                De nombreuses plateformes empilent des centaines d&apos;annonces non vérifiées, obsolètes ou sous litige familial. Notre cabinet applique un principe d&apos;exclusion systématique : nous n&apos;acceptons aucun mandat sans chaîne de propriété limpide.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-[#f0ede6]">
              <div className="space-y-1">
                <div className="text-3xl font-display font-semibold text-[#161412]">48 Dossiers</div>
                <div className="text-xs text-[#68625c]">Soumis à l&apos;évaluation du cabinet en 2025-2026</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-display font-semibold text-[#947346]">42 Recalés</div>
                <div className="text-xs text-[#68625c]">Écartés pour insuffisance de titre, indivision conflictuelle ou bornage imprécis (87,5%)</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-display font-semibold text-[#161412]">6 Retenus</div>
                <div className="text-xs text-[#68625c]">Mandats exclusifs conformes, audités et prêts pour signature notariée</div>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 3. MATRICE DE RESPONSABILITÉ : QUI FAIT QUOI ? (CABINET VS NOTAIRE)        */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 mt-20 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold block">
              Clarification Juridique Obligatoire
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-[#161412]">
              Délimitation Stricte des Rôles.
            </h2>
            <p className="text-xs sm:text-sm text-[#68625c] font-light leading-relaxed">
              Le cabinet immobilier ne remplace en aucun cas l&apos;officier ministériel. Notre rôle est un filtre d&apos;amont pour éliminer les risques avant d&apos;engager des frais notariés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Colonne 1 : Ce que fait le Cabinet */}
            <div className="bg-white rounded-3xl p-8 border border-[#e8e4dc] shadow-warm-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f5f2eb] border border-[#e8e4dc] flex items-center justify-center text-[#947346]">
                  <Building className="w-5 h-5 text-[#947346]" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#161412]">1. Le Pré-Audit du Cabinet</h3>
                  <span className="text-[11px] text-[#7a736a]">Diligences d&apos;amont (avant publication)</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-[#4a453e]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Réquisition au Livre Foncier :</strong> Vérification de l&apos;authenticité de l&apos;arrêté ministériel ACD ou du Titre Foncier (TF) au Guichet Unique MCLU.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Contrôle physique des limites :</strong> Missionnement d&apos;un géomètre-expert agréé (OGE-CI) pour validation des coordonnées géodésiques UTM.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Vérification des antécédents :</strong> Contrôle des charges, inscriptions hypothécaires apparentes et filiation successorale déclarée.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Mandat exclusif formalisé :</strong> Vérification de la pleine capacité juridique du propriétaire à céder le bien.</span>
                </li>
              </ul>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] text-[#6E665B]">
                <strong>Engagement :</strong> Si un doute subsiste sur un document cadastral, le bien est immédiatement refusé ou suspendu.
              </div>
            </div>

            {/* Colonne 2 : Ce que fait le Notaire Instrumentaire */}
            <div className="bg-white rounded-3xl p-8 border border-[#EAE5DC] shadow-warm-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-center text-[#9E7431]">
                  <Scale className="w-5 h-5 text-[#9E7431]" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#161412]">2. Les Diligences du Notaire</h3>
                  <span className="text-[11px] text-[#8C8275]">Officier ministériel assermenté</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-[#524B43]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Rédaction de l&apos;avant-contrat :</strong> Compromis ou promesse synallagmatique de vente sous conditions suspensives d&apos;usage.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Ouverture du compte séquestre :</strong> Consignation obligatoire de l&apos;acompte et du solde de prix sur compte officiel CARPA / notarié.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Purge des droits de préemption :</strong> Formalités légales auprès des administrations compétentes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Mutation & Acte Authentique :</strong> Publication de la mutation au Journal Officiel et remise du titre définitif au nom de l&apos;acquéreur.</span>
                </li>
              </ul>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC] text-[11px] text-[#6E665B]">
                <strong>Principe fondamental :</strong> Vous conservez la liberté totale de désigner votre propre notaire instrumentaire. Les émoluments sont partagés entre confrères sans surcoût.
              </div>
            </div>

          </div>
        </section>


        {/* ========================================================================= */}
        {/* 4. LE FONCTIONNEMENT DU SÉQUESTRE NOTARIÉ DÉMYSTIFIÉ                       */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 mt-20">
          <div className="bg-[#161412] text-[#fbfaf7] rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#dcd6cb]">
                <Lock className="w-3.5 h-3.5 text-[#947346]" />
                <span>Protection Financière de l&apos;Acquéreur</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-medium text-white">
                Comment fonctionne le compte séquestre notarié ?
              </h2>
              <p className="text-xs sm:text-sm text-[#a39c92] font-light leading-relaxed max-w-2xl">
                Aucun versement n&apos;est jamais effectué à l&apos;agence ou au vendeur avant la signature de l&apos;acte authentique. Vos fonds sont sanctuarisés selon une mécanique contractuelle stricte.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10 text-xs">
              <div className="space-y-2">
                <span className="font-mono text-[#947346] font-semibold text-sm">01. Consignation</span>
                <p className="text-[#dcd6cb] font-light leading-relaxed">
                  À la signature de la promesse de vente, l&apos;acompte (usuellement 10%) est versé par virement bancaire sur le compte séquestre de l&apos;étude notariale.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[#947346] font-semibold text-sm">02. Déblocage du solde</span>
                <p className="text-[#dcd6cb] font-light leading-relaxed">
                  Le vendeur ne touche le prix qu&apos;au moment précis de la signature de l&apos;acte authentique de mutation, après vérification de l&apos;absence de toute hypothèque ou opposition.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[#947346] font-semibold text-sm">03. Clause de restitution 15 jours</span>
                <p className="text-[#dcd6cb] font-light leading-relaxed">
                  Si une condition suspensive échoue ou si le Livre Foncier révèle un vice caché du titre, les fonds vous sont <strong>intégralement restitués sous 15 jours ouvrés sans aucune retenue</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 5. ÉTUDES DE CAS RÉELLES ANONYMISÉES (RÉSULTATS 2025-2026)                 */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 mt-20 space-y-8">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold block">
              Retours d&apos;Expérience Concrets
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-[#161412]">
              Exemples Récents d&apos;Audits Conduit par le Cabinet.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Cas 1 : Villa Riviera Golf (Succès) */}
            <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[10px] font-semibold text-[#9E7431] border border-[#EAE5DC] inline-block">
                Mandat Validé • VIL-RG-2026
              </span>
              <h3 className="font-semibold text-sm text-[#161412]">Villa Duplex Cocody Riviera Golf 4</h3>
              <p className="text-xs text-[#68625c] font-light leading-relaxed">
                Réquisition N° 2024-0891/MCLU. Titre ACD purifié, bornage UTM certifié sans empiètement. Délai d&apos;audit préalable : 48h. Dossier prêt pour acte notarié.
              </p>
            </div>

            {/* Cas 2 : Parcelle Recalée (Risque évité pour l'acheteur !) */}
            <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[10px] font-semibold text-red-700 inline-block border border-red-200">
                Dossier Rejeté • Cocody Riviera 3
              </span>
              <h3 className="font-semibold text-sm text-[#161412]">Parcelle 800 m² présentée à 140 M FCFA</h3>
              <p className="text-xs text-[#68625c] font-light leading-relaxed">
                Le pré-audit a décelé un litige d&apos;indivision successorale non liquidé et une attestation villageoise caduque. <strong>Refus immédiat de publication du mandat.</strong>
              </p>
            </div>

            {/* Cas 3 : Terrain Bingerville (Succès) */}
            <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] space-y-3">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[10px] font-semibold text-[#9E7431] border border-[#EAE5DC] inline-block">
                Mandat Validé • TER-BG-600
              </span>
              <h3 className="font-semibold text-sm text-[#161412]">Parcelle d&apos;Angle 600 m² Bingerville</h3>
              <p className="text-xs text-[#68625c] font-light leading-relaxed">
                Arrêté de Concession Définitive régularisé auprès du MCLU. Viabilisation eau/électricité certifiée par procès-verbal d&apos;huissier. Acte sous promesse sécurisé.
              </p>
            </div>

          </div>
        </section>


        {/* ========================================================================= */}
        {/* 6. ÉTUDES NOTARIALES DE RÉFÉRENCE & GÉOMÈTRE AGRÉÉ                         */}
        {/* ========================================================================= */}
        <section className="max-w-5xl mx-auto px-6 sm:px-10 mt-20">
          <div className="bg-[#f5f2eb] rounded-3xl p-8 sm:p-10 border border-[#e8e4dc] space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-[#947346] font-semibold block">
                Officiers Ministériels Référents
              </span>
              <h2 className="text-2xl font-display font-medium text-[#161412]">
                Nos Partenaires de Confiance à Abidjan.
              </h2>
              <p className="text-xs text-[#68625c] font-light leading-relaxed">
                Vous êtes libre de faire intervenir votre notaire habituel. En l&apos;absence de conseil désigné, nos dossiers sont instruits auprès des études suivantes :
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] space-y-1.5 text-xs">
                <div className="font-semibold text-[#161412]">Étude Notariale Me J.-L. Koffi</div>
                <div className="text-[#68625c]">Notaire titulaire de charge</div>
                <div className="text-[11px] text-[#7a736a]">Immeuble Verdier, Abidjan-Plateau</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] space-y-1.5 text-xs">
                <div className="font-semibold text-[#161412]">Étude Me A. Traoré-Coulibaly</div>
                <div className="text-[#68625c]">Notaire titulaire de charge</div>
                <div className="text-[11px] text-[#7a736a]">Boulevard des Martyrs, Cocody</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] space-y-1.5 text-xs">
                <div className="font-semibold text-[#161412]">Cabinet Géo-Foncier OGE-CI</div>
                <div className="text-[#68625c]">Géomètre-Expert Inscrit N° 112</div>
                <div className="text-[11px] text-[#7a736a]">Ordre des Géomètres de Côte d&apos;Ivoire</div>
              </div>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* 7. ACTION : DEMANDER UN PRÉ-AUDIT GRATUIT                                  */}
        {/* ========================================================================= */}
        <section className="max-w-4xl mx-auto px-6 text-center space-y-8 mt-24">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-[#161412]">
              Vous possédez un bien ou hésitez sur un titre ?
            </h2>
            <p className="text-sm text-[#68625c] font-light max-w-2xl mx-auto leading-relaxed">
              Transmettez-nous une copie de vos documents fonciers (ACD, CMP, plan de bornage). Notre juriste foncier effectue un pré-contrôle de recevabilité sous 48h ouvrées, gratuitement et sous clause stricte de confidentialité.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <a
              href={whatsappAuditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full bg-[#161412] hover:bg-[#947346] text-white font-semibold transition-all duration-300 shadow-sm flex items-center gap-2"
            >
              <span>Demander un pré-audit documentaire</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/biens"
              className="px-8 py-3.5 rounded-full bg-white hover:bg-[#fbfaf7] border border-[#e8e4dc] text-[#161412] font-semibold transition-all duration-300"
            >
              Consulter nos 6 mandats validés
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
