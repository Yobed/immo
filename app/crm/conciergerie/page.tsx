'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, ShieldCheck, CheckCircle2, AlertTriangle, 
  Clock, Sparkles, RefreshCw, Smartphone, Key, Zap, Droplet, 
  Bed, UserCheck, MessageCircle, ExternalLink, Filter, Plus, ArrowUpRight
} from 'lucide-react';
import { useLiveProperties } from '@/lib/useLiveProperties';
import { Property, ConciergeCheckStatus, PropertyStatus, CleaningGrade } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';

export default function CrmConciergeriePage() {
  const { properties, inspections, isLoading, lastSyncTime, refresh } = useLiveProperties();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const readyCount = properties.filter((p) => p.concierge_status === 'ready' || p.status === 'available').length;
  const cleaningCount = properties.filter((p) => p.concierge_status === 'cleaning' || p.status === 'cleaning').length;
  const maintenanceCount = properties.filter((p) => p.concierge_status === 'maintenance' || p.status === 'maintenance').length;
  const reservedCount = properties.filter((p) => p.concierge_status === 'reserved' || p.status === 'reserved').length;

  const filteredProperties = properties.filter((p) => {
    if (filterStatus === 'ready' && (p.concierge_status !== 'ready' && p.status !== 'available')) return false;
    if (filterStatus === 'cleaning' && (p.concierge_status !== 'cleaning' && p.status !== 'cleaning')) return false;
    if (filterStatus === 'maintenance' && (p.concierge_status !== 'maintenance' && p.status !== 'maintenance')) return false;
    if (filterStatus === 'reserved' && (p.concierge_status !== 'reserved' && p.status !== 'reserved')) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.district.toLowerCase().includes(q);
    }
    return true;
  });

  const getStatusBadge = (status?: ConciergeCheckStatus, propStatus?: PropertyStatus) => {
    if (propStatus === 'cleaning' || status === 'cleaning') {
      return { label: 'Nettoyage en cours', color: 'bg-[#FAF8F5] text-[#161412] border-[#9E7431]/40' };
    }
    if (propStatus === 'reserved' || status === 'reserved') {
      return { label: 'Réservé VIP', color: 'bg-[#FAF8F5] text-[#161412] border-[#EAE5DC]' };
    }
    if (propStatus === 'maintenance' || status === 'maintenance') {
      return { label: 'Maintenance requise', color: 'bg-[#FAF8F5] text-[#161412] border-[#9E7431]/40' };
    }
    if (propStatus === 'rented' || status === 'occupied') {
      return { label: 'Occupé / Bail actif', color: 'bg-[#FAF8F5] text-[#6E665B] border-[#EAE5DC]' };
    }
    return { label: 'Prêt & Disponible', color: 'bg-[#FAF8F5] text-[#161412] border-[#EAE5DC]' };
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 font-sans max-w-7xl mx-auto">
      
      {/* ========================================================================= */}
      {/* 1. EN-TÊTE : MONITORING EN TEMPS RÉEL DU PARC HÔTELIER                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e8e4dc] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#947346] font-semibold">
              Supervision Opérationnelle Terrain
            </span>
            <span className="text-[10px] bg-[#FAF8F5] text-[#161412] px-2 py-0.5 rounded-full font-mono flex items-center gap-1 font-bold border border-[#EAE5DC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431] ring-2 ring-[#9E7431]/20" />
              Sync Écosystème
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#161412]">
            Conciergerie, Entretien &amp; Disponibilité
          </h1>
          <p className="text-xs text-[#68625c] mt-1">
            Contrôle continu de l&apos;état des villas, du linge hôtelier, des groupes électrogènes et synchronisation en direct avec le Flipbook 3D.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refresh()}
            className="p-2.5 rounded-xl border border-[#e8e4dc] bg-white hover:bg-[#f5f2eb] text-[#161412] transition-colors"
            title="Actualiser les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/concierge"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold flex items-center gap-2 shadow transition-all"
          >
            <Smartphone className="w-4 h-4 text-[#C8A97E]" />
            <span>Ouvrir l&apos;App Concierge Mobile</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATS RAPIDES PARC HÔTELIER                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Prêts */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'ready' ? 'all' : 'ready')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'ready' ? 'bg-[#FAF8F5] border-[#161412] shadow-sm ring-1 ring-[#161412]/10' : 'bg-white border-[#e8e4dc] hover:border-[#161412]/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#161412]">Prêts &amp; Disponibles</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#161412] ring-2 ring-[#161412]/10" />
          </div>
          <span className="text-2xl font-display font-bold text-[#161412] block">
            {readyCount}
          </span>
          <span className="text-[11px] text-[#7a736a] mt-0.5 block">
            Prêts pour emménagement
          </span>
        </div>

        {/* En nettoyage */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'cleaning' ? 'all' : 'cleaning')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'cleaning' ? 'bg-[#FAF8F5] border-[#9E7431] shadow-sm ring-1 ring-[#9E7431]/20' : 'bg-white border-[#e8e4dc] hover:border-[#9E7431]/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#161412]">En Nettoyage</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#9E7431]" />
          </div>
          <span className="text-2xl font-display font-bold text-[#161412] block">
            {cleaningCount}
          </span>
          <span className="text-[11px] text-[#7a736a] mt-0.5 block">
            Préparation hôtelière en cours
          </span>
        </div>

        {/* Réservés */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'reserved' ? 'all' : 'reserved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'reserved' ? 'bg-[#FAF8F5] border-[#161412] shadow-sm ring-1 ring-[#161412]/10' : 'bg-white border-[#e8e4dc] hover:border-[#161412]/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#161412]">Réservés VIP</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#9E7431]" />
          </div>
          <span className="text-2xl font-display font-bold text-[#161412] block">
            {reservedCount}
          </span>
          <span className="text-[11px] text-[#7a736a] mt-0.5 block">
            Visites imminentes programmées
          </span>
        </div>

        {/* Maintenance */}
        <div 
          onClick={() => setFilterStatus(filterStatus === 'maintenance' ? 'all' : 'maintenance')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'maintenance' ? 'bg-[#FAF8F5] border-[#161412] shadow-sm ring-1 ring-[#161412]/10' : 'bg-white border-[#e8e4dc] hover:border-[#161412]/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#161412]">Maintenance Requise</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#6E665B]" />
          </div>
          <span className="text-2xl font-display font-bold text-[#161412] block">
            {maintenanceCount}
          </span>
          <span className="text-[11px] text-[#7a736a] mt-0.5 block">
            Climatisation / Plomberie
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. TABLEAU DES BIENS & STATUTS CONCIERGERIE EN DIRECT                     */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
        
        {/* Barre de filtre */}
        <div className="p-4 border-b border-[#e8e4dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbfaf7]">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par référence, villa, quartier..."
              className="w-full bg-white border border-[#e8e4dc] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#947346]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#7a736a] font-mono">Filtrer :</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-[#161412] text-white font-bold' : 'bg-[#f5f2eb] text-[#161412]'
              }`}
            >
              Tous ({properties.length})
            </button>
            <button
              onClick={() => setFilterStatus('ready')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === 'ready' ? 'bg-[#161412] text-white font-bold' : 'bg-[#f5f2eb] text-[#161412]'
              }`}
            >
              Prêts ({readyCount})
            </button>
            <button
              onClick={() => setFilterStatus('cleaning')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === 'cleaning' ? 'bg-[#9E7431] text-white font-bold' : 'bg-[#f5f2eb] text-[#161412]'
              }`}
            >
              En cours ({cleaningCount})
            </button>
          </div>
        </div>

        {/* Liste des propriétés */}
        <div className="divide-y divide-[#e8e4dc]">
          {filteredProperties.map((prop) => {
            const badge = getStatusBadge(prop.concierge_status, prop.status);
            return (
              <div key={prop.id} className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-[#fbfaf7] transition-colors">
                
                {/* Infos Bien */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/10 shrink-0">
                    <Image src={prop.images[0]} alt={prop.title} fill className="object-cover" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-[#947346] font-bold">
                        {prop.reference}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono border font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] bg-[#f5f2eb] text-[#7a736a] px-2 py-0.5 rounded font-mono">
                        {prop.legal_status}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-[#161412] truncate">
                      {prop.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-[#7a736a] mt-0.5">
                      <span>{prop.district}</span>
                      <span>•</span>
                      <strong className="text-[#161412] font-semibold">{formatFCFA(prop.price)}</strong>
                      {prop.operation === 'rent' && <span className="text-[10px]">/ mois</span>}
                    </div>

                    {prop.inspection_notes && (
                      <p className="text-[11px] text-[#68625c] italic mt-1 line-clamp-1 bg-[#f5f2eb] px-2.5 py-1 rounded-lg">
                        « {prop.inspection_notes} »
                      </p>
                    )}
                  </div>
                </div>

                {/* Audit Hôtelier & Équipements */}
                <div className="flex items-center gap-4 shrink-0 text-xs text-[#7a736a]">
                  <div className="text-left lg:text-right space-y-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-[#161412]">
                      <UserCheck className="w-3.5 h-3.5 text-[#947346]" />
                      <span>{prop.last_inspector_name || 'Conciergerie Centrale'}</span>
                    </div>
                    <span className="text-[10px] font-mono block text-[#7a736a]">
                      {prop.last_inspection_date ? `Vérifié à ${new Date(prop.last_inspection_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Contrôle quotidien'}
                    </span>
                  </div>

                  {/* Actions Rapides */}
                  <div className="flex items-center gap-2">
                    <Link
                      href="/concierge"
                      target="_blank"
                      className="px-3.5 py-2 rounded-xl bg-[#161412] hover:bg-[#947346] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Effectuer un nouveau check sur le terrain"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C8A97E]" />
                      <span>Faire Check</span>
                    </Link>

                    <Link
                      href={`/biens/${prop.id}`}
                      target="_blank"
                      className="p-2 rounded-xl border border-[#e8e4dc] hover:bg-[#f5f2eb] text-[#161412] transition-colors"
                      title="Voir la fiche publique"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. DERNIERS RAPPORTS D'INSPECTION (AUDIT TRAIL)                            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e8e4dc] pb-3">
          <div>
            <h3 className="text-base font-display font-semibold text-[#161412]">
              Journal d&apos;Audit Conciergerie en Direct
            </h3>
            <p className="text-xs text-[#7a736a]">
              Mises à jour automatiques émises depuis l&apos;application concierge sur smartphone
            </p>
          </div>
          <span className="text-xs font-mono bg-[#f5f2eb] text-[#161412] px-3 py-1 rounded-full font-bold">
            {inspections.length} rapports archivés
          </span>
        </div>

        <div className="space-y-4">
          {inspections.map((insp) => (
            <div key={insp.id} className="p-5 rounded-2xl bg-[#fbfaf7] border border-[#e8e4dc] space-y-3 text-xs">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e8e4dc] pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm text-[#161412]">{insp.property_title}</strong>
                    <span className="text-[10px] font-mono font-bold text-[#947346]">({insp.property_reference})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#FAF8F5] text-[#9E7431] border border-[#EAE5DC]">
                      {insp.cleaning_grade === 'impeccable' ? '5/5 Impeccable' : insp.cleaning_grade}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#7a736a] text-[11px] flex-wrap">
                    <span>Inspecteur : <strong className="text-[#161412]">{insp.inspector_name}</strong> ({insp.inspector_role || 'Concierge'})</span>
                    <span>•</span>
                    <span>{new Date(insp.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] border ${
                    insp.check_status === 'ready' ? 'bg-[#FAF8F5] text-[#161412] border-[#EAE5DC]' : 'bg-[#FAF8F5] text-[#9E7431] border-[#9E7431]/40'
                  }`}>
                    {insp.check_status === 'ready' ? '100% Prêt & Conforme' : insp.check_status}
                  </span>
                </div>
              </div>

              {/* Horodatages d'intervention */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-[#e8e4dc] text-[11px] font-mono">
                <div>
                  <span className="text-[#7a736a] block text-[9px] uppercase">Début Check</span>
                  <span className="font-bold text-[#161412]">
                    {insp.started_at ? new Date(insp.started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '17:00:00'}
                  </span>
                </div>
                <div>
                  <span className="text-[#7a736a] block text-[9px] uppercase">Validation</span>
                  <span className="font-bold text-[#161412]">
                    {new Date(insp.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-[#7a736a] block text-[9px] uppercase">Durée Totale</span>
                  <span className="font-bold text-[#161412]">
                    {insp.duration_minutes ? `${insp.duration_minutes} min` : '15 min'}
                  </span>
                </div>
                <div>
                  <span className="text-[#7a736a] block text-[9px] uppercase">Photos Certifiées</span>
                  <span className="font-bold text-[#947346]">
                    {insp.photos ? `${insp.photos.length} cliché(s)` : 'Aucune'}
                  </span>
                </div>
              </div>

              {/* Notes et détail par zone */}
              {insp.notes && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#7a736a] font-bold">
                    Compte-rendu &amp; Observations :
                  </span>
                  <p className="text-[#403b34] bg-white p-3 rounded-xl border border-[#e8e4dc] whitespace-pre-line font-light">
                    {insp.notes}
                  </p>
                </div>
              )}

              {/* Galerie des photos attachées */}
              {insp.photos && insp.photos.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase text-[#7a736a] font-bold block">
                    Preuves Photographiques :
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {insp.photos.map((photoUrl, pIndex) => (
                      <div key={pIndex} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#e8e4dc] shrink-0 bg-black/10">
                        <Image src={photoUrl} alt="Photo contrôle" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
