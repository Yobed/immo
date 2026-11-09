'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  OBJECTION_INTELLIGENCE, KEYWORD_RADAR, CRM_ANALYTICS, INITIAL_CONTACTS 
} from '@/lib/mock-data';
import { formatFCFA } from '@/lib/utils';
import { 
  ShieldCheck, Search, Copy, Check, FileText, 
  Sparkles, MessageCircle, BarChart3, Scale, 
  Users, ArrowRight, Lock, Zap, Send,
  Building2, CheckCheck, FileCheck, HelpCircle
} from 'lucide-react';

// Données enrichies de l'Argus Immobilier Prestige Abidjan
const ABIDJAN_DISTRICT_BENCHMARK = [
  {
    district: 'Cocody Riviera Golf 4 & Ambassades',
    type: 'Villas d\'architecte & Duplex de standing',
    rentRange: '3 500 000 – 6 500 000 FCFA/m',
    tension: 94,
    avgDaysToLease: 11,
    targetProfile: 'Directeurs Généraux, Fonds Private Equity, Diplomates',
    coreLever: 'Proximité ambassades USA/France, sécurité cordon, groupe 60 kVA automatique.',
  },
  {
    district: 'Marcory Zone 4 & Biétry',
    type: 'Penthouses récents & Grands Appartements 4-5P',
    rentRange: '2 200 000 – 4 500 000 FCFA/m',
    tension: 96,
    avgDaysToLease: 8,
    targetProfile: 'Expatriés Tech/Énergie, Cadres Multinationals, Célibataires Fortune',
    coreLever: 'Piscine en toit-terrasse, ascenseur privatif à badge, vie nocturne et écoles françaises à 5 min.',
  },
  {
    district: 'Plateau (Centre des Affaires)',
    type: 'Bureaux d\'affaires & Appartements Direction',
    rentRange: '1 800 000 – 3 800 000 FCFA/m',
    tension: 88,
    avgDaysToLease: 16,
    targetProfile: 'Cabinets d\'Avocats Internationaux, Banques d\'Affaires, Délégations',
    coreLever: 'Bail corporate déductible fiscalement à 100%, conciergerie 24/7 et parking sécurisé en sous-sol.',
  },
  {
    district: 'Assinie-Mafia (Bord Lagunaire & Mer)',
    type: 'Villas Pieds dans l\'Eau & Pavillons de Réception',
    rentRange: '4 000 000 – 8 500 000 FCFA/m',
    tension: 91,
    avgDaysToLease: 14,
    targetProfile: 'Bailleurs de la Diaspora (Londres, Genève, Paris), Fondateurs d\'Entreprises',
    coreLever: 'Ponton privé aux normes maritimes DGAMP, personnel de gardiennage dédié et hélisurface.',
  },
];

// Scénarios prédéfinis pour le Simulateur Aya Co-Pilot
const SIMULATOR_PRESETS = [
  {
    id: 'preset-sequestre',
    label: 'Crainte sur la caution (2 mois)',
    clientQuery: '« En fin de bail à Abidjan, les bailleurs gardent la caution de plusieurs millions pour des prétextes futiles. Je refuse de verser 2 mois sans garantie. »',
    diagnosis: 'Frein de confiance majeur lié aux pratiques informelles du marché ivoirien. Le prospect craint une perte sèche de 7M à 12M FCFA.',
    responseScript: 'Monsieur, notre cabinet applique strictement le Protocole de Séquestre Notarié Agréé. La totalité de votre dépôt de garantie (2 mois) est consignée sur un compte séquestre ouvert en l\'étude de Me Traoré, notaire associé. Les fonds ne sont débloqués qu\'au vu de l\'état des lieux contradictoire certifié par commissaire de justice, avec restitution garantie sous 15 jours ouvrés.',
    proofDocument: 'Convention Tripartite de Séquestre Notarié & Barème d\'Usure Normale CIMA',
  },
  {
    id: 'preset-prix',
    label: 'Loyer 4,5M jugé trop élevé',
    clientQuery: '« 4 500 000 FCFA/mois pour la Villa Riviera Golf 4 me paraît au-dessus du marché. D\'autres villas du secteur sont proposées à 3,2M. »',
    diagnosis: 'Comparaison avec des biens non autonomes ou juridiquement précaires (sans groupe, sans titre ACD audité).',
    responseScript: 'Votre observation est légitime si l\'on compare à des villas standards. Toutefois, cette propriété intègre un groupe insonorisé Perkins 60 kVA révisé avec basculement automatique (< 8s), une bâche tampon SODECI de 5 000L, et surtout un titre foncier ACD purgé de tout recours. Le différentiel de loyer couvre l\'absence totale de risque d\'éviction et l\'indépendance énergétique 24/7 exigée par les sièges de multinationales.',
    proofDocument: 'Argus Foncier Notarial Riviera Golf 2026 & Certificat de Contrôle Énergétique',
  },
  {
    id: 'preset-diplomatique',
    label: 'Exigence de clause diplomatique',
    clientQuery: '« Notre chancellerie ne peut signer que si le préavis est ramené à 30 jours sans pénalité en cas de rappel d\'urgence de notre attaché. »',
    diagnosis: 'Exigence statutaire des missions diplomatiques et représentations consulaires internationales.',
    responseScript: 'Madame Vance, nous intégrons systématiquement la Clause Diplomatique Type validée par nos juristes. En cas de rappel de mission ou de mutation imprévue, le bail prend fin sous 30 jours sur simple remise de la note verbale de la chancellerie, avec restitution intégrale du séquestre de garantie après récolement d\'inventaire.',
    proofDocument: 'Avenant Diplomatique Standardisé (Conforme Convention de Vienne)',
  },
  {
    id: 'preset-energie',
    label: 'Coupures CIE & Pression d\'eau',
    clientQuery: '« Comment garantissez-vous que le groupe électrogène alimente toute la villa, y compris les climatiseurs centraux et la chambre froide ? »',
    diagnosis: 'Crainte d\'un sous-dimensionnement du groupe électrogène (situation fréquente lors des pics de chaleur à Abidjan).',
    responseScript: 'L\'installation a été dimensionnée avec une marge de puissance de 35% : le groupe diesel insonorisé de 60 kVA supporte simultanément la climatisation gainée inverter, les pompes de surpression et la cuisine professionnelle. Une cuve de réserve de 1 000L de gasoil assure une autonomie continue de 96 heures sans réapprovisionnement.',
    proofDocument: 'Fiche Technique d\'Essai en Charge SOCOTEC & Carnet d\'Entretien Groupe',
  },
];

export default function CrmIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'battlecards' | 'simulator' | 'market'>('battlecards');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulator State
  const [simulatorInput, setSimulatorInput] = useState('');
  const [activePreset, setActivePreset] = useState(SIMULATOR_PRESETS[0]);
  const [isCopiedSimulator, setIsCopiedSimulator] = useState(false);

  const filteredObjections = OBJECTION_INTELLIGENCE.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.client_verbatim.toLowerCase().includes(q) ||
        item.counter_argument.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopySimulator = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedSimulator(true);
    setTimeout(() => setIsCopiedSimulator(false), 2000);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans text-neutral-900">
      
      {/* ========================================================================= */}
      {/* 1. HEADER EXÉCUTIF ARCHITECTURAL (CHARBON ARCHITECTURAL & OR CHAMPAGNE)    */}
      {/* ========================================================================= */}
      <header className="relative bg-[#191715] text-white rounded-lg p-6 sm:p-8 border border-[#2D2926] shadow-sm overflow-hidden">
        
        {/* Accent géométrique d'arrière-plan */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#C8A97E]/15 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#C8A97E] font-semibold">
                Intelligence Commerciale &amp; Closing Notarié
              </span>
              <span className="text-neutral-500 text-xs">•</span>
              <span className="text-[11px] font-mono text-neutral-400">
                Aya IA Copilote v2.4
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Banque des Objections, Parades Juridiques &amp; Argus
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed">
              Le moteur d&apos;aide à la décision pour débloquer les signatures de baux de prestige à Abidjan : réquisitions foncières du Guichet Unique MCLU, conventions de séquestre Me Traoré et baromètre des loyers par secteur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/crm/contacts"
              className="px-4 py-2.5 rounded-md bg-white hover:bg-[#FAF8F5] text-[#161412] font-medium text-xs flex items-center gap-2 transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-[#161412]" />
              <span>Prospects Actifs ({INITIAL_CONTACTS.length})</span>
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className="px-4 py-2.5 rounded-md bg-[#9E7431] hover:bg-[#866226] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>Simulateur de Riposte</span>
            </button>
          </div>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. COCKPIT DES 4 KPIS STRATÉGIQUES DE CONVERSION                         */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Loyer Mensuel Sécurisé</span>
            <Lock className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900">
            {formatFCFA(CRM_ANALYTICS.kpis.total_pipeline_volume)}
          </div>
          <p className="text-xs text-neutral-600 font-normal">
            Baux corporate en instruction sous séquestre notarié.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Taux de Levée d&apos;Objection</span>
            <Scale className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900">
            88.5%
          </div>
          <p className="text-xs text-neutral-600 font-normal">
            +14% de conversion grâce aux pièces juridiques directes.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Délai d&apos;Audit Foncier</span>
            <FileCheck className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900">
            24h ouvrées
          </div>
          <p className="text-xs text-neutral-600 font-normal">
            Réquisition trentenaire certifiée au Livre Foncier.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Résolution Aya WhatsApp</span>
            <MessageCircle className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900">
            94.6%
          </div>
          <p className="text-xs text-neutral-600 font-normal">
            Réponses aux objections transmises sous 15 secondes.
          </p>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. NAVIGATION PAR ONGLETS ARCHITECTURAUX                                  */}
      {/* ========================================================================= */}
      <nav className="flex items-center gap-1 border-b border-neutral-200 text-xs" aria-label="Sous-sections Intelligence">
        <button
          type="button"
          onClick={() => setActiveTab('battlecards')}
          className={`py-2.5 px-3.5 font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'battlecards'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Matrice des Objections ({OBJECTION_INTELLIGENCE.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`py-2.5 px-3.5 font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'simulator'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Simulateur de Riposte Aya IA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('market')}
          className={`py-2.5 px-3.5 font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'market'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Argus Abidjan &amp; Radar Sémantique</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 4. ONGLET 1 : BATTLECARDS DES OBJECTIONS DE TERRAIN                       */}
      {/* ========================================================================= */}
      {activeTab === 'battlecards' && (
        <div className="space-y-5">
          
          {/* Barre d'outils & Filtres de catégories */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'Toutes les catégories' },
                { id: 'sequestre', label: '1. Séquestre & Caution (84%)' },
                { id: 'technique', label: '2. Autonomie Groupe & Eau (78%)' },
                { id: 'foncier', label: '3. Titre Foncier ACD (68%)' },
                { id: 'prix', label: '4. Charges & Copropriété (62%)' },
                { id: 'fiscalite', label: '5. Fiscalité DGI (52%)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher une objection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-neutral-900 text-neutral-900 placeholder-neutral-400"
              />
            </div>
          </div>

          {/* Grille des Battlecards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredObjections.map((item) => {
              const isCopied = copiedId === item.id;
              return (
                <article
                  key={item.id}
                  className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4 hover:border-neutral-900 transition-colors shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Card */}
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 font-semibold">
                          {item.category}
                        </span>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded border border-neutral-200 text-neutral-600">
                          Fréquence : {item.frequency}%
                        </span>
                      </div>

                      <span className="font-mono text-[10px] uppercase font-semibold text-neutral-500">
                        Niveau : {item.impact_level}
                      </span>
                    </div>

                    {/* Intitulé & Verbatim Client */}
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900">
                        {item.title}
                      </h2>

                      <blockquote className="mt-2 p-3 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 italic leading-relaxed">
                        {item.client_verbatim}
                      </blockquote>
                    </div>

                    {/* Riposte Déontologique Validée */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                        Riposte Déontologique Notariée :
                      </span>
                      <p className="text-xs text-neutral-800 leading-relaxed font-normal">
                        {item.counter_argument}
                      </p>
                    </div>

                    {/* Pièce Justificative & Action */}
                    <div className="p-2.5 rounded-md bg-neutral-50 border border-neutral-200 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-900">
                        <FileText className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                        <span className="truncate">{item.deliverable_proof}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Consigne : {item.suggested_action}
                      </p>
                    </div>
                  </div>

                  {/* Actions de Bas de Carte */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-neutral-400">
                      Réf. {item.id}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.counter_argument, item.id)}
                      className="px-3.5 py-1.5 rounded-md bg-neutral-900 hover:bg-black text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#C8A97E]" />
                          <span>Script Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-300" />
                          <span>Copier pour WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ONGLET 2 : SIMULATEUR DE RIPOSTE AYA IA (COPILOTE NÉGOCIATEUR)          */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Colonne Gauche : Sélecteur de Cas d'Urgence & Saisie (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="border-b border-neutral-100 pb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                Cas Pratiques Immédiats
              </span>
              <h2 className="text-base font-semibold text-neutral-900 mt-0.5">
                Sélectionnez l&apos;objection du prospect
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Choisissez un scénario de blocage pour générer l&apos;argumentaire adapté.
              </p>
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              {SIMULATOR_PRESETS.map((preset) => {
                const isSelected = preset.id === activePreset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setActivePreset(preset);
                      setSimulatorInput('');
                    }}
                    className={`w-full text-left p-3 rounded-md border text-xs transition-colors cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    <span className="font-semibold block">{preset.label}</span>
                    <span className={`line-clamp-1 italic text-[11px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {preset.clientQuery}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Saisie Libre Personnalisée */}
            <div className="pt-3 border-t border-neutral-100 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                Ou collez une objection personnalisée :
              </span>
              <textarea
                rows={3}
                placeholder="Ex : « Le prospect exige de ne payer le premier loyer qu'après le passage de son huissier... »"
                value={simulatorInput}
                onChange={(e) => setSimulatorInput(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-2.5 text-xs focus:outline-none focus:border-neutral-900 text-neutral-900 placeholder-neutral-400 resize-none"
              />
            </div>
          </div>

          {/* Colonne Droite : Riposte Générée par Aya IA (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 space-y-5 shadow-2xs">
            
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                  Recommandation Aya IA
                </span>
                <h3 className="text-base font-semibold text-neutral-900 mt-0.5">
                  Parade Juridique &amp; Cadrage Commercial
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-700 font-medium">
                Conforme Décret 2026/Baux
              </span>
            </div>

            {/* Objection Analysée */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                Objection Soulevée :
              </span>
              <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 italic">
                {simulatorInput.trim() ? simulatorInput : activePreset.clientQuery}
              </div>
            </div>

            {/* Diagnostic Psychologique */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                Analyse Psychologique du Risque :
              </span>
              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                {activePreset.diagnosis}
              </p>
            </div>

            {/* Script WhatsApp Prêt à Envoyer */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-900 font-semibold flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#9E7431]" />
                  <span>Script WhatsApp Recommandé (Mot-à-Mot) :</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Prêt à copier</span>
              </div>

              <div className="p-3.5 rounded-md bg-[#FAF8F5] border border-[#EAE5DC] text-xs text-[#161412] leading-relaxed shadow-2xs select-text">
                {activePreset.responseScript}
              </div>
            </div>

            {/* Pièce Justificative à Joindre */}
            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-neutral-700 shrink-0" />
                <div>
                  <span className="font-semibold text-neutral-900 block text-[11px]">
                    {activePreset.proofDocument}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Annexe certifiée sous séquestre notarié Me Traoré
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-300 bg-white text-neutral-700">
                PDF 100% Conforme
              </span>
            </div>

            {/* Bouton d'Action 1-Clic */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleCopySimulator(activePreset.responseScript)}
                className="px-4 py-2.5 rounded-md bg-neutral-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {isCopiedSimulator ? (
                  <>
                    <Check className="w-4 h-4 text-[#C8A97E]" />
                    <span>Script Copié dans le Presse-Papier !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-neutral-300" />
                    <span>Copier la Réponse pour WhatsApp</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ONGLET 3 : ARGUS IMMOBILIER ABIDJAN & RADAR SÉMANTIQUE                 */}
      {/* ========================================================================= */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          
          {/* Tableau Benchmark des Loyers de Prestige */}
          <section className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                  Baromètre des Secteurs Exclusifs
                </span>
                <h2 className="text-base font-semibold text-neutral-900 mt-0.5">
                  Argus des Loyers &amp; Taux de Tension Locative Abidjan
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                Source : Livre Foncier &amp; Baux Me Traoré 2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 font-mono text-[11px] text-neutral-500 uppercase tracking-wider">
                    <th className="py-2.5 pr-4 font-semibold">Secteur Cible</th>
                    <th className="py-2.5 px-4 font-semibold">Loyer Mensuel Médian</th>
                    <th className="py-2.5 px-4 font-semibold">Tension Locative</th>
                    <th className="py-2.5 px-4 font-semibold">Délai Relocation</th>
                    <th className="py-2.5 pl-4 font-semibold">Argument de Clôture Clé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {ABIDJAN_DISTRICT_BENCHMARK.map((b, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3.5 pr-4 font-medium text-neutral-900">
                        <div className="font-semibold text-xs">{b.district}</div>
                        <div className="text-[11px] text-neutral-500 font-normal">{b.type}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                        {b.rentRange}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-semibold text-neutral-900">{b.tension}%</span>
                        <span className="text-[10px] text-neutral-500 block">Demande &gt; Offre</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-700">
                        {b.avgDaysToLease} jours
                      </td>
                      <td className="py-3.5 pl-4 text-neutral-600 max-w-xs text-[11px] leading-relaxed">
                        {b.coreLever}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Radar NLP des Mots-Clés et Expressions Clés */}
          <section className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                  Analyse Sémantique des Échanges WhatsApp
                </span>
                <h3 className="text-base font-semibold text-neutral-900 mt-0.5">
                  Radar des 10 Requêtes &amp; Mots-Clés Prioritaires
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-500">
                124 conversations analysées
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KEYWORD_RADAR.map((kw, i) => (
                <div key={i} className="p-3.5 rounded-md bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 text-xs">{kw.keyword}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-neutral-200 bg-white text-neutral-600 uppercase">
                        {kw.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-neutral-500 font-normal">{kw.monthly_growth}</span>
                      <span className="text-neutral-900 font-semibold">{kw.inquiry_percentage}%</span>
                    </div>
                  </div>

                  {/* Progress Bar Monochrome Nette */}
                  <div className="w-full h-1.5 rounded bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 transition-all duration-500"
                      style={{ width: `${kw.inquiry_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}

    </div>
  );
}
