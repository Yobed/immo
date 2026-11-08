'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { INITIAL_VISITS, INITIAL_PROPERTIES, INITIAL_CONTACTS } from '@/lib/mock-data';
import { Visit, VisitStatus } from '@/lib/types';
import { formatFCFA, getWhatsAppLink } from '@/lib/utils';
import { 
  Clock, MessageCircle, Calendar, ShieldCheck, MapPin, 
  Search, CheckCircle2, UserCheck, Key, FileCheck, Phone, Check, 
  RefreshCw, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight, 
  X, Eye, ArrowUpRight, List, Map, Navigation, Route, Car, 
  Download, Printer, Filter, CheckCircle, AlertCircle, Compass,
  SlidersHorizontal, Building2
} from 'lucide-react';

// Dynamic import with ssr: false to prevent Leaflet window reference errors
const AbidjanOpenStreetMap = dynamic(
  () => import('@/components/crm/AbidjanOpenStreetMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[580px] bg-[#0F172A] rounded-3xl flex items-center justify-center text-slate-400 gap-2.5 border border-slate-800">
        <RefreshCw className="w-5 h-5 animate-spin text-[#FFD84D]" />
        <span className="text-xs font-semibold">Chargement de la carte OpenStreetMap &amp; Satellite d&apos;Abidjan...</span>
      </div>
    )
  }
);

export default function CrmVisitesPage() {
  const [visits, setVisits] = useState<Visit[]>(INITIAL_VISITS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  
  // 4 View Modes: 'calendar' | 'list' | 'cards' | 'map'
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'cards' | 'map'>('calendar');
  
  // Sub-mode for Calendar: 'month' | 'week'
  const [calendarSubMode, setCalendarSubMode] = useState<'month' | 'week'>('month');

  // Calendar State (Novembre 2026 default to match mock data)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 0-indexed: 10 = Novembre
  const [selectedDay, setSelectedDay] = useState<number>(9); // 9 Novembre has 2 visits
  
  // Map filter state
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  
  // Active modal for detailed visit inspect
  const [activeModalVisit, setActiveModalVisit] = useState<Visit | null>(null);

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      const prop = INITIAL_PROPERTIES.find((p) => p.id === v.property_id);
      const cont = INITIAL_CONTACTS.find((c) => c.id === v.contact_id);

      if (selectedDistrict !== 'all' && prop?.district && !prop.district.toLowerCase().includes(selectedDistrict.toLowerCase())) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchProp = prop?.title.toLowerCase().includes(q) || prop?.district.toLowerCase().includes(q);
        const matchCont = cont?.full_name.toLowerCase().includes(q) || cont?.phone.includes(q);
        const matchAgent = v.agent_name.toLowerCase().includes(q);
        if (!matchProp && !matchCont && !matchAgent) return false;
      }
      return true;
    });
  }, [visits, filterStatus, search, selectedDistrict]);

  const updateStatus = (id: string, newStatus: VisitStatus) => {
    setVisits(visits.map((v) => (v.id === id ? { ...v, status: newStatus } : v)));
    if (activeModalVisit?.id === id) {
      setActiveModalVisit({ ...activeModalVisit, status: newStatus });
    }
  };

  const scheduledCount = visits.filter(v => v.status === 'scheduled').length;
  const completedCount = visits.filter(v => v.status === 'completed').length;

  // Calendar calculations for currentYear and currentMonth
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Monday...
  const startingDayIndex = (firstDayOfWeek + 6) % 7; // Convert to Monday = 0, Sunday = 6

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Group visits by day for current month and year
  const visitsByDay = useMemo(() => {
    const map: Record<number, Visit[]> = {};
    visits.forEach((v) => {
      const d = new Date(v.scheduled_at);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(v);
      }
    });
    return map;
  }, [visits, currentYear, currentMonth]);

  const selectedDayVisits = visitsByDay[selectedDay] || [];

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['Date', 'Heure', 'Candidat', 'Telephone', 'Bien', 'Quartier', 'Loyer_Mensuel', 'Statut', 'Agent'];
    const rows = filteredVisits.map(v => {
      const prop = INITIAL_PROPERTIES.find(p => p.id === v.property_id);
      const cont = INITIAL_CONTACTS.find(c => c.id === v.contact_id);
      const d = new Date(v.scheduled_at);
      return [
        d.toLocaleDateString('fr-FR'),
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        cont?.full_name || '',
        cont?.phone || '',
        `"${prop?.title || ''}"`,
        prop?.district || '',
        prop?.price || '',
        v.status,
        v.agent_name
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `planning_visites_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // District GPS & counts for Map View
  const districts = [
    { id: 'Cocody Riviera Golf', name: 'Cocody Riviera Golf', lat: 5.3475, lng: -3.9785, visits: 2, icon: '🏌️' },
    { id: 'Marcory Zone 4', name: 'Marcory Zone 4', lat: 5.2950, lng: -3.9920, visits: 1, icon: '🏙️' },
    { id: 'Plateau', name: 'Plateau (Centre Affaires)', lat: 5.3260, lng: -4.0200, visits: 1, icon: '🏛️' },
    { id: 'Riviera Beverly Hills', name: 'Riviera Beverly Hills', lat: 5.3580, lng: -3.9650, visits: 1, icon: '🌴' },
    { id: 'Cocody Danga', name: 'Cocody Danga', lat: 5.3380, lng: -4.0010, visits: 1, icon: '🏢' },
    { id: 'Assinie', name: 'Assinie-Mafia PK 9', lat: 5.1320, lng: -3.2840, visits: 1, icon: '🌊' },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 font-sans bg-[#fbfaf7] text-[#161412] min-h-screen">
      
      {/* ========================================================================= */}
      {/* 1. HEADER & KPI STATS STRIP (Harmonisé Bleu Cobalt #2E5BFF - Tuile Hero Agenda) */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#2E5BFF] text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#244bd9] shadow-warm-md relative overflow-hidden">
        
        {/* Voile décoratif subtil */}
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-white/15 to-transparent pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/90 bg-white/20 px-2.5 py-0.5 rounded-full">
              Agenda Terrain &amp; Prise de Bail
            </span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#FFD84D] text-[#15161A] shadow-xs">
              Direct Négociateurs
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Planning des Visites Locatives &amp; États des Lieux
          </h1>
          <p className="text-xs text-white/85 font-medium max-w-2xl">
            Gestion du planning terrain, visites privées diplomatiques, états des lieux et remises de clés à Abidjan.
          </p>
        </div>

        {/* Quick Stats Pill (Blanc pur sur fond bleu cobalt) */}
        <div className="flex items-center gap-4 bg-white text-slate-900 border border-white/60 px-5 py-3 rounded-2xl shadow-warm-xs text-xs z-10 self-start md:self-auto">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Programmées</span>
            <span className="text-sm font-black text-slate-900">{scheduledCount} rendez-vous</span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Effectuées</span>
            <span className="text-sm font-black text-emerald-700">{completedCount} validées</span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Cadence</span>
            <span className="text-sm font-black text-[#2E5BFF]">&lt; 48h / bail</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. TOOLBAR : RECHERCHE, STATUTS & LE SÉLECTEUR 4 MODES DE VUE             */}
      {/* ========================================================================= */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-[#e8e4dc] shadow-warm-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Search input & Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher candidat, quartier, agent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === 'all' ? 'bg-[#161412] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Toutes ({visits.length})
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === 'scheduled' ? 'bg-[#947346] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              À venir ({scheduledCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === 'completed' ? 'bg-[#1d382b] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Effectuées ({completedCount})
            </button>
          </div>
        </div>

        {/* Right: 4 VIEW SWITCHER (Calendrier, Liste, Cartes, Map) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
          
          {/* Mode 1: Calendrier */}
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#947346]" />
            <span>Calendrier</span>
          </button>

          {/* Mode 2: Liste / Tableau */}
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5 text-[#2E5BFF]" />
            <span>Vue Liste</span>
          </button>

          {/* Mode 3: Cartes */}
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
            <span>Vue Cartes ({filteredVisits.length})</span>
          </button>

          {/* Mode 4: Map Géolocalisée */}
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-emerald-700" />
            <span>Carte Abidjan</span>
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. VUE 1 : CALENDRIER HAUTE LISIBILITÉ (Mois & Semaine)                   */}
      {/* ========================================================================= */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* GRILLE CALENDRIER (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-warm-xs space-y-4">
              
              {/* Header Calendrier : Navigation, Sous-vue Mois/Semaine & Légende */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                
                {/* Month Navigator */}
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                  
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                      title="Mois précédent"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setCurrentMonth(10); setCurrentYear(2026); setSelectedDay(9); }}
                      className="px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-white rounded transition-colors"
                    >
                      Aujourd&apos;hui
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                      title="Mois suivant"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submode Switcher (Mois vs Semaine Créneaux) + Légende */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setCalendarSubMode('month')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        calendarSubMode === 'month' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Mois
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarSubMode('week')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        calendarSubMode === 'week' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Semaine
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF2CC] text-[#92400E] border-2 border-[#F59E0B] text-[11px] font-bold shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                      Jours Occupés
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F9F0] text-[#0F5E3E] border-2 border-[#10B981] text-[11px] font-bold shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      Aujourd&apos;hui (8 nov.)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 border-2 border-slate-300 text-[11px] font-medium shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-400" />
                      Disponibles
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2E5E9] text-slate-600 border-2 border-slate-300 text-[11px] font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Jours Passés
                    </span>
                  </div>
                </div>

              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW A : GRILLE MENSUELLE HAUTE FIDÉLITÉ DÉLIMITÉE        */}
              {/* ------------------------------------------------------------- */}
              {calendarSubMode === 'month' ? (
                <div className="rounded-2xl border-2 border-slate-300/90 bg-[#F4F5F8] p-3 shadow-warm-xs">
                  {/* Entête 7 Jours Délimité */}
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-700 pb-2.5 mb-2 border-b-2 border-slate-300">
                    <div>Lun</div>
                    <div>Mar</div>
                    <div>Mer</div>
                    <div>Jeu</div>
                    <div>Ven</div>
                    <div>Sam</div>
                    <div>Dim</div>
                  </div>

                  {/* Grille Jours du Mois avec Délimitation Nette 2px */}
                  <div className="grid grid-cols-7 gap-2">
                    
                    {/* Jours vides avant le 1er du mois */}
                    {Array.from({ length: startingDayIndex }).map((_, i) => (
                      <div 
                        key={`empty-${i}`} 
                        className="min-h-[115px] sm:min-h-[125px] rounded-xl bg-slate-200/70 border-2 border-dashed border-slate-300"
                      />
                    ))}

                    {/* Jours effectifs du mois */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dayVisits = visitsByDay[dayNum] || [];
                      const isSelected = selectedDay === dayNum;
                      const hasVisits = dayVisits.length > 0;

                      // Distinction Jours Passés vs Aujourd'hui vs Futurs (Aujourd'hui = 8 Novembre 2026)
                      const isPast = currentYear < 2026 || 
                        (currentYear === 2026 && currentMonth < 10) || 
                        (currentYear === 2026 && currentMonth === 10 && dayNum < 8);
                      
                      const isToday = currentYear === 2026 && currentMonth === 10 && dayNum === 8;

                      return (
                        <div
                          key={`day-${dayNum}`}
                          onClick={() => setSelectedDay(dayNum)}
                          className={`min-h-[115px] sm:min-h-[125px] rounded-xl p-2.5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'ring-4 ring-[#2E5BFF]/50 border-[#2E5BFF] shadow-warm-xs ' + (hasVisits ? 'bg-[#FFF2CC]' : isToday ? 'bg-[#E6F9F0]' : isPast ? 'bg-[#E2E5E9]' : 'bg-white')
                              : isPast
                              ? 'bg-[#E2E5E9] border-slate-300/80 text-slate-500 hover:bg-[#D9DDE2]'
                              : isToday
                              ? 'bg-[#E6F9F0] border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-400/40'
                              : hasVisits
                              ? 'bg-[#FFF2CC] border-[#F59E0B] text-amber-950 shadow-2xs hover:bg-[#FFE8A3] hover:border-amber-600'
                              : 'bg-white border-slate-300/90 hover:border-slate-400 hover:bg-slate-50 shadow-2xs'
                          }`}
                        >
                          {/* Header du jour */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-mono font-bold ${
                              isSelected
                                ? 'text-neutral-900 font-black'
                                : isToday
                                ? 'text-emerald-900 font-black text-sm'
                                : isPast
                                ? 'text-slate-400'
                                : hasVisits
                                ? 'text-[#92400E] font-black text-sm'
                                : 'text-slate-700'
                            }`}>
                              {dayNum}
                            </span>

                            {isToday ? (
                              <span className="text-[10px] font-bold text-[#0F5E3E] bg-[#D7F4E8] px-2 py-0.5 rounded-full">
                                Aujourd&apos;hui
                              </span>
                            ) : hasVisits ? (
                              <span className="text-[10px] font-black text-white bg-[#15161A] px-2 py-0.5 rounded-full shadow-2xs">
                                {dayVisits.length} {dayVisits.length > 1 ? 'visites' : 'visite'}
                              </span>
                            ) : !isPast ? (
                              <span className="text-[9px] text-slate-400 font-medium">Libre</span>
                            ) : null}
                          </div>

                          {/* Chips des Visites (Avec Couleurs & Badges Distinction) */}
                          <div className="space-y-1.5 mt-2 flex-1 overflow-hidden">
                            {dayVisits.slice(0, 2).map((v) => {
                              const cont = INITIAL_CONTACTS.find((c) => c.id === v.contact_id);
                              const dObj = new Date(v.scheduled_at);
                              const timeStr = dObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                              const isCorporate = v.visit_type !== 'first';

                              return (
                                <div
                                  key={v.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveModalVisit(v);
                                  }}
                                  className={`p-1.5 rounded-lg border text-xs transition-transform hover:scale-[1.02] flex flex-col gap-0.5 shadow-2xs cursor-pointer ${
                                    isPast
                                      ? 'bg-slate-200/90 border-slate-300 text-slate-600'
                                      : isCorporate
                                      ? 'bg-white border-amber-300/80 text-[#92400E]'
                                      : 'bg-white border-indigo-200 text-[#3730A3]'
                                  }`}
                                  title={`${timeStr} - ${cont?.full_name}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-[11px]">{timeStr}</span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                                      isCorporate ? 'bg-[#92400E] text-white' : 'bg-[#3730A3] text-white'
                                    }`}>
                                      {v.visit_type === 'first' ? 'VIP' : 'CORP'}
                                    </span>
                                  </div>
                                  <span className="truncate font-semibold text-[11px]">
                                    {cont?.full_name}
                                  </span>
                                </div>
                              );
                            })}

                            {dayVisits.length > 2 && (
                              <span className="text-[10px] text-amber-800 font-bold block text-center">
                                +{dayVisits.length - 2} autre
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              ) : (
                /* ------------------------------------------------------------- */
                /* SUB-VIEW B : VUE SEMAINE EN CRÉNEAUX HORAIRES (TIMELINE)      */
                /* ------------------------------------------------------------- */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900">Semaine du 9 au 15 Novembre 2026</span>
                    <span>Créneaux terrain réservés avec chauffeur &amp; négociateur</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visits.slice(0, 6).map((v) => {
                      const prop = INITIAL_PROPERTIES.find((p) => p.id === v.property_id);
                      const cont = INITIAL_CONTACTS.find((c) => c.id === v.contact_id);
                      const dObj = new Date(v.scheduled_at);
                      const dateStr = dObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
                      const timeStr = dObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const isPastVisit = dObj < new Date('2026-11-08T00:00:00Z');

                      return (
                        <div 
                          key={v.id} 
                          className={`p-3.5 rounded-2xl border-2 shadow-2xs space-y-2.5 transition-all ${
                            isPastVisit
                              ? 'bg-[#ECEEF2] border-slate-300 opacity-80'
                              : 'bg-[#FFF8E7] border-amber-300 hover:border-[#947346] hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                              <Clock className="w-3.5 h-3.5 text-[#947346]" />
                              <span className="capitalize">{dateStr} à {timeStr}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              isPastVisit
                                ? 'bg-slate-200 text-slate-600 border border-slate-300'
                                : v.status === 'scheduled' 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isPastVisit ? 'Effectuée (Passée)' : v.status === 'scheduled' ? 'Confirmée' : 'Effectuée'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 block">Réf. {prop?.reference} • {prop?.district}</span>
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{prop?.title}</h4>
                            <div className="text-xs font-bold text-emerald-800 mt-0.5">
                              {prop ? formatFCFA(prop.price) : ''} <span className="text-[10px] font-normal text-slate-500">/ mois</span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{cont?.full_name}</span>
                              <span className="text-[10px] text-slate-500 block truncate">{cont?.profession}</span>
                            </div>
                            <a
                              href={getWhatsAppLink(cont?.phone || '', `Bonjour ${cont?.full_name}, nous confirmons votre visite prévue ${dateStr} à ${timeStr}.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#25D366]/10 text-emerald-800 font-bold text-[11px] flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3 text-[#25D366]" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* AGENDA DÉTAILLÉ DU JOUR SÉLECTIONNÉ (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-warm-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#947346] block">
                  Agenda de la Journée
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {selectedDay} {monthNames[currentMonth]} {currentYear}
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  {selectedDayVisits.length > 0 
                    ? `${selectedDayVisits.length} visite(s) programmée(s) pour cette date.` 
                    : 'Aucun rendez-vous planifié pour cette journée.'}
                </p>
              </div>

              {selectedDayVisits.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 font-normal">
                    Sélectionnez un jour avec pastille sur le calendrier pour consulter les rendez-vous.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {selectedDayVisits.map((visit) => {
                    const prop = INITIAL_PROPERTIES.find((p) => p.id === visit.property_id);
                    const cont = INITIAL_CONTACTS.find((c) => c.id === visit.contact_id);
                    const dateObj = new Date(visit.scheduled_at);
                    const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={visit.id}
                        className="p-4 rounded-2xl bg-[#fbfaf7] border border-[#e8e4dc] space-y-3 hover:border-[#947346] transition-colors shadow-2xs"
                      >
                        {/* Top Time & Type */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                            <Clock className="w-4 h-4 text-[#947346]" />
                            <span className="text-sm">{formattedTime}</span>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            visit.status === 'scheduled' ? 'bg-[#fdf8f0] text-[#947346] border border-[#f5ebd7]' :
                            visit.status === 'completed' ? 'bg-[#f0f5f2] text-[#1d382b] border border-[#d2e3d8]' :
                            'bg-[#f5f2eb] text-[#7a736a]'
                          }`}>
                            {visit.status === 'scheduled' ? 'Confirmée' : visit.status === 'completed' ? 'Effectuée' : 'Annulée'}
                          </span>
                        </div>

                        {/* Property Title & Rent */}
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Réf. {prop?.reference} • {prop?.district}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                            {prop?.title}
                          </h4>
                          <div className="text-xs font-bold text-emerald-800 mt-1">
                            {prop ? formatFCFA(prop.price) : ''} <span className="text-[10px] font-normal text-slate-500">/ mois</span>
                          </div>
                        </div>

                        {/* Candidate Box */}
                        <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span className="truncate">{cont?.full_name}</span>
                            <a
                              href={getWhatsAppLink(cont?.phone || '', `Bonjour ${cont?.full_name}, nous confirmons notre visite locative prévue à ${formattedTime}.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1d382b] hover:text-[#947346] font-bold flex items-center gap-1 text-[11px]"
                            >
                              <MessageCircle className="w-3 h-3 text-[#25D366]" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate font-normal">
                            {cont?.profession || cont?.phone}
                          </div>
                        </div>

                        {/* Feedback note */}
                        {visit.feedback && (
                          <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 font-normal leading-relaxed line-clamp-2">
                            {visit.feedback}
                          </p>
                        )}

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-500 font-semibold truncate">
                            Agent : {visit.agent_name.split(' ')[0]}
                          </span>

                          <div className="flex gap-1.5">
                            {visit.status === 'scheduled' ? (
                              <button
                                onClick={() => updateStatus(visit.id, 'completed')}
                                className="px-2.5 py-1 rounded-lg bg-[#f0f5f2] border border-[#d2e3d8] text-[#1d382b] text-[10px] font-bold hover:bg-[#e4ece6] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Valider</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => updateStatus(visit.id, 'scheduled')}
                                className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                Reprogrammer
                              </button>
                            )}

                            <button
                              onClick={() => setActiveModalVisit(visit)}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                              title="Ouvrir la fiche complète"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VUE 2 : VUE LISTE CHRONOLOGIQUE DÉTAILLÉE (TABLEAU HAUTE LISIBILITÉ)   */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-warm-xs overflow-hidden space-y-4 p-5 sm:p-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Liste Chronologique des Visites Locatives
              </h2>
              <p className="text-xs text-slate-500">
                Vue tabulaire optimisée pour le suivi rapide des dossiers et l&apos;affectation des négociateurs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exporter Excel / CSV</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Imprimer</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-3">Date &amp; Heure</th>
                  <th className="py-3 px-3">Type &amp; Statut</th>
                  <th className="py-3 px-3">Résidence &amp; Loyer</th>
                  <th className="py-3 px-3">Candidat Locataire</th>
                  <th className="py-3 px-3">Négociateur</th>
                  <th className="py-3 px-3">Consignes Terrain</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.map((visit) => {
                  const prop = INITIAL_PROPERTIES.find((p) => p.id === visit.property_id);
                  const cont = INITIAL_CONTACTS.find((c) => c.id === visit.contact_id);
                  const dObj = new Date(visit.scheduled_at);
                  const dateStr = dObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                  const timeStr = dObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                  const isCorporate = cont?.profession?.toLowerCase().includes('directeur') || cont?.profession?.toLowerCase().includes('fond');
                  const isDiplomatic = cont?.profession?.toLowerCase().includes('diplomate') || cont?.full_name?.toLowerCase().includes('ambassade');

                  return (
                    <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Date & Heure */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-xs capitalize">{dateStr}</div>
                        <div className="text-[11px] font-bold text-[#947346] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{timeStr}</span>
                        </div>
                      </td>

                      {/* Type & Statut */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            visit.status === 'scheduled' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            visit.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {visit.status === 'scheduled' ? 'Confirmée' : 'Effectuée'}
                          </span>
                          <div>
                            {isDiplomatic && <span className="text-[10px] font-semibold text-blue-700 block">Diplomatique</span>}
                            {isCorporate && !isDiplomatic && <span className="text-[10px] font-semibold text-amber-800 block">Bail Corporate</span>}
                            {!isDiplomatic && !isCorporate && <span className="text-[10px] font-semibold text-slate-500 block">Visite Locative</span>}
                          </div>
                        </div>
                      </td>

                      {/* Résidence & Loyer */}
                      <td className="py-3.5 px-3 min-w-[200px]">
                        <div className="font-bold text-slate-900 line-clamp-1">{prop?.title}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Réf. {prop?.reference} • {prop?.district}
                        </div>
                        <div className="text-xs font-black text-emerald-800 mt-0.5">
                          {prop ? formatFCFA(prop.price) : ''} <span className="text-[10px] font-normal text-slate-500">/ mois</span>
                        </div>
                      </td>

                      {/* Candidat */}
                      <td className="py-3.5 px-3 min-w-[180px]">
                        <div className="font-bold text-slate-900">{cont?.full_name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{cont?.profession}</div>
                        <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                          Score : {cont?.qualification_score || 90}/100
                        </div>
                      </td>

                      {/* Négociateur */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-700">
                        {visit.agent_name}
                      </td>

                      {/* Consignes */}
                      <td className="py-3.5 px-3 max-w-[220px]">
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {visit.feedback || 'Aucune consigne spécifique.'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={getWhatsAppLink(cont?.phone || '', `Bonjour ${cont?.full_name}, nous confirmons notre visite locative prévue le ${dateStr} à ${timeStr}.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/10 text-emerald-800 hover:bg-[#25D366]/20 transition-colors"
                            title="Ouvrir WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          </a>

                          {visit.status === 'scheduled' ? (
                            <button
                              onClick={() => updateStatus(visit.id, 'completed')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                              title="Marquer comme effectuée"
                            >
                              Valider
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStatus(visit.id, 'scheduled')}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] transition-colors cursor-pointer"
                            >
                              Reprogrammer
                            </button>
                          )}

                          <button
                            onClick={() => setActiveModalVisit(visit)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            title="Voir la fiche complète"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VUE 3 : VUE CARTES GRID (Style Fiches Bento)                            */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVisits.map((visit) => {
            const prop = INITIAL_PROPERTIES.find((p) => p.id === visit.property_id);
            const cont = INITIAL_CONTACTS.find((c) => c.id === visit.contact_id);

            const dateObj = new Date(visit.scheduled_at);
            const formattedDate = dateObj.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
            const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const isCorporate = cont?.profession?.toLowerCase().includes('directeur') || cont?.profession?.toLowerCase().includes('fond');
            const isDiplomatic = cont?.profession?.toLowerCase().includes('diplomate') || cont?.full_name?.toLowerCase().includes('ambassade');

            return (
              <div
                key={visit.id}
                className="bg-white border border-[#e8e4dc] rounded-2xl p-4 shadow-warm-xs flex flex-col justify-between space-y-3 hover:border-[#947346] transition-colors"
              >
                <div className="space-y-2.5">
                  
                  {/* Header: Date & Status Badge */}
                  <div className="flex items-center justify-between border-b border-[#f0ede6] pb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#947346]">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="capitalize">{formattedDate} à {formattedTime}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      visit.status === 'scheduled' ? 'bg-[#fdf8f0] text-[#947346] border border-[#f5ebd7]' :
                      visit.status === 'completed' ? 'bg-[#f0f5f2] text-[#1d382b] border border-[#d2e3d8]' :
                      'bg-[#f5f2eb] text-[#7a736a]'
                    }`}>
                      {visit.status === 'scheduled' ? 'Confirmée' : visit.status === 'completed' ? 'Effectuée' : 'Annulée'}
                    </span>
                  </div>

                  {/* Visit Type Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isDiplomatic && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        Visite Diplomatique
                      </span>
                    )}
                    {isCorporate && !isDiplomatic && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-amber-700" />
                        Bail Corporate
                      </span>
                    )}
                    {!isDiplomatic && !isCorporate && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        Visite Locative
                      </span>
                    )}
                  </div>

                  {/* Property Details */}
                  <div>
                    <span className="text-[10px] text-[#7a736a] block">
                      Réf. {prop?.reference} • {prop?.district}
                    </span>
                    <h3 className="text-xs font-bold text-[#161412] leading-snug line-clamp-2 mt-0.5">
                      {prop?.title}
                    </h3>
                    <div className="text-xs font-sans font-bold text-emerald-800 mt-1">
                      {prop ? formatFCFA(prop.price) : ''} <span className="font-sans font-normal text-[11px] text-[#7a736a]">/ mois</span>
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="p-3 rounded-xl bg-[#fbfaf7] border border-[#e8e4dc] space-y-1 text-xs">
                    <div className="font-bold text-[#161412] flex items-center justify-between">
                      <span className="truncate">{cont?.full_name}</span>
                      <a
                        href={getWhatsAppLink(cont?.phone || '', `Bonjour ${cont?.full_name}, nous confirmons notre visite.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1d382b] hover:text-[#947346] font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <MessageCircle className="w-3 h-3 text-[#25D366]" />
                        <span>Rappeler</span>
                      </a>
                    </div>
                    <div className="text-[11px] text-[#7a736a] truncate font-normal">
                      {cont?.profession || cont?.phone}
                    </div>
                  </div>

                  {/* Instructions */}
                  {visit.feedback && (
                    <p className="text-[11px] text-[#68625c] bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-normal leading-relaxed line-clamp-3">
                      {visit.feedback}
                    </p>
                  )}

                </div>

                {/* Footer Actions */}
                <div className="pt-2.5 border-t border-[#f0ede6] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#7a736a]">
                    Agent : {visit.agent_name.split(' ')[0]}
                  </span>

                  <div className="flex gap-1.5">
                    {visit.status === 'scheduled' ? (
                      <button
                        onClick={() => updateStatus(visit.id, 'completed')}
                        className="px-2.5 py-1 rounded-md bg-[#f0f5f2] border border-[#d2e3d8] text-[#1d382b] text-[10px] font-bold hover:bg-[#e4ece6] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Effectuée</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(visit.id, 'scheduled')}
                        className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Reprogrammer
                      </button>
                    )}

                    <button
                      onClick={() => setActiveModalVisit(visit)}
                      className="p-1 rounded-md bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                      title="Détails"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. VUE 4 : VUE MAP ABIDJAN & TOURNÉE TERRAIN                               */}
      {/* ========================================================================= */}
      {viewMode === 'map' && (
        <div className="space-y-6">
          {/* CARTE OPENSTREETMAP / SATELLITE OFFICIELLE D'ABIDJAN */}
          <AbidjanOpenStreetMap 
            visits={visits} 
            properties={INITIAL_PROPERTIES} 
            onSelectVisit={(visit) => setActiveModalVisit(visit)} 
          />

          {/* FEUILLE DE ROUTE & VISITES GÉOLOCALISÉES AU PIED DE CARTE */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-warm-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#947346] block">
                  Tournée Terrain
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Feuille de Route &amp; Chronologie des Visites
                </h3>
                <p className="text-xs text-slate-500">
                  Toutes les visites ordonnées par heure et proximité géographique sur le Grand Abidjan.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 w-fit">
                {filteredVisits.length} rendez-vous programmés
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredVisits.map((visit, idx) => {
                const prop = INITIAL_PROPERTIES.find((p) => p.id === visit.property_id);
                const cont = INITIAL_CONTACTS.find((c) => c.id === visit.contact_id);
                const dObj = new Date(visit.scheduled_at);
                const formattedTime = dObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                const formattedDay = dObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

                return (
                  <div 
                    key={visit.id}
                    className="p-4 rounded-2xl bg-[#fbfaf7] border border-slate-200/90 space-y-2.5 hover:border-[#947346] hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="capitalize">{formattedDay} à {formattedTime}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {prop?.district}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{prop?.title}</h4>
                      <div className="text-[11px] text-slate-500">Candidat : <strong className="text-slate-800">{cont?.full_name}</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((prop?.address || '') + ', ' + (prop?.city || 'Abidjan'))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2E5BFF] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <Route className="w-3 h-3" />
                        <span>Itinéraire GPS</span>
                      </a>

                      <a
                        href={getWhatsAppLink(cont?.phone || '', `Bonjour ${cont?.full_name}, notre négociateur arrive dans 10 minutes pour la visite.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-md bg-[#25D366]/10 text-emerald-800 font-bold text-[10px] flex items-center gap-1 hover:bg-[#25D366]/20 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. VOLET D'INSPECTION & FICHE VISITE HAUTE FIDÉLITÉ (SLIDE-OVER PRO 360°) */}
      {/* ========================================================================= */}
      {activeModalVisit && (
        <div className="fixed inset-0 z-50 flex justify-end">
          
          {/* Backdrop avec flou glassmorphism */}
          <div 
            onClick={() => setActiveModalVisit(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Panneau Latéral Coulissant Plein Format (Slide-Over Pro) */}
          <div className="relative w-full max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden font-sans border-l border-slate-200/90 animate-in slide-in-from-right duration-300">
            
            {(() => {
              const prop = INITIAL_PROPERTIES.find((p) => p.id === activeModalVisit.property_id);
              const cont = INITIAL_CONTACTS.find((c) => c.id === activeModalVisit.contact_id);
              const dObj = new Date(activeModalVisit.scheduled_at);
              const dateStr = dObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
              const timeStr = dObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const isPastVisit = dObj < new Date('2026-11-08T00:00:00Z');
              const activeDayNumber = dObj.getDate();
              const visitsOnActiveDay = visitsByDay[activeDayNumber] || [activeModalVisit];

              return (
                <>
                  {/* TOP HERO : PHOTOGRAPHIE HAUTE DÉFINITION & STATUT */}
                  <div className="relative h-60 sm:h-72 w-full shrink-0 bg-slate-900 overflow-hidden">
                    {prop?.images[0] ? (
                      <Image 
                        src={prop.images[0]} 
                        alt={prop.title} 
                        fill 
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <Building2 className="w-12 h-12" />
                      </div>
                    )}

                    {/* Gradient Overlay pour contraste parfait */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/40 to-black/60" />

                    {/* Floating Top Actions */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FFD84D] text-[#15161A] shadow-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#15161A] animate-pulse" />
                          <span>{activeModalVisit.status === 'completed' ? 'VISITE EFFECTUÉE' : isPastVisit ? 'VISITE PASSÉE' : 'VISITE CONFIRMÉE'}</span>
                        </span>

                        <span className="px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-xs text-[11px] font-bold border border-white/20">
                          {activeModalVisit.visit_type === 'first' ? '1ère Découverte' : 'Contre-visite & Prise de Bail'}
                        </span>

                        <span className="px-3 py-1 rounded-full bg-black/60 text-white text-[11px] font-mono border border-white/20 flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-[#FFD84D]" />
                          <span>{visitsOnActiveDay.length} au calendrier</span>
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveModalVisit(null)}
                        className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
                        title="Fermer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Titre & Prix au bas de la photo */}
                    <div className="absolute bottom-4 left-5 right-5 z-10 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/80">
                        <span className="text-[#FFD84D]">{prop?.district}</span>
                        <span>•</span>
                        <span>Réf. {prop?.reference}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight line-clamp-2">
                        {prop?.title}
                      </h3>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-2xl sm:text-3xl font-black text-[#FFD84D]">
                          {prop ? formatFCFA(prop.price) : ''}
                        </span>
                        <span className="text-xs text-white/80 font-medium">/ mois (charges &amp; groupe inclus)</span>
                      </div>
                    </div>
                  </div>

                  {/* CORPS DÉROULANT (SECTIONS AUDIT & ACTIONS) */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAF9F6]">
                    
                    {/* 1. FICHE HORAIRE & LOCALISATION GPS RAPIDE */}
                    <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] shadow-warm-xs space-y-3">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-900">
                          <div className="flex items-center gap-1.5 bg-[#2E5BFF]/10 text-[#2E5BFF] px-2.5 py-1 rounded-lg">
                            <Calendar className="w-4 h-4 text-[#2E5BFF]" />
                            <span className="capitalize">{dateStr}</span>
                          </div>
                          <span className="text-slate-400">à</span>
                          <span className="px-2.5 py-1 rounded-lg bg-[#2E5BFF] text-white font-black">{timeStr}</span>

                          <span className="px-2.5 py-0.5 rounded-full bg-[#15161A] text-white text-[11px] font-bold shadow-2xs">
                            {visitsOnActiveDay.length} rdv ce jour
                          </span>
                        </div>

                        <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-[#947346]" />
                          <span>Négociateur : <strong className="text-slate-900">{activeModalVisit.agent_name}</strong></span>
                        </span>
                      </div>

                      {/* SÉLECTEUR RAPIDE ENTRE LES VISITES PROGRAMMÉES CE JOUR */}
                      {visitsOnActiveDay.length > 1 && (
                        <div className="p-3 bg-[#FFF9EA] rounded-xl border border-[#F0DCB0] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-950">
                              Programme du {activeDayNumber} {monthNames[currentMonth]} ({visitsOnActiveDay.length} visites) :
                            </span>
                            <span className="text-[11px] text-amber-800 font-semibold">Basculer :</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {visitsOnActiveDay.map((v) => {
                              const vTime = new Date(v.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                              const vCont = INITIAL_CONTACTS.find(c => c.id === v.contact_id);
                              const vProp = INITIAL_PROPERTIES.find(p => p.id === v.property_id);
                              const isCurrent = v.id === activeModalVisit.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setActiveModalVisit(v)}
                                  className={`p-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                                    isCurrent
                                      ? 'bg-[#15161A] text-white border-black shadow-xs'
                                      : 'bg-white hover:bg-amber-100/60 border-amber-200 text-amber-950'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`font-mono font-black text-[11px] flex items-center gap-1 ${isCurrent ? 'text-[#FFD84D]' : 'text-amber-900'}`}>
                                      <Clock className="w-3.5 h-3.5" />
                                      {vTime}
                                    </span>
                                    {isCurrent ? (
                                      <span className="text-[10px] font-bold text-[#FFD84D]">
                                        Actif
                                      </span>
                                    ) : null}
                                  </div>
                                  <span className={`font-bold text-[11px] block truncate mt-1 ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                                    {vCont?.full_name}
                                  </span>
                                  <span className={`text-[10px] block truncate ${isCurrent ? 'text-white/70' : 'text-slate-500'}`}>
                                    {vProp?.title}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-xs line-clamp-1">{prop?.address}, {prop?.city}</span>
                        </div>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((prop?.address || '') + ', ' + (prop?.city || 'Abidjan'))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] font-bold text-xs inline-flex items-center gap-1.5 transition-colors border border-[#BAE6FD]"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Démarrer GPS Waze / Maps</span>
                        </a>
                      </div>
                    </div>

                    {/* 2. PROFIL CANDIDAT LOCATAIRE & SOLVABILITÉ BANCAIRE */}
                    <div className="p-4 rounded-2xl bg-white border border-[#e8e4dc] shadow-warm-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>Dossier candidat locataire</span>
                        </span>

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Solvabilité auditée BOA
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#15161A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {cont?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">
                              {cont?.full_name}
                            </h4>
                            <span className="text-[11px] text-slate-500 block font-normal">
                              {cont?.profession}
                            </span>
                          </div>
                        </div>

                        <a
                          href={getWhatsAppLink(cont?.phone || '', `Bonjour ${cont?.full_name}, nous confirmons la visite de ${prop?.title} prévue le ${dateStr} à ${timeStr}.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Ouvrir WhatsApp ({cont?.phone})</span>
                        </a>
                      </div>

                      {/* Données financières */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-amber-200">
                          <span className="text-[10px] text-amber-800 font-bold uppercase block">Budget confirmé</span>
                          <span className="font-mono font-bold text-amber-950 text-xs">{formatFCFA(cont?.budget_max || 0)} / mois</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-emerald-200">
                          <span className="text-[10px] text-emerald-800 font-bold uppercase block">Garantie financière</span>
                          <span className="font-semibold text-emerald-950 text-xs truncate block">{cont?.financial_readiness}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. CARACTÉRISTIQUES DU BIEN */}
                    <div className="p-4 rounded-lg bg-white border border-neutral-200 space-y-3">
                      <span className="text-xs font-semibold text-neutral-900 block">
                        Spécifications de la résidence
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                          <span className="text-neutral-500 text-[11px] block">Surface</span>
                          <span className="text-neutral-900 font-mono font-semibold">{prop?.surface} m²</span>
                        </div>
                        <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                          <span className="text-neutral-500 text-[11px] block">Chambres</span>
                          <span className="text-neutral-900 font-mono font-semibold">{prop?.bedrooms} suites</span>
                        </div>
                        <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                          <span className="text-neutral-500 text-[11px] block">Titre foncier</span>
                          <span className="text-neutral-900 font-mono font-semibold">{prop?.legal_status}</span>
                        </div>
                        <div className="p-2 rounded bg-neutral-50 border border-neutral-200">
                          <span className="text-neutral-500 text-[11px] block">Énergie</span>
                          <span className="text-neutral-900 font-mono font-semibold">Groupe 40 kVA</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {prop?.has_pool && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                            Piscine privée
                          </span>
                        )}
                        {prop?.has_generator && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                            Inverseur automatique
                          </span>
                        )}
                        {prop?.has_security && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                            Gardiennage 24/7 &amp; Vidéo
                          </span>
                        )}
                        {prop?.has_parking && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                            Parking 3 véhicules
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4. CONSIGNES PARTICULIÈRES */}
                    {activeModalVisit.feedback && (
                      <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-800 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
                          <AlertCircle className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Consignes de visite &amp; prise de bail</span>
                        </div>
                        <p className="text-xs leading-relaxed text-neutral-700 font-normal">
                          {activeModalVisit.feedback}
                        </p>
                      </div>
                    )}

                    {/* 5. CHECKLIST ÉTAT DES LIEUX */}
                    <div className="p-4 rounded-lg bg-white border border-neutral-200 space-y-2.5">
                      <span className="text-xs font-semibold text-neutral-900 block">
                        Contrôle de conformité terrain
                      </span>
                      <div className="space-y-1.5 text-xs text-neutral-700">
                        <div className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                          <CheckCircle className="w-4 h-4 text-neutral-700 shrink-0" />
                          <span>Dossier juridique et agrément du fonds validés</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                          <span className="w-3.5 h-3.5 rounded-none border border-neutral-400 shrink-0" />
                          <span>Relevé contradictoire compteurs CIE &amp; SODECI</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
                          <span className="w-3.5 h-3.5 rounded-none border border-neutral-400 shrink-0" />
                          <span>Vérification inventaire mobilier &amp; électroménager</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* BOTTOM STICKY ACTION COCKPIT */}
                  <div className="p-4 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveModalVisit(null)}
                        className="px-3.5 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 font-medium text-xs transition-colors cursor-pointer"
                      >
                        Fermer
                      </button>

                      {prop && (
                        <a
                          href={`/biens/${prop.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Fiche Vitrine</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeModalVisit.status === 'scheduled' ? (
                        <button
                          onClick={() => updateStatus(activeModalVisit.id, 'completed')}
                          className="px-5 py-2.5 rounded-xl bg-[#0F5E3E] hover:bg-[#0c4b31] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform hover:-translate-y-0.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Valider la Visite</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus(activeModalVisit.id, 'scheduled')}
                          className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reprogrammer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

          </div>

        </div>
      )}

    </div>
  );
}
