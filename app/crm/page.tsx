'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  INITIAL_PROPERTIES, 
  INITIAL_CONTACTS, 
  INITIAL_VISITS, 
  INITIAL_DEALS 
} from '@/lib/mock-data';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { 
  Building2, Users, Calendar, TrendingUp, MessageCircle, 
  ArrowUpRight, ShieldCheck, CheckCircle2, Clock, Sparkles,
  Target, ArrowRight, Flame, Key, Home, Check,
  AlertTriangle, ChevronRight, X, ExternalLink, Bot, Eye,
  SlidersHorizontal, CheckCircle, RefreshCw, Phone, Play
} from 'lucide-react';

export default function CrmDashboardPage() {
  const [activeTab, setActiveTab] = useState<'aujourdhui' | 'valider' | 'portefeuille' | 'machine'>('aujourdhui');
  
  // Interactive Todo state
  const [completedTodos, setCompletedTodos] = useState<string[]>([]);
  
  // Quick Triage modal state (inspired by .tri in tableau-de-bord.html)
  const [triageOpen, setTriageOpen] = useState(false);
  const [triageIndex, setTriageIndex] = useState(0);

  // Key Calculations
  const totalMonthlyRentPortfolio = INITIAL_PROPERTIES.reduce((acc, p) => acc + p.price, 0);
  const hotLeads = INITIAL_CONTACTS.filter((c) => c.lead_score === 'hot');
  const scheduledVisits = INITIAL_VISITS.filter((v) => v.status === 'scheduled');
  const potentialPlacementFees = INITIAL_DEALS.reduce((acc, d) => acc + d.commission_expected, 0);

  // Next scheduled visit
  const nextVisit = scheduledVisits[0] || INITIAL_VISITS[0];
  const nextVisitProperty = INITIAL_PROPERTIES.find(p => p.id === nextVisit.property_id);
  const nextVisitContact = INITIAL_CONTACTS.find(c => c.id === nextVisit.contact_id);

  // Todo Items definitions with estimated minutes
  const todoList = [
    {
      id: 'todo-1',
      title: 'Confirmer la visite de prise de bail à 15:30 (Villa Riviera Golf)',
      subtitle: 'Jean-Philippe Konan (Fonds Private Equity) viendra avec son juriste et le responsable logistique.',
      duration: '10 min',
      category: 'Terrain',
      contactPhone: nextVisitContact?.phone || '+2250748221100',
      contactName: nextVisitContact?.full_name || 'Jean-Philippe Konan',
      actionUrl: '/crm/visites',
      actionLabel: 'Gérer la visite',
      whatsappText: 'Bonjour M. Konan, nous vous confirmons le rendez-vous pour la Villa Riviera Golf à 15h30. Les clés et le dossier foncier sont prêts.'
    },
    {
      id: 'todo-2',
      title: 'Transmettre le projet de bail sous séquestre notarié (Zone 4)',
      subtitle: 'Mme Marie-Laure Doumbia (Directrice Juridique) attend l\'inventaire certifié et le compte CDC-CI.',
      duration: '15 min',
      category: 'Juridique',
      contactPhone: '+2250555123456',
      contactName: 'Marie-Laure Doumbia',
      actionUrl: '/crm/pipeline',
      actionLabel: 'Ouvrir Kanban Baux',
      whatsappText: 'Bonjour Mme Doumbia, voici le protocole de séquestre notarié et l\'état des lieux pré-rempli pour le Penthouse Zone 4.'
    },
    {
      id: 'todo-3',
      title: 'Vérifier la conformité de l\'état des lieux contradictoire huissier',
      subtitle: 'Villa d\'Architecte Beverly Hills (M. de Saint-Germain, Orange CI). Homologation logement de fonction.',
      duration: '20 min',
      category: 'Séquestre',
      contactPhone: '+2250788990011',
      contactName: 'M.-A. de Saint-Germain',
      actionUrl: '/crm/visites',
      actionLabel: 'Fiche Visite',
      whatsappText: 'Bonjour M. de Saint-Germain, le commissaire de justice a validé l\'état des lieux sur 120 points.'
    },
    {
      id: 'todo-4',
      title: 'Relancer les 2 candidats en attente de justificatifs de revenus',
      subtitle: 'Attestation employeur multinationale et virement de caution pour libérer les signatures.',
      duration: '10 min',
      category: 'Solvabilité',
      contactPhone: '+2250709887766',
      contactName: 'M. Stéphane Brou',
      actionUrl: '/crm/contacts',
      actionLabel: 'Voir les contacts',
      whatsappText: 'Bonjour M. Brou, pour finaliser votre dossier locatif, il nous manque l\'attestation employeur récente. Merci !'
    }
  ];

  const toggleTodo = (id: string) => {
    setCompletedTodos(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const remainingMinutes = todoList
    .filter(t => !completedTodos.includes(t.id))
    .reduce((acc, t) => acc + parseInt(t.duration), 0);

  // Triage Candidates
  const triageCandidates = INITIAL_CONTACTS.slice(0, 5);
  const currentTriageCandidate = triageCandidates[triageIndex];

  const handleNextTriage = () => {
    if (triageIndex < triageCandidates.length - 1) {
      setTriageIndex(triageIndex + 1);
    } else {
      setTriageOpen(false);
      setTriageIndex(0);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-6 font-sans bg-[#F3F4F7] text-[#15161A] min-h-screen">
      
      {/* ========================================================================= */}
      {/* 1. TOP COCKPIT HEADER & SUB-NAVIGATION AVEC LIENS VÉRIFIÉS                */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-[#F3F4F7]/95 backdrop-blur-md border-b border-[#E1E3E8] flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Update Live Badge */}
        <div className="flex items-center gap-3">
          <Link href="/crm" className="w-9 h-9 rounded-xl bg-[#17181D] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 transition-transform hover:scale-105">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="#C8A97E" />
              <rect x="11" y="2" width="7" height="7" rx="3.5" fill="#FAF8F5" />
              <rect x="2" y="11" width="7" height="7" rx="3.5" fill="#FAF8F5" fillOpacity="0.4" />
              <rect x="11" y="11" width="7" height="7" rx="2" fill="#9E7431" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#15161A] flex items-center gap-2">
              <Link href="/crm" className="hover:text-[#9E7431] transition-colors">Cabinet Immo</Link>
              <span className="text-[#5C606B] font-medium">· Pilotage Locatif 360°</span>
            </h1>
            <p className="text-[11px] text-[#5C606B] font-medium flex items-center gap-1.5">
              <span>Mis à jour en direct</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-[#161412] bg-[#FAF8F5] border border-[#EAE5DC] px-2 py-0.2 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9E7431] ring-2 ring-[#9E7431]/20" />
                Actions WhatsApp &amp; Séquestre actives
              </span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Style Pilules Bento) */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" aria-label="Sections Cockpit">
          <button
            type="button"
            onClick={() => setActiveTab('aujourdhui')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'aujourdhui'
                ? 'bg-[#17181D] text-white shadow-xs'
                : 'bg-white text-[#15161A] hover:bg-slate-200/70 border border-slate-200/80'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'aujourdhui' ? 'text-[#9E7431]' : 'text-slate-400'}`} />
            <span>Aujourd&apos;hui</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('valider')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'valider'
                ? 'bg-[#17181D] text-white shadow-xs'
                : 'bg-[#FAF8F5] text-[#15161A] hover:bg-[#EAE5DC] border border-[#EAE5DC]'
            }`}
          >
            <span>À valider</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#17181D] text-white font-bold">
              3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portefeuille')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'portefeuille'
                ? 'bg-[#17181D] text-white shadow-xs'
                : 'bg-white text-[#15161A] hover:bg-slate-200/70 border border-slate-200/80'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Portefeuille &amp; Baux</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('machine')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'machine'
                ? 'bg-[#17181D] text-white shadow-xs'
                : 'bg-white text-[#15161A] hover:bg-slate-200/70 border border-slate-200/80'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#9E7431]" />
            <span>Aya IA &amp; Automations</span>
          </button>
        </nav>

      </header>

      {/* ========================================================================= */}
      {/* 2. TAB 1 : VUE AUJOURD'HUI (BENTO AVEC OBJETS 3D SVG ANIMÉS AU HOVER)     */}
      {/* ========================================================================= */}
      {activeTab === 'aujourdhui' && (
        <div className="space-y-6">
          
          {/* GRILLE BENTO 4 COLONNES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            
            {/* --------------------------------------------------------------------- */}
            {/* TILE 1 : HERO AUJOURD'HUI (CHARBON ARCHITECTURAL #191715 - 2 COLS, 2 ROWS) */}
            {/* --------------------------------------------------------------------- */}
            <div className="group md:col-span-2 md:row-span-2 bg-[#191715] text-white rounded-[26px] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-warm-md hover:shadow-warm-xl border border-white/10 transition-all duration-300 min-h-[420px]">
              
              {/* OBJET 3D SVG ANIMÉ AU HOVER (Smartphone 3D pleine hauteur centré verticalement sur la moitié droite) */}
              <svg 
                className="pointer-events-none absolute right-1 sm:right-3 md:right-5 lg:right-6 top-1/2 -translate-y-1/2 w-48 sm:w-56 md:w-60 lg:w-64 max-h-[92%] transition-transform duration-500 ease-out group-hover:scale-105"
                viewBox="0 0 300 360" 
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="b-ph" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#2A2C33" />
                    <stop offset=".55" stopColor="#15161A" />
                    <stop offset="1" stopColor="#050506" />
                  </linearGradient>
                  <linearGradient id="b-ed" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#4B4E58" />
                    <stop offset="1" stopColor="#0B0C0E" />
                  </linearGradient>
                  <linearGradient id="b-sc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#302C26" />
                    <stop offset=".5" stopColor="#1E1B17" />
                    <stop offset="1" stopColor="#151412" />
                  </linearGradient>
                  <radialGradient id="b-pl" cx=".35" cy=".3" r=".8">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#E6E8EE" />
                  </radialGradient>
                  <filter id="b-so" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="12" />
                  </filter>
                </defs>
                <ellipse cx="150" cy="335" rx="100" ry="16" fill="#000000" opacity=".5" filter="url(#b-so)" />
                <g transform="rotate(-4 160 180)">
                  <rect x="72" y="22" width="165" height="315" rx="32" fill="url(#b-ed)" />
                  <rect x="66" y="16" width="165" height="315" rx="32" fill="url(#b-ph)" />
                  <rect x="78" y="28" width="141" height="288" rx="22" fill="url(#b-sc)" />
                  <rect x="128" y="36" width="44" height="9" rx="4.5" fill="#15161A" />
                  <rect x="92" y="66" width="100" height="12" rx="6" fill="#fff" opacity=".95" />
                  <rect x="92" y="84" width="72" height="12" rx="6" fill="#fff" opacity=".95" />
                  <circle cx="150" cy="178" r="28" fill="url(#b-pl)" />
                  <path d="M142 165 L164 178 L142 191 Z" fill="#9E7431" />
                  <rect x="90" y="254" width="116" height="28" rx="14" fill="#9E7431" />
                  <rect x="106" y="264" width="84" height="8" rx="4" fill="#15161A" opacity=".8" />
                  <rect x="90" y="294" width="116" height="5" rx="2.5" fill="#fff" opacity=".35" />
                  <rect x="90" y="294" width="52" height="5" rx="2.5" fill="#fff" />
                  <path d="M84 38 Q 88 155 84 290" stroke="#fff" strokeWidth="4.5" opacity=".22" fill="none" strokeLinecap="round" />
                </g>
              </svg>

              {/* Contenu Hero - Largeur contrainte stricte (50%) pour garantir 0 chevauchement avec le téléphone */}
              <div className="space-y-3 z-10 max-w-[52%] sm:max-w-[50%] lg:max-w-[48%]">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-[#C8A97E] font-bold">
                    Dimanche 8 Novembre 2026
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                  3 visites et 2 baux attendent ta validation.
                </h2>

                <p className="text-xs sm:text-sm text-white/90 font-normal">
                  Environ 45 min estimées de traitement terrain et juridique (tu en as prévu 60).
                </p>

                {/* 3 Steps Raccourcis Directs avec Liens Vérifiés (Dégagés à 100% du smartphone 3D) */}
                <div className="space-y-2 pt-2">
                  <Link
                    href="/crm/visites"
                    className="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/20 rounded-2xl p-2 px-3 transition-all text-xs font-semibold text-white group/step shadow-2xs backdrop-blur-xs"
                    title="Confirmer la visite locative sur l'agenda"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#9E7431] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover/step:scale-110">
                        1
                      </span>
                      <span className="truncate text-[11px] sm:text-xs">Confirmer visite 15:30 (Riviera)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white shrink-0">
                      10 min
                    </span>
                  </Link>

                  <Link
                    href="/crm/pipeline"
                    className="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/20 rounded-2xl p-2 px-3 transition-all text-xs font-semibold text-white group/step shadow-2xs backdrop-blur-xs"
                    title="Transmettre le bail sous séquestre"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#9E7431] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover/step:scale-110">
                        2
                      </span>
                      <span className="truncate text-[11px] sm:text-xs">Bail sous séquestre Mme Doumbia</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white shrink-0">
                      15 min
                    </span>
                  </Link>

                  <Link
                    href="/crm/visites"
                    className="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/20 rounded-2xl p-2 px-3 transition-all text-xs font-semibold text-white group/step shadow-2xs backdrop-blur-xs"
                    title="Vérifier l'inventaire huissier"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#9E7431] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover/step:scale-110">
                        3
                      </span>
                      <span className="truncate text-[11px] sm:text-xs">Inventaire huissier Beverly Hills</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white shrink-0">
                      20 min
                    </span>
                  </Link>
                </div>
              </div>

              {/* Bouton Pill Or Champagne & Triage */}
              <div className="pt-6 z-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/crm/visites"
                  className="inline-flex items-center gap-2 bg-[#9E7431] hover:bg-[#C8A97E] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-transform hover:-translate-y-0.5 shadow-xs"
                >
                  <span>Ouvrir l&apos;agenda des visites</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setTriageOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-4 py-3 rounded-full transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Trier candidats (5)</span>
                </button>
              </div>

            </div>

            {/* --------------------------------------------------------------------- */}
            {/* TILE 2 : PROCHAIN DÉPART (ALBÂTRE MINÉRAL #FAF8F5 - 2 COLS)           */}
            {/* --------------------------------------------------------------------- */}
            <Link
              href="/crm/visites"
              className="group bg-[#FAF8F5] text-[#15161A] border-2 border-[#9E7431]/40 rounded-[26px] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-warm-xs hover:shadow-warm-md hover:border-[#9E7431] hover:-translate-y-0.5 transition-all duration-300 min-h-[190px] block cursor-pointer"
              title="Voir les détails de la visite sur l'agenda des visites"
            >
              {/* OBJET 3D SVG ANIMÉ AU HOVER (Horloge 3D compacte dans le coin inférieur droit - 0 chevauchement avec 15:30) */}
              <svg 
                className="pointer-events-none absolute right-3.5 bottom-3.5 w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-12"
                viewBox="0 0 140 140" 
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="b-ck" cx=".35" cy=".3" r=".75">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset=".7" stopColor="#F1F1F4" />
                    <stop offset="1" stopColor="#C9CBD3" />
                  </radialGradient>
                  <radialGradient id="b-rm" cx=".35" cy=".3" r=".8">
                    <stop offset="0" stopColor="#3A3D46" />
                    <stop offset="1" stopColor="#0D0E11" />
                  </radialGradient>
                </defs>
                <circle cx="74" cy="74" r="56" fill="#9E7431" opacity=".2" />
                <circle cx="70" cy="68" r="56" fill="url(#b-rm)" />
                <circle cx="70" cy="68" r="45" fill="url(#b-ck)" />
                <g stroke="#15161A" strokeLinecap="round">
                  <line x1="70" y1="68" x2="70" y2="38" strokeWidth="6" />
                  <line x1="70" y1="68" x2="49" y2="80" strokeWidth="7" />
                </g>
                <circle cx="70" cy="68" r="6" fill="#9E7431" />
              </svg>

              <div className="space-y-0.5 z-10">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#15161A]/80 block">
                  Prochain départ · Aujourd&apos;hui
                </span>
                <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-[#15161A]">
                  15:30
                </div>
              </div>

              <div className="z-10 mt-3 max-w-[62%] sm:max-w-[64%]">
                <h3 className="font-bold text-xs sm:text-sm text-[#15161A] line-clamp-1 group-hover:underline">
                  Villa Cocody Riviera Golf
                </h3>
                <p className="text-[11px] text-[#15161A]/85 line-clamp-1 font-medium">
                  {nextVisitContact?.full_name} ({nextVisitContact?.profession?.split('(')[0] || 'Directeur'})
                </p>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#C8A97E] bg-[#15161A] px-2.5 py-1 rounded-full inline-block mt-2 shadow-2xs">
                  Bail Corporate · 3,8M FCFA/m
                </div>
              </div>
            </Link>

            {/* --------------------------------------------------------------------- */}
            {/* TILE 3 : LA MACHINE & AYA IA (NIGHT NOIR PROFOND #17181D)             */}
            {/* --------------------------------------------------------------------- */}
            <div className="group bg-[#17181D] text-white rounded-[26px] p-5 sm:p-6 flex flex-col justify-between shadow-warm-xs hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-300 min-h-[190px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-white/70">
                    La Machine &amp; IA
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9E7431] ring-2 ring-[#9E7431]/20" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-white/80">Aya IA WhatsApp</span>
                    <span className="font-bold text-[#C8A97E]">Répond &lt; 15s</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-white/80">Solvabilité audités</span>
                    <span className="font-bold text-[#C8A97E]">8/8 valides</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/10">
                    <span className="text-white/80">Séquestres Notariés</span>
                    <span className="font-bold text-[#C8A97E]">100% sécurisés</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-white/80">Remontées WhatsApp</span>
                    <span className="font-bold text-[#C8A97E]">Sync en direct</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/crm/contacts"
                  className="text-[11px] text-[#C8A97E] hover:text-white font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <MessageCircle className="w-3 h-3 text-[#C8A97E]" />
                  <span>Remontées WhatsApp</span>
                </Link>
                <Link
                  href="/crm/intelligence"
                  className="text-[11px] text-[#C8A97E] hover:text-white font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <span>Supervision</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* TILE 4 : OPPORTUNITÉS & CANDIDATS (ALBÂTRE #FAF8F5 & CHARBON)         */}
            {/* --------------------------------------------------------------------- */}
            <div className="group bg-[#FAF8F5] text-[#15161A] border-2 border-[#EAE5DC] rounded-[26px] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-warm-xs hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-300 min-h-[190px]">
              
              {/* OBJET 3D SVG ANIMÉ AU HOVER (Cartes prospects compactes) */}
              <svg 
                className="pointer-events-none absolute right-3 bottom-3 w-14 h-16 sm:w-16 sm:h-18 transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-6"
                viewBox="0 0 120 120" 
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="b-cd" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#EAE5DC" />
                  </linearGradient>
                </defs>
                <g transform="rotate(10 60 60)">
                  <rect x="25" y="30" width="70" height="80" rx="14" fill="#161412" />
                </g>
                <g transform="rotate(3 60 60)">
                  <rect x="23" y="24" width="70" height="80" rx="14" fill="#9E7431" />
                </g>
                <g transform="rotate(-3 60 60)">
                  <rect x="20" y="18" width="70" height="80" rx="14" fill="url(#b-cd)" />
                  <circle cx="42" cy="38" r="9" fill="#161412" />
                  <rect x="34" y="58" width="44" height="6.5" rx="3" fill="#15161A" opacity=".75" />
                  <rect x="34" y="70" width="30" height="6.5" rx="3" fill="#15161A" opacity=".3" />
                </g>
              </svg>

              <div className="z-10 max-w-[62%] sm:max-w-[64%]">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#15161A]/80 block">
                  Candidats chauds à placer
                </span>
                <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-[#15161A] mt-1">
                  {hotLeads.length}
                </div>

                <ul className="text-xs font-semibold space-y-1 mt-2.5">
                  {hotLeads.slice(0, 3).map((lead) => (
                    <li key={lead.id} className="truncate flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#15161A] shrink-0" />
                      <span className="truncate">{lead.full_name} ({formatFCFA(lead.budget_max || 0)}/m)</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="z-10 flex flex-wrap items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setTriageOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#17181D] hover:bg-black text-white font-bold text-xs inline-flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 cursor-pointer shadow-xs"
                >
                  <span>Trier en 2 min</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <Link
                  href="/crm/contacts"
                  className="text-xs font-bold text-[#15161A] hover:underline"
                >
                  Voir tous ({INITIAL_CONTACTS.length})
                </Link>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* TILE 5 : SCORE D'AUDIT & QUALITÉ (ALBÂTRE & ANNEAU OR)                */}
            {/* --------------------------------------------------------------------- */}
            <Link
              href="/crm/pipeline"
              className="group bg-[#FAF8F5] text-[#15161A] border-2 border-[#EAE5DC] rounded-[26px] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-warm-xs hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-300 min-h-[190px] block"
              title="Voir la conformité des baux sur le Kanban"
            >
              {/* OBJET 3D SVG ANIMÉ AU HOVER (Jauge Donut 3D dynamique total/100 - centré verticalement sur la moitié droite) */}
              <svg 
                className="pointer-events-none absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-500 ease-out group-hover:scale-105 group-hover:rotate-6"
                viewBox="0 0 130 130" 
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="b-rg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#C8A97E" />
                    <stop offset="100%" stopColor="#9E7431" />
                  </linearGradient>
                  <filter id="b-donut-depth" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="4" stdDeviation="3" floodColor="#9E7431" floodOpacity="0.2" />
                  </filter>
                </defs>
                {/* 3D Base Torus Shadow */}
                <circle cx="65" cy="69" r="40" fill="none" stroke="#EAE5DC" strokeWidth="18" />
                {/* Background Ring (100% Base Torus) */}
                <circle cx="65" cy="65" r="40" fill="none" stroke="#F0EBE1" strokeWidth="18" filter="url(#b-donut-depth)" />
                {/* Dynamic Gold Arc Filling Function of total/100 */}
                <circle 
                  cx="65" 
                  cy="65" 
                  r="40" 
                  fill="none" 
                  stroke="url(#b-rg)" 
                  strokeWidth="18" 
                  strokeLinecap="round" 
                  strokeDasharray="251.33" 
                  strokeDashoffset={251.33 * (1 - 96 / 100)} 
                  transform="rotate(-90 65 65)" 
                />
                {/* Specular Highlight Arc */}
                <path d="M42 37 A 40 40 0 0 1 70 25" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.75" />
              </svg>

              <div className="z-10 max-w-[62%] sm:max-w-[64%]">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#15161A]/80 block">
                  Score d&apos;audit &amp; Qualité
                </span>
                <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-[#15161A] mt-1">
                  96<small className="text-lg font-bold">/100</small>
                </div>
                <p className="text-xs text-[#15161A]/80 font-medium mt-1">
                  Objectif 90 · Zéro litige d&apos;état des lieux post-signature.
                </p>
              </div>

              <div className="z-10 text-[11px] font-bold text-[#15161A]/70 group-hover:text-[#15161A] flex items-center gap-1 transition-colors">
                <span>Voir la conformité des baux</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* --------------------------------------------------------------------- */}
            {/* TILE 6 : SEMAINE DE VISITES (BLANC SURFACE - 2 COLS)                  */}
            {/* --------------------------------------------------------------------- */}
            <div className="group md:col-span-2 bg-white rounded-[26px] p-5 sm:p-6 border border-[#E1E3E8] shadow-warm-xs hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C606B] block">
                    Agenda Hebdomadaire
                  </span>
                  <h3 className="text-sm font-bold text-[#15161A]">
                    Ta semaine terrain · 8 visites &amp; remises de clés
                  </h3>
                </div>
                <Link
                  href="/crm/visites"
                  className="text-xs font-bold text-[#9E7431] hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Vue Calendrier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 7 Jours Mini Tracker avec Redirection vers /crm/visites */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {[
                  { day: 'lun', num: 2, status: 'Effectuée', type: 'done' },
                  { day: 'mar', num: 3, status: 'Effectuée', type: 'done' },
                  { day: 'mer', num: 4, status: 'Effectuée', type: 'done' },
                  { day: 'jeu', num: 5, status: 'Confirmée', type: 'accent' },
                  { day: 'ven', num: 6, status: 'Confirmée', type: 'accent' },
                  { day: 'sam', num: 7, status: 'Validée', type: 'warn' },
                  { day: 'dim', num: 8, status: 'Aujourd\'hui', type: 'today' },
                ].map((d) => (
                  <Link
                    key={d.day}
                    href="/crm/visites"
                    className={`rounded-2xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-between min-h-[75px] transition-transform hover:-translate-y-1 shadow-2xs ${
                      d.type === 'today'
                        ? 'bg-[#17181D] text-white ring-2 ring-[#C8A97E]/40'
                        : 'bg-[#F3F4F7] text-[#5C606B] hover:bg-slate-200/80'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">{d.day}</span>
                    <span className={`text-base font-extrabold ${d.type === 'today' ? 'text-white' : 'text-[#15161A]'}`}>
                      {d.num}
                    </span>
                    <span className={`text-[8px] font-bold px-1 rounded-sm truncate w-full ${
                      d.type === 'today' ? 'bg-[#9E7431] text-white' :
                      d.type === 'done' ? 'bg-[#FAF8F5] text-[#161412] border border-[#EAE5DC]' :
                      d.type === 'accent' ? 'bg-[#FAF8F5] text-[#9E7431] border border-[#9E7431]/30' :
                      'bg-[#FAF8F5] text-[#6E665B] border border-[#EAE5DC]'
                    }`}>
                      {d.status}
                    </span>
                  </Link>
                ))}
              </div>

            </div>

            {/* --------------------------------------------------------------------- */}
            {/* TILE 7 : CE QUI FREINE (ALBÂTRE AVEC LISERÉ OR #9E7431 - 2 COLS)      */}
            {/* --------------------------------------------------------------------- */}
            <div className="group md:col-span-2 bg-[#FAF8F5] text-[#15161A] border-2 border-[#9E7431]/40 rounded-[26px] p-5 sm:p-6 flex flex-col justify-between shadow-warm-xs hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
              
              {/* OBJET 3D SVG ANIMÉ AU HOVER (Règle graduée / Goulot 3D redimensionnée) */}
              <svg 
                className="pointer-events-none absolute right-3 bottom-2 w-48 sm:w-56 h-20 sm:h-24 transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-1 group-hover:-rotate-2"
                viewBox="0 0 250 120" 
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="b-ru" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#C8A97E" />
                    <stop offset="1" stopColor="#9E7431" />
                  </linearGradient>
                </defs>
                <g transform="rotate(-12 125 60)">
                  <rect x="14" y="44" width="226" height="52" rx="12" fill="#9E7431" />
                  <rect x="10" y="36" width="226" height="52" rx="12" fill="url(#b-ru)" />
                  <g stroke="#15161A" strokeWidth="3" strokeLinecap="round">
                    <line x1="30" y1="36" x2="30" y2="58" />
                    <line x1="50" y1="36" x2="50" y2="48" />
                    <line x1="70" y1="36" x2="70" y2="48" />
                    <line x1="90" y1="36" x2="90" y2="58" />
                    <line x1="110" y1="36" x2="110" y2="48" />
                    <line x1="130" y1="36" x2="130" y2="48" />
                    <line x1="150" y1="36" x2="150" y2="58" />
                    <line x1="170" y1="36" x2="170" y2="48" />
                    <line x1="190" y1="36" x2="190" y2="48" />
                    <line x1="210" y1="36" x2="210" y2="58" />
                  </g>
                  <rect x="20" y="70" width="80" height="6" rx="3" fill="#fff" opacity=".5" />
                </g>
              </svg>

              <div className="space-y-1 z-10 max-w-[66%] sm:max-w-[70%]">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#15161A]/80 block">
                  Ce qui freine cette semaine (Goulot)
                </span>
                <div className="text-xl sm:text-2xl font-black text-[#15161A]">
                  Attestations employeurs multinationales
                </div>
                <p className="text-xs text-[#15161A]/85 font-medium">
                  2 baux corporate prêts pour signature sont suspendus à la réception de l&apos;attestation de garantie de loyer du siège.
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 z-10">
                <span className="text-[11px] font-bold text-[#15161A]">
                  Impact : 7 600 000 FCFA/mois de loyers en attente
                </span>
                <Link
                  href="/crm/contacts"
                  className="px-4 py-2 rounded-full bg-[#17181D] hover:bg-black text-white font-bold text-xs inline-flex items-center gap-1.5 transition-transform hover:-translate-y-0.5 shadow-xs"
                >
                  <span>Relancer les 2 juristes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

          {/* ======================================================================= */}
          {/* 3. TILE BOTTOM : LE DÉTAIL DANS CET ORDRE (TO-DO & MISE EN ROUTE)       */}
          {/* ======================================================================= */}
          <section className="bg-white rounded-[26px] p-6 sm:p-8 border border-[#E1E3E8] shadow-warm-xs space-y-6">
            
            {/* Header & Temps estimé aujourd'hui */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#F0EDE6] pb-5">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#947346] block">
                  Cockpit Opérationnel
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#15161A] tracking-tight">
                  Le détail terrain, dans cet ordre
                </h3>
                <p className="text-xs text-[#5C606B] font-normal mt-0.5">
                  Chaque tâche est priorisée par impact financier et urgence de bail.
                </p>
              </div>

              {/* Time tracker progress bar */}
              <div className="w-full sm:w-72 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#5C606B]">
                  <span>Ton temps estimé restant</span>
                  <span className="font-bold text-[#15161A]">{remainingMinutes} min / 55 min</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#E4E6EB] overflow-hidden">
                  <div 
                    className="h-full bg-[#9E7431] transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(10, Math.min(100, 100 - (remainingMinutes / 55) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Ruban Mise en Route (Setup 4 sur 5 validés avec liens directs) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC] flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-[#15161A] mr-2">Mise en route · 4 sur 5 validés</span>
              
              <Link 
                href="/crm/intelligence"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#F2ECE1] text-[#161412] border border-[#EAE5DC] font-semibold text-[11px] transition-colors"
                title="Superviser Aya IA"
              >
                <Check className="w-3.5 h-3.5 text-[#9E7431]" />
                <span>Aya IA WhatsApp connectée</span>
              </Link>

              <Link
                href="/crm/biens"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#F2ECE1] text-[#161412] border border-[#EAE5DC] font-semibold text-[11px] transition-colors"
                title="Voir le portefeuille biens"
              >
                <Check className="w-3.5 h-3.5 text-[#9E7431]" />
                <span>6 Mandats exclusifs vérifiés</span>
              </Link>

              <Link
                href="/crm/pipeline"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#F2ECE1] text-[#161412] border border-[#EAE5DC] font-semibold text-[11px] transition-colors"
                title="Voir le séquestre notarié"
              >
                <Check className="w-3.5 h-3.5 text-[#9E7431]" />
                <span>100% Cautions sous séquestre</span>
              </Link>

              <Link
                href="/crm/visites"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#F2ECE1] text-[#161412] border border-[#EAE5DC] font-semibold text-[11px] transition-colors"
                title="Voir le planning visites"
              >
                <Check className="w-3.5 h-3.5 text-[#9E7431]" />
                <span>Clés des villas en agence</span>
              </Link>

              <Link
                href="/crm/contacts"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#F2ECE1] text-[#6E665B] border border-[#EAE5DC] font-semibold text-[11px] transition-colors"
                title="Relancer les candidats pour pièces"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#9E7431]" />
                <span>2 Attestations employeur manquantes</span>
              </Link>
            </div>

            {/* Ordered Interactive Todo List */}
            <div className="space-y-3 divide-y divide-[#F0EDE6]">
              {todoList.map((item, idx) => {
                const isDone = completedTodos.includes(item.id);
                return (
                  <div 
                    key={item.id} 
                    className={`pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity ${
                      isDone ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      
                      {/* Interactive Checkbox / Number */}
                      <button
                        type="button"
                        onClick={() => toggleTodo(item.id)}
                        className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-colors cursor-pointer mt-0.5 ${
                          isDone 
                            ? 'bg-[#161412] text-white' 
                            : idx === 0 
                            ? 'bg-[#9E7431] text-white' 
                            : 'bg-[#FAF8F5] text-[#5C606B] hover:bg-[#F2ECE1]'
                        }`}
                        title={isDone ? 'Marquer comme non fait' : 'Marquer comme terminé'}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs sm:text-sm font-bold text-[#15161A] ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C606B] mt-0.5 font-normal line-clamp-1">
                          {item.subtitle}
                        </p>
                      </div>

                    </div>

                    {/* Actions directes WhatsApp & Navigation Vérifiée */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-xs font-semibold text-[#5C606B] mr-1">
                        ≈ {item.duration}
                      </span>

                      <a
                        href={getWhatsAppLink(item.contactPhone, item.whatsappText)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EAE5DC] text-[#161412] font-bold text-xs flex items-center gap-1.5 border border-[#EAE5DC] transition-colors"
                        title="Ouvrir WhatsApp avec message personnalisé"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#9E7431]" />
                        <span>WhatsApp direct</span>
                      </a>

                      <Link
                        href={item.actionUrl}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                      >
                        {item.actionLabel}
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>

          </section>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2 : VUE À VALIDER (DÉCISIONS ATTENDUES DU GÉRANT)                   */}
      {/* ========================================================================= */}
      {activeTab === 'valider' && (
        <div className="space-y-5">
          <div className="bg-[#191715] text-white rounded-[26px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-warm-xs">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#C8A97E] block">
                Salle d&apos;arbitrage
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                3 dossiers de bail prêts pour ta signature
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
                Ces dossiers ont franchi l&apos;audit de solvabilité à 100% et la caution est déjà séquestrée chez le notaire.
              </p>
            </div>
            <span className="text-3xl sm:text-4xl font-black text-[#C8A97E] bg-white/10 px-5 py-3 rounded-2xl border border-white/10">
              10 800 000 FCFA <span className="text-xs font-normal block text-center text-white/70">loyers mensuels cumulés</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'val-1',
                title: 'Bail Corporate Villa Riviera Golf',
                tenant: 'Jean-Philippe Konan (Fonds Private Equity)',
                rent: '3 800 000 FCFA / mois',
                deposit: '7 600 000 FCFA séquestré chez Me Bamba',
                date: 'Prise d\'effet : 15 Novembre 2026',
                status: 'Prêt pour signature'
              },
              {
                id: 'val-2',
                title: 'Bail Meublé Penthouse Marcory Zone 4',
                tenant: 'Marie-Laure Doumbia (Directrice Énergie)',
                rent: '2 800 000 FCFA / mois',
                deposit: '5 600 000 FCFA séquestré chez Me Bamba',
                date: 'Prise d\'effet : 01 Décembre 2026',
                status: 'Prêt pour signature'
              },
              {
                id: 'val-3',
                title: 'Bail Diplomatique Villa Beverly Hills',
                tenant: 'Marc-Antoine de Saint-Germain (Orange CI)',
                rent: '4 200 000 FCFA / mois',
                deposit: '8 400 000 FCFA consignation banque solidaire',
                date: 'Prise d\'effet : 01 Décembre 2026',
                status: 'Prêt pour signature'
              }
            ].map((deal) => (
              <div key={deal.id} className="bg-white rounded-3xl p-5 border border-[#E1E3E8] space-y-3 shadow-warm-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#9E7431] border border-[#EAE5DC]">
                    {deal.status}
                  </span>
                  <h3 className="font-bold text-sm text-[#15161A]">{deal.title}</h3>
                  <p className="text-xs text-slate-600 font-medium">{deal.tenant}</p>
                  
                  <div className="p-3 rounded-xl bg-[#F3F4F7] space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-[#161412]">
                      <span>Loyer mensuel :</span>
                      <span>{deal.rent}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Séquestre notarié :</span>
                      <span className="font-medium text-slate-800">{deal.deposit}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal">{deal.date}</div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <Link
                    href="/crm/pipeline"
                    className="flex-1 py-2 text-center rounded-xl bg-[#17181D] hover:bg-black text-white font-bold text-xs transition-colors"
                  >
                    Valider le bail
                  </Link>
                  <Link
                    href="/crm/contacts"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Voir le dossier locataire"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3 : PORTEFEUILLE & BAUX                                            */}
      {/* ========================================================================= */}
      {activeTab === 'portefeuille' && (
        <div className="space-y-6">
          
          {/* 4 Chiffres Clés Portefeuille avec Liens de Redirection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/crm/biens"
              className="bg-white rounded-2xl p-5 border border-[#E1E3E8] shadow-warm-xs hover:border-[#9E7431] transition-all block space-y-1"
            >
              <span className="text-[10px] uppercase font-bold text-[#5C606B]">Volume Loyers sous Mandat</span>
              <div className="text-2xl font-black text-[#15161A]">
                {formatFCFA(totalMonthlyRentPortfolio)} <span className="text-xs font-normal text-slate-500">/ mois</span>
              </div>
              <span className="text-[11px] text-[#9E7431] font-semibold block">6 résidences de standing →</span>
            </Link>

            <Link 
              href="/crm/contacts"
              className="bg-white rounded-2xl p-5 border border-[#E1E3E8] shadow-warm-xs hover:border-[#9E7431] transition-all block space-y-1"
            >
              <span className="text-[10px] uppercase font-bold text-[#5C606B]">Candidats Qualifiés Actifs</span>
              <div className="text-2xl font-black text-[#15161A]">{INITIAL_CONTACTS.length} dossiers</div>
              <span className="text-[11px] text-[#9E7431] font-semibold block">87,5% conformité bancaire →</span>
            </Link>

            <Link 
              href="/crm/visites"
              className="bg-white rounded-2xl p-5 border border-[#E1E3E8] shadow-warm-xs hover:border-[#9E7431] transition-all block space-y-1"
            >
              <span className="text-[10px] uppercase font-bold text-[#5C606B]">Visites cette semaine</span>
              <div className="text-2xl font-black text-[#15161A]">{scheduledVisits.length} programmées</div>
              <span className="text-[11px] text-[#9E7431] font-semibold block">Délai moyen &lt; 48h →</span>
            </Link>

            <Link 
              href="/crm/pipeline"
              className="bg-white rounded-2xl p-5 border border-[#E1E3E8] shadow-warm-xs hover:border-[#9E7431] transition-all block space-y-1"
            >
              <span className="text-[10px] uppercase font-bold text-[#5C606B]">Honoraires Agence Prévus</span>
              <div className="text-2xl font-black text-[#15161A]">{formatFCFA(potentialPlacementFees)}</div>
              <span className="text-[11px] text-[#9E7431] font-semibold block">100% séquestre notarié →</span>
            </Link>
          </div>

          {/* Tableau synthétique des résidences sous mandat */}
          <div className="bg-white rounded-3xl p-6 border border-[#E1E3E8] shadow-warm-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EDE6] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#15161A]">Parc Résidentiel &amp; Baux Disponibles</h3>
                <p className="text-xs text-[#5C606B]">Villas et appartements certifiés avec groupe électrogène et cuve d&apos;eau.</p>
              </div>
              <Link href="/crm/biens" className="text-xs font-bold text-[#161412] hover:text-[#9E7431] hover:underline">
                Gérer les fiches biens →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E1E3E8] text-[#5C606B]">
                    <th className="py-2.5 font-bold">Réf.</th>
                    <th className="py-2.5 font-bold">Résidence</th>
                    <th className="py-2.5 font-bold">Quartier</th>
                    <th className="py-2.5 font-bold">Loyer Mensuel</th>
                    <th className="py-2.5 font-bold">Autonomie</th>
                    <th className="py-2.5 font-bold">Statut</th>
                    <th className="py-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE6]">
                  {INITIAL_PROPERTIES.map((prop) => (
                    <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-500">{prop.reference}</td>
                      <td className="py-3 font-semibold text-[#15161A]">{prop.title}</td>
                      <td className="py-3 text-slate-600">{prop.district}</td>
                      <td className="py-3 font-bold text-[#161412]">{formatFCFA(prop.price)} / mois</td>
                      <td className="py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                          Groupe + Cuve
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prop.status === 'available' ? 'bg-[#FAF8F5] text-[#161412] border border-[#EAE5DC]' : 'bg-[#FAF8F5] text-[#9E7431] border border-[#9E7431]/30'
                        }`}>
                          {prop.status === 'available' ? 'Disponible' : 'Sous offre'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/biens/${prop.id}`}
                          target="_blank"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px]"
                        >
                          Fiche Publique
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 4 : LA MACHINE & AYA IA (SUPERVISION & BOTS WHATSAPP)              */}
      {/* ========================================================================= */}
      {activeTab === 'machine' && (
        <div className="space-y-6">
          <div className="bg-[#17181D] text-white rounded-[26px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-warm-xs">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[#C8A97E]">
                Supervision Automations &amp; IA Aya
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Agent Conversationnel WhatsApp Opérationnel 24/7
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                Aya pré-qualifie les locataires, vérifie les critères de solvabilité et propose des créneaux de visite selon le planning des négociateurs.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9E7431] ring-2 ring-[#9E7431]/20" />
              <div>
                <span className="text-xs text-white/70 block">Statut Serveur</span>
                <span className="text-sm font-bold text-white">100% En Ligne</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-[#E1E3E8] space-y-4 shadow-warm-xs">
              <h3 className="font-bold text-base text-[#15161A] flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#9E7431]" />
                <span>Règles d&apos;arbitrage de l&apos;Agent Aya</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Solvabilité 3x le loyer</strong> : vérification préalable des garanties corporate ou caution bancaire.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Séquestre Notarié obligatoire</strong> : rejet immédiat des propositions d&apos;arrangement informel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#9E7431] shrink-0 mt-0.5" />
                  <span><strong>Prise de rendez-vous sous 48h</strong> : synchronisation directe avec le calendrier de Fabrice et Aya.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E1E3E8] space-y-4 shadow-warm-xs">
              <h3 className="font-bold text-base text-[#15161A] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9E7431]" />
                <span>Sécurité &amp; Traçabilité Notariée</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Toutes les conversations WhatsApp et les engagements pris sont chiffrés et horodatés, prêts à être transmis à l&apos;étude de Me Bamba pour rédaction du bail authentique.
              </p>
              <div className="pt-2">
                <Link
                  href="/crm/contacts"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs inline-flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
                >
                  <span>Consulter l&apos;historique complet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODALE DE TRI RAPIDE DES CANDIDATS (Inspiré de .tri en 2 min)           */}
      {/* ========================================================================= */}
      {triageOpen && currentTriageCandidate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-warm-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setTriageOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-bold uppercase tracking-wider text-[#947346]">Triage Rapide des Candidats</span>
                <span>{triageIndex + 1} sur {triageCandidates.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-[#9E7431] transition-all"
                  style={{ width: `${((triageIndex + 1) / triageCandidates.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Carte du candidat */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-[#15161A]">
                  {currentTriageCandidate.qualification_score}<small className="text-sm font-normal">/100</small>
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#17181D] text-white">
                  {currentTriageCandidate.lead_score.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-[#15161A]">{currentTriageCandidate.full_name}</h4>
                <p className="text-xs text-slate-600 font-medium">{currentTriageCandidate.profession}</p>
                <div className="text-xs font-bold text-[#161412] mt-1">
                  Budget : {formatFCFA(currentTriageCandidate.budget_max || 0)} / mois
                </div>
              </div>

              <p className="text-xs text-slate-700 bg-white/70 p-3 rounded-xl border border-white leading-relaxed">
                {currentTriageCandidate.notes || currentTriageCandidate.financial_readiness}
              </p>
            </div>

            {/* 3 Actions rapides avec Redirections Validées */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Link
                href="/crm/visites"
                onClick={handleNextTriage}
                className="p-3 rounded-2xl bg-[#15161A] hover:bg-[#9E7431] text-white font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs"
              >
                <span>Prioritaire</span>
                <span className="text-[10px] font-normal opacity-80">Planifier visite</span>
              </Link>

              <a
                href={getWhatsAppLink(currentTriageCandidate.phone, `Bonjour ${currentTriageCandidate.full_name}, nous avons sélectionné 2 résidences correspondant parfaitement à votre recherche.`)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleNextTriage}
                className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#EAE5DC] text-[#161412] border border-[#EAE5DC] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs"
              >
                <span className="text-[#9E7431]">WhatsApp</span>
                <span className="text-[10px] font-normal text-[#6E665B]">Lancer échange</span>
              </a>

              <button
                type="button"
                onClick={handleNextTriage}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <span>Passer</span>
                <span className="text-[10px] font-normal text-slate-500">Traiter plus tard</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
