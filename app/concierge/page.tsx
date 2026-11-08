'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Camera, Check, Send, Clock, Sparkles, AlertTriangle, 
  ChevronRight, ChevronLeft, Building2, MessageCircle, X, Plus, RefreshCw, 
  CheckCircle2, ArrowLeft, ExternalLink, Bed, Droplet, Flame, Home, Zap
} from 'lucide-react';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { Property, ConciergeCheckStatus, PropertyStatus, CleaningGrade } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';

interface StepPalier {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  items: string[];
  status: 'ok' | 'issue';
  comment: string;
  quickTags: string[];
  photos: string[];
}

const INITIAL_PALIERS: StepPalier[] = [
  {
    id: 'sejour',
    number: 1,
    title: 'Séjour & Réception',
    subtitle: 'Sols, vitrages panoramiques, canapés et dépoussiérage',
    items: [
      'Marbres et parquets lustrés sans traces',
      'Baies vitrées panoramiques nettoyées',
      'Canapés dépoussiérés et coussins disposés',
    ],
    status: 'ok',
    comment: 'Marbres propres, baies vitrées sans reflets, mobilier en parfait état.',
    quickTags: ['Marbre lustré', 'Vitrages impeccables', 'Coussins disposés', 'Clim 21°C OK'],
    photos: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'suites',
    number: 2,
    title: 'Suites & Chambres VIP',
    subtitle: 'Literie brodée, lits au carré, dressings et coffre-fort',
    items: [
      'Lits au carré avec draps en lin brodés',
      'Dressings et cintres ordonnés',
      'Coffre-fort et télécommandes testés',
    ],
    status: 'ok',
    comment: 'Lits au carré impeccables, linge changé, coffre-fort opérationnel.',
    quickTags: ['Lits au carré', 'Linge propre', 'Dressing ordonné', 'Clim chambre testée'],
    photos: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'sdb',
    number: 3,
    title: 'Salles de Bain & Eaux',
    subtitle: 'Robinetterie, pression SODECI, serviettes et savons d’accueil',
    items: [
      'Mitigeurs et miroirs sans traces de calcaire',
      'Pression d’eau SODECI et eau chaude immédiate',
      'Serviettes pliées et kit d’accueil VIP posé',
    ],
    status: 'ok',
    comment: 'Pression parfaite, eau chaude testée, serviettes et savons VIP en place.',
    quickTags: ['Pression SODECI OK', 'Eau chaude testée', 'Serviettes pliées', 'Savons posés'],
    photos: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'cuisine',
    number: 4,
    title: 'Cuisine & Cellier',
    subtitle: 'Réfrigérateur, four, machine à café et kit de bienvenue',
    items: [
      'Réfrigérateur vidé, nettoyé et désinfecté',
      'Machine à café détartrée et verres étincelants',
      'Champagne et eaux minérales au frais',
    ],
    status: 'ok',
    comment: 'Réfrigérateur et cave propres, boissons fraîches au cellier.',
    quickTags: ['Frigo & Four propres', 'Champagne au frais', 'Machine café OK', 'Poubelles vides'],
    photos: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: 'technique',
    number: 5,
    title: 'Extérieur, Piscine & Énergie',
    subtitle: 'Piscine filtrée, groupe électrogène 40 kVA et accès',
    items: [
      'Piscine limpide filtrée et terrasse balayée',
      'Groupe électrogène 40 kVA paré (fioul à 100%)',
      'Trousseau complet et télécommande portail vérifiés',
    ],
    status: 'ok',
    comment: 'Piscine propre, groupe 40 kVA paré, pass et portail fonctionnels.',
    quickTags: ['Bassin filtré', 'Groupe 40 kVA OK', 'Terrasse balayée', 'Pass portail OK'],
    photos: ['https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80'],
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

  // Actions sur le palier actif
  const activePalier = paliers[currentStepIndex];

  const updateActiveStatus = (status: 'ok' | 'issue') => {
    setPaliers((prev) =>
      prev.map((p, idx) => (idx === currentStepIndex ? { ...p, status } : p))
    );
  };

  const updateActiveComment = (comment: string) => {
    setPaliers((prev) =>
      prev.map((p, idx) => (idx === currentStepIndex ? { ...p, comment } : p))
    );
  };

  const addTagToActiveComment = (tag: string) => {
    setPaliers((prev) =>
      prev.map((p, idx) => {
        if (idx !== currentStepIndex) return p;
        const newComment = p.comment ? `${p.comment} • ${tag}` : tag;
        return { ...p, comment: newComment };
      })
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const url = reader.result as string;
        setPaliers((prev) =>
          prev.map((p, idx) =>
            idx === currentStepIndex ? { ...p, photos: [url, ...p.photos] } : p
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhotoFromActive = (photoIdx: number) => {
    setPaliers((prev) =>
      prev.map((p, idx) =>
        idx === currentStepIndex
          ? { ...p, photos: p.photos.filter((_, i) => i !== photoIdx) }
          : p
      )
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

    // Assemblage des commentaires de tous les paliers
    const notesSummary = paliers
      .map((p) => `• [Palier ${p.number} - ${p.title} : ${p.status === 'ok' ? 'Conforme' : 'À reprendre'}]\n  ${p.comment}`)
      .join('\n\n');

    // Collecte de toutes les photos des paliers
    const allPhotos = paliers.flatMap((p) => p.photos);

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
        cleaning: paliers[0].status === 'ok',
        linen: paliers[1].status === 'ok',
        plumbing: paliers[2].status === 'ok',
        welcome_kit: paliers[3].status === 'ok',
        ac_electricity: paliers[4].status === 'ok',
        keys_security: true,
      },
      zone_details: paliers.map((p) => ({
        id: p.id,
        name: p.title,
        status: p.status === 'ok' ? 'ok' : 'issue',
        comment: p.comment,
        photos: p.photos,
      })),
      notes: notesSummary,
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
              <span className="text-[10px] text-[#8C8275]">Check par Paliers</span>
            </div>
          </Link>

          {/* Horodatage & Chronomètre */}
          <div className="flex items-center gap-2 bg-[#F5F2EB] px-3 py-1.5 rounded-full border border-[#E5DFD3] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#6E665B]">Début: <strong>{startedAt}</strong></span>
            <span className="text-[#B3ABA0]">|</span>
            <span className="font-bold text-[#191715]">{formatTimer(seconds)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* ========================================================================= */}
        {/* 2. BIEN SÉLECTIONNÉ (COMPACT & CLAIR)                                     */}
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

        {/* Sélecteur de bien si déplié */}
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
        {/* 3. BARRE DE PROGRESSION DES PALIERS (1 à 5 + BILAN)                        */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-2.5 border border-[#EAE5DC] shadow-xs">
          <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold">
            <span className="text-[#8C8275]">
              {isLastReviewStep ? 'Palier Final : Validation' : `Palier ${currentStepIndex + 1} sur 5`}
            </span>
            <span className="text-[#9E7431] font-mono font-bold">
              {isLastReviewStep ? '100%' : `${Math.round(((currentStepIndex) / 5) * 100)}%`}
            </span>
          </div>

          {/* Stepper horizontal cliquable */}
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
                    {p.id === 'sejour' ? 'Séjour' : p.id === 'suites' ? 'Suites' : p.id === 'sdb' ? 'Bains' : p.id === 'cuisine' ? 'Cuisine' : 'Technique'}
                  </span>
                </button>
              );
            })}

            {/* Bouton Étape Finale */}
            <button
              type="button"
              onClick={() => setCurrentStepIndex(5)}
              className={`py-2 rounded-xl text-center transition-all ${
                isLastReviewStep
                  ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
                  : 'bg-[#F5F2EB] text-[#7A746B] hover:bg-[#EAE5DC]'
              }`}
              title="Bilan Final"
            >
              <span className="text-xs block leading-none font-bold">✓</span>
              <span className="text-[9px] block truncate px-1 mt-0.5">Bilan</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CONTENU DU PALIER ACTIF (1 À LA FOIS = FAIBLE CHARGE COGNITIVE)        */}
        {/* ========================================================================= */}
        {!isLastReviewStep && activePalier && (
          <section className="bg-white rounded-3xl p-5 border border-[#EAE5DC] shadow-xs space-y-4 animate-in fade-in duration-150">
            
            {/* En-tête du Palier */}
            <div className="border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9E7431] font-bold">
                  Palier {activePalier.number} sur 5
                </span>
                <span className="text-xs text-[#8C8275] font-mono">
                  {activePalier.photos.length} photo(s)
                </span>
              </div>
              <h3 className="text-base font-bold text-[#191715] mt-0.5">
                {activePalier.title}
              </h3>
              <p className="text-xs text-[#6E665B] mt-0.5">
                {activePalier.subtitle}
              </p>
            </div>

            {/* Éléments vérifiés dans ce palier */}
            <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#EAE5DC] space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#8C8275] font-bold block">
                Points de contrôle obligatoires :
              </span>
              <ul className="space-y-1.5 text-xs text-[#191715]">
                {activePalier.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Statut du Palier : Conforme ou À corriger */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#8C8275] block">
                Résultat pour ce palier :
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateActiveStatus('ok')}
                  className={`py-3 px-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                    activePalier.status === 'ok'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#6E665B] hover:bg-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-xs">Conforme 5★</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateActiveStatus('issue')}
                  className={`py-3 px-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                    activePalier.status === 'issue'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-500/20'
                      : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#6E665B] hover:bg-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                    ⚠️
                  </span>
                  <span className="text-xs">À corriger</span>
                </button>
              </div>
            </div>

            {/* COMMENTAIRE DÉDIÉ DU PALIER */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8C8275] block">
                Commentaire sur ce palier :
              </label>
              <textarea
                value={activePalier.comment}
                onChange={(e) => updateActiveComment(e.target.value)}
                rows={2}
                placeholder={`Remarques pour ${activePalier.title}...`}
                className="w-full bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl p-3 text-xs text-[#191715] focus:outline-none focus:border-[#9E7431] shadow-inner"
              />

              {/* Puces rapides en 1 clic */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activePalier.quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTagToActiveComment(tag)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#F5F2EB] text-[#554E45] hover:bg-[#EAE5DC] border border-[#E0DCD3]"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* PREUVE PHOTO DU PALIER */}
            <div className="space-y-2 pt-1 border-t border-[#F0EBE1]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#8C8275]">
                  Photo de ce palier ({activePalier.photos.length})
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-[#9E7431] flex items-center gap-1 hover:underline"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Prendre photo</span>
                </button>
              </div>

              {/* Vignettes photos */}
              {activePalier.photos.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {activePalier.photos.map((pUrl, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#EAE5DC] shrink-0 bg-black/10">
                      <Image src={pUrl} alt="Photo palier" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhotoFromActive(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* NAVIGATION DU STEPPER */}
            <div className="pt-2 flex items-center justify-between gap-3">
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
                <span>Valider &amp; Palier Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </section>
        )}

        {/* ========================================================================= */}
        {/* 5. ÉTAPE FINALE : BILAN GLOBAL & DIFFUSION ÉCOSYSTÈME                     */}
        {/* ========================================================================= */}
        {isLastReviewStep && (
          <section className="bg-white rounded-3xl p-5 border border-[#EAE5DC] shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="text-center border-b border-[#F0EBE1] pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
                ✓ Les 5 Paliers ont été vérifiés
              </span>
              <h3 className="text-base font-bold text-[#191715] mt-1.5">
                Bilan &amp; Statut de Disponibilité
              </h3>
              <p className="text-xs text-[#6E665B]">
                Durée totale de l&apos;audit : <strong className="text-[#191715] font-mono">{formatTimer(seconds)}</strong>
              </p>
            </div>

            {/* Récapitulatif compact des 5 paliers */}
            <div className="space-y-1.5 text-xs">
              {paliers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setCurrentStepIndex(p.number - 1)}
                  className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] flex items-center justify-between cursor-pointer hover:bg-white"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      p.status === 'ok' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {p.status === 'ok' ? '✓' : '!'}
                    </span>
                    <span className="font-bold truncate">{p.title}</span>
                  </div>
                  <span className="text-[10px] text-[#8C8275] font-mono shrink-0 ml-2">
                    Modifier ✎
                  </span>
                </div>
              ))}
            </div>

            {/* Choix du statut commercial à propager */}
            <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
              <span className="text-xs font-semibold text-[#8C8275] block">
                Statut officiel à diffuser sur le site &amp; Flipbook :
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFinalStatusChoice('ready')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                    finalStatusChoice === 'ready'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#6E665B]'
                  }`}
                >
                  <span className="block text-base">🟢</span>
                  <strong className="text-xs block mt-0.5">Disponible</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setFinalStatusChoice('cleaning')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                    finalStatusChoice === 'cleaning'
                      ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-500/20'
                      : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#6E665B]'
                  }`}
                >
                  <span className="block text-base">🟡</span>
                  <strong className="text-xs block mt-0.5">Nettoyage</strong>
                </button>

                <button
                  type="button"
                  onClick={() => setFinalStatusChoice('maintenance')}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                    finalStatusChoice === 'maintenance'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-2 ring-rose-500/20'
                      : 'bg-[#FAF8F5] border-[#EAE5DC] text-[#6E665B]'
                  }`}
                >
                  <span className="block text-base">🔴</span>
                  <strong className="text-xs block mt-0.5">Maintenance</strong>
                </button>
              </div>
            </div>

            {/* Bouton de retour vers un palier */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setCurrentStepIndex(4)}
                className="text-xs text-[#8C8275] hover:underline"
              >
                ◀ Revenir au Palier 5 (Extérieur &amp; Énergie)
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
                  <span>Certification en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>TRANSMETTRE LE RAPPORT COMPLET (5 PALIERS)</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
              className="w-full py-3.5 rounded-2xl bg-[#191715] hover:bg-[#9E7431] text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
            >
              <span>Continuer vers le Palier {currentStepIndex + 2} / 5</span>
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
              <h3 className="text-lg font-bold text-[#1A1816]">Audit Certifié !</h3>
              <p className="text-xs text-[#6E665B] mt-1">
                Les 5 paliers de <strong>{currentProperty?.title}</strong> ont été enregistrés et synchronisés.
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
                <span>Paliers validés :</span>
                <strong>5 sur 5</strong>
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
                  `✅ *Rapport d'Audit par Paliers*\n\nBien : *${currentProperty?.title}* (${currentProperty?.reference})\nInspecteur : ${inspectorName}\n\n⏱️ Début : ${startedAt} • Durée : ${formatTimer(seconds)}\n\n📋 *Synthèse des 5 Paliers :*\n${paliers.map((p) => `• P${p.number} ${p.title} : ${p.status === 'ok' ? 'Conforme 5★' : 'À revoir'}`).join('\n')}\n\nStatut commercial : ${finalStatusChoice === 'ready' ? '100% Prêt & Disponible' : finalStatusChoice === 'cleaning' ? 'En cours de nettoyage' : 'Maintenance'}\n\n👉 Le CRM et le Flipbook sont à jour en direct.`
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20BA59] text-black font-bold text-xs flex items-center justify-center gap-2 shadow"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Transmettre le Rapport à la Direction</span>
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
