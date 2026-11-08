'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera, Check, Send, Clock, AlertTriangle, 
  ChevronRight, ChevronLeft, Building2, MessageCircle, X, Plus, RefreshCw, 
  CheckCircle2, ArrowLeft, ExternalLink, Bed, Droplet, Flame, Home, Zap,
  MessageSquare
} from 'lucide-react';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { Property, ConciergeCheckStatus, PropertyStatus, CleaningGrade, ControlPointAudit } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';

interface InspectionControlPoint {
  id: string;
  label: string;
  detail: string;
  status: 'ok' | 'issue';
  comment: string;
  quickTags: string[];
  photoUrl?: string;
}

interface StepPalier {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  points: InspectionControlPoint[];
}

const INITIAL_PALIERS: StepPalier[] = [
  {
    id: 'sejour',
    number: 1,
    title: 'Séjour & Réception',
    subtitle: 'Contrôle des sols, vitrages et mobilier',
    points: [
      {
        id: 'p1_sols',
        label: 'Sols & Marbres',
        detail: 'Aspiré, lustré, aucune trace de poussière ni tache',
        status: 'ok',
        comment: 'Marbres propres et lustrés sans trace.',
        quickTags: ['Impeccable', 'Lustrage parfait', 'Traces légères à repasser'],
      },
      {
        id: 'p1_vitres',
        label: 'Baies Vitrées Panoramiques',
        detail: 'Nettoyées intérieur & extérieur, sans reflets ni traces',
        status: 'ok',
        comment: 'Vitrages transparents et sans traces de doigts.',
        quickTags: ['Zéro trace', 'Baies éclatantes', 'Traces côté jardin'],
      },
      {
        id: 'p1_mobilier',
        label: 'Canapés, Mobilier & Table',
        detail: 'Dépoussiérés, coussins d’ornement disposés au cordeau',
        status: 'ok',
        comment: 'Coussins et assises en ordre, table dépoussiérée.',
        quickTags: ['En ordre parfait', 'Coussins alignés', 'Taches sur coussin'],
      },
    ],
  },
  {
    id: 'suites',
    number: 2,
    title: 'Suites & Chambres VIP',
    subtitle: 'Contrôle de la literie, des dressings et du confort',
    points: [
      {
        id: 'p2_literie',
        label: 'Literie & Lits au Carré',
        detail: 'Draps en lin brodé propres, repassés, lits tirés au carré',
        status: 'ok',
        comment: 'Lits au carré parfaits, linge frais changé ce matin.',
        quickTags: ['Lits au carré 5★', 'Linge propre', 'Drap froissé à reprendre'],
      },
      {
        id: 'p2_dressings',
        label: 'Dressings & Rangement',
        detail: 'Cintres en bois alignés, étagères dépoussiérées',
        status: 'ok',
        comment: 'Dressings ordonnés avec parfum d’ambiance.',
        quickTags: ['Cintres alignés', 'Dressing propre', 'Cintres manquants'],
      },
      {
        id: 'p2_clim',
        label: 'Climatisation & Coffre-fort',
        detail: 'Split silencieux testé à 21°C, coffre-fort testé ouvert',
        status: 'ok',
        comment: 'Climatiseurs silencieux à 21°C, coffre réinitialisé.',
        quickTags: ['Clim 21°C silencieuse', 'Coffre testé OK', 'Télécommande sans pile'],
      },
    ],
  },
  {
    id: 'sdb',
    number: 3,
    title: 'Salles de Bain & Eaux',
    subtitle: 'Contrôle robinetterie, serviettes et pression SODECI',
    points: [
      {
        id: 'p3_robinets',
        label: 'Robinetterie & Mitigeurs',
        detail: 'Chromages brillants, aucune trace de calcaire, bondes nettes',
        status: 'ok',
        comment: 'Mitigeurs étincelants sans calcaire.',
        quickTags: ['Chromage étincelant', 'Aucun calcaire', 'Traces sur mitigeur'],
      },
      {
        id: 'p3_pression',
        label: 'Pression SODECI & Eau Chaude',
        detail: 'Surpresseur actif, jet de douche puissant, eau chaude rapide',
        status: 'ok',
        comment: 'Excellente pression d’eau, chauffe-eau instantané.',
        quickTags: ['Pression SODECI OK', 'Eau chaude rapide', 'Pression faible'],
      },
      {
        id: 'p3_serviettes',
        label: 'Serviettes & Kit VIP',
        detail: 'Serviettes de bain moelleuses pliées, savons d’accueil posés',
        status: 'ok',
        comment: 'Serviettes brodées et kit cosmétique d’accueil en place.',
        quickTags: ['Kit VIP complet', 'Serviettes moelleuses', 'Savons manquants'],
      },
    ],
  },
  {
    id: 'cuisine',
    number: 4,
    title: 'Cuisine & Cellier',
    subtitle: 'Contrôle électroménager, propreté et boissons fraîches',
    points: [
      {
        id: 'p4_frigo',
        label: 'Réfrigérateur & Électroménager',
        detail: 'Intérieur désinfecté, sans odeur, plaques et four dégraissés',
        status: 'ok',
        comment: 'Réfrigérateur vidé et désinfecté, four propre.',
        quickTags: ['Frigo désinfecté', 'Four impeccable', 'Odeur dans le frigo'],
      },
      {
        id: 'p4_cafe',
        label: 'Machine à Café & Vaisselle',
        detail: 'Machine détartrée, capsules disponibles, verres étincelants',
        status: 'ok',
        comment: 'Machine opérationnelle avec capsules offertes, verres nets.',
        quickTags: ['Machine détartrée', 'Verres brillants', 'Recharge capsules requise'],
      },
      {
        id: 'p4_cellier',
        label: 'Cellier & Kit de Bienvenue',
        detail: 'Bouteilles d’eau et champagne au frais, poubelles vidées',
        status: 'ok',
        comment: 'Champagne et eaux au frais, poubelles désinfectées.',
        quickTags: ['Boissons au frais', 'Poubelles neuves', 'Bouteilles manquantes'],
      },
    ],
  },
  {
    id: 'technique',
    number: 5,
    title: 'Extérieur, Piscine & Énergie',
    subtitle: 'Contrôle bassin, groupe 40 kVA et accès sécurisés',
    points: [
      {
        id: 'p5_piscine',
        label: 'Piscine & Terrasse',
        detail: 'Bassin limpide filtré, skimmers vidés, deck teck balayé',
        status: 'ok',
        comment: 'Eau cristalline filtrée, abords de piscine balayés.',
        quickTags: ['Bassin limpide 100%', 'Deck balayé', 'Feuilles dans l’eau'],
      },
      {
        id: 'p5_groupe',
        label: 'Groupe Électrogène 40 kVA',
        detail: 'Réservoir de fioul plein, inverseur automatique prêt',
        status: 'ok',
        comment: 'Groupe 40 kVA paré avec plein de fioul vérifié.',
        quickTags: ['Fioul 100% paré', 'Inverseur testé', 'Niveau fioul bas'],
      },
      {
        id: 'p5_cles',
        label: 'Clés, Badges & Portail',
        detail: 'Trousseau complet, télécommande du portail motorisé testée',
        status: 'ok',
        comment: 'Pass et télécommandes du portail testés opérationnels.',
        quickTags: ['Pass & badges OK', 'Portail motorisé OK', 'Pile télécommande faible'],
      },
    ],
  },
];

export default function PhasedConciergeCheckPage() {
  const { properties, submitInspection } = useLiveProperties();

  // Bien sélectionné
  const [selectedId, setSelectedId] = useState<string>('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  // Palier actif (0 à 4 = les 5 paliers, 5 = Bilan final)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [paliers, setPaliers] = useState<StepPalier[]>(INITIAL_PALIERS);

  // Horodatage & Chronomètre de mission
  const [startedAt, setStartedAt] = useState<string>('');
  const [seconds, setSeconds] = useState(0);

  // Statut commercial final (Prêt / Nettoyage / Maintenance)
  const [finalStatusChoice, setFinalStatusChoice] = useState<'ready' | 'cleaning' | 'maintenance'>('ready');
  const [inspectorName, setInspectorName] = useState('Jean-Eudes Kouassi (Concierge)');

  // États d'envoi & succès
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Suivi du point actif pour l'upload de photo
  const [targetPointIdForPhoto, setTargetPointIdForPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialisation du premier bien et de l'heure
  useEffect(() => {
    if (properties.length > 0 && !selectedId) {
      setSelectedId(properties[0].id);
    }
    if (!startedAt) {
      setStartedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [properties, selectedId, startedAt]);

  // Chronomètre automatique
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentProperty = properties.find((p) => p.id === selectedId) || properties[0];

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const activePalier = paliers[currentStepIndex];

  // Mise à jour d'un point de contrôle spécifique
  const updatePointStatus = (pointId: string, status: 'ok' | 'issue') => {
    setPaliers((prev) =>
      prev.map((palier, pIdx) => {
        if (pIdx !== currentStepIndex) return palier;
        return {
          ...palier,
          points: palier.points.map((pt) =>
            pt.id === pointId ? { ...pt, status } : pt
          ),
        };
      })
    );
  };

  const updatePointComment = (pointId: string, comment: string) => {
    setPaliers((prev) =>
      prev.map((palier, pIdx) => {
        if (pIdx !== currentStepIndex) return palier;
        return {
          ...palier,
          points: palier.points.map((pt) =>
            pt.id === pointId ? { ...pt, comment } : pt
          ),
        };
      })
    );
  };

  const addTagToPointComment = (pointId: string, tag: string) => {
    setPaliers((prev) =>
      prev.map((palier, pIdx) => {
        if (pIdx !== currentStepIndex) return palier;
        return {
          ...palier,
          points: palier.points.map((pt) => {
            if (pt.id !== pointId) return pt;
            const newComment = pt.comment ? `${pt.comment} • ${tag}` : tag;
            return { ...pt, comment: newComment };
          }),
        };
      })
    );
  };

  // Gestion de la prise de photo sur un point de contrôle
  const triggerPhotoForPoint = (pointId: string) => {
    setTargetPointIdForPhoto(pointId);
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPointIdForPhoto) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const url = reader.result as string;
        setPaliers((prev) =>
          prev.map((palier, pIdx) => {
            if (pIdx !== currentStepIndex) return palier;
            return {
              ...palier,
              points: palier.points.map((pt) =>
                pt.id === targetPointIdForPhoto ? { ...pt, photoUrl: url } : pt
              ),
            };
          })
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhotoFromPoint = (pointId: string) => {
    setPaliers((prev) =>
      prev.map((palier, pIdx) => {
        if (pIdx !== currentStepIndex) return palier;
        return {
          ...palier,
          points: palier.points.map((pt) =>
            pt.id === pointId ? { ...pt, photoUrl: undefined } : pt
          ),
        };
      })
    );
  };

  // Validation finale et synchronisation
  const handleFinalSubmit = async () => {
    if (!currentProperty) return;
    setIsSending(true);

    const propStatusMap: Record<string, PropertyStatus> = {
      ready: 'available',
      cleaning: 'cleaning',
      maintenance: 'maintenance',
    };

    const gradeMap: Record<string, CleaningGrade> = {
      ready: 'impeccable',
      cleaning: 'satisfaisant',
      maintenance: 'a_revoir',
    };

    // Synthèse détaillée par point de contrôle
    const pointsSummaryLines: string[] = [];
    const allPhotos: string[] = [];

    paliers.forEach((palier) => {
      pointsSummaryLines.push(`[Palier ${palier.number} : ${palier.title}]`);
      palier.points.forEach((pt) => {
        const statusText = pt.status === 'ok' ? '[CONFORME]' : '[À REVOIR]';
        pointsSummaryLines.push(`  ${statusText} ${pt.label} : ${pt.comment || 'Vérifié conforme'}`);
        if (pt.photoUrl) allPhotos.push(pt.photoUrl);
      });
      pointsSummaryLines.push('');
    });

    const fullNotesSummary = pointsSummaryLines.join('\n');

    await submitInspection({
      property_id: currentProperty.id,
      property_title: currentProperty.title,
      property_reference: currentProperty.reference,
      inspector_name: inspectorName,
      inspector_phone: '+2250788421920',
      inspector_role: 'Concierge Terrain',
      started_at: new Date(Date.now() - seconds * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: Math.max(1, Math.round(seconds / 60)),
      check_status: finalStatusChoice,
      availability_status: propStatusMap[finalStatusChoice],
      cleaning_grade: gradeMap[finalStatusChoice],
      checklist: {
        cleaning: paliers[0].points.every((pt) => pt.status === 'ok'),
        linen: paliers[1].points.every((pt) => pt.status === 'ok'),
        plumbing: paliers[2].points.every((pt) => pt.status === 'ok'),
        welcome_kit: paliers[3].points.every((pt) => pt.status === 'ok'),
        ac_electricity: paliers[4].points.every((pt) => pt.status === 'ok'),
        keys_security: true,
      },
      zone_details: paliers.map((p) => ({
        id: p.id,
        name: p.title,
        status: p.points.every((pt) => pt.status === 'ok') ? 'ok' : 'issue',
        comment: p.points.map((pt) => `${pt.label}: ${pt.comment}`).join(' | '),
        points: p.points.map((pt) => ({
          id: pt.id,
          label: pt.label,
          status: pt.status,
          comment: pt.comment,
          photo_url: pt.photoUrl,
        })),
        photos: p.points.map((pt) => pt.photoUrl).filter(Boolean) as string[],
      })),
      notes: fullNotesSummary,
      photos: allPhotos,
    });

    setIsSending(false);
    setIsSuccess(true);
  };

  const isLastReviewStep = currentStepIndex === paliers.length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#191715] font-sans antialiased pb-28 selection:bg-[#C8A97E] selection:text-white">
      
      {/* Input photo caméra caché */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. HEADER OPÉRATIONNEL & CHRONOMÈTRE AUTOMATIQUE                          */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-[#EAE5DC] px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#191715] text-white flex items-center justify-center font-bold text-sm">
              A
            </span>
            <div>
              <span className="text-xs font-bold block leading-none">Supervision Ménage</span>
              <span className="text-[10px] text-[#8C8275]">Contrôle Point par Point</span>
            </div>
          </Link>

          {/* Horodatage & Chronomètre */}
          <div className="flex items-center gap-2 bg-[#F5F2EB] px-3 py-1.5 rounded-full border border-[#E5DFD3] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
            <span className="text-[#6E665B]">Début: <strong>{startedAt}</strong></span>
            <span className="text-[#B3ABA0]">|</span>
            <span className="font-bold text-[#191715]">{formatTimer(seconds)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* ========================================================================= */}
        {/* 2. BIEN SÉLECTIONNÉ (COMPACT)                                             */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-2xl p-3 border border-[#EAE5DC] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#EAE5DC]">
              {currentProperty && (
                <Image src={currentProperty.images[0]} alt={currentProperty.title} fill className="object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold text-[#9E7431] bg-[#F5F0E6] px-1.5 py-0.5 rounded">
                {currentProperty?.reference}
              </span>
              <h2 className="text-xs font-bold text-[#191715] truncate mt-0.5">
                {currentProperty?.title}
              </h2>
              <span className="text-[11px] text-[#8C8275]">
                {currentProperty?.district}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPropertyPicker(!showPropertyPicker)}
            className="text-xs text-[#9E7431] font-bold hover:underline shrink-0 ml-2"
          >
            {showPropertyPicker ? 'Fermer' : 'Changer'}
          </button>
        </section>

        {/* Sélecteur si cliqué */}
        {showPropertyPicker && (
          <div className="bg-white rounded-2xl p-3 border border-[#EAE5DC] space-y-1.5 max-h-56 overflow-y-auto">
            <span className="text-[11px] text-[#6E665B] block font-medium">Touchez un bien :</span>
            {properties.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  setShowPropertyPicker(false);
                }}
                className={`w-full p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                  p.id === selectedId ? 'bg-[#FBF8F1] border-[#9E7431] font-bold' : 'border-[#EAE5DC] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="truncate">{p.title}</span>
                <span className="text-[10px] text-[#8C8275] font-mono shrink-0 ml-2">{p.reference}</span>
              </button>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. STEPPER DES 5 PALIERS                                                  */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-2.5 border border-[#EAE5DC] shadow-xs">
          <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold">
            <span className="text-[#8C8275]">
              {isLastReviewStep ? 'Palier Final : Validation' : `Palier ${currentStepIndex + 1} sur 5`}
            </span>
            <span className="text-[#9E7431] font-mono font-bold">
              {isLastReviewStep ? '100%' : `${Math.round((currentStepIndex / 5) * 100)}%`}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {paliers.map((p, idx) => {
              const isCurrent = currentStepIndex === idx;
              const isDone = currentStepIndex > idx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`py-2 rounded-xl text-center transition-all ${
                    isCurrent
                      ? 'bg-[#191715] text-white font-bold ring-2 ring-[#9E7431]'
                      : isDone
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : 'bg-[#F5F2EB] text-[#7A746B] hover:bg-[#EAE5DC]'
                  }`}
                  title={p.title}
                >
                  <span className="text-xs block leading-none font-bold">P{p.number}</span>
                  <span className="text-[9px] block truncate px-1 mt-0.5">
                    {p.id === 'sejour' ? 'Séjour' : p.id === 'suites' ? 'Suites' : p.id === 'sdb' ? 'Bains' : p.id === 'cuisine' ? 'Cuisine' : 'Extérieur'}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentStepIndex(5)}
              className={`py-2 rounded-xl text-center transition-all ${
                isLastReviewStep
                  ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
                  : 'bg-[#F5F2EB] text-[#7A746B] hover:bg-[#EAE5DC]'
              }`}
              title="Bilan"
            >
              <span className="text-xs block leading-none font-bold">✓</span>
              <span className="text-[9px] block truncate px-1 mt-0.5">Bilan</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. PALIER ACTIF : LES POINTS OBLIGATOIRES AVEC LEURS REMARQUES DÉDIÉES    */}
        {/* ========================================================================= */}
        {!isLastReviewStep && activePalier && (
          <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EAE5DC] shadow-xs space-y-4 animate-in fade-in duration-150">
            
            {/* Titre du palier */}
            <div className="border-b border-[#F0EBE1] pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E7431] font-bold block">
                Palier {activePalier.number} sur 5
              </span>
              <h3 className="text-base font-bold text-[#191715] mt-0.5">
                {activePalier.title}
              </h3>
              <p className="text-xs text-[#6E665B] mt-0.5">
                {activePalier.subtitle}
              </p>
            </div>

            {/* LISTE DES POINTS DE CONTRÔLE AVEC LEUR PROPRE CHAMP REMARQUE */}
            <div className="space-y-4">
              {activePalier.points.map((pt, ptIdx) => (
                <div
                  key={pt.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    pt.status === 'ok'
                      ? 'bg-[#FAF8F5] border-[#E8E4DC]'
                      : 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                  }`}
                >
                  
                  {/* Ligne 1 : Intitulé du point + Boutons d'état */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#191715]">
                          {ptIdx + 1}. {pt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A746B] mt-0.5">
                        {pt.detail}
                      </p>
                    </div>

                    {/* Boutons d'état du point */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updatePointStatus(pt.id, 'ok')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          pt.status === 'ok'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-[#DDD7CC] text-[#6E665B] hover:bg-[#F2EFE9]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Conforme</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updatePointStatus(pt.id, 'issue')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          pt.status === 'issue'
                            ? 'bg-amber-500 text-black shadow-xs font-black'
                            : 'bg-white border border-[#DDD7CC] text-[#6E665B] hover:bg-[#F2EFE9]'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>À revoir</span>
                      </button>
                    </div>
                  </div>

                  {/* Ligne 2 : CHAMP DE REMARQUE DÉDIÉ DIRECTEMENT À CE POINT */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-[#7A746B] font-bold flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-[#9E7431]" />
                        <span>Remarque sur &quot;{pt.label}&quot; :</span>
                      </label>

                      {/* Bouton photo sur ce point */}
                      <button
                        type="button"
                        onClick={() => triggerPhotoForPoint(pt.id)}
                        className="text-[11px] font-bold text-[#9E7431] flex items-center gap-1 hover:underline cursor-pointer"
                        title="Prendre une photo pour ce point précis"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{pt.photoUrl ? 'Changer photo' : '+ Photo'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={pt.comment}
                      onChange={(e) => updatePointComment(pt.id, e.target.value)}
                      placeholder={`Votre remarque sur ${pt.label.toLowerCase()}...`}
                      className="w-full bg-white text-[#191715] border border-[#DDD7CC] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#9E7431] shadow-xs placeholder:text-[#9A9387]"
                    />

                    {/* Puces de remarques rapides pour ce point */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {pt.quickTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTagToPointComment(pt.id, tag)}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#554E45] hover:bg-[#EAE5DC] border border-[#E0DCD3] transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    {/* Miniature de photo si jointe */}
                    {pt.photoUrl && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#9E7431]/40 mt-1.5 shadow-xs">
                        <Image src={pt.photoUrl} alt="Photo du point" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhotoFromPoint(pt.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center text-xs"
                          title="Supprimer la photo"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* NAVIGATION DU STEPPER */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#F0EBE1]">
              <button
                type="button"
                onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className="py-3 px-4 rounded-xl border border-[#DDD7CC] text-xs font-bold text-[#6E665B] hover:bg-[#FAF8F5] disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#191715] hover:bg-[#9E7431] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors"
              >
                <span>Valider le Palier {activePalier.number} &amp; Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. ÉTAPE FINALE : BILAN & REMARQUES CENTRALISÉES                          */}
        {/* ========================================================================= */}
        {isLastReviewStep && (
          <section className="bg-white rounded-3xl p-5 border border-[#EAE5DC] shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="text-center border-b border-[#F0EBE1] pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
                ✓ Tous les points de contrôle ont été commentés
              </span>
              <h3 className="text-base font-bold text-[#191715] mt-1.5">
                Bilan &amp; Remarques par Point
              </h3>
              <p className="text-xs text-[#6E665B]">
                Durée d&apos;intervention : <strong className="text-[#191715] font-mono">{formatTimer(seconds)}</strong>
              </p>
            </div>

            {/* Récapitulatif point par point */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {paliers.map((palier) => (
                <div key={palier.id} className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#9E7431]">
                      Palier {palier.number} • {palier.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStepIndex(palier.number - 1)}
                      className="text-[10px] text-[#8C8275] hover:underline"
                    >
                      Modifier ✎
                    </button>
                  </div>

                  <div className="space-y-1">
                    {palier.points.map((pt) => (
                      <div key={pt.id} className="text-xs flex items-start gap-2 bg-white p-2 rounded-xl border border-[#F0EBE1]">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${
                          pt.status === 'ok' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {pt.status === 'ok' ? '✓' : '!'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <strong className="text-[11px] block">{pt.label}</strong>
                          <span className="text-[11px] text-[#6E665B] block italic">
                            « {pt.comment || 'Conforme aux standards'} »
                          </span>
                        </div>
                        {pt.photoUrl && (
                          <span className="text-[10px] font-mono text-[#9E7431] bg-[#F5F0E6] px-1.5 py-0.5 rounded shrink-0 inline-flex items-center gap-1">
                            <Camera className="w-2.5 h-2.5" />
                            <span>Photo</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Statut final à diffuser */}
            <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
              <span className="text-xs font-semibold text-[#8C8275] block">
                Statut officiel à diffuser en direct :
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFinalStatusChoice('ready')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                    finalStatusChoice === 'ready'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#6E665B]'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 mx-auto block mb-1" />
                  <strong className="text-xs block mt-0.5">Disponible</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setFinalStatusChoice('cleaning')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                    finalStatusChoice === 'cleaning'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-500/20'
                      : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#6E665B]'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 mx-auto block mb-1" />
                  <strong className="text-xs block mt-0.5">Nettoyage</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setFinalStatusChoice('maintenance')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                    finalStatusChoice === 'maintenance'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-2 ring-rose-500/20'
                      : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#6E665B]'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 mx-auto block mb-1" />
                  <strong className="text-xs block mt-0.5">Maintenance</strong>
                </button>
              </div>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setCurrentStepIndex(4)}
                className="text-xs text-[#8C8275] hover:underline"
              >
                ◀ Revenir au Palier 5
              </button>
            </div>

          </section>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 6. GROS BOUTON VERT D'ENVOI AU BAS DE L'ÉCRAN                             */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 border-t border-[#EAE5DC] backdrop-blur-md z-30">
        <div className="max-w-lg mx-auto">
          {isLastReviewStep ? (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSending}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Transmission du rapport...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>TRANSMETTRE TOUTES LES REMARQUES AU CRM</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
              className="w-full py-3.5 rounded-2xl bg-[#191715] hover:bg-[#9E7431] text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
            >
              <span>Valider &amp; Passer au Palier {currentStepIndex + 2} / 5</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. MODAL DE SUCCÈS & ENVOI DIRECT WHATSAPP                                 */}
      {/* ========================================================================= */}
      {isSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-bold">
              ✓
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#1A1816]">Contrôle Validé !</h3>
              <p className="text-xs text-[#6E665B] mt-1">
                Toutes les remarques par point de contrôle de <strong>{currentProperty?.title}</strong> ont été synchronisées.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F5F2EB] text-xs font-mono text-[#554E45] space-y-1 text-left">
              <div className="flex justify-between">
                <span>Début de mission :</span>
                <strong>{startedAt}</strong>
              </div>
              <div className="flex justify-between">
                <span>Durée d&apos;intervention :</span>
                <strong className="text-emerald-700">{formatTimer(seconds)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Statut diffusé :</span>
                <strong className="text-[#9E7431] uppercase">
                  {finalStatusChoice === 'ready' ? 'Disponible' : finalStatusChoice === 'cleaning' ? 'Nettoyage' : 'Maintenance'}
                </strong>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={getWhatsAppLink(
                  '2250788421920',
                  `*Rapport d'Audit Contrôle Point par Point*\n\nBien : *${currentProperty?.title}* (${currentProperty?.reference})\nInspecteur : ${inspectorName}\n\nDébut : ${startedAt} • Durée : ${formatTimer(seconds)}\n\n*Remarques par Point de Contrôle :*\n${paliers.map((p) => p.points.map((pt) => `• [${pt.status === 'ok' ? 'CONFORME' : 'À REVOIR'}] ${pt.label} : ${pt.comment}`).join('\n')).join('\n')}\n\nStatut commercial : ${finalStatusChoice === 'ready' ? '100% Prêt & Disponible' : finalStatusChoice === 'cleaning' ? 'En cours de nettoyage' : 'Maintenance'}\n\nLe CRM et le Flipbook sont synchronisés en direct.`
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20BA59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Transmettre le Rapport Détaillé (WhatsApp)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setCurrentStepIndex(0);
                  setSeconds(0);
                  setStartedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
                }}
                className="w-full py-2.5 rounded-xl bg-[#EAE5DC] text-[#1A1816] text-xs font-bold"
              >
                Nouvelle inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
