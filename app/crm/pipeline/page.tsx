'use client';

import React, { useState } from 'react';
import { INITIAL_DEALS, INITIAL_PROPERTIES, INITIAL_CONTACTS } from '@/lib/mock-data';
import { Deal, DealStage } from '@/lib/types';
import { formatFCFA } from '@/lib/utils';
import { GitPullRequest, ArrowRight, ArrowLeft, ShieldCheck, Key, Home, FileText, Calendar, LogOut, CheckCircle2, UserCheck } from 'lucide-react';

const STAGES: { id: DealStage; label: string; badge: string }[] = [
  { id: 'new_lead', label: '1. Demandes Locatives', badge: 'bg-slate-100 text-slate-700' },
  { id: 'qualified', label: '2. Dossiers Validés (KYC)', badge: 'bg-blue-50 text-blue-700' },
  { id: 'visit_scheduled', label: '3. Visites Terrain', badge: 'bg-amber-50 text-amber-700' },
  { id: 'offer_made', label: '4. Accord Bailleur', badge: 'bg-purple-50 text-purple-700' },
  { id: 'under_contract', label: '5. Bail & Caution Séquestrée', badge: 'bg-emerald-50 text-emerald-800' },
  { id: 'closed_won', label: '6. Clés Remises & Loué', badge: 'bg-emerald-700 text-white' },
  { id: 'closed_lost', label: '7. Baux Terminés & Sorties', badge: 'bg-rose-50 text-rose-800 border border-rose-200' },
];

export default function CrmPipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);

  const totalMonthlyRent = deals.reduce((acc, d) => acc + d.deal_value, 0);
  const totalPlacementFees = deals.reduce((acc, d) => acc + d.commission_expected, 0);

  const moveDeal = (dealId: string, direction: 'prev' | 'next') => {
    setDeals(
      deals.map((deal) => {
        if (deal.id !== dealId) return deal;
        const currentIndex = STAGES.findIndex((s) => s.id === deal.stage);
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < STAGES.length) {
          return { ...deal, stage: STAGES[nextIndex].id };
        }
        return deal;
      })
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 font-sans bg-[#fbfaf7] text-[#161412]">
      
      {/* Header & Metrics (Harmonisé Jaune Or #FFD84D - Tuile Score Qualité & Baux) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFD84D] text-[#15161A] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#e6be2e] shadow-warm-xs relative overflow-hidden">
        
        {/* Voile décoratif subtil */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/25 to-transparent pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#15161A]/80 bg-white/40 px-2.5 py-0.5 rounded-full">
              Flux Locatif, Notarial &amp; Séquestres
            </span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#15161A] text-white shadow-xs">
              Score Qualité 96/100
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#15161A] tracking-tight">
            Pipeline des Baux &amp; Conformité Locative
          </h1>
          <p className="text-xs text-[#15161A]/85 font-medium max-w-2xl">
            Suivi du cycle locatif : de la qualification du dossier à la signature sous séquestre notarié et remise des clés.
          </p>
        </div>

        {/* Metrics Box (Blanc contrasté sur fond jaune) */}
        <div className="flex items-center gap-5 bg-white/95 backdrop-blur-xs border border-white/60 px-5 py-3 rounded-2xl shadow-warm-xs z-10 self-start md:self-auto">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Loyers Mensuels</span>
            <span className="text-sm sm:text-base font-black text-slate-900">
              {formatFCFA(totalMonthlyRent)} <small className="text-xs font-normal text-slate-500">/ mois</small>
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Honoraires Placement</span>
            <span className="text-sm sm:text-base font-black text-[#947346]">
              {formatFCFA(totalPlacementFees)}
            </span>
          </div>
        </div>

      </div>

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-6 items-start">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((acc, d) => acc + d.deal_value, 0);

          return (
            <div
              key={stage.id}
              className="bg-white border border-[#e8e4dc] rounded-2xl p-3.5 flex flex-col min-w-[210px] shadow-warm-xs"
            >
              {/* Column Header */}
              <div className="border-b border-[#f0ede6] pb-2.5 mb-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 tracking-tight leading-snug">
                    {stage.label}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stage.badge}`}>
                    {stageDeals.length}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  {stageTotal > 0 ? `${formatFCFA(stageTotal)} / mois` : '0 FCFA'}
                </div>
              </div>

              {/* Deals cards inside column */}
              <div className="space-y-2.5 flex-1 min-h-[140px]">
                {stageDeals.length === 0 ? (
                  <div className="h-24 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    Aucun dossier
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const cont = INITIAL_CONTACTS.find((c) => c.id === deal.contact_id);
                    const prop = INITIAL_PROPERTIES.find((p) => p.id === deal.property_id);

                    return (
                      <div
                        key={deal.id}
                        className="bg-[#fbfaf7] border border-[#e8e4dc] rounded-xl p-3 shadow-2xs space-y-2 hover:border-[#947346] transition-colors"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-900 block leading-snug">
                            {deal.title}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate font-normal mt-0.5">
                            Candidat : {cont?.full_name}
                          </span>
                          {prop && (
                            <span className="text-[10px] text-slate-400 block truncate font-normal">
                              {prop.district}
                            </span>
                          )}
                        </div>

                        {/* Date de signature du contrat / bail */}
                        <div className="flex items-center gap-1.5 text-[11px] bg-white p-2 rounded-lg border border-slate-200/80">
                          <Calendar className="w-3.5 h-3.5 text-[#008069] shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                              {stage.id === 'closed_won' ? 'Bail Signé Le :' : stage.id === 'closed_lost' ? 'Bail Résilié Le :' : 'Date Signature :'}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {deal.expected_closing_date 
                                ? new Date(deal.expected_closing_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                : 'À fixer'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#f0ede6] flex items-center justify-between">
                          <div>
                            <div className="text-xs font-sans font-bold text-slate-900">
                              {formatFCFA(deal.deal_value)} <span className="text-[10px] font-normal text-slate-500">/ mois</span>
                            </div>
                            <div className="text-[10px] text-[#947346] font-medium">
                              Hon. : {formatFCFA(deal.commission_expected)}
                            </div>
                          </div>
                        </div>

                        {deal.notes && (
                          <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded-md border border-slate-100 line-clamp-2">
                            {deal.notes}
                          </p>
                        )}

                        {/* Special Action: Client qui quitte les lieux */}
                        {stage.id === 'closed_won' && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeals(deals.map(d => d.id === deal.id ? { ...d, stage: 'closed_lost', notes: 'Bail résilié • Le locataire a quitté les lieux. État des lieux de sortie sans réserve.' } : d));
                            }}
                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Basculer le client vers l'étape des baux terminés / sortie"
                          >
                            <LogOut className="w-3 h-3 text-rose-700" />
                            <span>Acter départ / Fin de bail</span>
                          </button>
                        )}

                        {stage.id === 'closed_lost' && (
                          <div className="p-1.5 bg-rose-50 text-rose-800 rounded-lg text-[10px] font-semibold text-center border border-rose-200">
                            🚪 Locataire ayant quitté les lieux (Bien libéré)
                          </div>
                        )}

                        {/* Direction controls */}
                        <div className="pt-2 flex items-center justify-between border-t border-[#f0ede6] text-xs">
                          <button
                            onClick={() => moveDeal(deal.id, 'prev')}
                            disabled={stage.id === 'new_lead'}
                            className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Étape précédente"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] text-slate-400">Étape</span>
                          <button
                            onClick={() => moveDeal(deal.id, 'next')}
                            disabled={stage.id === 'closed_lost'}
                            className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Étape suivante"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
